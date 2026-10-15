import { Component, OnInit, ViewChild, EventEmitter, Output, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient} from  '@angular/common/http';;
import { DataService } from '../../shared/service/dataService';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { LoginService } from '../../shared/service/loginService';
import {Configuration}  from '../../app.constants'
import { LoaderService } from '../../shared/service/loader.service';
import { IMyDpOptions } from 'mydatepicker';
import { ExportexcelService } from '../../shared/service/exportexcel.service';

@Component({
    selector: 'app-bankreconcil-uploadsearch',
    templateUrl: './bank-reconcil-uploadsearch.component.html',
    // MPERPNG-20 layout: the page kit (import-page / accreport-page) is GLOBAL in Links; the host class opts in.
    styleUrls: [],
    host: { class: 'kit-accreport' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
  export class UploadBankReconcilSearch implements OnInit {

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
    @ViewChild('datepicker',{static:false}) datepicker: any;
    //form: FormGroup;
    displayType: string = 'SEARCH';
    // Which result tab is showing: 'Reconcil' | 'UnReconcil' | 'Our Bank Ledger'
    // | 'Mismatched Data'. Set by changeTab(); defaults to Reconcil on load.
    activeTab: string = 'Reconcil';
    FromDate;
    ToDate;
    BankList:any = [];
    ourbank:string;
    reconcildataList = [];
    unreconcildataList = [];
    Header:string="Upload Statement Search"
    Subheader:string="";
    reconcildataForExcel = [];
    unreconcildataForExcel = [];
    AdvanceTable = [];
    reconcilexceldata_list= [];
    unreconcilexceldata_list= [];
    ledgerdata_list= [];
    Compname:string;
    mismatchupdate_list=[];
    newarray: any = [];
    str:string="";
   myForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    file: new FormControl('', [Validators.required]),
    fileSource: new FormControl('', [Validators.required])
  });
  @Output() public onUploadFinished = new EventEmitter();
  snackbar: any;
  reconcilrecord:any = 0;
  unreconcilrecord:any = 0;
  ledgerdatarecord:any = 0;
  mismatchedrecord:any = 0;
  lbltxt:string="";
  valuetxt:string="";
  public disablesubmitbtn:boolean=true;

  // Manual linking (UnReconcil <-> Our Bank Ledger): selecting one row on each
  // tab persists across tab switches so the user isn't forced to see both
  // lists at once — the sticky panel near Submit/Reset shows the pairing.
  selectedBankLink: any = null;
  selectedLedgerLink: any = null;
  linkClearanceDate: any = null;
  bankFilter: string = '';
  ledgerFilter: string = '';
  // Click-to-sort state per result tab. dir 1=asc, -1=desc.
  sortState: any = {
    reconcil:   { col: '', dir: 1 },
    unreconcil: { col: '', dir: 1 },
    ledger:     { col: '', dir: 1 },
    mismatch:   { col: '', dir: 1 }
  };

    constructor(
        private _dataService: DataService,
        private http: HttpClient,
        private _loginService: LoginService,
        private _config:Configuration,
        private _loaderService: LoaderService,
        private exportser: ExportexcelService,
      ) {
    }
        ngOnInit() {
          this.FillAccount();
        }

        // Narrows the (often 100+ row) UnReconcil / Our Bank Ledger lists so a
        // user hunting for a specific transaction's counterpart doesn't have to
        // scroll-scan the whole thing — matches against ref no / amount / entry no.
        get filteredUnreconcilList() {
          const list = this.unreconcildataList || [];
          const q = (this.bankFilter || '').trim().toLowerCase();
          if (!q) { return list; }
          return list.filter(x =>
            ((x.BANKREFNO || '') + '').toLowerCase().includes(q) ||
            ((x.DEPOSIT || '') + '').includes(q) ||
            ((x.WITHDRAWAL || '') + '').includes(q)
          );
        }

        get filteredLedgerList() {
          const list = this.ledgerdata_list || [];
          // Global quick-search box. Sorting is applied in place on the source
          // list by sortBy() on header click, so the filtered view stays sorted.
          const q = (this.ledgerFilter || '').trim().toLowerCase();
          if (!q) { return list; }
          return list.filter(x =>
            ((x.ENTRYNO || '') + '').toLowerCase().includes(q) ||
            ((x.USERBANKREFNO || '') + '').toLowerCase().includes(q) ||
            ((x.AMOUNT || '') + '').includes(q)||
            ((x.ERPID || '') + '').includes(q)
          );
        }

        // ---- generic click-to-sort, shared by all four result tabs ----

        // Sort key by declared type: numeric for amounts, yyyymmdd for
        // dd/MM/yyyy dates (chronological, not lexical), lowercased string
        // otherwise. Unwraps a mydatepicker model ({date, formatted}) first --
        // the Mismatched tab's Clearing Date is stored that way.
        private sortKey(v: any, type: string): any {
          if (v && typeof v === 'object' && v.formatted !== undefined) { v = v.formatted; }
          if (type === 'num') {
            const n = parseFloat(('' + (v || '')).replace(/,/g, ''));
            return isNaN(n) ? -Infinity : n;
          }
          if (type === 'date') {
            const m = ('' + (v || '')).match(/^(\d{2})\/(\d{2})\/(\d{4})/);
            return m ? (m[3] + m[2] + m[1]) : '';
          }
          return ('' + (v || '')).toLowerCase();
        }

        // Sort a result list IN PLACE on header click. In-place (not inside a
        // getter) so it runs only on click and keeps a stable array reference,
        // letting *ngFor move existing rows rather than rebuild them -- which
        // preserves the editable checkbox/date-picker on the Mismatched tab.
        // Toggles direction on the same column, else switches column (asc).
        sortBy(tab: string, list: any[], field: string, type: string) {
          const st = this.sortState[tab];
          if (st.col === field) { st.dir = -st.dir; }
          else { st.col = field; st.dir = 1; }
          if (!list || !list.sort) { return; }
          list.sort((a, b) => {
            const ka = this.sortKey(a[field], type);
            const kb = this.sortKey(b[field], type);
            if (ka < kb) { return -st.dir; }
            if (ka > kb) { return st.dir; }
            return 0;
          });
        }

        sortIcon(tab: string, field: string): string {
          const st = this.sortState[tab];
          if (!st || st.col !== field) { return 'fa-sort'; }
          return st.dir === 1 ? 'fa-sort-asc' : 'fa-sort-desc';
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

        // The mismatch list carries its clearance date as a dd/MM/yyyy string;
        // the date picker needs the mydatepicker model instead.
        private prepareMismatchList() {
          for (let d of this.mismatchupdate_list) {
            d["CLEARANCEDATE"] = (typeof d["CLEARANCEDATE"] === "string" && d["CLEARANCEDATE"] !== "") ? this._dataService.stringdttoArry(d["CLEARANCEDATE"]) : null;
          }
        }

          search(){
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
              if (this.FromDate !="" && this.ToDate!=""){
                if (this._dataService.date2Comparison(this.FromDate,this.ToDate)==false){
                  alert('To date should be greater than from date !');
                  return false;
                }
              }
              this._loaderService.display(true)
            const jsonData = {
                OURBANK:this.ourbank,
                FROMDATE:this.FromDate,
                TODATE:this.ToDate
             }
             this._dataService.getData("Accounts/ACC_BANKRECONCILLATION_UPLOAD_GETDATA", jsonData)
             .subscribe((data: any) => {
                   this.displayType="LIST";
                   this.activeTab="Reconcil";
                   this.reconcildataList=(data && data.Table1) || [];
                   this.unreconcildataList=(data && data.Table2) || [];
                   // Table4 / Table5 are the ledger and mismatch sets; they are only
                   // present once USP_ACC_BANKRECONCIL_GETUPLOADDATA returns them.
                   this.ledgerdata_list=(data && data.Table4) || [];
                   this.mismatchupdate_list=(data && data.Table5) || [];
                   this.mismatchedrecord=this.mismatchupdate_list.length;
                   this.reconcilrecord=this.reconcildataList.length;
                   this.unreconcilrecord=this.unreconcildataList.length;
                   this.ledgerdatarecord=this.ledgerdata_list.length;
                   this.lbltxt='Reconcilled Items : '
                   this.valuetxt=this.reconcilrecord;
                   this.disablesubmitbtn=true;
                   this.Subheader=" From " + this.FromDate + ' To ' + this.ToDate
                   this.prepareMismatchList();
                   this._loaderService.display(false)
            }, () => {
              this._loaderService.display(false)
              alert('Something went wrong. Please try again.');
            });
        }
        reset(){
            this.ourbank=undefined;
            this.FromDate="";
            this.ToDate="";
        }
        Exporttoxl(){
          this._loaderService.display(true);
          const jsonaccount = { OURBANK:this.ourbank,FROMDATE:this.FromDate,TODATE:this.ToDate };
          this._dataService.getDownload("Accounts/acc_bankreconcillation_exporttoxl", jsonaccount, { responseType: 'arraybuffer' })
              .subscribe((data: any) => {
                  this._dataService.common_downloadFileByUrl(data, "bankreconcillationlist" +  this.FromDate + "-" + this.ToDate + ".xls");
                  this._loaderService.display(false);

              });
            }

        getCheckboxValues(
          event: boolean,
          entryno: number,
          bnkrefno: string,
          clrnsdt: any,
          data: any,
          id: number
        ): void {
          if (event && (!clrnsdt || clrnsdt === '')) {
            alert('Please enter the Clearance Date before checking the checkbox.');
            data.CHECKED = false; // Uncheck the checkbox
            return;
        }
          const index = this.newarray.findIndex(x => x.EntryNo === entryno);
          if (event) {
            const obj = {
              EntryNo: entryno,
              BRefNo: bnkrefno,
              Clearancedt: clrnsdt,
              Id: id,
              bankamt:data.BANKAMOUNT,
              erpamt:data.ERPAMOUNT
            };

            if (index === -1) {
              this.newarray.push(obj); // Add to newarray if not already present
            } else {
              this.newarray[index] = obj; // Update if already present
            }
          } else {
            if (index !== -1) {
              this.newarray.splice(index, 1); // Remove if unchecked
            }
          }
        }

        BankRecUpdate(){
          this.str='';
          if(this.newarray.length==0){
            alert('Please select at least one record to update clearance Date');
            return false;
          }

         const invalidRecords = this.newarray.filter(item => item.Clearancedt == null || item.Clearancedt === '');
         if (invalidRecords.length > 0) {
                alert('Please select a clearance date for all checked items.');
                return false;
         } else {
          for (var i = 0, len = this.newarray.length; i < len; i++) {
            // Convert dd/mm/yyyy (mydatepicker's .formatted) to the dd-mmm-yyyy
            // format the backend expects.
            const clearancedtForSave = this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.newarray[i].Clearancedt);
            this.str += this.newarray[i].EntryNo + '|' + this.newarray[i].BRefNo + '|' + clearancedtForSave + '|'+ this.newarray[i].Id + '|'+ this.newarray[i].bankamt + '|'+ this.newarray[i].erpamt + ";" ;
            }
          }
          const jsonData = {
            _reconsillationstr: this.str,
            OURBANK:this.ourbank,
            FROMDATE:this.FromDate,
            TODATE:this.ToDate
          }
          this._loaderService.display(true)
          this._dataService.getData("Accounts/Acc_CashBook_BankRecousillation_UpdateNew", jsonData)
            .subscribe((data: any) => {
              if (data && data.Table && data.Table[0] && data.Table[0].STATUS == "100") {

                this.displayType="LIST";
                // Post-update refresh keeps the user on the Mismatched Data tab
                // they were working in (matches the lbltxt set below).
                this.activeTab="Mismatched Data";
                this.reconcildataList=data.Table2 || [];
                this.unreconcildataList=data.Table3 || [];
                this.ledgerdata_list=data.Table5 || [];
                this.mismatchupdate_list=data.Table6 || [];
                this.newarray=[];
                this.mismatchedrecord=this.mismatchupdate_list.length;
                this.reconcilrecord=this.reconcildataList.length;
                this.unreconcilrecord=this.unreconcildataList.length;
                this.ledgerdatarecord=this.ledgerdata_list.length;
                this.lbltxt='Mismatched Data : '
                this.valuetxt=this.mismatchedrecord;
                this.Subheader=" From " + this.FromDate + ' To ' + this.ToDate
                this.prepareMismatchList();
              this._loaderService.display(false);
              alert("Bank Refno updated successfully");
              return false;

            }
              else {
                this._loaderService.display(false)
                alert( "Error in saving data ");
                return false;
              }
            }, () => {
              this._loaderService.display(false);
              alert('Something went wrong. Please try again.');
            });

        }
        Reset() {
        this.search();
        }
        onDateChanged(event: any, data: any): void {
          // event already has the {date:{...}, formatted:'dd/mm/yyyy'} shape --
          // event.date alone drops .formatted, which the checkbox validation
          // reads via data.CLEARANCEDATE?.formatted.
          data.CLEARANCEDATE = event;
          const index = this.newarray.findIndex(x => x.EntryNo === data.ENTRYNO);

          if (index !== -1) {
            this.newarray[index].Clearancedt = event.formatted; // Update in newarray if present
          }
        }
        changeTab(tabName: string) {
          // Drives which panel is rendered. Plain Angular state rather than
          // bootstrap's data-toggle, so the tabs work without the bootstrap JS
          // bundle -- and so the active pill can never drift out of sync with
          // the lbltxt/valuetxt/disablesubmitbtn set below.
          this.activeTab = tabName;
          if(tabName=='Reconcil'){
            this.lbltxt='Reconcilled Items : '
            this.valuetxt=this.reconcilrecord;
            this.disablesubmitbtn=true
          } else if (tabName=='UnReconcil'){
            this.lbltxt='UnReconcilled Items : '
            this.disablesubmitbtn=true
            this.valuetxt=this.unreconcilrecord;
          } else if (tabName=='Our Bank Ledger'){
            this.lbltxt='Ledger Data :'
            this.valuetxt=this.ledgerdatarecord;
            this.disablesubmitbtn=true
          }else if (tabName=='Mismatched Data'){
            this.lbltxt='Mismatched Data : '
            this.valuetxt=this.mismatchedrecord;
            this.disablesubmitbtn=false

          }
        }

        // ===== Manual linking: UnReconcil (bank) <-> Our Bank Ledger =====
        // Single-select on each side; selection survives switching tabs so the
        // user can pick a bank row on "UnReconcil", switch to "Our Bank Ledger",
        // pick its counterpart, and confirm from the sticky panel near Submit.

        selectBankRow(data: any) {
          if (this.selectedBankLink) { this.selectedBankLink._linkSelected = false; }
          if (this.selectedBankLink === data) {
            this.selectedBankLink = null;
            return;
          }
          data._linkSelected = true;
          this.selectedBankLink = data;
        }

        selectLedgerRow(data: any) {
          if (this.selectedLedgerLink) { this.selectedLedgerLink._linkSelected = false; }
          if (this.selectedLedgerLink === data) {
            this.selectedLedgerLink = null;
            return;
          }
          data._linkSelected = true;
          this.selectedLedgerLink = data;
        }

        clearLinkSelection() {
          if (this.selectedBankLink) { this.selectedBankLink._linkSelected = false; }
          if (this.selectedLedgerLink) { this.selectedLedgerLink._linkSelected = false; }
          this.selectedBankLink = null;
          this.selectedLedgerLink = null;
          this.linkClearanceDate = null;
        }

        onLinkDateChanged(event: any) {
          this.linkClearanceDate = event;
        }

        confirmLink() {
          if (!this.selectedBankLink || !this.selectedLedgerLink) {
            return;
          }
          if (!this.linkClearanceDate || !this.linkClearanceDate.formatted) {
            alert('Please select a clearance date before linking.');
            return;
          }
          if (!confirm(`Link Bank Ref ${this.selectedBankLink.BANKREFNO} to Entry ${this.selectedLedgerLink.ENTRYNO}?`)) {
            return;
          }

          const clearancedtForSave = this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.linkClearanceDate.formatted);
          const bankamt = (this.selectedBankLink.DEPOSIT && this.selectedBankLink.DEPOSIT > 0)
            ? this.selectedBankLink.DEPOSIT
            : this.selectedBankLink.WITHDRAWAL;

          // Same "EntryNo|BRefNo|ClearanceDt|Id|bankamt|erpamt" shape BankRecUpdate()
          // sends for confirmed Mismatched Data pairs — a manual link is
          // structurally the same operation, just picked by the user instead of
          // the amount+date auto-matcher.
          const linkStr = this.selectedLedgerLink.ENTRYNO + '|' + this.selectedBankLink.BANKREFNO + '|'
            + clearancedtForSave + '|' + this.selectedLedgerLink.ERPID + '|'
            + bankamt + '|' + this.selectedLedgerLink.AMOUNT + ';';

          const jsonData = {
            _reconsillationstr: linkStr,
            OURBANK: this.ourbank,
            FROMDATE: this.FromDate,
            TODATE: this.ToDate
          };

          this._loaderService.display(true);
          this._dataService.getData("Accounts/Acc_CashBook_BankRecousillation_UpdateNew", jsonData)
            .subscribe((data: any) => {
              if (data && data.Table && data.Table[0] && data.Table[0].STATUS == "100") {
                this.reconcildataList = data.Table2 || [];
                this.unreconcildataList = data.Table3 || [];
                this.ledgerdata_list = data.Table5 || [];
                this.mismatchupdate_list = data.Table6 || [];
                this.mismatchedrecord = this.mismatchupdate_list.length;
                this.reconcilrecord = this.reconcildataList.length;
                this.unreconcilrecord = this.unreconcildataList.length;
                this.ledgerdatarecord = this.ledgerdata_list.length;
                this.prepareMismatchList();
                this.clearLinkSelection();
                this._loaderService.display(false);
                alert('Linked successfully.');
              } else {
                this._loaderService.display(false);
                alert('Error in saving data.');
              }
            }, () => {
              this._loaderService.display(false);
              alert('Something went wrong. Please try again.');
            });
        }
      }
