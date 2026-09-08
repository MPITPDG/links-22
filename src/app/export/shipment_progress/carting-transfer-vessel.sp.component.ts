import { Component, OnInit, OnChanges} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { Router} from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { cartingVslAgnt } from '../export-share-data.service';
import { LoaderService } from '../../shared/service/loader.service';

@Component({
    selector: 'app-transfer-carting-sea',
    templateUrl: 'carting-transfer-vessel.sp.component.html'

})
export class TransfervslCartingSea implements OnInit, OnChanges {
    private baseUrl: string = 'Export/Carting_vsl_agent_populate';
    vslnameList: any = [];
    vslAgentlist: any = [];
    Agentlist: any = [];
    VslPortlist: any = [];

    VslName: any = "";
    VslAgent: any = "";
    VslPort: any = [];
    Vslrotation: any = [];
    Exptno: any = [];
    Agtcode: any = "";
    headerType:string= 'SHIPMENT PROGRESS - JOB VESSEL TRANSFER'

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService,
           ) {
    }
    ngOnChanges() {
    }
    ngOnInit() {
        this.loaderService.display(true);       
       
        //userrights add mode
     this._loginService.verifyRights(277, '')
     .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });
        const jsonExport = { CITYCODE: this._loginService.getLogin()[0].CITYCODE};
        this._dataService.getData(this.baseUrl, jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {
                    this.vslnameList = data.Table;
                    this.vslAgentlist = data.Table1;
                    this.loaderService.display(false);      
                } else {
                    this._toasterService.toast('error', 'Error', data.Table[0].statusText);
                    this.loaderService.display(false);      
                }
            });
    }

    onAgentSelect(RtNo) {
        let port: any = [];
        this.VslPortlist = this.vslnameList.filter((linerlist: any) => linerlist.RTNOPRT == RtNo);// this.vslnameList[0].VSL_PORT;
         
    
        port = this.VslPortlist[0].RTNOPRT;
        this.VslPort = port.split("|")[1];
        this.Vslrotation = port.split("|")[0];

        this.Agentlist = this.vslAgentlist.filter((linerlistnew: any) => linerlistnew.vsl_rtno == this.Vslrotation);
    }
    onTransfervsl()
    {

        //VSL_PORT
        if (this.VslName =="")
        {
            this._toasterService.toast('warning', 'warning', "Please select vessel first");
            return false;
        }
        if (this.Exptno=="")
        {
            this._toasterService.toast('warning', 'warning', "Please enter ex-Jobno");
            return false;
        }
        let listcart: any = [];
        listcart = this.vslnameList.filter((linerlist: any) => linerlist.RTNOPRT == this.VslName);
        this.VslPort = this.VslPortlist[0].RTNOPRT;
        this.VslPort = this.VslPort.split("|")
        this.VslPort[0]
       

        const jsonExport = { vsl_rtno: this.VslPort[0], vslagent: this.VslAgent, port: this.VslPort[1], exptno: this.Exptno, citycode:this._loginService.getLogin()[0].CITYCODE, cmpcode:this._loginService.getLogin()[0].CMPCODE, cmpid:this._loginService.getLogin()[0].CMPID};
        this._dataService.Common('Export/Carting_Sea_VslTransfer', jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {
                    this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT)
                    
                } else {
                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                }
            });
    }
    
}