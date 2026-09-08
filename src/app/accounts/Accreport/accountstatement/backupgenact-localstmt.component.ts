// import { Component, OnInit,ViewChild,ElementRef } from '@angular/core';
// import { Router, ActivatedRoute } from '@angular/router';
// import { LoginService } from '../../../shared/service/loginService';
// import { ToastCommonService } from '../../../shared/service/toastService';
// import { IMyDpOptions } from 'mydatepicker';
// import { LoaderService } from '../../../shared/service/loader.service';
// import { HttpClient } from '@angular/common/http';
// import { DataService } from 'src/app/shared/service/dataService';
// import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
// import { BsModalService, BsModalRef } from 'ngx-bootstrap';
// import { ModalDirective } from 'ngx-bootstrap/modal';
// @Component({
//     selector: 'app-General-AccountStmt-Local',
//     templateUrl: './genact-localstmt.component.html',
//     styles: []
//   })
//   export class GenActStatementLocal implements OnInit {
//     public myDatePickerOptions: IMyDpOptions = {
//         dateFormat: 'dd-mmm-yyyy',
//         inline: false,
//         height: '18px',
//         width: '180px',
//         componentDisabled: false,
//         selectionTxtFontSize: '12px',
//         editableDateField: false,
//         sunHighlight: true,
//         satHighlight: true,
//         firstDayOfWeek: 'su',
//         openSelectorTopOfInput: false,
//         openSelectorOnInputClick: true,
//         selectorHeight: '180px',
//         selectorWidth: '200px',
//         disableUntil: { year: 0, month: 0, day: 0 },
//         disableSince: { year: 0, month: 0, day: 0 }
//       };
//       public showModal_Advance: boolean = false; 
//       public showModal_Remark: boolean =false;
//       ClientList:any = [];
//       displayType: string = 'SEARCH';
//       FromDate;
//       ToDate;
//       Client:string;
//       searchHeaderText:string="General Account Statement Local";
//       ClientName:string;
//       OpDrBal:string;
//       OpCrBal:string;
//       CLDrBal:string;
//       CLCrBal:string;
//       currTotalDr:any;
//       currTotalcr:any;
//       AdvDrAmt:any;
//       AdvCrAmt:any;
//       dataList = [];
//       dataForExcel = [];
//       advdataForExcel = [];
//       AdvanceTable = [];
//       Compname:string;
//       rptopbal:string;
//       rptclbal:string;
//       rptcrtotdr:any;
//       rptcrtotcr:any;
//       rptadvtotdr:any;
//       rptadvtotcr:any;
//       Status:string="All";
//       advheader:string;
//       AdvTotal:string;
//       Remark:string;
//       LastRemark:string="";
//       lblLastRemark="Last Remark";
//       UserList: any = [];
//       constructor(
//         private _dataService: DataService,
//         private _toasterService: ToastCommonService,
//         private loaderService: LoaderService,
//         private _router: Router,
//         private http: HttpClient, private exportser: ExportexcelService,
//         private _activatedRoute: ActivatedRoute,
//         private _loginService: LoginService,
//           private modalService: BsModalService,
//         private _loaderService: LoaderService,
//       ) { }
//       ngOnInit() {
//         this.FromDate= new Date();
//         this.FromDate=this._dataService.datechnge1(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE)
//         this.ToDate = new Date();
//         this.ToDate =  this._dataService.datechnge1(this.ToDate)
//         this.verifyPermission('167','View') 
//           this.FillAccount();
//     }
//     verifyPermission(formId, userMode) {
//         this._loaderService.display(true);
//         this._loginService.verifyRights(formId, '')
//             .subscribe((data: any) => {          
//                this._loginService.checkVerify(userMode, data);
//                this._loaderService.display(false);
    
//             });
//     }
//     FillAccount(){

//     const jsonmaster = {
//         cmpcode: this._loginService.getLogin()[0].CMPCODE,
//         citycode: this._loginService.getLogin()[0].CITYCODE,
//         citycode1: this._loginService.getLogin()[0].CITYCODE1,
//         cmpid: this._loginService.getLogin()[0].CMPID,
//       }
//        this._dataService.getData("Accounts/ACC_CMP_FILL_GACCOUNT_PAGELOAD", jsonmaster)
//         .subscribe((data: any) => {
//          // console.log(data)
//           this.ClientList = data.Table
//           this._loaderService.display(false)
//         })
//     }
//     Showdata()  {
//         this.loaderService.display(true);
//         if (this.Client ==""  || this.Client ==undefined){
//           this._toasterService.toast('warning', 'warning', "Please select Account !");
//           return false;
//           }
//         if (this.FromDate ==""  || this.FromDate ==undefined) {
//           this._toasterService.toast('warning', 'warning', "From Date cannot be blank !");
//           return false;
//         }
//         if ( this.ToDate=="" || this.ToDate==undefined){
//           this._toasterService.toast('warning', 'warning', "To Date cannot be blank!");
//           return false;
//         }
//         const jsonData = {
//           ClCode:(this.Client==undefined)?"" :this.Client,
//           cmp_code: this._loginService.getLogin()[0].CMPCODE,
//           citycode1: this._loginService.getLogin()[0].CITYCODE1,
//           STARTDATE:this.FromDate,
//           ENDDATE:this.ToDate,
     
