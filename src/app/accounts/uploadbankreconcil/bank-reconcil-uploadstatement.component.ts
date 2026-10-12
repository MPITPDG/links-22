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
    styleUrls: ['./bank-reconcil-uploadstatement.component.css'],
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
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const wb = XLSX.read(new Uint8Array(reader.result as ArrayBuffer),
                                   { type: 'array', cellDates: true });
              const ws = wb.Sheets[wb.SheetNames[0]];
              if (!ws) { return; }
              const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
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
              if (typeof row[c] === 'string' && /^\s*(txn\s*|value\s*|tran\s*)?date\s*$/i.test(row[c])) {
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
        private confirmStatementPeriod(): boolean {
          if (!this.stmtFrom || !this.stmtTo) { return true; }
          const from = this.toDate(this.FromDate);
          const to = this.toDate(this.ToDate);
          if (!from || !to) { return true; }
          if (this.stmtFrom >= from && this.stmtTo <= to) { return true; }
          return confirm(
            'The selected file contains transactions from ' + this.stmtPeriodText + '.\n\n'
            + 'That is outside the period you selected (' + this.FromDate + ' to ' + this.ToDate + ').\n\n'
            + 'Upload anyway?');
        }

        private resetFileInput() {
          this.selectedFile = null;
          this.selfilename = "";
          this.stmtFrom = null;
          this.stmtTo = null;
          this.stmtPeriodText = "";
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
