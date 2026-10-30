
import {
    Component, OnInit, Input, Output, EventEmitter, ViewChild, OnChanges, OnDestroy, ChangeDetectionStrategy,
    ChangeDetectorRef, ElementRef, HostListener
} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router} from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { FcrSharedDataService } from '../export-share-data.service';
import { LoaderService } from '../../shared/service/loader.service';
import { environment } from   '../../../environments/environment';
import { countPrintedLines, DESC_FIT_LINES, splitAtPrintedLine } from './mtd-description-format';
import {
    MtdSheetData, MtdStamp, openMtdPrintWindow, pickSheetData, sameSheetData, sheetText, shippedOnBoardDate
} from './mtd-sheet';
import { MtdSheetComponent } from './mtd-sheet.component';

/* ---- MTO layout B: form sections and the A4 preview ---- */
type MtoSection = 'doc' | 'parties' | 'routing' | 'cargo' | 'freight' | 'issue';
/** form field id -> its section (the ids are also the data-f keys of the boxes on the print sheet) */
const MTO_FIELD_SECTION: { [id: string]: MtoSection } = {
    fcrno: 'doc', bookingno: 'doc', sexptno: 'doc',
    shipper: 'parties', consignee: 'parties', notify: 'parties',
    carriage: 'routing', receipt: 'routing', discharge: 'routing', delivery: 'routing', vessel: 'routing',
    marks: 'cargo', pkgs: 'cargo', desc: 'cargo', grwt: 'cargo', cbm: 'cargo', rider: 'cargo',
    freight: 'freight', prepaid: 'freight', collect: 'freight',
    placedt: 'issue', others: 'issue'
};
/** the A4 sheet in CSS px */
const MTD_PAGE_W = 794;
const MTD_PAGE_H = 1123;
/** smallest preview zoom used to fit the whole page in the visible height; below it the panel scrolls */
const MTD_MIN_SCALE = 0.6;
/** preview splitter: narrowest preview, width below which a drag folds it to a rail, room kept for the form */
const MTO_PREV_MIN = 280;
const MTO_PREV_HIDE = 180;
const MTO_FORM_MIN = 380;
const MTO_SPLIT_KEY = 'links_mto_preview_split';

/** first non-blank line, trimmed and shortened, for a collapsed section's summary */
function firstLine(v: any): string {
    const line = sheetText(v).split('\n').map(l => l.trim()).find(l => l !== '') || '';
    return line.length > 48 ? line.slice(0, 47) + '…' : line;
}