//        };
//           this._loaderService.display(true);
//           this._dataService.getData("Accounts/Acc_Rpt_ClientOutstandingList_GetAll", jsonData)
//           .subscribe((data: any) => {
//           this.displayType="LIST";
//           this.dataList = data.Table;
//             this.dataList.forEach((row: any) => {
//             this.dataForExcel.push(Object.values(row))
//             });
//             if(data.Table1[0].OPBAL >0) {
//               this.OpDrBal=data.Table1[0].OPBAL  + " Dr";
//               this.rptopbal=data.Table1[0].OPBAL  + " Dr"; }
//               else   {
//               this.OpCrBal=(data.Table1[0].OPBAL=="0.00")?"0.0" :Math.abs(data.Table1[0].OPBAL) + " Cr";
//               this.rptopbal=(data.Table1[0].OPBAL=="0.00")?"0.0" :Math.abs(data.Table1[0].OPBAL) + " Cr";
//             }
//             if(data.Table1[0].CLBAL >0){
//               this.CLDrBal=data.Table1[0].CLBAL ;
//               this.rptclbal=data.Table1[0].CLBAL  + " Dr";
//              }
//             else{
//               this.CLCrBal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr";
//               this.rptclbal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr";
//             }
//             if(data.Table1[0].TLDR >0){
//               this.currTotalDr=data.Table1[0].TLDR  ;
//               this.rptcrtotdr=data.Table1[0].TLDR + " Dr";
//             }
//             else  {
//               this.currTotalDr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR) ;
//               this.rptcrtotdr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR)+ "Dr";
//             }
//             if(data.Table1[0].TLCR >0){
//               this.currTotalcr=data.Table1[0].TLCR ;
//               this.rptcrtotcr=data.Table1[0].TLCR +" Cr" ;
//             }
//             else  {
//               this.currTotalcr=(data.Table1[0].TLCR=="0.00")?"" :Math.abs(data.Table1[0].TLCR) 
//               this.rptcrtotcr=(data.Table1[0].TLCR=="0.00")?"" :Math.abs(data.Table1[0].TLCR) 
//             }
//             if(data.Table2[0].ADVTOTALDR >0) {
//               this.AdvDrAmt=data.Table2[0].ADVTOTALDR ;
//               this.rptadvtotdr=data.Table2[0].ADVTOTALDR ;
//             }
//             else {
//               this.AdvDrAmt=(data.Table2[0].ADVTOTALDR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALDR) ;
//               this.rptadvtotdr=(data.Table2[0].ADVTOTALDR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALDR) ;
//             }
//             if(data.Table2[0].ADVTOTALCR >0) {
//               this.AdvCrAmt=data.Table2[0].ADVTOTALCR  ;
//               this.rptadvtotcr=data.Table2[0].ADVTOTALCR ;
//             }
//             else {
//               this.AdvCrAmt=(data.Table2[0].ADVTOTALCR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALCR) ;
//               this.rptadvtotcr=(data.Table2[0].ADVTOTALCR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALCR) ;
//             } 
//             this.searchHeaderText="Account Statement From " + this.FromDate + " To " + this.ToDate
//             this._loaderService.display(false);
//           })
//       } 
//       GetClientName(clientcode)
//       {
//         let updateItem = this.ClientList.find(item => item.ACCTCODENAME === clientcode);
//         this.ClientName=updateItem.ACCTNAME;
//         //  this.ClientName=event.target.options[event.target.options.selectedIndex].text///.split("|")[1];
//       }
//       Openprint(No,Type) 
//       {
//         let theTop = (screen.height / 2) - (483 / 2);
//         let theLeft = (screen.width / 2) - (780 / 2);
//         let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        
//         if(confirm('Click OK to Print and Cancel to Edit')) { 
//           if(Type=="PI")
//            {       window.open('./#/popup/Account-Purchase-Print/' + No + '/' , "PI Print", toolbar);      }
//           else if(Type=="JV")
//           {   window.open('./#/popup/Account-JV-Print/' + No + '/' + "JV" + '/' , "JV Print", toolbar); }
//           else if(Type=="CN")
//           {  window.open('./#/popup/Account-CreditNote-Print/' + No + '/' , "CN Print", toolbar);  }
//           else if(Type=="II")
//           { window.open('./#/popup/Account-Invoice-Print/' + No + '/' , "INV Print", toolbar);   }
//           else if(Type=="SI")
//           {  return false;  }
//           else if(Type=="BI")
//           {  return false;   }
//           else    
//           {  window.open('./#/popup/Account-CashBook-BankReceipt-print/' + Type + '/' + No + '/', "BR Print", toolbar);  }
//         }
//         else{
//           if(Type=="JV")
//           { this._router.navigate(['/accounts/Voucher/JV/Add/JV/' + No]);  }
//           else if(Type=="BR")
//           {  this._router.navigate(['/accounts/Voucher/BankRecpt/Add/' + No]); }
//           else if(Type=="BP")
//           { this._router.navigate(['/accounts/Voucher/BankPayment/Add/' + No]); }
//           else if(Type=="SI")
//           { return false;  }
//           else if(Type=="II")
//           {  return false;  }
//         else
//           {   return false;  }
        
