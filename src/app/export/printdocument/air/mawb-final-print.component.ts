import { Component, OnInit  ,ElementRef,ViewChild   } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoginService } from '../../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { environment } from  '../../../../environments/environment'; //'../../../environments/environment';

@Component({
    selector: 'app-print-air-Mawb-print',
    templateUrl: 'mawb-final-print.component.html'
})

export class PrintDocumentMawbfinalprint implements OnInit {
	@ViewChild("print", {static: false}) public MAWB: ElementRef;
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
       grwt : any = "";
       chblwt : any = "";
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
                isprint:"1"
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
                    this.grwt 	=data.Table[0].GRWT   ;
                    this.kglb 	=data.Table[0].KG   ;
                    this.ratecls =	data.Table[0].RTCL   ;
                    this.commodity= 	data.Table[0].ITMNO   ;
                    this.chblwt 	=data.Table[0].CHRGWT   ;
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
    
                    this._loaderService.display(false);
                }
             else{ 
                
                    this._toasterService.toast('warning', 'warning',data.Table[0].STATUSTEXT);  
                    this._loaderService.display(false);
             }
                
            });
        }
        finalMawbPrint()
        {
            //let PrintFCRData = this.FCR.nativeElement.InnerHTML;
          //  console.log("DivPrint ", this.MAWB.nativeElement);
            var content = this.MAWB.nativeElement.innerHTML;
            var mywindow = window.open('', 'Print', 'height=600,width=800');
    
            mywindow.document.write('<html><head><title>Print</title>');
            mywindow.document.write('</head><body >');
            mywindow.document.write(content);
            mywindow.document.write('</body></html>');
    
            mywindow.document.close();
            mywindow.focus()
            mywindow.print();
            mywindow.close();
            
        }
    }