import { Component, OnInit,ViewChild,ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { ModalDirective } from 'ngx-bootstrap/modal';
@Component({
    selector: 'app-General-AccountStmt-Local',
    templateUrl: './genact-localstmt.component.html',
    styles: []
  })
  export class GenActStatementLocal implements OnInit {
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
      public showModal_Advance: boolean = false; 
      public showModal_Remark: boolean =false;
      ClientList:any = [];
      displayType: string = 'SEARCH';
      FromDate;
      ToDate;
      Client:string;
      searchHeaderText:string="General Account Statement Local";
      ClientName:string;
      OpDrBal:string;
      OpCrBal:string;
      CLDrBal:string;
      CLCrBal:string;
      currTotalDr:any;
      currTotalcr:any;
      AdvDrAmt:any;
      AdvCrAmt:any;
      dataList = [];
      dataForExcel = [];
      advdataForExcel = [];
      AdvanceTable = [];
      exceldata_list= [];
      Compname:string;
      rptopbal:string;
      rptclbal:string;
      rptcrtotdr:any;
      rptcrtotcr:any;
      rptadvtotdr:any;
      rptadvtotcr:any;
      Status:string="All";
      advheader:string;
      AdvTotal:string;
      Remark:string;
      LastRemark:string="";
      lblLastRemark="Last Remark";
      UserList: any = [];
      advheaderlist:any = [];
      lblRemark:string;
      public disableAddbtn: boolean =false;
      public disableCancelbtn: boolean =false;
      public disableCancelAddbtn: boolean=false;
      public disableNewbtn: boolean=false; 
      RemarkList:any=[];
      constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _router: Router,
        private http: HttpClient, private exportser: ExportexcelService,
        private _activatedRoute: ActivatedRoute,
        private _loginService: LoginService,
        private modalService: BsModalService,
        private _loaderService: LoaderService,
      ) { }
      ngOnInit() {
        this.FromDate= new Date();
        this.FromDate=this._dataService.datechnge1(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE)
        this.ToDate = new Date();
        this.ToDate =  this._dataService.datechnge1(this.ToDate)
        this.verifyPermission('167','View') 
        this.FillAccount();
        this.getCompanyName();
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

    const jsonmaster = {
        cmpcode: this._loginService.getLogin()[0].CMPCODE,
        citycode: this._loginService.getLogin()[0].CITYCODE,
        citycode1: this._loginService.getLogin()[0].CITYCODE1,
        cmpid: this._loginService.getLogin()[0].CMPID,
      }
       this._dataService.getData("Accounts/ACC_CMP_FILL_GACCOUNT_PAGELOAD", jsonmaster)
        .subscribe((data: any) => {
         // console.log(data)
          this.ClientList = data.Table
          this._loaderService.display(false)
        })
    }
    FromDateChanged(ev){
      this.FromDate=ev.formatted
    
    }
    ToDateChanged(ev){
      this.ToDate=ev.formatted
    
    }
    Showdata()  {
     
        this.dataForExcel=[];
        this._loaderService.display(true);
        if (this.Client ==""  || this.Client ==undefined){
          this._toasterService.toast('warning', 'warning', "Please select Account !");
          this._loaderService.display(false);
          return false;
               }
        if (this.FromDate ==""  || this.FromDate ==undefined) {
          this._toasterService.toast('warning', 'warning', "From Date cannot be blank !");
          this._loaderService.display(false);
          return false;
          
        }
        if ( this.ToDate=="" || this.ToDate==undefined){
          this._toasterService.toast('warning', 'warning', "To Date cannot be blank!");
          this._loaderService.display(false);
          return false;
             }
        const jsonData = {
          ClCode:(this.Client==undefined)?"" :this.Client,
          cmp_code: this._loginService.getLogin()[0].CMPCODE,
          citycode1: this._loginService.getLogin()[0].CITYCODE1,
          STARTDATE:this.FromDate,
          ENDDATE:this.ToDate,
     
       };
          this._loaderService.display(true);
          this._dataService.getData("Accounts/Acc_Rpt_ClientOutstandingList_GetAll", jsonData)
          .subscribe((data: any) => {
            if (data.Table.length>0)
            {
          this.displayType="LIST";
          this.dataList = data.Table;
          for (var i = 0; i < this.dataList.length; i++) {
            let obj = {
              Type: this.dataList[i].TRANSTYPE,
              Number:this.dataList[i].TRANSCODE,
              Date:this.dataList[i].TRANSDATE,
              Particulars:this.dataList[i].NARR + "," + this.dataList[i].EXP_SNAME + "," + this.dataList[i].SUP_SNAME + "," + this.dataList[i].ACCTNAME,
              Debit:this.dataList[i].DRAMT,
              Credit:this.dataList[i].CRAMT
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
              this.CLDrBal=data.Table1[0].CLBAL + " Dr"; ;
              this.rptclbal=data.Table1[0].CLBAL  + " Dr";
             }
            else{
              this.CLCrBal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr";
              this.rptclbal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr";
            }
            if(data.Table1[0].TLDR >0){
              this.currTotalDr=data.Table1[0].TLDR ;
              this.rptcrtotdr=data.Table1[0].TLDR ;
            }
            else  {
              this.currTotalDr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR) ;
              this.rptcrtotdr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR)+ "Dr";
            }
            if(data.Table1[0].TLCR >0){
              this.currTotalcr=data.Table1[0].TLCR  ;
              this.rptcrtotcr=data.Table1[0].TLCR  ;
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
                               
          this.Getadvancedata();
          this._loaderService.display(false);
        }
        else{
          this._toasterService.toast('info', 'info', 'No Data Found !');
          this._loaderService.display(false);
          return false;
           }
        })     
      } 
      GetClientName(clientcode)
      {
        let updateItem = this.ClientList.find(item => item.ACCTCODENAME === clientcode);
        this.ClientName=updateItem.ACCTNAME;
        //  this.ClientName=event.target.options[event.target.options.selectedIndex].text///.split("|")[1];
      }
      Openprint(No,Type) 
      {
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        
        if(confirm('Click OK to Print and Cancel to Edit')) { 
          if(Type=="PI")
           {       window.open('./#/popup/Account-Purchase-print/' + No + '/' + 'PI' + '/' , "PI Print", toolbar);      }
          else if(Type=="JV")
          {   window.open('./#/popup/Account-JV-Print/' + No + '/' + "JV" + '/' , "JV Print", toolbar); }
          else if(Type=="CN")
          {  window.open('./#/popup/Account-CreditNote-print/' + No + '/' , "CN Print", toolbar);  }
          else if(Type=="II")
          //{ window.open('./#/popup/Account-Invoice-print/' + No + '/' , "INV Print", toolbar);   }
          {let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_Invoice_Print.aspx?" +
          "huhpnk=" + this._loginService.getLogin()[0].GUID
          + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
          + "&Userid=" + this._loginService.getLogin()[0].CMPID
          + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
          + "&InvoiceNo=" + No
          + "&DisplayMode=" + "0"
          +"&cmp_username=" + this._loginService.getLogin()[0].CMP_USERNAME
              window.open(URL,  "Invoice Print", toolbar);
              return false; }
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
          { this._router.navigate(['/accounts/Voucher/BankPaymnt/Add/' + No]); }
          else if(Type=="SI")
          { return false;  }
          else if(Type=="II")
          {  
            this._router.navigate(['/accounts/transaction/invoice/general/' + No]); 
            return false;  }
            else if (Type == "PI")
             { 
               this._router.navigate(['/accounts/purchase/Purchase/PI/1/' + No]); 
       return false;}
        
        }
     }
    
      Print()  {
        let frdt=this.FromDate.replace('/','-')
        let todt=this.ToDate.replace('/','-')
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/Account-actstatement-AdvancePrint/' +  this.Client + '/' +  this.ClientName +  '/' +  frdt.replace('/','-') + '/' +  todt.replace('/','-') + '/' +  this.Status + '/' , "Print View", toolbar);
      } 
      Getadvancedata()
      {
        this.advdataForExcel=[];
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
        if(this.Status=="All")  {
          this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_With_Advance_Print_GetAll", jsonadvall)
          .subscribe((data: any) => {
          this.AdvanceTable=data.Table;
          for (var i = 0; i < this.AdvanceTable.length; i++) {
            let obj = {
              Type: this.AdvanceTable[i].transtype,
              Number:this.AdvanceTable[i].Transcode,
              Particulars:this.AdvanceTable[i].exp_sname + "," + this.AdvanceTable[i].sup_sname + "," + this.AdvanceTable[i].acctname,
              Amount:this.AdvanceTable[i].cramt
          }
            this.advheaderlist.push(obj);
          }
          this.advheaderlist.forEach((row: any) => {
            this.advdataForExcel.push(Object.values(row))
            });
            if(data.Table1.length>0){
          this.AdvTotal=data.Table1[0].totcramt;
            }
            this._loaderService.display(false)
            })
        }
          else {
          this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_With_Advance_Print_Get", jsonadv)
          .subscribe((data: any) => {
            this.AdvanceTable=data.Table;
            for (var i = 0; i < this.AdvanceTable.length; i++) {
              let obj = {
                Type: this.AdvanceTable[i].transtype,
                Number:this.AdvanceTable[i].Transcode,
                Particulars:this.AdvanceTable[i].exp_sname + "," + this.AdvanceTable[i].sup_sname + "," + this.AdvanceTable[i].acctname,
                Amount:this.AdvanceTable[i].cramt
            }
              this.advheaderlist.push(obj);
            }
            this.advheaderlist.forEach((row: any) => {
              this.advdataForExcel.push(Object.values(row))
              });
              if(data.Table1.length>0){
            this.AdvTotal=data.Table1[0].totcramt;
          }
            this._loaderService.display(false)
            })
            
        }
      }  
      getCompanyName()
      {
        this._loaderService.display(true)
        var jsoncmp = {
          CmpCode:this._loginService.getLogin()[0].CMPCODE,
          CityCode:this._loginService.getLogin()[0].CITYCODE
        }
        this._dataService.getData("Accounts/fn_Acc_Rpt_Common_CompanyDetails", jsoncmp)
          .subscribe((data: any) => {
          this.Compname=data.Table[0].cmp_name
          this._loaderService.display(false)
          })
      }
      AdvanceViewData()
      {
        this.showModal_Advance = true
        this.advheader="Account Statement for Advance From " + this.FromDate + " To "  + this.ToDate
        // this.loaderService.display(true)
       
      }
      close()
       {  this.showModal_Advance = false  }
       expt_exlwithadv() {

        if(confirm('Click OK For With Advance Excel,\n CANCEL For Without Advance Excel'))
        { 

          //  this.AdvanceTable.forEach((row: any) => {
          //  this.advdataForExcel.push(Object.values(row))
          //         });
          
            let reportData = {
              data: this.dataForExcel,
              advdata:this.advdataForExcel,
              headers: ["Type","Number","Date","Particulars","Debit","Credit"],
              advheaders: ["Type","Number","Particulars","Amount"],
              pagetype: "AccountStatement",
              title:this.Compname,
              subtitle:"Account Statement From " + this.FromDate + " To "  + this.ToDate,
              clntname:this.ClientName,
              opbal:"Opening: " + this.rptopbal,
              currenttot:"Current Total : " + this.rptcrtotdr + " " + this.rptcrtotcr,
              closing:"Closing : " + this.rptclbal,
              advance:"Advance : " + this.rptadvtotdr + this.rptadvtotcr
                     }
            this.exportser.exportExceltry(reportData, "Account_Statementl_With_Adv_" + this.Client);
            //this.dataForExcel=[];
          }
            else
            {
              return false;
              
            }
          }
          ShowRemark() {  
            this.showModal_Remark = true;
            this.Remark== "";
            var jsonremark = {
              ClCode:this.Client,
              cmp_code:this._loginService.getLogin()[0].CMPCODE,
              citycode:this._loginService.getLogin()[0].CITYCODE     
             }
             this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_ClientOutstandingList_Remark_Get", jsonremark)
             .subscribe((data: any) => {
               this.UserList=data.Table 
               this.RemarkList=data.Table 
               if(data.Table1.length>0){
               this.LastRemark=data.Table1[0].LastRemark;
               this.lblLastRemark=data.Table1[0].entrydt;
                 }
                 });
                 this._loaderService.display(false);       
          }
          DisplayRemark(rem)
          {
            this.Remark=rem;
          }
        closeRemark() 
         {  this.showModal_Remark = false  }
        
         AddRemark() {
            this.showModal_Remark = true;
            if (this.Remark== "") {
              this._toasterService.toast('info', 'info', 'Please Enter the Remark !');
              return false;
            }
            var jsonadd = {
              Remark:this.Remark,
              ClCode:this.Client,
              cmp_code:this._loginService.getLogin()[0].CMPCODE,
              citycode:this._loginService.getLogin()[0].CITYCODE,
              UserName:this._loginService.getLogin()[0].CMP_USERNAME
              }
              this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_ClientOutstandingList_Remark_Add", jsonadd)
              .subscribe((data: any) => {
                  this._toasterService.toast('success', 'success',`Remark Added Successfully`); 
                  this.ShowRemark(); 
                  });
                  this._loaderService.display(false)
          }  
          EnableAddCancel()  {
          this.lblRemark="";
          this.Remark="";
          this.disableAddbtn=false;
          this.disableCancelbtn=false;
          this.disableNewbtn=true;
        }   
        Clearctrl()
        {  this.lblRemark="";
          this.Remark="";
          this.disableAddbtn=true;
          this.disableCancelbtn=true;
          this.disableNewbtn=false;
        }
        UploadDoc()
        {
         let theTop = (screen.height / 2) - (483 / 2);
         let theLeft = (screen.width / 2) - (780 / 2);
         let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
         window.open('http://109.15.43.138/EDocument/UI/Accounts/frm_Acc_Search_Client_Outstanding.aspx?huhpnk=' +  this._loginService.getLogin()[0].CMP_USERENCCODE + '/' + this.Client + '/' +  this.ClientName +  '/'  , "Print View", toolbar);
         }
         clear()
         {  this.Client="";
            this.FromDate="";
            this.ToDate="";
       }
}