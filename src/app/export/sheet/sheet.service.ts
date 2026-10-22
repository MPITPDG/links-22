import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';

/**
 * Export › Sheet view: the Links API calls of docs/SHEET_VIEW_CONTRACT.md section 5 (api/Export/Sheet/*).
 * Every body carries the caller's company, branch and user from the login, exactly as the contract says;
 * responses are the procedures' DataSets (Table, Table1, ...), returned as they come.
 */

/** Form rights of the page (tbl_mst_form, added by EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql). */
export const SHEET_FORM_VIEW = 448;
export const SHEET_FORM_CONVERT = 449;
export const SHEET_FORM_SETTINGS = 450;

export interface SheetIdentity { CmpCode: string; CityCode: string; UserId: string; UserName: string; }
export interface SheetResult { ok: boolean; status: string; text: string; ds: any; }
export interface CellEdit { RowId: number; RowVer: number; Key: string; Value: string; }
/** Key: a column key, '*ROW' (row status / row colours, WO rows only) or a column letter (grid rows). Omitted = unchanged, '' clears. */
export interface FmtEdit { RowId: number; Key: string; Bg?: string; Fg?: string; Bold?: boolean; Status?: string; }

@Injectable({ providedIn: 'root' })
export class SheetService {
    private _data = inject(DataService);
    private _login = inject(LoginService);

    identity(): SheetIdentity {
        const l = (this._login.getLogin() || [])[0] || {};
        return {
            CmpCode: String(l.CMPCODE ?? '').trim(),
            CityCode: String(l.CITYCODE ?? '').trim(),
            UserId: String(l.CMPID ?? '').trim(),
            UserName: String(l.FULLNAME ?? l.CMP_USERNAME ?? '').trim()
        };
    }

    isSa(): boolean {
        const l = (this._login.getLogin() || [])[0] || {};
        return String(l.ROLETYPE ?? '') === 'SA';
    }

    /** One call. A transport failure or an error envelope comes back as ok:false with the server's text. */
    call(name: string, body: any = {}): Observable<SheetResult> {
        const payload = Object.assign({}, this.identity(), body);
        return this._data.Common<any>('Export/Sheet/' + name, payload).pipe(
            map((ds: any) => this.result(ds)),
            catchError(() => of({ ok: false, status: '000', text: 'The server could not be reached. Your last change is kept on this page; try again.', ds: null }))
        );
    }

    private result(ds: any): SheetResult {
        const r = ds && Array.isArray(ds.Table) && ds.Table.length ? ds.Table[0] : null;
        // Read procedures return data rows in Table (no STATUS column); write procedures return a STATUS row first.
        const status = r && r.STATUS != null ? String(r.STATUS) : (ds ? '100' : '000');
        const text = r ? String(r.STATUSTEXT ?? r.MSG ?? '') : '';
        return { ok: status === '100', status, text, ds };
    }

    rows(ds: any, table = 'Table'): any[] { return ds && Array.isArray(ds[table]) ? ds[table] : []; }

    // ---- months -------------------------------------------------------------------------------
    months() { return this.call('Months'); }
    monthSave(m: { Id: number; SheetMonth: string; Title: string; Tabs: string; RowVer: number; CopyFromId: number; CarryRows: boolean }) { return this.call('MonthSave', m); }

    // ---- WO tabs ------------------------------------------------------------------------------
    load(monthId: number, tabCode: string) { return this.call('Load', { MonthId: monthId, TabCode: tabCode }); }
    changes(monthId: number, tabCode: string, since: string) { return this.call('Changes', { MonthId: monthId, TabCode: tabCode, Since: since }); }
    saveCells(monthId: number, tabCode: string, edits: CellEdit[]) { return this.call('SaveCells', { MonthId: monthId, TabCode: tabCode, Edits: edits }); }
    saveFormat(monthId: number, tabCode: string, edits: FmtEdit[]) { return this.call('SaveFormat', { MonthId: monthId, TabCode: tabCode, Edits: edits }); }
    rowsOp(monthId: number, tabCode: string, op: string, ids: number[], afterId: number, count: number) {
        return this.call('Rows', { MonthId: monthId, TabCode: tabCode, Op: op, RowIds: ids, AfterId: afterId, Count: count });
    }

