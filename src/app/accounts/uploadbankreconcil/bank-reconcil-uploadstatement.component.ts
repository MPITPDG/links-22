import { Component, OnInit, ViewChild, EventEmitter, Output, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient} from  '@angular/common/http';;
import { DataService } from '../../shared/service/dataService';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { LoginService } from '../../shared/service/loginService';
import {Configuration}  from '../../app.constants'
import { LoaderService } from '../../shared/service/loader.service';
import { IMyDpOptions } from 'mydatepicker';
import { Router, ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';
@Component({
    selector: 'app-bankreconcil-uploadstatement',
    templateUrl: './bank-reconcil-uploadstatement.component.html',
    // MPERPNG-20 layout: the page kit (import-page / accreport-page) is GLOBAL in Links; the host class opts in.
    styleUrls: [],
    host: { class: 'kit-accreport' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
  export class UploadBankReconcil implements OnInit {

    public myDatePickerOptions: IMyDpOptions = {
      dateFormat: 'dd/mm/yyyy',
     inline: false,
     height: '16px',
     width: '120px',
     componentDisabled: false,
     selectionTxtFontSize: '12px',
     editableDateField: false,
     sunHighlight: true,
     satHighlight: true,
     firstDayOfWeek: 'su',
     openSelectorTopOfInput: false,
     openSelectorOnInputClick: true,
     selectorHeight: '180px',
     selectorWidth: '200px'

   };
    @ViewChild('inputFile',{static:false}) myInputVariable: ElementRef;
    //form: FormGroup;
    displayType: string = 'SEARCH';
    // 'REC' | 'UNREC' -- drives the result tabs. Plain Angular state rather than
    // bootstrap's data-toggle, so the tabs work without the bootstrap JS bundle.
    activeTab: string = 'REC';
    Header:string="Upload Bank Reconciliation Statement";
    filesToUpload: Array<File>;
    selectedFileNames: string[] = [];
    FileName:string;
    selectedFile: File=null;
    fileToUpload: File | null = null;
    selfilename:string="";
    uploadurl:string="";
    url:string="";
    selectedfile:File=null;
    FromDate;
    ToDate;
    BankList:any = [];
    ourbank:string;
    reconcildataList = [];
    unreconcildataList = [];
    reconcilrecord:any = 0;
    unreconcilrecord:any = 0;
    // Date range detected inside the selected workbook. Best-effort only -- if
    // the layout is not recognised these stay null and the period check is
    // skipped rather than blocking the upload.
    stmtFrom: Date = null;
    stmtTo: Date = null;
    stmtPeriodText: string = "";
    // Account number / currency found in the chosen file; used to stop a statement going against the wrong bank.
    stmtAccount: string = "";
    stmtAccountFromSheet: boolean = false;
    stmtCurrency: string = "";
   myForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    file: new FormControl('', [Validators.required]),
    fileSource: new FormControl<any>('', [Validators.required])
  });
  @Output() public onUploadFinished = new EventEmitter();
  snackbar: any;
    constructor(
        private _dataService: DataService,
        private http: HttpClient,
        private _loginService: LoginService,
        private _config:Configuration,
        private _loaderService: LoaderService,
        private _router: Router,
      ) {
    }
        ngOnInit() {
          this.uploadurl=this._config.ServerWithApiUrl;
          // V2 runs USP_ACC_BANKRECONCIL_UPDATECLEARANCEDT_V2, which derives the
          // ledger search window from the dates inside the uploaded file instead
          // of from the logged-in financial year start. Point back at
          // "Accounts/UploadBnkReconcilFile" to fall back to the original proc.
          this.url=this.uploadurl + "Accounts/UploadBnkReconcilFileV2";
          this.FillAccount();
        }
        onFileChange(event) {
          this.stmtFrom = null;
          this.stmtTo = null;
          this.stmtPeriodText = "";
          this.selectedFile = (event.target.files && event.target.files.length > 0)
            ? event.target.files[0]
            : null;
          if (!this.selectedFile) {
            this.selfilename = "";
            return;
          }
          this.selfilename = this.selectedFile.name;
          this.myForm.patchValue({ fileSource: this.selectedFile });
          this.readStatementPeriod(this.selectedFile);
        }

        /* Read the DATE column out of the workbook so the user can see which
           month they actually picked, and so upload() can warn on a mismatch.
           Every failure path here is silent on purpose: a detection miss must
           never stop a valid upload. */
        private readStatementPeriod(file: File) {
          this.stmtAccount = "";
          this.stmtAccountFromSheet = false;
          this.stmtCurrency = "";
          // the file name of both banks carries the account number; a number read from inside the sheet replaces it
          const nameRuns = (file.name || '').replace(/\.[^.]+$/, '').match(/\d{9,}/g);
          if (nameRuns) { this.stmtAccount = nameRuns.reduce((a, b) => (b.length > a.length ? b : a), ''); }
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const wb = XLSX.read(new Uint8Array(reader.result as ArrayBuffer),
                                   { type: 'array', cellDates: true });
              const ws = wb.Sheets[wb.SheetNames[0]];
              if (!ws) { return; }
              const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
              this.readAccountInfo(rows, file.name);
              const col = this.findDateColumn(rows);
              if (col < 0) { return; }
              let min: Date = null;
              let max: Date = null;
              for (const row of rows) {
                const d = this.toDate(row ? row[col] : null);
                if (!d) { continue; }
                if (!min || d < min) { min = d; }
                if (!max || d > max) { max = d; }
              }
              if (min && max) {
                this.stmtFrom = min;
                this.stmtTo = max;
                this.stmtPeriodText = this._dataService.datechnge(min) + ' to ' + this._dataService.datechnge(max);
                // fill the dates from the file when the user has not typed any
                if (!this.FromDate && !this.ToDate) { this.useFilePeriod(); }
              }
            } catch (e) {
              // unreadable, protected, or an unexpected layout -- skip the check
            }
          };
          reader.readAsArrayBuffer(file);
        }

        /* Prefer a column literally headed "Date"; otherwise fall back to
           whichever column yields the most parseable dates. */
        private findDateColumn(rows: any[][]): number {
          const scan = Math.min(rows.length, 10);
          for (let r = 0; r < scan; r++) {
            const row = rows[r] || [];
            for (let c = 0; c < row.length; c++) {
              if (typeof row[c] === 'string' && /^\s*(txn\s*|transaction\s*|value\s*|tran\s*)?date\s*$/i.test(row[c])) {
                return c;
              }
            }
          }
          const hits: number[] = [];
          for (const row of rows) {
            if (!row) { continue; }
            for (let c = 0; c < row.length; c++) {
              if (this.toDate(row[c])) { hits[c] = (hits[c] || 0) + 1; }
            }
          }
          let best = -1;
          for (let c = 0; c < hits.length; c++) {
            if ((hits[c] || 0) >= 3 && (best < 0 || hits[c] > hits[best])) { best = c; }
          }
          return best;
        }

        /* Accepts what xlsx returns: a real Date (cellDates), or a dd/MM/yyyy
           string. Ambiguous formats are rejected on purpose -- guessing wrong
           produces a false mismatch warning, which is worse than no warning. */
        private toDate(v: any): Date {
          if (v instanceof Date && !isNaN(v.getTime())) { return v; }
          if (typeof v === 'string') {
            const mon = v.trim().match(/^(\d{1,2})[\- ]([A-Za-z]{3})[\- ](\d{4})$/);
            if (mon) {
              const idx = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(mon[2].toLowerCase());
              if (idx >= 0) {
                const d = new Date(+mon[3], idx, +mon[1]);
                if (d.getFullYear() === +mon[3] && d.getMonth() === idx && d.getDate() === +mon[1]) { return d; }
              }
            }
            const m = v.trim().match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
            if (m) {
              const dd = +m[1], mm = +m[2], yyyy = +m[3];
              const d = new Date(yyyy, mm - 1, dd);
              if (d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd) {
                return d;
              }
            }
          }
          return null;
        }

        /* Warn, never block. Bank statement cycles legitimately straddle month
           ends, so a strict range check would lock users out of valid uploads.
           The goal is catching the wrong FILE, not policing a day of drift. */
        useFilePeriod() {
          if (!this.stmtFrom || !this.stmtTo) { return; }
          this.FromDate = this._dataService.datechnge(this.stmtFrom);
          this.ToDate = this._dataService.datechnge(this.stmtTo);
        }

        /* Rule 1: transactions outside From..To are refused (they would never be matched).
           Rule 2: a range wider than the file by more than a few days asks for confirmation. */
        private confirmStatementPeriod(): boolean {
          if (!this.stmtFrom || !this.stmtTo) { return true; }
          const from = this.toDate(this.FromDate);
          const to = this.toDate(this.ToDate);
          if (!from || !to) { return true; }
          const day = 24 * 60 * 60 * 1000;
          const t = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          if (t(this.stmtFrom) < t(from) || t(this.stmtTo) > t(to)) {
            alert('The file contains transactions from ' + this.stmtPeriodText + ', which is outside the period you entered ('
              + this.FromDate + ' to ' + this.ToDate + ').\n\nWiden the dates (or use the file period) and try again.\n\nNothing was uploaded.');
            return false;
          }
          const slack = 3 * day;
          if (t(this.stmtFrom) - t(from) > slack || t(to) - t(this.stmtTo) > slack) {
            return confirm('The file covers ' + this.stmtPeriodText + ', but you entered ' + this.FromDate + ' to ' + this.ToDate + '.\n\n'
              + 'A wider period than the statement can block a later upload for the missing dates.\n\nUpload with these dates anyway?');
          }
          return true;
        }

        /* ---- Which bank is this statement for? ----
           Read from inside the workbook (a "Account Number" cell, or "Account Details for" followed by the number),
           otherwise from the file name. The API repeats this check and is the one that refuses the upload; this copy only
           warns early. Same rule: the number in the file must belong to the bank selected above. */
        private readAccountInfo(rows: any[][], fileName: string) {
          const longestRun = (text: string, min: number): string => {
            let best = '';
            const runs = (text || '').match(/\d+/g) || [];
            for (const r of runs) { if (r.length >= min && r.length > best.length) { best = r; } }
            return best;
          };
          const fromText = (text: string): string => {
            const digits = longestRun(text, 9);
            if (digits) { return digits; }
            const mask = (text || '').match(/[Xx*]{2,}\d{3,6}/);
            return mask ? mask[0] : '';
          };
          const scan = Math.min(rows.length, 40);
          for (let r = 0; r < scan; r++) {
            const row = rows[r] || [];
            const low: string[] = [];
            for (let c = 0; c < row.length; c++) {
              low[c] = (row[c] === undefined || row[c] === null) ? '' : String(row[c]).trim().toLowerCase();
            }
            if (low.indexOf('debit') >= 0 && low.indexOf('credit') >= 0) { break; }   // the transactions start here
            const next = (c: number): string => {
              for (let k = c + 1; k < row.length; k++) {
                const v = (row[k] === undefined || row[k] === null) ? '' : String(row[k]).trim();
                if (v) { return v; }
              }
              return '';
            };
            for (let c = 0; c < row.length; c++) {
              const label = (low[c] || '').replace(/\s+/g, ' ').replace(/[:\s]+$/, '');
              if (!label) { continue; }
              if (!this.stmtAccountFromSheet && /^account (number|no\.?|no|#)$/.test(label)) {
                const acc = fromText(next(c));
                if (acc) { this.stmtAccount = acc; this.stmtAccountFromSheet = true; }
              } else if (!this.stmtAccountFromSheet && label === 'account details for') {
                const v = next(c);
                const acc = fromText(v);
                if (acc) { this.stmtAccount = acc; this.stmtAccountFromSheet = true; }
                const cur = v.match(/\b([A-Z]{3})\s*$/);
                if (cur && !this.stmtCurrency) { this.stmtCurrency = cur[1]; }
              } else if (label === 'currency' && !this.stmtCurrency) {
                const v = next(c).toUpperCase();
                if (/^[A-Z]{3}$/.test(v)) { this.stmtCurrency = v; }
              }
            }
          }
        }

        private sameAccount(expected: string, detected: string): boolean {
          if (!expected || !detected) { return false; }
          if (/[Xx*]/.test(detected)) {
            const m = detected.match(/\d+$/);
            return !!m && m[0].length >= 3 && expected.endsWith(m[0]);
          }
          return expected.replace(/^0+/, '') === detected.replace(/^0+/, '');
        }

        /* '' when the file may be uploaded against the selected bank, otherwise the message to show. */
        bankCheckMessage(): string {
          if (!this.stmtAccount || !this.ourbank) { return ''; }
          const banks: any[] = this.BankList || [];
          const sel = banks.find(b => b.acctcodename === this.ourbank);
          if (!sel) { return ''; }
          const clean = (n: string) => (n || '').replace(/\s*\[[^\]]*\]\s*$/, '').trim();
          const numbers = (n: string): string[] => (n || '').match(/\d{6,}/g) || [];
          const expected = numbers(sel.acctname);
          if (expected.some(e => this.sameAccount(e, this.stmtAccount))) {
            const cm = (sel.acctname || '').match(/\b(INR|USD|EUR|GBP|AED|SGD|JPY|CNY|AUD|CAD|CHF|HKD)\b/i);
            if (cm && this.stmtCurrency && cm[1].toUpperCase() !== this.stmtCurrency.toUpperCase()) {
              return 'The statement currency is ' + this.stmtCurrency + ', but the selected bank is ' + clean(sel.acctname)
                + '. Select the bank the statement belongs to.';
            }
            return '';
          }
          const other = banks.find(b => numbers(b.acctname).some(e => this.sameAccount(e, this.stmtAccount)));
          const reject = this.stmtAccountFromSheet ? (expected.length > 0 || !!other) : !!other;
          if (!reject) { return ''; }
          return 'This statement is for account ' + this.stmtAccount + (other ? ' (' + clean(other.acctname) + ')' : '')
            + ', but the selected bank is ' + clean(sel.acctname) + '. Select the bank the statement belongs to.';
        }

        private resetFileInput() {
          this.selectedFile = null;
          this.selfilename = "";
          this.stmtFrom = null;
          this.stmtTo = null;
          this.stmtPeriodText = "";
          this.stmtAccount = "";
          this.stmtAccountFromSheet = false;
          this.stmtCurrency = "";
          if (this.myInputVariable && this.myInputVariable.nativeElement) {
            this.myInputVariable.nativeElement.value = "";
          }
        }
        FillAccount(){
          const jsonBank= {
          cmpcode: this._loginService.getLogin()[0].CMPCODE,
          citycode: this._loginService.getLogin()[0].CITYCODE,
          citycode1: this._loginService.getLogin()[0].CITYCODE1
          }
          this._dataService.getData("Accounts/Acc_CashBook_FillOurbank", jsonBank)
          .subscribe((data: any) => {
          this.BankList = data.Table
          this._loaderService.display(false)
          })
          }
          FromDateChanged(ev){
            this.FromDate=ev.formatted
            }
          ToDateChanged(ev){
            this.ToDate=ev.formatted
            }
        upload(){
          if(this.ourbank== undefined || this.ourbank== ""){
            alert('Please select our bank');
            return false;
          }
          if(this.FromDate== undefined || this.FromDate== ""){
            alert('Please select from date');
            return false;
          }
          if(this.ToDate== undefined || this.ToDate== ""){
            alert('Please select to date');
            return false;
          }
          if(this._dataService.date2Comparison(this.FromDate, this.ToDate) == false){
            alert('To date should be greater than or equal to from date');
            return false;
          }
          if(this.selectedFile== undefined || this.selectedFile== null){
            alert('Please select file to upload');
            return false;
          }
          const bankMsg = this.bankCheckMessage();
          if (bankMsg) {
            alert(bankMsg + '\n\nNothing was uploaded.');
            return false;
          }
          if(!this.confirmStatementPeriod()){
            return false;
          }
          this._loaderService.display(true);
          const filedata=new FormData();
          filedata.append("file",this.selectedFile,this.selectedFile.name)
          filedata.append("cmpid",this._loginService.getLogin()[0].CMPID)
          filedata.append("vguid",this._loginService.getLogin()[0].GUID)
          filedata.append("makerip",this._loginService.getLogin()[0].MAKERIP)
          filedata.append("cmpcode",this._loginService.getLogin()[0].CMPCODE)
          filedata.append("citycode",this._loginService.getLogin()[0].CITYCODE)
          filedata.append("citycode1",this._loginService.getLogin()[0].CITYCODE1)
          filedata.append("ourbank",this.ourbank)
          // The statement period the user declared. The proc no longer uses
          // these to bound matching -- it derives that window from the dates
          // inside the file -- so a mis-picked date can no longer suppress
          // matches the way the hardcoded financial year start did.
          filedata.append("fromdt",this.FromDate)
          filedata.append("todt",this.ToDate)
         this.http.post(this.url,filedata)
        //  this.http.post("http://localhost:58899/api/Accounts/UploadBnkReconcilFileV2",filedata)
          .subscribe((data: any) => {
            // The API puts its STATUS/MSG row in a different table depending on
            // the outcome:
            //   success   -> Table = reconciled, Table1 = unreconciled,
            //                Table2 = {STATUS 100, MSG}
            //   rejected  -> Table = {STATUS 104, MSG}, nothing else
            // (e.g. re-uploading a filename that already exists on the server).
            // So locate it by shape rather than by a fixed index -- reading
            // Table1[0].STATUS unconditionally is what used to throw and leave
            // the user with no message at all.
            const statusOf = (key) => {
              const t = data ? data[key] : null;
              return (t && t.length > 0 && t[0]
                      && t[0].STATUS !== undefined && t[0].MSG !== undefined) ? t[0] : null;
            };
            let statusKey = null;
            let status = null;
            for (const key of ['Table2', 'Table', 'Table1']) {
              status = statusOf(key);
              if (status) { statusKey = key; break; }
            }

            if(!status){
              alert('Upload failed: unexpected response from the server.');
            }
            else if(status.STATUS == "100"){
              this.displayType="LIST";
              this.activeTab="REC";
              // Only trust Table/Table1 as data when the status row came from
              // Table2; otherwise Table IS the status row.
              this.reconcildataList = (statusKey === 'Table2') ? (data.Table || []) : [];
              this.unreconcildataList = (statusKey === 'Table2') ? (data.Table1 || []) : [];
              this.reconcilrecord = this.reconcildataList.length;
              this.unreconcilrecord = this.unreconcildataList.length;
              alert(status.MSG);
            }
            else {
              alert(status.MSG || ('Upload failed (status ' + status.STATUS + ').'));
            }
            this.resetFileInput();
            this._loaderService.display(false);
            },
            (error: any) => {
              // Without this the spinner runs forever on a 500 -- and the proc
              // now raises a real error for an unparseable statement.
              this._loaderService.display(false);
              const msg = (error && error.error && error.error.Message) ? error.error.Message
                        : (error && error.message) ? error.message
                        : 'server error';
              alert('Upload failed: ' + msg);
            });
        }
        back(){
          this.reconcildataList=[];
          this.unreconcildataList=[];
          this._router.navigate(['/accounts/uploadbankreconcil/uploadStatementsearch']);
        }

}
