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

@Component({
    selector: 'app-ItemStatement',
    templateUrl: './item-stmt.component.html',
    styles: []
  })

  export class ItemStatement implements OnInit {

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
    ItemName:string="";
    Item:string;
    searchHeaderText:string="";
    PageType: any;
    dataForExcel = [];
    expdataForExcel:any = [];
    Compname:string;
    SubHeader:string;
    Header:string;
    PageName:string;

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
        this.FromDate=this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE ;///this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE)
        this.ToDate = new Date();
        this.ToDate =  this._dataService.datechnge(this.ToDate)
        this.Header="Item Statement";
        this.PageName="Item Statement";
        this.FillItem();
        }

       FillItem(){
       const jsonItem = {
        CmpCode: this._loginService.getLogin()[0].CMPCODE,
        CityCode: this._loginService.getLogin()[0].CITYCODE,
        CityCode1: this._loginService.getLogin()[0].CITYCODE1,
            }
         this._dataService.getData("Accounts/Fill_ITEMACCOUNT", jsonItem)
          .subscribe((data: any) => {
            this.ItemList = data.Table
            this._loaderService.display(false)
          })
        }

        GetItemName(icode) {
            let updateItem = this.ItemList.find(item => item.ITEMCODE === icode);
            this.ItemName=updateItem.ITEMACTNAME.split("|")[1];
        }
        FromDateChanged(ev){
            this.FromDate=ev.formatted
          }
          ToDateChanged(ev){
          this.ToDate=ev.formatted
          }
        ExportToExcel()
        {
        this.loaderService.display(true);  
       
        if (this.Item == "" || this.Item == undefined) { 
            this._toasterService.toast('warning', 'warning', "Please Select Item !.");
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
          const jsondata= {
            ACCTCODE:this.Item.split("|")[1],  
            ITEMCODE:this.Item.split("|")[0],
            Frmdt:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate),
            Todt:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate),
            FINSTARTDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
            FINENDDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
            CMP_CODE:this._loginService.getLogin()[0].CMPCODE,
            ITEMNAME:this.ItemName,
            CMPID   :this._loginService.getLogin()[0].CMPID  ,
            CITYCODE:this._loginService.getLogin()[0].CITYCODE
            }
            this._dataService.getData("Accounts/Acc_Rpt_ItemStatement", jsondata)
            .subscribe((data: any) => {
            let pklogid=  data.Table1[0].PKID;   
            this._router.navigate(['/accounts/report/ReportDownload/' + pklogid]);
        });
            this.loaderService.display(false);
      }
      download(){}
    }