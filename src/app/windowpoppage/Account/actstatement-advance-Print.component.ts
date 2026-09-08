import { Component, OnInit,EventEmitter,Output,Input ,OnChanges,ViewChild} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoaderService } from '../../shared/service/loader.service';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
@Component({
    selector: 'app-actstatement-advance-print',
    templateUrl: './actstatement-advance-Print.component.html',
    styles: []
  })

  export class ActstatAdvancePrintComponent implements OnInit  {
    display='none';
    // @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();
    // @Output() hideModal = new EventEmitter();
    // @Input() clientcd: string = '';
    // @Input() STARTDATE: string = '';
    // @Input() ENDDATE: string ='';
    // @Input() Status:string='';
    clientName:string;
    clientcode:string;
    fromdate:string;
    todate:string;
    STATUS:string;
    AdvanceTable:[];
    outstandTable:[];
    strheader:string;
    cmpname:string;
    addr1:string;
    addr2:string;
    addr3:string;
    table3:any=[];
    table1:any=[];
    table2:any=[];
    OpDrBal:string;
    OpCrBal:string;
    CLDrBal:string;
    CLCrBal:string;
    currTotalDr:any;
    currTotalcr:any;
    AdvDrAmt:any;
    AdvCrAmt:any;
    clientAdd:any=[];
    constructor( public _dataService: DataService,
       
        private _toasterService:ToastCommonService, 	
        private _route: ActivatedRoute,public _loginService: LoginService,
        private loaderService: LoaderService) {}
  
    ngOnInit() {
        this._route.params.subscribe(params => {
                this.clientName= params["clientnm"];
                this.fromdate=  params["fromdate"];
                this.todate=  params["todate"];
                this.STATUS=  params["status"];
                this.clientcode= params["clientcd"];
                this.strheader="Account Statement For Advance From " + this.fromdate + " To " + this.todate;
                this.GetCompanydtls();
                this.ShowOutstanding();
                this.ViewAdvanceData();
              });
    }
    ngOnChanges()
     {
     
        //this.GetCompanydtls();
        this.ViewAdvanceData();
     }
    GetCompanydtls()
     {
      this.loaderService.display(true)
      var jsoncmp = {
        CmpCode:this._loginService.getLogin()[0].CMPCODE,
        CityCode:this._loginService.getLogin()[0].CITYCODE
      
      }
       this._dataService.getData("Accounts/fn_Acc_Rpt_Common_CompanyDetails", jsoncmp)
        .subscribe((data: any) => {
          this.table3=data.Table;
          this.loaderService.display(false)
         })
    }
     ViewAdvanceData()
     {
       this.loaderService.display(true)
       
       var jsonadv = {
         ClCode:this.clientcode,
         FINSTARTDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
         FINENDDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
         cmp_code:this._loginService.getLogin()[0].CMPCODE,
         citycode1:this._loginService.getLogin()[0].CITYCODE1,
         STARTDATE:this.fromdate,
         ENDDATE:this.todate
       
       }
       var jsonadvall = {
         ClCode:this.clientcode,
         cmp_code:this._loginService.getLogin()[0].CMPCODE,
         citycode1:this._loginService.getLogin()[0].CITYCODE1,
         STARTDATE:this.fromdate,
         ENDDATE:this.todate
       
       }
       if(this.STATUS=="All")
       {
         this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_With_Advance_Print_GetAll", jsonadvall)
         .subscribe((data: any) => {
         this.AdvanceTable=data.Table;
          this.loaderService.display(false)
          })
       }
        else
        {
         this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_With_Advance_Print_Get", jsonadv)
         .subscribe((data: any) => {
           this.AdvanceTable=data.Table;
           this.loaderService.display(false)
          })
          
       }
       
         }

    ShowOutstanding()
    {
      
      this.loaderService.display(true)
      var jsonmaster = {
      ClientCode:this.clientcode,
      FINSTARTDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      FINENDDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode1:this._loginService.getLogin()[0].CITYCODE1,
      STARTDATE:this.fromdate,
      ENDDATE:this.todate,
     
        
      }
      var jsonmasterall = {
        ClCode:this.clientcode,
        cmp_code: this._loginService.getLogin()[0].CMPCODE,
        citycode1:this._loginService.getLogin()[0].CITYCODE1,
        STARTDATE:this.fromdate,
        ENDDATE:this.todate,
                
        }
        
        if(this.STATUS=="All")
        {
          this._dataService.getData("Accounts/Acc_Rpt_ClientOutstandingList_GetAll", jsonmasterall)
          .subscribe((data: any) => {
          this.outstandTable=data.Table;
          this.table1=data.Table1;
          this.table2=data.Table2;
          this.clientAdd=data.Table3;
          if(data.Table1[0].OPBAL >0)
          {
            this.OpDrBal=data.Table1[0].OPBAL  + " Dr";
         
          }
          else
          {
            this.OpCrBal=(data.Table1[0].OPBAL=="0.00")?"0.0" :Math.abs(data.Table1[0].OPBAL) + " Cr";
           
          }
          if(data.Table1[0].CLBAL >0)
          {
            this.CLDrBal=data.Table1[0].CLBAL  + " Dr";
           
          }
          else
          {
            this.CLCrBal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr";
           
          }
          if(data.Table1[0].TLDR >0)
          {
            this.currTotalDr=data.Table1[0].TLDR  ;
           
          }
          else
          {
            this.currTotalDr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR) ;
            
          }
          if(data.Table1[0].TLCR >0)
          {
            this.currTotalcr=data.Table1[0].TLCR ;
            
          }
          else
          {
            this.currTotalcr=(data.Table1[0].TLCR=="0.00")?"" :Math.abs(data.Table1[0].TLCR) 
             
          }
          if(data.Table2[0].ADVTOTALDR >0)
          {
            this.AdvDrAmt=data.Table2[0].ADVTOTALDR ;
          }
          else
          {
            this.AdvDrAmt=(data.Table2[0].ADVTOTALDR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALDR) ;
            
          }
          if(data.Table2[0].ADVTOTALCR >0)
          {
            this.AdvCrAmt=data.Table2[0].ADVTOTALCR  ;
          }
          else
          {
            this.AdvCrAmt=(data.Table2[0].ADVTOTALCR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALCR) ;
            
          }
           this.loaderService.display(false)
           })
        }
        else
        {
          this._dataService.getData("Accounts/Acc_Rpt_ClientOutstandingList_Get", jsonmaster)
          .subscribe((data: any) => {
          this.outstandTable=data.Table;
          this.table1=data.Table1;
          this.table2=data.Table2;
           this.loaderService.display(false)
           })
        }
      }
     
        PrintElem() {
          var data = document.getElementById('demo').innerHTML;
          var mywindow = window.open('', 'Accounts - Advance Statement Print', 'height=400,width=600');
          mywindow.document.write('<html><head><title>Accounts - Advance Statement Print</title>');
          mywindow.document.write('<link rel="stylesheet" href="assets/css/invoice.css" type="text/css" />');
          mywindow.document.write('</head><body >');
          mywindow.document.write(data);
          mywindow.document.write('</body></html>');
          mywindow.document.close(); // necessary for IE >= 10
        
          mywindow.onload = function () { // necessary if the div contain images
        
            mywindow.focus(); // necessary for IE >= 10
            mywindow.print();
            mywindow.close();
          };
          return true;
        }  
      }       
