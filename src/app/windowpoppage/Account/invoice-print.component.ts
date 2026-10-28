import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { isOlspl, OLSPL_LOGO } from '../../shared/company-branding';
import QRCode from 'qrcode';


/*  TAX INVOICE print - Angular port of Links_V4 UI/Accounts/frm_Acc_Tran_Invoice_Print.aspx(.vb).
    Same SP (USP_Acc_INV_Print_New via Accounts/ACC_invoice_Print), the same calculations and the same
    layout: the charge rows are split into pages of MAX_ROWS_PER_PAGE, and every page is one complete
    A4 box with the letterhead/party/shipment header and the QR/bank/declarations footer; SUB TOTAL,
    narration, totals and the SAC-wise tax summary go on the last page only (BuildInvoicePagesHtml in
    the .NET page). Chromium's own table pagination drops rows on long invoices - do not replace this
    with one flowing table.                                                                          */
const MAX_ROWS_PER_PAGE = 17;

/* CSS of the .NET page - the <style> block of Links_V4 frm_Acc_Tran_Invoice_Print.aspx, copied verbatim
   (comments left out). Used for the on-screen preview and, unchanged, as the only CSS of the print window
   opened by PrintElem(). Keep it identical to the .aspx: change the .NET page first, then copy it here. */
