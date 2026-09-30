import { Component, Input, Output, EventEmitter, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';

/*  Invoice detail view, as a page.

    The same data as the Account-Invoice-View popup (one call to Accounts/ACC_invoice_view),
    laid out like the Finance dashboard rather than a browser popup window: a popup cannot be
    linked to, bookmarked, printed cleanly or opened behind a blocker, and it loses the
    navigation the rest of the application has.

    The popup component is untouched - Authorisation, UnAuthorisation, Credit Note and
    E-Invoice still use it. Only the Invoice module points here.                            */
@Component({
    selector: 'app-invoice-view-page',
    templateUrl: './invoice-view-page.component.html',
    styleUrls: ['./invoice-view-page.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class InvoiceViewPageComponent implements OnChanges {

    /*  Two ways in. Routed (/invoice/view/:invno) it is a full page. Given [invNoInput] it is
        the body of a drawer over the search results - the Finance dashboard pattern, so the
        list you came from is still there behind it.                                         */
    @Input() invNoInput: string = '';
    @Input() embedded: boolean = false;
    /*  The Authorisation screen hides the placeholder Approve button - it carries its own
        working Authorise in the drawer, and a disabled twin beside it only confuses.       */
    @Input() showApprove: boolean = true;
    @Output() closed = new EventEmitter<any>();

    /*  True when this is the popup window's copy - see window-pop-page.routing.ts. */
    inPopup: boolean = false;


    invNo: string = '';
    header: any = null;

    jobs: any = [];          // Table1
    charges: any = [];       // Table4  user charge lines
    totals: any = [];        // Table5  taxable / non-taxable / total
    enclosures: any = [];    // Table6
    despatch: any = [];      // Table7
    taxLines: any = [];      // Table9  computed GST + round off
    sacMap: any = {};        // 'chargecode|account' -> SAC code
    auth: any = null;        // real authorisation status from ACC_INVOICE

    loaded: boolean = false;
    errorText: string = '';

    /*  Charges open - that is what people come here to read. The rest folds so the whole
        invoice fits on a screen instead of five.                                          */
    open: any = { jobs: true, charges: true, tax: true, encl: false, desp: false, narr: false };

    constructor(public _dataService: DataService,
        public _loginService: LoginService,
        private loaderService: LoaderService,
        private _route: ActivatedRoute,
        private _router: Router) {

        /*  Routed inside the popup shell (no application chrome) rather than as a page in
            the app. That is what puts the old/new switch on screen.                        */
        this._route.data.subscribe((d: any) => { this.inPopup = (d && d.popup) ? true : false; });

        this._route.params.subscribe(params => {
            if (params['invno']) {
                this.invNo = String(params['invno']).trim();
                this.load();
            }
        });
    }

    ngOnChanges() {
        const wanted = String(this.invNoInput || '').trim();
        if (wanted != '' && wanted != this.invNo) {
            this.invNo = wanted;
            this.load();
        }
    }

    close() {
        this.closed.emit(true);
    }

    /*  The old print-authorisation layout for the same invoice, so the two can be compared
        while this one is still being agreed.                                              */
    showOld() {
        this._router.navigate(['/popup/Account-Invoice-View/' + this.invNo]);
    }

    /*  Detached window, for printing or a second screen. Deliberately the old popup route:
        it carries no application chrome, which is what you want on paper.                  */
    /*  One place that opens a popup route.

        The relative './#/...' form other screens use resolves against the current path, which
        under hash routing is not always what you expect - it is what produced an about:blank
        window here. This builds an absolute URL from the document base instead, and uses a
        window name with no spaces (a space makes the name invalid, so the browser can hand
        back a fresh blank window rather than the named one).                               */
    private popup(route: string, name: string, w: number, h: number) {
        const base = window.location.origin + window.location.pathname;
        const url = base + '#/popup/' + route;
        const top = Math.max(0, (screen.height / 2) - (h / 2));
        const left = Math.max(0, (screen.width / 2) - (w / 2));
        const features = 'resizable=yes,scrollbars=yes,status=no,width=' + w + ',height=' + h
                       + ',left=' + left + ',top=' + top;

        const win = window.open(url, name, features);
        if (!win) {
            alert('The pop-up was blocked by the browser. Allow pop-ups for this site and try again.');
            return;
        }
        /*  A window reused by name keeps its old document, so the location is set explicitly. */
        try { win.location.href = url; } catch (e) { /* cross-origin cannot happen here */ }
        win.focus();
    }

    openInWindow() {
        this.popup('Account-Invoice-View/' + this.invNo + '/', 'InvoiceView', 980, 640);
    }

    load() {
        if (this.invNo == '') {
            this.errorText = 'No Invoice number was supplied.';
            this.loaded = true;
            return false;
        }
        this.loaderService.display(true);
        this.errorText = '';

        const jsonmaster = {
            invoiceno: this.invNo,
            cmp_code: this._loginService.getLogin()[0].CMPCODE
        };

        this._dataService.getData('Accounts/ACC_invoice_view', jsonmaster)
            .subscribe((data: any) => {
                this.loaderService.display(false);
                this.loaded = true;

                if (!data || !data.Table || data.Table.length == 0 || data.Table[0].STATUS != '#100') {
                    this.errorText = 'Invoice ' + this.invNo + ' could not be read.';
                    return;
                }

                this.jobs = data.Table1 || [];
                this.header = (data.Table2 && data.Table2.length > 0) ? data.Table2[0] : null;
                this.charges = data.Table4 || [];
                this.totals = data.Table5 || [];
                this.enclosures = data.Table6 || [];
                this.despatch = data.Table7 || [];
                this.taxLines = data.Table9 || [];
                this.loadAudit();
            }, () => {
                /*  The popup had no error branch, so a failed call left the spinner up for
                    good. Here it says so and clears.                                       */
                this.loaderService.display(false);
                this.loaded = true;
                this.errorText = 'Could not read the Invoice. Please try again.';
            });
    }

    /*  ---- money -------------------------------------------------------------------
        Amounts arrive as varchar and are printed raw by the old view. An auditor comparing
        3850 against 38500 at a glance is exactly the error this screen exists to prevent,
        so everything is grouped and given two decimals.                                  */
    money(v: any): string {
        const raw = String(v === null || v === undefined ? '' : v);
        const n = Number(raw.replace(/[^0-9.\-]/g, ''));
        if (raw.trim() == '' || isNaN(n)) { return raw; }
        return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /*  ---- tax profile ---------------------------------------------------------------
        The proc hands GSTIN, state and place of supply back inside one HTML address block
        rather than as columns. Rather than make the auditor hunt for them in a paragraph
        they are lifted out into their own fields - and if the shape of that block ever
        changes, the patterns simply find nothing and the whole block is shown as before. */
    private addrText(): string {
        return String((this.header && this.header.BILLTO_INVADDR) || '')
               .replace(/<br[^>]*>/gi, '|')
               .replace(/<[^>]*>/g, '')
               .replace(/&nbsp;/gi, ' ');
    }

    private grab(re: RegExp): string {
        const m = this.addrText().match(re);
        return (m && m[1]) ? m[1].trim() : '';
    }

    gstin(): string     { return this.grab(/GSTIN\s*:\s*([^|]+?)\s*(?:STATE\s*:|$)/i); }
    posState(): string  { return this.grab(/PLACE OF SUPPLY\s*:\s*([^|]+)/i); }
    billFrom(): string  { return this.grab(/Billing From\s*:?\s*([^|]+)/i); }

    /*  The address itself, with the tax lines removed so they are not shown twice. */
    addressOnly(): string {
        const lines = this.addrText().split('|');
        const out = [];
        for (let i = 0; i < lines.length; i++) {
            const l = lines[i];
            if (/GSTIN\s*:/i.test(l)) { continue; }
            if (/PLACE OF SUPPLY/i.test(l)) { continue; }
            if (/Billing From/i.test(l)) { continue; }
            if (l.trim() != '') { out.push(l.trim()); }
        }
        return out.join(' ');
    }

    /*  True when none of the tax fields could be read - then the raw block is shown whole
        rather than silently dropping information.                                       */
    taxFieldsUnknown(): boolean {
        return this.gstin() == '' && this.posState() == '' && this.billFrom() == '';
    }

    /*  INV_TAXABLE is the tax CODE, not a taxable/non-taxable flag - STEP3 joins it to
        TBL_ACC_INV_STAX_RATE to pick the rate. Where every line carries the same code the
        column says nothing the Taxable / Non-tax split does not already say, so it is
        hidden and the code is stated once in the control strip. Where codes differ the
        lines are taxed differently and the column earns its place.                       */
    taxCodes(): string[] {
        const seen = [];
        for (let i = 0; i < this.charges.length; i++) {
            const c = String(this.charges[i].INV_TAXABLE || '').trim();
            if (c != '' && seen.indexOf(c) < 0) { seen.push(c); }
        }
        return seen;
    }

    mixedTax(): boolean {
        return this.taxCodes().length > 1;
    }

    /*  Authorisation status, from ACC_INVOICE.AuthorisedBy / AuthorisationDate - the columns
        the Authorisation and UnAuthorisation screens actually write. An invoice authorised and
        later withdrawn reports Unauthorised, not Pending: they are different situations and an
        auditor needs to tell them apart.                                                    */
    authStatus(): string {
        if (!this.auth) { return 'Pending'; }
        const st = String(this.auth.STATUS || '').toUpperCase();
        if (st == 'AUTHORISED') { return 'Authorised'; }
        if (st == 'UNAUTHORISED') { return 'Unauthorised'; }
        return 'Pending';
    }

    authComplete(): boolean {
        return this.authStatus() == 'Authorised';
    }

    authWithdrawn(): boolean {
        return this.authStatus() == 'Unauthorised';
    }

    /*  "by user 1885 on 14-08-2026" when known - a tooltip, not another header field. */
    authDetail(): string {
        if (!this.auth) { return 'No authorisation recorded yet'; }
        const by = String(this.auth.AUTHORISEDBY || '').trim();
        const on = String(this.auth.AUTHORISEDON || '').trim();
        if (by == '' && on == '') { return 'No authorisation recorded yet'; }
        return 'Authorised' + (by != '' ? ' by user ' + by : '') + (on != '' ? ' on ' + on : '');
    }

    /*  Consolidated totals across the jobs on this invoice. Summed from the rows shown so
        the footer cannot disagree with the table above it.                                */
    jobTotal(field: string): string {
        let t = 0;
        for (let i = 0; i < this.jobs.length; i++) {
            t += Number(String(this.jobs[i][field] || '').replace(/[^0-9.]/g, '')) || 0;
        }
        return t.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /*  Short job list for the "consolidated for" line in the charges header. */
    jobsShort(): string {
        const out = [];
        for (let i = 0; i < this.jobs.length; i++) {
            const n = String(this.jobs[i].inv_jobno || '').trim();
            out.push(n.length > 8 ? n.substr(0, 4) + '...' + n.substr(n.length - 4) : n);
        }
        return out.join(', ');
    }

    /*  SAC codes.

        The view procedure does not return them and is shared by five screens, so they come
        from USP_ACC_INVOICE_SAC_LIST instead and are matched to the charge lines on charge
        code + account. A failure here leaves the SAC blank and the screen otherwise intact -
        it must never stop the invoice being read.                                          */
    loadAudit() {
        this.sacMap = {};
        this.auth = null;
        this._dataService.getData('Accounts/ACC_INVOICE_AUDIT_INFO', { invoiceno: this.invNo })
            .subscribe((data: any) => {
                if (!data) { return; }
                if (data.Table) {
                    for (let i = 0; i < data.Table.length; i++) {
                        const r = data.Table[i];
                        const k = String(r.INV_CHRGCODE || '').trim() + '|' + String(r.INV_ACCOUNT || '').trim();
                        this.sacMap[k] = String(r.SACCODE || '').trim();
                    }
                }
                if (data.Table1 && data.Table1.length > 0) { this.auth = data.Table1[0]; }
            }, () => { /* no SAC or status shown; the rest of the screen is unaffected */ });
    }

    sac(c: any): string {
        const k = String(c.INV_CHRGCODE || '').trim() + '|' + String(c.INV_ACCOUNT || '').trim();
        const fromMaster = this.sacMap[k] || '';
        if (fromMaster != '') { return fromMaster; }

        /*  GENACCT_MASTER.SACCODE is empty for most accounts, but the account NAME carries
            the code in brackets - "[ 996759 ] ORIGIN THC - Income". Reading it from there
            beats showing "No SAC" against a line that plainly has one.                    */
        const m = this.plainAcct(c).match(/\[\s*(\d{4,8})\s*\]/);
        return m ? m[1] : '';
    }

    /*  ACCTNAME arrives as HTML for the old print page - "[ <font color=blue>996763</font> ]".
        Tags and entities are removed before anything is read from it.                     */
    private plainAcct(c: any): string {
        return String(c.ACCTNAME || '')
               .replace(/<[^>]*>/g, '')
               .replace(/&nbsp;/gi, ' ')
               .replace(/&amp;/gi, '&')
               .replace(/\s+/g, ' ')
               .trim();
    }

    /*  The account name with the bracketed SAC removed, since it is shown in its own column. */
    ledger(c: any): string {
        return this.plainAcct(c).replace(/\[\s*\d{4,8}\s*\]/, '').trim();
    }

    /*  An account with no SAC set produces a tax invoice line with no SAC on it. Worth
        saying out loud on an audit screen rather than showing an empty cell.            */
    missingSac(): boolean {
        for (let i = 0; i < this.charges.length; i++) {
            if (this.sac(this.charges[i]) == '') { return true; }
        }
        return false;
    }

    /*  Footer document tabs: enclosures / despatch. */
    docTab: string = 'enc';

    setDocTab(t: string) {
        this.docTab = t;
    }

    toggle(section: string) {
        this.open[section] = !this.open[section];
    }

    /*  Job switcher. The charge lines are not stored per job - ACC_INVCHARGE has no job
        column - so selecting a job changes the detail shown on the left, it does not filter
        the table. Saying "Showing all jobs" is the honest label for that.                  */
    selectedJob: number = 0;

    selectJob(i: number) {
        this.selectedJob = i;
    }

    job(): any {
        return (this.jobs.length > this.selectedJob) ? this.jobs[this.selectedJob] : null;
    }

    /*  A short job reference for the tab: the last four digits are what people say aloud. */
    jobTail(no: any): string {
        const s = String(no || '').trim();
        return (s.length > 4) ? '...' + s.substr(s.length - 4) : s;
    }

    /*  GST lines carry their component, rate and base in the description the proc builds -
        "GST CENTRAL @ 9.00 % ON 8758.00", "GST STATE @ 9.00 % ...", "GST INTEGRATED @ 18.00 %".
        An invoice can carry more than one rate (5% on ocean freight, 18% on the rest), so the
        lines are grouped by the rate the client actually pays: CGST 9 + SGST 9 is the 18% group,
        IGST 18 is also the 18% group. Each group keeps its own base and its components, exactly
        as the printed invoice lists them.                                                   */
    gstGroups(): any[] {
        const groups: any[] = [];
        for (let i = 0; i < this.taxLines.length; i++) {
            const d = String(this.taxLines[i].DESC1 || '').toUpperCase();
            if (d.indexOf('GST') < 0) { continue; }
            const name = d.indexOf('INTEGRATED') >= 0 ? 'IGST'
                       : (d.indexOf('UNION') >= 0 || d.indexOf('UT ') >= 0) ? 'UTGST'
                       : d.indexOf('CENTRAL') >= 0 ? 'CGST'
                       : d.indexOf('STATE') >= 0 ? 'SGST' : 'GST';
            const rm = d.match(/@\s*([0-9.]+)\s*%/);
            const bm = d.match(/ON\s*([0-9.,]+)/);
            const rate = rm ? Number(rm[1]) : 0;
            const base = bm ? Number(bm[1].replace(/,/g, '')) : 0;
            const amt = Number(String(this.taxLines[i].INV_INRAMT || '').replace(/[^0-9.\-]/g, '')) || 0;
            // what the client pays at this rate: an intra-state component is half of it
            const eff = (name == 'IGST' || name == 'GST') ? rate : rate * 2;
            let g = null;
            for (let j = 0; j < groups.length; j++) { if (groups[j].rate == eff) { g = groups[j]; } }
            // every component of a rate quotes the same base, so the group takes it once
            if (!g) { g = { rate: eff, base: base, amt: 0, parts: [] }; groups.push(g); }
            g.amt += amt;
            let p = null;
            for (let k = 0; k < g.parts.length; k++) { if (g.parts[k].name == name) { p = g.parts[k]; } }
            if (p) { p.amt += amt; } else { g.parts.push({ name: name, rate: rate, amt: amt }); }
        }
        groups.sort((x, y) => x.rate - y.rate);
        return groups;
    }

    /*  The card lists one line per component, as the print does:
            CGST 9% on 8,758.00 = 788.22
            SGST 9% on 8,758.00 = 788.22
        highest rate first, CGST before SGST within a rate.                                */
    gstLines(): any[] {
        const order = ['CGST', 'SGST', 'UTGST', 'IGST', 'GST'];
        const out: any[] = [];
        const groups = this.gstGroups().slice().sort((x, y) => y.rate - x.rate);
        for (let i = 0; i < groups.length; i++) {
            const parts = groups[i].parts.slice().sort((x, y) => order.indexOf(x.name) - order.indexOf(y.name));
            for (let j = 0; j < parts.length; j++) {
                out.push({ name: parts[j].name, rate: parts[j].rate, base: groups[i].base, amt: parts[j].amt });
            }
        }
        return out;
    }

    /*  Heading: one rate reads "GST @ 18%"; several read "GST @ 5% + 18%". */
    gstLabel(): string {
        const g = this.gstGroups();
        if (g.length == 0) { return 'GST'; }
        return 'GST @ ' + g.map(x => this.pct(x.rate) + '%').join(' + ');
    }

    pct(n: number): string {
        return (Math.round(n * 100) / 100).toString();
    }

    gstType(): string {
        for (let i = 0; i < this.taxLines.length; i++) {
            const d = String(this.taxLines[i].DESC1 || '').toUpperCase();
            if (d.indexOf('INTEGRATED') >= 0) { return 'Inter-State'; }
            if (d.indexOf('CENTRAL') >= 0 || d.indexOf('STATE') >= 0) { return 'Intra-State'; }
        }
        return '';
    }

    gstAmount(): string {
        let t = 0;
        for (let i = 0; i < this.taxLines.length; i++) {
            t += Number(String(this.taxLines[i].INV_INRAMT || '').replace(/[^0-9.\-]/g, '')) || 0;
        }
        return t.toFixed(2);
    }

    /*  Non-taxable is almost always zero on these invoices, so it does not earn a column.
        It is shown as a footer note on the rare invoice that has one.                    */
    hasNonTaxable(): boolean {
        for (let i = 0; i < this.charges.length; i++) {
            if (Number(this.charges[i].NONTAXABLEAMT_INR) > 0) { return true; }
        }
        return false;
    }

    /*  "1,100.00 INR @ 1" in one cell instead of three columns of mostly-repeated values. */
    unitPrice(c: any): string {
        const rate = (c.INV_RATE === null || c.INV_RATE === undefined) ? '' : String(c.INV_RATE);
        const cur = String(c.INV_CURRENCYNAME || '').trim();
        const ex = String(c.INV_EXRATE || '').trim();
        let out = rate;
        if (cur != '') { out += ' ' + cur; }
        if (ex != '' && ex != '1' && ex != '1.00') { out += ' @ ' + ex; }
        return out;
    }

    /*  Table5 carries the figures the invoice was saved with, so they are read back rather
        than recomputed - a view that disagrees with the document is worse than no view.    */
    total(field: string): string {
        return (this.totals.length > 0) ? this.totals[0][field] : '';
    }

    backToSearch() {
        this._router.navigate(['/accounts/transaction/invoice/invoicesearch']);
    }

    /*  Route name is 'Account-Invoice-print' with a lower-case p - Angular routes are
        case-sensitive, and the capitalised form silently opened an empty window.        */
    printInvoice() {
        this.popup('Account-Invoice-print/' + this.invNo + '/', 'InvoicePrint', 900, 620);
    }

    jobProfit(jobno) {
        const no = String(jobno || '').trim();
        if (no == '') { return; }
        this.popup('Account-Job-Profit-Report/' + no + '/', 'JobProfitReport', 900, 620);
    }
}
