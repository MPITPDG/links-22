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
    selector: 'app-genactstatement',
    templateUrl: './genactstmt.component.html',
    styles: []
  })
  export class GenActStatementAllBranch implements OnInit {
    @ViewChild('Advance', {static: false}) public Advancemodel: ModalDirective;
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
   
  modalRef: BsModalRef;
    FromDate;
    ToDate;
    RemarkList:any=[];
    ClientList:any = [];
    displayType: string = 'SEARCH';
    Searchdata_list: any = [];
    exceldata_list = [];
    advdata_list = [];
    Client:string;
    searchHeaderText:string="GENERAL ACCOUNT STATEMENT  FOR ALL CITY";;
    ClientName:string;
    OpDrBal:string;
    OpCrBal:string;
    CLDrBal:string;
    CLCrBal:string;
    currTotalDr:any;
    currTotalcr:any;
    AdvDrAmt:any;
    AdvCrAmt:any;
    dataForExcel = [];
    HeaderText:string="GENERAL ACCOUNT STATEMENT  FOR ALL CITY";
    advdataForExcel = [];
    AdvanceTable = [];
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
    UserName:string;
    UserList: any = [];
    selectedToAdd: any;
    Str1:string;
    colspanlen:number;
    strdtl:string;
    PageType:string;
    public showModal_Advance: boolean = false; 
    public showModal_Remark: boolean =false;
    public disableAddbtn: boolean =false;
    public disableCancelbtn: boolean =false;
    public disableCancelAddbtn: boolean=false;
    advheaderlist:any = [];
    dataForExcelHead = [];
    advheaders = [];
    headers2=[];

    strdtlist = []
    public disableNewbtn: boolean =false;
    lblRemark:string;
    constructor(
      private _dataService: DataService,
      private _toasterService: ToastCommonService,
      private loaderService: LoaderService,
      private _router: Router,
      private http: HttpClient, private exportser: ExportexcelService,
      private _activatedRoute: ActivatedRoute,
      private _loginService: LoginService,
        private modalService: BsModalService,
      private _loaderService: LoaderService,
    ) { }
    ngOnInit() {
      this._activatedRoute.params.subscribe(params => {
        this.PageType = params["PageType"]
      })
      this.FromDate= new Date();
      this.FromDate=this._dataService.datechnge1(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE)
      this.ToDate = new Date();
      this.ToDate =  this._dataService.datechnge1(this.ToDate)
      this.FillClient();
    }
    FillClient()
    {
    const jsonmaster = {
        cmpcode: this._loginService.getLogin()[0].CMPCODE,
        citycode: this._loginService.getLogin()[0].CITYCODE,
        citycode1: this._loginService.getLogin()[0].CITYCODE1,
    }      
        this._dataService.getData("Accounts/CMP_FillGenralAccount", jsonmaster)
        .subscribe((data: any) => {
        this.ClientList = data.Table
        this._loaderService.display(false)
        })
        
    }
    ShowOutstanding()
    {
      if (this.Client=="" || this.Client==undefined){
        this._toasterService.toast('error', 'Error', "Please select client from list !");       
        return false;
      }
      this.loaderService.display(true)
      var jsonmaster = {
      ClientCode:this.Client,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      User_StartDate:this.FromDate,
      User_EndDate:this.ToDate,
      Fin_StartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      Fin_EndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE        
      }
      this._dataService.getData("Accounts/Acc_Rpt_ClientOutstandingALL_AllCITY_LIST", jsonmaster)
        .subscribe((data: any) => {
          if (data.Table.length>0)
          {
            this.displayType = 'LIST';
            this.Searchdata_list = data.Table;
            //this.exceldata_list = data.Table4;
             for (var i = 0; i < this.Searchdata_list.length; i++) {
               let obj = {
                 Type: this.Searchdata_list[i].TRANSTYPE,
                 Number:this.Searchdata_list[i].TRANSCODE,
                 Date:this.Searchdata_list[i].TRANSDATE,
                 Particulars:this.Searchdata_list[i].NARR + "," + this.Searchdata_list[i].EXP_SNAME + "," + this.Searchdata_list[i].SUP_SNAME + "," + this.Searchdata_list[i].ACCTNAME,
                 Debit:this.Searchdata_list[i].DRAMT,
                 Credit:this.Searchdata_list[i].CRAMT
             }
               this.exceldata_list.push(obj);
            }
            // this.Searchdata_list.forEach((row: any) => {
            //   this.dataForExcel.push(Object.values(row))
            //   });
               this.exceldata_list.forEach((row: any) => {
               this.dataForExcel.push(Object.values(row))
               });
            this.searchHeaderText="Account Statement From " + this.FromDate + " To " + this.ToDate ;
            if(data.Table1[0].OPBAL >0)   {
              this.OpDrBal=data.Table1[0].OPBAL  + " Dr";
              this.rptopbal=data.Table1[0].OPBAL  + " Dr";
            }
            else  {
              this.OpCrBal=(data.Table1[0].OPBAL=="0.00")?"0.0" :Math.abs(data.Table1[0].OPBAL) + " Cr";
              this.rptopbal=(data.Table1[0].OPBAL=="0.00")?"0.0" :Math.abs(data.Table1[0].OPBAL) + " Cr";
            }
            if(data.Table1[0].CLBAL >0) {
              this.CLDrBal=data.Table1[0].CLBAL  + " Dr";
              this.rptclbal=data.Table1[0].CLBAL  + " Dr";
            }
            else {
              this.CLCrBal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr";
              this.rptclbal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr";
            }
            if(data.Table1[0].TLDR >0)  {
              this.currTotalDr=data.Table1[0].TLDR  ;
              this.rptcrtotdr=data.Table1[0].TLDR + " Dr";
            }
            else  {
              this.currTotalDr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR) ;
              this.rptcrtotdr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR)+ "Dr";
            }
            if(data.Table1[0].TLCR >0)  {
              this.currTotalcr=data.Table1[0].TLCR ;
              this.rptcrtotcr=data.Table1[0].TLCR +" Cr" ;
            }
            else  {
              this.currTotalcr=(data.Table1[0].TLCR=="0.00")?"" :Math.abs(data.Table1[0].TLCR) 
              this.rptcrtotcr=(data.Table1[0].TLCR=="0.00")?"" :Math.abs(data.Table1[0].TLCR) 
            }
            if(data.Table2[0].ADVTOTALDR >0)   {
              this.AdvDrAmt=data.Table2[0].ADVTOTALDR ;
              this.rptadvtotdr=data.Table2[0].ADVTOTALDR ;
            }
            else {
              this.AdvDrAmt=(data.Table2[0].ADVTOTALDR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALDR) ;
              this.rptadvtotdr=data.Table2[0].ADVTOTALDR ;
            }
            if(data.Table2[0].ADVTOTALCR >0)  {
              this.AdvCrAmt=data.Table2[0].ADVTOTALCR  ;
              this.rptadvtotcr=data.Table2[0].ADVTOTALCR ;
            }
            else  {
              this.AdvCrAmt=(data.Table2[0].ADVTOTALCR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALCR) ;
              this.rptadvtotcr=data.Table2[0].ADVTOTALCR ;
            }          
              this.getCompanyName(); 
             this.getadvancedata();
             this.loaderService.display(false)  
          }
          else
          {
            this._toasterService.toast('info', 'info', "No Data Found!");     
            this._loaderService.display(false)
          }
        })        
    }  
    GetClientName(clientcode)
    {
      let updateItem = this.ClientList.find(item => item.acctcodename === clientcode);
      this.ClientName=updateItem.acctname;
      //  this.ClientName=event.target.options[event.target.options.selectedIndex].text///.split("|")[1];
    }
    expt_exlwithadv() {
     if(confirm('Click OK For With Advance Excel,\n CANCEL For Without Advance Excel'))
      {
 
           let reportData = {
            data: this.dataForExcel,
            advdata:this.advdataForExcel,
            headers: ["Type","Number",'Date','Particulars',"Debit",'Credit'],//Object.keys(this.exceldata_list[0]),
            advheaders:["Type","Number","Particulars","Amount"],/// Object.keys(this.advdata_list[0]),
            pagetype: "AccountStatement",
            title:this.Compname,
            subtitle:"Account Statement All with All Branch From  " + this.FromDate + "  To "  + this.ToDate,
            clntname:this.ClientName,
            opbal:"Opening: " + this.rptopbal,
            currenttot:"Current Total : " + this.rptcrtotdr + " " + this.rptcrtotcr,
            closing:"Closing : " + this.rptclbal,
            advance:"Advance : " + this.rptadvtotdr + this.rptadvtotcr
                   }
          this.exportser.exportExceltry(reportData, "Account_StatementAll_With_AllBranch_With_Adv_");
          //this.dataForExcel=[];
        }
          else
          {
            return false;
          }
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
    getadvancedata()
    {
        this.loaderService.display(true)
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
        //   this.advdata_list.forEach((row: any) => {
        //   this.advdataForExcel.push(Object.values(row))
        //     });
            this.loaderService.display(false)
           })
        }
         else   {
          this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_With_Advance_Print_Get", jsonadv)
          .subscribe((data: any) => {
            this.advdata_list=data.Table;
            // this.advdata_list.forEach((row: any) => {
            //   this.advdataForExcel.push(Object.values(row))
            //   });
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
              this.loaderService.display(false)
           })
         }        
    }
    AdvanceViewData()
    {
      this.showModal_Advance = true
      this.advheader="Account Statement for Advance From " + this.FromDate + " To "  + this.ToDate,
      this.loaderService.display(true)
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
        // for (var i = 0; i < this.AdvanceTable.length; i++) {
        //   let obj = {
        //     Type: this.AdvanceTable[i].transtype,
        //     Number:this.AdvanceTable[i].Transcode,
        //     Particulars:this.AdvanceTable[i].exp_sname + "," + this.AdvanceTable[i].sup_sname + "," + this.AdvanceTable[i].acctname,
        //     Amount:this.AdvanceTable[i].cramt
        // }
        //   this.advheaderlist.push(obj);
        // }
        // this.advheaderlist.forEach((row: any) => {
        //   this.advdataForExcel.push(Object.values(row))
        //   });
        this.AdvTotal=data.Table1[0].totcramt;
          this.loaderService.display(false)
          })
      }
        else {
        this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_With_Advance_Print_Get", jsonadv)
        .subscribe((data: any) => {
          this.AdvanceTable=data.Table;
        //   for (var i = 0; i < this.AdvanceTable.length; i++) {
        //     let obj = {
        //       Type: this.AdvanceTable[i].transtype,
        //       Number:this.AdvanceTable[i].Transcode,
        //       Particulars:this.AdvanceTable[i].exp_sname + "," + this.AdvanceTable[i].sup_sname + "," + this.AdvanceTable[i].acctname,
        //       Amount:this.AdvanceTable[i].cramt
        //   }
        //     this.advheaderlist.push(obj);
        //   }
        //   this.advheaderlist.forEach((row: any) => {
        //     this.advdataForExcel.push(Object.values(row))
        //     });
          this.AdvTotal=data.Table1[0].totcramt;
          this.loaderService.display(false)
          })
          
      }
    }
    close()
     {  this.showModal_Advance = false  }

    Print()  {
      let frdt=this.FromDate.replace('/','-')
      let todt=this.ToDate.replace('/','-')
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      window.open('././#/popup/Account-actstatement-AdvancePrint/' +  this.Client + '/' +  this.ClientName +  '/' +  frdt.replace('/','-') + '/' +  todt.replace('/','-') + '/' +  this.Status + '/' , "Print View", toolbar);
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
         this.LastRemark=data.Table1[0].LastRemark;
         this.lblLastRemark=data.Table1[0].entrydt;
           });
           this.loaderService.display(false);       
    }
    DisplayRemark(rem)
    {
     this.Remark=rem;
    }
    FillRemark(id : any,event) {
    this.lblRemark = event.target.options[event.target.options.selectedIndex].text;
    this.Remark=this.selectedToAdd;
    this.disableAddbtn=true;
    this.disableCancelbtn=true;
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
            this.RemarkList=data.Table;
            });
            this.loaderService.display(false)
    }
    EnableAddCancel()  {
    this.lblRemark="";
    this.Remark="";
    this.disableAddbtn=false;
    this.disableCancelbtn=false;
    this.disableNewbtn=true;
  }
 	
  Clearctrl()
  {this.lblRemark="";
   this.Remark="";
   this.disableAddbtn=false;
   this.disableCancelbtn=true;
   //this.disableNewbtn=false;
 }
  expt_exlwithcolums() {
    //  this.ShowExcelData();
    this.loaderService.display(true)
    var jsonmaster = {
      ClientCode:this.Client,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      User_StartDate:this.FromDate,
      User_EndDate:this.ToDate,
      Fin_StartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      Fin_EndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
      cmpname :this._loginService.getLogin()[0].CMPNAME,
      subhead1 :this.ClientName,
     }
      // console.log(jsonmaster)
    this._dataService.getDownload("Accounts/Acc_Rpt_ClientOutstandingList_Get_AllCITY", jsonmaster, { responseType: 'arraybuffer' })
    .subscribe((data: any) => {
        this._dataService.commonDownloadExcelFile(data, "Accounts StatementAll With AllCity_"+ this.Client+   ".xls");
        this._loaderService.display(false);
    });
 
  }
  Openprint(No,Type) 
  {
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    
    if(confirm('Click OK to Print and Cancel to Edit')) { 
      if(Type=="PI")
       {       window.open('./#/popup/Account-Purchase-print/' + No + '/' + Type + '/' , "PI Print", toolbar);      }
      else if(Type=="JV")
      {  return false;  }
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
     else  if(Type=="BI")
      {  return false;   }
      else    
      {  window.open('./#/popup/Account-CashBook-BankReceipt-print/' + Type  + '/' + No + '/', "BR Print", toolbar);  }
    }
    else{
      if(Type=="JV")
      { this._router.navigate(['/accounts/Voucher/JV/Add/JV/' + No]);  }
      if(Type=="BR")
      {  this._router.navigate(['/accounts/Voucher/BankRecpt/Add/' + No]); }
      if(Type=="BP")
      { this._router.navigate(['/accounts/Voucher/BankRecpt/Add/' + No]); }
      if(Type=="SI")
      { return false;  }
      if(Type=="II")
      {  return false;  }
      if(Type=="PI")
      {  this._router.navigate(['/accounts/Voucher/JV/Add/JV/' + No]);   }
      return false;
    }
 }
 UploadDoc()
     {
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      window.open('http://109.15.43.138/EDocument/UI/Accounts/frm_Acc_Search_Client_Outstanding.aspx?huhpnk=' +  this._loginService.getLogin()[0].CMP_USERENCCODE + '/' + this.Client + '/' +  this.ClientName +  '/'  , "Print View", toolbar);
      }
      Clear() 
      { 
        this.FromDate="";
        this.ToDate="";
       }
       FromDateChanged(ev){
        this.FromDate=ev.formatted
      
      }
      ToDateChanged(ev){
        this.ToDate=ev.formatted
      
      }
    }  
  