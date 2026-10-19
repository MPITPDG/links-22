import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { map } from 'rxjs/operators';

import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import {
  BoardView, BoardCard, BoardStage, BoardCountRow, BoardCardRow, BoardAgentRow,
  Cutoff, STAGES, STAGE_BY_CODE, CANCELLED_CODE, PREALERT_CODE, DOCUMENT_ISSUED_CODE,
} from './export-dashboard.model';

/** How long a cached view is trusted before it is treated as gone. */
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_PREFIX = 'exptDashboardCache3';   // 3: Links, prealert rung folded into document issued

interface CacheEntry { view: BoardView; ts: number; }

/** One row of the branch vessel list (Export/Export_Vessel_List, SEARCHMODE '0'). */
export interface VesselListRow {
  name: string;     // VSL_MASTER.VSL_NAME - the same field the board's job rows carry
  voy: string;      // VSL_MASTER.VSL_VOYNO
  port: string;     // VSL_PORTDTLS.PORT
  rtno: string;     // VSL_RTNO (rotation no.)
  etd: string;      // VSL_PORTDTLS.ETD, dd/MM/yyyy
}

/**
 * Reads the export dashboard sources (ported from MPERPNG-20).
 *
 * Export/EXPT_EXPORT_DASHBOARD_Board, backed by USP_EXPT_EXPORT_DASHBOARD_BOARD:
 *   Table   STATUS + per-stage counts. STATUS '100' = data, '103' = none.
 *           EXHAUSTIVE: one row per EXPT_NO is counted exactly once, at the
 *           furthest stage it has reached, so these are true totals.
 *   Table1  the newest jobs per stage - a SAMPLE, not a total. The procedure
 *           caps this at 50 rows per stage whatever PerColumn asks for.
 *   Table2  complete job counts per agent and stage.
 *
 * Mode is 'ALL' | 'SEA' | 'AIR' and the split is the procedure's own GROUP BY.
 * CityCode is the login's three-letter CITYCODE ('MUM', 'DEL'), not CITYCODE1.
 *
 * Export/Export_Vessel_List (USP_EXP_SHIPMENT_VESSEL_LIST, SEARCHMODE '0'):
 *   the vessels calling at the branch's ports. Its VSLNAME column is a long
 *   display label ("NAME - VOY ( RTNO ) ETD - PORT"), so the page maps the
 *   structured VSL_NAME / VSL_VOYNO columns instead: those are the same
 *   VSL_MASTER fields the board's job rows carry, so a job matches its vessel
 *   on name + ETD day without any text parsing.
 *
 * Live data only. There is no mock and no fallback: if a call fails the
 * screen says so rather than showing numbers that are not real.
 *
 * Stale-while-revalidate: the SHAPED board view is cached in sessionStorage,
 * keyed on company + city + days + mode, so switching branch never shows
 * another branch's numbers.
 */
@Injectable()
export class ExportDashboardService {
  constructor(
    private _dataService: DataService,
    private _loginService: LoginService,
  ) {}

