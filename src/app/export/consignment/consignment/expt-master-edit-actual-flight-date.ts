import { Component, OnInit, ViewChild, ElementRef,ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { SharedDataSerice } from '../../export-share-data.service';
import { ButtonService } from '../../../shared/common-font-changer.directive';
import { IMyDpOptions } from 'mydatepicker';
@Component({
    selector: 'app-edit-actual-flight-date',
    templateUrl: 'expt-master-edit-actual-flight-date.html',
    styleUrls: ['../../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None
})
export class EditActualFlightDateComponent implements OnInit {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '16px',
        width: '120px',
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

    ExptNo: string;
    CityCode: string = '';
    displayData: any;
    exptNoList: Array<any> = [];
    dhakaSubAgentList: Array<any> = [];
    dhakaSubAgent: any = null;
    FlightDate: any = null;
    CoEmissionLevel: number;

    MAWBDEST: string ="";
    MAWBFRT: string =""
    commoncities: any = [];
    transtype: any = "Direct";
    transportone: any = null;
    transporttwo: any = null;
    etdonedt: any = null;
    etdtwodt: any = null;
    etaonedt: any = null;
    etatwodt: any = null;
    fltno1 : string="";
    fltno2 : string="";
    ACTUALFLIGHTNO:any="";
    ACTUALFLIGHTDT:any=null;
    CONTAINERNO : string;
    CONTAINERNO_ETA :string ;

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _router: Router,
        private _route: ActivatedRoute,
        private _disable: ButtonService) {
        this.CityCode = this._loginService.getLogin()[0].CITYCODE;
        this._route.params.subscribe(params => {
            this.ExptNo = params["exptno"];
            this.pageLoad(params["exptno"]);
        });
    }

    ngOnInit() {

    }

    pageLoad(exptno) {
        const _jsonData = {
            ExptNo: exptno,
            Citycode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData("Export/ExportEditActualFlightDateData", _jsonData)
            .subscribe((data: any) => {
                if (data.Table[0].AEROBILLNO != undefined) {
                    this.displayData = data.Table[0];
                    this.MAWBDEST=this.displayData.MAWBDEST;
                    this.MAWBFRT=this.displayData.MAWBFRT;
                    this.fltno1=this.displayData.FLIGHTNO1;
                    this.ACTUALFLIGHTNO=this.displayData.ACTUALFLIGHTNO;
                  //  this.ACTUALFLIGHTDT = (this.displayData.ACTUALFLIGHTDT != '') ? this._dataService.stringdttoArry(this.displayData.ACTUALFLIGHTDT) : null;
                  if (this.displayData.ACTUALFLIGHTDT=='')
                  {(this.displayData.ACTUALFLIGHTDT != '') ? this._dataService.stringdttoArry(this.displayData.ACTUALFLIGHTDT) : null;}
                  else{ this.ACTUALFLIGHTDT =this.displayData.ACTUALFLIGHTDT;}        
                    if (this.displayData.TRANSPORT1 != "") {
                        this.transtype = "Trans";
                    this.transportone=this.displayData.TRANSPORT1;
                    this.etdonedt = (this.displayData.ETDPORT1 != '') ? this._dataService.stringdttoArry(this.displayData.ETDPORT1) : null;
                    this.etaonedt = (this.displayData.ETAPORT1 != '') ? this._dataService.stringdttoArry(this.displayData.ETAPORT1) : null;
                    this.fltno2=this.displayData.FLIGHTNO2;
                    this.transporttwo=this.displayData.TRANSPORT2;
                    this.etdtwodt = (this.displayData.ETDPORT2 != '') ? this._dataService.stringdttoArry(this.displayData.ETDPORT2) : null;
                    this.etatwodt = (this.displayData.ETAPORT2 != '') ? this._dataService.stringdttoArry(this.displayData.ETAPORT2) : null;
                   
                    }
                        else{
                        this.transtype = "Direct";}
                 
                    this.CoEmissionLevel = this.displayData.CO2_EMITION_LVL;
                    this.CONTAINERNO=  this.displayData.CONTAINERNO;
                    this.CONTAINERNO_ETA= this.displayData.CONTAINERNO_ETA;
                    this.exptNoList = data.Table1;
                    this.dhakaSubAgentList = data.Table2;
                    this.commoncities=data.Table3;
                } else {
                    this._toasterService.toast('error', 'Alert', data.Table[0].status + '<br/>' + data.Table[0].statusText);
                }
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            });
    }


    submit() {
        /*if (this.FlightDate == null) {
            if (this.dhakaSubAgent == null) {
                this._toasterService.toast("error", "Alert", "Actual Flight Date. can not be blank"); return false;
            }
        }
        if (this._dataService.DateFromAndToComparision(this.displayData.AEROBILLDT, this.FlightDate.formatted) == false) {
            this._toasterService.toast("error", "Alert", "Actual Flight date should be greater than or equal to MAWB date");
            return false;
        }
        if (this._dataService.DateFromAndToComparision(this.FlightDate.formatted, this._dataService.getCurrentdate()) == false) {
            this._toasterService.toast("error", "Alert", "Actual Flight date Should be Less than or Equal to Current Date [ " + this._dataService.getCurrentdate() + "]");
            return false;
        }*/
     let eta1="", eta2="" ,eta,etd="",etd1="",etd2="",actfltdt="";
     eta1 =(this.etaonedt != null) ? this.etaonedt.formatted : '' ;
     eta2 =(this.etatwodt != null) ? this.etatwodt.formatted : '' ;  
     actfltdt=  (this.ACTUALFLIGHTDT != null) ? this.ACTUALFLIGHTDT.formatted : '' ;  
     if (eta2=='') {eta=eta1; }  else { eta=eta1; } 

     etd1 =(this.etdonedt != null) ? this.etdonedt.formatted : '' ;
     etd2 =(this.etdtwodt != null) ? this.etdtwodt.formatted : '' ;     
     if (etd2=='') {etd=etd1; }  else { etd=etd1; } 

     if (this._dataService.date2Comparison(etd, eta) == false) {
        this._toasterService.toast("error", "Alert", "ETA should be greater than or equal to ETD");
        return false;
    }
    if(this.CONTAINERNO_ETA !='' ) // sea / air case ata should be gratte than container eta
    {
        if ( eta != '') {
            if (this._dataService.date2Comparison(this.CONTAINERNO_ETA ,eta) == false) {
                this._toasterService.toast("error", "Alert", "ETA should be greater than Container " +  this.CONTAINERNO +"  ETA " + this.CONTAINERNO_ETA );
                return false;
            } 
        }
        if  (actfltdt !=''){
            if (this._dataService.date2Comparison(this.CONTAINERNO_ETA ,actfltdt) == false) {
                this._toasterService.toast("error", "Alert", " Actual Flight  should be greater than Container " +  this.CONTAINERNO +"  ETA " + this.CONTAINERNO_ETA );
                return false;
            }  
        }
    }
    
    if (actfltdt=="")
    {
        this._toasterService.toast("error", "Alert", "Please update Actual flight date ");
        return false;
    }
 
        const _jsonData = {
            ExptNo: this.ExptNo,
            SubAgent: (this.dhakaSubAgent != null) ? this.dhakaSubAgent : '',             
            MAWBDEST: this.MAWBDEST , MAWBFRT:this.MAWBFRT  ,  TRAPORT1:this.transportone  , FLTNO1: this.fltno1 , ETD1:(this.etdonedt != null) ? this.etdonedt.formatted : ''  ,
            ETA1: (this.etaonedt != null) ? this.etaonedt.formatted : '' , TRAPORT2:this.transporttwo  , FLTNO2:this.fltno2  ,
            ETD2: (this.etdtwodt != null) ? this.etdtwodt.formatted : '' , ETA2 :   (this.etatwodt != null) ? this.etatwodt.formatted : '' ,
            Co2EmissionLevel: this.CoEmissionLevel,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            Citycode: this._loginService.getLogin()[0].CITYCODE,
            MakerId: this._loginService.getLogin()[0].CMPID,
            ActualFlightNo:this.ACTUALFLIGHTNO,
            ActualFlightDt: (this.ACTUALFLIGHTDT != null) ? this.ACTUALFLIGHTDT.formatted : '',     
        };

        this._disable.disableButton(this.submitButton);
        this._dataService.Common("Export/ExportEditActualFlightDateUpdate", _jsonData)
            .subscribe((data: any) => {
                this._toasterService.toast('success', 'Alert', 'Data Updated Successfully');
                this._disable.enableButton(this.submitButton);
            },
            (error) => {
                this._disable.enableButton(this.submitButton);
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            }); 
    }
    transType(check): void {
        this.transtype = check;
        if (check == "Direct") {
            this.transportone = null;
            this.transporttwo = null;
            this.etdonedt = null;
            this.etdtwodt = null;
            this.etatwodt = null;
        } else if (check == "Trans") { }
    }

}