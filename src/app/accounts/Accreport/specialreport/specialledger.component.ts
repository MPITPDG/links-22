import { Component, OnInit,ViewChild,ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';




@Component({
    selector: 'app-SpecialLedger-search',
    templateUrl: './specialledger.component.html',
    styles: []
  })
  export class SpecialLedger implements OnInit {
    public myDatePickerOptions: IMyDpOptions = {
      dateFormat: 'dd-mmm-yyyy',
      inline: false,
      height: '18px',
      width: '180px',
      componentDisabled: false,
      selectionTxtFontSize: '12px',
      editableDateField: false,
      sunHighlight: true,
      satHighlight: true,
      firstDayOfWeek: 'su',
      openSelectorTopOfInput: false,
      openSelectorOnInputClick: true,
      selectorHeight: '180px',
      selectorWidth: '200px',
      disableUntil: { year: 0, month: 0, day: 0 },
      disableSince: { year: 0, month: 0, day: 0 }
    };
    FromDate;
    ToDate;
    AccountList:any = [];
    displayType: string = 'SEARCH';
    Compname:string;
    Client:string;
    AccountName:string;
    StatementList:any = [];
    OpDrBal:string;
    OpCrBal:string;
    CLDrBal:number;
    CLCrBal:string;
    currTotalDr:any;
    currTotalcr:any;
    AdvDrAmt:any;
    AdvCrAmt:any; 
    exceldata_list: any = [];
    advdata_list: any = [];
    advdataForExcel = [];
    rptopbal:string;
    rptclbal:string;
    rptcrtotdr:any;
    rptcrtotcr:any;
    rptadvtotdr:any;
    rptadvtotcr:any;
    dataForExcel = [];
    public showModal_Advance: boolean = false; 
    advheader:string;
    AdvanceTable = [];
    AdvTotal:any;
    advheaderlist:any = [];
    Status:string="All"
    Header:string="GENERAL ACCOUNT STATEMENT ALL FOR ALL CITY";
    searchHeaderText:string;
   
    constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private _router: Router,
        private http: HttpClient, private exportser: ExportexcelService,
        private _activatedRoute: ActivatedRoute,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
      ) { }
        ngOnInit() {
          
          this.verifyPermission('328','View')
          this._loaderService.display(true)
          this.getCompanyName();
          this.FillAccount()
          this.FromDate=this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE///this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE)
          this.ToDate = new Date();
          this.ToDate =  this._dataService.datechnge1(this.ToDate)
          this._loaderService.display(false)
      }
      verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {          
               this._loginService.checkVerify(userMode, data);
               this._loaderService.display(false);
    
            });
    }
    FillAccount(){
      const jsonItem = {
      cmpcode: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      citycode1: this._loginService.getLogin()[0].CITYCODE1,
      cmpid: this._loginService.getLogin()[0].CMPID,
    }
      this._dataService.getData("Accounts/ACC_CMP_FILL_GACCOUNT_SPECIAL_LEDGER_PAGELOAD", jsonItem)
      .subscribe((data: any) => {
      this.AccountList = data.Table
      this._loaderService.display(false)
      })
    }
  getCompanyName()
  {
    this.loaderService.display(true)
    var jsoncmp = {
    CmpCode:this._loginService.getLogin()[0].CMPCODE,
    CityCode:this._loginService.getLogin()[0].CITYCODE
  }
      this._dataService.getData("Accounts/fn_Acc_Rpt_Common_CompanyDetails", jsoncmp)
      .subscribe((data: any) => {
      this.Compname=data.Table[0].cmp_name
      this.loaderService.display(false)
    })
    }         
  Showdata()  {
    this.loaderService.display(true);
    if (this.Client ==""  || this.Client ==undefined){
      this._toasterService.toast('warning', 'warning', "Please select Account !");
      return false;
      }
    if (this.FromDate ==""  || this.FromDate ==undefined) {
      this._toasterService.toast('warning', 'warning', "From Date cannot be blank !");
      return false;
    }
    if ( this.ToDate=="" || this.ToDate==undefined){
      this._toasterService.toast('warning', 'warning', "To Date cannot be blank!");
      return false;
    }
    const jsonData = {
      ClientCode:(this.Client==undefined)?"" :this.Client,
      cmpcode: this._loginService.getLogin()[0].CMPCODE,
      UserStartDate:this.FromDate,
      UserEndDate:this.ToDate,
      FinStartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      FinEndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
   };
      this._loaderService.display(true);
      this._dataService.getData("Accounts/Acct_Rpt_ClientOutstandingAll_35_Special_ledger", jsonData)
      .subscribe((data: any) => {
      this.displayType="LIST";
      this.StatementList=data.Table;
      for (var i = 0; i < this.StatementList.length; i++) {
          let obj = {
            Type: this.StatementList[i].TRANSTYPE,
            Number:this.StatementList[i].TRANSCODE,
            Date:this.StatementList[i].TRANSDATE,
            Particulars:this.StatementList[i].NARR + "," + this.StatementList[i].EXP_SNAME + "," + this.StatementList[i].SUP_SNAME + "," + this.StatementList[i].ACCTNAME,
            Debit:this.StatementList[i].DRAMT,
            Credit:this.StatementList[i].CRAMT
        }
        this.exceldata_list.push(obj);
       }
        this.exceldata_list.forEach((row: any) => {
        this.dataForExcel.push(Object.values(row))
        });
        if(data.Table1[0].OPBAL >0) {
          this.OpDrBal=data.Table1[0].OPBAL  + " Dr";
          this.rptopbal=data.Table1[0].OPBAL  + " Dr"; }
          else   {
          this.OpCrBal=(data.Table1[0].OPBAL=="0.00")?"0.0" :Math.abs(data.Table1[0].OPBAL) + " Cr";
          this.rptopbal=(data.Table1[0].OPBAL=="0.00")?"0.0" :Math.abs(data.Table1[0].OPBAL) + " Cr";
        }
        if(data.Table1[0].CLBAL >0){
          this.CLDrBal=data.Table1[0].CLBAL ;
          this.rptclbal=data.Table1[0].CLBAL  + " Dr";
         }
        else{
          this.CLCrBal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr";
          this.rptclbal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr";
        }
        if(data.Table1[0].TLDR >0){
          this.currTotalDr=data.Table1[0].TLDR  ;
          this.rptcrtotdr=data.Table1[0].TLDR + " Dr";
        }
        else  {
          this.currTotalDr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR) ;
          this.rptcrtotdr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR)+ "Dr";
        }
        if(data.Table1[0].TLCR >0){
          this.currTotalcr=data.Table1[0].TLCR ;
          this.rptcrtotcr=data.Table1[0].TLCR +" Cr" ;
        }
        else  {
          this.currTotalcr=(data.Table1[0].TLCR=="0.00")?"" :Math.abs(data.Table1[0].TLCR) 
          this.rptcrtotcr=(data.Table1[0].TLCR=="0.00")?"" :Math.abs(data.Table1[0].TLCR) 
        }
        if(data.Table2[0].ADVTOTALDR >0) {
          this.AdvDrAmt=data.Table2[0].ADVTOTALDR ;
          this.rptadvtotdr=data.Table2[0].ADVTOTALDR ;
        }
        else {
          this.AdvDrAmt=(data.Table2[0].ADVTOTALDR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALDR) ;
          this.rptadvtotdr=(data.Table2[0].ADVTOTALDR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALDR) ;
        }
        if(data.Table2[0].ADVTOTALCR >0) {
          this.AdvCrAmt=data.Table2[0].ADVTOTALCR  ;
          this.rptadvtotcr=data.Table2[0].ADVTOTALCR ;
        }
        else {
          this.AdvCrAmt=(data.Table2[0].ADVTOTALCR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALCR) ;
          this.rptadvtotcr=(data.Table2[0].ADVTOTALCR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALCR) ;
        } 
        this.searchHeaderText="Account Statement From " + this.FromDate + " To " + this.ToDate
        this._loaderService.display(false);
      })
  } 
  FromDateChanged(ev){
    this.FromDate=ev.formatted
  }
  ToDateChanged(ev){
  this.ToDate=ev.formatted
  }
  GetAccountName(icode){
      let updateItem = this.AccountList.find(item => item.ACCTCODENAME === icode);
      this.AccountName=updateItem.ACCTNAME;
  }
  Exportstatement(){
    
        if(confirm('Click OK For With Advance Excel,\n CANCEL For Without Advance Excel'))
      { 
    let reportData = {
      data: this.dataForExcel,///this.dataForExcel,
      advdata:this.advdataForExcel,
      headers: Object.keys(this.exceldata_list[0]),
      advheaders: ["Type","Number","Particulars","Amount"],//Object.keys(this.advdataForExcel[0]),
      pagetype: "ItemStatement",
      title:"Account Statement From " + this.FromDate + " To "  + this.ToDate,
      subtitle:this.AccountName,
      clntname:this.Compname,
      opbal:"Opening: " + this.rptopbal,
      currenttot:"Current Total : " + this.rptcrtotdr + " " + this.rptcrtotcr,
      closing:"Closing : " + this.rptclbal,
      advance:"Advance : " + this.rptadvtotdr + this.rptadvtotcr
    }
     this.exportser.exportExceltry(reportData, "Account_StatementAll_With_Adv_"+ this.AccountName);  
  }  
  else
  {return false;}
  }  
  AdvanceViewData()
  {
    if((this.AdvCrAmt=='' &&  this.AdvDrAmt=='') || (this.AdvCrAmt==undefined &&  this.AdvDrAmt==undefined))
    {
      alert("No Record Found!")
      return false;
      } 
    else  { 
    this.loaderService.display(true)
    this.showModal_Advance = true
    this.advheader="Account Statement for Advance From " + this.FromDate + " To "  + this.ToDate;
    var jsonadv = {
      ClCode:this.Client,
      FINSTARTDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      FINENDDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
      cmp_code:this._loginService.getLogin()[0].CMPCODE,
      citycode1:this._loginService.getLogin()[0].CITYCODE1,
      STARTDATE:this.FromDate,
      ENDDATE:this.ToDate
    }
    var jsonadvall = {
      ClCode:this.Client,
      cmp_code:this._loginService.getLogin()[0].CMPCODE,
      citycode1:this._loginService.getLogin()[0].CITYCODE1,
      STARTDATE:this.FromDate,
      ENDDATE:this.ToDate
    }
    if(this.Status=="All") {
      this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_With_Advance_Print_GetAll", jsonadvall)
      .subscribe((data: any) => {
        if(data.Table.length>0)   {
      this.AdvanceTable=data.Table;
      this.AdvTotal=data.Table1[0].totcramt;
      this.advdata_list=data.Table;
      for (var i = 0; i < this.advdata_list.length; i++) {
        let obj = {
          Type: this.advdata_list[i].transtype,
          Number:this.advdata_list[i].Transcode,
          Particulars:this.advdata_list[i].exp_sname + "," + this.advdata_list[i].sup_sname + "," + this.advdata_list[i].acctname,
          Amount:this.advdata_list[i].cramt
      }
        this.advheaderlist.push(obj);
      }
      this.advheaderlist.forEach((row: any) => {
        this.advdataForExcel.push(Object.values(row))
        });
      }
        else {  return false; }
        })
    }
    else{
      this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_With_Advance_Print_Get", jsonadv)
      .subscribe((data: any) => {
        if(data.Table.length>0) {
        this.AdvanceTable=data.Table;
        this.AdvTotal=data.Table1[0].totcramt;
        this.advdata_list=data.Table;
        for (var i = 0; i < this.advdata_list.length; i++) {
          let obj = {
            Type: this.advdata_list[i].transtype,
            Number:this.advdata_list[i].Transcode,
            Particulars:this.advdata_list[i].exp_sname + "," + this.advdata_list[i].sup_sname + "," + this.advdata_list[i].acctname,
            Amount:this.advdata_list[i].cramt
        }
          this.advheaderlist.push(obj);
        }
        this.advheaderlist.forEach((row: any) => {
          this.advdataForExcel.push(Object.values(row))
          });
        }
        else{return false;}
        })
      }
      this.loaderService.display(false)
  } 
  }
  close()
        {
          this.showModal_Advance = false;
        }
        Print()
        {
          let frdt=this.FromDate.replace('/','-')
          let todt=this.ToDate.replace('/','-')
          let theTop = (screen.height / 2) - (483 / 2);
          let theLeft = (screen.width / 2) - (780 / 2);
          let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
          window.open('././#/popup/Account-actstatement-AdvancePrint/' +  this.Client+ '/' +  this.AccountName +  '/' +  frdt.replace('/','-') + '/' +  todt.replace('/','-') + '/' +  this.Status + '/' , "Print View", toolbar);
       }   
       Openprint(No,Type) 
       {
         let theTop = (screen.height / 2) - (483 / 2);
         let theLeft = (screen.width / 2) - (780 / 2);
         let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
         
         if(confirm('Click OK to Print and Cancel to Edit')) { 
           if(Type=="PI")
            {       window.open('./#/popup/Account-Purchase-print/' + No + '/' + "PI" + '/' , "PI Print", toolbar);      }
           else if(Type=="JV")
           {   window.open('./#/popup/Account-JV-Print/' + No + '/' + "JV" + '/' , "JV Print", toolbar); }
           else if(Type=="CN")
           {  window.open('./#/popup/Account-CreditNote-Print/' + No + '/' , "CN Print", toolbar);  }
           else if(Type=="II")
           { 
          //  window.open('./#/popup/Account-Invoice-print/' + No + '/' , "INV Print", toolbar);   
          let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_Invoice_Print.aspx?" +
          "huhpnk=" + this._loginService.getLogin()[0].GUID
          + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
          + "&Userid=" + this._loginService.getLogin()[0].CMPID
          + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
          + "&InvoiceNo=" + No
          + "&DisplayMode=" + "0"
          +"&cmp_username=" + this._loginService.getLogin()[0].CMP_USERNAME
              window.open(URL,  "Invoice Print", toolbar);
              return false;
          }
           else if(Type=="SI")
           {  return false;  }
           else if(Type=="BI")
           {  return false;   }
           else    
           {  window.open('./#/popup/Account-CashBook-BankReceipt-print/' + Type + '/' + No + '/', "BR Print", toolbar);  }
         }
         else{
           if(Type=="JV")
           { this._router.navigate(['/accounts/Voucher/JV/Add/JV/' + No]);  }
           else if(Type=="BR")
           {  this._router.navigate(['/accounts/Voucher/BankRecpt/Add/' + No]); }
           else if(Type=="BP")
           { this._router.navigate(['/accounts/Voucher/BankPayment/Add/' + No]); }
           else if(Type=="SI")
           { return false;  }
           else if(Type=="II")
           {  return false;  }
         else
           {   return false;  }
         
         }
      }
          
}