  getBoard(days: number, mode: 'ALL' | 'SEA' | 'AIR'): Observable<BoardView> {
    const login = this._loginService.getLogin()?.[0];
    const cmpCode = login?.CMPCODE ?? '';
    const cityCode = login?.CITYCODE ?? '';
    const json = {
      CmpCode: cmpCode,
      CityCode: cityCode,
      Days: days,
      Mode: mode,
      PerColumn: 50,
    };

    const cacheKey = this.cacheKey(cmpCode, cityCode, days, mode);
    const cached = this.readCache(cacheKey);

    const network$ = this._dataService.getData('Export/EXPT_EXPORT_DASHBOARD_Board', json).pipe(
      map((data: any) => {
        const first = data?.Table?.[0];
        const status = first ? String(first.STATUS) : '';

        // '103' is the stored procedure's "no rows matched" path. That is an
        // empty result, not a failure - the screen shows an empty state.
        if (status === '103') {
          return { stages: [], cards: [], total: 0, cancelled: 0, sampled: false, empty: true, agents: [], hasAgents: true } as BoardView;
        }

        if (status !== '100') {
          // '101' is ErrorLog.Error's envelope; anything else is unexpected.
          throw new Error(first?.STATUSTEXT || first?.statusText || 'Could not load the export board.');
        }

        return this.shape(data.Table ?? [], data.Table1 ?? [], data.Table2);
      }),
    );

    if (!cached) {
      return new Observable<BoardView>(observer => {
        const sub = network$.subscribe({
          next: v => {
            this.writeCache(cacheKey, v);
            observer.next(v);
            observer.complete();
          },
          error: err => observer.error(err),
        });
        return () => sub.unsubscribe();
      });
    }

    // Cache hit: emit the stale view, then revalidate. On a network failure the
    // stale view is re-emitted before the error so nothing on screen blanks.
    return new Observable<BoardView>((observer: Observer<BoardView>) => {
      observer.next({ ...cached, stale: true });

      const sub = network$.subscribe({
        next: v => {
          this.writeCache(cacheKey, v);
          observer.next(v);
          observer.complete();
        },
        error: err => {
          observer.next({ ...cached, stale: true });
          observer.error(err);
        },
      });
      return () => sub.unsubscribe();
    });
  }

  /** The branch vessel list. STATUS other than 100 is an empty list, not an error. */
  getVessels(): Observable<VesselListRow[]> {
    const login = this._loginService.getLogin()?.[0];
    return this._dataService.Common('Export/Export_Vessel_List', {
      SEARCHMODE: '0', VSLNAME: '', VSL_VOY: '', CITYCODE: login?.CITYCODE ?? '',
    }).pipe(
      map((data: any) => {
        const status = data?.Table?.[0]?.STATUS;
        const rows: any[] = (String(status) === '100' && Array.isArray(data.Table1)) ? data.Table1 : [];
        const s = (v: any) => (v === null || v === undefined ? '' : String(v).trim());
        // The procedure selects ETD twice on most branches: VP.ETD (dd/MM/yyyy)
        // and a DATETIME also named ETD, which ADO.NET renames ETD1. ETD stays
        // the string; ETD1 is the fallback.
        return rows.map(r => ({
          name: s(r.VSL_NAME), voy: s(r.VSL_VOYNO), port: s(r.PORT), rtno: s(r.VSL_RTNO),
          etd: s(r.ETD) || s(r.ETD1),
        }));
      }),
    );
  }

  // ---- sessionStorage cache ----------------------------------------------

  private cacheKey(cmpCode: string, cityCode: string, days: number, mode: string): string {
    return `${CACHE_PREFIX}:${cmpCode}:${cityCode}:${days}:${mode}`;
  }