    // ---- jobs ---------------------------------------------------------------------------------
    link(rowIds: number[], exptno: string) { return this.call('Link', { RowIds: rowIds, ExptNo: exptno }); }
    unlink(rowIds: number[]) { return this.call('Unlink', { RowIds: rowIds }); }
    convertDraft(rowIds: number[]) { return this.call('ConvertDraft', { RowIds: rowIds }); }
    convertDone(rowIds: number[], exptno: string) { return this.call('ConvertDone', { RowIds: rowIds, ExptNo: exptno }); }

    // ---- history ------------------------------------------------------------------------------
    history(rowKind: 'W' | 'G' | 'M', rowId: number) { return this.call('History', { RowKind: rowKind, RowId: rowId }); }
    restoreValue(logId: number) { return this.call('RestoreValue', { LogId: logId }); }

    // ---- settings -----------------------------------------------------------------------------
    legend() { return this.call('Legend'); }
    legendSave(s: { Code: string; Label: string; Meaning: string; Bg: string; Fg: string; Sort: number; Active: boolean }) { return this.call('LegendSave', s); }
    roles() { return this.call('Roles'); }
    roleSave(roleCode: string, colKeys: string[], userIds: string[]) { return this.call('RoleSave', { RoleCode: roleCode, ColKeys: colKeys, UserIds: userIds }); }
    myRoles() { return this.call('MyRoles'); }
    alias() { return this.call('Alias'); }
    aliasSave(a: { Kind: string; SheetValue: string; LinksCode: string; LinksText: string; Confirmed: boolean }) { return this.call('AliasSave', a); }
    aliasSeed() { return this.call('AliasSeed'); }

    // ---- personal views -----------------------------------------------------------------------
    views(tabCode: string) { return this.call('Views', { TabCode: tabCode }); }
    viewSave(v: { Id: number; MonthId: number | null; TabCode: string; Name: string; Kind: 'layout' | 'filter'; Data: string }) { return this.call('ViewSave', v); }
    viewDelete(id: number) { return this.call('ViewDelete', { Id: id }); }

    // ---- grid / free-form tabs ----------------------------------------------------------------
    gridLoad(monthId: number, tabCode: string) { return this.call('GridLoad', { MonthId: monthId, TabCode: tabCode }); }
    /** Grid tabs: the API merges each row's {column: value} edits into its DATA JSON and saves row by row. */
    gridSave(monthId: number, tabCode: string, edits: CellEdit[]) { return this.call('GridSave', { MonthId: monthId, TabCode: tabCode, Edits: edits }); }
    gridRows(monthId: number, tabCode: string, op: string, ids: number[], afterId: number, count: number) {
        return this.call('GridRows', { MonthId: monthId, TabCode: tabCode, Op: op, RowIds: ids, AfterId: afterId, Count: count });
    }
    /** Grid / free tabs: rows changed after Since (deleted ones included), Table1 the TABMETA when it changed, Table2 AS_OF. */
    gridChanges(monthId: number, tabCode: string, since: string) { return this.call('GridChanges', { MonthId: monthId, TabCode: tabCode, Since: since }); }
    /** Grid / free tabs: cell colours and bold (Key = column letter); does not bump ROWVER. */
    gridSaveFormat(monthId: number, tabCode: string, edits: FmtEdit[]) { return this.call('GridSaveFormat', { MonthId: monthId, TabCode: tabCode, Edits: edits }); }
    tabMetaSave(monthId: number, tabCode: string, meta: string, rowVer: number) { return this.call('TabMetaSave', { MonthId: monthId, TabCode: tabCode, Meta: meta, RowVer: rowVer }); }

    kpi(monthId: number) { return this.call('Kpi', { MonthId: monthId }); }
}