function joinSummary(parts: string[]): string {
    return parts.filter(p => !!p).join(' · ');
}
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
            <app-desc-field [text]="ITCDESC">
              <textarea id="desc" name="desc" class="mono" rows="6" [(ngModel)]="ITCDESC"></textarea>
            </app-desc-field>
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
    // Layout B (approved redesign): the form in collapsible sections beside a live A4 preview of the MTD print.
    // Every input keeps its id / name / [(ngModel)]; the print options and actions moved here from the host bar.
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
    <div class="mto-b" #split [class.sized]="prevW !== null && !previewHidden" [class.prev-hidden]="previewHidden"
         [style.--mto-prev-w]="prevW !== null ? prevW + 'px' : null">

      <div class="mto-form" (focusin)="onFormFocus($event)" (focusout)="onFormBlur()">

        @if (previewHidden) {
          <div class="pbar pbar-top"><ng-container *ngTemplateOutlet="pbarTpl"></ng-container></div>
        }

        <div class="card sec">
          <div class="switch-note">
            <span>{{IsSwitchtext}}</span>
            <a href="javascript:void(0);" (click)="fcrrout(SwitchFCR);"><b>{{SwitchFCR}}</b></a>
          </div>
        </div>

        <section class="card sec msec" [class.open]="open.doc">
          <button type="button" class="msec-h" aria-controls="mto-s-doc" [attr.aria-expanded]="open.doc" (click)="toggleSec('doc')">
            <i aria-hidden="true"></i><b>Document</b><span>{{ sumDoc }}</span>
          </button>
          <div class="msec-b" id="mto-s-doc">
            <div class="mf">
              <label for="fcrno">BL / MTD no.</label>
              <input type="text" id="fcrno" name="fcrno" class="mono" maxlength="15" [(ngModel)]="FCRNO" readonly>
            </div>
            <div class="mf">
              <label for="bookingno">Booking no.</label>
              <input type="text" id="bookingno" name="bookingno" maxlength="10">
            </div>
            <div class="mf full">
              <label for="sexptno">Shipment ref no.</label>
              <textarea id="sexptno" name="sexptno" rows="2" [(ngModel)]="EXPNO"></textarea>
            </div>
          </div>
        </section>

        <section class="card sec msec" [class.open]="open.parties">
          <button type="button" class="msec-h" aria-controls="mto-s-parties" [attr.aria-expanded]="open.parties" (click)="toggleSec('parties')">
            <i aria-hidden="true"></i><b>Parties</b><span>{{ sumParties }}</span>
          </button>
          <div class="msec-b" id="mto-s-parties">
            <div class="mf full">
              <label for="shipper">Shipper / consignor</label>
              <textarea id="shipper" name="shipper" rows="5" [(ngModel)]="SHIPPER"></textarea>
            </div>
            <div class="mf full">
              <label for="consignee">Consignee (or order)</label>
              <textarea id="consignee" name="consignee" rows="4" [(ngModel)]="CONSIGNEE"></textarea>
            </div>
            <div class="mf full">
              <label for="notify">Notify address</label>
              <textarea id="notify" name="notify" rows="4" [(ngModel)]="NOTIFYPARTY"></textarea>
            </div>
          </div>
        </section>

        <section class="card sec msec" [class.open]="open.routing">
          <button type="button" class="msec-h" aria-controls="mto-s-routing" [attr.aria-expanded]="open.routing" (click)="toggleSec('routing')">
            <i aria-hidden="true"></i><b>Routing</b><span>{{ sumRouting }}</span>
          </button>
          <div class="msec-b" id="mto-s-routing">
            <div class="mf">
              <label for="carriage">Place of receipt</label>
              <input type="text" id="carriage" name="carriage" maxlength="50" [(ngModel)]="CARRIER">
            </div>
            <div class="mf">
              <label for="receipt">Port of loading</label>
              <input type="text" id="receipt" name="receipt" maxlength="50" [(ngModel)]="RECPTPLACE">
            </div>
            <div class="mf">
              <label for="discharge">Port of discharge</label>
              <input type="text" id="discharge" name="discharge" maxlength="50" [(ngModel)]="POD">
            </div>
            <div class="mf">
              <label for="delivery">Place of delivery</label>
              <input type="text" id="delivery" name="delivery" maxlength="50" [(ngModel)]="PODEL">
            </div>
            <div class="mf full">
              <label for="vessel">Vessel / voyage no.</label>
              <input type="text" id="vessel" name="vessel" maxlength="50" [(ngModel)]="VESSEL">
            </div>
          </div>
        </section>

        <section class="card sec msec" [class.open]="open.cargo">
          <button type="button" class="msec-h" aria-controls="mto-s-cargo" [attr.aria-expanded]="open.cargo" (click)="toggleSec('cargo')">
            <i aria-hidden="true"></i><b>Cargo</b><span>{{ sumCargo }}</span>
          </button>
          <div class="msec-b" id="mto-s-cargo">
            <div class="mf">
              <label for="marks">Container no.</label>
              <textarea id="marks" name="marks" class="mono" rows="5" [(ngModel)]="MARKSANDNOS"></textarea>
            </div>
            <div class="mf">
              <label for="pkgs">Marks &amp; numbers</label>
              <textarea id="pkgs" name="pkgs" class="mono" rows="5" [(ngModel)]="NOOFPKGS"></textarea>
            </div>
            <div class="mf full">
              <label for="desc">No. and kind of packages, description of goods</label>
              <app-desc-field [text]="ITCDESC" [riderMove]="true" (moveToRider)="moveDescToRider()">
                <textarea id="desc" name="desc" class="mono" rows="12" [(ngModel)]="ITCDESC"></textarea>
              </app-desc-field>
            </div>
            <div class="mf">
              <label for="grwt">Gross weight</label>
              <textarea id="grwt" name="grwt" class="mono" rows="4" [(ngModel)]="GRWT"></textarea>
            </div>
            <div class="mf">
              <label for="cbm">Measurement</label>
              <textarea id="cbm" name="cbm" class="mono" rows="4" [(ngModel)]="VOL"></textarea>
            </div>
            <div class="mf full">
              <label for="rider">Rider / attached sheet (printed on page 2)</label>
              <textarea id="rider" name="rider" class="mono" rows="4" [(ngModel)]="Rider"></textarea>
            </div>
          </div>
        </section>

        <section class="card sec msec" [class.open]="open.freight">
          <button type="button" class="msec-h" aria-controls="mto-s-freight" [attr.aria-expanded]="open.freight" (click)="toggleSec('freight')">
            <i aria-hidden="true"></i><b>Freight &amp; charges</b><span>{{ sumFreight }}</span>
          </button>
          <div class="msec-b" id="mto-s-freight">
            <div class="mf full">
              <label for="freight">Freight amount</label>
              <textarea id="freight" name="freight" class="mono" rows="2" [(ngModel)]="MISC"></textarea>
            </div>
            <div class="mf">
              <label for="prepaid">Freight payable at</label>
              <textarea id="prepaid" name="prepaid" class="mono" rows="2" [(ngModel)]="PP"></textarea>
            </div>
            <div class="mf">
              <label for="collect">No. of original BL / MTD(s)</label>
              <textarea id="collect" name="collect" class="mono" rows="2" [(ngModel)]="CC"></textarea>
            </div>
          </div>
        </section>

        <section class="card sec msec" [class.open]="open.issue">
          <button type="button" class="msec-h" aria-controls="mto-s-issue" [attr.aria-expanded]="open.issue" (click)="toggleSec('issue')">
            <i aria-hidden="true"></i><b>Issue details</b><span>{{ sumIssue }}</span>
          </button>
          <div class="msec-b" id="mto-s-issue">
            <div class="mf full">
              <label for="placedt">Place &amp; date of issue</label>
              <input type="text" id="placedt" name="placedt" maxlength="50" [(ngModel)]="PLACEDATE">
            </div>
            <div class="mf full">
              <label for="others">Other particulars / agent address</label>
              <textarea id="others" name="others" rows="5" [(ngModel)]="APPLYTO"></textarea>
            </div>
          </div>
        </section>
      </div>

      <div class="mto-split" role="separator" aria-orientation="vertical" tabindex="0"
           aria-label="Resize the print preview: drag, or use the arrow keys; Enter hides or shows it"
           [title]="previewHidden ? 'Drag left to show the print preview' : 'Drag to resize the print preview; drag right to hide it'"
           (pointerdown)="startSplit($event)" (keydown)="splitKey($event)" (dblclick)="togglePreview()"><span></span></div>

      @if (previewHidden) {
      <div class="mto-rail">
        <button type="button" (click)="showPreview()">Show print preview</button>
      </div>
      } @else {
      <div class="mto-prev">
        <div class="pbar"><ng-container *ngTemplateOutlet="pbarTpl"></ng-container></div>
        @if (unsaved) {
          <div class="pwarn" role="status">Unsaved changes. Print and Draft print use the last saved document: click Update first.</div>
        }
        @if (hasRider) {
          <div class="seg pages" role="group" aria-label="Page shown in the preview">
            <button type="button" [class.on]="page === 'main'" [attr.aria-pressed]="page === 'main'" (click)="page = 'main'">MTD</button>
            <button type="button" [class.on]="page === 'rider'" [attr.aria-pressed]="page === 'rider'" (click)="page = 'rider'">RIDER / ATTACHED SHEET</button>
          </div>
        }
        <div class="desk" #desk [style.max-height.px]="deskMaxH">
          <div class="scale" [style.width.px]="794 * scale" [style.height.px]="1123 * scale">
            <app-mtd-sheet [style.transform]="'scale(' + scale + ')'" [d]="sheetData" [cmpCode]="cmpCode"
                           [stamp]="stamp" [onBoard]="shippedOnBoard ? onBoardDate : ''" [watermark]="WaterMarkoption"
                           [hot]="hot" [show]="hasRider ? page : 'main'" [live]="true" (pick)="focusField($event)"></app-mtd-sheet>
          </div>
        </div>
        <p class="pnote">Select a box on the print to jump to its field; the field you are editing is outlined. Drag the bar on the left of this panel to resize it, or right to hide it.</p>
      </div>
      }

      <ng-template #pbarTpl>
          <div class="pbar-row">
            <span class="lbl" id="mto-stamp-lbl">Stamp</span>
            <div class="seg" role="group" aria-labelledby="mto-stamp-lbl">
              <button type="button" [class.on]="stamp === ''" [attr.aria-pressed]="stamp === ''" (click)="stamp = ''">NONE</button>
              <button type="button" [class.on]="stamp === 'ORIGINAL'" [attr.aria-pressed]="stamp === 'ORIGINAL'" (click)="stamp = 'ORIGINAL'">ORIGINAL</button>
              <button type="button" [class.on]="stamp === 'NON-NEGOTIABLE'" [attr.aria-pressed]="stamp === 'NON-NEGOTIABLE'" (click)="stamp = 'NON-NEGOTIABLE'">NON-NEGOTIABLE</button>
            </div>
            <label class="tg" title="Prints SHIPPED ON BOARD / DATE: with the date in Place and date of issue">
              <input type="checkbox" name="mtoshippedonboard" [(ngModel)]="shippedOnBoard">Shipped on board
            </label>
            @if (shippedOnBoard) {
              @if (onBoardDate) {
                <span class="tg-note">DATE: {{ onBoardDate }}</span>
              } @else {
                <span class="tg-note warn">No dd/mm/yyyy date in Place and date of issue: not printed</span>
              }
            }
          </div>
          <div class="pbar-row">
            <label class="tg">
              <input type="checkbox" name="mtoexpressbill" [(ngModel)]="expressbill" (change)="onExpressChange($event)">Express Bill
            </label>
            <label class="tg">
              <input type="checkbox" name="mtowatermark" [(ngModel)]="WaterMarkoption" (change)="onWatermarkChange($event)">With watermark
            </label>
            <span class="sp"></span>
            <button class="btn g" type="button" (click)="onUpdateClick()">Update</button>
            <button class="btn g" type="button" (click)="onDraftClick()">Draft print</button>
            <button class="btn p" type="button" (click)="onPrintClick()">Print</button>
          </div>
      </ng-template>

      <div class="print-src" aria-hidden="true">
        <app-mtd-sheet #printSheet [d]="saved" [cmpCode]="cmpCode" [stamp]="stamp"
                       [onBoard]="shippedOnBoard ? savedOnBoardDate : ''" [watermark]="WaterMarkoption"></app-mtd-sheet>
      </div>
    </div>
    }
