import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../shared/service/dataService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { DatePipe } from '@angular/common'


@Component({
  selector: 'app-quot-rate-master-entry',
  templateUrl: './quot-rate-master-entry.component.html',
  styles: []
})
export class QuotRateEntryComponent implements OnInit {
  Header: String = 'QUOTATION RATE MASTER ENTRY ' ;

  linertable : any = [] 
  shipmenttypetable : any = []
  stufftypetable : any = []
  shipmentmodetable:any = []
  commoncities : any = []
  terminaltable : any = []
  contsizetable : any = []
  conttypetable : any = []
  itemtypetable : any = []
  chargestable  : any = []
  currencytable : any = []
  ratedetails : any = []
  portterminal: any = []
  Allportterminallist:any=[];
  loadingportterminal :any=[] ;
  shipmenttype:string="";
  shipmentmode:string="";
  liner: String ;
  stufftype: string = "";
  pol: string = "";
  pod: string = "";
  terminal: string = "";
  contsize: string = "";
  conttype: string = "";
  itemtype: string = "";
  Effective_from0;
  Effective_to0;
  acccode: string ;
  currency: string = "";
  rate: string = "";
  exrate: string = "";
  charges: string = "";
  PKQUTID: string = "0";
  FK_QUTDETID: string = "0";
  FK_QUTID: string = "0";
  queryParamsUserId: string = "";
  validnumber: boolean = true;
  PKID :string="0";
  txtsubmit : string ="Add"

