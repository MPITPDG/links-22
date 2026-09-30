import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { DataService } from '../../shared/service/dataService';

/**
 * Reads the two Export APIs behind the Export home dashboard.
 *
 *   Export/EXPT_EXPORT_DASHBOARD_Board   (USP_EXPT_EXPORT_DASHBOARD_BOARD), called once for SEA
 *   and once for AIR so every count can be split by mode without a second query shape.
 *     Table   STATUS, STAGE_CODE, N       complete counts over the window - safe to sum
 *     Table1  newest PerColumn jobs per stage - a SAMPLE, never a total
 *     '103'   no jobs in the window (an empty board, not an error)
 *
 *   Export/EXPT_EXPORT_DASHBOARD_Vessel  (USP_EXPT_EXPORT_DASHBOARD), the branch vessel list.
 *     Table   STATUS, VSLDET, VSL_RTNO, PORT
 *     Optional: if it fails the vessel panel is empty and the rest of the page still shows.
 */
export interface BoardStageCount { stage: number; n: number; }

export interface BoardJob {
    EXPTNO: string;
    STAGE_CODE: number;
    MODE: string;            // 'sea' | 'air' as the page uses it (the proc returns EXPT_MODE lower-cased)
    CONSIGNEE: string;
    VSL_NAME: string;
    VSL_VOYNO: string;
    ETD: string;             // dd/MM/yyyy or ''
    SYSEXPT_DOCRECD: string;
    CANCELLED: number;
    HBLNO: string;
    BLNO: string;
    MAWB: string;
    HAWB: string;
    AGENT_CODE: string;      // EXPT_MASTER.AGENT - '' until the procedure has the agent (28-Sep-2026)
    AGENT: string;           // SUPPLIER_MASTER.SUP_NAME
    EXPORTER_CODE: string;   // EXPT_MASTER.EXPT_EXPORTER
    EXPORTER: string;        // EXP_MASTER.EXP_NAME - the shipper
}

/*  Table2 of the board (28-Sep-2026 on): complete job counts per agent and stage. */
export interface BoardAgentCount { code: string; name: string; stage: number; n: number; }

export interface BoardHalf { counts: BoardStageCount[]; jobs: BoardJob[]; agents: BoardAgentCount[]; hasAgents: boolean; }

export interface VesselRow { VSLDET: string; VSL_RTNO: string; PORT: string; }

export interface ExportHomeData { sea: BoardHalf; air: BoardHalf; vessels: VesselRow[]; }

@Injectable()
export class ExportHomeService {
    constructor(private _dataService: DataService) { }

    load(cmpCode: string, cityCode: string, days: number): Observable<ExportHomeData> {
        return forkJoin(
            this.board(cmpCode, cityCode, days, 'SEA'),
            this.board(cmpCode, cityCode, days, 'AIR'),
            this.vessels(cityCode)
        ).pipe(map(([sea, air, vessels]) => ({ sea: sea, air: air, vessels: vessels })));
    }

    private board(cmpCode: string, cityCode: string, days: number, mode: string): Observable<BoardHalf> {
        const json = { CmpCode: cmpCode, CityCode: cityCode, Days: days, Mode: mode, PerColumn: 50 };
        return this._dataService.getData('Export/EXPT_EXPORT_DASHBOARD_Board', json).pipe(
            map((data: any) => {
                const first = data && data.Table ? data.Table[0] : undefined;
                const status = first ? String(first.STATUS) : '';

                if (status === '103') { return { counts: [], jobs: [], agents: [], hasAgents: true }; }
                if (status !== '100') {
                    const text = first ? (first.STATUSTEXT || first.statustext) : '';
                    throw new Error(text || 'Could not load the export board.');
                }

                const counts: BoardStageCount[] = data.Table.map((r: any) => ({ stage: +r.STAGE_CODE, n: +r.N || 0 }));
                const jobs: BoardJob[] = (data.Table1 || []).map((r: any) => {
                    const j = Object.assign({}, r) as BoardJob;
                    j.STAGE_CODE = +r.STAGE_CODE;
                    j.CANCELLED = +r.CANCELLED || 0;
                    // The half we asked for decides the mode; EXPT_MODE itself is free text on old rows.
                    j.MODE = mode === 'AIR' ? 'air' : 'sea';
                    j.AGENT_CODE = String(r.AGENT_CODE || '').trim();
                    j.AGENT = String(r.AGENT || '').trim();
                    j.EXPORTER_CODE = String(r.EXPORTER_CODE || '').trim();
                    j.EXPORTER = String(r.EXPORTER || '').trim();
                    return j;
                });
                // Table2 arrives only once the procedure carries the agent; older procedure = no agents
                const hasAgents = !!data.Table2;
                const agents: BoardAgentCount[] = (data.Table2 || []).map((r: any) => ({
                    code: String(r.AGENT_CODE || '').trim(), name: String(r.AGENT || '').trim(), stage: +r.STAGE_CODE, n: +r.N || 0
                }));
                return { counts: counts, jobs: jobs, agents: agents, hasAgents: hasAgents };
            })
        );
    }

    private vessels(cityCode: string): Observable<VesselRow[]> {
        return this._dataService.getData('Export/EXPT_EXPORT_DASHBOARD_Vessel', { CityCode: cityCode }).pipe(
            map((data: any) => {
                const rows = data && data.Table ? data.Table : [];
                return (rows.length > 0 && String(rows[0].STATUS) === '100') ? rows as VesselRow[] : [];
            }),
            catchError(() => of([] as VesselRow[]))
        );
    }
}
