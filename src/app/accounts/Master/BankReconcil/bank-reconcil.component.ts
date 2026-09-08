import { Component, OnInit,OnChanges } from '@angular/core';
import{DataService} from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service'; 
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
import { BankReconcilAddEditExportService } from './bank-reconcil-addedit-export.service';

@Component({
    selector: 'app-BankReconcil',
    templateUrl: './bank-reconcil.component.html',
    styleUrls: ['./bank-reconcil.component.css']
  })
  export class BankReconcilComponent implements OnInit {
    public myDatePickerOptions: IMyDpOptions = {
         dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '30px',
        width: '120px',
        componentDisabled: false,
        selectionTxtFontSize: '12px',
        editableDateField: false,
        sunHighlight: true,
        satHighlight: true,
        firstDayOfWeek: 'su',
        openSelectorTopOfInput: false,
        openSelectorOnInputClick: true,
        selectorHeight: '200px',
        selectorWidth: '220px',
         alignSelectorRight: true,
          
         
      };
      public myDatePickerOptionsFilter: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '34px',
        width: '140px',
        componentDisabled: false,
        selectionTxtFontSize: '12px',
        editableDateField: false,
        sunHighlight: true,
        satHighlight: true,
        firstDayOfWeek: 'su',
        openSelectorTopOfInput: false,
        openSelectorOnInputClick: true,
        selectorHeight: '220px',
        selectorWidth: '240px'
       
      };
      public myDatePickerOptionsBank: IMyDpOptions = {
        dateFormat: 'dd-mmm-yyyy',
       inline: false,
       height: '16px',
       width: '140px',
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
    FromDate;
    ToDate;
    ClearingDate;
    
    bankreconcilList:any = [];
    BankList:any = [];
    displayType: string = 'SEARCH';
    Bank:string;
    BankName:string;
    Header:string="Bank Reconciliation";
    searched:boolean = false;
    typeFilter:string = '';
    globalSearch: string = '';
    reconsillationstr:string="";
    reconsillationstr1:string="";
    OpBalDr:string;
    OpBalCr:string;
    BalanceDr:string;
    BalanceCr:string;
    DrNotRef:string;
    CrNotRef:string;
    DrRef:string;
    CrRef:string;
    DrReflected:string;
    CrReflected:string;
    closingcrref:string;
    closingdrref:string;
    showResult = false;
    activeTab: string = 'UNCLEARED';
     constructor(private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private http: HttpClient, 
        private _activatedRoute: ActivatedRoute,private _router:Router,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
        private _exportService: BankReconcilAddEditExportService,

      ) { }
    //   ngOnChanges() {
    //     for (let data of this.bankreconcilList) {
    //       data["clearanceDatenew"] = (data["clearanceDatenew"] != "") ? this._dataService.stringdttoArry(data["clearanceDatenew"]) : null;
    //   }
    // }
        
      ngOnInit() { 
          this._loaderService.display(true)
          this.FillAccount()
          this.verifyPermission('45','View') 
          this._loaderService.display(false)
        }

        // Uncleared/Cleared membership is snapshotted at search time (_wasCleared),
        // not read live off CLEARANCEDATE — otherwise a row would jump to the
        // Cleared tab the instant the user picks a date, before they've submitted.
        get unclearedList() {
          return (this.bankreconcilList || []).filter(x => !x._wasCleared);
        }

        get clearedList() {
          return (this.bankreconcilList || []).filter(x => !!x._wasCleared);
        }

        private sumField(list: any[], field: string): number {
          return (list || []).reduce((total, d) => total + (parseFloat(d[field]) || 0), 0);
        }

        get unclearedDrTotal(): number {
          return this.sumField(this.unclearedList, 'DRAMT');
        }

        get unclearedCrTotal(): number {
          return this.sumField(this.unclearedList, 'CRAMT');
        }

        get clearedDrTotal(): number {
          return this.sumField(this.clearedList, 'DRAMT');
        }

        get clearedCrTotal(): number {
          return this.sumField(this.clearedList, 'CRAMT');
        }

        get activeDrTotal(): number {
          return this.activeTab === 'UNCLEARED' ? this.unclearedDrTotal : this.clearedDrTotal;
        }

        get activeCrTotal(): number {
          return this.activeTab === 'UNCLEARED' ? this.unclearedCrTotal : this.clearedCrTotal;
        }

        get filteredBankreconcilList() {
          let list = this.activeTab === 'UNCLEARED' ? this.unclearedList : this.clearedList;
          if (this.typeFilter) {
            list = list.filter(x => x.STATUS === this.typeFilter);
          }
          if (this.globalSearch && this.globalSearch.trim() !== '') {
            const q = this.globalSearch.toLowerCase();
            list = list.filter(x =>
              ((x.ENTRYNO || '') + '').toLowerCase().includes(q) ||
              ((x.PARTYNAME || '') + '').toLowerCase().includes(q) ||
              ((x.CHEQUENO || '') + '').toLowerCase().includes(q) ||
              ((x.STATUS || '') + '').toLowerCase().includes(q)
            );
          }
          return list;
        }

        setActiveTab(tab: string) {
          this.activeTab = tab;
        }

        get differenceLabel(): string {
          const book = this.toNumber(this.BalanceDr) - this.toNumber(this.BalanceCr);
          const bank = this.toNumber(this.DrRef) - this.toNumber(this.CrRef);
          const diff = book - bank;
          if (diff === 0) {
            return '0.00';
          }
          return Math.abs(diff).toFixed(2) + (diff > 0 ? ' Dr' : ' Cr');
        }

        get isDifferenceZero(): boolean {
          return this.differenceLabel === '0.00';
        }

        private toNumber(val: any): number {
          if (!val) { return 0; }
          const n = parseFloat((val + '').replace(/[^0-9.\-]/g, ''));
          return isNaN(n) ? 0 : n;
        }

        // Adds thousand separators + 2 decimal places (e.g. 1438393.19 -> "1,438,393.19")
        // to the raw numbers coming back from the stored proc, before the "Dr"/"Cr"
        // suffix gets appended in SearchData().
        private formatAmt(val: any): string {
          const n = parseFloat(val);
          if (isNaN(n)) { return val; }
          return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        verifyPermission(formId: any, userMode: any) {
          this._loaderService.display(true);
          this._loginService.verifyRights(formId, '')
          .subscribe((data: any) => {          
          this._loginService.checkVerify(userMode, data);
          this._loaderService.display(false);
                });
            } 

        FillAccount(){
          const jsonBank= {
          cmpcode: this._loginService.getLogin()[0].CMPCODE,
          citycode: this._loginService.getLogin()[0].CITYCODE,
          citycode1: this._loginService.getLogin()[0].CITYCODE1
          }
          this._dataService.getData("Accounts/Acc_CashBook_FillOurbank", jsonBank)
          .subscribe((data: any) => {
          const rawList = (data && data.Table) ? data.Table : [];
          this.BankList = rawList.map(item => ({
            ...item,
            acctname: item.acctname || item.ACCTNAME || '',
            acctcodename: item.acctcodename || item.ACCTCODENAME || ''
          }));
          this._loaderService.display(false)
          })
          } 
              
              SearchData()
              {
                this.searched = true;
                this.loaderService.display(true);
                if(this.Bank=="" || this.Bank==undefined || this.Bank=="--Select OurBank--"){
                  this._toasterService.toast('warning', 'warning', 'Please select Our Bank  !');
                  this.loaderService.display(false);
                  return false;
               }
               if (this.FromDate == "" || this.FromDate == undefined) { 
                this._toasterService.toast('warning', 'warning', "From Date cannot be blank !.");
                this.loaderService.display(false);
                return false;
               }
              if (this.ToDate == "" || this.ToDate == undefined) { 
                this._toasterService.toast('warning', 'warning', "To Date cannot be blank !.");
                this.loaderService.display(false);
                return false; }
                const jsonData = {
                    _ourbank:(this.Bank==undefined)?"" :this.Bank,
                    _FromDt:this.FromDate,
                    _ToDt:this.ToDate,
                    cmpcode:this._loginService.getLogin()[0].CMPCODE,
                    citycode:this._loginService.getLogin()[0].CITYCODE,
                    citycode1:this._loginService.getLogin()[0].CITYCODE1,
                    Fin_StartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
                    Fin_EndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
                 }
                 this._dataService.getData("Accounts/Acc_CashBook_BankRecousillation", jsonData)
                 .subscribe((data: any) => {
                  this.bankreconcilList=data.Table;
                  this.activeTab = 'UNCLEARED';
                  for (let data of this.bankreconcilList) {
                    data["CLEARANCEDATE"] = (data["CLEARANCEDATE"] != "") ? this._dataService.stringdttoArry(data["CLEARANCEDATE"]) : null;
                    data["_wasCleared"] = !!data["CLEARANCEDATE"];
                    // console.log(this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(data["clearanceDate"]));
                    // data["clearanceDate"]=this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(data["clearanceDate"]);
                }
                  if(data.Table1[0].BALANCE >0) {
                    this.BalanceDr=this.formatAmt(data.Table1[0].BALANCE)  + " Dr";
                  }
                  else{
                    this.BalanceCr=(data.Table1[0].BALANCE=="0.00")?"" :this.formatAmt(Math.abs(data.Table1[0].BALANCE)) + " Cr";
                    }
                  if(data.Table2[0].CRAMTNOTREFLECTED >0)
                    {
                       this.CrNotRef=(data.Table2[0].CRAMTNOTREFLECTED=="0.00")?"" :this.formatAmt(Math.abs(data.Table2[0].CRAMTNOTREFLECTED)) + " Cr";
                    }
                  if(data.Table2[0].DRAMTNOTREFLECTED >0)
                    {
                      this.DrNotRef=(data.Table2[0].DRAMTNOTREFLECTED=="0.00")?"" :this.formatAmt(Math.abs(data.Table2[0].DRAMTNOTREFLECTED)) + " Dr";
                    }
                  if(data.Table3[0].AMTREFLECTED >0)
                      {
                         this.DrRef=this.formatAmt(data.Table3[0].AMTREFLECTED)  + " Dr";
                      }
                  else
                      {
                        this.CrRef=(data.Table3[0].AMTREFLECTED=="0.00")?"" :this.formatAmt(Math.abs(data.Table3[0].AMTREFLECTED)) + " Cr";
                      }
                       if(data.Table4[0].OPENINGBALANCE >0)
                      {
                         this.OpBalDr=this.formatAmt(data.Table4[0].OPENINGBALANCE)  + " Dr";
                      }
                  else
                      {
                        this.OpBalCr=(data.Table4[0].OPENINGBALANCE=="0.00")?"" :this.formatAmt(Math.abs(data.Table4[0].OPENINGBALANCE)) + " Cr";
                      }
                  // Amount Reflected In Bank — Table4.DRAMTREFLECTED / CRAMTREFLECTED,
                  // shown as separate Dr and Cr totals (same pattern as Amount Not
                  // Reflected), not netted like Table3.AMTREFLECTED (used for
                  // Target Bank Balance).
                  if(data.Table4[0].DRAMTREFLECTED >0)
                      {
                        this.DrReflected=(data.Table4[0].DRAMTREFLECTED=="0.00")?"" :this.formatAmt(Math.abs(data.Table4[0].DRAMTREFLECTED)) + " Dr";
                      }
                  if(data.Table4[0].CRAMTREFLECTED >0)
                      {
                        this.CrReflected=(data.Table4[0].CRAMTREFLECTED=="0.00")?"" :this.formatAmt(Math.abs(data.Table4[0].CRAMTREFLECTED)) + " Cr";
                      }
                        if(data.Table4[0].CLOSING > 0){
                           this.closingdrref=(data.Table4[0].CLOSING=="0.00")?"" :this.formatAmt(Math.abs(data.Table4[0].CLOSING)) + " Dr";
                         }
                           if(data.Table4[0].CLOSING1 > 0){
                           this.closingdrref=(data.Table4[0].CLOSING1=="0.00")?"" :this.formatAmt(Math.abs(data.Table4[0].CLOSING1)) + " Dr";
                         }
                         else {
                           this.closingcrref=(data.Table4[0].CLOSING1=="0.00")?"" :this.formatAmt(Math.abs(data.Table4[0].CLOSING1)) + " Cr";
                         }
                  });
                
                  this.showResult = true;
                  this.loaderService.display(false);
                } 
                FromDateChanged(ev){
                  this.FromDate=ev.formatted
                  }
                ToDateChanged(ev){
                  this.ToDate=ev.formatted
                  }
              
                BankRecUpdateold(){
                  this.loaderService.display(true);
                  this.reconsillationstr='';
                    for (var i = 0; i < this.bankreconcilList.length; i++) 
                   {
                    this.ClearingDate=(this.bankreconcilList[i].CLEARANCEDATE) ?this.bankreconcilList[i].CLEARANCEDATE : "",
                    this.reconsillationstr +=  (" UPDATE acc_bank set clearanceDate = " 
                + (( (this.ClearingDate == "") ? "NULL" : (" '"  + (this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ClearingDate.formatted )+ "' ")) ) + (" where ID = '" 
                + (this.bankreconcilList[i].ID + "'")))) + ";";
                    }
                    
                    const jsonData = {
                      _reconsillationstr:this.reconsillationstr ,
                   
                   }
                    this._dataService.getData("Accounts/Acc_CashBook_BankRecousillation_Update",  jsonData )
                   .subscribe((data: any) => {
                  if (data.Table[0].STATUS == "100") {
                    this._toasterService.toast('info', 'Complete', "Bank Reconcillation saved successfully");
                    this.SearchData();
                    this.loaderService.display(false);
                                   }            
                  else { 
                   this._toasterService.toast("warning","warning" ,"Error in saving data "  );
                   this.loaderService.display(false);
                  }
                });
                }
                BankRecUpdate_20260525() {

  // ✅ VALIDATION 1 — Check if any rows are selected
  const selectedRows = this.bankreconcilList.filter(r => r._selected);
  if (selectedRows.length === 0) {
    this._toasterService.toast('warning', 'Warning',
      'Please select at least one transaction to reconcile.');
    return;
  }

  // ✅ VALIDATION 2 — Check if selected rows have clearance date
  const selectedWithoutDate = selectedRows.filter(r =>
    !r.CLEARANCEDATE || !r.CLEARANCEDATE.formatted
  );
  if (selectedWithoutDate.length > 0) {
    this._toasterService.toast('warning', 'Warning',
      `${selectedWithoutDate.length} selected transaction(s) have no clearance date. 
       Please enter clearance date for all selected rows.`);
    return;
  }

  // ✅ CONFIRMATION before submit
  if (!confirm(`Submit reconciliation for ${selectedRows.length} transaction(s)?`)) {
    return;
  }

  this.loaderService.display(true);
  this.reconsillationstr = '';

  // ✅ Loop only selected rows, use local variable
  for (let i = 0; i < this.bankreconcilList.length; i++) {
    const row = this.bankreconcilList[i];

    // ✅ Local variable — not class property
    const clearingDate = (row.CLEARANCEDATE && row.CLEARANCEDATE.formatted)
      ? row.CLEARANCEDATE.formatted
      : '';

    const dateVal = (clearingDate === '')
      ? 'NULL'
      : `'${this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(clearingDate)}'`;

    this.reconsillationstr +=
      `UPDATE acc_bank SET clearanceDate = ${dateVal} WHERE ID = '${row.ID}';`;
  }

  const jsonData = {
    _reconsillationstr: this.reconsillationstr
  };

  this._dataService.getData(
    'Accounts/Acc_CashBook_BankRecousillation_Update',
    jsonData
  ).subscribe(
    (data: any) => {
      this.loaderService.display(false);
      if (data.Table[0].STATUS === '100') {
        this._toasterService.toast('info', 'Success',
          'Bank Reconciliation saved successfully.');
        this.SearchData();
      } else {
        this._toasterService.toast('warning', 'Warning',
          'Error in saving data.');
      }
    },
    (error) => {
      // ✅ Handle API error
      this.loaderService.display(false);
      this._toasterService.toast('error', 'Error',
        'Something went wrong. Please try again.');
      console.error('BankRecUpdate error:', error);
    }
  );
}
BankRecUpdatewithstring() {

  // ✅ 1. Get Selected Rows
  const selectedRows = this.bankreconcilList.filter(r => r._selected);
  
  if (selectedRows.length === 0) {
    this._toasterService.toast('warning', 'Warning',
      'Please select at least one transaction to reconcile.');
    return;
  }

  // ✅ 2. VALIDATION: Check if selected rows are missing a clearance date
  const selectedWithoutDate = selectedRows.filter(r =>
    !r.CLEARANCEDATE || !r.CLEARANCEDATE.formatted
  );
  
  if (selectedWithoutDate.length > 0) {
    this._toasterService.toast('warning', 'Warning',
      `You selected ${selectedWithoutDate.length} transaction(s) without a clearance date. Please enter dates for all selected rows.`);
    return;
  }

  // ✅ 3. NEW VALIDATION: Check if user entered a date but forgot the checkbox!
  const unselectedWithDate = this.bankreconcilList.filter(r =>
    !r._selected && r.CLEARANCEDATE && r.CLEARANCEDATE.formatted
  );
  
  if (unselectedWithDate.length > 0) {
    this._toasterService.toast('warning', 'Warning',
      `You entered a clearance date for ${unselectedWithDate.length} row(s) but forgot to tick the Match checkbox. Please select them.`);
    return;
  }

  // ✅ 4. CONFIRMATION
  if (!confirm(`Are you sure you want to submit reconciliation for ${selectedRows.length} transaction(s)?`)) {
    return;
  }

  this.loaderService.display(true);
  this.reconsillationstr = '';

  // ✅ 5. BUG FIX: Loop ONLY through selectedRows! (Not the whole list)
  for (let i = 0; i < selectedRows.length; i++) {
    const row = selectedRows[i];

    // Since we validated above, we know formatting exists
    const clearingDate = row.CLEARANCEDATE.formatted;
    const dateVal = `'${this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(clearingDate)}'`;

    this.reconsillationstr +=
      `UPDATE acc_bank SET clearanceDate = ${dateVal} WHERE ID = '${row.ID}'; `;
  }

  const jsonData = {
    _reconsillationstr: this.reconsillationstr
  };

  this._dataService.getData(
    'Accounts/Acc_CashBook_BankRecousillation_Update',
    jsonData
  ).subscribe(
    (data: any) => {
      this.loaderService.display(false);
      if (data.Table[0].STATUS === '100') {
        this._toasterService.toast('success', 'Success',
          'Bank Reconciliation saved successfully.');
        this.SearchData(); // Refresh the grid
      } else {
        this._toasterService.toast('warning', 'Warning',
          'Error in saving data.');
      }
    },
    (error) => {
      this.loaderService.display(false);
      this._toasterService.toast('error', 'Error',
        'Something went wrong. Please try again.');
      console.error('BankRecUpdate error:', error);
    }
  );
}
BankRecUpdate() {

  // ✅ Submit every Uncleared-tab row that currently has a clearance date typed in —
  // no separate checkbox to tick. To hold a row back, just leave its date blank.
  const datedRows = this.unclearedList.filter(r =>
    r.CLEARANCEDATE && r.CLEARANCEDATE.formatted
  );

  if (datedRows.length === 0) {
    alert('Please enter a clearance date for at least one transaction.');
    return false; 
  }

  // ✅ CONFIRMATION DIALOG
  if (!confirm(`Are you sure you want to submit reconciliation for ${datedRows.length} transaction(s)?`)) {
    return;
  }

  this.loaderService.display(true);

  // ✅ BUILD XML STRING (For SQL Server 2008 Bulk Update)
  this.reconsillationstr = '<root>';

  for (let i = 0; i < datedRows.length; i++) {
    const row = datedRows[i];

    // Format the date using your existing data service
    const clearingDate = row.CLEARANCEDATE.formatted;
    const dateVal = this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(clearingDate);

    // Append XML node for each row
    this.reconsillationstr += `<row id="${row.ID}" date="${dateVal}" />`;
  }

  // Close the XML string
  this.reconsillationstr += '</root>';

  // Prepare payload for API
  const jsonData = {
    _reconsillationstr: this.reconsillationstr
  };

  // ✅ CALL THE API
  this._dataService.Common(
    'Accounts/Acc_CashBook_BankRecousillation_Update_NG',
    jsonData
  ).subscribe(
    (data: any) => {
      this.loaderService.display(false);
      
      // Safely check if the API returned our '100' status from the Stored Procedure
      if (data && data.Table && data.Table.length > 0 && data.Table[0].STATUS === '100') {
        
        alert(data.Table[0].MESSAGE || 'Bank Reconciliation saved successfully.');
        this.SearchData(); 
        return false;
        
        // Refresh the grid
      
        
      } else {
        // If SQL Server returned '500' (Error) from the CATCH block
        const errorMsg = (data && data.Table && data.Table[0] && data.Table[0].MESSAGE) 
            ? data.Table[0].MESSAGE 
            : 'Error in saving data.';
            
        this._toasterService.toast('warning', 'Warning', errorMsg);
      }
    },
    (error) => {
      this.loaderService.display(false);
      alert('Something went wrong. Please try again.');
      return false;
      
    }
  );
}
                Reset()
                { 
                    this.searched = false;
                    this.typeFilter = '';
                    this.globalSearch = '';
                    this.Bank = "";
                    this.FromDate="";
                    this.ToDate="";
                    this.bankreconcilList=[];
                    this.activeTab = 'UNCLEARED';
                    this.BalanceCr="";
                    this.BalanceDr="";
                    this.CrNotRef="";
                    this.DrNotRef="";
                    this.DrRef="";
                    this.CrRef="";
                    this.DrReflected="";
                    this.CrReflected="";
                }
                BackToSearch() {
  this.showResult = false;
}

// Exports every entry in the current search result (both Uncleared and
// Cleared, BR and BP) — matches the legacy "Bank Reconciliation Statement"
// .xls report, not just the currently active tab.
ExportExcel() {
  if (!this.bankreconcilList || this.bankreconcilList.length === 0) {
    this._toasterService.toast('warning', 'warning', 'No data to export.');
    return;
  }
  const login = this._loginService.getLogin()[0];
  const companyLine = `${login.CMPNAME || ''} - ${login.CITYNAME || ''}`;
  const period = `From ${this.FromDate} To ${this.ToDate}`;
  this._exportService.export(companyLine, period, this.bankreconcilList, 'BankReconciliationStatement');
}

    }