import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';

/*  Convert a Proforma Invoice into a Tax Invoice.

    A full page rather than a dialog, matching Export > View Consignment. Conversion is not
    undoable - it consumes a number off the statutory invoice series and locks the proforma for
    good - so it deserves a page you can read properly, not a box over the top of a grid.

    The invoice number is deliberately NOT shown before you confirm. It is allocated at commit;
    previewing one would promise a number another branch may take first.                        */
@Component({
    selector: 'app-proforma-convert',
    templateUrl: './proforma-convert.component.html',
    styleUrls: ['./proforma-convert.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProformaConvertComponent {

    profNo: string = '';
    header: any = null;
    jobs: any = [];
    charges: any = [];
    rates: any = [];
    taxLines: any = [];      // computed GST / round-off rows already on the proforma
    sacLines: any = [];      // taxable value and tax grouped by SAC code

    invDate: string = '';
    payDt: string = '';
    clientRef: string = '';

    /*  Set once the user types in Due Date. After that the credit-period calculation stops
        overwriting it - their explicit choice beats the client master's default.            */
    dueDateTouched: boolean = false;

    /*  The page carries five tables and the user only needs one of them to decide. Charges is
        open because that is what they are approving; the tax breakdowns stay folded until
        asked for, so the whole decision fits on one screen instead of five scrolls.

        The rate check opens itself when a rate has actually moved - see loadPreview().      */
    open: any = { charges: true, gst: false, sac: false, rates: false };

    loaded: boolean = false;
    converting: boolean = false;
    errorText: string = '';

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private route: ActivatedRoute,
        private _router: Router) {

        this.route.params.subscribe(params => {
            this.profNo = (params['profno']) ? String(params['profno']).trim() : '';
            this.invDate = this.todayDMY();
            this.loadPreview();
        });
    }

    private todayDMY(): string {
        let d = new Date();
        let dd = ('0' + d.getDate()).slice(-2);
        let mm = ('0' + (d.getMonth() + 1)).slice(-2);
        return dd + '/' + mm + '/' + d.getFullYear();
    }

    loadPreview() {
        if (this.profNo == '') {
            this.errorText = 'No Proforma Invoice number was supplied.';
            this.loaded = true;
            return false;
        }
        this.loaderService.display(true);
        this.errorText = '';

        const jsonmaster = {
            PROF_NO: this.profNo,
            INV_DATE: this.invDate
        };

        this._dataService.Common('Accounts/ACC_PROFORMA_CONVERT_PREVIEW', jsonmaster)
            .subscribe((data: any) => {
                this.loaderService.display(false);
                this.loaded = true;

                if (!data || !data.Table || data.Table.length == 0) {
                    this.errorText = 'Proforma Invoice ' + this.profNo + ' could not be read.';
                    return;
                }
                this.header = data.Table[0];
                this.jobs = data.Table1 || [];
                this.charges = data.Table2 || [];
                this.rates = data.Table3 || [];
                this.taxLines = data.Table4 || [];
                this.sacLines = data.Table5 || [];

                if (this.header.STATUS != '100') {
                    this.errorText = this.header.STATUSTEXT;
                }
                this.open.rates = this.rateChanged();
                this.loadDueDate();
            }, () => {
                this.loaderService.display(false);
                this.loaded = true;
                this.errorText = 'Could not read the Proforma Invoice. Please try again.';
            });
    }

    /*  Due date from the client's credit period.

        Calls ACC_PROFORMA_PAYBYDATE_GET - the same endpoint, and the same underlying
        USP_ACC_INV_PAYBYDATE_GET, that the invoice and proforma entry screens use. The rules
        for ISPAYBYDT_AIR / ISPAYBYDT_SEA and the credit periods are not reimplemented here;
        the preview only hands over the client's values and this asks for the answer.

        Re-run whenever the Invoice Date changes, since the due date is derived from it.       */
    loadDueDate() {
        if (!this.header || this.dueDateTouched) { return false; }

        const jsonmaster = {
            clientcode: this.header.INV_CLIENT,
            invdt: this.invDate,
            mode: this.header.JOBMODE,
            ISPAYBYDT_AIR: this.header.ISPAYBYDT_AIR,
            ISPAYBYDT_SEA: this.header.ISPAYBYDT_SEA,
            CREDITPERIOD_SEA: this.header.CREDITPERIOD_SEA,
            CREDITPERIOD_AIR: this.header.CREDITPERIOD_AIR,
            HAWBDT: this.header.INV_HAWBDT || ''
        };

        this._dataService.getData('Accounts/ACC_PROFORMA_PAYBYDATE_GET', jsonmaster)
            .subscribe((data: any) => {
                if (data && data.Table && data.Table.length > 0 && data.Table[0].PAYBYDATE) {
                    this.payDt = this._dataService.datechnge(data.Table[0].PAYBYDATE);
                } else {
                    this.payDt = this.defaultDueDate();
                }
            }, () => {
                /*  A client with no credit terms set is normal, and so is this call failing on
                    one. Fall back to the standard terms rather than blocking the conversion. */
                this.payDt = this.defaultDueDate();
            });
    }

    /*  Fallback when the client master carries no credit period: SEA gets 30 days, AIR is due
        on the invoice date. Applies to both export and import. Anything the user types wins,
        and this only ever fills a field that would otherwise be blank.                       */
    private defaultDueDate(): string {
        const base = this.parseDMY(this.invDate);
        if (!base) { return ''; }
        const mode = String((this.header && this.header.JOBMODE) || '').toUpperCase();
        if (mode == 'SEA') { base.setDate(base.getDate() + 30); }
        return ('0' + base.getDate()).slice(-2) + '/'
             + ('0' + (base.getMonth() + 1)).slice(-2) + '/'
             + base.getFullYear();
    }

    /*  dd/mm/yyyy only - the one format this screen's date control produces. Built field by
        field because new Date('05/09/2026') would read it as 5 September in some browsers and
        9 May in others.                                                                      */
    private parseDMY(v: string): Date {
        const p = String(v || '').split('/');
        if (p.length != 3) { return null; }
        const d = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
        return isNaN(d.getTime()) ? null : d;
    }

    toggle(section: string) {
        this.open[section] = !this.open[section];
    }

    /*  Invoice total as the sum of what is shown above it, not a separate figure from the
        server - a headline that can disagree with its own tables is worse than no headline. */
    taxableTotal(): number {
        return this.chargeTotal('INV_INRAMT');
    }

    grandTotal(): number {
        return this.taxableTotal() + this.totalTax();
    }

    /*  True when a tax code used on this proforma sits on a different rate today than it did on
        the proforma date. Tax is recomputed against the INVOICE date, so this is the difference
        between the client being billed what they approved and something else.                  */
    rateChanged(): boolean {
        if (!this.rates) { return false; }
        for (let i = 0; i < this.rates.length; i++) {
            if (this.rates[i].RATE_CHANGED == 'Y') { return true; }
        }
        return false;
    }

    /*  Totals are summed here rather than in SQL so the figures shown are demonstrably the sum
        of the rows above them - a footer that disagrees with its own table is worse than none. */
    totalTax(): number {
        let t = 0;
        for (let i = 0; i < this.taxLines.length; i++) {
            t += Number(this.taxLines[i].TAX_INR) || 0;
        }
        return t;
    }

    chargeTotal(field: string): number {
        let t = 0;
        for (let i = 0; i < this.charges.length; i++) {
            t += Number(this.charges[i][field]) || 0;
        }
        return t;
    }

    sacTotal(field: string): number {
        let t = 0;
        for (let i = 0; i < this.sacLines.length; i++) {
            t += Number(this.sacLines[i][field]) || 0;
        }
        return t;
    }

    /*  A charge account with no SAC code set produces a tax invoice line with no SAC on it.
        Worth saying before conversion, not after the document is issued.                     */
    missingSac(): boolean {
        for (let i = 0; i < this.sacLines.length; i++) {
            if (!this.sacLines[i].SACCODE || String(this.sacLines[i].SACCODE).trim() == '') {
                return true;
            }
        }
        return false;
    }

    canConvert(): boolean {
        return this.loaded
            && this.header != null
            && this.header.STATUS == '100'
            && !this.converting;
    }

    backToSearch() {
        this._router.navigate(['/accounts/transaction/proformainvoice/proformasearch']);
    }

    printProforma() {
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/Account-Proforma-Print/' + this.profNo + '/', 'Proforma Invoice Print', toolbar);
    }

    doConvert() {
        if (!this.canConvert()) { return false; }
        if (String(this.invDate).trim() == '') {
            this.errorText = 'Invoice Date is required.';
            return false;
        }
        if (!confirm('Convert ' + this.profNo + ' to a Tax Invoice?\n\n'
            + 'The Tax Invoice number will be the next in the current series for '
            + this.invDate + '.\n\n'
            + 'This cannot be undone, and this Proforma will become read-only.')) {
            return false;
        }

        this.converting = true;
        this.loaderService.display(true);

        const jsonmaster = {
            PROF_NO: this.profNo,
            CMPID: this._loginService.getLogin()[0].CMPID,
            VGUID: this._loginService.getLogin()[0].GUID,
            INV_DATE: this.invDate,
            PAYDT: this.payDt,
            CLIENTREF: this.clientRef
        };

        this._dataService.Common('Accounts/ACC_PROFORMA_CONVERT_TO_INVOICE', jsonmaster)
            .subscribe((data: any) => {
                this.converting = false;
                this.loaderService.display(false);

                if (data && data.Table && data.Table.length > 0 && data.Table[0].STATUS == '100') {
                    const newInv = data.Table[0].INVOICENO;
                    this._toasterService.toast('success', 'success', data.Table[0].STATUSTEXT);
                    this._router.navigate(['/accounts/transaction/invoice/general/' + newInv]);
                } else {
                    this.errorText = (data && data.Table && data.Table[0])
                        ? data.Table[0].STATUSTEXT
                        : 'Conversion failed.';
                    /*  Reload so the page reflects reality - if it failed because someone else
                        converted it a moment ago, the banner should say so.                    */
                    this.loadPreview();
                }
            }, () => {
                this.converting = false;
                this.loaderService.display(false);
                this.errorText = 'Conversion failed and nothing was saved. Please try again.';
            });
    }
}
