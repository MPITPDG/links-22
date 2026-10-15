
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router} from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { FcrSharedDataService } from '../export-share-data.service';
import { LoaderService } from '../../shared/service/loader.service';
import { environment } from   '../../../environments/environment'; 
@Component({
    selector: 'app-fcr-printview',
    // templateUrl: 'exp_prt_fcr_printview.component.html'
    template: `
    @if (loadError) {
      <div class="card sec">
        <div class="state">
          <h3>This document could not be loaded</h3>
          <p>{{ loadError }}</p>
        </div>
      </div>
    } @else if (!loaded) {
      <div class="card sec">
        <div class="state"><h3>Loading document...</h3><p>Fetching the House B/L details.</p></div>
      </div>
    } @else {

      <div class="card sec">
        <div class="card-h"><h2>Document</h2><span class="meta">Reference numbers</span></div>
        <div class="fields">
          <div class="fld">
            <label for="fcrno">B/L / FCR no.</label>
            <input type="text" id="fcrno" name="fcrno" class="mono" maxlength="15" [(ngModel)]="FCRNO" readonly>
          </div>
          <div class="fld">
            <label for="bookingno">Booking no.</label>
            <input type="text" id="bookingno" name="bookingno" maxlength="10">
          </div>
          <div class="fld full tall">
            <label for="expno">Shipment ref / export no.</label>
            <textarea id="expno" name="expno" rows="2" [(ngModel)]="EXPNO"></textarea>
          </div>
        </div>
      </div>

      <div class="card sec">
        <div class="card-h"><h2>Parties</h2><span class="meta">Names and full addresses</span></div>
        <div class="fields">
          <div class="fld full tall">
            <label for="shipper">Shipper</label>
            <textarea id="shipper" name="shipper" rows="4" [(ngModel)]="SHIPPER"></textarea>
          </div>
          <div class="fld full tall">
            <label for="consignee">Consignee</label>
            <textarea id="consignee" name="consignee" rows="4" [(ngModel)]="CONSIGNEE"></textarea>
          </div>
          <div class="fld full tall">
            <label for="notify">Notify party</label>
            <textarea id="notify" name="notify" rows="4" [(ngModel)]="NOTIFYPARTY"></textarea>
          </div>
          <div class="fld full tall">
            <label for="applyto">For delivery apply to</label>
            <textarea id="applyto" name="applyto" rows="4" [(ngModel)]="APPLYTO"></textarea>
          </div>
        </div>
      </div>

      <div class="card sec">
        <div class="card-h"><h2>Routing</h2><span class="meta">Carriage, ports and places</span></div>
        <div class="fields">
          <div class="fld">
            <label for="carriage">Initial carriage</label>
            <input type="text" id="carriage" name="carriage" maxlength="50" [(ngModel)]="CARRIER">
          </div>
          <div class="fld">
            <label for="receipt">Place of receipt</label>
            <input type="text" id="receipt" name="receipt" maxlength="50" [(ngModel)]="RECPTPLACE">
          </div>
          <div class="fld">
            <label for="vessel">Export carrier (vessel &amp; voyage)</label>
            <input type="text" id="vessel" name="vessel" maxlength="50" [(ngModel)]="VESSEL">
          </div>
          <div class="fld">
            <label for="pol">Port of loading</label>
            <input type="text" id="pol" name="pol" maxlength="50" [(ngModel)]="POL">
          </div>
          <div class="fld">
            <label for="discharge">Port of discharge</label>
            <input type="text" id="discharge" name="discharge" maxlength="50" [(ngModel)]="POD">
          </div>
          <div class="fld">
            <label for="delivery">Place of delivery</label>
            <input type="text" id="delivery" name="delivery" maxlength="50" [(ngModel)]="PODEL">
          </div>
        </div>
      </div>

      <div class="card sec">
        <div class="card-h"><h2>Cargo</h2><span class="meta">Printed as typed - columns stay aligned</span></div>
        <div class="fields">
          <div class="fld full tall">
            <label for="marks">Marks &amp; numbers / container no.</label>
            <textarea id="marks" name="marks" class="mono" rows="6" [(ngModel)]="MARKSANDNOS"></textarea>
          </div>
          <div class="fld full tall">
            <label for="pkgs">No. of packages</label>
            <textarea id="pkgs" name="pkgs" class="mono" rows="4" [(ngModel)]="NOOFPKGS"></textarea>
          </div>
          <div class="fld full tall">
            <label for="desc">Description of packages and goods</label>
            <textarea id="desc" name="desc" class="mono" rows="6" [(ngModel)]="ITCDESC"></textarea>
          </div>
          <div class="fld full tall">
            <label for="grwt">Gross weight (kg)</label>
            <textarea id="grwt" name="grwt" class="mono" rows="4" [(ngModel)]="GRWT"></textarea>
          </div>
          <div class="fld full tall">
            <label for="cbm">Measurement (CBM)</label>
            <textarea id="cbm" name="cbm" class="mono" rows="4" [(ngModel)]="VOL"></textarea>
          </div>
        </div>
      </div>

      <div class="card sec">
        <div class="card-h"><h2>Freight &amp; charges</h2><span class="meta">Subject to correction</span></div>
        <div class="fields">
          <div class="fld full tall">
            <label for="freight">Freight rate, charges, weights and/or measurements</label>
            <textarea id="freight" name="freight" class="mono" rows="4" [(ngModel)]="MISC"></textarea>
          </div>
          <div class="fld full tall">
            <label for="prepaid">Prepaid</label>
            <textarea id="prepaid" name="prepaid" class="mono" rows="3" [(ngModel)]="PP"></textarea>
          </div>
          <div class="fld full tall">
            <label for="collect">Collect</label>
            <textarea id="collect" name="collect" class="mono" rows="3" [(ngModel)]="CC"></textarea>
          </div>
          <div class="fld">
            <label for="totpp">Total prepaid</label>
            <input type="text" id="totpp" name="totpp" class="mono" maxlength="15" [(ngModel)]="TOTPP">
          </div>
          <div class="fld">
            <label for="totcc">Total collect</label>
            <input type="text" id="totcc" name="totcc" class="mono" maxlength="15" [(ngModel)]="TOTCC">
          </div>
        </div>
      </div>

      <div class="card sec">
        <div class="card-h"><h2>Issue details</h2><span class="meta">Printed at the foot of the document</span></div>
        <div class="fields">
          <div class="fld full">
            <label for="placedt">Place &amp; date of issue</label>
            <input type="text" id="placedt" name="placedt" maxlength="50" [(ngModel)]="PLACEDATE">
          </div>
        </div>
      </div>

    }
`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})

