import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoaderService } from '../../shared/service/loader.service';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { environment } from '../../../environments/environment.prod';

declare var require: any;
const QRCode = require('qrcode');

/*  CREDIT NOTE print (default) - invoice-style layout, same A4 format as the Tax Invoice print (invoice-print.component).
    Data: Accounts/ACC_CN_view -> usp_Acct_N_CreditNote_Print (type "Print").
    Result sets: 0 header, 1 jobs, 2 charge lines, 3 against-invoices, 4 totals, 5 company, 6 taxable/non-taxable
    totals, 8 GST rows, 9 total GST, 10 round off, 11 e-invoice QR/IRN.
    The exact copy of the .NET page is kept as creditnote-print-net.component (route Account-CreditNote-print-net).      */
const CREDITNOTE_CSS = `
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: Arial, Helvetica, sans-serif; color:#000; font-size:8pt; }
.sheet { width:202mm; margin:3mm auto; background:#fff; font-family:Arial, Helvetica, sans-serif; font-size:8pt; line-height:normal; color:#000; text-align:left; }
.sheet table, .sheet td, .sheet th { font-family:inherit; font-size:inherit; line-height:inherit; }
.sheet table { margin:0; width:auto; border-spacing:0; background:transparent; }
.sheet td, .sheet th { border-top:0; text-align:inherit; vertical-align:top; }
.sheet table.charges, .sheet .txt-header, .sheet .meta table, .sheet .ship table, .sheet .taxsum table, .sheet .totals table, .sheet .bank-grid, .sheet .bank-dual { width:100%; }
.invoice-page { border:1.5px solid #000; background:#fff; }
.cap { display:block; font-size:6.5pt; line-height:1.1; font-weight:bold; text-transform:uppercase; letter-spacing:.3px; color:#333; }
.k { font-size:7.5pt; font-weight:bold; color:#333; white-space:nowrap; }
.b { font-weight:bold; } .num { text-align:right; white-space:nowrap; } .ctr { text-align:center; }
.txt-header { width:100%; border-collapse:collapse; } .txt-header td { vertical-align:middle; padding:.8mm 3mm; }
.th-logo { width:34mm; text-align:center; } .th-logo img { width:30mm; height:auto; } .th-id { text-align:center; }
.th-name, .th-suffix { font-family:'Arial Black', Arial, sans-serif; font-weight:bold; white-space:nowrap; display:inline; font-size:17pt; }
.th-name { letter-spacing:.3px; } .th-suffix { margin-left:1.5mm; }
.th-addr, .th-contact { font-size:7.5pt; line-height:1.25; margin:.4mm auto 0; max-width:142mm; }
.th-addr span + span::before { content:", "; } .th-contact span + span::before { content:"\\00a0\\00a0|\\00a0\\00a0"; }
.th-gst { font-size:8pt; font-weight:bold; margin-top:.3mm; }
.co-band { border-bottom:1.5px solid #000; }
.title-bar { display:table; width:100%; border-bottom:1.5px solid #000; background:#f2f2f2; }
.title-bar .side { display:table-cell; width:34mm; font-size:7.5pt; font-style:italic; vertical-align:middle; padding:0 2mm; }
.doc-title { display:table-cell; text-align:center; font-size:13.5pt; font-weight:bold; letter-spacing:3px; padding:.7mm 0; }
.split { display:table; width:100%; table-layout:fixed; border-bottom:1.5px solid #000; }
.party { display:table-cell; width:52%; padding:.6mm 3mm; border-right:1px solid #000; vertical-align:top; }
.party-name { display:block; font-size:9pt; font-weight:bold; margin:.3mm 0 .2mm; }
.party-addr { display:block; line-height:1.15; font-size:7.5pt; } .party-tax { display:block; margin-top:.2mm; font-size:7.5pt; }
.meta { display:table-cell; vertical-align:top; } .meta table { width:100%; border-collapse:collapse; }
.meta td { padding:.35mm 1.5mm .35mm 3mm; border-bottom:1px solid #bbb; vertical-align:top; } .meta tr:last-child td { border-bottom:none; } .meta td.k { width:34%; }
.jobsline { font-size:7pt; line-height:1.4; margin-bottom:1mm; }
.ship table { width:100%; border-collapse:collapse; table-layout:fixed; border-bottom:1.5px solid #000; }
.ship td { width:25%; border-right:1px solid #bbb; border-bottom:1px solid #bbb; padding:.25mm 2mm; vertical-align:top; line-height:1.15; font-size:7.5pt; }
.ship td:last-child { border-right:none; } .ship tr:last-child td { border-bottom:none; }
.shipv { font-size:6.5pt; line-height:1.1; max-height:3.4em; overflow:hidden; }
table.charges { width:100%; border-collapse:collapse; table-layout:fixed; }
.charges th { border-bottom:1.5px solid #000; border-right:1px solid #000; padding:1.4mm 1.5mm; font-size:8pt; background:#f2f2f2; }
.charges td { border-right:1px solid #000; padding:.7mm 1.5mm; font-size:7pt; vertical-align:top; }
.charges th:last-child, .charges td:last-child { border-right:none; }
.charges .c-sr { width:8mm; } .charges .c-sac { width:17mm; } .charges .c-amt { width:26mm; }
.charges tr.fill td { height:0; padding:0; border-bottom:1.5px solid #000; border-right:1px solid #000; }
.charges tr.fill.short td { height:16mm; }
.charges tr.fill td:last-child { border-right:none; }
.charges tr.subtotal-row td { border-top:1.5px solid #000; border-bottom:1.5px solid #000; padding:1.4mm 1.5mm; font-weight:bold; background:#fafafa; }
.totals-zone { display:table; width:100%; table-layout:fixed; border-bottom:1.5px solid #000; }
.words { display:table-cell; padding:1.6mm 3mm; border-right:1px solid #000; vertical-align:top; }
.words-val { display:inline; font-size:7pt; font-weight:bold; }
.narr { font-size:7pt; line-height:1.4; margin-bottom:1mm; } .narr-val { display:block; white-space:pre-line; font-size:7pt; line-height:1.3; max-height:10.4em; overflow:hidden; }
.subrow { display:table; width:100%; } .wordbox { display:table-cell; vertical-align:middle; }
.sublbl { display:table-cell; text-align:right; vertical-align:middle; white-space:nowrap; padding-left:3mm; }
.enc { font-size:7pt; line-height:1.4; margin-bottom:1mm; }
.desp { border-collapse:collapse; font-size:7.5pt; margin-top:1mm; } .desp td { border:1px solid #999; padding:.6mm 2mm; }
.taxsum { border-bottom:1.5px solid #000; padding:1mm 3mm 1.4mm; } .taxsum table { width:100%; border-collapse:collapse; margin-top:.8mm; }
.taxsum th, .taxsum td { border:1px solid #999; padding:.6mm 2mm; font-size:7pt; } .taxsum th { background:#f2f2f2; } .taxsum tr.tsfoot td { font-weight:bold; background:#fafafa; }
.totals { display:table-cell; width:69mm; vertical-align:top; } .totals table { width:100%; border-collapse:collapse; }
.totals td { padding:1.1mm 1.5mm; border-bottom:1px solid #bbb; font-size:7pt; }
.totals tr.grand td { border-top:1.5px solid #000; border-bottom:1px solid #000; font-size:9pt; font-weight:bold; background:#f2f2f2; padding:1.6mm 1.5mm; }
.bank-zone { display:table; width:100%; table-layout:fixed; border-top:1.5px solid #000; border-bottom:1.5px solid #000; }
.einv { display:table-cell; width:45mm; padding:1.2mm 2.5mm; border-right:1px solid #000; vertical-align:top; text-align:center; }
.bank { display:table-cell; padding:1.2mm 3mm; vertical-align:top; }
.bank-grid { border-collapse:collapse; width:100%; } .bank-grid td { padding:.3mm 1.5mm .3mm 0; font-size:7.5pt; line-height:1.3; vertical-align:top; } .bank-grid td.k { width:17mm; white-space:nowrap; }
.bank-reg { font-size:7.5pt; margin-top:.5mm; }
.bank-dual { border-collapse:collapse; width:100%; table-layout:fixed; } .bank-dual td.bd { width:50%; vertical-align:top; padding:0 2mm 0 0; }
.bank-dual td.bd2 { border-left:1px solid #999; padding:0 0 0 2mm; } .bank-dual .bank-grid td.k { width:14mm; }
.bank-dual-reg { font-size:7.5pt; margin-top:.6mm; border-top:1px solid #999; padding-top:.4mm; }
.qr { width:35mm; height:35mm; display:block; margin:1mm auto 0; }
.irn-zone { padding:.8mm 3mm; border-bottom:1.5px solid #000; font-size:7.5pt; white-space:nowrap; }
.signoff { display:table; width:100%; table-layout:fixed; }
.decl { display:table-cell; padding:1.2mm 3mm; border-right:1px solid #000; font-size:7.5pt; line-height:1.4; vertical-align:top; } .decl span { display:block; }
.notify { border:1px solid #808080; padding:1mm; margin-bottom:1mm; }
.sig { display:table-cell; width:70mm; padding:1.2mm 3mm; text-align:center; vertical-align:top; } .sig img { display:block; height:10mm; width:auto; margin:.5mm auto 0; }
.sig-for { display:block; font-weight:bold; font-size:7.5pt; }
.sig-cap { display:block; border-top:1px solid #000; margin-top:.5mm; padding-top:.8mm; font-size:7pt; font-weight:bold; }
.foot-note { text-align:center; font-size:6.5pt; padding:.5mm 0; border-top:1px solid #000; }
.taxsum, .totals-zone, .bank-zone, .signoff { page-break-inside:avoid; }
@page { size:A4 portrait; margin:7mm; }
@media print {
  html, body { margin:0; background:#fff; }
  .sheet { width:auto; margin:0; }
  .invoice-page { min-height:283mm; display:flex; flex-direction:column; }
  .charges-wrap { flex:1 0 auto; display:flex; }
  .charges-wrap table.charges { flex:1 1 auto; }
  .charges tr.fill { height:100%; }
}
.cur-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,.35); z-index:1000; }
.cur-card { width:340px; margin:18vh auto 0; background:#fff; border-radius:6px; box-shadow:0 6px 24px rgba(0,0,0,.35); overflow:hidden; font-family:Arial, Helvetica, sans-serif; }
.cur-head { background:#003388; color:#fff; font-weight:bold; font-size:13px; padding:10px 14px; }
.cur-body { padding:16px 18px 6px; display:flex; justify-content:space-around; font-size:14px; }
.cur-opt { cursor:pointer; display:flex; align-items:center; gap:6px; }
.cur-opt input { width:16px; height:16px; margin:0; cursor:pointer; }
.cur-foot { padding:10px 18px 16px; text-align:center; }
.cur-ok { background:#003388; color:#fff; border:0; border-radius:4px; padding:6px 32px; font-size:13px; font-weight:bold; cursor:pointer; }
.cur-ok:hover { background:#0047b3; }
`;

