import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoaderService } from '../../shared/service/loader.service';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import QRCode from 'qrcode';


/*  CREDIT NOTE print - exact Angular copy of Links frm_Acc_Tran_CreditNote_Print.aspx (+ .aspx.vb).
    Flow, same as the .NET page:
      1. USP_ACC_CREDITNOTE_PRINT_AUTHORISATION_CHECK  (Accounts/ACC_creditNote_AUTHORISATION_CHECK)  -> may block printing (authorisation / IRN pending)
      2. USP_ACC_CHK_CREDITNOTE_NONINR                 (Accounts/ACC_creditNote_Chk_Inv_NONINR)       -> PRINT1 = 1 asks INR / NON INR, else INR directly
      3. usp_Acct_N_CreditNote_Print                   (Accounts/ACC_CN_view, type "Print")            -> the note itself
    Result sets of step 3: 0 header, 1 jobs, 2 charges, 4 totals, 5 company, 6 taxable / non-taxable totals,
    7 + 8 GST rows, 10 round off, 11 IRN + QR.
    Numbers use the .NET Format "0.00" (no thousands separator). BACKUP copy: the default print page is the invoice-style creditnote-print.component (route Account-CreditNote-print).   */
const CN_CSS = `
.cnprint { font-family: Verdana, Arial; font-size: 8pt; color: black; }
.Rpt_Label_content { font-size: 8pt; color: black; font-family: Verdana, Arial; }
.Rpt_Label { font-weight: bold; font-size: 8pt; color: black; font-family: Verdana, Arial; }
.Rpt_CodeDate { font-weight: bold; font-size: 9pt; color: black; font-family: Verdana, Arial; }
.cnprint .box { border: 1px solid; margin: 0 auto; width: 700px; }
.cnprint .bb { border-bottom: 1px solid; }
.cnprint .bl { border-left: 1px solid; }
.cnprint .bt { border-top: 1px solid; }
.cnprint .pl { padding-left: 2px; }
.cnprint .pr { padding-right: 3px; }
.cnprint table.ct { width: 100%; table-layout: fixed; border-collapse: collapse; }
.cnprint table.ct col.amtcol { width: 80px; }
.cnprint table.ct td { word-wrap: break-word; }
.cnprint table.ct td.amt { text-align: right; white-space: nowrap; overflow: hidden; padding-right: 3px; }
.cnprint .colon { font-size: x-small; font-family: Arial; font-weight: bold; }
.cnprint .cur-panel { left: 224px; position: absolute; top: 168px; }
.cnprint .cur-panel .pnl { width: 312px; background-color: #D8E4F8; text-align: center; }
`;