export class ExptFCRPrintview implements OnChanges {
    private baseUrl: string = 'Export/Export_FCR_PRINTPREVIEW';
    @Input() hbltype: string;
    HBLTYPE_ACT: string="";
    SHIPPER: any = "";
    CONSIGNEE: any = "";
    NOTIFYPARTY: any = "";
    FCRNO: any = "";
    FCRDT: any = "";
    APPLYTO: any = "";
    CARRIER: any = "";
    RECPTPLACE: any = "";
    VESSEL: any = "";
    POL: any = "";
    POD: any = false;
    PODEL: any = "";
    APPLYTO1: any = "";
    MARKSANDNOS: any = "";

    NOOFPKGS: any = "";
    ITCDESC: any = "";
    GRWT: any = "";
    VOL: any = "";
    MISC: any = "";
    PP: any = "";
    CC: any = "";
    TOTPP: any = "";
    TOTCC: any = "";
    PLACEDATE: any = "";
    EXPNO: any = false;

    Bltype: any = "";
    FCRDET: any;
    buttonStatus = false;
    ISPRINT:string="";
    DRAFTPRINT : string='';
    Rider :string="";
    SAILING_DT:string="";
    expressbill:boolean=false;
    printmsg:string="";
     expressbillval:string=""
     WaterMarkoption:boolean=false;
     watermarkval:string="0";
    public draftvisible  =true;
    /** Presentation (from MPERPNG-20): true once Export_FCR_PRINTPREVIEW has filled the form */
    loaded:boolean=false;
    /** set when the record could not be loaded; shown instead of the form */
    loadError:string="";
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _fcrsharedvataSerice: FcrSharedDataService,
        private _fcrHbltypesharedvataSerice: FcrSharedDataService,
        private _fcrhblprinttype : FcrSharedDataService,
        private _fcrdraftvisible :FcrSharedDataService,
        private loaderService: LoaderService,) {
    }
    ngOnChanges()
    {
        this.loaded = false;
        this.loadError = "";
        if (!this._fcrsharedvataSerice.fcrsharedData) {
            this.loadError = "No document number was carried over from the House B/L screen.";
            this.loaderService.display(false);
            return;
        }
        this.loaderService.display(true);
        console.log("FCR NO. "+this._fcrsharedvataSerice.fcrsharedData);
        const jsonExport = { FCRNO: this._fcrsharedvataSerice.fcrsharedData };//'GOA103180016'
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {
                const first = (data && data.Table && data.Table.length) ? data.Table[0] : null;
                if (first && first.STATUS == 100) {
                    this.FCRDET = data.Table;

                    this.SHIPPER = this.FCRDET[0].SHIPPER;
                    this.CONSIGNEE = this.FCRDET[0].CONSIGNEE;
                    this.NOTIFYPARTY = this.FCRDET[0].NOTIFYPARTY;
                    this.FCRNO = this.FCRDET[0].FCRNO;
                    this.FCRDT = this.FCRDET[0].FCRDT;
                    this.APPLYTO = this.FCRDET[0].APPLYTO;
                    this.CARRIER = this.FCRDET[0].CARRIER;
                    this.RECPTPLACE = this.FCRDET[0].RECPTPLACE;
                    this.VESSEL = this.FCRDET[0].VESSEL;
                    this.POL = this.FCRDET[0].POL;
                    this.POD = this.FCRDET[0].POD;
                    this.PODEL = this.FCRDET[0].PODEL;
                    this.APPLYTO1 = this.FCRDET[0].APPLYTO;
                    this.MARKSANDNOS = this.FCRDET[0].MARKSANDNOS;
                    this.NOOFPKGS = this.FCRDET[0].NOOFPKGS;
                    this.ITCDESC = this.FCRDET[0].ITCDESC;
                    this.GRWT = this.FCRDET[0].GRWT;
                    this.VOL = this.FCRDET[0].VOL;
                    this.MISC = this.FCRDET[0].MISC;
                    this.PP = this.FCRDET[0].PP;
                    this.CC = this.FCRDET[0].CC;
                    this.TOTPP = this.FCRDET[0].TOTPP;
                    this.TOTCC = this.FCRDET[0].TOTCC;
                    this.PLACEDATE = this.FCRDET[0].PLACEDATE;
                    this.EXPNO = this.FCRDET[0].EXPNO;
                    this.ISPRINT=this.FCRDET[0].ISPRINT;
                    this.HBLTYPE_ACT=this.FCRDET[0].HBLTYPE;
                    this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
                    this.SAILING_DT=data.Table[0].SAILING;
                    if (this._loginService.getLogin()[0].CMPCODE=='01' || this._loginService.getLogin()[0].CMPCODE=='02') {
                        if(this.DRAFTPRINT =='3')
                        {  this.draftvisible= false ; }
                        else if ( this.ISPRINT=='1')
                        { this.draftvisible= false ; }
                        else  
                        { this.draftvisible= true ; }
                    }
                    else{
                        {  this.draftvisible= false ; }
                    }
                    this._fcrdraftvisible.fcrsharedData=this.draftvisible
                    this.loaded = true;
                    this._toasterService.toast('info', 'Complete', 'Data filled successfully');
                    this.loaderService.display(false);       
                } else {
                    this.loadError = (first && first.STATUSTEXT) || "The document could not be loaded.";
                    this._toasterService.toast('error', 'Error', this.loadError);
                    this.loaderService.display(false);
                }

            },
            (error) => {
                this.loadError = "The document could not be loaded (" + (error && error.status) + ").";
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.STATUSTEXT);
                this.loaderService.display(false);  
            },
            () => {
            });
    }
    checkValue(event: any){
        console.log(event);
        if(event.target.checked)
        {
        this.expressbill=true
          }
        else
        {
            this.expressbill=false
        }
     }
     getwatermarkvalue(event: any){

        if(event.target.checked)
        {
        this.WaterMarkoption=true
        this.watermarkval="1"
          }
        else
        {
            this.WaterMarkoption=false
            this.watermarkval="0"
        }
     }
    printUpdate() {
        
        if  (this.ISPRINT=="1")
        {
            this._toasterService.toast('warning', 'warning', "You can`t update ,Print already taken ");            
        }
        else if  (this.DRAFTPRINT=="10")
        {
            this._toasterService.toast('warning', 'warning', "You can`t update ,Draft already taken 10 times");            
        }
        else
        {
        this.buttonStatus = true;
        this.loaderService.display(true); 
        this.baseUrl = 'Export/Export_FCR_PRINTUPDATE';
        const jsonExport = { SHIPPER: this.SHIPPER, CONSIGNEE: this.CONSIGNEE, NOTIFYPARTY: this.NOTIFYPARTY, CARRIER: this.CARRIER, APPLYTO: this.APPLYTO, VESSEL: this.VESSEL, POL: this.POL, POD: this.POD, PODEL: this.PODEL, MARKSANDNOS: this.MARKSANDNOS, NOOFPKGS: this.NOOFPKGS, ITCDESC: this.ITCDESC, GRWT: this.GRWT, VOL: this.VOL, MISC: this.MISC, PLACEDATE: this.PLACEDATE, PP: this.PP, CC: this.CC, TOTPP: this.TOTPP, TOTCC: this.TOTPP, RECPTPLACE: this.RECPTPLACE, EXPNO: this.EXPNO, FCRNo: this.FCRNO  ,UERNAME:this._loginService.getLogin()[0].CMPID, CITYCODE :this._loginService.getLogin()[0].CITYCODE,rider:this.Rider};
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == "100") {
                    this.FCRDET = data.Table1;
                    this.SHIPPER = this.FCRDET[0].SHIPPER;
                    this.CONSIGNEE = this.FCRDET[0].CONSIGNEE;
                    this.NOTIFYPARTY = this.FCRDET[0].NOTIFYPARTY;
                    this.FCRNO = this.FCRDET[0].FCRNO;
                    this.FCRDT = this.FCRDET[0].FCRDT;
                    this.APPLYTO = this.FCRDET[0].APPLYTO;
                    this.CARRIER = this.FCRDET[0].CARRIER;
                    this.RECPTPLACE = this.FCRDET[0].RECPTPLACE;
                    this.VESSEL = this.FCRDET[0].VESSEL;
                    this.POL = this.FCRDET[0].POL;
                    this.POD = this.FCRDET[0].POD;
                    this.PODEL = this.FCRDET[0].PODEL;
                    this.APPLYTO1 = this.FCRDET[0].APPLYTO;
                    this.MARKSANDNOS = this.FCRDET[0].MARKSANDNOS;
                    this.NOOFPKGS = this.FCRDET[0].NOOFPKGS;
                    this.ITCDESC = this.FCRDET[0].ITCDESC;
                    this.GRWT = this.FCRDET[0].GRWT;
                    this.VOL = this.FCRDET[0].VOL;
                    this.MISC = this.FCRDET[0].MISC;
                    this.PP = this.FCRDET[0].PP;
                    this.CC = this.FCRDET[0].CC;
                    this.TOTPP = this.FCRDET[0].TOTPP;
                    this.TOTCC = this.FCRDET[0].TOTCC;
                    this.PLACEDATE = this.FCRDET[0].PLACEDATE;
                    this.EXPNO = this.FCRDET[0].EXPNO
                    this.HBLTYPE_ACT=this.FCRDET[0].HBLTYPE;
                    this._toasterService.toast('info', 'Complete', "Update successfully ");
                    this.loaderService.display(false);

                } else {

                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                    this.loaderService.display(false); 
                }


            });
        this.buttonStatus = false;
        }
    }
    printDraft()
    {
        if(this.expressbill==true){
            alert('Please uncheck the express bill as you are taking draft print');
            return false;

        }
        if  (this.DRAFTPRINT=="10")
        {
            this._toasterService.toast('warning', 'warning', "You cannot take more than 10 draft ");
            
        }
        else
        {
            this.buttonStatus = true;
            // if (this.DRAFTPRINT=="0"){ 
            //     if (confirm(" Are you sure want to take the Draft, You have  3 draft is pending,  After No modification allowed " )) {
            //         const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'D'};
            //         this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
            //             .subscribe((data: any) => {
            //                 this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
            //                 this.ISPRINT=data.Table[0].ISPRINT;
            //                 });
            //             }
            //             else
            //             {return false}
            //     }
            // else if (this.DRAFTPRINT=="1"){ 
            //     if (confirm(" Are you sure want to take the Draft, You have  2 draft is pending,  After No modification allowed " )) {
            //         const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'D'};
            //         this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
            //             .subscribe((data: any) => {
            //                 this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
            //                 this.ISPRINT=data.Table[0].ISPRINT;
            //                 });
            //             }
            //             else
            //             {return false}
            // }
            // else 
            if (parseInt(this.DRAFTPRINT)<=9){  
                let printfraft ;
                printfraft= 10 -parseInt(this.DRAFTPRINT) 
            if (confirm(" Are you sure want to take the Draft, You have  "+printfraft+" draft is pending,  After No modification allowed" )) {
                const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'D'};
                this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
                    .subscribe((data: any) => {
                        this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
                        this.ISPRINT=data.Table[0].ISPRINT;
                        });
                    }
                    else
                    {return false}
            }           
      
        //let URL = "http://manilal.com/erp/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
        let URL = "http://180.179.207.163/linkserp-ac/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
                "huhpnk=" + this._loginService.getLogin()[0].GUID
                + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
                + "&Userid=" + this._loginService.getLogin()[0].CMPID
                + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
                + "&FCR=" +   this.FCRNO   
                + "&HBLType="+ this.HBLTYPE_ACT
                + "&CurLogInIP=" + environment.edocumentIp
                + "&Iswatermark=" + this.watermarkval
                window.open(URL, "_blank");
              }
              this.buttonStatus = false;
    }
    Print() {
        this.buttonStatus = true;
        this._fcrHbltypesharedvataSerice = this._fcrsharedvataSerice.fcrHbltypesharedData;
        this._fcrsharedvataSerice.fcrsharedData = this._fcrsharedvataSerice.fcrsharedData;
        this._fcrhblprinttype.fcrhblprinttype=this.ISPRINT;

        // this._router.navigate(['/export/fcr/sea-bl-print']);
        // this.buttonStatus = false;
        if(this.SAILING_DT ==""){
            this._toasterService.toast('warning', 'warning', "You cannot take  final print, Vessel sailing date not entered ! ");
            return false;
        }
        
        if (this.ISPRINT=="")
        {
          if (confirm("Are you sure want to take print out ,Once take print you cannot do any modification  " )) {
          const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'P'};
          this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
              .subscribe((data: any) => {
                  this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
                  this.ISPRINT=data.Table[0].ISPRINT;
                  }); 
              }
              else
              {return false}
         }         
        
            //   if (this._loginService.getLogin()[0].CMPCODE=='01' || this._loginService.getLogin()[0].CMPCODE=='02') 
            //   {
                  //let URL = "http://manilal.com/erp/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
                  let URL = "http://180.179.207.163/linkserp-ac/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
                  "huhpnk=" + this._loginService.getLogin()[0].GUID
                  + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
                  + "&Userid=" + this._loginService.getLogin()[0].CMPID
                  + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
                  + "&FCR=" +   this.FCRNO   
                  + "&HBLType="+ this.HBLTYPE_ACT
                  + "&CurLogInIP=" + environment.edocumentIp
                  + "&Iswatermark=" + this.watermarkval
                  window.open(URL, "_blank");
                  this.buttonStatus = false;
              //}
            //   else{
  
            //       this._router.navigate(['/export/fcr/sea-bl-print']);
            //       this.buttonStatus = false;
            //       }            
          
      }
    
} 

