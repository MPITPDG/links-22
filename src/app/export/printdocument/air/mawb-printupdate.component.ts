import { Component, OnInit ,ViewChild} from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoginService } from '../../../shared/service/loginService';

import { LoaderService } from '../../../shared/service/loader.service';
import { environment } from  '../../../../environments/environment'; //'../../../environments/environment';
//import { ConsignmentEditModalComponent } from './../../consignment/consignment/consig_main_edit_modal.component';
import {MAWBModelpopupcomponent } from './Mawb_Tarifrating.component'
import { SharedDataSerice } from '../../export-share-data.service';
@Component({
    selector: 'app-print-air-Mawb-printupdate',
    templateUrl: 'mawb-printupdate.component.html'
})
export class PrintDocumentMawbprintupdateComponent implements OnInit {
    @ViewChild('MAWBModelpopup', {static: false}) public editModal: MAWBModelpopupcomponent;
    hawbnoList : any = [];
    MAWBNO : any = "";
    MAWBDT : any = "";
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

    kglb : any = "";
    ratecls : any = "";
    commodity : any = "";

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
    DESC : any = "";
    check : string ='1';
    AIRLINE_ADDRS: string="";
    grwt: string="";
    chblwt: string="";
    EXPTNO:string="";
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _toasterService : ToastCommonService,
        private _sharedconsig: SharedDataSerice ) {

    }

    ngOnInit() {
        this._activatedRoute.params.subscribe(params => {
            if (params["param"]) {
                this.MAWBNO = params["param"];
                this.pageload(this.MAWBNO);
            }

            });
        this.MAWBNO = (this.MAWBNO != undefined || this.MAWBNO != '') ? this.MAWBNO : '';
    }
    pageload(_MAWBNO)
    {
        this._loaderService.display(true);
        const _jsonData = {
            mawbno: _MAWBNO ,
            cmpid:this._loginService.getLogin()[0].CMPID,
            isprint:"0"
        };
        this._dataService.getData("Export/PrintDocumentAirMawbPrint", _jsonData)
        .subscribe((data: any) => {
            if (data.Table[0].STATUS == 100) {
                this.hawbnoList=data.Table;
                this.MAWBNO=	data.Table[0].MAWBNO  ;
                this.MAWBDT =	data.Table[0].MAWBDT   ;
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

                this.kglb 	=data.Table[0].KG   ;
                this.ratecls =	data.Table[0].RTCL   ;
                this.commodity= 	data.Table[0].ITMNO   ;

                if(data.Table[0].FRT_CHARGEABLE_AS_TAR=='F')
                { this.ratechrg =	data.Table[0].FRT_CHARGEABLE_AS_TAR   ;  }
                else{    this.ratechrg =	data.Table[0].RATE   ;  }

                this.total 	=data.Table[0].TOT   ;
                this.qtyofgoods= 	data.Table[0].IDESC   ;
                this.othrchrg =	data.Table[0].OTHCHRG   ;
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

                this.AGTNAME1  =  	data.Table[0].AGTNAME1  ;
                this.totcollchrg  =	data.Table[0].TOTCOLLCHRG   ;
                this. IATAcct=data.Table[0].AGTACNO;
                this.COM_NAME=data.Table[0].COM_NAME;
                this.CMP_CITY=data.Table[0].CMP_CITY;
                this.DESC=data.Table[0].DESC;
                this.AIRLINE_ADDRS=data.Table[0].AIRLINE_ADDRS;
                this.grwt=data.Table[0].GRWT;
                this.chblwt=data.Table[0].CHRGWT;
                this.AIRLINE_ADDRS=data.Table[0].AIRLINE_ADDRS;
                this.EXPTNO=data.Table[0].EXPTNO;
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
            MAWBNO:this.MAWBNO ,SHPR:this.shipper  ,CNSEE: this.consignee ,AGTNAME: this.agentname ,IATA:this.IATACode ,AGTACNO:this.IATAcct ,DEPARTURE:this.airportdep,
            IMP_TO:this.to1  ,FRSTCARR: this.bycarrier1 ,TO1:this.to2  ,IMP_BY:this.by2  ,TO2: this.to3 ,BY1: this.by3 ,CURR: this.currency ,
            CHGS:this.chgs  ,PPDWT: this.ppd1 ,COLLWT: this.coll1 ,OTHRPPD: this.ppd2 ,OTHRCOLL:this.coll2  ,CARRVAL: this.valcarriage ,
            CUSTVAL:this.valcustom  ,DEST: this.airprtdest ,FLT1:this.reqfltdt1 ,FLT2: this.reqfltdt2 ,INSAMT:this.amtinsur  ,ACINFO:this.actinfo  ,HANDINFO: this.handinfo ,
            PCS:this.pcsrcp   ,KG:this.kglb  ,RTCL:this.ratecls  ,ITMNO:this.commodity    ,RATE:this.ratechrg  ,
            TOT:this.total  ,IDESC:this.qtyofgoods  ,PPCHRG: this.ppwtchrg ,PPVAL:this.ppvalchrg  ,PPTAX:this.pptax  ,PPTOTAGT:this.ppothrchrg  ,PPTOTCARR:this.ppothrchrgCar  ,PPTOT:this.pptotal ,
            PPCURRATE:this.ppcrate  ,CCCHRG:this.ccwtchrg  ,CCVAL: this.ccvalchrg ,CCTAX:this.cctax  ,CCTOTAGT: this.ccothrchrg ,CCTOTCARR: this.ccothrchrgCar,
            CCTOT:this.cctotal  ,CCURRATE: this.ccdestcrate ,OTHCHRG:this.othrchrg  ,TOTCOLLCHRG:this.totcollchrg  ,BOTTOM:this.bottom  ,agtname1: this.AGTNAME1,DESC : this.DESC,AIRLINE_ADDRS:this.AIRLINE_ADDRS
        };
        this._dataService.Common("Export/MawbnoprintUpdate", _jsonData)
        .subscribe((data: any) => {
            if (data.Table[0].STATUS == 100) {
                //"HAWBNO Details updated successfully
                this._toasterService.toast('info', 'Complete',`MAWBNO Details updated successfully`);
                this.pageload(this.MAWBNO)
                this._loaderService.display(false);
            }


            else {
                this._toasterService.toast('warning', 'warning',data.Table[0].STATUSTEXT);
                this._loaderService.display(false);}
        });
    }

    printData ()
    {
        //print-document/air/air-Mawbprint/:param
        if(this.ratechrg!='')
        {
        this._router.navigate(['export/print-document/air/air-Mawbprint',this.MAWBNO]);

        }
        else
        {
            this._toasterService.toast('warning','warning','Please enter Tariff Rate first. \n\nNote: To add Tariff rate click on ENTER TARIFF RATE button.');
        }
    }
    printplane(){
        // window.open('www.manilal.com', "_blank");
        if(this.ratechrg!='')
        {
        let URL = "http://180.179.207.163/linkserp-ac/UI/Export/frm_Exp_Print_Document_MAWBNO_CRYST_PRINT.aspx?" +
        "huhpnk=" + this._loginService.getLogin()[0].GUID
        + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
        + "&Userid=" + this._loginService.getLogin()[0].CMPID
        + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
        + "&MAWBNo=" +  this.MAWBNO
        + "&CurLogInIP=" + environment.edocumentIp
          window.open(URL, "_blank");
        }
        else
        {
            this._toasterService.toast('warning','warning','Please enter Tariff Rate first. \n\nNote: To add Tariff rate click on ENTER TARIFF RATE button.');
        }

}
mawbrate() {

  //  window.open('./#/popupexport/air/air-Mawbprint/TarifRate/' + this.EXPTNO, '_blank');
    const _jsonData = {
        Type1: this.EXPTNO,
        Type2: this._loginService.getLogin()[0].CMPID
    };
    this._loaderService.display(true);
    this._dataService.Common("Export/ConsignmentEditSearchView", _jsonData)
        .subscribe((data: any) => {
            this._loaderService.display(false);
            this._sharedconsig.exportEditData = data.Table[0];
            this._loaderService.display(false);
           this.editModal.show("MawbTarif");
        })

}

}