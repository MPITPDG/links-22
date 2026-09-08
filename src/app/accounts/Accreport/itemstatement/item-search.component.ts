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
    selector: 'app-ItemStatement-search',
    templateUrl: './item-search.component.html',
    styles: []
  })
  export class ItemwiseStatement implements OnInit {
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

    };
  
    public myDatePickerOptionsInv: IMyDpOptions = {
      dateFormat: 'dd/mm/yyyy',
      inline: false,
      height: '20px',
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
      selectorWidth: '200px' , 
      disableUntil: {year: 0, month: 0, day: 0},
      disableSince: {year: 0, month: 0, day: 0}
  };
    
    FromDate;
    ToDate;
    ItemList:any = [];
    displayType: string = 'SEARCH';
    SearchItemdata_list: any = [];
    SearchdataItemAct_list: any = [];
    ItemName:string="";
    Item:string;
    OpDrBal:string;
    OpCrBal:string;
    CLDrBal:any;
    CLCrBal:string;
    currTotalDr:any;
    currTotalcr:any;
    AdvDrAmt:any;
    AdvCrAmt:any; 
    searchHeaderText:string="";
    PageType: any;
    dataForExcel = [];
    expdataForExcel:any = [];
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
     advdataForExcel = [];
     aclistheaderlist = [];
     advheaderlist:any = [];
     rptopbal:string;
     rptclbal:string;
     rptcrtotdr:any;
     rptcrtotcr:any;
     rptadvtotdr:any;
     rptadvtotcr:any;
     clnCode:string; sclnCode:string;
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
      
          this.loaderService.display(true);
          // this._activatedRoute.params.subscribe(params => {
          //   this.PageType = params["PageType"]
          // })
          this.ToDate = new Date();
          this.ToDate =  this._dataService.datechnge(this.ToDate)
          this.FromDate='01/04/2006'
          //this.UserFromDate='01/04/2006'//this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE///this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE)
         
        
          this.Header="Item Statement";
          this.PageName="Item Statement";
          this.verifyPermission('210','View') 
          const jsonItem = {
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            CityCode1: this._loginService.getLogin()[0].CITYCODE1,
          }
             this._dataService.getData("Accounts/Fill_ITEMACCOUNT", jsonItem)
              .subscribe((data: any) => {
               // console.log(data)
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
        //this.FromDate=this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate)
    }
    ToDateChanged(ev){
      this.ToDate=ev.formatted
      //this.ToDate=this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate)
  }
      GetItemName(icode)    {
        
          let updateItem = this.ItemList.find(item => item.ITEMCODE === icode);
          this.ItemName=updateItem.ITEMACTNAME.split("|")[1];
      }
      Showdata()
      {
        this.loaderService.display(true);
        if (this.Item ==""  || this.Item ==undefined)
        {
          this._toasterService.toast('warning', 'warning', "Please select Item !");
          return false;
          }
        if (this.FromDate ==""  || this.FromDate ==undefined)
        {
          this._toasterService.toast('warning', 'warning', "From Date cannot be blank !");
          return false;
        }
        if ( this.ToDate=="" || this.ToDate==undefined)
        {
          this._toasterService.toast('warning', 'warning', "To Date cannot be blank!");
          return false;
        }

     
       this.ShowItemStatementList();
       
      }    
      ShowItemStatementList()
      {
          this.loaderService.display(true);
        
            // this.UserFromDate=this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate)
            // this.UserToDate=this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate)
          var jsonmaster = {
          ClientCode:this.Item.split("|")[1],
          ItemCode:this.Item.split("|")[0],
          cmp_code: this._loginService.getLogin()[0].CMPCODE,
          User_StartDate:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate),
          User_EndDate:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate),
          Fin_StartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
          Fin_EndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
          }
         // console.log(jsonmaster)
          this._dataService.getData("Accounts/Acc_Rpt_ItemWise_Statement_List", jsonmaster)
            .subscribe((data: any) => {
              this.displayType = 'LIST';
              this.SearchItemdata_list = data.Table;
              this.searchHeaderText="Item Wise Statement From " +this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate) + " To " + this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate) ;
              this.SubHeader=data.Table3[0].NAME//OPBALthis.ItemName;
              if(data.Table1[0].OPBAL >0)
              {
                this.OpDrBal=parseFloat(data.Table1[0].OPBAL).toFixed(2)  + " Dr";
              }
              else
              {
                this.OpCrBal=(data.Table1[0].OPBAL=="0.00")?"0.0" :Math.abs(data.Table1[0].OPBAL) + " Cr";
              }
              if(data.Table1[0].CLBAL >0)
              {
                this.CLDrBal=parseFloat(data.Table1[0].CLBAL).toFixed(2)  + " Dr";
              }
              else
              {
                this.CLCrBal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr";
              }
              if(data.Table1[0].TLDR >0)
              {
                this.currTotalDr=parseFloat(data.Table1[0].TLDR).toFixed(2) 
              }
              else
              {
                this.currTotalDr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR) ;
              }
              if(data.Table1[0].TLCR >0)
              {
                this.currTotalcr=parseFloat(data.Table1[0].TLCR).toFixed(2)
              }
              else
              {
                this.currTotalcr=(data.Table1[0].TLCR=="0.00")?"" :Math.abs(data.Table1[0].TLCR) 
              }
              if(data.Table2[0].ADVTOTALDR >0)
              {
                this.AdvDrAmt=parseFloat(data.Table2[0].ADVTOTALDR).toFixed(2) + " Dr";
              }
              else
              {
                this.AdvDrAmt=(data.Table2[0].ADVTOTALDR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALDR) ;
              }
              if(data.Table2[0].ADVTOTALCR >0)
              {
                this.AdvCrAmt=parseFloat(data.Table2[0].ADVTOTALCR).toFixed(2)  + " Dr";
              }
              else
              {
                this.AdvCrAmt=(data.Table2[0].ADVTOTALCR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALCR) ;
              } 
          });
          this.loaderService.display(false);
      }
  
      // ExportItemstatement()
      // {
      //     this.loaderService.display(true);
      //     this.SearchdataItemAct_list.forEach((row: any) => {
      //         this.dataForExcel.push(Object.values(row))
      //         });
      //     let reportData = {
      //         data: this.dataForExcel,
      //         headers: this.aclistheaderlist,
      //         //headers: ['ITEMNAME','Debit','Credit'],
      //         subtitle:this.ItemName,
      //         title:"Account wise Item Statement  From " + this.FromDate + " To "  + this.ToDate,
      //         itemname:this.Compname,
      //         pagetype: "ItemActStatement",
      //         currtotal:this.currTotalDr + " " + this.currTotalcr
      //        }
      //       this.exportser.exportExceltry(reportData, "Accountwise_ItemStatement_");
            
      //     }
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
  
  
        AdvanceViewData()
        {
          this.ShowOutstanding();
      
          if((this.AdvCrAmt=='' &&  this.AdvDrAmt=='') || (this.AdvCrAmt==undefined &&  this.AdvDrAmt==undefined))
          {
             alert("No Record Found!")
             return false;
           
          } 
          else
          { 
          
            this.loaderService.display(true)
          this.showModal_Advance = true
          this.advheader="Account Statement for Advance From " + this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate) + " To "  + this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate);
          var jsonadv = {
            ClCode:this.Item.split("|")[1],
            FINSTARTDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
            FINENDDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
            cmp_code:this._loginService.getLogin()[0].CMPCODE,
            citycode1:this._loginService.getLogin()[0].CITYCODE1,
            STARTDATE:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate),
            ENDDATE:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate)
          }
          var jsonadvall = {
            ClCode:this.Item.split("|")[1],
            cmp_code:this._loginService.getLogin()[0].CMPCODE,
            citycode1:this._loginService.getLogin()[0].CITYCODE1,
            STARTDATE:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate),
            ENDDATE:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate)
          }
          if(this.Status=="All")
          {
            this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_With_Advance_Print_GetAll", jsonadvall)
            .subscribe((data: any) => {
              if(data.Table.length>0)
              {
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
              ///console.log(this.advheaderlist)
              
             }
              else
              {
            //  alert("No Record Found!")
                     //  //this._toasterService.toast('info', 'info', 'No Record Found!');
             return false;
             }
          })
          }
           else
           {
            this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_With_Advance_Print_Get", jsonadv)
            .subscribe((data: any) => {
              if(data.Table.length>0)
              {
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
              
              }
              else
             {
              return false;
          }
           })
            }
          ////  this.ShowOutstanding();
          this.loaderService.display(false)
        } 
       
        }
  
        close()
        {
           this.showModal_Advance = false;
        }
       Openprint(No,Type)
       {
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        if(confirm('Click OK to Print'))
        { 
        if(Type=="PI")
        {
          {       window.open('./#/popup/Account-Purchase-print/' + No + '/' + 'PI' + '/' , "PI Print", toolbar);      }
        }
       else if(Type=="JV")
        {
          window.open('./#/popup/Account-JV-Print/' + No + '/' + "JV" + '/' , "JV Print", toolbar); 
        }
        else if(Type=="CN")
        {
          window.open('./#/popup/Account-CreditNote-print/' + No + '/' , "CN Print", toolbar);
        }
        else if(Type=="II")
        {
          // window.open('./#/popup/Account-Invoice-print/' + No + '/' , "INV Print", toolbar);
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
        {
         return false;
        }
        else if(Type=="BI")
        {
           return false;
        }
        else
          {
             window.open('./#/popup/Account-CashBook-BankReceipt-print/' + Type + '/' + No  + '/', "BR Print", toolbar);
        }
          }
        else{
        return false;
        }
      }
  
      Print()
      {
        let frdt=this.FromDate.replace('/','-')
        let todt=this.ToDate.replace('/','-')
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('././#/popup/Account-actstatement-AdvancePrint/' +  this.Item.split("|")[1]+ '/' +  this.ItemName +  '/' +  frdt.replace('/','-') + '/' +  todt.replace('/','-') + '/' +  this.Status + '/' , "Print View", toolbar);
     }
     ShowOutstanding()
     {
     
       this.loaderService.display(true)
       var jsonmaster = {
       ClientCode:this.Item.split("|")[1],
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
            // this.exceldata_list= data.Table4;
            // this.exceldata_list.forEach((row: any) => {
            //  this.dataForExcel.push(Object.values(row))
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
           ///   })
          ///// this.searchHeaderText="Account Statement From " + this.FromDate + " To " + this.ToDate ;
           if(data.Table1[0].OPBAL >0)
           {
             ///this.OpDrBal=data.Table1[0].OPBAL  + " Dr";
             this.rptopbal=parseFloat(data.Table1[0].OPBAL).toFixed(2)  + " Dr";
           }
           else
           {
             //this.OpCrBal=(data.Table1[0].OPBAL=="0.00")?"0.0" :Math.abs(data.Table1[0].OPBAL) + " Cr";
             this.rptopbal=(data.Table1[0].OPBAL=="0.00")?"0.0" :Math.abs(data.Table1[0].OPBAL) + " Cr";
           }
           if(data.Table1[0].CLBAL >0)
           {
             //this.CLDrBal=data.Table1[0].CLBAL ;
             this.rptclbal=parseFloat(data.Table1[0].CLBAL).toFixed(2)  + " Dr";
           }
           else
           {
             this.CLCrBal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr";
             this.rptclbal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr";
           }
           if(data.Table1[0].TLDR >0)
           {
             //this.currTotalDr=data.Table1[0].TLDR  ;
             this.rptcrtotdr=parseFloat(data.Table1[0].TLDR).toFixed(2) + " Dr";
           }
           else
           {
           ///  this.currTotalDr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR) ;
             this.rptcrtotdr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR)+ "Dr";
           }
           if(data.Table1[0].TLCR >0)
           {
            // this.currTotalcr=data.Table1[0].TLCR ;
             this.rptcrtotcr=parseFloat(data.Table1[0].TLCR).toFixed(2) +" Cr" ;
           }
           else
           {
             //this.currTotalcr=(data.Table1[0].TLCR=="0.00")?"" :Math.abs(data.Table1[0].TLCR) 
             this.rptcrtotcr=(data.Table1[0].TLCR=="0.00")?"" :Math.abs(data.Table1[0].TLCR) 
           }
           if(data.Table2[0].ADVTOTALDR >0)
           {
             this.AdvDrAmt=parseFloat(data.Table2[0].ADVTOTALDR).toFixed(2) ;
             this.rptadvtotdr=parseFloat(data.Table2[0].ADVTOTALDR).toFixed ;
           }
           else
           {
             this.AdvDrAmt=(data.Table2[0].ADVTOTALDR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALDR) ;
             this.rptadvtotdr=(data.Table2[0].ADVTOTALDR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALDR) ;
           }
           if(data.Table2[0].ADVTOTALCR >0)
           {
             this.AdvCrAmt=data.Table2[0].ADVTOTALCR  ;
             this.rptadvtotcr=data.Table2[0].ADVTOTALCR ;
           }
           else
           {
             this.AdvCrAmt=(data.Table2[0].ADVTOTALCR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALCR) ;
             this.rptadvtotcr=(data.Table2[0].ADVTOTALCR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALCR) ;
            }      
            })
         this.loaderService.display(false) 
               this.getCompanyName(); 
              // this.getadvancedata(); 
             }
  
           
     expt_exlwithadv() {
      this.exceldata_list.forEach((row: any) => {
        this.dataForExcel.push(Object.values(row))
        });
       
      if(confirm('Click OK For With Advance Excel,\n CANCEL For Without Advance Excel'))
      { 
        this.advheaderlist.forEach((row: any) => {
          this.advdataForExcel.push(Object.values(row))
          });
         
          let reportData = {
            data: this.dataForExcel,///this.dataForExcel,
            advdata:this.advdataForExcel,
            headers: Object.keys(this.exceldata_list[0]),
            advheaders: ["Type","Number","Particulars","Amount"],//Object.keys(this.advdataForExcel[0]),
            pagetype: "ItemStatement",
            title:"Account Statement From " + this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate) + " To "  + this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate),
            subtitle:this.ItemName,
            clntname:this.Compname,
            opbal:"Opening: " + this.rptopbal,
            currenttot:"Current Total : " + this.rptcrtotdr + " " + this.rptcrtotcr,
            closing:"Closing : " + this.rptclbal,
            advance:"Advance : " + this.rptadvtotdr + this.rptadvtotcr
           }
          this.exportser.exportExceltry(reportData, "Account_StatementAll_With_Adv_"+ this.ItemName);     
          this.dataForExcel=[];
          this.advdataForExcel=[];
          this.expdataForExcel=[];
        }
          else
          {
            return false;
           }
        }
    } 