@Component({
    selector: 'app-mto-printview',
    // templateUrl: 'exp_prt_fcr_printview.component.html'
    template: `
    @if (loadError) {
      <div class="card sec">
        <div class="state">
          <h3>This document could not be loaded</h3>
          <p>{{ loadError }}</p>
        </div>
      </div>
    } @else if (!loaded) {
      <div class="card sec">
        <div class="state"><h3>Loading document...</h3><p>Fetching the MTO details.</p></div>
      </div>
    } @else {

      <div class="card sec">
        <div class="switch-note">
          <span>{{IsSwitchtext}}</span>
          <a href="javascript:void(0);" (click)="fcrrout(SwitchFCR);"><b>{{SwitchFCR}}</b></a>
        </div>
      </div>

      <div class="card sec">
        <div class="card-h"><h2>Document</h2><span class="meta">Reference numbers</span></div>
        <div class="fields">
          <div class="fld">
            <label for="fcrno">BL / MTD no.</label>
            <input type="text" id="fcrno" name="fcrno" class="mono" maxlength="15" [(ngModel)]="FCRNO" readonly>
          </div>
          <div class="fld">
            <label for="bookingno">Booking no.</label>
            <input type="text" id="bookingno" name="bookingno" maxlength="10">
          </div>
          <div class="fld full tall">
            <label for="sexptno">Shipment ref no.</label>
            <textarea id="sexptno" name="sexptno" rows="2" [(ngModel)]="EXPNO"></textarea>
          </div>
        </div>
      </div>

      <div class="card sec">
        <div class="card-h"><h2>Parties</h2><span class="meta">Names and full addresses</span></div>
        <div class="fields">
          <div class="fld full tall">
            <label for="shipper">Shipper</label>
            <textarea id="shipper" name="shipper" rows="4" [(ngModel)]="SHIPPER"></textarea>
          </div>
          <div class="fld full tall">
            <label for="consignee">Consignee</label>
            <textarea id="consignee" name="consignee" rows="4" [(ngModel)]="CONSIGNEE"></textarea>
          </div>
          <div class="fld full tall">
            <label for="notify">Notify address</label>
            <textarea id="notify" name="notify" rows="4" [(ngModel)]="NOTIFYPARTY"></textarea>
          </div>
        </div>
      </div>

      <div class="card sec">
        <div class="card-h"><h2>Routing</h2><span class="meta">Places and mode of transport</span></div>
        <div class="fields">
          <div class="fld">
            <label for="carriage">Place of receipt</label>
            <input type="text" id="carriage" name="carriage" maxlength="50" [(ngModel)]="CARRIER">
          </div>
          <div class="fld">
            <label for="receipt">Place of loading</label>
            <input type="text" id="receipt" name="receipt" maxlength="50" [(ngModel)]="RECPTPLACE">
          </div>
          <div class="fld">
            <label for="discharge">Port of delivery</label>
            <input type="text" id="discharge" name="discharge" maxlength="50" [(ngModel)]="POD">
          </div>
          <div class="fld">
            <label for="delivery">Place of delivery</label>
            <input type="text" id="delivery" name="delivery" maxlength="50" [(ngModel)]="PODEL">
          </div>
          <div class="fld full">
            <label for="vessel">Mode of transport</label>
            <input type="text" id="vessel" name="vessel" maxlength="50" [(ngModel)]="VESSEL">
          </div>
        </div>
      </div>

      <div class="card sec">
        <div class="card-h"><h2>Cargo</h2><span class="meta">Printed as typed - columns stay aligned</span></div>
        <div class="fields">
          <div class="fld full tall">
            <label for="marks">Container no.</label>
            <textarea id="marks" name="marks" class="mono" rows="5" [(ngModel)]="MARKSANDNOS"></textarea>
          </div>
          <div class="fld full tall">
            <label for="pkgs">Marks &amp; numbers</label>
            <textarea id="pkgs" name="pkgs" class="mono" rows="5" [(ngModel)]="NOOFPKGS"></textarea>
          </div>
          <div class="fld full tall">
            <label for="desc">No. and kind of packages, description of goods</label>
            <textarea id="desc" name="desc" class="mono" rows="6" [(ngModel)]="ITCDESC"></textarea>
          </div>
          <div class="fld full tall">
            <label for="grwt">Gross weight</label>
            <textarea id="grwt" name="grwt" class="mono" rows="4" [(ngModel)]="GRWT"></textarea>
          </div>
          <div class="fld full tall">
            <label for="cbm">Measurement</label>
            <textarea id="cbm" name="cbm" class="mono" rows="4" [(ngModel)]="VOL"></textarea>
          </div>
          <div class="fld full tall">
            <label for="rider">Goods description (rider)</label>
            <textarea id="rider" name="rider" class="mono" rows="4" [(ngModel)]="Rider"></textarea>
          </div>
        </div>
      </div>

      <div class="card sec">
        <div class="card-h"><h2>Freight &amp; charges</h2><span class="meta">Amounts and originals</span></div>
        <div class="fields">
          <div class="fld full tall">
            <label for="freight">Freight amount</label>
            <textarea id="freight" name="freight" class="mono" rows="3" [(ngModel)]="MISC"></textarea>
          </div>
          <div class="fld full tall">
            <label for="prepaid">Freight payable at</label>
            <textarea id="prepaid" name="prepaid" class="mono" rows="3" [(ngModel)]="PP"></textarea>
          </div>
          <div class="fld full tall">
            <label for="collect">No. of original BL / MTD(s)</label>
            <textarea id="collect" name="collect" class="mono" rows="3" [(ngModel)]="CC"></textarea>
          </div>
        </div>
      </div>

      <div class="card sec">
        <div class="card-h"><h2>Issue details</h2><span class="meta">Printed at the foot of the document</span></div>
        <div class="fields">
          <div class="fld full">
            <label for="placedt">Place &amp; date of issue</label>
            <input type="text" id="placedt" name="placedt" maxlength="50" [(ngModel)]="PLACEDATE">
          </div>
          <div class="fld full tall">
            <label for="others">Other particulars (if any)</label>
            <textarea id="others" name="others" rows="4" [(ngModel)]="APPLYTO"></textarea>
          </div>
        </div>
      </div>

    }
`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ExptMTOprintview implements OnChanges {
   // private baseUrl: string = 'Export/Export_FCR_PRINTPREVIEW';
    @Input() hbltype: string;

    HBLTYPE_ACT: string="";
    SHIPPER: any = "";
    CONSIGNEE: any = "";
    NOTIFYPARTY: any = "";
    FCRNO: any = "";
    FCRDT: any = "";
    APPLYTO: any = "";
    CARRIER: any = "";
    RECPTPLACE: any = "";
    VESSEL: any = "";
    POL: any = "";
    POD: any = "";
    PODEL: any = "";
    APPLYTO1: any = "";
    MARKSANDNOS: any = "";

    NOOFPKGS: any = "";
    ITCDESC: any = "";
    GRWT: any = "";
    VOL: any = "";
    MISC: any = "";
    PP: any = "";
    CC: any = "";
    TOTPP: any = "";
    TOTCC: any = "";
    PLACEDATE: any = "";
    EXPNO: any = "";

    Bltype: any = "";
    FCRDET: any;
    buttonStatus = false;
    ISPRINT:string="";
    DRAFTPRINT :string="";
    Rider: string="";
    SwitchFCR :string="";
    public draftvisible  =false;
    IsSwitch :string="";
    IsSwitchtext:string="";
    SAILING_DT: string="";
    expressbill:boolean=false;
    printmsg:string="";
   expressbillval:string=""
   WaterMarkoption:boolean=false;
   watermarkval:string="0";
    /** Presentation (from MPERPNG-20): true once Export_FCR_PRINTPREVIEW has filled the form */
    loaded:boolean=false;
    /** set when the record could not be loaded; shown instead of the form */
    loadError:string="";
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _fcrsharedvataSerice: FcrSharedDataService,
        private _fcrHbltypesharedvataSerice: FcrSharedDataService,
        private _fcrhblprinttype: FcrSharedDataService,
        private _fcrdraftvisible :FcrSharedDataService,
        private loaderService: LoaderService,) {
    }
    fcrrout(FCRNo){
        if( confirm("Are you sure you want move to "+this.IsSwitchtext +" ?") )  {   
        this._fcrsharedvataSerice.fcrsharedData = FCRNo;     
        this.ngOnChanges();  
        }
        else {return false}  
      //  this._router.navigate(['/export/fcr/sea-bl-print-view']);  
    }
    checkValue(event: any){
        console.log(event);
        if(event.target.checked)
        {
        this.expressbill=true
          }
        else
        {
            this.expressbill=false
        }
     }
     getwatermarkvalue(event: any){

        if(event.target.checked)
        {
        this.WaterMarkoption=true
        this.watermarkval="1"
          }
        else
        {
            this.WaterMarkoption=false
            this.watermarkval="0"
        }
     }
    ngOnChanges()
    {
        this.loaded = false;
        this.loadError = "";
        if (!this._fcrsharedvataSerice.fcrsharedData) {
            this.loadError = "No document number was carried over from the House B/L screen.";
            this.loaderService.display(false);
            return;
        }
        this.loaderService.display(true);
     //   console.log("MTO NO. "+this._fcrsharedvataSerice.fcrsharedData); 
        const jsonExport = { FCRNO: this._fcrsharedvataSerice.fcrsharedData };//'GOA106180004'
        this._dataService.Common("Export/Export_FCR_PRINTPREVIEW", jsonExport)
            .subscribe((data: any) => {
                const first = (data && data.Table && data.Table.length) ? data.Table[0] : null;
                if (first && first.STATUS == 100) {
                    this.FCRDET = data.Table;

                    this.SHIPPER = this.FCRDET[0].SHIPPER;
                    this.CONSIGNEE = this.FCRDET[0].CONSIGNEE;
                    this.NOTIFYPARTY = this.FCRDET[0].NOTIFYPARTY;
                    this.FCRNO = this.FCRDET[0].FCRNO;
                    this.FCRDT = this.FCRDET[0].FCRDT;
                    this.APPLYTO = this.FCRDET[0].APPLYTO;
                    this.CARRIER = this.FCRDET[0].CARRIER;
                    this.RECPTPLACE = this.FCRDET[0].RECPTPLACE;
                    this.VESSEL = this.FCRDET[0].VESSEL;
                    this.POL = this.FCRDET[0].POL;
                    this.POD = this.FCRDET[0].POD;
                    this.PODEL = this.FCRDET[0].PODEL;
                    this.APPLYTO1 = this.FCRDET[0].APPLYTO;
                    this.MARKSANDNOS = this.FCRDET[0].MARKSANDNOS;
                    this.NOOFPKGS = this.FCRDET[0].NOOFPKGS;
                    this.ITCDESC = this.FCRDET[0].ITCDESC;
                    this.GRWT = this.FCRDET[0].GRWT;
                    this.VOL = this.FCRDET[0].VOL;
                    this.MISC = this.FCRDET[0].MISC;
                    this.PP = this.FCRDET[0].PP;
                    this.CC = this.FCRDET[0].CC;
                    this.TOTPP = this.FCRDET[0].TOTPP;
                    this.TOTCC = this.FCRDET[0].TOTCC;
                    this.PLACEDATE = this.FCRDET[0].PLACEDATE;
                    this.EXPNO = this.FCRDET[0].EXPNO;
                    this.ISPRINT=this.FCRDET[0].ISPRINT;
                    this.HBLTYPE_ACT=this.FCRDET[0].HBLTYPE;
                    this.DRAFTPRINT=this.FCRDET[0].DRAFTPRINT;
                    this.Rider=this.FCRDET[0].Rider;
                    this.SwitchFCR=this.FCRDET[0].SWITCHBL;
                    this.IsSwitch=this.FCRDET[0].ISSWITCHBL;
                    this.SAILING_DT=this.FCRDET[0].SAILING;
                    if(this.IsSwitch=='1'){
                        this.IsSwitchtext="Switch BL MTO NO.: ";
                    }
                    else{ this.IsSwitchtext="Original MTO No.: " ;               }

                    this.loaded = true;
                    this._toasterService.toast('info', 'Complete', 'Data filled successfully');
                    this.loaderService.display(false);
                } else {

                    this.loadError = (first && first.STATUSTEXT) || "The document could not be loaded.";
                    this._toasterService.toast('error', 'Error', this.loadError);
                    this.loaderService.display(false);
                }

            },
            (error) => {
                this.loadError = "The document could not be loaded (" + (error && error.status) + ").";
                this.loaderService.display(false);
            });
    }
   
    
    printUpdate() {
        this.buttonStatus = true;
        
        if  (this.ISPRINT=="1")
        {
            this._toasterService.toast('warning', 'warning', "You can`t update ,Print already taken ");
            
        }
        else if  (this.DRAFTPRINT=="10")
        {
            this._toasterService.toast('warning', 'warning', "You can`t update ,Draft already taken 10 times");
            
        }
        else
        {
        this.loaderService.display(true); 
    
        const jsonExportUP = { SHIPPER: this.SHIPPER, CONSIGNEE: this.CONSIGNEE, NOTIFYPARTY: this.NOTIFYPARTY, CARRIER: this.CARRIER, APPLYTO: this.APPLYTO, VESSEL: this.VESSEL, POL: this.POL, POD: this.POD, PODEL: this.PODEL, MARKSANDNOS: this.MARKSANDNOS, NOOFPKGS: this.NOOFPKGS, ITCDESC: this.ITCDESC, GRWT: this.GRWT, VOL: this.VOL, MISC: this.MISC, PLACEDATE: this.PLACEDATE, PP: this.PP, CC: this.CC, TOTPP: this.TOTPP, TOTCC: this.TOTPP, RECPTPLACE: this.RECPTPLACE, EXPNO: this.EXPNO, FCRNo: this.FCRNO ,UERNAME:this._loginService.getLogin()[0].CMPID, CITYCODE :this._loginService.getLogin()[0].CITYCODE,rider:this.Rider };
        this._dataService.Common("Export/Export_FCR_PRINTUPDATE", jsonExportUP)
            .subscribe((data: any) => {

                if (data.Table[0].STATUS == "100") {
                    this.FCRDET = data.Table1;

                    this.SHIPPER = this.FCRDET[0].SHIPPER;
                    this.CONSIGNEE = this.FCRDET[0].CONSIGNEE;
                    this.NOTIFYPARTY = this.FCRDET[0].NOTIFYPARTY;
                    this.FCRNO = this.FCRDET[0].FCRNO;
                    this.FCRDT = this.FCRDET[0].FCRDT;
                    this.APPLYTO = this.FCRDET[0].APPLYTO;
                    this.CARRIER = this.FCRDET[0].CARRIER;
                    this.RECPTPLACE = this.FCRDET[0].RECPTPLACE;
                    this.VESSEL = this.FCRDET[0].VESSEL;
                    this.POL = this.FCRDET[0].POL;
                    this.POD = this.FCRDET[0].POD;
                    this.PODEL = this.FCRDET[0].PODEL;
                    this.APPLYTO1 = this.FCRDET[0].APPLYTO;
                    this.MARKSANDNOS = this.FCRDET[0].MARKSANDNOS;
                    this.NOOFPKGS = this.FCRDET[0].NOOFPKGS;
                    this.ITCDESC = this.FCRDET[0].ITCDESC;
                    this.GRWT = this.FCRDET[0].GRWT;
                    this.VOL = this.FCRDET[0].VOL;
                    this.MISC = this.FCRDET[0].MISC;
                    this.PP = this.FCRDET[0].PP;
                    this.CC = this.FCRDET[0].CC;
                    this.TOTPP = this.FCRDET[0].TOTPP;
                    this.TOTCC = this.FCRDET[0].TOTCC;
                    this.PLACEDATE = this.FCRDET[0].PLACEDATE;
                    this.EXPNO = this.FCRDET[0].EXPNO
                    this.HBLTYPE_ACT=this.FCRDET[0].HBLTYPE;
                    this._toasterService.toast('info', 'Complete', "Update successfully ");
                    this.loaderService.display(false); 
                } else {

                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                    this.loaderService.display(false); 
                }
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                this.loaderService.display(false); 
            },
            () => {
            });
        this.buttonStatus = false;
        }
    }
    printDraft()
    {
        if(this.expressbill==true){
            alert('Please uncheck the express bill as you are taking draft print');
            return false;

        }
        if  (this.DRAFTPRINT=="10")
        {
            this._toasterService.toast('warning', 'warning', "You cannot take more than 10 draft ");
            
        }
        else
        {
            this.buttonStatus = true;
        if (this.DRAFTPRINT=="0" ){ 
            if (confirm(" Are you sure want to take the Draft, You have  10 draft is pending,  After No modification allowed " )) {
                const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'D'};
                this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
                    .subscribe((data: any) => {
                        this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
                        this.ISPRINT=data.Table[0].ISPRINT;
                        });
                    }
                    else
                    {return false}
            }
            // else if (this.DRAFTPRINT=="1"){ 
            // if (confirm(" Are you sure want to take the Draft, You have  2 draft is pending,  After No modification allowed" )) {
            //     const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'D'};
            //     this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
            //         .subscribe((data: any) => {
            //             this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
            //             this.ISPRINT=data.Table[0].ISPRINT;
            //             });
            //         }
            //         else
            //         {return false}
            // }
            // else  
            if (parseInt(this.DRAFTPRINT)<=9){  
                let printfraft ;
                printfraft= 10 -parseInt(this.DRAFTPRINT) 
            if (confirm("Are you sure want to take Draft  ,You have " +printfraft+" draft is pending , modification allowed " )) {
            const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'D'};
            this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
                .subscribe((data: any) => {
                    this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
                    this.ISPRINT=data.Table[0].ISPRINT;
                    });
                }
                else
                {return false}
        }
       // let URL = "http://manilal.com/erp/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
        
        let URL = "http://180.179.207.163/linkserp-ac/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
                "huhpnk=" + this._loginService.getLogin()[0].GUID
                + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
                + "&Userid=" + this._loginService.getLogin()[0].CMPID
                + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
                + "&FCR=" +   this.FCRNO   
                + "&HBLType="+ this.HBLTYPE_ACT
                + "&CurLogInIP=" + environment.edocumentIp
                + "&Iswatermark=" + this.watermarkval
                window.open(URL, "_blank");
                
    }
    this.buttonStatus = false;
    }
    Print() {
        this.buttonStatus = true;
        this._fcrHbltypesharedvataSerice = this._fcrsharedvataSerice.fcrHbltypesharedData;
        this._fcrsharedvataSerice.fcrsharedData = this._fcrsharedvataSerice.fcrsharedData;
        this._fcrhblprinttype.fcrhblprinttype=this.ISPRINT;

        // this._router.navigate(['/export/fcr/sea-bl-print']);
        // this.buttonStatus = false;
        if(this.SAILING_DT ==""){
            this._toasterService.toast('warning', 'warning', "You cannot take  final print, Vessel sailing date not entered ! ");
            return false;
        }

        if (this.ISPRINT=="" || this.ISPRINT=="1" || this.ISPRINT=="2")
        {
          //if (confirm("Are you sure want to take print out ,Once take print you cannot do any modification  " )) {
            if(this.expressbill==false)
            {this.printmsg="Are u sure want to take the original print,Once take print you cannot do any modification "}
            if(this.expressbill==true)
            {this.printmsg="Are u sure want to take the nonnegotiable print,Once take print you cannot do any modification "}
           if (confirm(this.printmsg))
           {
          const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,
            Type: (this.expressbill==false ?'P':'N')};
          this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
              .subscribe((data: any) => {
                  this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
                  this.ISPRINT=data.Table[0].ISPRINT;
                  });
                }
                else
                {return false}
            }
                // else
                // {return false}
                //             }


                  let URL = "http://180.179.207.163//linkserp-ac/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
                  "huhpnk=" + this._loginService.getLogin()[0].GUID
                  + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
                  + "&Userid=" + this._loginService.getLogin()[0].CMPID
                  + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
                  + "&FCR=" +   this.FCRNO
                  + "&HBLType="+ this.HBLTYPE_ACT
                  + "&CurLogInIP=" + environment.edocumentIp
                  + "&Iswatermark=" + this.watermarkval
                  window.open(URL, "_blank");
                  this.buttonStatus = false;
      }
    // Print() {
    //         this.buttonStatus = true;

    //         this._fcrHbltypesharedvataSerice = this._fcrsharedvataSerice.fcrHbltypesharedData;
    //         this._fcrsharedvataSerice.fcrsharedData = this._fcrsharedvataSerice.fcrsharedData;
    //         if(this.SAILING_DT ==""){
    //             this._toasterService.toast('warning', 'warning', "You cannot take  final print, Vessel sailing date not entered ! ");
    //             return false;
    //         }

    //         if (this.ISPRINT=="")
    //         {
    //           if (confirm("Are you sure want to take print out ,Once take print you cannot do any modification  " )) {
    //           const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'P'};
    //           this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
    //               .subscribe((data: any) => {
    //                   this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
    //                   this.ISPRINT=data.Table[0].ISPRINT;
    //                   }); 
    //               }
    //          }         
            
             
    //                   let URL = "http://180.179.207.163/linkserp-ac/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
    //                   "huhpnk=" + this._loginService.getLogin()[0].GUID
    //                   + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
    //                   + "&Userid=" + this._loginService.getLogin()[0].CMPID
    //                   + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
    //                   + "&FCR=" +   this.FCRNO   
    //                   + "&HBLType="+ this.HBLTYPE_ACT
    //                   + "&CurLogInIP=" + environment.edocumentIp
    //                   window.open(URL, "_blank");
    //                   this.buttonStatus = false;
              
    //       }
      
  

}


