/**
 * Response shape for Export/EXPT_EXPORT_DASHBOARD_Board (ported from MPERPNG-20).
 *
 * Mirrors the ADO.NET convention every other endpoint uses: the stored
 * procedure emits result sets which Newtonsoft serialises as Table / Table1 / Table2.
 *
 *   Table   - STATUS (+ STATUSTEXT on the error/empty paths) carried on every
 *             row alongside STAGE_CODE + N  (complete GROUP BY counts)
 *   Table1  - the newest jobs per stage (a SAMPLE, not a total; the procedure
 *             caps it at 50 rows per stage whatever @PerColumn asks for)
 *   Table2  - complete job counts per agent and stage
 *
 * The Table / Table1 distinction matters and is load-bearing: counts are
 * exhaustive and safe to sum, cards are not. Anything derived from cards is a
 * floor and must be labelled as such on screen.
 */

/**
 * Air export is switched off on Links. LinksDB20 is sea-only: 2,683 jobs in the
 * last 180 days and not one air job (the last was in March 2023). With this
 * false the dashboard skips the Mode=AIR board call and hides every Air
 * control, legend and column. Set it back to true if Links starts air exports;
 * the AIR half of the page is still wired.
 */
export const AIR_ENABLED = false;

export interface BoardStatusRow { STATUS: string | number; STATUSTEXT?: string; }

/** Table - complete per-stage counts. */
export interface BoardCountRow { STAGE_CODE: number; N: number; }

/** Table1 - per-stage sample of jobs. */
export interface BoardCardRow {
  EXPTNO: string;
  STAGE_CODE: number;
  MODE: string;              // 'sea' | 'air' | ''
  CONSIGNEE: string;
  VSL_NAME: string;
  VSL_VOYNO: string;
  ETD: string;               // dd/MM/yyyy as stored
  SYSEXPT_DOCRECD: string;   // ISO datetime
  CANCELLED: number;         // 1 | 0
  HBLNO: string; BLNO: string; MAWB: string; HAWB: string;
  AGENT_CODE?: string;       // EXPT_MASTER.AGENT
  AGENT?: string;            // SUPPLIER_MASTER.SUP_NAME
  EXPORTER?: string;         // EXP_MASTER.EXP_NAME - the shipper
}

/** Table2 - complete job counts per agent and stage. */
export interface BoardAgentRow { AGENT_CODE: string; AGENT: string; STAGE_CODE: number; N: number; }

/** A shaped Table2 row. */
export interface BoardAgentCount { code: string; name: string; stage: number; n: number; }

/** A rung on the export stage ladder. */
export interface BoardStage {
  key: string;
  label: string;
  code: number;
  seaOnly: boolean;
  /** why a job counts as having reached this stage - shown as a tooltip */
  because: string;
  count: number;
}

export type Cutoff = 'none' | 'amber' | 'red';

/** A job as the dashboard renders it, after derivation. */
export interface BoardCard {
  exptno: string;
  stageCode: number;
  stageLabel: string;
  mode: 'sea' | 'air';
  consignee: string;
  vessel: string;
  etd: string;
  etdDate: Date | null;
  ageDays: number | null;
  cancelled: boolean;
  document: string;
  cutoff: Cutoff;
  agent: string;
  exporter: string;
}

export interface BoardView {
  stages: BoardStage[];
  cards: BoardCard[];
  total: number;
  /** complete count of cancelled jobs in the window (stage 99, not in stages[]) */
  cancelled?: number;
  /** true when cards[] is a per-stage sample rather than the full set */
  sampled: boolean;
  /** the query succeeded but matched nothing - an empty state, not an error */
  empty: boolean;
  /** complete per-agent, per-stage counts (Table2); empty on the older procedure */
  agents?: BoardAgentCount[];
  /** false while the procedure is the older one without Table2 */
  hasAgents?: boolean;
  /**
   * true when this view was served from the stale-while-revalidate cache and
   * has not yet been confirmed fresh by a landed network call. Set by the
   * service, never by the stored procedure.
   */
  stale?: boolean;
}

export const CANCELLED_CODE = 99;

/**
 * The procedure's prealert rung (PREALERTDT set). Links has never set
 * PREALERTDT, and the prealert step was removed from the Links dashboard by
 * user decision, so the service counts any row at this code at
 * DOCUMENT_ISSUED_CODE instead (the totals stay exhaustive).
 */
export const PREALERT_CODE = 7;
export const DOCUMENT_ISSUED_CODE = 6;

/**
 * The stage ladder, ported from erp_new's lib/export/stages.ts.
 * Order is precedence order: a job's stage is the LAST rung it has reached,
 * not the first it has missed, so a job that skipped a step still reports the
 * furthest milestone actually recorded against it.
 */
export const STAGES: Omit<BoardStage, 'count'>[] = [
  { key: 'opened',          label: 'Job opened',            code: 0, seaOnly: false, because: 'an EXPT_MASTER row exists for this job' },
  { key: 'shipping-bill',   label: 'Shipping bill',         code: 1, seaOnly: false, because: 'EXPT_SHIPBILLNO is filled in' },
  { key: 'cargo-received',  label: 'Cargo received',        code: 2, seaOnly: false, because: 'at least one EXPT_CARGORECPT line exists' },
  { key: 'carted',          label: 'Carted',                code: 3, seaOnly: false, because: 'an EXPT_CARTING row exists (sea) or CARTEDDT is set (air)' },
  { key: 'containerised',   label: 'Containerised',         code: 4, seaOnly: true,  because: 'an EXPT_CONTAINER1 line links this job to a container' },
  { key: 'out-of-charge',   label: 'Out of charge',         code: 5, seaOnly: false, because: 'OUTCHARGEDT is set' },
  { key: 'document-issued', label: 'Document issued',       code: 6, seaOnly: false, because: 'an FCR/HBL, master BL, MAWB or HAWB number is recorded' },
  // Stage 7 'Prealert prepared' (PREALERTDT) is intentionally omitted on Links:
  // removed by user decision, and PREALERTDT has never been set in LinksDB20.
  // Stage 8 'Destination docs sent' (DOCSENTDT) is omitted as in MP: no job
  // opened in years has it.
];

export const STAGE_BY_CODE = new Map(STAGES.map(s => [s.code, s]));
