import { Component, ChangeDetectionStrategy, Input, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { SheetService } from '../sheet.service';
import { DataService } from '../../../shared/service/dataService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { SHEET_COLUMNS, SheetColDef } from '../sheet-registry';

/**
 * Sheet view settings: the workbook's "Colour CODE" and "Column Access" tabs plus the alias list Convert to job uses.
 * Shown as those two tabs (read-only without the settings right, form 450) and as the Settings panel.
 * `section` limits it to one part ('legend' | 'access' | 'alias'); empty shows all three.
 */
interface LegendRow { CODE: string; LABEL: string; MEANING: string; BG: string; FG: string; SORT: number; ACTIVE: boolean; dirty?: boolean; isNew?: boolean; }
interface RoleRow { code: string; label: string; cols: Set<string>; users: string[]; open?: boolean; dirty?: boolean; }
interface AliasRow { KIND: string; SHEET_VALUE: string; LINKS_CODE: string; LINKS_TEXT: string; SOURCE: string; CONFIRMED: boolean; dirty?: boolean; isNew?: boolean; }
interface Pick { code: string; text: string; }

export const ALIAS_KINDS: { code: string; label: string; picker: 'consignee' | 'agent' | 'city' | 'text' }[] = [
    { code: 'CONSIGNEE', label: 'Consignee', picker: 'consignee' }, { code: 'AGENT', label: 'Agent', picker: 'agent' },
    { code: 'SLINE', label: 'Shipping line (vessel agent)', picker: 'text' }, { code: 'PORT', label: 'Port of discharge', picker: 'city' },
    { code: 'COUNTRY', label: 'Destination country', picker: 'city' }, { code: 'CLEARANCE', label: 'Clearance point (loading port)', picker: 'city' },
    { code: 'POLGATE', label: 'POL gate (terminal)', picker: 'text' }, { code: 'VESSEL', label: 'Vessel', picker: 'text' }
];

@Component({
    selector: 'app-sheet-settings',
    templateUrl: './sheet-settings.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SheetSettingsComponent implements OnInit {
    private _api = inject(SheetService);
    private _data = inject(DataService);
    private _toast = inject(ToastCommonService);

    @Input() canEdit = false;
    @Input() section: '' | 'legend' | 'access' | 'alias' = '';

    readonly columns: SheetColDef[] = SHEET_COLUMNS;
    readonly kinds = ALIAS_KINDS;
    legend: LegendRow[] = [];
    roles: RoleRow[] = [];
    aliases: AliasRow[] = [];
    users: Pick[] = [];
    consignees: Pick[] = [];
    agents: Pick[] = [];
    cities: Pick[] = [];
    aliasKind = '';
    aliasFilter = '';
    loading = false;
    busy = false;
    /** what could not be loaded (the API / tables may not be deployed yet) */
    error = '';
    /** ROLES Table2 USER_NAME per role user, when the Links user list does not have the code */
    private roleUserNames = new Map<string, string>();

    show(part: string): boolean { return !this.section || this.section === part; }

    ngOnInit() { this.reload(); }

    reload() {
        this.loading = true;
        const calls: any = {};
        if (this.show('legend')) { calls.legend = this._api.legend(); }
        if (this.show('access')) { calls.roles = this._api.roles(); }
        if (this.show('alias')) { calls.alias = this._api.alias(); }
        forkJoin(calls).subscribe((r: any) => {
            this.loading = false;
            const failed = Object.keys(r).filter(k => !r[k].ok).map(k => (k === 'legend' ? 'Colour CODE' : k === 'roles' ? 'Column Access' : 'aliases') + (r[k].text ? ' (' + r[k].text + ')' : ''));
            this.error = failed.length ? 'Could not load ' + failed.join(', ') + '.' : '';
            if (r.legend && r.legend.ok) {
                this.legend = this._api.rows(r.legend.ds).map((x: any) => ({ CODE: s(x.CODE), LABEL: s(x.LABEL), MEANING: s(x.MEANING), BG: s(x.BG),
                    FG: s(x.FG), SORT: +x.SORT || 0, ACTIVE: x.ACTIVE === true || x.ACTIVE === 1 || x.ACTIVE === '1' }));
            }
            if (r.roles && r.roles.ok) {
                const cols = this._api.rows(r.roles.ds, 'Table1'), users = this._api.rows(r.roles.ds, 'Table2');
                users.forEach((u: any) => { if (s(u.USER_NAME)) { this.roleUserNames.set(s(u.USER_ID), s(u.USER_NAME)); } });
                this.roles = this._api.rows(r.roles.ds).map((x: any) => ({
                    code: s(x.CODE), label: s(x.LABEL),
                    cols: new Set<string>(cols.filter((c: any) => s(c.ROLE_CODE) === s(x.CODE)).map((c: any) => s(c.COL_KEY))),
                    users: users.filter((u: any) => s(u.ROLE_CODE) === s(x.CODE)).map((u: any) => s(u.USER_ID))
                }));
                if (!this.users.length) { this.loadUsers(); }
            }
            if (r.alias && r.alias.ok) {
                this.aliases = this._api.rows(r.alias.ds).map((x: any) => ({ KIND: s(x.KIND), SHEET_VALUE: s(x.SHEET_VALUE), LINKS_CODE: s(x.LINKS_CODE),
                    LINKS_TEXT: s(x.LINKS_TEXT), SOURCE: s(x.SOURCE) || 'auto', CONFIRMED: x.CONFIRMED === true || x.CONFIRMED === 1 || x.CONFIRMED === '1' }));
                if (!this.consignees.length) { this.loadPickers(); }
            }
        }, () => { this.loading = false; });
    }

    // ---- lookups (the same lists the consignment form uses) -------------------------------------
    private loadUsers() {
        this._data.getAll('Admin/Fill_UserPopulate').subscribe((d: any) => {
            this.users = (d?.Table || []).map((u: any) => ({ code: s(u.CMP_USERCODE), text: (s(u.FULLNAME) || s(u.CMP_USERNAME)) + ' (' + s(u.CMP_USERNAME) + ')' }));
        }, () => { this.users = []; });
    }
    private loadPickers() {
        const id = this._api.identity();
        this._data.Common<any>('Export/GetExportConsignment', { citycode: id.CityCode, cmpcode: id.CmpCode }).subscribe((d: any) => {
            const p = (t: any[]) => (t || []).map((x: any) => ({ code: s(x.VALUEFIELD), text: s(x.TEXTFIELD) }));
            this.agents = p(d?.Table1); this.consignees = p(d?.Table2);
        }, () => { });
        this._data.getData('Common/getCityList', {}).subscribe((d: any) => {
            this.cities = (d?.Table || []).map((x: any) => ({ code: s(x.CITY_CODE ?? x.VALUEFIELD), text: s(x.CITY_NAME ?? x.TEXTFIELD) + (x.CITY_COUNTRY ? ', ' + s(x.CITY_COUNTRY) : '') }));
        }, () => { });
    }
    userName(code: string): string { const u = this.users.find(x => x.code === code); return u ? u.text : (this.roleUserNames.get(code) || code); }
    pickerFor(kind: string): Pick[] {
        const k = this.kinds.find(x => x.code === kind);
        return !k ? [] : k.picker === 'consignee' ? this.consignees : k.picker === 'agent' ? this.agents : k.picker === 'city' ? this.cities : [];
    }
    kindLabel(kind: string): string { const k = this.kinds.find(x => x.code === kind); return k ? k.label : kind; }

    // ---- Colour CODE -----------------------------------------------------------------------------
    addStatus() { this.legend = [...this.legend, { CODE: '', LABEL: '', MEANING: '', BG: '#ffffff', FG: '', SORT: this.legend.length + 1, ACTIVE: true, dirty: true, isNew: true }]; }
    saveStatus(l: LegendRow) {
        l.CODE = s(l.CODE).toUpperCase().replace(/[^A-Z0-9_]/g, '_');
        if (!l.CODE || !s(l.LABEL)) { this._toast.toast('warning', 'Colour CODE', 'A status needs a code and a name.'); return; }
        this.busy = true;
        this._api.legendSave({ Code: l.CODE, Label: s(l.LABEL), Meaning: s(l.MEANING), Bg: s(l.BG), Fg: s(l.FG), Sort: +l.SORT || 0, Active: !!l.ACTIVE }).subscribe(r => {
            this.busy = false;
            if (r.ok) { l.dirty = false; l.isNew = false; this._toast.toast('success', 'Colour CODE', 'Saved ' + l.LABEL + '.'); }
            else { this._toast.toast('error', 'Colour CODE', r.text || 'Not saved.'); }
        });
    }

    // ---- Column Access ---------------------------------------------------------------------------
    toggleCol(r: RoleRow, key: string) { if (r.cols.has(key)) { r.cols.delete(key); } else { r.cols.add(key); } r.dirty = true; }
    addUser(r: RoleRow, code: string) { if (code && r.users.indexOf(code) < 0) { r.users = [...r.users, code]; r.dirty = true; } }
    removeUser(r: RoleRow, code: string) { r.users = r.users.filter(u => u !== code); r.dirty = true; }
    roleCols(r: RoleRow): string[] { return this.columns.filter(c => r.cols.has(c.key)).map(c => c.header); }
    saveRole(r: RoleRow) {
        this.busy = true;
        this._api.roleSave(r.code, Array.from(r.cols), r.users).subscribe(x => {
            this.busy = false;
            if (x.ok) { r.dirty = false; this._toast.toast('success', 'Column Access', 'Saved ' + r.label + '.'); }
            else { this._toast.toast('error', 'Column Access', x.text || 'Not saved.'); }
        });
    }

    // ---- aliases ---------------------------------------------------------------------------------
    get shownAliases(): AliasRow[] {
        const f = s(this.aliasFilter).toUpperCase();
        return this.aliases.filter(a => (!this.aliasKind || a.KIND === this.aliasKind)
            && (!f || a.SHEET_VALUE.toUpperCase().indexOf(f) >= 0 || a.LINKS_TEXT.toUpperCase().indexOf(f) >= 0));
    }
    addAlias() { this.aliases = [{ KIND: this.aliasKind || 'CONSIGNEE', SHEET_VALUE: '', LINKS_CODE: '', LINKS_TEXT: '', SOURCE: 'admin', CONFIRMED: true, dirty: true, isNew: true }, ...this.aliases]; }
    pickAlias(a: AliasRow, code: string) {
        const p = this.pickerFor(a.KIND).find(x => x.code === code);
        a.LINKS_CODE = code; a.LINKS_TEXT = p ? p.text : a.LINKS_TEXT; a.dirty = true;
    }
    saveAlias(a: AliasRow) {
        if (!s(a.SHEET_VALUE) || !s(a.LINKS_CODE)) { this._toast.toast('warning', 'Aliases', 'An alias needs the sheet value and the Links code.'); return; }
        this.busy = true;
        this._api.aliasSave({ Kind: a.KIND, SheetValue: s(a.SHEET_VALUE), LinksCode: s(a.LINKS_CODE), LinksText: s(a.LINKS_TEXT), Confirmed: !!a.CONFIRMED }).subscribe(r => {
            this.busy = false;
            if (r.ok) { a.dirty = false; a.isNew = false; a.SOURCE = 'admin'; }
            else { this._toast.toast('error', 'Aliases', r.text || 'Not saved.'); }
        });
    }
    seedAliases() {
        this.busy = true;
        this._api.aliasSeed().subscribe(r => {
            this.busy = false;
            if (r.ok) { this._toast.toast('success', 'Aliases', 'Learned from the rows already linked to jobs.'); this.reload(); }
            else { this._toast.toast('error', 'Aliases', r.text || 'Could not learn aliases.'); }
        });
    }
}

function s(v: any): string { return String(v ?? '').trim(); }
