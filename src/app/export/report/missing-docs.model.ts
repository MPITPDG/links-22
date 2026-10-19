/**
 * Response shape for Export/EXP_RPT_MISSING_DOCS.
 *
 * Same ADO.NET convention as every other endpoint: two result sets which
 * Newtonsoft serialises as Table / Table1.
 *
 *   Table   - one summary row. STATUS '100' carries the counts, '103' means
 *             no booking matched (an empty state, not an error), '101' is
 *             ErrorLog.Error's envelope with STATUSTEXT.
 *   Table1  - the bookings past CRD + GraceDays whose shipping documents or
 *             DOC file have not followed.
 */

export interface MissingDocsSummaryRow {
  STATUS: string | number;
  STATUSTEXT?: string;
  statustext?: string;
  TOTAL?: number;
  DOCS_NOT_RECEIVED?: number;
  DOC_NOT_SENT?: number;
  OVER_7_DAYS?: number;
}

export type MissingDocStatus = 'DOCS NOT RECEIVED' | 'DOC FILE NOT SENT';

/** Table1 - one booking waiting for documents. */
export interface MissingDocsRow {
  CLIENT_CODE: string;
  CLIENT: string;
  ORDERNO: string;
  STYLENO: string;
  BOOKING_REF: string;
  ORIGIN_CITY: string;
  ORIGIN_COUNTRY: string;
  MODE: string;              // 'AIR' | 'SEA'
  BRANCH: string;
  SHIPPER: string;
  AGENT: string;
  ANNOUNCED_CRD: string;     // dd/mm/yyyy as stored
  REVISED_CRD: string;       // dd/mm/yyyy as stored
  DAYS_SINCE_CRD: number;
  LAST_C1_SENT: string;
  JOBNO: string;
  DOC_STATUS: MissingDocStatus;
}

export interface MissingDocsFilter {
  ConCode: string;
  Country: string;
  Mode: 'AIR' | 'SEA' | '';
  CityCode: string;
  GraceDays: number;
}

export interface MissingDocsView {
  total: number;
  docsNotReceived: number;
  docNotSent: number;
  over7Days: number;
  rows: MissingDocsRow[];
  /** the query succeeded but matched nothing - an empty state, not an error */
  empty: boolean;
  /** Links: the endpoint is not deployed yet or answered with an error envelope */
  unavailable?: boolean;
  /** Links: short reason shown in the empty table row when unavailable */
  note?: string;
}
