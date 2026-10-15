import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { DataService } from '../../shared/service/dataService';
import { MissingDocsFilter, MissingDocsRow, MissingDocsSummaryRow, MissingDocsView } from './missing-docs.model';

/**
 * Reads Export/EXP_RPT_MISSING_DOCS (ported from MPERPNG-20).
 *
 *   Table   summary row. STATUS '100' = data, '103' = none, '101' = error.
 *   Table1  the bookings themselves.
 *
 * Links: fails soft. Until the endpoint is deployed on the Links API (or when
 * it answers without a Table / with an error envelope) the view comes back
 * empty with `unavailable` set and a short note, never a thrown error.
 */
@Injectable()
export class MissingDocsService {
  constructor(private _dataService: DataService) {}

  private emptyView(note: string): MissingDocsView {
    return { total: 0, docsNotReceived: 0, docNotSent: 0, over7Days: 0, rows: [], empty: true, unavailable: !!note, note };
  }

  getMissingDocs(filter: MissingDocsFilter): Observable<MissingDocsView> {
    const json = {
      ConCode: filter.ConCode || '',
      Country: filter.Country || '',
      Mode: filter.Mode || '',
      CityCode: filter.CityCode || '',
      GraceDays: filter.GraceDays,
    };

    return this._dataService.getData('Export/EXP_RPT_MISSING_DOCS', json).pipe(
      map((data: any) => {
        const first: MissingDocsSummaryRow = data && data.Table ? data.Table[0] : undefined;
        if (!first) {
          return this.emptyView('The missing documents report is not available on this server yet.');
        }
        const status = String(first.STATUS);

        // '103' is the stored procedure's "no rows matched" path: an empty result.
        if (status === '103') {
          return this.emptyView('');
        }

        if (status !== '100') {
          // '101' is ErrorLog.Error's envelope; anything else is unexpected.
          return this.emptyView(first.STATUSTEXT || first.statustext || 'Could not load the missing documents report.');
        }

        const rows: MissingDocsRow[] = ((data && data.Table1) || []).map((r: any) => ({
          ...r,
          DAYS_SINCE_CRD: Number(r.DAYS_SINCE_CRD) || 0,
        }));

        return {
          total: Number(first.TOTAL) || 0,
          docsNotReceived: Number(first.DOCS_NOT_RECEIVED) || 0,
          docNotSent: Number(first.DOC_NOT_SENT) || 0,
          over7Days: Number(first.OVER_7_DAYS) || 0,
          rows,
          empty: rows.length === 0,
          unavailable: false,
          note: '',
        } as MissingDocsView;
      }),
      // 404 before the backend is deployed, or any transport error: empty, not a throw.
      catchError(() => of(this.emptyView('The missing documents report is not available on this server yet.'))),
    );
  }
}