  public myDatePickerOptions: IMyDpOptions = {
    dateFormat: 'dd/mm/yyyy',
    inline: false,
    height: '20px',
    width: '160px',
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

  constructor(private _dataService: DataService,
    private _toasterService: ToastCommonService,
    private loaderService: LoaderService,
    private http: HttpClient,
    private _activatedRoute: ActivatedRoute,
    private _loginService: LoginService, public datepipe: DatePipe
  ) { }

  ngOnInit() {
   
    // if (this.queryParamsUserId != ' ') {
    //   this._loginService.verifyRights(414, '')
    //   .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });
    //   this.editpopulate()
    // }
    // else
    // {
    //   this._loginService.verifyRights(414, '')
    //   .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });

    // }

this.loaderService.display(true)
  
    this._dataService.getAll("Admin/MST_QUOT_RATE_PAGELOAD")
      .subscribe((data: any) => {
        this.linertable=data.Table
        this.shipmenttypetable=data.Table1
        this.shipmentmodetable=data.Table2
        this.stufftypetable = data.Table3
        this.commoncities = data.Table4
       // this.terminaltable = data.Table4
        this.Allportterminallist = data.Table5
        this.itemtypetable = data.Table6
        this.conttypetable = data.Table7
        this.contsizetable = data.Table8
        this.chargestable = data.Table9
        this.currencytable = data.Table10
        this.ratedetails=data.Table11
        this.loaderService.display(false)
       console.log(data )
      })
      this.loaderService.display(false)
  }
  Addquotationrate() {
    
    if (this.liner == "" || this.liner == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Shipping Line  !');
      return false;
    }
    if (this.shipmenttype == "" || this.shipmenttype == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Shipment Type  !');
      return false;
    }
    if (this.stufftype == "" || this.stufftype == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Stuff Type !');
      return false;
    }
    if (this.pol == "" || this.pol == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Port Of Loading !');
      return false;
    }
    if (this.pod == "" || this.pod == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Port Of Discharge !');
      return false;
    }
    if (this.itemtype == "" || this.itemtype == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Item Type !');
      return false;
    }
    if (this.conttype == "" || this.conttype == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Container Type !');
      return false;
    }
    if (this.contsize == "" || this.contsize == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Container Size !');
      return false;
    }
    if (this.charges == "" || this.charges == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Charges  !');
      return false;
    }
    
    if (this.currency == "" || this.currency == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Currency !');
      return false;
    }
    if (this.rate == "" || this.rate == undefined) {
      this._toasterService.toast('warning', 'warning', 'Charges rate could not be blank !');
      return false;
    }

     if (this.exrate == "" || this.exrate == undefined) {
       this._toasterService.toast('warning', 'warning', 'Exchange Rate could not be blank !');
       return false;
     }
   
    if (this.validnumber == false) {
      this._toasterService.toast('warning', 'warning', "These fields Rate,Exchange Rate are number  remove comma(,) seperator !");
      return false;
    }
    if (this.Effective_from0 == "" || this.Effective_from0 == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Effective From Date!');
      return false;
    }
    if (this._dataService.date2Comparison(this.Effective_from0,this.Effective_to0) ==false)
    {
      this._toasterService.toast('warning', 'warning', 'To date should be greater than from date !');
      return false;
    }
    if (this.Effective_to0 == "" || this.Effective_to0 == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Effective To Date !');
      return false;
    }
    this.loaderService.display(true)
    const jsonmaster = {
      PKRTID: this.PKID,
      SHIPPINGLINE: this.liner,
      SHIP_TYPE: this.shipmenttype,
      SHIP_MODE: this.shipmentmode,
      STUFF_TYPE: this.stufftype,
      POL: this.pol,
      TERMINAL: (this.loadingportterminal.split("|")[0]==undefined || this.loadingportterminal.split("|")[0]=="" )?"" :this.loadingportterminal.split("|")[0],
      POD: this.pod,
      CONT_SIZE:this.contsize,
      CONT_TYPE:this.conttype,
      ITEM_TYPE:this.itemtype,
      CHARGE_CODE:this.charges,
      RATE: this.rate,
      CURRCODE:this.currency,
      EXRATE:this.exrate,
      EFRMDT:this.Effective_from0,
      ETODT:this.Effective_to0,
      MAKERID: this._loginService.getLogin()[0].CMPID,
      MAKERDT:"",
      MAKERIP: this._loginService.getLogin()[0].MAKERIP,
    }
    //console.log(jsonmasterchild)
    this._dataService.Common("Admin/MST_QUOTATION_RATE_IU", jsonmaster)
      .subscribe((data: any) => {
          if (data.Table[0].STATUS == "100") {      
          this.ratedetails = data.Table1
          this.ResetQuotationrate()
          this.txtsubmit="Add"
          this._toasterService.toast("success","sucess" ,data.Table[0].STATUSTEXT);
          }
          else
          {   
            this._toasterService.toast("error","error" ,data.Table[0].STATUSTEXT);
          }
          this.loaderService.display(false)

      })
  }

  ResetQuotationrate() {
    this.PKID="0";
    this.acccode = ""
    this.currency = "";
    this.rate = "";
    this.exrate = "";
    this.Effective_from0="";
    this.Effective_to0="";
    this.contsize="";
    this.conttype="";
    this.itemtype="";
    this.shipmenttype="";
     this.shipmentmode="";
    this.stufftype="";
    this.liner="" ;  
    this.pod="";
    this.pol="";
    this.loadingportterminal="";
    this.charges="";
    this.txtsubmit="Add"
  }

  EditQuotationrate(id) {
    let filterData = this.ratedetails.filter((filter) => filter.PKRTID == id)[0];
    this.PKID=filterData.PKRTID;
    this.charges = filterData.CHARGE_CODE;
    this.currency = filterData.CURRCODE;
    this.rate = filterData.RATE;
    this.exrate=filterData.EXRATE;
    this.itemtype=filterData.ITEM_TYPE;
    this.liner=filterData.SHIPPINGLINE;
    this.pol=filterData.POL;
    this.GetTerminal(this.pol)
    this.loadingportterminal=filterData.TERMINAL + "|" +  this.pol;
    this.pod=filterData.POD;
    this.Effective_from0=this.datepipe.transform(filterData.EFRMDT, 'dd/MM/yyyy');
    this.Effective_to0=this.datepipe.transform(filterData.ETODT, 'dd/MM/yyyy');
    this.stufftype=filterData.STUFF_TYPE;
    this.shipmenttype=filterData.SHIP_TYPE;
    this.shipmentmode=filterData.SHIP_MODE;
    this.contsize=filterData.CONT_SIZE;
    this.conttype=filterData.CONT_TYPE;
    this.txtsubmit="Update"

  }
  DeleteQuotationrate(id) {
    if(confirm('Are you sure want to delete the record ?'))  { 
      this.loaderService.display(true);      
      const jsondelete = { PKRTID  : id}
                this._dataService.getData("Admin/MST_QUOTATION_RATE_DELETE", jsondelete)
                    .subscribe((data: any) => {
                    if (data.Table[0].STATUS == "100")
                        {
                        this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT );
                        this.ratedetails=data.Table1;
                        this.loaderService.display(false);
                        }
                      })
  }
}
    onDateChanged(ev) {
    //console.log(ev)
    this.Effective_from0 = ev.formatted
  }
  onDateChanged1(ev2) {
    this.Effective_to0 = ev2.formatted
  }
  onchangefindcomma(innumber) {
    if (innumber.match(/,/g) != null) {
      alert('comma not allowed');
      this.validnumber = false;
      return false;
    }
    else {
      this.validnumber = true;
    }
  }
     GetTerminal(portcode)  {   
    this.portterminal=[];
    this.loadingportterminal="";
    this.portterminal = this.Allportterminallist.filter((code: any) => code.ID.split("|")[1] === portcode);
}
}