@Component({
    selector: 'app-printview',
    templateUrl: 'exp_prt_fcr_printview.component.html',
    styleUrls: ['./fcr-form.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ExptPrintview implements OnInit {
    expressbill: boolean = false;   // header checkbox, bound in the template; checkValue passes it on
    Type: any = "";
    buttonStatus = false;
    ISPRINT :string="";
    WaterMarkoption:boolean=false;
    watermarkval:string="0";
    /** Presentation (from MPERPNG-20): document number carried over from the House B/L screen - header only */
    DocNo: string = "";
    pageTitle: string = "House B/L";
    typeLabel: string = "";
    @ViewChild(ExptFCRPrintview, {static: false}) public viewFCR: ExptFCRPrintview;
    @ViewChild(ExptMTOprintview, {static: false}) public viewMTO: ExptMTOprintview;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _fcrsharedvataSerice: FcrSharedDataService,
        private _fcrhblprinttype: FcrSharedDataService,
        private _fcrHbltypesharedvataSerice: FcrSharedDataService) {
    }
    ngOnInit(): void {
        this.Type = this._fcrsharedvataSerice.fcrHbltypesharedData;//'M';
        this.ISPRINT= this._fcrhblprinttype.fcrhblprinttype;
        this.DocNo = this._fcrsharedvataSerice.fcrsharedData ? String(this._fcrsharedvataSerice.fcrsharedData) : "";
        if (this.Type == "M") { this.pageTitle = "MTO / Multimodal B/L"; this.typeLabel = "Multimodal"; }
        else if (this.Type == "H") { this.pageTitle = "House B/L"; this.typeLabel = "House B/L"; }
        else if (this.Type == "F") { this.pageTitle = "FCR / House B/L"; this.typeLabel = "FCR"; }
        else { this.pageTitle = "House B/L print"; this.typeLabel = ""; }
    }

    /** Presentation: the action bar stays disabled until the editor below has loaded its record */
    get docLoaded(): boolean {
        return !!((this.viewFCR && this.viewFCR.loaded) || (this.viewMTO && this.viewMTO.loaded));
    }

    /** empty state: nothing was carried over from the House B/L screen */
    goToForm() {
        this._router.navigate(['/export/fcr/form']);
    }

    checkValue(event: any){

        if (this.Type == "F") {
            this.viewFCR.checkValue(event)}
        else if (this.Type == "H") {
            this.viewFCR.checkValue(event)
        }
        else {
            this.viewMTO.checkValue(event)
        }
     }

    printUpdate() {
        if (this.Type == "F") {
            this.viewFCR.printUpdate();
        }
        else if (this.Type == "H") {
            this.viewFCR.printUpdate();
        }
        else {
            this.viewMTO.printUpdate();
        }
    }
    getwatermarkvalue(event: any){
        if (this.Type == "F") {
            this.viewFCR.getwatermarkvalue(event)}
        else if (this.Type == "H") {
            this.viewFCR.getwatermarkvalue(event)
        }
        else {
            this.viewMTO.getwatermarkvalue(event)
        }        // console.log(event);
    }
    Print() {
        if (this.Type == "F") {
           // this.viewFCR.WaterMarkoption=this.WaterMarkoption
            this.viewFCR.Print();
        }
        else if (this.Type == "H") {
            //this.viewFCR.WaterMarkoption=this.WaterMarkoption
            this.viewFCR.Print();
        }
        else {
           // this.viewMTO.WaterMarkoption=this.WaterMarkoption
            this.viewMTO.Print();
        }
    }

    Printdraft()
    {
        if (this.Type == "F") {
            this.viewFCR.printDraft();
        }
        else if (this.Type == "H") {
            this.viewFCR.printDraft();
        }
        else {
            this.viewMTO.printDraft();
        }
    }
  }

        
    