  private readCache(key: string): BoardView | null {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const entry = JSON.parse(raw) as CacheEntry;
      if (!entry || typeof entry.ts !== 'number') return null;
      if (Date.now() - entry.ts > CACHE_TTL_MS) {
        sessionStorage.removeItem(key);
        return null;
      }
      return this.reviveDates(entry.view);
    } catch {
      // Quota errors, private mode, or corrupt JSON: behave as no cache.
      return null;
    }
  }

  /** JSON.stringify flattens Date to an ISO string; rebuild the one Date the view holds. */
  private reviveDates(view: BoardView): BoardView {
    return {
      ...view,
      cards: (view.cards ?? []).map(c => ({
        ...c,
        etdDate: c.etdDate ? new Date(c.etdDate) : null,
      })),
    };
  }

  private writeCache(key: string, view: BoardView): void {
    try {
      const entry: CacheEntry = { view, ts: Date.now() };
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Quota exceeded or storage unavailable: silently skip caching.
    }
  }

  /** Prealert is not a step on Links: a row at that rung counts as document issued. */
  private stageOf(v: any): number {
    const code = Number(v);
    return code === PREALERT_CODE ? DOCUMENT_ISSUED_CODE : code;
  }

  /** Turn the result sets into what the screen renders. */
  private shape(counts: BoardCountRow[], rows: BoardCardRow[], agentRows?: BoardAgentRow[]): BoardView {
    const byCode = new Map<number, number>();
    for (const c of counts) {
      if (c.STAGE_CODE === null || c.STAGE_CODE === undefined) continue;
      const code = this.stageOf(c.STAGE_CODE);
      byCode.set(code, (byCode.get(code) ?? 0) + Number(c.N));
    }

    const stages: BoardStage[] = STAGES.map(s => ({ ...s, count: byCode.get(s.code) ?? 0 }));
    const total = Array.from(byCode.values()).reduce((a, b) => a + b, 0);

    const now = new Date();
    const cards: BoardCard[] = rows.map(r => {
      const code = this.stageOf(r.STAGE_CODE);
      const mode: 'sea' | 'air' = String(r.MODE ?? '').trim().toLowerCase() === 'air' ? 'air' : 'sea';
      const etdDate = this.parseDmy(r.ETD);
      const opened = r.SYSEXPT_DOCRECD ? new Date(r.SYSEXPT_DOCRECD) : null;
      const openedValid = opened && !isNaN(opened.getTime()) ? opened : null;

      return {
        exptno: String(r.EXPTNO ?? '').trim(),
        stageCode: code,
        stageLabel: code === CANCELLED_CODE ? 'Cancelled' : (STAGE_BY_CODE.get(code)?.label ?? ''),
        mode,
        consignee: String(r.CONSIGNEE ?? '').trim(),
        vessel: [String(r.VSL_NAME ?? '').trim(), String(r.VSL_VOYNO ?? '').trim()]
                  .filter(x => x !== '').join(' / '),
        etd: String(r.ETD ?? '').trim(),
        etdDate,
        ageDays: openedValid
          ? Math.max(0, Math.floor((now.getTime() - openedValid.getTime()) / 86_400_000))
          : null,
        cancelled: Number(r.CANCELLED) === 1,
        document: [r.HBLNO, r.BLNO, r.MAWB, r.HAWB]
                    .map(x => String(x ?? '').trim()).find(x => x !== '') ?? '',
        cutoff: this.cutoffFor(etdDate, mode, code, now),
        agent: String(r.AGENT ?? '').trim(),
        exporter: String(r.EXPORTER ?? '').trim(),
      };
    });

    const agents = (agentRows ?? []).map(a => ({
      code: String(a.AGENT_CODE ?? '').trim(), name: String(a.AGENT ?? '').trim(),
      stage: this.stageOf(a.STAGE_CODE), n: Number(a.N) || 0,
    }));

    return {
      stages, cards, total, cancelled: byCode.get(CANCELLED_CODE) ?? 0,
      sampled: cards.length < total, empty: total === 0, agents, hasAgents: !!agentRows,
    };
  }

  /**
   * Sailing risk. A job is at risk when its vessel sails before the stage that
   * must precede sailing is reached: containerised (4) for sea, document
   * issued (6) for air. ETD is a date with no time, so the sailing is treated
   * as end-of-day - a same-day ETD is not yet "passed".
   */
  private cutoffFor(etd: Date | null, mode: 'sea' | 'air', stageCode: number, now: Date): Cutoff {
    if (!etd || stageCode === CANCELLED_CODE) return 'none';
    const gate = mode === 'air' ? 6 : 4;
    if (stageCode >= gate) return 'none';
    const sail = new Date(etd.getFullYear(), etd.getMonth(), etd.getDate(), 23, 59, 59);
    const hours = (sail.getTime() - now.getTime()) / 3_600_000;
    if (hours < 0) return 'red';
    if (hours <= 48) return 'amber';
    return 'none';
  }

  /**
   * Strict dd/MM/yyyy. Round-trips the parts so 31/02/2026 is rejected rather
   * than silently rolling into March. Returns null for the junk this schema
   * carries (years like 5010, blank char(10) padding).
   */
  private parseDmy(v: any): Date | null {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(v ?? '').trim());
    if (!m) return null;
    const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
    const dt = new Date(y, mo - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? dt : null;
  }
}
