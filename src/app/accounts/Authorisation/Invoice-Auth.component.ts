import { Component, OnInit, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';

/*  Invoice Authorisation - invoices waiting to be authorised for printing.

    Same two calls as before (Accounts/ACC_invoice_auth_list and
    Accounts/ACC_invoice_Authorisation_Update), so no database or API change. What changed
    is the screen around them:

      - a summary of the queue: how many, how much, how old
      - filters for the questions an authoriser actually asks (this client, this preparer,
        this supply type, stuck for more than a week)
      - selection that only ever covers rows the user can see, with the count and value
        stated before anything is authorised
      - the invoice opens in a drawer with Prev / Next and its own Authorise button, so a
        queue can be reviewed one invoice at a time without leaving the page

    The same file is used by Manilal and Links. Links' list procedure also returns SUPPLYTYPE
    and POS; where a procedure does not, those columns and filters simply do not appear.   */
@Component({
    templateUrl: 'Invoice-Auth.component.html',
    styleUrls: ['./Invoice-Auth.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class invoiceAuth implements OnInit {

    /*  The update proc takes the invoice numbers as one comma list. Its parameter size is not
        in source control, so large selections are sent in batches small enough to fit any
        sensible varchar rather than risk the tail of the list being silently cut off.       */
    private readonly BATCH = 100;

    rows: any[] = [];          // the whole queue, as returned
    view: any[] = [];          // after filters and sort
    loaded: boolean = false;
    loadError: string = '';
    loadedAt: Date = null;

    /* ---- filters ---- */
    searchString: string = '';
    fClient: string = null;
    fPreparer: string = '';
    fSupply: string = '';
    fAge: string = '';

    clientOptions: any[] = [];
    preparerOptions: any[] = [];
    supplyOptions: any[] = [];
    /*  "Over 7 days" includes "Over 30 days" on purpose: the first is the follow-up list, the
        second the escalation list, and each is one click.                                  */
    ageOptions: any[] = [
        { key: 'today', label: 'Today', count: 0 },
        { key: 'week', label: '1-7 days', count: 0 },
        { key: 'over7', label: 'Over 7 days', count: 0 },
        { key: 'over30', label: 'Over 30 days', count: 0 }
    ];

    hasSupply: boolean = false;
    hasPos: boolean = false;
    hasTransTypes: boolean = false;

    /* ---- queue summary (whole queue, not the filtered view) ---- */
    stat: any = { count: 0, amount: 0, clients: 0, today: 0, overWeek: 0, oldestAge: 0, oldestDate: '' };
    viewAmount: number = 0;

    /* ---- sort / paging ---- */
    order: string = 'client';
    reverse: boolean = false;
    PageActual: number = 1;
    pageSize: number = 25;
    pageSizes: number[] = [25, 50, 100];

    /* ---- selection ---- */
    selected: any = {};
    selCount: number = 0;
    selAmount: number = 0;
    selHidden: number = 0;

    /* ---- authorise ---- */
    confirmOpen: boolean = false;
    confirmGroups: any[] = [];
    busy: boolean = false;

    /* ---- drawer ---- */
    DrawerInvNo: string = '';

    constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService
    ) { }

    ngOnInit(): void {
        this.verifyPermission('342', 'View');
        this.getdataforauth();
    }

    verifyPermission(formId, userMode) {
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify(userMode, data);
            });
    }

    /* =========================================================================== load */

    getdataforauth() {
        const login = this._loginService.getLogin()[0];
        const jsonmaster = {
            cmpid: login.CMPID,
            cmp_code: login.CMPCODE,
            RoleType: (login.ROLETYPE == '') ? 'USER' : login.ROLETYPE,
            Type: 'II'
        };
        this.loaderService.display(true);
        this.loadError = '';
        this._dataService.getData('Accounts/ACC_invoice_auth_list', jsonmaster)
            .subscribe((data: any) => {
                this.loaderService.display(false);
                this.loaded = true;
                this.loadedAt = new Date();
                const table = (data && data.Table) ? data.Table : [];
                /*  The API returns its error table under the same name - a STATUS column
                    and no invoice number means the procedure failed, not an empty queue.  */
                if (table.length > 0 && table[0].INV_CRTNO === undefined && table[0].STATUSTEXT) {
                    this.loadError = String(table[0].STATUSTEXT);
                    this.setRows([]);
                    return;
                }
                this.setRows(table);
            }, () => {
                this.loaderService.display(false);
                this.loaded = true;
                this.loadError = 'The list could not be loaded. Check the connection and try again.';
            });
    }

    private setRows(table: any[]) {
        const today = this.dayStart(new Date());
        const clients = {}, preparers = {}, supplies = {}, trans = {};
        let amount = 0, oldest: any = null;

        this.hasSupply = false;
        this.hasPos = false;
        this.ageOptions.forEach(a => a.count = 0);

        const rows = [];
        for (let i = 0; i < table.length; i++) {
            const r = table[i];
            const no = String(r.INV_CRTNO == null ? '' : r.INV_CRTNO).trim();
            if (no == '') { continue; }

            const party = this.splitClient(r.CLIENTNAME);
            const prep = this.parseDateTime(r.INV_CRT_DAT);
            const age = prep ? Math.max(0, Math.round((today - this.dayStart(prep)) / 86400000)) : 0;
            const amt = Number(String(r.TOTAL_AMT == null ? '' : r.TOTAL_AMT).replace(/[^0-9.\-]/g, '')) || 0;

            r._no = no;
            r._client = party.name;
            r._gstin = party.gstin;
            r._invKey = this.dmyKey(r.INV_CRTDT);
            r._prepTs = prep ? prep.getTime() : 0;
            r._prepText = prep ? this.fmtDateTime(prep) : String(r.INV_CRT_DAT || '');
            r._age = age;
            r._amt = amt;
            r._by = String(r.CREATEDBY || '').trim();
            r._supply = String(r.SUPPLYTYPE == null ? '' : r.SUPPLYTYPE).trim();
            r._pos = String(r.POS == null ? '' : r.POS).trim();
            r._search = [no, r.INV_CRTDT, party.name, party.gstin, r._by, r._supply, r._pos, amt.toFixed(2)]
                .join(' ').toLowerCase();

            if (r.SUPPLYTYPE !== undefined) { this.hasSupply = true; }
            if (r.POS !== undefined) { this.hasPos = true; }

            this.bump(clients, party.name, amt);
            this.bump(preparers, r._by, amt);
            if (r._supply != '') { this.bump(supplies, r._supply, amt); }
            trans[String(r.TRNS_TYPE || '')] = true;
            this.ageOptions.forEach(a => { if (this.ageMatch(a.key, age)) { a.count++; } });

            amount += amt;
            if (!oldest || r._prepTs < oldest._prepTs) { oldest = r; }
            rows.push(r);
        }

        this.rows = rows;
        this.hasTransTypes = Object.keys(trans).length > 1;
        this.clientOptions = this.options(clients, true);
        this.preparerOptions = this.options(preparers, false);
        this.supplyOptions = this.options(supplies, false);

        this.stat = {
            count: rows.length,
            amount: amount,
            clients: this.clientOptions.length,
            today: this.ageOptions[0].count,
            overWeek: this.ageOptions[2].count,
            oldestAge: oldest ? oldest._age : 0,
            oldestDate: oldest ? oldest._prepText : ''
        };

        /*  A filter pointing at a value that has left the queue would show an empty list for
            no visible reason, so it is dropped. Selections of invoices no longer waiting go too. */
        if (this.fClient && !clients[this.fClient]) { this.fClient = null; }
        if (this.fPreparer && !preparers[this.fPreparer]) { this.fPreparer = ''; }
        if (this.fSupply && !supplies[this.fSupply]) { this.fSupply = ''; }
        const still = {};
        rows.forEach(r => { if (this.selected[r._no]) { still[r._no] = true; } });
        this.selected = still;

        this.applyFilters(false);
    }

    private bump(map: any, key: string, amt: number) {
        if (key == '') { return; }
        if (!map[key]) { map[key] = { count: 0, amount: 0 }; }
        map[key].count++;
        map[key].amount += amt;
    }

    private options(map: any, byName: boolean): any[] {
        const out = Object.keys(map).map(k => ({
            value: k, count: map[k].count, amount: map[k].amount,
            label: k + '  (' + map[k].count + ')'
        }));
        out.sort((a, b) => byName ? a.value.localeCompare(b.value) : (b.count - a.count || a.value.localeCompare(b.value)));
        return out;
    }

    /*  CLIENTNAME arrives as HTML: "BAJAJ AUTO LIMITED - <font color=green>27AADCB2923M1ZL</font>".
        The GSTIN is lifted into its own line; a client without one keeps the whole name.   */
    private splitClient(html: any): any {
        const text = String(html == null ? '' : html)
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/\s+/g, ' ')
            .trim();
        const m = text.match(/^(.*?)\s*-\s*([0-9]{2}[A-Z0-9]{13})$/i);
        return m ? { name: m[1].trim(), gstin: m[2].toUpperCase() } : { name: text, gstin: '' };
    }

    /*  "2026-08-04T14:08:13.89" - read by hand so it is always local time, whatever the
        browser thinks of a timestamp with no zone and a one-digit fraction.            */
    private parseDateTime(v: any): Date {
        const m = String(v == null ? '' : v).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
        if (!m) { return null; }
        return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    }

    /*  "01/09/2026" sorts as text by day, not by date - 01/09 came before 17/02. */
    private dmyKey(v: any): number {
        const m = String(v == null ? '' : v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        return m ? (+m[3]) * 10000 + (+m[2]) * 100 + (+m[1]) : 0;
    }

    private dayStart(d: Date): number {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }

    private fmtDateTime(d: Date): string {
        const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const p = (n: number) => (n < 10 ? '0' : '') + n;
        return p(d.getDate()) + ' ' + mon[d.getMonth()] + ' ' + d.getFullYear() + ', ' + p(d.getHours()) + ':' + p(d.getMinutes());
    }

    /* ======================================================================= filters */

    applyFilters(resetPage: boolean = true) {
        const q = String(this.searchString || '').trim().toLowerCase();
        const words = q == '' ? [] : q.split(/\s+/);

        const out = this.rows.filter(r => {
            if (this.fClient && r._client != this.fClient) { return false; }
            if (this.fPreparer && r._by != this.fPreparer) { return false; }
            if (this.fSupply && r._supply != this.fSupply) { return false; }
            if (this.fAge && !this.ageMatch(this.fAge, r._age)) { return false; }
            for (let i = 0; i < words.length; i++) {
                if (r._search.indexOf(words[i]) < 0) { return false; }
            }
            return true;
        });

        this.view = this.sortRows(out);
        this.viewAmount = 0;
        this.view.forEach(r => this.viewAmount += r._amt);

        if (resetPage) { this.PageActual = 1; }
        const pages = Math.max(1, Math.ceil(this.view.length / this.pageSize));
        if (this.PageActual > pages) { this.PageActual = pages; }

        this.refreshSelection();
    }

    private ageMatch(key: string, age: number): boolean {
        switch (key) {
            case 'today': return age == 0;
            case 'week': return age >= 1 && age <= 7;
            case 'over7': return age > 7;
            case 'over30': return age > 30;
            default: return true;
        }
    }

    setAge(key: string) {
        this.fAge = (this.fAge == key) ? '' : key;
        this.applyFilters();
    }

    filtersActive(): boolean {
        return !!(String(this.searchString || '').trim() || this.fClient || this.fPreparer || this.fSupply || this.fAge);
    }

    clearFilters() {
        this.searchString = '';
        this.fClient = null;
        this.fPreparer = '';
        this.fSupply = '';
        this.fAge = '';
        this.applyFilters();
    }

    /* ========================================================================== sort */

    setOrder(key: string) {
        if (this.order === key) {
            this.reverse = !this.reverse;
        } else {
            this.order = key;
            this.reverse = false;
        }
        this.view = this.sortRows(this.view);
    }

    private sortRows(list: any[]): any[] {
        const key = this.order;
        const dir = this.reverse ? -1 : 1;
        const val = (r: any): any => {
            switch (key) {
                case 'no': return r._no;
                case 'date': return r._invKey;
                case 'supply': return r._supply;
                case 'pos': return r._pos;
                case 'by': return r._by;
                case 'age': return -r._prepTs;   // oldest first on the first click
                case 'amt': return r._amt;
                default: return r._client;
            }
        };
        return list.slice().sort((a, b) => {
            const x = val(a), y = val(b);
            let c = (typeof x === 'number') ? (x - y) : String(x).localeCompare(String(y));
            if (c == 0) { c = a._no.localeCompare(b._no); }
            return c * dir;
        });
    }

    /* ===================================================================== paging */

    pageRows(): any[] {
        const start = (this.PageActual - 1) * this.pageSize;
        return this.view.slice(start, start + this.pageSize);
    }

    setPageSize(n: any) {
        this.pageSize = +n;
        this.PageActual = 1;
    }

    rangeText(): string {
        if (this.view.length == 0) { return '0'; }
        const start = (this.PageActual - 1) * this.pageSize + 1;
        const end = Math.min(this.view.length, start + this.pageSize - 1);
        return start + '-' + end;
    }

    /* ================================================================== selection */

    toggleRow(r: any) {
        if (this.selected[r._no]) { delete this.selected[r._no]; } else { this.selected[r._no] = true; }
        this.refreshSelection();
    }

    pageAllSelected(): boolean {
        const page = this.pageRows();
        return page.length > 0 && page.every(r => !!this.selected[r._no]);
    }

    pageSomeSelected(): boolean {
        const page = this.pageRows();
        return page.some(r => !!this.selected[r._no]) && !this.pageAllSelected();
    }

    /*  The header box covers the page the user is looking at - never rows on other pages or
        rows hidden by a filter. The old box ticked the entire queue, 270 invoices, from a
        page showing 25.                                                                    */
    togglePage() {
        const page = this.pageRows();
        const all = this.pageAllSelected();
        page.forEach(r => { if (all) { delete this.selected[r._no]; } else { this.selected[r._no] = true; } });
        this.refreshSelection();
    }

    viewAllSelected(): boolean {
        return this.view.length > 0 && this.view.every(r => !!this.selected[r._no]);
    }

    selectAllInView() {
        this.view.forEach(r => this.selected[r._no] = true);
        this.refreshSelection();
    }

    clearSelection() {
        this.selected = {};
        this.refreshSelection();
    }

    private refreshSelection() {
        const inView = {};
        this.view.forEach(r => inView[r._no] = true);
        let count = 0, amount = 0, hidden = 0;
        this.rows.forEach(r => {
            if (!this.selected[r._no]) { return; }
            count++;
            amount += r._amt;
            if (!inView[r._no]) { hidden++; }
        });
        this.selCount = count;
        this.selAmount = amount;
        this.selHidden = hidden;
    }

    /* ================================================================== authorise */

    openConfirm() {
        if (this.selCount == 0) {
            this._toasterService.toast('info', 'info', 'Select at least one invoice.');
            return;
        }
        const groups = {};
        this.rows.forEach(r => { if (this.selected[r._no]) { this.bump(groups, r._client || '(no client)', r._amt); } });
        this.confirmGroups = Object.keys(groups)
            .map(k => ({ name: k, count: groups[k].count, amount: groups[k].amount }))
            .sort((a, b) => b.amount - a.amount);
        this.confirmOpen = true;
    }

    closeConfirm() {
        if (!this.busy) { this.confirmOpen = false; }
    }

    confirmAuthorise() {
        const nos = this.rows.filter(r => this.selected[r._no]).map(r => r._no);
        /*  Selection is not cleared here: the reload drops every invoice that left the queue,
            so anything still ticked afterwards is exactly what did not get authorised.       */
        this.authorise(nos, (done: number, msg: string, failed: boolean) => {
            this.confirmOpen = false;
            this.report(done, nos.length, msg, failed);
            this.getdataforauth();
        });
    }

    /*  Sends the numbers in batches, one after another. Stops at the first failure and says
        how far it got - the list is then reloaded, so what is still waiting is what is shown. */
    private authorise(nos: string[], done: (count: number, msg: string, failed: boolean) => void) {
        if (this.busy || nos.length == 0) { return; }
        const login = this._loginService.getLogin()[0];
        this.busy = true;
        this.loaderService.display(true);

        let sent = 0;
        let lastMsg = '';
        const next = () => {
            if (sent >= nos.length) {
                this.busy = false;
                this.loaderService.display(false);
                done(sent, lastMsg, false);
                return;
            }
            const batch = nos.slice(sent, sent + this.BATCH);
            const body = {
                NOSTR: batch.join(','),
                CMPID: login.CMPID,
                cmp_code: login.CMPCODE,
                citycode: login.CITYCODE,
                CHKAuthorityFlag: '1'
            };
            this._dataService.Common('Accounts/ACC_invoice_Authorisation_Update', body)
                .subscribe((data: any) => {
                    const err = data && data.Table && data.Table.length > 0 && data.Table[0].STATUS == 101 && !data.Table1;
                    if (!data || err) {
                        this.busy = false;
                        this.loaderService.display(false);
                        done(sent, err ? String(data.Table[0].STATUSTEXT || '') : '', true);
                        return;
                    }
                    if (data.Table1 && data.Table1.length > 0 && data.Table1[0].STATUSMSG) {
                        lastMsg = String(data.Table1[0].STATUSMSG);
                    }
                    sent += batch.length;
                    next();
                }, () => {
                    this.busy = false;
                    this.loaderService.display(false);
                    done(sent, '', true);
                });
        };
        next();
    }

    private report(done: number, total: number, msg: string, failed: boolean) {
        if (!failed) {
            this._toasterService.toast('success', 'Authorised',
                msg != '' ? msg : (done + (done == 1 ? ' invoice' : ' invoices') + ' authorised for printing.'));
            return;
        }
        const head = done > 0 ? (done + ' of ' + total + ' authorised, then it stopped. ') : 'Nothing was authorised. ';
        this._toasterService.toast('error', 'Authorisation failed', head + (msg != '' ? msg : 'Please try again.'));
    }

    /* ===================================================================== drawer */

    invoiceviewdata(Invoiceno) {
        /*  Opens the invoice in a drawer over this list rather than a popup window, so an
            authoriser can check one invoice, close it and move to the next without losing the
            list or their place in it. "Open in window" inside the drawer still gives the
            detached copy for printing or a second screen.                                     */
        this.DrawerInvNo = String(Invoiceno || '').trim();
    }

    CloseDrawer() {
        this.DrawerInvNo = '';
    }

    drawerIndex(): number {
        for (let i = 0; i < this.view.length; i++) {
            if (this.view[i]._no == this.DrawerInvNo) { return i; }
        }
        return -1;
    }

    drawerRow(): any {
        const i = this.drawerIndex();
        return i >= 0 ? this.view[i] : null;
    }

    drawerStep(delta: number) {
        const i = this.drawerIndex();
        const j = i + delta;
        if (i < 0 || j < 0 || j >= this.view.length) { return; }
        this.DrawerInvNo = this.view[j]._no;
        /*  Keep the list behind the drawer on the page of the invoice being read, so closing
            the drawer lands where the reviewer is.                                         */
        this.PageActual = Math.floor(j / this.pageSize) + 1;
    }

    /*  Authorise the invoice being read, then move to the next one in the list. */
    authoriseFromDrawer() {
        const no = this.DrawerInvNo;
        if (no == '' || this.busy) { return; }
        const i = this.drawerIndex();

        this.authorise([no], (done: number, msg: string, failed: boolean) => {
            this.report(done, 1, msg != '' ? msg : 'Invoice ' + no + ' authorised for printing.', failed);
            if (failed) { return; }

            delete this.selected[no];
            this.rows = this.rows.filter(r => r._no != no);
            this.setRows(this.rows);

            if (this.view.length == 0) {
                this.CloseDrawer();
            } else {
                const j = Math.min(Math.max(i, 0), this.view.length - 1);
                this.DrawerInvNo = this.view[j]._no;
                this.PageActual = Math.floor(j / this.pageSize) + 1;
            }
        });
    }

    @HostListener('document:keydown', ['$event'])
    onKey(e: KeyboardEvent) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            if (this.confirmOpen) { this.closeConfirm(); return; }
            if (this.DrawerInvNo) { this.CloseDrawer(); }
            return;
        }
        /*  Alt + arrows step through the list while the drawer is open. Plain arrows are left
            alone - they scroll the invoice.                                                  */
        if (this.DrawerInvNo && e.altKey && !this.confirmOpen) {
            if (e.key === 'ArrowRight') { this.drawerStep(1); e.preventDefault(); }
            if (e.key === 'ArrowLeft') { this.drawerStep(-1); e.preventDefault(); }
        }
    }

    /* ==================================================================== display */

    money(n: number): string {
        return (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    rupees(n: number): string {
        return (Math.round(Number(n) || 0)).toLocaleString('en-IN');
    }

    ageText(r: any): string {
        return r._age == 0 ? 'Today' : r._age == 1 ? '1 day' : r._age + ' days';
    }

    loadedText(): string {
        if (!this.loadedAt) { return ''; }
        const p = (n: number) => (n < 10 ? '0' : '') + n;
        return 'as of ' + p(this.loadedAt.getHours()) + ':' + p(this.loadedAt.getMinutes());
    }

    trackNo(index: number, r: any) {
        return r._no;
    }
}
