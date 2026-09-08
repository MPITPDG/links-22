import { Component, OnChanges } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { ActivatedRoute } from '@angular/router';
import { LoaderService }  from '../../../shared/service/loader.service';
import { environment } from '../../../../environments/environment';
 
@Component({
    selector: 'app-consignment-main-view',
    templateUrl: 'cong-main-view.component.html'
})
export class ConsigneeMainViewComponent implements OnChanges {

    ExptNo: any = '';
    viewData: any;
    edocView: number = 0;
    containerData: any = [];
    deliveryData: any = [];
    loadTrans: any = {};
    remark: any = {};

    links: string = 'M';

    containerno: string = null;
    vessel: string = null;

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private route: ActivatedRoute,
        private _toasterService: ToastCommonService,
        private _LoaderService : LoaderService
        //private _redirectToEdoc: RedirectPage
    ) {
        this.route.params.subscribe(params => {
            this.ExptNo = (params["expt_no"]) ? params["expt_no"] : null;
            this.setViewData(this.ExptNo);
        });
    }

    ngOnChanges() {

    }

    setViewData(exptno) {
        this._LoaderService.display(true);
        const _jsonData = {
            exptno: exptno,
            cmpid: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.getData("Export/PageConsignmentView", _jsonData)
            .subscribe((data: any) => {
                this.viewData = data;
                this.containerData = data.Table1;
                if (this._loginService.getLogin()[0].ROLETYPE == "SA") {
                    this.edocView = 1;
                } else { if (data.Table6.length > 0) { this.edocView = data.Table6[0].VIEWFORM; } else { this.edocView = 0; } }
                this.deliveryData = data.Table6;
                if (this.viewData.Table2.length > 0) {
                    this.loadTrans = {
                        EXPT_LOAD_DATE: this.viewData.Table2[0].LOADDT,
                        EXPT_LOAD1_DATE: this.viewData.Table2[0].PORT1LOADDT,
                        EXPT_LOAD2_DATE: this.viewData.Table2[0].PORT2LOADDT,
                        EXPT_TRANSPORT1: this.viewData.Table2[0].TRANSPORT1,
                        EXPT_TRANSPORT2: this.viewData.Table2[0].TRANSPORT2
                    };
                }
                this._LoaderService.display(false);
            },
            
            (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.STATUSTEXT);this._LoaderService.display(false); },
            () => { });
    }

    // show(type, num) {
    //     this.links = type;
    //     if (num != null) {
    //         this.containerno = num;
    //         this.vessel = (this.viewData.Table[0].EXPT_VESSEL != undefined) ? this.viewData.Table[0].EXPT_VESSEL : null;
    //     }
    // }

    showClpView(containerno) {
        this.vessel = (this.viewData.Table[0].EXPT_VESSEL != undefined) ? this.viewData.Table[0].EXPT_VESSEL : null;
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);

        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/consignment-clp-view/' + this.ExptNo + '/' + containerno + '/' + this.vessel, "Clp_View", toolbar);
    }

    show(type, num) {
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        if (type == 'I') {
            window.open('./#/popup/consignment-exporter-invoice-detail/' + this.ExptNo, "Invoice_Details", toolbar);
        } else if (type == 'C') {
            window.open('./#/popup/consignment-chronology-view/' + this.ExptNo, "Chronology_view", toolbar);
        }
        else if (type == 'R') {
            window.open('./#/popup/consignment-remark-view/' + this.ExptNo, "Remark_View", toolbar);
        }
    }

    openEdoc() {
        // this._redirectToEdoc.redirectToNewTab("EDOC");        
         let URL = environment.edocumentIp + "eDocument-Links/View.html#/AutoRedirect?eformid=258&huhpnk=" + this._loginService.getLogin()[0].CMP_USERENCCODE + "&JOBNO=" + this.ExptNo + "&cmpcode=" + this._loginService.getLogin()[0].CMPCODE + "&citycode=" + this._loginService.getLogin()[0].CITYCODE + "&CurLogInIP=" + environment.edocumentIp
         let theTop = (screen.height / 2) - (510 / 2);
         let theLeft = (screen.width / 2) - (760 / 2);
         let toolbar = 'resizable=yes,scrollbars=no,width=740,height=490,status=no,left=' + theLeft + ',top=' + theTop
         let NewWin = window.open(URL, "EDOC_VIEW", toolbar);
         NewWin.focus();
     
     }
     
    // openWindow(orderno, styleno, concode) {
    //     let theTop = (screen.height / 2) - (483 / 2);
    //     let theLeft = (screen.width / 2) - (780 / 2);

    //     let toolbar = 'resizable=no,scrollbars=no,width=500,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    //     window.open('./#/popup/order-size-detail/' + this.ExptNo + '/' + orderno + '/' + styleno + '/' + concode, "Order_Size", toolbar);
    // }
   
}
