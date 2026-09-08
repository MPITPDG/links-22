import { Component, OnInit} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import {IMyDpOptions} from 'mydatepicker';

@Component({
    selector: 'app-mawbstockmaster',
    templateUrl: 'stockmaster.component.html'

})
export class MawbStockMasterComponent implements OnInit {

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

    airlinelist:any=[];
    typelist:any=[];
    companyname: string ='';
    iataagentlist:any=[];
    iataagent:string='';
    airline: string='';
    FrommawbNo: string='';
    noofstock: string='';
    TomawbNo: string='';
    DocNo: string='';
    DocDate:any;
    Type: string='';
    airlinecode:string=""
    private baseUrl: string  = "";
    public disable_submitbtn =false;
    public disable_iataagent =false;
    public disable_airline =false;
    constructor(
        private _dataService: DataService,
        private _toasterService:ToastCommonService,
        private loaderService: LoaderService,
        private _loginService:LoginService,

    ) { }
    ngOnInit() {

            this.DocDate=new Date();
            this.DocDate =  this._dataService.datechnge(this.DocDate)

            this._loginService.verifyRights(428, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });
        let _jsonGet = {
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE
        }
        this._dataService.getData("Export/EXP_MAWB_STOCK_PAGELOAD" ,_jsonGet)
        .subscribe((data: any) => {
            this.iataagentlist=data.Table;
            this.airlinelist=data.Table1;
            this.typelist=data.Table2;
        });
    }
    getAirlinecodee(value: any) {
        this.airlinecode = value
    }

    DocDateChanged(ev){
            this.DocDate=ev.formatted
    }
          AddNew(){
            this.airline=''
            this.FrommawbNo=''
            this.DocNo=''
            this.DocDate=new Date();
            this.DocDate =  this._dataService.datechnge(this.DocDate)
            this.noofstock=''
            this.Type=''
            this.iataagent=''
            this.airline=''
            this.airlinecode=''
            this.TomawbNo=''
            this.disable_submitbtn=false;
            this.disable_airline=false;
            this.disable_iataagent=false;

          }
        AddMain() {
            if (this.DocDate == "" || this.DocDate == undefined) {
                this._toasterService.toast('warning', 'warning', 'Doc Date could not be blank !');
                return false;
            }
            if (this.iataagent == "") {
                this._toasterService.toast('warning', 'warning', 'Iata Agent  could not be blank !');
                return false;
            }
            if (this.airline == "") {
                this._toasterService.toast('warning', 'warning', 'Airline Name could not be blank !');
                return false;
            }
            if (this.FrommawbNo == "") {
                this._toasterService.toast('warning', 'warning', 'From MAWB No could not be blank !');
                return false;
            }
            if (this.noofstock == "") {
            this._toasterService.toast('warning', 'warning', 'No of Stock could not be blank !');
            return false;
        }


            if (this.Type == "") {
                this._toasterService.toast('warning', 'warning', 'Type could not be blank !');
                return false;
            }

            const jsonmaster = {
            DOC_NO: this.DocNo,
            DOC_DATE: this.DocDate,
            IATAAGENT:this.iataagent,
            AIRLINECD:this.airline,
            NOOF_STOCK:  this.noofstock,
            MAWBNO_FROM: this.airlinecode + this.FrommawbNo,
            MAWBNO_TO: this.TomawbNo,
            SRVC_TYPE: this.Type,
            CMP_CODE: this._loginService.getLogin()[0].CMPCODE,
            CITY_CODE1: this._loginService.getLogin()[0].CITYCODE1,
            MAKER_ID:  this._loginService.getLogin()[0].CMPID,
            MAKER_IP :  this._loginService.getLogin()[0].MAKERIP,

            }
            this._dataService.Common("Export/STOCK_MASTER_IU", jsonmaster)
            .subscribe((data: any) => {

            if (data.Table[0].STATUS == "100") {
                this.TomawbNo=data.Table1[0].MAWBNO_TO
                this.DocNo=data.Table1[0].DOC_NO
                this.DocDate=data.Table1[0].DOC_DATE
                this.disable_submitbtn=true;
                this.disable_iataagent=true;
                this.disable_airline=true;
                this._toasterService.toast('success', '', data.Table[0].STATUSMSG);
                this.loaderService.display(false);
                // this.RestMain();
                }
                else if(data.Table[0].STATUS == "103"){
                this._toasterService.toast('warning', '', data.Table[0].STATUSMSG);
                this.loaderService.display(false);
                this.RestMain();
                }

                });

        }

        RestMain(){
        this.airline=''
        this.FrommawbNo=''
        this.DocDate=''
        this.noofstock=''
        this.Type=''
        this.iataagent=''
        this.airline=''
        this.airlinecode=''
        this.TomawbNo=''
        this.disable_submitbtn=false;
        this.disable_airline=false;
        this.disable_iataagent=false;
        }

       fn_validateMawbNo(Airmawbno){
        if( Airmawbno.length==11){
        let  remainder=0;
        let chklastdigit=0;
        let extractno =0;
        extractno  =Airmawbno.substr(3,7)
        remainder=(extractno % 7) //(extractno - 7 * extractno / 7)
          chklastdigit=Airmawbno.slice(-1)//no.substr(11,1)
           if(remainder!=chklastdigit){
               this._toasterService.toast("warning","warning","GIVEN MAWB NO IS NOT VALID ");
               this.FrommawbNo="";
               return false;
           }
       }
       }
       fn_generateLastMawbNo(Airmawbno,cnt){
        if( Airmawbno.length==11){
            let  remainder=0;
            let chklastdigit=0;
            let extractno ;
            extractno  =Airmawbno.substr(3,8)
            for (let i = 0; i < cnt; i++) {
                chklastdigit=extractno.toString().slice(-1)
                if(chklastdigit==6){
                    extractno =parseInt(extractno)+4;
                }
                else{
                    extractno =parseInt(extractno)+11;
                }
                console.log(extractno)
            }
           this.TomawbNo= extractno
        }
    }
}