const INVOICE_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
html { background: #e8e8e8; }
body { font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 8pt; }
#divLoading { position: fixed; top: 40%; width: 100%; text-align: center; font-weight: bold; }
.sheet { width: 202mm; margin: 5mm auto; background: #fff; padding: 5mm; box-shadow: 0 2px 10px rgba(0,0,0,.25); }
.invoice-page { border: 1.5px solid #000; background: #fff; margin: 0 0 5mm; }
.charges tr.cont-note td { border-right: none; font-style: italic; font-size: 6.5pt;
    color: #555; text-align: left; padding: .8mm 3mm; }
.trailer-wrap .totals-zone { margin-top: 2mm; }
.toolbar { position: fixed; top: 8px; right: 12px; z-index: 50; }
.btnprint { font: bold 9pt Arial; padding: 5px 16px; cursor: pointer; }
.foot-note { text-align: center; font-size: 6.5pt; padding: .5mm 0; border-top: 1px solid #000; }
@media print {
    html { background: #fff; }
    @page { size: A4 portrait; margin: 7mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sheet { width: auto; margin: 0; padding: 0; box-shadow: none; }
    .no-print { display: none !important; }
    .taxsum, .totals-zone { page-break-inside: avoid; break-inside: avoid; }
    .pg-foot, .trailer-wrap { page-break-inside: avoid; break-inside: avoid; }
    .invoice-page { margin: 0; border: 1.5px solid #000; min-height: 283mm;
        display: flex; flex-direction: column; }
    .invoice-content { flex: 1 0 auto; display: flex; flex-direction: column; }
    .charges-wrap { flex: 1 0 auto; display: flex; flex-direction: column; }
    .fill-table { flex: 1 0 auto; }
    .fill-table td { padding: 0; }
    .invoice-page.pg-break { page-break-after: always; break-after: page; }
}
.cap { display: block; font-size: 6.5pt; line-height: 1.1; font-weight: bold; text-transform: uppercase; letter-spacing: .3px; color: #333; }
.k   { font-size: 7.5pt; font-weight: bold; color: #333; white-space: nowrap; }
.b   { font-weight: bold; }
.num { text-align: right; white-space: nowrap; }
.ctr { text-align: center; }
.txt-header { width: 100%; border-collapse: collapse; }
.txt-header td { vertical-align: middle; padding: .8mm 3mm; }
.th-logo { width: 34mm; text-align: center; }
.th-logo img { width: 30mm; height: auto; }
.th-id { text-align: center; }
.th-name, .th-suffix { font-family: 'Times New Roman', Times, serif; font-weight: bold; white-space: nowrap; }
.th-name { display: inline; font-size: 17pt; letter-spacing: .3px; }
.th-suffix { display: inline; font-size: 17pt; margin-left: 1.5mm; }
.th-addr, .th-contact { font-size: 7.5pt; line-height: 1.25; margin: .4mm auto 0; max-width: 142mm; }
.th-addr span + span::before { content: ", "; }
.th-contact span + span::before { content: "\\00a0\\00a0|\\00a0\\00a0"; }
.th-gst { font-size: 8pt; font-weight: bold; margin-top: .3mm; }
.co-band { border-bottom: 1.5px solid #000; }
.title-bar { display: table; width: 100%; border-bottom: 1.5px solid #000; background: #f2f2f2; }
.title-bar .side { display: table-cell; width: 34mm; font-size: 7.5pt; font-style: italic; vertical-align: middle; padding: 0 2mm; }
.doc-title { display: table-cell; text-align: center; font-size: 13.5pt; font-weight: bold; letter-spacing: 3px; padding: .7mm 0; }
.split { display: table; width: 100%; table-layout: fixed; border-bottom: 1.5px solid #000; }
.party { display: table-cell; width: 52%; padding: .6mm 3mm; border-right: 1px solid #000; vertical-align: top; }
.party-name { display: block; font-size: 9pt; font-weight: bold; margin: .3mm 0 .2mm; }
.party-addr { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.05; font-size: 7.5pt; }
.party-tax { display: block; margin-top: .2mm; font-size: 7.5pt; }
.meta { display: table-cell; vertical-align: top; }
.meta table { width: 100%; border-collapse: collapse; }
.meta td { padding: .35mm 1.5mm .35mm 3mm; border-bottom: 1px solid #bbb; vertical-align: top; }
.meta tr:last-child td { border-bottom: none; }
.meta td.k { width: 34%; }
.jobsline { font-size: 7pt; line-height: 1.4; margin-bottom: 1mm; }
.jobs { display: inline-table; font-size: 7.5pt; color: #222; border-collapse: collapse; }
.jobs td { padding: 0; }
.ship table { width: 100%; border-collapse: collapse; table-layout: fixed; border-bottom: 1.5px solid #000; }
.ship td { width: 25%; border-right: 1px solid #bbb; border-bottom: 1px solid #bbb; padding: .25mm 2mm; vertical-align: top; line-height: 1.15; font-size: 7.5pt; }
.ship td:last-child { border-right: none; }
.shipv { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; font-size: 6.5pt; line-height: 1.1; }
.ship tr:last-child td { border-bottom: none; }
table.charges { width: 100%; border-collapse: collapse; table-layout: fixed; }
.charges th { border-bottom: 1.5px solid #000; border-right: 1px solid #000; padding: 1.4mm 1.5mm; font-size: 8pt; background: #f2f2f2; }
.charges td { border-right: 1px solid #000; padding: .7mm 1.5mm; font-size: 7pt; vertical-align: top; }
.charges th:last-child, .charges td:last-child { border-right: none; }
.charges .c-sr  { width: 8mm; }
.charges .c-sac { width: 17mm; }
.charges .c-amt { width: 26mm; }
.charges tr.fill td { height: 16mm; border-bottom: 1.5px solid #000; border-right: none; }
.charges tr.subtotal-row td { border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 1.4mm 1.5mm; font-weight: bold; background: #fafafa; }
.totals-zone { display: table; width: 100%; table-layout: fixed; border-bottom: 1.5px solid #000; }
.words { display: table-cell; padding: 1.6mm 3mm; border-right: 1px solid #000; vertical-align: top; }
.words-val { display: block; font-weight: bold; margin: .6mm 0 1.2mm; }
.narr { font-size: 7pt; line-height: 1.4; margin-bottom: 1mm; }
.narr-val { display: -webkit-box; -webkit-line-clamp: 8; -webkit-box-orient: vertical; overflow: hidden; white-space: pre-line; font-size: 7pt; line-height: 1.3; }
.subrow { display: table; width: 100%; }
.wordbox { display: table-cell; vertical-align: middle; text-align: left; }
.wordbox .words-val { display: inline; font-size: 7pt; font-weight: bold; margin: 0; }
.sublbl { display: table-cell; text-align: right; vertical-align: middle; white-space: nowrap; padding-left: 3mm; }
.payby { display: block; font-weight: bold; font-size: 8pt; }
.enc { font-size: 7pt; line-height: 1.4; margin-bottom: 1mm; }
.desp { border-collapse: collapse; font-size: 7.5pt; margin-top: 1mm; }
.desp td { border: 1px solid #999; padding: .6mm 2mm; }
.taxsum { border-bottom: 1.5px solid #000; padding: 1mm 3mm 1.4mm; }
.taxsum table { width: 100%; border-collapse: collapse; margin-top: .8mm; }
.taxsum th, .taxsum td { border: 1px solid #999; padding: .6mm 2mm; font-size: 7pt; }
.taxsum th { background: #f2f2f2; }
.taxsum tr.tsfoot td { font-weight: bold; background: #fafafa; }
.totals { display: table-cell; width: 69mm; vertical-align: top; }
.totals table { width: 100%; border-collapse: collapse; }
.totals td { padding: 1.1mm 1.5mm; border-bottom: 1px solid #bbb; font-size: 7pt; }
.totals td.num { white-space: nowrap; }
.totals tr.grand td { border-top: 1.5px solid #000; border-bottom: 1px solid #000; font-size: 9pt; font-weight: bold; background: #f2f2f2; padding: 1.6mm 1.5mm; }
.bank-zone { display: table; width: 100%; table-layout: fixed; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; }
.einv { display: table-cell; width: 45mm; padding: 1.2mm 2.5mm; border-right: 1px solid #000; vertical-align: top; text-align: center; }
.bank { display: table-cell; padding: 1.2mm 3mm; vertical-align: top; }
.bank-lines span { display: block; font-size: 7.5pt; line-height: 1.4; }
.bank-grid { border-collapse: collapse; width: 100%; }
.bank-grid td { padding: .3mm 1.5mm .3mm 0; font-size: 7.5pt; line-height: 1.3; vertical-align: top; }
.bank-grid td.k { width: 17mm; white-space: nowrap; }
.bank-reg { font-size: 7.5pt; margin-top: .5mm; }
.bank-dual { border-collapse: collapse; width: 100%; table-layout: fixed; }
.bank-dual > tbody > tr > td { width: 50%; vertical-align: top; padding: 0 2mm 0 0; }
.bank-dual td.bd2 { border-left: 1px solid #999; padding: 0 0 0 2mm; }
.bank-dual .bank-grid td.k { width: 14mm; }
.bank-dual-reg { font-size: 7.5pt; margin-top: .6mm; border-top: 1px solid #999; padding-top: .4mm; }
.sig img { display: block; height: 10mm; width: auto; margin: .5mm auto 0; }
.irn-zone { padding: .8mm 3mm; border-bottom: 1.5px solid #000; font-size: 7.5pt; white-space: nowrap; }
.qr { width: 35mm; height: 35mm; display: block; margin: 1mm auto 0; }
.irn { font-size: 5.5pt; line-height: 1.5; white-space: nowrap; margin-top: 1mm; text-align: center; }
.signoff { display: table; width: 100%; table-layout: fixed; }
.decl { display: table-cell; padding: 1.2mm 3mm; border-right: 1px solid #000; font-size: 7.5pt; line-height: 1.4; vertical-align: top; }
.decl span { display: block; }
.notify { border: 1px solid #808080; padding: 1mm; margin-bottom: 1mm; }
.sig { display: table-cell; width: 70mm; padding: 1.2mm 3mm; text-align: center; vertical-align: top; }
.sig-for { display: block; font-weight: bold; font-size: 7.5pt; }
.sig-cap { display: block; border-top: 1px solid #000; margin-top: .5mm; padding-top: .8mm; font-size: 7pt; font-weight: bold; }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 100; }
.curcard { width: 320px; margin: 15% auto 0; background: #fff; border: 2px solid #003388; }
.curhead { background: #003388; color: #fff; font-weight: bold; font-size: 8.5pt; padding: 6px 10px; }
.curbody { padding: 12px 10px; text-align: center; font-size: 8.5pt; }
.curbody input[type=button], .curbody input[type=submit] { margin-top: 8px; padding: 3px 18px; }
`;

/* on-screen preview inside the Angular app only - never written to the print window. The .aspx html/body
   rules cannot reach inside this component, the app's global bootstrap left-aligns <th>, and the app's
   global src/scss/_custom.scss has its own .overlay { display:none } (image zoom) that hid the currency chooser. */
const PREVIEW_CSS = `
.printmain { background:#e8e8e8; min-height:100vh; overflow:auto; }
.sheet { font-family:Arial, Helvetica, sans-serif; color:#000; font-size:8pt; line-height:normal; text-align:left; }
.sheet th:not(.num) { text-align:center; }
.overlay.no-print { display:block; }
`;

@Component({
  selector: 'app-invoice-print',
  templateUrl: './invoice-print.component.html',
  styles: [INVOICE_CSS, PREVIEW_CSS],
  // Recipe 4: on-screen print chrome only (src/styles/kit/acc-print-chrome.css). #demo is untouched.
  host: { class: 'kit-print' },
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class InvoicePrintComponent implements OnInit {
  inv_number: string = ""
  loading: boolean = true
  showModal: boolean = false
  printmodal: boolean = false
  exampleRadios1: string = '0'

  /* view model, filled by build() */
  readonly nbsp = ' '
  cmp: any = {}
  inv: any = {}
  hdr: any = {}
  tot: any = {}
  bank: any = {}
  pages: any[] = []
  taxRows: any[] = []
  taxSum: any = null
  despatch: any[] = []
  enclosure: string = ""
  otherJobs: string = ""
  hasEinv: boolean = false
  qrSrc: string = ""
  irnText: string = ""
  ackText: string = ""
  serviceTaxReg: string = ""

  /** Letterhead logo: company 32 prints its OLSPL logo; the other companies keep Links_logo1.png. */
  logo = 'assets/img/Links_logo1.png';

  constructor(public _dataService: DataService,
    private _route: ActivatedRoute, public _loginService: LoginService) {
    if (isOlspl(this._loginService.getLogin()?.[0]?.CMPCODE)) { this.logo = OLSPL_LOGO; }
  }

  ngOnInit() {
    this._route.params.subscribe(params => {
      this.inv_number = params["InvNo"]
      this.checkAuthorisation()
    });
  }

  /* Print_pageload: STATUS "100#<inv no>#<message>" + AUTHORISEDTOPRINT */
  checkAuthorisation() {
    const l = this._loginService.getLogin()[0]
    this._dataService.getData("Accounts/ACC_invoice_AUTHORISATION_CHECK", { invno: this.inv_number, cmp_code: l.CMPCODE })
      .subscribe((res: any) => {
        const row = ((res && res.Table) || [])[0]
        let status = '103', msg = '', auth = ''
        if (row) {
          const parts = (this.firstCol(row, 'STATUS') + '').split('#')
          status = parts[0]
          msg = parts.length > 2 ? parts[2] : ''
          auth = (this.v(row, 'AUTHORISEDTOPRINT') + '').trim()
        }
        if (status == '100') {
          if (auth == '1') {
            this.checkCurrency()
          } else if (auth == '0') {
            this.loading = false
            alert(msg)
            window.close()
          }
        } else if (status == '103') {
          this.loading = false
          alert('No Records Found')
          window.close()
        }
      })
  }

  /* foreign-currency invoice: let the user choose INR or the invoice currency; otherwise print INR */
  checkCurrency() {
    const l = this._loginService.getLogin()[0]
    this._dataService.getData("Accounts/ACC_invoice_Chk_Inv_NONINR", { invno: this.inv_number, cmp_code: l.CMPCODE, citycode: l.CITYCODE })
      .subscribe((res: any) => {
        const row = ((res && res.Table) || [])[0]
        const mode = row ? (row[Object.keys(row)[0]] + '').trim() : '0'
        if (mode == '1') {
          this.loading = false
          this.showModal = true
        } else {
          this.print('0')
        }
      })
  }

  currencyType(d) {
    this.showModal = false
    this.loading = true
    this.print(d)
  }

  /* DisplayMode "1" = NON INR (invoice currency), anything else = INR */
  print(displayMode: string) {
    const l = this._loginService.getLogin()[0]
    this._dataService.getData("Accounts/ACC_invoice_Print", { invno: this.inv_number, cmp_code: l.CMPCODE, citycode: l.CITYCODE })
      .subscribe((res: any) => {
        this.loading = false
        if (this.build(res, displayMode == '1')) {
          this.printmodal = true
        }
      }, () => this.loading = false)
  }

  /* ---------- helpers (SP columns are matched case-insensitively, like DataRow.Item) ---------- */
  private v(row: any, name: string): any {
    if (!row) { return '' }
    const n = name.toLowerCase()
    for (const k of Object.keys(row)) {
      if (k.toLowerCase() === n) { return row[k] === null || row[k] === undefined ? '' : row[k] }
    }
    return ''
  }
  private has(row: any, name: string): boolean {
    if (!row) { return false }
    const n = name.toLowerCase()
    return Object.keys(row).some(k => k.toLowerCase() === n)
  }
  private firstCol(row: any, name: string): any {
    if (this.has(row, name)) { return this.v(row, name) }
    const k = Object.keys(row)[0]
    return k ? row[k] : ''
  }
  private num(x: any): number {
    const n = parseFloat(x)
    return isNaN(n) ? 0 : n
  }
  private t(x: any): string {
    return (x === null || x === undefined ? '' : x + '').trim()
  }
  /* FormatIN: Indian digit grouping, 2 decimals */
  fmt(x: any): string {
    return this.num(x).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  /* .NET Math.Round(x) / Math.Round(x, 2): round half to even */
  private roundEven(x: number, digits: number = 0): number {
    const p = Math.pow(10, digits)
    const s = x * p
    const f = Math.floor(s)
    const r = (s - f === 0.5) ? (f % 2 === 0 ? f : f + 1) : Math.round(s)
    return r / p
  }
  /* VB StrConv(..., ProperCase) */
  private properCase(s: string): string {
    return (s || '').toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase())
  }
  private curHas(k: string[], ...words: string[]): boolean {
    return words.some(w => k.indexOf(w) >= 0)
  }
  /* CUR_MASTER is not clean (USD/EURO have a blank CUR_SNAME, TAKA is FREN, POUNDSTERLING is GGP) */
  curSymbol(name: string, sh: string): string {
    const k = [this.t(name).toUpperCase(), this.t(sh).toUpperCase()]
    if (this.curHas(k, 'INR', 'INDIAN RUPEES')) { return '₹' }
    if (this.curHas(k, 'USD', 'US DOLLAR', 'U.S. DOLLAR')) { return '$' }
    if (this.curHas(k, 'EUR', 'EURO')) { return '€' }
    if (this.curHas(k, 'GBP', 'GGP', 'BRITAIN', 'POUNDSTERLING', 'U.K. POUND STERLING')) { return '£' }
    if (this.curHas(k, 'YEN', 'JPY', 'CNY', 'CHINESE YUAN')) { return '¥' }
    if (this.curHas(k, 'AUD', 'AUSTRALIAN DOLLAR')) { return 'A$' }
    if (this.curHas(k, 'CAD', 'CANADIAN DOLLAR')) { return 'C$' }
    if (this.curHas(k, 'SGD', 'SING', 'SINGAPORE DOLLAR')) { return 'S$' }
    if (this.curHas(k, 'HKD', 'HONG KONG DOLLAR')) { return 'HK$' }
    if (this.curHas(k, 'NZD')) { return 'NZ$' }
    if (this.curHas(k, 'AED', 'DIRHAM')) { return 'AED' }
    if (this.curHas(k, 'CHF', 'SWIS', 'SWISS FRANK')) { return 'CHF' }
    if (this.curHas(k, 'SEK', 'SWED', 'SWEDISH KRONER')) { return 'kr' }
    return this.t(name)
  }
  curSubUnit(name: string, sh: string): string {
    const k = [this.t(name).toUpperCase(), this.t(sh).toUpperCase()]
    if (this.curHas(k, 'INR', 'INDIAN RUPEES')) { return 'Paise' }
    if (this.curHas(k, 'USD', 'US DOLLAR', 'U.S. DOLLAR', 'EUR', 'EURO', 'AUD', 'AUSTRALIAN DOLLAR', 'CAD', 'CANADIAN DOLLAR',
      'SGD', 'SING', 'SINGAPORE DOLLAR', 'HKD', 'HONG KONG DOLLAR', 'NZD')) { return 'Cents' }
    if (this.curHas(k, 'GBP', 'GGP', 'BRITAIN', 'POUNDSTERLING', 'U.K. POUND STERLING')) { return 'Pence' }
    if (this.curHas(k, 'AED', 'DIRHAM')) { return 'Fils' }
    if (this.curHas(k, 'CHF', 'SWIS', 'SWISS FRANK')) { return 'Centimes' }
    if (this.curHas(k, 'CNY', 'CHINESE YUAN')) { return 'Fen' }
    if (this.curHas(k, 'SEK', 'SWED', 'SWEDISH KRONER')) { return 'Ore' }
    return ''
  }
  /* Amt2Wrds always says "Paise"; a foreign-currency invoice uses its own minor unit */
  private retuneSubUnit(words: string, subUnit: string): string {
    if (this.t(words) === '') { return words }
    if (subUnit === 'Paise') { return words }
    if (subUnit === '') { return words.replace(/\s*And\s+Paise\b.*?(Only\.?)\s*$/i, ' $1') }
    return words.replace(/\bPaise\b/gi, subUnit)
  }
  /* GST CENTRAL / STATE / INTEGRATED -> CGST / SGST / IGST (a suffix such as "OCEAN FRT" is kept) */
  private gstShortName(code: string, sname: string): string {
    const c = this.t(code)
    const s = this.t(sname)
    if (/GST\s*INTEGRATED\s*/i.test(s)) { return s.replace(/GST\s*INTEGRATED\s*/i, 'IGST ').trim() }
    if (/GST\s*CENTRAL\s*/i.test(s)) { return s.replace(/GST\s*CENTRAL\s*/i, 'CGST ').trim() }
    if (/GST\s*STATE\s*/i.test(s)) { return s.replace(/GST\s*STATE\s*/i, 'SGST ').trim() }
    const u = s.toUpperCase()
    if (u.indexOf('CGST') >= 0 || u.indexOf('SGST') >= 0 || u.indexOf('IGST') >= 0) { return s }
    if (c === '9961' || c === '9964') { return 'CGST' }
    if (c === '9962' || c === '9965') { return 'SGST' }
    if (c === '9963' || c === '9966') { return 'IGST' }
    return s
  }

  /* BLL_Acc_CommonFunctions.Amt2Wrds, word for word: "One Thousand Two Hundred Thirty Four And Paise Fifty Only." */
  private amt2Wrds(pAmount: number): string {
    const ones = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
      'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const nos = (n: number) => n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    const cnv = (n: number, s: string) => nos(n) + ' ' + s
    /* Format(Math.Abs(pAmount), "######0.00") */
    const cents = Math.round(parseFloat(Math.abs(pAmount).toPrecision(15)) * 100)
    let amt = Math.floor(cents / 100).toString()
    const paise = cents % 100
    let len = amt.length
    if (parseInt(amt, 10) === 0) { len = 0 }
    let w = ''
    if (len === 0) {
      w += 'Zero '
    } else {
      if (len > 9) { return '' }
      if (len > 7) { w += cnv(parseInt(amt.substr(0, len - 7), 10), 'Crore '); amt = parseInt(amt.slice(-7), 10).toString(); len = amt.length }
      if (len > 5) { w += cnv(parseInt(amt.substr(0, len - 5), 10), 'Lakh '); amt = parseInt(amt.slice(-5), 10).toString(); len = amt.length }
      if (len > 3) { w += cnv(parseInt(amt.substr(0, len - 3), 10), 'Thousand '); amt = parseInt(amt.slice(-3), 10).toString(); len = amt.length }
      if (len === 3) { w += cnv(parseInt(amt.substr(0, 1), 10), 'Hundred '); amt = parseInt(amt.slice(-2), 10).toString(); len = amt.length }
      if (len < 3 && parseInt(amt, 10) !== 0) { w += cnv(parseInt(amt, 10), '') }
    }
    if (paise > 0) {
      w += 'And Paise ' + cnv(paise, 'Only.')
    } else {
      w += 'Only. '
    }
    return w
  }

  /* fallback of the SAC-wise summary when Table13 is empty: subset of SAC totals matching a tax bucket's base */
  private findSubsetMatch(avail: string[], clsTotal: any, target: number): string[] {
    const n = avail.length
    if (n === 0 || n > 20) { return null }
    const bits = (x: number) => { let c = 0; while (x) { c += x & 1; x >>= 1 } return c }
    const masks: number[] = []
    for (let m = 1; m < (1 << n); m++) { masks.push(m) }
    masks.sort((a, b) => bits(a) - bits(b))
    for (const mask of masks) {
      let total = 0
      for (let b = 0; b < n; b++) { if (mask & (1 << b)) { total += clsTotal[avail[b]] } }
      if (Math.abs(this.roundEven(total, 2) - this.roundEven(target, 2)) <= 0.02) {
        const result: string[] = []
        for (let b = 0; b < n; b++) { if (mask & (1 << b)) { result.push(avail[b]) } }
        return result
      }
    }
    return null
  }

  /* ---------- print(DisplayMode) of the .NET page: build the whole printable model ---------- */
  build(res: any, foreign: boolean): boolean {
    const T = (i: number): any[] => (res && res['Table' + (i === 0 ? '' : i)]) || []
    const c0 = T(0)[0]
    const i1 = T(1)[0]
    if (!c0 || !i1) {
      alert('No Records Found')
      window.close()
      return false
    }

    /* letterhead: logo + company name (Old English, proper-cased) + address from the company resultset */
    const bold = this.t(this.v(c0, 'cmp_boldname'))
    /* company 32 has a bold name but no cmp_fullname: print its whole registered name from cmp_name */
    const cmpFull = this.t(this.v(c0, 'cmp_fullname')) || (bold !== '' ? this.t(this.v(c0, 'cmp_name')) : '')
    const suffix = cmpFull.replace(new RegExp('^\\s*' + bold.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '')
    const add1 = this.t(this.v(c0, 'cmp_add1')).replace(/,+$/, '').trim()
    const add2 = this.t(this.v(c0, 'cmp_add2')).replace(/,+$/, '').trim()
    let add3 = this.t(this.v(c0, 'city_name'))
    if (this.t(this.v(c0, 'cmp_add3')) !== '') { add3 = (add3 + ' - ' + this.t(this.v(c0, 'cmp_add3'))).trim() }
    const servicetaxRegd = this.v(c0, 'servicetax_regd') + ''
    const tptsrvtaxRegd = this.v(c0, 'tptsrvtax_regd') + ''
    const auxsrvtaxRegd = this.v(c0, 'auxsrvtax_regd') + ''
    const storagesrvtaxRegd = this.v(c0, 'storagesrvtax_regd') + ''
    const chsrvtaxRegd = this.v(c0, 'chsrvtax_regd') + ''
    const esic = this.v(c0, 'esic_regd') + ''
    const incomeTaxNo = this.t(this.v(c0, 'incometaxno'))
    const cinNo = this.t(this.v(c0, 'CINNO_REG'))
    const regParts: string[] = []
    if (incomeTaxNo !== '') { regParts.push('Income Tax No. ' + incomeTaxNo) }
    if (cinNo !== '') { regParts.push('CIN No. ' + cinNo) }
    this.cmp = {
      bold: this.properCase(bold),
      suffix: this.properCase(this.t(suffix)).replace(/\bPvt\.?\s*Ltd\.?/i, 'Private Limited'),
      add: [add1, add2, add3].filter(x => x !== ''),
      tel: this.t(this.v(c0, 'cmp_telno')) !== '' ? 'Tel : ' + this.t(this.v(c0, 'cmp_telno')) : '',
      email: this.t(this.v(c0, 'cmp_email')) !== '' ? 'Email : ' + this.t(this.v(c0, 'cmp_email')) : '',
      gst: servicetaxRegd,
      title: servicetaxRegd.indexOf('Service Tax') === 0 ? 'INVOICE' : 'TAX INVOICE',
      forName: 'For ' + this.v(c0, 'cmp_name'),
      esic: esic !== '' ? 'Our ESIC Regd No. ' + esic : '',
      reg: regParts.join(', '),
      address: this.t(this.v(c0, 'CMPADDRESS'))
    }

    /* party / meta / shipment */
    let partyAddr = this.t(this.v(i1, 'exp_invadd1')) + '<br>' + this.t(this.v(i1, 'exp_invadd2'))
    if (this.t(this.v(i1, 'exp_invadd3')) !== '') { partyAddr += '<br>' + this.t(this.v(i1, 'exp_invadd3')) }
    let country = this.t(this.v(i1, 'city_country'))
    if (this.has(i1, 'CITY_COUNTRY_RAW')) { country = this.t(this.v(i1, 'CITY_COUNTRY_RAW')) }
    partyAddr += '<br>' + this.t(this.v(i1, 'city_name')).toUpperCase() + ', ' + country.toUpperCase()
    let pos = this.t(this.v(i1, 'POS_STATENAME'))
    if (pos !== '' && this.t(this.v(i1, 'POS_STATECODE')) !== '') { pos += ' (' + this.t(this.v(i1, 'POS_STATECODE')) + ')' }
    let pkgs = this.t(this.v(i1, 'inv_pkgs'))
    const grossWt = this.t(this.v(i1, 'inv_wt'))
    if (grossWt !== '' && !isNaN(Number(grossWt)) && Number(grossWt) !== 0) {
      pkgs = (pkgs + ' / ' + this.fmt(grossWt) + ' KGS').trim().replace(/^\/+/, '').trim()
    }
    let fjob = '', sjob = ''
    T(2).forEach(r => {
      if (fjob !== '') { sjob = (sjob === '' ? '' : sjob + ', ') + this.t(this.v(r, 'inv_jobno')) } else { fjob = this.t(this.v(r, 'inv_jobno')) }
    })
    this.otherJobs = sjob
    const curNm = this.t(this.v(i1, 'cur_name'))
    const curSh = this.t(this.v(i1, 'cur_sname'))
    const curSym = foreign ? this.curSymbol(curNm, curSh) : '₹'
    this.inv = {
      no: this.v(i1, 'INV_NO'), date: this.v(i1, 'inv_date'),
      party: this.t(this.v(i1, 'exp_name')), addr: partyAddr,
      partyGst: this.t(this.v(i1, 'EXP_GSTNO')), pos: pos,
      job: fjob, ref: this.v(i1, 'inv_clientref'),
      payBy: this.v(i1, 'PaybleByDt') + '',
      currency: foreign ? curNm : 'INR (INDIAN RUPEES)',
      showDocThrough: this.v(i1, 'inv_client') + '' !== this.v(i1, 'inv_shipper') + '',
      docThrough: this.v(i1, 'docthrough'),
      hbl: this.v(i1, 'inv_hawbno'), hblDt: this.v(i1, 'inv_hawbdt'), carrier: this.v(i1, 'inv_carrier'),
      pkgs: pkgs, contents: this.v(i1, 'inv_goods'),
      narration: (this.v(i1, 'narration') + '').replace(/<\/?(font|p|span|div)[^>]*>/gi, ''),
      notify: this.t(this.v(i1, 'STAXNOTIFY')) !== '' ? this.v(i1, 'STAXNOTIFY') + '' : ''
    }
    const t11 = T(11)[0]
    const invType = t11 ? this.v(t11, 'INVTYPE') + '' : ''
    this.hdr = {
      sbLabel: invType === 'IMPORT' || invType === 'MISC' ? 'B.E. No. & Dt.' : (invType === 'EXPORT' ? 'S/Bill No. & Dt.' : ''),
      sbNo: t11 ? this.v(t11, 'BILLNO') : '', pol: t11 ? this.v(t11, 'POL') : '', pod: t11 ? this.v(t11, 'POD') : '',
      taxHead: 'Taxable (' + curSym + ')', ntaxHead: 'Non Taxable (' + curSym + ')', grandCur: curSym
    }

    /* enclosures (one labelled line) and despatch documents */
    this.enclosure = T(3).map(r => {
      const d = this.t(this.v(r, 'inv_desc')), n = this.t(this.v(r, 'inv_number'))
      return d !== '' || n !== '' ? d + (n !== '' ? ' - ' + n : '') : ''
    }).filter(x => x !== '').join(', ')
    this.despatch = T(6).map(r => ({ desc: this.v(r, 'inv_desc') + '', no: this.v(r, 'inv_number') + '' }))

    /* charge lines; service-tax registrations collected from the classification codes, as before */
    let serviceTax = ''
    const t4 = T(4)
    const hasSac = t4.length > 0 && this.has(t4[0], 'SACCODE')
    const charges = t4.map((r, i) => {
      const y = this.num(this.v(r, foreign ? 'inv_amount_Y' : 'inv_inramt_Y'))
      const n = this.num(this.v(r, foreign ? 'inv_amount_N' : 'inv_inramt_N'))
      /* the .NET page collects these only in the invoice-currency (DisplayMode 1) branch */
      const txbl = foreign ? this.v(r, 'inv_taxable') + '' : ''
      if (txbl === 'A') { if (servicetaxRegd !== '') { serviceTax += ' Agency :' + servicetaxRegd + ',' } }
      else if (txbl === 'T') { if (tptsrvtaxRegd !== '') { serviceTax += ' Transportation :' + tptsrvtaxRegd + ',' } }
      else if (txbl === 'X') { if (auxsrvtaxRegd !== '') { serviceTax += ' Auxillary :' + auxsrvtaxRegd + ',' } }
      else if (txbl === 'S') { if (storagesrvtaxRegd !== '') { serviceTax += ' Storage :' + storagesrvtaxRegd + ',' } }
      else if (txbl === 'C') { if (chsrvtaxRegd !== '') { serviceTax += ' Cargo Handling :' + chsrvtaxRegd + ',' } }
      return {
        sr: i + 1,
        desc: (hasSac ? this.v(r, 'CHRG_DESC_PLAIN') : this.v(r, 'chrg_desc')) + '',
        sac: hasSac && this.t(this.v(r, 'SACCODE')) !== '' ? this.t(this.v(r, 'SACCODE')) : this.nbsp,
        y: y > 0 ? this.fmt(y) : this.nbsp,
        n: n > 0 ? this.fmt(n) : this.nbsp
      }
    })
    const t5 = T(5)[0] || {}
    const amtY = this.num(this.v(t5, foreign ? 'tot_inv_amount_Y' : 'tot_inv_inramt_Y'))
    const amtN = this.num(this.v(t5, foreign ? 'tot_inv_amount_N' : 'tot_inv_inramt_N'))

    /* BuildInvoicePagesHtml: pages of MAX_ROWS_PER_PAGE rows (a 0-row invoice still gets one page) */
    const pageCount = charges.length > 0 ? Math.ceil(charges.length / MAX_ROWS_PER_PAGE) : 1
    this.pages = []
    for (let p = 0; p < pageCount; p++) {
      this.pages.push({
        rows: charges.slice(p * MAX_ROWS_PER_PAGE, (p + 1) * MAX_ROWS_PER_PAGE),
        first: p === 0, last: p === pageCount - 1
      })
    }

    /* tax rows (CGST / SGST / IGST or service tax) for the totals box */
    this.taxRows = T(7).map(r => {
      const code = this.t(this.v(r, 'inv_chrgcode'))
      const base = this.num(this.v(r, 'Totinv_amount')) !== 0 ? this.fmt(this.v(r, foreign ? 'Totinv_amount' : 'Totinv_inramt')) : this.fmt(0)
      const amt = this.num(this.v(r, foreign ? 'inv_amount' : 'inv_inramt'))
      if (code === '9920') {
        if (servicetaxRegd !== '') { serviceTax += ' Agency :' + servicetaxRegd + ',' }
      } else if (code === '9922') {
        if (tptsrvtaxRegd !== '' && (!foreign || serviceTax.indexOf('Transportation') < 0)) { serviceTax += ' Transportation :' + tptsrvtaxRegd + ',' }
      } else if (code === '9921') {
        if (auxsrvtaxRegd !== '' && (!foreign || serviceTax.indexOf('Auxillary') < 0)) { serviceTax += ' Auxillary :' + auxsrvtaxRegd + ',' }
      } else if (code === '9923') {
        if (storagesrvtaxRegd !== '' && (!foreign || serviceTax.indexOf('Storage') < 0)) { serviceTax += ' Storage :' + storagesrvtaxRegd + ',' }
      } else if (code === '9924') {
        if (chsrvtaxRegd !== '' && (!foreign || serviceTax.indexOf('Cargo Handling') < 0)) { serviceTax += ' Cargo Handling :' + chsrvtaxRegd + ',' }
      }
      return { label: this.gstShortName(code, this.v(r, 'SName')) + ' @ ' + this.v(r, 'inv_desc') + ' % on ' + base, amt: this.fmt(amt) }
    })
    this.serviceTaxReg = serviceTax

    /* SAC-wise tax summary - only when CGST/SGST/IGST rows exist */
    let tsCG = 0, tsSG = 0, tsIG = 0, tsAny = false
    let tsCGr = '', tsSGr = '', tsIGr = ''
    const buckets: any[] = []
    T(7).forEach(r => {
      const snm = this.t(this.v(r, 'SName')).toUpperCase()
      const tsAmt = this.num(this.v(r, foreign ? 'inv_amount' : 'inv_inramt'))
      const tsBase = this.num(this.v(r, foreign ? 'Totinv_amount' : 'Totinv_inramt'))
      const tsRate = this.t(this.v(r, 'inv_desc'))
      const code = this.t(this.v(r, 'inv_chrgcode'))
      const label = this.gstShortName(code, this.v(r, 'SName'))
      if (code === '9961' || code === '9964' || snm.indexOf('CGST') >= 0 || snm.indexOf('CENTRAL') >= 0) {
        tsCG += tsAmt; if (tsCGr === '') { tsCGr = tsRate } buckets.push({ type: 'CG', label: label, rate: tsRate, base: tsBase, amt: tsAmt }); tsAny = true
      } else if (code === '9962' || code === '9965' || snm.indexOf('SGST') >= 0 || snm.indexOf('STATE') >= 0) {
        tsSG += tsAmt; if (tsSGr === '') { tsSGr = tsRate } buckets.push({ type: 'SG', label: label, rate: tsRate, base: tsBase, amt: tsAmt }); tsAny = true
      } else if (code === '9963' || code === '9966' || snm.indexOf('IGST') >= 0 || snm.indexOf('INTEGRATED') >= 0) {
        tsIG += tsAmt; if (tsIGr === '') { tsIGr = tsRate } buckets.push({ type: 'IG', label: label, rate: tsRate, base: tsBase, amt: tsAmt }); tsAny = true
      }
    })
    this.taxSum = null
    if (tsAny) {
      const dash = '—'
      const sacTotal: any = {}, sacCG: any = {}, sacSG: any = {}, sacIG: any = {}, sacCGr: any = {}, sacSGr: any = {}, sacIGr: any = {}
      const sacOrder: string[] = []
      /* Table13: each SAC's own taxable base and rate */
      T(13).forEach(r => {
        const sc = this.t(this.v(r, 'SACCODE'))
        if (sc === '') { return }
        const tCode = this.t(this.v(r, 'CHRGCODE'))
        const base = this.num(this.v(r, foreign ? 'TAXABLEAMT' : 'TAXABLEAMTINR'))
        const rate = this.num(this.v(r, 'RATE'))
        const rateStr = (Math.round(rate * 100) / 100).toString()
        const amt = this.roundEven(base * rate / 100, 2)
        if (!(sc in sacTotal)) { sacOrder.push(sc) }
        sacTotal[sc] = base   /* the same base on the SAC's CGST and SGST rows - taken once, not summed */
        if (tCode === '9961' || tCode === '9964') { sacCG[sc] = (sacCG[sc] || 0) + amt; sacCGr[sc] = rateStr }
        else if (tCode === '9962' || tCode === '9965') { sacSG[sc] = (sacSG[sc] || 0) + amt; sacSGr[sc] = rateStr }
        else if (tCode === '9963' || tCode === '9966') { sacIG[sc] = (sacIG[sc] || 0) + amt; sacIGr[sc] = rateStr }
      })
      const useTable13 = sacOrder.length > 0
      const sacBucket: any = {}
      const lastRowForBucket: any = {}
      if (!useTable13) {
        /* fallback: Table4 grouped by SAC, matched to the Table7 buckets by their taxable base */
        if (hasSac) {
          t4.forEach(r => {
            if (this.t(this.v(r, 'inv_taxable')) === 'N') { return }
            const sc = this.t(this.v(r, 'SACCODE'))
            if (sc === '') { return }
            const base = this.num(this.v(r, foreign ? 'inv_amount_Y' : 'inv_inramt_Y'))
            if (!(sc in sacTotal)) { sacOrder.push(sc); sacTotal[sc] = 0 }
            sacTotal[sc] += base
          })
        }
        const assigned: any = {}
        buckets.forEach((b, bIdx) => {
          const remaining = sacOrder.filter(s => !assigned[s])
          const matched = this.findSubsetMatch(remaining, sacTotal, b.base)
          if (matched) { matched.forEach(s => { sacBucket[s] = bIdx; assigned[s] = true }) }
        })
        sacOrder.forEach((sc, idx) => { if (sc in sacBucket) { lastRowForBucket[sacBucket[sc]] = idx } })
      }
      let rows: any[] = []
      let accTx = 0
      if (sacOrder.length > 0) {
        const bucketAcc: any = {}
        sacOrder.forEach((sc, idx) => {
          const base = this.roundEven(sacTotal[sc], 2)
          let cg = 0, sg = 0, ig = 0, cgR = '', sgR = '', igR = ''
          if (useTable13) {
            if (sc in sacCG) { cg = sacCG[sc]; cgR = sacCGr[sc] }
            if (sc in sacSG) { sg = sacSG[sc]; sgR = sacSGr[sc] }
            if (sc in sacIG) { ig = sacIG[sc]; igR = sacIGr[sc] }
          } else if (sc in sacBucket) {
            const bIdx = sacBucket[sc]
            const b = buckets[bIdx]
            let amt = this.roundEven(base * this.num(b.rate) / 100, 2)
            if (!(bIdx in bucketAcc)) { bucketAcc[bIdx] = 0 }
            if (lastRowForBucket[bIdx] === idx) { amt = this.roundEven(b.amt - bucketAcc[bIdx], 2) }
            bucketAcc[bIdx] += amt
            if (b.type === 'CG') { cg = amt; cgR = b.rate } else if (b.type === 'SG') { sg = amt; sgR = b.rate } else { ig = amt; igR = b.rate }
          }
          accTx += base
          rows.push({
            sac: sc, base: this.fmt(base),
            cgR: cg !== 0 ? cgR : dash, cg: cg !== 0 ? this.fmt(cg) : dash,
            sgR: sg !== 0 ? sgR : dash, sg: sg !== 0 ? this.fmt(sg) : dash,
            igR: ig !== 0 ? igR : dash, ig: ig !== 0 ? this.fmt(ig) : dash,
            tot: this.fmt(cg + sg + ig)
          })
        })
        this.taxSum = {
          rows: rows,
          foot: { base: this.fmt(accTx), cg: this.fmt(tsCG), sg: this.fmt(tsSG), ig: tsIG > 0 ? this.fmt(tsIG) : dash, tot: this.fmt(tsCG + tsSG + tsIG) }
        }
      } else {
        /* old SP without the SAC column: one aggregated row (and no TOTAL row, as on the .NET page) */
        rows = [{
          sac: dash, base: this.fmt(amtY),
          cgR: tsCG > 0 ? tsCGr : dash, cg: tsCG > 0 ? this.fmt(tsCG) : dash,
          sgR: tsSG > 0 ? tsSGr : dash, sg: tsSG > 0 ? this.fmt(tsSG) : dash,
          igR: tsIG > 0 ? tsIGr : dash, ig: tsIG > 0 ? this.fmt(tsIG) : dash,
          tot: this.fmt(tsCG + tsSG + tsIG)
        }]
        this.taxSum = { rows: rows, foot: null }
      }
    }

    /* totals: GRAND TOTAL = taxable + non-taxable + tax; an INR invoice is rounded (.NET Round = half to even) */
    const round = this.v((T(9)[0] || {}), 'RoundValue')
    let totalTaxableAmt = 0
    const t8 = T(8)[0]
    if (t8) {
      if (foreign) {
        totalTaxableAmt = this.num(this.v(t8, 'TotalTaxableAmt'))
        if (totalTaxableAmt !== 0) { totalTaxableAmt = totalTaxableAmt - this.num(round) }
      } else {
        totalTaxableAmt = this.num(this.v(t8, 'TotalTaxableAmtINR'))
      }
    }
    let grand = amtY + amtN + totalTaxableAmt
    /* the .NET page prints the decimal as stored (0.40); the JSON number arrives as 0.4 */
    const roundTxt = this.t(round) !== '' && !isNaN(Number(round)) ? Number(round).toFixed(2) : round + ''
    if (!foreign) { grand = this.roundEven(grand) }
    const words = foreign
      ? 'TOTAL ' + curNm + ' : ' + this.retuneSubUnit(this.amt2Wrds(grand), this.curSubUnit(curNm, curSh))
      : 'TOTAL RUPEES : ' + this.amt2Wrds(grand)
    this.tot = {
      y: this.fmt(amtY), n: this.fmt(amtN), yn: this.fmt(amtY + amtN), grand: this.fmt(grand), words: words,
      showRound: !foreign, round: roundTxt, adv: null
    }
    const advance = this.num(this.v(i1, 'inv_advance'))
    if (!foreign && advance > 0) {
      const net = grand - advance
      this.tot.adv = {
        advance: this.fmt(advance),
        label: net > 0 ? 'Balance due to us' : (net < 0 ? 'Balance due to you' : 'Zero Balance'),
        bal: net === 0 ? '0.00' : this.fmt(Math.abs(net))
      }
    }

    /* e-invoice: QR + IRN / Ack line, only when an IRN exists */
    this.qrSrc = ''; this.irnText = ''; this.ackText = ''; this.hasEinv = false
    const t10 = T(10)[0]
    if (t10) {
      const irn = this.v(t10, 'IRNNO') + ''
      this.irnText = irn !== '' ? ' IRN NO. : ' + irn : ''
      this.hasEinv = this.t(this.irnText) !== ''
      const ackno = this.t(this.v(t10, 'ACKNO'))
      const ackdt = this.t(this.v(t10, 'ACKDATE'))
      let ack = ackno !== '' ? 'Ack No. : ' + ackno : ''
      if (ackdt !== '') { ack = (ack !== '' ? ack + '  |  ' : '') + 'Ack Date : ' + ackdt }
      this.ackText = ack
      const payload = this.v(t10, 'QRCode') + ''
      if (irn !== '' && payload !== '') { this.renderQr(payload) }
    }

    /* bank details (Table12) in the label/value bank grid; an OVERSEAS non-INR invoice gets TWO bank rows
       from the SP (current bank + DBS USD), shown side by side instead of the grid */
    this.bank = { beneficiary: '', act: '', name: '', ifsc: '', branch: '', swift: '', micr: '', pan: '', cin: '', rtgs: '', uom: '', uomLabel: true, dual: null }
    const t12 = T(12)
    if (t12.length > 0) {
      const b0 = t12[0]
      /* all bank accounts on ONE bold line, "INR xxx | USD yyy" (the SP sends them as multi-line HTML);
         the grid row already carries the "A/C No. :" label */
      const actRaw = (this.v(b0, 'BANKACT') + '').replace(/<\/?b>/gi, '')
      const acts = actRaw.split(/<br\s*\/?>/i)
        .map(a => a.trim().replace(/^bank\s*a\/c\s*/i, '').replace(/:/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(a => a !== '')
      this.bank = {
        beneficiary: this.v(b0, 'BENEFICIARY') + '',
        act: '<b>' + acts.join('&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;') + '</b>',
        name: this.v(b0, 'BANKNAME') + '',
        ifsc: this.v(b0, 'IFSCCODE') + '',
        /* branch + bank address + country on one line, only the non-blank parts */
        branch: ['BRANCH', 'BANKADDRESS', 'COUNTRY'].map(c => this.t(this.v(b0, c))).filter(x => x !== '').join(', '),
        swift: this.v(b0, 'SWIFTCODE') + '',
        micr: this.v(b0, 'MICRCODE') + '',
        pan: this.v(b0, 'PANNO') + '',
        cin: this.v(b0, 'CINNO1') + '',
        rtgs: this.v(b0, 'RTGSCODE') + '',
        uom: this.v(b0, 'UAMNO') + '',
        uomLabel: this.t(this.v(b0, 'UAMNO')) !== '',
        dual: null
      }
      if (t12.length > 1) {
        this.bank.dual = {
          cells: [this.bankCell(t12[0]), this.bankCell(t12[1])],
          pan: this.t(this.v(b0, 'PANNO')), cin: this.t(this.v(b0, 'CINNO1')), uom: this.t(this.v(b0, 'UAMNO'))
        }
      }
    }
    return true
  }

  /* BuildBankCell: one compact label/value bank panel for the side-by-side two-bank layout */
  private bankCell(r: any): any {
    return {
      beneficiary: this.v(r, 'BENEFICIARY') + '',
      act: (this.v(r, 'BANKACT') + '').replace(/<\/?b>|<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim(),
      name: this.v(r, 'BANKNAME') + '',
      branch: ['BRANCH', 'BANKADDRESS', 'COUNTRY'].map(c => this.t(this.v(r, c))).filter(x => x !== '').join(', '),
      swift: this.v(r, 'SWIFTCODE') + '',
      ifsc: this.v(r, 'IFSCCODE') + '',
      micr: this.t(this.v(r, 'MICRCODE')) !== '' ? this.v(r, 'MICRCODE') + '' : ''
    }
  }

  /* QR image of the e-invoice payload, 6 px per module with the 4-module quiet zone (as the .NET page) */
  private renderQr(payload: string) {
    try {
      QRCode.toDataURL(payload, { errorCorrectionLevel: 'L', margin: 4, scale: 6 })
        .then((url: string) => { this.qrSrc = url })
        .catch(() => { this.qrSrc = '' })
    } catch (e) { this.qrSrc = '' }
  }

  PrintElem() {
    const data = document.getElementById('demo').innerHTML
    const mywindow = window.open('', 'Accounts - Invoice Print', 'height=800,width=900')
    /* <!DOCTYPE html> as on the .aspx - without it the window renders in quirks mode (different table
       font inheritance and height:100% handling) */
    mywindow.document.write('<!DOCTYPE html><html><head><title>Accounts - Invoice Print</title><style>' + INVOICE_CSS + '</style>')
    mywindow.document.write('</head><body>')
    mywindow.document.write(data)
    mywindow.document.write('</body></html>')
    mywindow.document.close()
    mywindow.onload = function () {
      mywindow.focus()
      mywindow.print()
      mywindow.close()
    }
    return true
  }
}
