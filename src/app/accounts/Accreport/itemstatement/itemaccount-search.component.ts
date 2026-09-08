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
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-ItemAccountStatement-search',
    templateUrl: './itemaccount-search.component.html',
    styles: [],
    providers: [DatePipe]
  })
  export class ItemAccountStatement implements OnInit {
    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
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
    UserFromDate;
    UserToDate;
    ItemList:any = [];
    displayType: string = 'SEARCH';
    SearchItemdata_list: any = [];
    SearchdataItemAct_list: any = [];
    ItemName:string="";
    Item:string;
    OpDrBal:string;
    OpCrBal:string;
    CLDrBal:number;
    CLCrBal:string;
    currTotalDr:any;
    currTotalcr:any;
    AdvDrAmt:any;
    AdvCrAmt:any; 
    searchHeaderText:string="";
    PageType: any;
    dataForExcel = [];
    Compname:string;
    SubHeader:string;
    Header:string;
    PageName:string;
     public showModal_Advance: boolean = false; 
     advheader:string;
     AdvanceTable = [];
     Status:string="All"
     AdvTotal:any;
     Searchdata_list: any = [];
     exceldata_list: any = [];
     advdata_list: any = [];
     advdataheader_list: any = [];
     advdataForExcel = [];
     aclistheaderlist: any = [];
     rptopbal:string;
     rptclbal:string;
     rptcrtotdr:any;
     rptcrtotcr:any;
     rptadvtotdr:any;
     rptadvtotcr:any;
     advheaderlist: any = [];
    constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private _router: Router,private datePipe: DatePipe,
        private http: HttpClient, private exportser: ExportexcelService,
        private _activatedRoute: ActivatedRoute,
        private _loginService: LoginService,
          private modalService: BsModalService,
        private _loaderService: LoaderService,
      ) { }
      ngOnInit() {
        this.loaderService.display(true);
        this._activatedRoute.params.subscribe(params => {
          this.PageType = params["PageType"]
        })
        this.verifyPermission('210','View') 
        this.FromDate='01/04/2006'//this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE///this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE)
        this.ToDate = new Date();
        this.ToDate =  this._dataService.datechnge(this.ToDate);
        this.Header="Account Wise Item Statement";
        this.PageName="Account Wise Item Statement";
        
        const jsonItem = {
          CmpCode: this._loginService.getLogin()[0].CMPCODE,
          CityCode: this._loginService.getLogin()[0].CITYCODE,
          CityCode1: this._loginService.getLogin()[0].CITYCODE1,
        }
          this._dataService.getData("Accounts/Fill_ACCOUNTWISE_ITEM", jsonItem)
          .subscribe((data: any) => {
          this.ItemList = data.Table
          this._loaderService.display(false)
          })
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
    FromDateChanged(ev){
      this.FromDate=ev.formatted
    }
    ToDateChanged(ev){
    this.ToDate=ev.formatted
    }
    GetItemName(icode)  {
     let updateItem = this.ItemList.find(item => item.ITEMACCTCODE === icode);
     this.ItemName=updateItem.ITEMACCTNAME;
    }
    Showdata(){
      this.loaderService.display(true);
      if (this.Item ==""  || this.Item ==undefined) {
          this._toasterService.toast('warning', 'warning', "Please select Account !");
          return false;
       }
      if (this.FromDate ==""  || this.FromDate ==undefined){
        this._toasterService.toast('warning', 'warning', "From Date cannot be blank !");
        return false;
      }
      if ( this.ToDate=="" || this.ToDate==undefined){      
        this._toasterService.toast('warning', 'warning', "To Date cannot be blank!");
        return false;
      }
   
        this.ShowAcccountwiseItemStatementList();
       
    }    
   ShowAcccountwiseItemStatementList()
    {
        this.loaderService.display(true);
        // this.UserFromDate=this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate)
        // this.UserToDate=this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate)
        var jsonmaster = {
        ClientCode:this.Item,
        cmp_code: this._loginService.getLogin()[0].CMPCODE,
        User_StartDate:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate),//this.UserFromDate,
        User_EndDate:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate),//this.UserToDate,//this.datePipe.transform(this.ToDate, 'dd-MMM-yyyy'),
        Fin_StartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
        Fin_EndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
         }
       // console.log(jsonmaster)
        this._dataService.getData("Accounts/Acc_Rpt_AccountWise_ItemStatement_List", jsonmaster)
          .subscribe((data: any) => {
            this.displayType = 'LIST';
            this.SearchdataItemAct_list = data.Table1;
            this.aclistheaderlist=["ITEMNAME","DEBIT","CREDIT"] //data.Table3;
            this.searchHeaderText="Accountwise Item Statement From " + this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate)+ " To " + this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate);
            this.SubHeader=this.Compname;
            if(data.Table2[0].DRAMT >0){
              this.currTotalDr=data.Table2[0].DRAMT + " Dr"  ;
            }
            else {
              this.currTotalDr=(data.Table2[0].DRAMT=="0.00")?"" :Math.abs(data.Table2[0].DRAMT) + " Dr";
            }
            if(data.Table2[0].CRAMT >0){
              this.currTotalcr=data.Table2[0].CRAMT + " Cr" ;
            }
            else {
              this.currTotalcr=(data.Table2[0].CRAMT=="0.00")?"" :Math.abs(data.Table2[0].CRAMT) + " Cr";
            }
          });
       //// this.ShowOutstanding();
        this.loaderService.display(false);
    }

    ExportItemstatement(){
        this.loaderService.display(true);
        this.SearchdataItemAct_list.forEach((row: any) => {
            this.dataForExcel.push(Object.values(row))
            });
        let reportData = {
            data: this.dataForExcel,
           headers: this.aclistheaderlist,//Object.keys(this.aclistheaderlist[0]),
           pagetype: "ItemActStatement",
            //headers: ['ITEMNAME','Debit','Credit'],
            subtitle:this.Compname,
            title:"Account wise Item Statement  From " + this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate) + " To "  + this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate),
            itemname:this.ItemName,
            currtotal:this.currTotalDr + " " + this.currTotalcr
              }
          this.exportser.exportExceltry(reportData, "Accountwise_ItemStatement_");
    }

    getCompanyName()  {
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
      AdvanceViewData()  {
        this.dataForExcel=[];
        this.exceldata_list=[];
        this.ShowOutstanding();
        if((this.AdvCrAmt=='' &&  this.AdvDrAmt=='') || (this.AdvCrAmt==undefined &&  this.AdvDrAmt==undefined))   {
           alert("No Record Found!")
           return false;
        } 
         else { 
          this.loaderService.display(true)
          this.showModal_Advance = true
          this.advheader="Account Statement for Advance From " + this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate) + " To "  + this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate);
          var jsonadv = {
            ClCode:this.Item,
            FINSTARTDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
            FINENDDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
            cmp_code:this._loginService.getLogin()[0].CMPCODE,
            citycode1:this._loginService.getLogin()[0].CITYCODE1,
            STARTDATE:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate),
            ENDDATE:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate)
          }
          var jsonadvall = {
            ClCode:this.Item,
            cmp_code:this._loginService.getLogin()[0].CMPCODE,
            citycode1:this._loginService.getLogin()[0].CITYCODE1,
            STARTDATE:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate),
            ENDDATE:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate)
          }
          if(this.Status=="All")
          {
            this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_With_Advance_Print_GetAll", jsonadvall)
            .subscribe((data: any) => {
              if(data.Table.length>0){
                this.AdvanceTable=data.Table;
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
                this.AdvTotal=data.Table1[0].totcramt;
              }
              else  {
              return false;
              }
          })
        }
         else   {
          this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_With_Advance_Print_Get", jsonadv)
          .subscribe((data: any) => {
            if(data.Table.length>0)  {
            this.AdvanceTable=data.Table;
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
              this.AdvTotal=data.Table1[0].totcramt;
            }
            else {
            return false;
            }
          })
        }
      } 
        this.loaderService.display(false)
   }

      close()    {
         this.showModal_Advance = false;
      }
     Openprint(No,Type)  {
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      if(confirm('Click OK to Print'))  { 
        if(Type=="PI")  {
               window.open('./#/popup/Account-Purchase-Print/' + No + '/' , "PI Print", toolbar);
        }
        else if(Type=="BR" || Type=="BP")
        {
               window.open('./#/popup/Account-CashBook-BankReceipt-print/' + Type + '/' + No + '/', "BR Print", toolbar);
        }          
        else  if(Type=="JV")
        {  
          window.open('./#/popup/Account-JV-Print/' + No + '/' + "JV" + '/' , "JV Print", toolbar); 
        }        
      }else{
        return false;
      }
    }

    Print()  {
      let frdt=this.FromDate.replace('/','-')
      let todt=this.ToDate.replace('/','-')
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      window.open('././#/popup/Account-actstatement-AdvancePrint/' +  this.Item.split("|")[1]+ '/' +  this.ItemName +  '/' +  frdt.replace('/','-') + '/' +  todt.replace('/','-') + '/' +  this.Status + '/' , "Print View", toolbar);
   }
   ShowOutstanding()  {
    this.dataForExcel=[];
        this.advdataForExcel=[]; 
     this.loaderService.display(true)
     var jsonmaster = {
     ClientCode:this.Item,
     cmp_code: this._loginService.getLogin()[0].CMPCODE,
     User_StartDate:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate),
     User_EndDate:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate),
     Fin_StartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
     Fin_EndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
         }
    // console.log(jsonmaster)
     this._dataService.getData("Accounts/Acc_Rpt_ClientOutstandingALL_AllCITY_LIST", jsonmaster)
       .subscribe((data: any) => {
         this.displayType = 'LIST';
         this.Searchdata_list = data.Table;
         ///this.exceldata_list= data.Table4;
         for (var i = 0; i < this.Searchdata_list.length; i++) {
          let obj = {
            Type: this.Searchdata_list[i].TRANSTYPE,
            Number:this.Searchdata_list[i].TRANSCODE,
            Date:this.Searchdata_list[i].TRANSDATE,
            Particulars:this.Searchdata_list[i].NARR + "," + this.Searchdata_list[i].EXP_SNAME + "," + this.Searchdata_list[i].SUP_SNAME + "," + this.Searchdata_list[i].ACCTNAME,
            Debit:this.Searchdata_list[i].CRAMT,
            Credit:this.Searchdata_list[i].DRAMT
        }
          this.exceldata_list.push(obj);
       }
        ///// this.searchHeaderText="Account Statement From " + this.FromDate + " To " + this.ToDate ;
         if(data.Table1[0].OPBAL >0){
          this.rptopbal=data.Table1[0].OPBAL  + " Dr";
         }
         else  {
          // this.OpCrBal=(data.Table1[0].OPBAL=="0.00")?"0.0" :Math.abs(data.Table1[0].OPBAL) + " Cr";
           this.rptopbal=(data.Table1[0].OPBAL=="0.00")?"0.0" :Math.abs(data.Table1[0].OPBAL) + " Cr";
         }
         if(data.Table1[0].CLBAL >0){
           // this.CLDrBal=data.Table1[0].CLBAL ;
           this.rptclbal=data.Table1[0].CLBAL  + " Dr";
         }
         else{
            // this.CLCrBal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr";
           this.rptclbal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr";
         }
         if(data.Table1[0].TLDR >0){
            // this.currTotalDr=data.Table1[0].TLDR  ;
           this.rptcrtotdr=data.Table1[0].TLDR + " Dr";
         }
         else{
              //this.currTotalDr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR) ;
           this.rptcrtotdr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR)+ "Dr";
         }
         if(data.Table1[0].TLCR >0){
           // this.currTotalcr=data.Table1[0].TLCR ;
           this.rptcrtotcr=data.Table1[0].TLCR +" Cr" ;
         }
         else {
            // this.currTotalcr=(data.Table1[0].TLCR=="0.00")?"" :Math.abs(data.Table1[0].TLCR) 
           this.rptcrtotcr=(data.Table1[0].TLCR=="0.00")?"" :Math.abs(data.Table1[0].TLCR) 
         }
         if(data.Table2[0].ADVTOTALDR >0)  {
           this.AdvDrAmt=data.Table2[0].ADVTOTALDR ;
           this.rptadvtotdr=data.Table2[0].ADVTOTALDR ;
         }
         else{
           this.AdvDrAmt=(data.Table2[0].ADVTOTALDR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALDR) ;
           this.rptadvtotdr=(data.Table2[0].ADVTOTALDR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALDR) ;
         }
         if(data.Table2[0].ADVTOTALCR >0){
           this.AdvCrAmt=data.Table2[0].ADVTOTALCR  ;
           this.rptadvtotcr=data.Table2[0].ADVTOTALCR ;
         }
         else{
           this.AdvCrAmt=(data.Table2[0].ADVTOTALCR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALCR) ;
           this.rptadvtotcr=(data.Table2[0].ADVTOTALCR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALCR) ;
         }
        /// this.ClientName; 
        // this.searchHeaderText.replace("\n","<br>")
          })
             this.loaderService.display(false) 
             ///this.getadvancedata(); 
           }

   expt_exlwithadv() {
      this.advheaderlist.forEach((row: any) => {
        this.advdataForExcel.push(Object.values(row))
      });
    if(confirm('Click OK For With Advance Excel,\n CANCEL For Without Advance Excel')){ 
        this.exceldata_list.forEach((row: any) => {
          this.dataForExcel.push(Object.values(row))
        });
        let reportData = {
          data: this.dataForExcel,
          advdata:this.advdataForExcel,//this.advdataForExcel,
          headers: Object.keys(this.exceldata_list[0]),
          advheaders:  ["Type","Number","Particulars","Amount"],
          pagetype: "AccountStatement",
          title:"Account Statement From " + this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate) + " To "  + this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate),
          subtitle:this.Compname,
          clntname:this.ItemName,
          opbal:"Opening: " + this.rptopbal,
          currenttot:"Current Total : " + this.rptcrtotdr + " " + this.rptcrtotcr,
          closing:"Closing : " + this.rptclbal,
          advance:"Advance : " + this.rptadvtotdr + this.rptadvtotcr
        }
        this.exportser.exportExceltry(reportData, "Account_StatementAll_With_AllBranch_With_Adv_");
        this.dataForExcel=[];
        this.advdataForExcel=[];
      }
        else {
          return false;
        }  
    }
} 
