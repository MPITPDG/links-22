import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoginService } from '../../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { environment } from  '../../../../environments/environment'; //'../../../environments/environment';

@Component({
    selector: 'app-print-air-hawb-printupdate',
    templateUrl: 'hawb-printupdate.component.html'
})
export class PrintDocumentHawbprintupdateComponent implements OnInit {


    hawbnoList : any = [];
    HAWBNO : any = "";
    HAWBDT : any = "";
    shipper : any = "";
    consignee : any = "";
    agentname : any = "";
    IATACode : any = "";
    IATAAcct : any = "";
    actinfo : any ="";
    airportdep : any = "";
    to1 : any = "";
    bycarrier1 : any = "";
    to2 : any = "";
    by2 : any = "";
    to3 : any = "";
    by3 : any = "";
    currency : any = "";
    chgs : any = "";
    ppd1 : any = "";
    coll1 : any = "";
    ppd2 : any = "";
    coll2 : any = "";
    valcarriage : any = "";
    valcustom : any = "";
    airprtdest : any = "";
    reqfltdt1 : any = "";
    reqfltdt2 : any = "";
    amtinsur : any = "";
    handinfo : any = "";
    pcsrcp : any = "";
    grwt : any = "";
    kglb : any = "";
    ratecls : any = "";
    commodity : any = "";
    chblwt : any = "";
    ratechrg : any = "";
    total : any = "";
    qtyofgoods : any = "";
    othrchrg : any = "";
    ppwtchrg : any = "";
    ccwtchrg : any = "";
    ppvalchrg : any = "";
    ccvalchrg : any = "";
    pptax : any = "";
    cctax : any = "";
    ppothrchrg : any = "";
    ccothrchrg : any = "";
    ppothrchrgCar : any = "";
    ccothrchrgCar : any = "";
    bottom : any = "";
    pptotal : any = "";
    cctotal : any = "";
    ppcrate : any = "";
    ccdestcrate : any = "";
    totcollchrg : any = "";
    AGTNAME1: any= "";
    IATAcct : any= "";
    COM_NAME :  any ="";
    CMP_CITY : any = "";

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _toasterService : ToastCommonService) {

    }

    ngOnInit() {
        this._activatedRoute.params.subscribe(params => {
            if (params["param"]) {
                this.HAWBNO = params["param"];
                this.pageload(this.HAWBNO);
            }

            });
        this.HAWBNO = (this.HAWBNO != undefined || this.HAWBNO != '') ? this.HAWBNO : '';
    }
    pageload(_hawbno)
    {
        this._loaderService.display(true);
        const _jsonData = {
            hawbno: _hawbno,
            cmpid:this._loginService.getLogin()[0].CMPID
        };
        this._dataService.getData("Export/hawbnoprintload", _jsonData)
        .subscribe((data: any) => {
            if (data.Table[0].STATUS == 100) {
                this.hawbnoList=data.Table;
                this.HAWBNO=	data.Table[0].HAWBNO  ;
                this.HAWBDT =	data.Table[0].HAWBDT   ;
                this.shipper =	data.Table[0].SHPR  ;
                this.consignee =	data.Table[0].CNSEE   ;
                this.agentname= 	data.Table[0].AGTNAME   ;
                this.IATACode =	data.Table[0].IATA   ;
                this.actinfo =	data.Table[0].ACINFO;
                this.airportdep =	data.Table[0].DEPARTURE   ;
                this.to1 =	data.Table[0].IMP_TO  ;
                this.bycarrier1 =	data.Table[0].FRSTCARR   ;
                this.to2 =	data.Table[0].TO1   ;
                this.by2 =	data.Table[0].IMP_BY  ;
                this.to3 =	data.Table[0].TO2   ;
                this.by3= 	data.Table[0].BY1   ;
                this.currency= 	data.Table[0].CURR   ;
                this.chgs= 	data.Table[0].CHG  ;
                this.ppd1= 	data.Table[0].PPDWT   ;
                this.coll1 =	data.Table[0].COLLWT   ;
                this.ppd2 =	data.Table[0].OTHRPPD   ;
                this.coll2 	=data.Table[0].OTHRCOLL   ;
                this.valcarriage =	data.Table[0].CARRVAL   ;
                this.valcustom= 	data.Table[0].CUSTVAL   ;
                this.airprtdest =	data.Table[0].DEST   ;
                this.reqfltdt1 	=data.Table[0].FLT1  ;
                this.reqfltdt2 =	data.Table[0].FLT2   ;
                this.amtinsur =	data.Table[0].INSAMT   ;
                this.handinfo 	=data.Table[0].HANDINFO  ;
                this.pcsrcp 	=data.Table[0].PCS   ;
                this.grwt 	=data.Table[0].GRWT   ;
                this.kglb 	=data.Table[0].KG   ;
                this.ratecls =	data.Table[0].RTCL   ;
                this.commodity= 	data.Table[0].ITMNO   ;
                this.chblwt =	data.Table[0].CHRGWT  ;
                if(data.Table[0].FRT_CHARGEABLE_AS_TAR=='F')
                { this.ratechrg =	data.Table[0].FRT_CHARGEABLE_AS_TAR   ;  }
                else{    this.ratechrg =	data.Table[0].RATE   ;  }

                this.total 	=data.Table[0].TOT   ;
                this.qtyofgoods= 	data.Table[0].IDESC   ;
                this.othrchrg =	data.Table[0].OTHCHRG ;// + '' + data.Table[0].ALCHARGES    ;
                this.ppwtchrg 	=data.Table[0].PPCHRG   ;
                this.ccwtchrg =	data.Table[0].CCCHRG  ;
                this.ppvalchrg =	data.Table[0].PPVAL   ;
                this.ccvalchrg =	data.Table[0].CCVAL   ;
                this.pptax =	data.Table[0].PPTAX  ;
                this.cctax =	data.Table[0].CCTAX   ;
                this.ppothrchrg =	data.Table[0].PPTOTAGT   ;
                this.ccothrchrg =	data.Table[0].CCTOTAGT   ;
                this.ppothrchrgCar= 	data.Table[0].PPTOTCARR   ;
                this.ccothrchrgCar =	data.Table[0].CCTOTCARR   ;
                this.bottom =	data.Table[0].BOTTOM   ;
                this.pptotal =	data.Table[0].PPTOT   ;
                this.cctotal =	data.Table[0].CCTOT  ;
                this.ppcrate =	data.Table[0].PPCURRATE  ;
                this.ccdestcrate =	data.Table[0].CCURRATE   ;
              //  this.totcollchrg =	data.Table[0].TOTCOLLCHRG   ;
                 this.AGTNAME1  =  	data.Table[0].AGTNAME1  ;
                this.totcollchrg  =	data.Table[0].TOTCOLLCHRG   ;
                this. IATAcct=data.Table[0].AGTACNO;
                this.COM_NAME=data.Table[0].COM_NAME;
                this.CMP_CITY=data.Table[0].CMP_CITY;
                this._loaderService.display(false);
            }
         else{

                this._toasterService.toast('warning', 'warning',data.Table[0].STATUSTEXT);
                this._loaderService.display(false);
         }

        });
    }

    updateprint()
    {
        this._loaderService.display(true);
        const _jsonData = {
            HAWBNO:this.HAWBNO ,SHPR:this.shipper  ,CNSEE: this.consignee ,AGTNAME: this.agentname ,IATA:this.IATACode ,AGTACNO:this.IATAcct ,DEPARTURE:this.airportdep,
            IMP_TO:this.to1  ,FRSTCARR: this.bycarrier1 ,TO1:this.to2  ,IMP_BY:this.by2  ,TO2: this.to3 ,BY1: this.by3 ,CURR: this.currency ,
            CHGS:this.chgs  ,PPDWT: this.ppd1 ,COLLWT: this.coll1 ,OTHRPPD: this.ppd2 ,OTHRCOLL:this.coll2  ,CARRVAL: this.valcarriage ,
            CUSTVAL:this.valcustom  ,DEST: this.airprtdest ,FLT1:this.reqfltdt1 ,FLT2: this.reqfltdt2 ,INSAMT:this.amtinsur  ,ACINFO:this.actinfo  ,HANDINFO: this.handinfo ,
            PCS:this.pcsrcp  ,GRWT: this.grwt ,KG:this.kglb  ,RTCL:this.ratecls  ,ITMNO:this.commodity  ,CHRGWT:this.chblwt  ,RATE:this.ratechrg  ,
            TOT:this.total  ,IDESC:this.qtyofgoods  ,PPCHRG: this.ppwtchrg ,PPVAL:this.ppvalchrg  ,PPTAX:this.pptax  ,PPTOTAGT:this.ppothrchrg  ,PPTOTCARR:this.ppothrchrgCar  ,PPTOT:this.pptotal ,
            PPCURRATE:this.ppcrate  ,CCCHRG:this.ccwtchrg  ,CCVAL: this.ccvalchrg ,CCTAX:this.cctax  ,CCTOTAGT: this.ccothrchrg ,CCTOTCARR: this.ccothrchrgCar,
            CCTOT:this.cctotal  ,CCURRATE: this.ccdestcrate ,OTHCHRG:this.othrchrg  ,TOTCOLLCHRG:this.totcollchrg  ,BOTTOM:this.bottom  ,agtname1: this.AGTNAME1
        };
        this._dataService.Common("Export/hawbnoprintUpdate", _jsonData)
        .subscribe((data: any) => {
            if (data.Table[0].STATUS == 100) {
                //"HAWBNO Details updated successfully
                this._toasterService.toast('info', 'Complete',`HAWBNO Details updated successfully`);
                this._loaderService.display(false);
            }
            else {this._loaderService.display(false);}
        });
    }

        printData(){
            // window.open('www.manilal.com', "_blank");
            let URL = "http://180.179.207.163/linkserp-ac/UI/Export/frm_Exp_Print_Document_HAWBNO_final_PRINT.aspx?" +
            "huhpnk=" + this._loginService.getLogin()[0].GUID
            + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
            + "&Userid=" + this._loginService.getLogin()[0].CMPID
            + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
            + "&HAWBNo=" + this.HAWBNO
            + "&CurLogInIP=" + environment.edocumentIp
              window.open(URL, "_blank");

    }

}