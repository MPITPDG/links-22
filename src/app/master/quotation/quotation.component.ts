import { Component, OnInit } from '@angular/core';
import { IMyOptions} from 'mydatepicker';

import { DataService } from '../../shared/service/dataService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { DatePipe } from '@angular/common'


@Component({
  selector: 'app-quotation-entry',
  templateUrl: './quotation.component.html',
  styleUrls: ['./quotation.component.css']
})
export class QuotationEntryComponent implements OnInit {
  Header: String = 'QUOTATION ENTRY';
  narration: string = "";
  chngetypetable: any = []
  shpmodetable: any = []
  unittabel: any = []
  currencytable: any = []
  origintable: any = []
  clientable: any = []
  accountable: any = []
  chargesdetails: any = []
  shipmentable: any = []
  compnytable: any = []
  linertable: any = []
  airlinetable: any = []
  shiptype;
  company: string = ""
  origin;
  client: String;
  shipmode: string = "SEA";
  Effective_from0;
  Effective_to0;
  quotdate;
  Quotvaliddate;
  chargetype;
  acccode;
  currency;
  rate: string = "";
  exrate: string = "";
  minrate: string = "";
  unittype;
  PKQUTID: string = "0";
  FK_QUTDETID: string = "0";
  FK_QUTID: string = "0";
  queryParamsUserId: string = "";
  validnumber: boolean = true;
  PKID: string = "0";
  liner;
  visible: string = "0";
  quotno: string = "";
  commoncities: any = [];
  pol;
  pod;
  QUOTNO: string = "";
  poltable: any = [];
  podtable: any = [];
  incoterm;
  incotermtable: any = [];
  contloadtype;
  containerloadtypetable: any = [];
  weight;
  chweight;
  volume;
  load;
  url;
  airline;
  public disableexrate: boolean = true;
  childbtntext:string="Add"
  unit;
  public myDatePickerOptions: IMyOptions= {
    dateFormat: 'dd/mm/yyyy',
    inline: false,
    height: '20px',
    width: '160px',
    componentDisabled: false,
    selectionTxtFontSize: '12px',
    editableDateField: false,
    sunHighlight: true,
    //satHighlight: true,
    firstDayOfWeek: 'su',
    openSelectorTopOfInput: false,
    openSelectorOnInputClick: true,
    // //selectorHeight: '180px',    // selectorWidth: '200px'
  };