@Component({
  selector: 'app-creditnote-print-net',
  templateUrl: './creditnote-print-net.component.html',
  styles: [CN_CSS],
  // On-screen chrome only (Print bar, currency picker) from the global kit; the printed #demo is untouched.
  host: { class: 'kit-print' },
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class CreditnotePrintNetComponent implements OnInit {
  crt_number: string = ""
  showModal: boolean = false        // INR / NON INR panel (Panel1)
  printmodal: boolean = false       // the credit note itself
  exampleRadios1: string = '0'      // optINR: '0' INR Credit Note, '1' NON INR Credit Note
  inrtype: string = ""              // DisplayMode: '0' INR, '1' NON INR
  authFlag: string = ""             // HdPrintAuhority

  /* view model, filled by build() - one field per label of the .NET page */
  m: any = {}
  charges: any[] = []
  gstDesc: any[] = []
  gstAmt: any[] = []
  hasGst: boolean = false
  foreign: boolean = false
  qrSrc: string = ""

  constructor(public _dataService: DataService,
    private _route: ActivatedRoute, public _loginService: LoginService,
    private _loaderService: LoaderService) { }

  ngOnInit() {
    this._route.params.subscribe(params => {
      this.crt_number = params["CrtNo"]
      this.authCheck(params["CrtNo"]);
    });
  }

  /* Print_pageload: STATUS = "<code>#<crtno>#<message>" */
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
            this.modeCheck()
          } else {
            alert(msg)
            window.close()
          }
        } else if (code == '103') {
          alert('No Records Found')
        }
      })
  }
  /* PRINT1 = 1 (credit note is in a foreign currency) -> ask INR / NON INR, otherwise print INR straight away */
  modeCheck() {
    const jsonmaster = {
      invno: this.crt_number,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE
    }
    this._dataService.getData("Accounts/ACC_creditNote_Chk_Inv_NONINR", jsonmaster)
      .subscribe((res: any) => {
        const r = res && res.Table && res.Table[0]
        if (r) { this.authFlag = this.v(r, 'AUTHORISEDTOPRINT') + '' }
        if (r && this.v(r, 'PRINT1') == '1') {
          this.showModal = true
        } else {
          this.inrtype = '0'
          this.printmodal = true
          this.printdata()
        }
      })
  }
  /* btnPrint_Click */
  currencyType(d) {
    this.inrtype = d
    this.showModal = false
    if (this.authFlag == '1') {
      this.printmodal = true
      this.printdata()
    } else {
      alert('You can not Print Credit Note No. [' + this.crt_number + '] \n  Because Authorisation is Pending !!')
      window.close()
    }
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

  /* ---------- helpers ---------- */
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
  /* VB Format(x, "0.00") */
  private f2(x: any): string {
    return this.num(x).toFixed(2)
  }
  private t(x: any): string {
    return (x === null || x === undefined ? '' : x + '').trim()
  }
  /* Exact port of Links_V4 App_Code\BaseBLL\Accounts\BLL_Acc_CommonFunctions.vb: Amt2Wrds / AmtCnvrt / FillNumbers.
     Indian system (Crore / Lakh / Thousand / Hundred), paise written in words, e.g.
     "Eleven Thousand Ninety Two Only."  /  "Five Hundred Twenty Five And Paise Nineteen Only."  */
  private mNos(): string[] {
    const o = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
      'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const t = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const a: string[] = []
    for (let i = 0; i < 100; i++) { a.push(i < 20 ? o[i] : t[Math.floor(i / 10)] + (i % 10 ? ' ' + o[i % 10] : '')) }
    return a
  }
  private amtCnvrt(pNo: number, pStr: string): string {
    return this.mNos()[pNo] + ' ' + pStr
  }
  amt2Wrds(pAmount: number): string {
    let r = ''
    const s = Math.abs(pAmount).toFixed(2)                 // Format(Math.Abs(pAmount), "######0.00")
    let mAmt = s.substring(0, s.length - 3)
    const mChrAmt = s.substring(s.length - 2)
    let mLenAmt = mAmt.length
    if (parseInt(mAmt, 10) === 0) { mLenAmt = 0 }
    if (mLenAmt === 0) {
      r += 'Zero '
    } else {
      if (mLenAmt > 9) { return r }                         // VB: Exit Function (returns nothing)
      if (mLenAmt > 7) {
        r += this.amtCnvrt(parseInt(mAmt.substring(0, mLenAmt - 7), 10), 'Crore ')
        mAmt = parseInt(mAmt.slice(-7), 10) + ''; mLenAmt = mAmt.length
      }
      if (mLenAmt > 5) {
        r += this.amtCnvrt(parseInt(mAmt.substring(0, mLenAmt - 5), 10), 'Lakh ')
        mAmt = parseInt(mAmt.slice(-5), 10) + ''; mLenAmt = mAmt.length
      }
      if (mLenAmt > 3) {
        r += this.amtCnvrt(parseInt(mAmt.substring(0, mLenAmt - 3), 10), 'Thousand ')
        mAmt = parseInt(mAmt.slice(-3), 10) + ''; mLenAmt = mAmt.length
      }
      if (mLenAmt === 3) {
        r += this.amtCnvrt(parseInt(mAmt.substring(0, mLenAmt - 2), 10), 'Hundred ')
        mAmt = parseInt(mAmt.slice(-2), 10) + ''; mLenAmt = mAmt.length
      }
      if (mLenAmt < 3 && parseInt(mAmt, 10) !== 0) {
        r += this.amtCnvrt(parseInt(mAmt, 10), '')
      }
    }
    if (parseInt(mChrAmt, 10) > 0) {
      r += 'And Paise '
      r += this.amtCnvrt(parseInt(mChrAmt, 10), 'Only.')
    } else {
      r += 'Only. '
    }
    return r.trim()
  }

  /* ---------- PrintCrNote: fill every label of the .NET page ---------- */
  build(res: any) {
    const T = (i: number): any[] => res['Table' + (i === 0 ? '' : i)] || []
    const foreign = this.inrtype == '1'
    this.foreign = foreign
    const h = T(0)[0] || {}
    const c5 = T(5)[0] || {}
    const m: any = {}

    /* company header: image when cmp_image is set, otherwise the text header */
    const cmpname = this.v(c5, 'cmp_fullname') + ''
    const cmpboldnm = this.v(c5, 'cmp_boldname') + ''
    const cmpimage = this.t(this.v(c5, 'cmp_image'))
    m.image = cmpimage !== '' ? 'assets/img/' + cmpimage : ''
    m.boldName = cmpboldnm.trim()
    m.suffixName = cmpboldnm !== '' ? cmpname.split(cmpboldnm).join('') : cmpname
    m.add1 = this.v(c5, 'cmp_add1')
    m.add2 = this.v(c5, 'cmp_add2')
    m.add3 = this.v(c5, 'city_name')
    m.tel = this.v(c5, 'cmp_telno')
    m.fax = this.v(c5, 'cmp_faxno')
    m.email = this.v(c5, 'cmp_email')
    m.forName = 'For ' + this.v(c5, 'cmp_name')
    m.taxReg = this.v(c5, 'servicetax_regd') + '<br>' + 'Our ESIC Regd No. ' + this.v(c5, 'esic_regd')

    /* credit note no / date */
    m.no = 'No. ' + this.crt_number
    m.date = 'DATE : ' + this.v(h, 'crt_date')

    /* client block (tbl_exp_mst) */
    let exp = '<b>' + this.t(this.v(h, 'clientname')) + '</b>'
      + '<br>' + this.t(this.v(h, 'exp_add1'))
      + '<br>' + this.t(this.v(h, 'exp_add2'))
    const add3 = this.t(this.v(h, 'exp_add3'))
    if (add3 !== '') { exp += '<br>' + add3 }
    const city = this.t(this.v(h, 'exp_city')) + ' - ' + this.t(this.v(h, 'exp_pincode'))
    const country = this.t(this.v(h, 'exp_country'))
    exp += '<br>' + city.toUpperCase() + ', ' + country.toUpperCase()
    m.client = exp

    m.carrier = this.v(h, 'crt_carrier')
    m.hbl = this.v(h, 'crt_hawbno')
    m.hblDt = this.v(h, 'crt_hawbdt')
    m.contents = this.v(h, 'crt_goods')
    m.urRef = this.v(h, 'crt_clientref')
    m.pcs = this.v(h, 'crt_noofpcs')
    m.narration = this.v(h, 'narration')
    m.taxHead = (foreign ? this.t(this.v(h, 'cur_name')) : '') + 'Taxable'
    m.ntaxHead = (foreign ? this.t(this.v(h, 'cur_name')) : '') + 'Non Taxable'

    /* job numbers: first job -> OUR REF, the others above the narration */
    const jobs = T(1).map(r => this.t(this.v(r, 'crt_jobno')))
    m.job = jobs.length > 0 ? jobs[0] : ''
    m.otherJobs = jobs.slice(1).join(', ')

    /* charges (result set 2) and the Taxable / Non Taxable totals (result set 6) */
    this.charges = T(2).map(r => {
      const tax = foreign ? this.num(this.v(r, 'taxamt')) : this.num(this.v(r, 'taxable_amt_inr'))
      const ntax = foreign ? this.num(this.v(r, 'nontaxableamt')) : this.num(this.v(r, 'non_taxable_amt_inr'))
      return { desc: this.v(r, 'chrg_desc1'), y: tax > 0 ? this.f2(tax) : '', n: ntax > 0 ? this.f2(ntax) : '' }
    })
    const t6 = T(6)[0] || {}
    const t4 = T(4)[0] || {}
    let amtY = 0, amtN = 0
    if (foreign) {
      amtY = this.num(this.v(t6, 'taxamt'))
      if (this.num(this.v(t6, 'taxamt')) === 0 && this.num(this.v(t6, 'nontaxableamt')) === 0) {
        amtN = this.num(this.v(t4, 'totamt'))
      } else {
        amtN = this.num(this.v(t6, 'nontaxableamt'))
      }
    } else {
      amtY = this.num(this.v(t6, 'taxamt_inr'))
      amtN = this.num(this.v(t6, 'nontaxableamt_inr'))
    }
    m.amtY = this.f2(amtY)
    m.amtN = this.f2(amtN)

    /* GST rows: description column (tdTaxableAmt) and amount column (tdTotalTaxableAmt) */
    const t8 = T(8)
    this.hasGst = T(7).length > 0 && t8.length > 0
    this.gstDesc = t8.map(r => {
      const base = foreign ? this.num(this.v(r, 'totcrt_amount')) : this.num(this.v(r, 'totcrt_inramt'))
      const desc = base !== 0 ? this.f2(base) : this.v(r, 'des1')
      return {
        text: this.v(r, 'sname') + ' @ ' + this.v(r, 'crt_desc') + ' % ON ' + desc,
        amt: foreign ? this.v(r, 'taxableamt') : ''
      }
    })
    this.gstAmt = t8.map(r => this.f2(foreign ? this.v(r, 'taxableamt') : this.v(r, 'taxableamtinr')))

    /* grand total, words, round off */
    const total = this.num(foreign ? this.v(t4, 'totamt') : this.v(t4, 'totinramt'))
    m.words = this.amt2Wrds(total)
    m.total = this.f2(total)
    if (foreign) {
      m.rounded = ''
      m.roundedValue = ''
    } else {
      m.rounded = 'Amount Rounded off'
      const rv = this.v(T(10)[0] || {}, 'roundvalue')
      m.roundedValue = rv === '' ? '' : this.f2(rv)
    }

    /* IRN + QR */
    m.irn = ''
    this.qrSrc = ''
    const t11 = T(11)[0]
    if (t11) {
      const irn = this.t(this.v(t11, 'irnno'))
      if (irn !== '') { m.irn = 'IRN : ' + this.v(t11, 'irnno') }
      const qr = this.t(this.v(t11, 'qrcode'))
      if (m.irn !== '' && qr !== '') { this.renderQr(qr) }
    }
    this.m = m
  }

  /* QR image from the e-invoice payload (npm "qrcode" package, rendered in the browser) */
  private renderQr(payload: string) {
    try {
      QRCode.toDataURL(payload, { errorCorrectionLevel: 'L', margin: 4, width: 250 })
        .then((url: string) => { this.qrSrc = url })
        .catch(() => { this.qrSrc = '' })
    } catch (e) { this.qrSrc = '' }
  }

  /* the default (invoice-style) layout */
  openInvoiceFormat() {
    const toolbar = 'resizable=yes,scrollbars=yes,width=900,height=700,status=no,left=' + ((screen.width / 2) - 450) + ',top=' + ((screen.height / 2) - 350)
    window.open('./#/popup/Account-CreditNote-print/' + this.crt_number + '/', "CreditNote Print invoice format", toolbar)
  }

  PrintElem() {
    var data = document.getElementById('demo').innerHTML;
    var mywindow = window.open('', 'Accounts - Credit Note Print', 'height=800,width=900');
    mywindow.document.write('<html><head><title>Account CreditNote Print</title><style>' + CN_CSS + '</style>');
    mywindow.document.write('</head><body><div class="cnprint">');
    mywindow.document.write(data);
    mywindow.document.write('</div></body></html>');
    mywindow.document.close();
    mywindow.onload = function () {
      mywindow.focus();
      mywindow.print();
      mywindow.close();
    };
    return true;
  }
}