`,
    styleUrls: ['./mto-layout.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ExptMTOprintview implements OnChanges, OnDestroy {
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

    /* ---- Layout B: actions bar (moved here from the host). Each goes through the host's handler
       (checkValue / getwatermarkvalue / printUpdate / Printdraft / Print) when the host listens. ---- */
    @Output() mtoExpress = new EventEmitter<Event>();
    @Output() mtoWatermark = new EventEmitter<Event>();
    @Output() mtoUpdate = new EventEmitter<void>();
    @Output() mtoDraft = new EventEmitter<void>();
    @Output() mtoPrint = new EventEmitter<void>();

    /* ---- Layout B: print options (print-only, never saved) ---- */
    /** ORIGINAL / NON-NEGOTIABLE text bottom-left of the cargo block; '' = none */
    stamp: MtdStamp = '';
    /** prints SHIPPED ON BOARD / DATE: <date in Place and date of issue> bottom-right of the cargo block */
    shippedOnBoard: boolean = true;

    /* ---- Layout B: form sections, preview ---- */
    open: { [k in MtoSection]: boolean } = { doc: false, parties: false, routing: false, cargo: true, freight: false, issue: false };
    /** id of the focused field: its box is outlined on the preview */
    hot: string = '';
    /** preview page when there is a rider */
    page: 'main' | 'rider' = 'main';
    /** preview zoom (A4 sheet scaled to fit the panel) */
    scale: number = 0.7;
    /** preview panel height limit while it sticks beside the form (null = none) */
    deskMaxH: number | null = null;
    /** the printed fields as last loaded / saved: Print and Draft print print these (as the old report read the DB) */
    saved: MtdSheetData = pickSheetData(null);
    @ViewChild('printSheet', { static: false }) printSheet: MtdSheetComponent;
    /** preview panel width set with the splitter (null = the default share); remembered per browser */
    prevW: number | null = null;
    /** preview folded away to a thin rail (dragged below MTO_PREV_HIDE): the print options move above the form */
    previewHidden: boolean = false;
    @ViewChild('split', { static: false }) splitRef: ElementRef<HTMLElement>;
    private splitDrag: { x: number; w: number } | null = null;
    private splitMove = (e: PointerEvent) => this.onSplitMove(e);
    private splitUp = () => this.endSplit();
    private deskEl: HTMLElement | null = null;
    private deskObserver: any = null;
    private cmpCodeCache: string | null = null;

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
        private loaderService: LoaderService,
        private host: ElementRef<HTMLElement>,
        private cdr: ChangeDetectorRef) {
        this.loadSplit();
    }

    /* ================= Layout B helpers ================= */

    /** the live values for the preview sheet (this component carries every printed field) */
    get sheetData(): MtdSheetData {
        return this as any;
    }

    get cmpCode(): string {
        if (this.cmpCodeCache === null) {
            try {
                const login = this._loginService.getLogin();
                this.cmpCodeCache = String((login && login[0] && login[0].CMPCODE) || '');
            } catch (e) {
                this.cmpCodeCache = '';
            }
        }
        return this.cmpCodeCache;
    }

    get onBoardDate(): string {
        return shippedOnBoardDate(this.PLACEDATE);
    }

    get savedOnBoardDate(): string {
        return shippedOnBoardDate(this.saved.PLACEDATE);
    }

    get hasRider(): boolean {
        return sheetText(this.Rider).trim() !== '';
    }

    /** the form differs from what was last loaded / saved */
    get unsaved(): boolean {
        return this.loaded && !sameSheetData(this.saved, this);
    }

    get sumDoc(): string {
        return joinSummary([firstLine(this.FCRNO), firstLine(this.EXPNO) ? 'ref ' + firstLine(this.EXPNO) : '']);
    }

    get sumParties(): string {
        return joinSummary([firstLine(this.SHIPPER), firstLine(this.CONSIGNEE), firstLine(this.NOTIFYPARTY)]);
    }

    get sumRouting(): string {
        const from = firstLine(this.CARRIER) || firstLine(this.RECPTPLACE);
        const to = firstLine(this.PODEL) || firstLine(this.POD);
        return joinSummary([from && to ? from + ' → ' + to : (from || to), firstLine(this.VESSEL)]);
    }

    get sumCargo(): string {
        return joinSummary([firstLine(this.ITCDESC), countPrintedLines(this.ITCDESC) + ' of ' + DESC_FIT_LINES + ' lines']);
    }

    get sumFreight(): string {
        return joinSummary([firstLine(this.PP) ? 'Payable at ' + firstLine(this.PP) : '', firstLine(this.CC)]);
    }

    get sumIssue(): string {
        return joinSummary([firstLine(this.PLACEDATE).replace(/\s+/g, ' '), firstLine(this.APPLYTO)]);
    }

    toggleSec(s: MtoSection): void {
        this.open[s] = !this.open[s];
    }

    /** focusing a field outlines its box on the preview (and shows the rider page for the Rider field) */
    onFormFocus(ev: FocusEvent): void {
        const id = ev && ev.target ? (ev.target as HTMLElement).id : '';
        if (!id || !MTO_FIELD_SECTION[id]) {
            return;
        }
        this.hot = id;
        if (id === 'rider') {
            this.page = 'rider';
        } else if (this.page === 'rider') {
            this.page = 'main';
        }
        setTimeout(() => this.revealInPreview(id));
    }

    onFormBlur(): void {
        this.hot = '';
    }

    /** a box on the preview was clicked: open its section and focus its field */
    focusField(id: string): void {
        const sec = MTO_FIELD_SECTION[id];
        if (!sec) {
            return;
        }
        this.open[sec] = true;
        this.cdr.detectChanges();
        const el = this.host.nativeElement.querySelector('[id="' + id + '"]') as HTMLElement;
        if (el) {
            el.focus();
        }
    }

    /** "Move extra lines to Rider": description lines past the 24 that print go to the rider sheet */
    moveDescToRider(): void {
        const cut = splitAtPrintedLine(this.ITCDESC, DESC_FIT_LINES);
        if (!cut.rest) {
            return;
        }
        const moved = cut.rest.split('\n').length;
        this.ITCDESC = cut.keep;
        const rider = sheetText(this.Rider).replace(/\s+$/, '');
        this.Rider = rider ? rider + '\n\n' + cut.rest : cut.rest;
        this._toasterService.toast('info', 'Rider', moved + (moved === 1 ? ' line' : ' lines')
            + ' moved to the Rider / attached sheet. Click Update to save.');
    }

    onExpressChange(ev: Event): void {
        if (this.mtoExpress.observed) { this.mtoExpress.emit(ev); } else { this.checkValue(ev); }
    }

    onWatermarkChange(ev: Event): void {
        if (this.mtoWatermark.observed) { this.mtoWatermark.emit(ev); } else { this.getwatermarkvalue(ev); }
    }

    onUpdateClick(): void {
        if (this.mtoUpdate.observed) { this.mtoUpdate.emit(); } else { this.printUpdate(); }
    }

    onDraftClick(): void {
        if (this.mtoDraft.observed) { this.mtoDraft.emit(); } else { this.printDraft(); }
    }

    onPrintClick(): void {
        if (this.mtoPrint.observed) { this.mtoPrint.emit(); } else { this.Print(); }
    }

    /** replaces the old window.open(<.aspx report>): prints the saved values from the hidden sheet copy */
    private openMtdPrint(draft: boolean): void {
        this.cdr.detectChanges();
        const root = this.printSheet ? this.printSheet.root : null;
        if (!root) {
            this._toasterService.toast('error', 'Error', 'The print could not be prepared.');
            return;
        }
        const title = 'MTD ' + sheetText(this.saved.FCRNO) + (draft ? ' - draft' : '');
        if (!openMtdPrintWindow(root, { draft: draft, title: title })) {
            this._toasterService.toast('warning', 'warning', 'The browser blocked the print window. Allow pop-ups for this site and try again.');
        }
    }

    /* ---- preview: scale the A4 sheet to the panel (width, and the visible height while it is sticky) ---- */
    @ViewChild('desk', { static: false })
    set deskRef(ref: ElementRef<HTMLElement> | undefined) {
        const el = ref ? ref.nativeElement : null;
        if (el === this.deskEl) {
            return;
        }
        this.stopDeskObserver();
        this.deskEl = el;
        if (el) {
            if (typeof ResizeObserver !== 'undefined') {
                this.deskObserver = new ResizeObserver(() => this.fitPreview());
                this.deskObserver.observe(el);
                if (el.parentElement) {
                    // the bar above the sheet grows / shrinks (unsaved note, rider pages): refit the height
                    this.deskObserver.observe(el.parentElement);
                }
            }
            setTimeout(() => this.fitPreview());
        }
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        this.fitPreview();
    }

    fitPreview(): void {
        const desk = this.deskEl;
        if (!desk || !desk.isConnected) {
            return;
        }
        const cs = getComputedStyle(desk);
        const innerW = desk.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
        if (innerW <= 0) {
            return;
        }
        const widthFit = innerW / MTD_PAGE_W;
        let s = widthFit;
        let maxH: number | null = null;
        const prev = desk.parentElement;
        const form = prev && prev.parentElement ? prev.parentElement.querySelector('.mto-form') as HTMLElement : null;
        const sideBySide = !!(prev && form && getComputedStyle(prev).position === 'sticky'
            && prev.getBoundingClientRect().left > form.getBoundingClientRect().left + 10);
        if (sideBySide) {
            // while it sticks beside the form, show the whole page in the visible height; on short screens keep it
            // readable (>= MTD_MIN_SCALE) and let the panel scroll instead
            const scroller = desk.closest('main') as HTMLElement | null;
            const viewH = scroller ? scroller.clientHeight : window.innerHeight;
            const above = desk.getBoundingClientRect().top - prev.getBoundingClientRect().top;
            maxH = Math.max(240, Math.floor(viewH - above - 44));
            const room = maxH - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
            s = Math.max(Math.min(widthFit, room / MTD_PAGE_H), Math.min(widthFit, MTD_MIN_SCALE));
        }
        s = Math.floor(Math.max(0.3, Math.min(1, s)) * 1000) / 1000;
        if (s !== this.scale || maxH !== this.deskMaxH) {
            this.scale = s;
            this.deskMaxH = maxH;
            this.cdr.detectChanges();
        }
    }

    /** scrolls the preview panel (when it scrolls) so the box of field `id` is in view */
    private revealInPreview(id: string): void {
        const desk = this.deskEl;
        if (!desk || desk.scrollHeight <= desk.clientHeight + 1) {
            return;
        }
        const box = desk.querySelector('[data-f="' + id + '"]') as HTMLElement;
        if (!box) {
            return;
        }
        const d = desk.getBoundingClientRect();
        const b = box.getBoundingClientRect();
        if (b.top < d.top + 8) {
            desk.scrollTop -= d.top + 8 - b.top;
        } else if (b.bottom > d.bottom - 8) {
            desk.scrollTop += Math.min(b.bottom - (d.bottom - 8), b.top - (d.top + 8));
        }
    }

    private stopDeskObserver(): void {
        if (this.deskObserver) {
            this.deskObserver.disconnect();
            this.deskObserver = null;
        }
    }

    /* ---- preview splitter: drag to resize the preview; drag it narrow enough and it folds to a rail ---- */
    startSplit(e: PointerEvent): void {
        if (e.button !== 0) {
            return;
        }
        e.preventDefault();
        const prev = this.splitRef ? this.splitRef.nativeElement.querySelector('.mto-prev') as HTMLElement : null;
        this.splitDrag = { x: e.clientX, w: this.previewHidden || !prev ? 0 : prev.getBoundingClientRect().width };
        window.addEventListener('pointermove', this.splitMove);
        window.addEventListener('pointerup', this.splitUp);
        window.addEventListener('pointercancel', this.splitUp);
        document.body.style.userSelect = 'none';
    }

    private onSplitMove(e: PointerEvent): void {
        if (this.splitDrag) {
            this.setPreviewWidth(this.splitDrag.w + (this.splitDrag.x - e.clientX));
        }
    }

    private endSplit(): void {
        if (!this.splitDrag) {
            return;
        }
        this.splitDrag = null;
        window.removeEventListener('pointermove', this.splitMove);
        window.removeEventListener('pointerup', this.splitUp);
        window.removeEventListener('pointercancel', this.splitUp);
        document.body.style.userSelect = '';
        this.saveSplit();
    }

    /** arrow keys resize by 40 px (left = wider preview), Enter / Space hides or shows it, Home resets */
    splitKey(e: KeyboardEvent): void {
        const cur = this.previewHidden ? 0 : (this.prevW !== null ? this.prevW : this.currentPreviewWidth());
        if (e.key === 'ArrowLeft') {
            this.setPreviewWidth(Math.max(cur, MTO_PREV_MIN - 40) + 40);
        } else if (e.key === 'ArrowRight') {
            this.setPreviewWidth(cur - 40);
        } else if (e.key === 'Enter' || e.key === ' ') {
            this.togglePreview();
        } else if (e.key === 'Home') {
            this.prevW = null;
            this.previewHidden = false;
        } else {
            return;
        }
        e.preventDefault();
        this.saveSplit();
    }

    togglePreview(): void {
        this.previewHidden = !this.previewHidden;
        this.saveSplit();
    }

    showPreview(): void {
        this.previewHidden = false;
        this.saveSplit();
    }

    private setPreviewWidth(w: number): void {
        if (w < MTO_PREV_HIDE) {
            this.previewHidden = true;
        } else {
            const box = this.splitRef ? this.splitRef.nativeElement.getBoundingClientRect().width : 0;
            const max = box > 0 ? Math.max(MTO_PREV_MIN, box - MTO_FORM_MIN) : w;
            this.previewHidden = false;
            this.prevW = Math.round(Math.min(max, Math.max(MTO_PREV_MIN, w)));
        }
        this.cdr.detectChanges();
    }

    private currentPreviewWidth(): number {
        const prev = this.splitRef ? this.splitRef.nativeElement.querySelector('.mto-prev') as HTMLElement : null;
        return prev ? prev.getBoundingClientRect().width : MTO_PREV_MIN;
    }

    private loadSplit(): void {
        try {
            const v = JSON.parse(localStorage.getItem(MTO_SPLIT_KEY) || 'null');
            if (v && typeof v === 'object') {
                this.prevW = typeof v.w === 'number' && v.w >= MTO_PREV_MIN ? v.w : null;
                this.previewHidden = v.hidden === true;
            }
        } catch (e) { /* no storage: default layout */ }
    }

    private saveSplit(): void {
        try {
            localStorage.setItem(MTO_SPLIT_KEY, JSON.stringify({ w: this.prevW, hidden: this.previewHidden }));
        } catch (e) { /* no storage: the layout just isn't remembered */ }
    }

    ngOnDestroy(): void {
        this.endSplit();
        this.stopDeskObserver();
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

                    this.saved = pickSheetData(this);   // what Print / Draft print print
                    this.page = 'main';
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
                    this.saved = pickSheetData(this);   // the print now matches the saved document
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
        // Was window.open(.../linkserp-ac/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?...&Iswatermark=...):
        // the MTD is now printed by Links itself, with a DRAFT mark.
        this.openMtdPrint(true);
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


                  // Was window.open(.../linkserp-ac/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?...):
                  // the MTD is now printed by Links itself.
                  this.openMtdPrint(false);
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

        
    