//         }
//      }
//      ShowRemark() {  
//         this.showModal_Remark = true;
//         var jsonremark = {
//           ClCode:this.Client,
//           cmp_code:this._loginService.getLogin()[0].CMPCODE,
//           citycode:this._loginService.getLogin()[0].CITYCODE     
//          }
//          this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_ClientOutstandingList_Remark_Get", jsonremark)
//          .subscribe((data: any) => {
//            this.UserList=data.Table 
//            this.LastRemark=data.Table1[0].LastRemark;
//            this.lblLastRemark=data.Table1[0].entrydt;
//              });
//              this.loaderService.display(false);       
//       }
//       Print()  {
//         let frdt=this.FromDate.replace('/','-')
//         let todt=this.ToDate.replace('/','-')
//         let theTop = (screen.height / 2) - (483 / 2);
//         let theLeft = (screen.width / 2) - (780 / 2);
//         let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
//         window.open('./#/popup/Account-actstatement-AdvancePrint/' +  this.Client + '/' +  this.ClientName +  '/' +  frdt.replace('/','-') + '/' +  todt.replace('/','-') + '/' +  this.Status + '/' , "Print View", toolbar);
//       } 
//       AdvanceViewData()
//       {
//         this.showModal_Advance = true
//         this.advheader="Account Statement for Advance From " + this.FromDate + " To "  + this.ToDate,
//         this.loaderService.display(true)
//         var jsonadv = {
//           ClCode:this.Client,
//           FINSTARTDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
//           FINENDDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
//           cmp_code:this._loginService.getLogin()[0].CMPCODE,
//           citycode1:this._loginService.getLogin()[0].CITYCODE1,
//           STARTDATE:this.FromDate,
//           ENDDATE:this.ToDate
        
//         }
//         var jsonadvall = {
//           ClCode:this.Client,
//           cmp_code:this._loginService.getLogin()[0].CMPCODE,
//           citycode1:this._loginService.getLogin()[0].CITYCODE1,
//           STARTDATE:this.FromDate,
//           ENDDATE:this.ToDate
        
//         }
//         if(this.Status=="All")  {
//           this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_With_Advance_Print_GetAll", jsonadvall)
//           .subscribe((data: any) => {
//           this.AdvanceTable=data.Table;
//           this.AdvTotal=data.Table1[0].totcramt;
//             this.loaderService.display(false)
//             })
//         }
//           else {
//           this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_With_Advance_Print_Get", jsonadv)
//           .subscribe((data: any) => {
//             this.AdvanceTable=data.Table;
//             this.AdvTotal=data.Table1[0].totcramt;
//             this.loaderService.display(false)
//             })
            
//         }
//       }
//       close()
//        {  this.showModal_Advance = false  }
//        expt_exlwithadv() {
          
//         if(confirm('Click OK For With Advance Excel,\n CANCEL For Without Advance Excel'))
//         { 
            
//            this.dataList.forEach((row: any) => {
//                 this.dataForExcel.push(Object.values(row))
//                 });
//                 this.AdvanceTable.forEach((row: any) => {
//                   this.advdataForExcel.push(Object.values(row))
//                   });
//             let reportData = {
//               data: this.dataForExcel,
//               advdata:this.advdataForExcel,
//               headers: Object.keys(this.dataForExcel[0]),
//               advheaders: Object.keys(this.AdvanceTable[0]),
//               pagetype: "GenActStatement",
//               title:this.Compname,
//               subtitle:"Account Statement All with All Branch From " + this.FromDate + " To "  + this.ToDate,
//               clntname:this.ClientName,
//               opbal:"Opening: " + this.rptopbal,
//               currenttot:"Current Total : " + this.rptcrtotdr + " " + this.rptcrtotcr,
//               closing:"Closing : " + this.rptclbal,
//               advance:"Advance : " + this.rptadvtotdr + this.rptadvtotcr
//                      }
//             this.exportser.exportExceltry(reportData, "Account_StatementAll_With_AllBranch_With_Adv_");
//             this.dataForExcel=[];
//           }
//             else
//             {
//               return false;
              
//             }
//           }
// }