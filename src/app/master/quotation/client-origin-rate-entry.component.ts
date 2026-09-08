import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../shared/service/dataService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { DatePipe } from '@angular/common'
import { OnlyNumberDirective } from '../../shared/onlynumber.directive';

@Component({
  selector: 'app-client-origin-rate-entry',
  templateUrl: './client-origin-rate-entry.component.html',
  styles: []
})
export class ClientOriginRateEntryComponent implements OnInit {
  Header: String = 'CLIENT ORIGIN WISE RATE ENTRY  ' ;
  narration: string = ""; 
  chngetypetable: any = []
  shpmodetable: any = []
  unitabel: any = []
  currencytable: any = []
  origintable: any = []
  clientable: any = []
  accountable: any = []
  chargesdetails: any = []
  shipmentable: any = []
  compnytable: any = []
  linertable:any = []
  shiptype:string=""
  company:string=""
  origin: string = "";
  client: String ;
  shipmode: string = "";
  Effective_from0;
  Effective_to0;
  quotdate;
  Quotvaliddate;
  chngetype: string = "";
  acccode: string ;
  currency: string = "";
  rate: string = "";
  exrate: string = "";
  minrate: string = "";
  unit: string = "";
  PKQUTID: string = "0";
  FK_QUTDETID: string = "0";
  FK_QUTID: string = "0";
  queryParamsUserId: string = "";
  validnumber: boolean = true;
  PKID :string="0";
  liner: string = "";
  txtchild : string ="Add"
  visible:string="0";
  quotno:string="";
  commoncities : any = [];
  pol: string = "";
  pod: string = "";
  QUOTNO:string="";
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
    private _loginService: LoginService, public datepipe: DatePipe,
    private _router: Router,
  ) { }

  ngOnInit() {
    //console.log(this._loginService.getLogin()[0])
    this.quotdate = new Date();

    this.quotdate = this._dataService.datechnge(this.quotdate)
    var vqdate=new Date();
    this.Quotvaliddate=this._dataService.addDays(vqdate,30)    
    this._activatedRoute.params.subscribe(params => {
    this.queryParamsUserId = params["pkqutid"];
    this.PKQUTID=(this.queryParamsUserId == " " ? "0" : this.queryParamsUserId);
    
       // console.log(this.PKQUTID)
    })
    if (this.queryParamsUserId != ' ') {
      this._loginService.verifyRights(414, '')
      .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });
      this.editpopulate()
    }
    else
    {
      this._loginService.verifyRights(414, '')
      .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });

    }

    this.loaderService.display(true)
    const jsonmaster2 = {
      CMPID: this._loginService.getLogin()[0].CMPID,
    }
    this._dataService.getData("Admin/ACC_CLIENT_RATE_PAGELOAD", jsonmaster2)
      .subscribe((data: any) => {
        this.shipmentable=data.Table8
        this.compnytable=data.Table7
        this.chngetypetable = data.Table6
        this.shpmodetable = data.Table5
        this.unitabel = data.Table4
        this.currencytable = data.Table3
        this.accountable = data.Table2
        this.origintable = data.Table1
        this.clientable = data.Table
        this.linertable=data.Table9
        this.commoncities = data.Table10
        this.loaderService.display(false)
       console.log(data )
      })
  }
  TextareaValueChange(ev) {
    this.narration = ev.target.value;
} 
  SearchLinerData(){
    if (this.shiptype == "" || this.shiptype == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Shipment Type  !');
      return false;
    }
    if (this.shipmode == "" || this.shipmode == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Shipping Mode !');
      return false;
    }
    if (this.liner == "" || this.liner == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Shipping Line  !');
      return false;
    }
   
    // if (this.Effective_from0 == "" || this.Effective_from0 == undefined) {
    //   this._toasterService.toast('warning', 'warning', 'Please select Effective From Date!');
    //   return false;
    // }
    // if (this._dataService.date2Comparison(this.Effective_from0,this.Effective_to0) ==false)
    // {
    //   this._toasterService.toast('warning', 'warning', 'To date should be greater than from date !');
    //   return false;
    // }
    // if (this.Effective_to0 == "" || this.Effective_to0 == undefined) {
    //   this._toasterService.toast('warning', 'warning', 'Please select Effective To Date !');
    //   return false;
    // }
     const jsonmaster = {
      ShippingLine: this.liner,
      shiptype: this.shiptype,
      shipmode:this.shipmode,
      efffrmdt: this.Effective_from0,
      efftodt:this.Effective_to0,
      MakerId:this._loginService.getLogin()[0].CMPID,
      VGUID:this._loginService.getLogin()[0].GUID
    }
    this.loaderService.display(true)
    this._dataService.getData("Admin/MST_QUOTATION_RATE_GETDATAFORCLIENT", jsonmaster)
      .subscribe((data: any) => {
        if (data.Table[0].STATUS == "100") {
        this.chargesdetails =data.Table; 
          }
          else
          {
            this._toasterService.toast('warning', 'warning', data.Table[0].STATUSTEXT );
              }
         });
           this.loaderService.display(false)
          }
  Addclientrate() {
    if(this.PKQUTID!="0")
    {
      this._toasterService.toast('warning', 'warning', 'You can`t Add/Update this record !');
      return false;
    }
    if (this.acccode == "" || this.acccode == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Account Code  !');
      return false;
    }
    if (this.chngetype == "" || this.chngetype == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Charge Type  !');
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

    // if (this.minrate == "" || this.minrate == undefined) {
    //   this._toasterService.toast('warning', 'warning', 'Charges min.rate could not be blank !');
    //   return false;
    // }
    if (this.unit == "" || this.unit == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Unit!');
      return false;
    }
    

    if (this.validnumber == false) {
      this._toasterService.toast('warning', 'warning', "These fields Rate,Min.Rate are number  remove comma(,) seperator !");
      return false;
    }

    this.loaderService.display(true)
    const jsonmasterchild = {
      PKID: this.PKID,
      FK_QUTID: this.FK_QUTID,
      FK_QUTDETID: this.FK_QUTDETID,
      CHRG_CODE: this.acccode,
      CHRG_TYPE: this.chngetype,
      CURCODE: this.currency,
      RATE: this.rate,
      EXRATE: (this.exrate==""?0 : this.exrate),
      MIN_RATE:(this.minrate==""?0 : this.minrate) ,
      UNIT: this.unit,
      MakerID: this._loginService.getLogin()[0].CMPID,
      VGUID: this._loginService.getLogin()[0].GUID,
      POL:this.editpopulate,
    }
    //console.log(jsonmasterchild)
    this._dataService.Common("Admin/ACC_CLIENT_RATE_CHILD_IU", jsonmasterchild)
      .subscribe((data: any) => {
          if (data.Table[0].STATUS == "100") {      
          this.chargesdetails = data.Table
          }
        this.ResetClientrate()
        this.loaderService.display(false)

      })
  }

  ResetClientrate() {
     this.PKID="0";
     this.FK_QUTDETID  ="0";
    this.chngetype = "";
    this.acccode = undefined;
    this.currency = "";
    this.rate = "";
    this.minrate = "";
    this.unit = "";
    this.exrate="";
    this.txtchild  ="Add"
  }

  Add_Final() {
    if (this.chargesdetails.length < 1) {
      this._toasterService.toast('warning', 'warning', 'Please Fill Charges detail Form First !');
      return false;
    }
    if (this.company == "" || this.company == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Company!');
      return false;
    }
    if (this.shiptype == "" || this.shiptype == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Shipment Type  !');
      return false;
    }
    if (this.client == "" || this.client == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Client Code  !');
      return false;
    }
    if (this.origin == "" || this.origin == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Origin Type  !');
      return false;
    }
    if (this.shipmode == "" || this.shipmode == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Shipment Mode !');
      return false;
    }
    if (this.liner == "" || this.liner == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Shipping Line!');
      return false;
    }
  
    if (this._dataService.date2Comparison(this.quotdate,this.Quotvaliddate) ==false)
    {
      this._toasterService.toast('warning', 'warning', 'Qoatation  Valid date should be greater than Quotation date !');
      return false;
    }
    if (this.Quotvaliddate == "" || this.Quotvaliddate == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Quoatation  Valid Date !');
      return false;
    }
    if (this.pol == "" || this.pol == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select POL!');
      return false;
    }
    if (this.pod == "" || this.pod == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select POD!');
      return false;
    }
    (this.PKQUTID.trim()==""?0 : this.PKQUTID)

    this.loaderService.display(true)
    const jsonmasterchild = {
      PKQUTID: this.PKQUTID,
      QUOTNO:this.QUOTNO,
      CLIENT_CODE: this.client,
      CLIENT_ORIGIN: this.origin,
      SHIP_MODE: this.shipmode,
      QUOTDT: this.quotdate,
      QUOTVALIDDT: this.Quotvaliddate,
      MakerIP: this._loginService.getLogin()[0].MAKERIP,
      MakerID: this._loginService.getLogin()[0].CMPID,
      VGUID: this._loginService.getLogin()[0].GUID,
      CMPCODE:this.company,
      SHIP_TYPE:this.shiptype,
      SHIPPINGLINE:this.liner,
      CITYCODE:this._loginService.getLogin()[0].CITYCODE,
      POL:this.pol,
      POD:this.pod,
      NARRATION:this.narration

    }
    //console.log(jsonmasterchild)
    this._dataService.Common("Admin/ACC_CLIENT_RATE_MST_IU", jsonmasterchild)
      .subscribe((data: any) => {
        // console.log(data)
        this.loaderService.display(false)
        if(this.PKQUTID=="0")
        {
          if (data.Table[0].STATUS == "100") {
            this._toasterService.toast('success', 'success', data.Table[0].STATUSTEXT);
            this.PrintQuotation(data.Table[0].QUOTNO)
            this.RestFinal();
            this.loaderService.display(false)
          } else  {
            this._toasterService.toast('error', 'error', data.Table[0].STATUSTEXT);
            this.loaderService.display(false)
          }

        }
        else if(this.PKQUTID!="0")
        {
        if (data.Table[0].STATUS == "100") {
          this._toasterService.toast('success', 'success', data.Table[0].STATUSTEXT);
          this.PrintQuotation(data.Table[0].QUOTNO)
          this.RestFinal();
          this.loaderService.display(false)
        } else  {
          this._toasterService.toast('error', 'error', data.Table[0].STATUSTEXT);
          this.loaderService.display(false)
        }
      } 
      })
  }
  RestFinal() {
    this.client = undefined,
    this.origin = "",
    this.shipmode = "",
    this.Effective_from0 = "";
    this.quotdate="";
    this.quotno="";
    this.Quotvaliddate="";
    this.Effective_to0 = "";
    this.chngetype = "";
    this.acccode = "";
    this.currency = "";
    this.rate = "";
    this.exrate="";
    this.minrate = "";
    this.unit = ""
    this.PKQUTID="0";
    this.chargesdetails=[];
    this.company=""
    this.shiptype=""
    this.txtchild ="Add"
    this.liner=""
    this.pol=""
    this.pod=""
    this.narration=""
    this._router.navigate(['/admin/Adminacct/ClientRate/ '  ]);
  }

  Editchildrecd(id) {
    /////  let filterData = this.chargesdetails.filter((filter) => filter.PKID == id)[0];
    let filterData = id;
    this.PKID=filterData.PKID;
    this.acccode = filterData.CHRG_CODE;
    this.currency = filterData.CURCODE;
    this.chngetype = filterData.CHRG_TYPE;
    this.rate = filterData.RATE;
    this.exrate=filterData.EXRATE;
    this.minrate = filterData.MIN_RATE;
    this.unit = filterData.UNIT;
    this.txtchild ="Update"
  }
  editpopulate() {
    const jsonmaster = {
      pkid: this.queryParamsUserId,
      Makerid: this._loginService.getLogin()[0].CMPID,
      VGuid: this._loginService.getLogin()[0].GUID
    }
    this.loaderService.display(true)
    this._dataService.getData("Admin/ACC_CLIENT_RATE_POPULATE", jsonmaster)
      .subscribe((data: any) => {
        if (data.Table[0].STATUS == "100") {
         console.log(data.Table[0])
         this.company = data.Table[0].COMPNAY_CODE,
         this.QUOTNO=data.Table[0].QUT_CODE,
         this.quotno=data.Table[0].QUT_CODE,
         this.shiptype = data.Table[0].SHIP_TYPE,
          this.client = data.Table[0].CLIENT_CODE,
          this.origin = data.Table[0].CLIENT_ORIGIN,
          this.shipmode = data.Table[0].SHIP_MODE,
          this.liner=data.Table[0].SHIPPINGLINE,
          this.quotdate = this.datepipe.transform(data.Table[0].QUOTDT, 'dd/MM/yyyy'),
          this.Quotvaliddate = this.datepipe.transform(data.Table[0].QUOTVALIDDT, 'dd/MM/yyyy')
          this.pol=data.Table[0].POL,
          this.pod=data.Table[0].POD,
          this.narration=data.Table[0].NARRATION,
          // this.Effective_from0 = this.datepipe.transform(data.Table[0].EFFECT_FRMDT, 'dd/MM/yyyy'),
          // this.Effective_to0 = this.datepipe.transform(data.Table[0].EFFECT_TODT, 'dd/MM/yyyy')
          this.chargesdetails=data.Table1;
          this.loaderService.display(false)
        } else  {
          this._toasterService.toast('error', 'error', data.Table[0].STATUSTEXT);
          this.loaderService.display(false)
        }
      })
  }
  onDateChanged(ev) {
    //console.log(ev)
    this.Effective_from0 = ev.formatted
  }
  onDateChanged1(ev2) {
    this.Effective_to0 = ev2.formatted
  }
  onquotDateChanged(ev3) {
    this.quotdate = ev3.formatted
  }
  QuotValidDateChanged(ev4) {
    this.Quotvaliddate = ev4.formatted
  }
  onchangefindcomma(innumber) {
    if(innumber!=undefined) {
    if (innumber.match(/,/g) != null) {
      alert('comma not allowed');
      this.validnumber = false;
      return false;
    }
    else {
      this.validnumber = true;
    }
  }
  }
     PrintQuotation(Qtno){
     
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/Admin-Quotation-Print/' + Qtno + '/' , "Quotation Print", toolbar);
            
     }
}