@Component({
  selector: 'app-creditnote-print',
  templateUrl: './creditnote-print.component.html',
  styles: [CREDITNOTE_CSS],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class CreditnotePrintComponent implements OnInit {
  crt_number: string = ""
  showModal: boolean = false
  printmodal: boolean = false
  exampleRadios1: string = '0'
  inrtype: string = ""

  /* view model, filled by build() */
  cmp: any = {}
  inv: any = {}
  charges: any[] = []
  taxRows: any[] = []
  taxSum: any = null
  hdr: any = {}
  tot: any = {}
  againstInvoices: string = ""
  otherJobs: string = ""
  qrSrc: string = ""
  irnText: string = ""

  constructor(public _dataService: DataService,
    private _route: ActivatedRoute, public _loginService: LoginService,
    private _loaderService: LoaderService) { }

  ngOnInit() {
    this._route.params.subscribe(params => {
      this.crt_number = params["CrtNo"]
      this.authCheck(params["CrtNo"]);
    });
  }
  /* same first step as the .NET page: USP_ACC_CREDITNOTE_PRINT_AUTHORISATION_CHECK. STATUS = "<code>#<crtno>#<message>".
     Printing is blocked (with the proc's message) while authorisation or the IRN is pending. */
  authCheck(crtno) {
    const jsonmaster = {
      crtno: crtno,
      cmp_code: this._loginService.getLogin()[0].CMPCODE
    }
    this._dataService.getData("Accounts/ACC_creditNote_AUTHORISATION_CHECK", jsonmaster)
      .subscribe((res: any) => {
        const r = res && res.Table && res.Table[0]
        if (!r) {
          alert('No Records Found')
          return
        }
        const parts = (this.v(r, 'STATUS') + '').split('#')
        const code = parts[0]
        const msg = (parts[2] || '').replace(/\\n/g, '\n').replace(/\/n/g, '\n')
        if (code == '100') {
          if (this.v(r, 'AUTHORISEDTOPRINT') == '1') {
            this.checkcrt(crtno)
          } else {
            alert(msg)
            window.close()
          }
        } else if (code == '103') {
          alert('No Records Found')
        }
      })
  }
  checkcrt(crtno) {
    const jsonmaster = {
      invno: crtno,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE
    }
    this._dataService.getData("Accounts/ACC_creditNote_Chk_Inv_NONINR", jsonmaster)
      .subscribe((res: any) => {
        const r = res && res.Table && res.Table[0]
        if (!r) {
          alert('No Records Found')
        } else if (r.AUTHORISEDTOPRINT == "0") {
          alert('You can not Print Credit Note No. ' + this.crt_number + '\n  Because Authorisation is Pending !!')
        } else if (r.AUTHORISEDTOPRINT == "1") {
          this.inrtype = r.PRINT1
          this.showModal = true;
        }
      })
  }
  currencyType(d) {
    this.inrtype = d
    this.showModal = false;
    this.printmodal = true
    this.printdata()
  }
  printdata() {
    const l = this._loginService.getLogin()[0]
    const jsonmaster = {
      CNno: this.crt_number,
      cmp_code: l.CMPCODE,
      citycode: l.CITYCODE,
      type: "Print",
      finstartdt: l.FINANCIAL_YEAR.STARTDATE,
      fin_enddt: l.FINANCIAL_YEAR.ENDDATE
    }
    this._dataService.getData("Accounts/ACC_CN_view", jsonmaster)
      .subscribe((res: any) => {
        this.build(res)
        this._loaderService.display(false)
      })
  }

  /* ---------- helpers (same as invoice print) ---------- */
  /* SP column names are matched case-insensitively */
  private v(row: any, name: string): any {
    if (!row) { return '' }
    const n = name.toLowerCase()
    for (const k of Object.keys(row)) {
      if (k.toLowerCase() === n) { return row[k] === null || row[k] === undefined ? '' : row[k] }
    }
    return ''
  }
  private num(x: any): number {
    const n = parseFloat(x)
    return isNaN(n) ? 0 : n
  }
  fmt(x: any): string {
    return this.num(x).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  private properCase(s: string): string {
    return (s || '').toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase())
  }
  private curKey(name: string, sh: string): string[] {
    return [(name || '').trim().toUpperCase(), (sh || '').trim().toUpperCase()]
  }
  private curHas(k: string[], ...words: string[]): boolean {
    return words.some(w => k.indexOf(w) >= 0)
  }
  curSymbol(name: string, sh: string): string {
    const k = this.curKey(name, sh)
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
    return (name || '').trim()
  }
  curSubUnit(name: string, sh: string): string {
    const k = this.curKey(name, sh)
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
  /* GST CENTRAL / STATE / INTEGRATED -> CGST / SGST / IGST */
  private gstShortName(code: string, sname: string): string {
    const c = (code || '').toString().trim()
    const s = (sname || '').toString().trim()
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
  /* amount in words, Indian system: "Five Hundred Twenty Five And Paise 19 Only." */
  amountWords(amount: number, subUnit: string): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
      'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const below100 = (n: number) => n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    const below1000 = (n: number) => (n >= 100 ? ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' : '') : '') + (n % 100 ? below100(n % 100) : '')
    const toWords = (n: number): string => {
      if (n === 0) { return 'Zero' }
      const parts: string[] = []
      const crore = Math.floor(n / 10000000); n %= 10000000
      const lakh = Math.floor(n / 100000); n %= 100000
      const thou = Math.floor(n / 1000); n %= 1000
      if (crore) { parts.push(below1000(crore) + ' Crore') }
      if (lakh) { parts.push(below100(lakh) + ' Lakh') }
      if (thou) { parts.push(below100(thou) + ' Thousand') }
      if (n) { parts.push(below1000(n)) }
      return parts.join(' ')
    }
    const neg = amount < 0
    const abs = Math.abs(amount)
    const whole = Math.floor(Math.round(abs * 100) / 100)
    const frac = Math.round((abs - whole) * 100)
    let w = toWords(whole)
    if (frac > 0 && subUnit) { w += ' And ' + subUnit + ' ' + toWords(frac) }
    return (neg ? 'Minus ' : '') + w + ' Only.'
  }

  /* ---------- build the whole printable model from the SP resultsets ---------- */
  build(res: any) {
    const T = (i: number): any[] => res['Table' + (i === 0 ? '' : i)] || []
    const foreign = this.inrtype == '1'
    const h = T(0)[0] || {}
    const c5 = T(5)[0] || {}

    /* company letterhead (result set 5) */
    const full = (this.v(c5, 'cmp_fullname') + '').trim()
    const bold = (this.v(c5, 'cmp_boldname') + '').trim()
    const suffix = full.replace(new RegExp('^\\s*' + bold.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '')
    const add1 = (this.v(c5, 'cmp_add1') + '').trim().replace(/,+$/, '').trim()
    const add2 = (this.v(c5, 'cmp_add2') + '').trim().replace(/,+$/, '').trim()
    const cityNm = (this.v(c5, 'city_name') + '').trim()
    let add3 = cityNm
    if ((this.v(c5, 'cmp_add3') + '').trim() !== '') { add3 = (add3 + ' - ' + (this.v(c5, 'cmp_add3') + '').trim()).trim() }
    const addr = [add1, add2, add3].filter(x => x !== '')
    const esic = (this.v(c5, 'esic_regd') + '').trim()
    const itno = (this.v(c5, 'incometaxno') + '').trim()
    this.cmp = {
      bold: this.properCase(bold),
      suffix: this.properCase(suffix).replace(/\bPvt\.?\s*Ltd\.?/i, 'Private Limited'),
      add: addr,
      tel: (this.v(c5, 'cmp_telno') + '').trim() !== '' ? 'Tel : ' + (this.v(c5, 'cmp_telno') + '').trim() : '',
      email: (this.v(c5, 'cmp_email') + '').trim() !== '' ? 'Email : ' + (this.v(c5, 'cmp_email') + '').trim() : '',
      gst: (this.v(c5, 'servicetax_regd') + '').replace(/\s+/g, ' ').trim(),
      title: 'CREDIT NOTE',
      fullAddress: addr.join(', '),
      forName: 'For ' + this.v(c5, 'cmp_name'),
      esic: esic !== '' ? 'Our ESIC Regd No. ' + esic : '',
      reg: itno !== '' ? 'Income Tax No. ' + itno : '',
      jurisdiction: this.properCase(cityNm)
    }

    /* party: EXP_COUNTRY carries "<country> <BR> GSTIN : x  STATE : y - nn <BR> PLACE OF SUPPLY : z" for GST-era notes */
    const ctryRaw = this.v(h, 'exp_country') + ''
    const country = (ctryRaw.split(/<br\s*\/?>/i)[0] || '').trim()
    const gstM = /GSTIN\s*:\s*([A-Za-z0-9]*)/i.exec(ctryRaw)
    const posM = /PLACE OF SUPPLY\s*:\s*([^<]*)/i.exec(ctryRaw)
    const partyGst = gstM ? gstM[1].trim() : ''
    const pos = posM ? posM[1].trim() : ''
    const cityLine = (this.v(h, 'exp_city') + '').trim()
    const addrLines = [this.v(h, 'exp_add1'), this.v(h, 'exp_add2'), this.v(h, 'exp_add3')]
      .map(x => (x + '').trim()).filter((x, i) => i < 2 || x !== '')
    addrLines.push((cityLine + (country !== '' ? ', ' + country : '')).toUpperCase())

    const jobs = T(1).map(r => (this.v(r, 'crt_jobno') + '').trim()).filter(x => x !== '')
    this.otherJobs = jobs.slice(1).join(', ')
    this.againstInvoices = T(3).map(r => (this.v(r, 'crt_invno') + '').trim()).filter(x => x !== '').join(', ')
    const narr = (this.v(h, 'narration') + '').replace(/<\/?(font|p|span|div)[^>]*>/gi, '')
    const curNm = (this.v(h, 'cur_name') + '').trim()
    const curSym = foreign ? this.curSymbol(curNm, '') : '₹'
    const clientNm = (this.v(h, 'clientname') + '').trim()
    const shipperNm = (this.v(h, 'exp_name') + '').trim()
    let pkgs = (this.v(h, 'crt_pkgs') + '').trim()
    const pkgType = (this.v(h, 'crt_typeofpkg') + '').trim()
    if (pkgs !== '' && pkgType !== '') { pkgs = pkgs + ' ' + pkgType }
    const wt = (this.v(h, 'crt_wt') + '').trim()
    if (wt !== '' && this.num(wt) !== 0) { pkgs = (pkgs + ' / ' + this.fmt(wt) + ' KGS').replace(/^\s*\/\s*/, '').trim() }
    let pcs = (this.v(h, 'crt_noofpcs') + '').trim()
    const pcsType = (this.v(h, 'crt_typeofpcs') + '').trim()
    if (pcs !== '' && pcsType !== '') { pcs = pcs + ' ' + pcsType }
    this.inv = {
      no: this.v(h, 'crt_no'), date: this.v(h, 'crt_date'),
      party: clientNm, addr: addrLines, partyGst: partyGst, pos: pos !== '' ? 'Place of Supply : ' + pos : '',
      shipper: shipperNm !== '' && shipperNm !== clientNm ? shipperNm : '',
      job: jobs[0] || '', ref: this.v(h, 'crt_clientref'),
      currency: foreign ? curNm : 'INR (INDIAN RUPEES)',
      billType: this.v(h, 'crt_billtype'),
      hbl: (this.v(h, 'crt_hawbno') + '').trim(), hblDt: this.v(h, 'crt_hawbdt'), carrier: this.v(h, 'crt_carrier'),
      pcs: pcs, pkgs: pkgs, vol: this.num(this.v(h, 'crt_vol')) !== 0 ? this.v(h, 'crt_vol') : '',
      contents: this.v(h, 'crt_goods'), narration: narr
    }
    this.hdr = { taxHead: 'Taxable (' + curSym + ')', ntaxHead: 'Non Taxable (' + curSym + ')', grandCur: curSym }

    /* charge lines (result set 2). CHRG_DESC1 = "[ SAC ] description" */
    this.charges = T(2).map((r, i) => {
      const d1 = (this.v(r, 'chrg_desc1') + '').replace(/\s+/g, ' ').trim()
      const m = /^\[\s*([^\]]*?)\s*\]\s*(.*)$/.exec(d1)
      const sac = m ? m[1] : ''
      const y = foreign ? this.num(this.v(r, 'taxableamt')) : this.num(this.v(r, 'taxable_amt_inr'))
      const n = foreign ? this.num(this.v(r, 'nontaxableamt')) : this.num(this.v(r, 'non_taxable_amt_inr'))
      return {
        sr: i + 1, sac: sac, desc: m ? m[2] : d1,
        yv: y, y: y !== 0 ? this.fmt(y) : '', n: n !== 0 ? this.fmt(n) : ''
      }
    })
    const t6 = T(6)[0] || {}
    const amtY = foreign ? this.num(this.v(t6, 'taxamt')) : this.num(this.v(t6, 'taxamt_inr'))
    const amtN = foreign ? this.num(this.v(t6, 'nontaxableamt')) : this.num(this.v(t6, 'nontaxableamt_inr'))

    /* GST rows (result set 8): CGST / SGST / IGST */
    let tsCG = 0, tsSG = 0, tsIG = 0, cgR = '', sgR = '', igR = ''
    this.taxRows = T(8).map(r => {
      const amt = this.num(foreign ? this.v(r, 'taxableamt') : this.v(r, 'taxableamtinr'))
      const base = this.num(foreign ? this.v(r, 'totcrt_amount') : this.v(r, 'totcrt_inramt'))
      const code = (this.v(r, 'crt_chrgcode') + '').trim()
      const snm = (this.v(r, 'sname') + '').toUpperCase()
      const rate = this.num(this.v(r, 'rate')).toFixed(2)
      if (code === '9961' || code === '9964' || snm.indexOf('CGST') >= 0 || snm.indexOf('CENTRAL') >= 0) { tsCG += amt; cgR = cgR || rate }
      else if (code === '9962' || code === '9965' || snm.indexOf('SGST') >= 0 || snm.indexOf('STATE') >= 0) { tsSG += amt; sgR = sgR || rate }
      else if (code === '9963' || code === '9966' || snm.indexOf('IGST') >= 0 || snm.indexOf('INTEGRATED') >= 0) { tsIG += amt; igR = igR || rate }
      return { label: this.gstShortName(code, this.v(r, 'sname')) + ' @ ' + rate + ' % on ' + this.fmt(base), amt: this.fmt(amt) }
    })

    /* SAC-wise tax summary: taxable base per SAC x the GST rates of this note; footer uses the actual GST rows */
    this.taxSum = null
    if (this.taxRows.length > 0) {
      const order: string[] = []
      const base: any = {}
      this.charges.forEach(c => {
        if (c.yv > 0) {
          const k = c.sac !== '' ? c.sac : '—'
          if (base[k] === undefined) { base[k] = 0; order.push(k) }
          base[k] += c.yv
        }
      })
      const dash = '—'
      const part = (b: number, rate: string) => (rate !== '' && this.num(rate) !== 0) ? Math.round(b * this.num(rate)) / 100 : 0
      const lines = order.map(k => {
        const cg = part(base[k], cgR), sg = part(base[k], sgR), ig = part(base[k], igR)
        return {
          sac: k, base: this.fmt(base[k]),
          cgR: cg !== 0 ? cgR : dash, cg: cg !== 0 ? this.fmt(cg) : dash,
          sgR: sg !== 0 ? sgR : dash, sg: sg !== 0 ? this.fmt(sg) : dash,
          igR: ig !== 0 ? igR : dash, ig: ig !== 0 ? this.fmt(ig) : dash,
          tot: this.fmt(cg + sg + ig)
        }
      })
      this.taxSum = {
        rows: lines,
        foot: { base: this.fmt(order.reduce((s, k) => s + base[k], 0)), cg: this.fmt(tsCG), sg: this.fmt(tsSG), ig: tsIG !== 0 ? this.fmt(tsIG) : dash, tot: this.fmt(tsCG + tsSG + tsIG) }
      }
    }

    /* totals: grand total comes from result set 4 exactly as the old print did */
    const t4 = T(4)[0] || {}
    const round = this.num(this.v(T(10)[0] || {}, 'roundvalue'))
    const taxAmt = tsCG + tsSG + tsIG
    let grand = this.num(foreign ? this.v(t4, 'totamt') : this.v(t4, 'totinramt'))
    if (grand === 0) { grand = amtY + amtN + taxAmt + round }
    const words = foreign
      ? 'TOTAL ' + curNm + ' : ' + this.amountWords(grand, this.curSubUnit(curNm, ''))
      : 'TOTAL RUPEES : ' + this.amountWords(grand, 'Paise')
    this.tot = {
      y: this.fmt(amtY), n: this.fmt(amtN), yn: this.fmt(amtY + amtN), grand: this.fmt(grand), words: words,
      showRound: !foreign || round !== 0, roundTxt: this.fmt(round)
    }

    /* e-invoice QR + IRN (result set 11) */
    this.qrSrc = ''; this.irnText = ''
    const t11 = T(11)[0]
    if (t11 && (this.v(t11, 'irnno') + '').trim() !== '') {
      this.irnText = 'IRN NO. : ' + (this.v(t11, 'irnno') + '').trim()
      const qr = (this.v(t11, 'qrcode') + '').trim()
      if (qr !== '') { this.renderQr(qr) }
    }
  }

  /* QR image from the e-invoice payload (npm "qrcode" package, rendered in the browser) */
  private renderQr(payload: string) {
    try {
      QRCode.toDataURL(payload, { errorCorrectionLevel: 'L', margin: 4, scale: 6 })
        .then((url: string) => { this.qrSrc = url })
        .catch(() => { this.qrSrc = '' })
    } catch (e) { this.qrSrc = '' }
  }

  /* alternative: the original .NET credit note print page */
  openDotNetPrint() {
    const l = this._loginService.getLogin()[0]
    const URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_CreditNote_Print.aspx?" +
      "huhpnk=" + l.GUID
      + "&citycode=" + l.CITYCODE1
      + "&Userid=" + l.CMPID
      + "&cmp_code=" + l.CMPCODE
      + "&CreditNoteNo=" + this.crt_number
      + "&DisplayMode=" + "0"
      + "&CurLogInIP=" + environment.edocumentIp
      + "&cmp_username=" + l.CMP_USERNAME
      + "&FinStartDate=" + l.FINANCIAL_YEAR.STARTDATE
      + "&FinEndDate=" + l.FINANCIAL_YEAR.ENDDATE
    const toolbar = 'resizable=yes,scrollbars=yes,width=900,height=700,status=no,left=' + ((screen.width / 2) - 450) + ',top=' + ((screen.height / 2) - 350)
    window.open(URL, "CreditNote Print .NET", toolbar)
  }

  /* the .NET-style layout (exact copy of the .NET page), kept as a backup */
  openNetFormat() {
    const toolbar = 'resizable=yes,scrollbars=yes,width=900,height=700,status=no,left=' + ((screen.width / 2) - 450) + ',top=' + ((screen.height / 2) - 350)
    window.open('./#/popup/Account-CreditNote-print-net/' + this.crt_number + '/', "CreditNote Print", toolbar)
  }

  PrintElem() {
    var data = document.getElementById('demo').innerHTML;
    var mywindow = window.open('', 'Accounts - Credit Note Print', 'height=800,width=900');
    mywindow.document.write('<html><head><title>Accounts - Credit Note Print</title><style>' + CREDITNOTE_CSS + '</style>');
    mywindow.document.write('</head><body>');
    mywindow.document.write(data);
    mywindow.document.write('</body></html>');
    mywindow.document.close();
    mywindow.onload = function () {
      mywindow.focus();
      mywindow.print();
      mywindow.close();
    };
    return true;
  }
}