  constructor(private _dataService: DataService,
    private _ToastrService: ToastCommonService,
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
    console.log(this.quotdate)
    var vqdate = new Date();
    this.Quotvaliddate = this._dataService.addDays(vqdate, 30)
    console.log(this.Quotvaliddate)
    this._activatedRoute.params.subscribe(params => {
      this.queryParamsUserId = params["pkqutid"];
      //this.PKQUTID=(this.queryParamsUserId == " " ? "0" : this.queryParamsUserId);
      this.quotno = params["quotationno"];

      this.containerloadtypetable = [
        { DATAVALUE: 'LCL/FCL', DATATEXTVALUE: 'LCL/FCL' },
        { DATAVALUE: 'FCL/FCL', DATATEXTVALUE: 'FCL/FCL' },
        { DATAVALUE: 'LCL/LCL', DATATEXTVALUE: 'LCL/LCL' },
        { DATAVALUE: 'FCL/LCL', DATATEXTVALUE: 'FCL/LCL' },
        { DATAVALUE: 'GROUPAGE', DATATEXTVALUE: 'GROUPAGE' }
      ];
      // this.incoterm="EXW"
      // this.containerloadtype="LCL/FCL"
      // this.shiptype="EXPORT"
      // console.log(this.PKQUTID)
        const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
        this._dataService.getData("Admin/ADMIN_QUOTATION_RESET", jsonreset)
        .subscribe((data: any) => {
            });
         })

   
    if (this.quotno != ' ') {
      this._loginService.verifyRights(431, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });
         this.editpopulate()
    }
    else {
      this._loginService.verifyRights(431, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });

    }

    this.loaderService.display(true)
    const jsonmaster2 = {
      CMPID: this._loginService.getLogin()[0].CMPID,
    }
    this._dataService.getData("Admin/ADMIN_QUOTATION_PAGELOAD", jsonmaster2)
      .subscribe((data: any) => {
        this.shipmentable = data.Table8
        this.compnytable = data.Table7
        this.chngetypetable = data.Table6
        this.shpmodetable = data.Table5
        this.unittabel = data.Table4
        this.currencytable = data.Table3
        this.accountable = data.Table2
        this.origintable = data.Table1
        this.clientable = data.Table
        this.linertable = data.Table9
        this.commoncities = data.Table10
        this.incotermtable = data.Table11
        this.airlinetable = data.Table12

        this.loaderService.display(false)
        console.log(data)
      })
  }
  onquotDateChanged(ev2) {
    this.quotdate= ev2.formatted
  }
   QuotValidDateChanged(ev2) {
    this.Quotvaliddate = ev2.formatted
  }
  TextareaValueChange(ev) {
    this.narration = ev.target.value;
  }
  editpopulate() {
    
      const jsonmaster = {
        pkid: (this.queryParamsUserId == undefined ? "0" : this.queryParamsUserId),
        Makerid: this._loginService.getLogin()[0].CMPID,
        VGuid: this._loginService.getLogin()[0].GUID,
        QuotNo: this.quotno
      }
      this.loaderService.display(true)
      this._dataService.getData("Admin/ADMIN_QUOTATION_POPULATE", jsonmaster)
        .subscribe((data: any) => {
          if (data.Table[0].STATUS == "100") {
            console.log(data.Table[0])
            this.company = data.Table[0].COMPANY_CODE,
              this.PKQUTID = data.Table[0].PK_QUOTID,
              this.QUOTNO = data.Table[0].QUOT_CODE,
              this.quotno = data.Table[0].QUOT_CODE,
              this.shiptype = data.Table[0].SHIP_TYPE,
              this.client = data.Table[0].CLIENT_CODE,
              this.origin = data.Table[0].CLIENT_ORIGIN,
              this.shipmode = data.Table[0].SHIP_MODE,
              this.liner = data.Table[0].SHIPPINGLINE,
              this.quotdate = data.Table[0].QUOT_DATE,
              this.Quotvaliddate = data.Table[0].VALIDUPTO,
              this.pol = data.Table[0].POL,
              this.pod = data.Table[0].POD,
              this.narration = data.Table[0].NARRATION,
              this.weight = data.Table[0].WEIGHT,
              this.chweight = data.Table[0].CHWEIGHT,
              this.volume = data.Table[0].VOLUME,
              this.load = data.Table[0].LOAD,
              this.incoterm = data.Table[0].INCOTERM,
              this.contloadtype = data.Table[0].CONTLOADTYPE,
              this.airline = data.Table[0].AIRLINECODE,
              // this.Effective_from0 = this.datepipe.transform(data.Table[0].EFFECT_FRMDT, 'dd/MM/yyyy'),
              // this.Effective_to0 = this.datepipe.transform(data.Table[0].EFFECT_TODT, 'dd/MM/yyyy')
              this.chargesdetails = data.Table1;
            this.loaderService.display(false)
          } else {
            this._ToastrService.toast('error', 'error', data.Table[0].STATUSTEXT);
            this.loaderService.display(false)
          }
        })
    }
  Addchilddata() {
    // if(this.PKQUTID!="0")
    // {
    //   this._ToastrService.toast('warning', 'warning', 'You can`t Add/Update this record !');
    //   return false;
    // }
    if (this.chargetype == "" || this.chargetype == undefined) {
      this._ToastrService.toast('warning', 'warning', 'Please select Charge Type  !');
      return false;
    }
    if (this.acccode == "" || this.acccode == undefined) {
      this._ToastrService.toast('warning', 'warning', 'Please select Account Code  !');
      return false;
    }
    if (this.currency == "" || this.currency == undefined) {
      this._ToastrService.toast('warning', 'warning', 'Please select Currency !');
      return false;
    }
    if(this)
    if (this.rate == "" || this.rate == undefined) {
      this._ToastrService.toast('warning', 'warning', 'Charges rate could not be blank !');
      return false;
    }
    // if (this.minrate == "" || this.minrate == undefined) {
    //   this._ToastrService.toast('warning', 'warning', 'Charges min.rate could not be blank !');
    //   return false;
    // }
    if (this.unit == "" || this.unit == undefined) {
      this._ToastrService.toast('warning', 'warning', 'Please select Unit!');
      return false;
    }
    if (this.validnumber == false) {
      this._ToastrService.toast('warning', 'warning', "These fields Rate,Min.Rate are number  remove comma(,) seperator !");
      return false;
    }

    this.loaderService.display(true)
    const jsonchild = {
      PKID: (this.PKID == null ? "" : this.PKID),
      FK_QUOTID: this.PKQUTID,//this.FK_QUTID,
      QUOT_CODE: this.quotno,
      CHRG_CODE: this.acccode,
      CHRG_TYPE: this.chargetype,
      CURCODE: this.currency,
      RATE: this.rate,
      EX_RATE: (this.exrate == "" ? 0 : this.exrate),
      MIN_RATE: (this.minrate == "" ? 0 : this.minrate),
      UNIT: this.unit,
      UNITTYPE: this.unittype,
      QUOTDTLID: this.FK_QUTDETID,
      MakerID: this._loginService.getLogin()[0].CMPID,
      VGUID: this._loginService.getLogin()[0].GUID,
      ///  POL:this.editpopulate,
    }
    //console.log(jsonchild)
    this._dataService.Common("Admin/ADMIN_QUOTATION_CHILD_IU", jsonchild)
      .subscribe((data: any) => {
        if (data.Table[0].STATUS == "100") {
          this.chargesdetails = data.Table1
        }
        this.Resetchildrecd()
        this.loaderService.display(false)

      })
  }

  Editchildrecd(id) {
    /////  let filterData = this.chargesdetails.filter((filter) => filter.PKID == id)[0];
    let filterData = id;
    this.PKID = filterData.PKID;
    this.acccode = filterData.CHRG_CODE;
    this.currency = filterData.CURCODE;
    if(this.currency=="CR115"){
      this.disableexrate=true;
    } else{ 
      this.disableexrate=false;
    }
    this.chargetype = filterData.CHRG_TYPE;
    this.rate = filterData.RATE;
    this.exrate = filterData.EXRATE;
    this.minrate = filterData.MIN_RATE;
    this.unit = filterData.UNIT;
    this.unittype = filterData.UNITTYPE;
    this.FK_QUTDETID=filterData.QUOTDTLID;
    this.childbtntext = "Update"
  }
   Deletechildrecd(id,quotdtlid){
             
                if(confirm('Are you sure want to delete the record ?')) { 
                    this.loaderService.display(true);      
                    const jsondelete = { ID  : id,VGUID :this._loginService.getLogin()[0].GUID,QUOTDTLID:quotdtlid}
                    this._dataService.getData("Admin/ADMIN_QUOTATION_TMP_DEL", jsondelete)
                        .subscribe((data: any) => {              
                        if (data.Table[0].STATUS== "100") {
                            this._ToastrService.toast('info', 'Complete', data.Table[0].STATUSTEXT );
                            this.chargesdetails=data.Table;
                            this.loaderService.display(false);
                            }            
                            else { 
                            this._ToastrService.toast("warning","warning" ,data.Table[0].STATUSTEXT);
                            this.loaderService.display(false);
                            }
                        });            
                      }
 }
  Resetchildrecd() {
    this.PKID = "0";
    this.FK_QUTDETID = "0";
    this.chargetype = "";
    this.acccode = undefined;
    this.currency = "";
    this.rate = "";
    this.minrate = "";
    this.unit = "";
    this.exrate = "";
    this.unittype='';
    this.childbtntext = "Add"
  }

  Add_Final() {
    if (this.chargesdetails.length < 1) {
      this._ToastrService.toast('warning', 'warning', 'Please enter charges !');
      return false;
    }
    // if (this.company == "" || this.company == undefined) {
    //   this._ToastrService.toast('warning', 'warning', 'Please select Company!');
    //   return false;
    // }
    if (this.shiptype == "" || this.shiptype == undefined) {
      this._ToastrService.toast('warning', 'warning', 'Please select Shipment Type  !');
      return false;
    }
    if (this.client == "" || this.client == undefined) {
      this._ToastrService.toast('warning', 'warning', 'Please select Client !');
      return false;
    }
    if (this.origin == "" || this.origin == undefined) {
      this._ToastrService.toast('warning', 'warning', 'Please select Origin!');
      return false;
    }
    if (this.shipmode == "" || this.shipmode == undefined) {
      this._ToastrService.toast('warning', 'warning', 'Please select Shipment Mode !');
      return false;
    }
    if(this.shipmode == "SEA")
      {
    if (this.liner == "" || this.liner == undefined) {
      this._ToastrService.toast('warning', 'warning', 'Please select Shipping Line!');
      return false;
    }
       }
           if(this.shipmode == "AIR")
      {
    if (this.airline == "" || this.airline == undefined) {
      this._ToastrService.toast('warning', 'warning', 'Please select Airline !');
      return false;
    }
       }

    if (this._dataService.date2Comparison(this.quotdate, this.Quotvaliddate) == false) {
      this._ToastrService.toast('warning', 'warning', 'Qoatation  Valid date should be greater than Quotation date !');
      return false;
    }
    if (this.Quotvaliddate == "" || this.Quotvaliddate == undefined) {
      this._ToastrService.toast('warning', 'warning', 'Please select Quoatation  Valid Date !');
      return false;
    }
    if (this.pol == "" || this.pol == undefined) {
      this._ToastrService.toast('warning', 'warning', 'Please select POL!');
      return false;
    }
    if (this.pod == "" || this.pod == undefined) {
      this._ToastrService.toast('warning', 'warning', 'Please select POD!');
      return false;
    }

    if (this.quotno == undefined || this.quotno.trim() == "" || this.quotno == "0")
      this.url = "Admin/ADMIN_QUOTATION_MST_INSERT"
    else {
      this.url = "Admin/ADMIN_QUOTATION_MST_UPDATE"
    }


    this.loaderService.display(true)
    const jsonmaster = {
      PK_QUOTID: (this.PKQUTID == null ? "" : this.PKQUTID),
      QUOT_CODE: (this.quotno == null ? "" : this.quotno),
      QUOT_DATE: this.quotdate,
      VALIDUPTO: this.Quotvaliddate,
      CLIENT_CODE: this.client,
      CLIENT_ORIGIN: this.origin,
      SHIP_MODE: this.shipmode,
      SHIP_TYPE: this.shiptype,
      COMPANY_CODE: this.company,
      SHIPPINGLINE: (this.liner == null ? "" : this.liner),
      POL: this.pol,
      POD: this.pod,
      WEIGHT: (this.weight == null ? 0 : this.weight),
      CHWEIGHT: (this.chweight == null ? 0 : this.chweight),
      VOLUME: (this.volume == null ? 0 : this.volume),
      LOAD: (this.load == null ? "" : this.load),
      INCOTERM: this.incoterm,
      CONTLOADTYPE:  (this.contloadtype == null ? "" : this.contloadtype),
      NARRATION: this.narration,
      AIRLINE: (this.airline == null ? "" : this.airline),
      MakerID: this._loginService.getLogin()[0].CMPID,
      MakerIP: this._loginService.getLogin()[0].MAKERIP,
      VGUID: this._loginService.getLogin()[0].GUID,
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,


    }
    //console.log(jsonmasterchild)
    this._dataService.Common(this.url, jsonmaster)
      .subscribe((data: any) => {
        // console.log(data)
        this.loaderService.display(false)
        if (this.quotno == undefined || this.quotno.trim() == "" || this.quotno == "0") {
          if (data.Table[0].STATUS == "100") {
            this._ToastrService.toast('success', 'success', data.Table[0].STATUSTEXT);
            this.quotno = data.Table[0].QUOTNO
           // this.PrintWisorQuotation()
           this.PrintQuotation();
            this.ResetFinal();
            this.loaderService.display(false)
          } else {
            this._ToastrService.toast('error', 'error', data.Table[0].STATUSTEXT);
            this.loaderService.display(false)
          }

        }
        else if (this.quotno != undefined || this.quotno.trim() != "" || this.quotno != "0") {
          if (data.Table[0].STATUS == "100") {
            this._ToastrService.toast('success', 'success', data.Table[0].STATUSTEXT);
            this.QUOTNO = data.Table[0].QUOTNO;
             this.PrintQuotation();
            //this.PrintWisorQuotation();
            this.ResetFinal();
            this.loaderService.display(false)
          } else {
            this._ToastrService.toast('error', 'error', data.Table[0].STATUSTEXT);
            this.loaderService.display(false)
          }
              this.loaderService.display(false)
        }
      })
  }
  ResetFinal() {
    this.quotno='';
    this.client = undefined,
    this.origin =  undefined
    this.shipmode  = undefined
    this.Effective_from0 = "";
    this.quotdate = "";
    this.Quotvaliddate = "";
    this.Effective_to0 = "";
    this.chargetype = "";
    this.acccode = "";
    this.currency = "";
    this.rate = "";
    this.exrate = "";
    this.minrate = "";
    this.unit = ""
    this.PKQUTID = "0";
    this.chargesdetails = [];
    this.company = ""
    this.shiptype= undefined
    this.childbtntext = "Add"
    this.liner = undefined
    this.pol = undefined
    this.pod = undefined
    this.narration = ""
    this.weight = ""
    this.chweight = ""
    this.volume = ""
    this.load = ""
    this.incoterm = undefined
    this.contloadtype = undefined
    this.airline = undefined
    this._router.navigate(['/master/quotation/Quotation/ ']);
  }

  onchangefindcomma(innumber) {
    if (innumber != undefined) {
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
  PrintQuotation() {
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    if (this.shipmode == "AIR") {
      window.open('./#/popup/Air-Quotationprint/' + this.quotno + '/', "Air Quotation Print", toolbar);
    }
    else if (this.shipmode == "SEA") {
      window.open('./#/popup/Sea-Quotationprint/' + this.quotno + '/', "Sea Quotation Print", toolbar);
  }
}
  PrintWisorQuotation() {
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Wisor-Quotationprint/' + this.quotno + '/', "Quotation Print", toolbar);

  }
  getexchangerate(ev) {
    if (ev == "CR115") {
      this.disableexrate = true;
      this.exrate = "1.00"

    }
    else {
      this.disableexrate = false;
      this.exrate = ""

    }

  }
  changeshipmentmode(ev) {
    if (ev == "AIR") {
      this.shipmode = "AIR";
    }
    else if (ev == "SEA") {
      this.shipmode = "SEA";
    }
  }
}