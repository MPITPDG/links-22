 
 
import { Component, OnInit, NgModule} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
 
import { Router} from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { ToastCommonService } from '../../shared/service/toastService';
import { VesselSearchSharedDataService, ContainerIUSharedDataService } from '../export-share-data.service';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    selector: 'app-container-iu',
    templateUrl: 'exp_sp_container_vessel_vw.component.html' 
     

})



export class ExptSpContVslvw implements OnInit {
    private baseUrl: string = 'Export/Export_container_View';

    showLoader: boolean;
    //status: any = {
    //    isFirstOpen: true,
    //    isOpen: true
    //};

    vslRtno: any = "";
    vslName: any = "";
    vslVoyno: any = "";
    vslLstCartdt: any = "";
    vslEtd: any = "";
    vslActDepart: any = "";

    VSL_NAMERot: any = "";
    VSL_VOYAGE_ETD: any = "";
    PORT: any = "";
    ORIGINPORT: any = "";
    AGT_NAME: any = "";
    SHPGLINE: any = "";
    CONTAINERNO: any = "";
    SIZE: any = "";
    CONTAINERSTATUS: any = "";
    DESTPORT: any = "";
    DESTPORT1: any = "";
    AGTSEALNO: any = "";
    SINGLESHPR: any = "";
    HSTUFFED: any = "";
    STUFFED_AT: any = "";
    CUSTSEALNO: any = "";
    FREIGHT_CHARGE: any = "";
    BAF_CHARGE: any = "";
    THCNAME: any = "";
    THC_CHARGE: any = "";
    OTHERNAME: any = "";
    OTHER_CHARGE: any = "";
    REMARK: any = "";
    FREIGHT: any = "";
    O_CUR1: any = "";
    OCURRATE1: any = "";
    O_CUR2: any = "";
    OCURRATE2: any = "";
    D_CUR1: any = "";
    DCURRATE1: any = "";
    D_CUR2: any = "";
    DCURRATE2: any = "";

    vsldetList: any = [];
    vsAgtList: any = [];
    contList: any = [];
    exJoblist: any = [];
    orderList: any = [];
    filtjoblist: any = [];

    collapse: boolean = true;
    collapse1: boolean = false;
    Expand: boolean = true;
    Expand1: boolean = false;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _vslsharedvataSerice: VesselSearchSharedDataService,
        private _ContainersharedvataSerice: ContainerIUSharedDataService,
        private loaderService: LoaderService) {
    }


    ngOnInit(): void {
        this._ContainersharedvataSerice.ContainerID = undefined;
       // this._vslsharedvataSerice.RtnosharedData = undefined;

        //this._vslsharedvataSerice.vslPortsharedData = undefined //this.PORT;

       this.loaderService.display(true);
        const jsonExport = { vsl_rtno:  this._vslsharedvataSerice.RtnosharedData , Port: this._vslsharedvataSerice.vslPortsharedData };
     
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {
                    this.vslRtno = data.Table[0].VSL_RTNO;
                    //this.vslName = data.Table1[0].VSL_NAME;
                    //this.vslVoyno = data.Table1[0].VSL_VOYNO;
                    //this.vslLstCartdt = data.Table1[0].CARTING;
                    //this.vslEtd = data.Table1[0].ETD;
                    //this.vslActDepart = data.Table1[0].SAILING;

                    this.vsldetList = data.Table1;

                    this.VSL_NAMERot = this.vsldetList[0].VSL_NAME;
                    this.VSL_VOYAGE_ETD = this.vsldetList[0].VSL_VOYAGE_ETD;
                    this.PORT = this.vsldetList[0].PORT;
                    this.ORIGINPORT = this.vsldetList[0].ORIGINPORT;

                    this.vslLstCartdt = this.vsldetList[0].CARTING;

                    this.vslActDepart = this.vsldetList[0].SAILING;

                    this.contList = data.Table2;                    

                    this.exJoblist = data.Table3;

                    this.orderList = data.Table4;
                    this.loaderService.display(false);
                }
                else {

                    this._toasterService.toast('error', 'Error', 'No record found');
                    this.loaderService.display(false);
                }
            });
    }
    getContJob(containerno) {
        let updateItem = this.contList.find(item => item.CONTAINERNO === containerno);
        let index1 = this.contList.indexOf(updateItem);
        
        if (this.contList[index1]["CHECK"] == true) {
            this.contList[index1]["CHECK"] = null;
        }
        else {
            for (let obj = 0; obj < this.contList.length; obj++) {
                this.contList[obj]["CHECK"] = null;
            }

            let index = this.contList.indexOf(updateItem);
            this.contList[index]["CHECK"] = true;
            this.filtjoblist = this.exJoblist.filter((joblist: any) => joblist.CONTIANERNO_E === containerno);
        }




    }
    contineronclick(containerId, VERIFIED)
    {
        if (VERIFIED == "NO") {
            let ports=""
            this._ContainersharedvataSerice.ContainerID = containerId;
            this._vslsharedvataSerice.RtnosharedData = this.vslRtno;
            ports=this.PORT.split(':')[1];
            this._vslsharedvataSerice.vslPortsharedData = ports;//this.PORT;

            this._router.navigate(['/export/container/form']);
        }
        else {
            this._toasterService.toast('Message', 'Message', "Container is verified You can't modified");
        }
    }

    AddContainer()
    {
        this._loginService.verifyRights(231, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });
        
        if (this.vslActDepart==""){
        this._vslsharedvataSerice.RtnosharedData = this.vslRtno;

        this._vslsharedvataSerice.vslPortsharedData = this._vslsharedvataSerice.vslPortsharedData ;

        this._router.navigate(['/export/container/form']);
        }
        else
        {
            this._toasterService.toast('warning', 'Message', "vessel is sailed !");
            return false;
        }
    }
   /*  ClpDownload(containerno) {
        this._toasterService.toast('info', 'Complete', "Download Clp Excel format");
        this.loaderService.display(true);
        this.baseUrl = "Export/Export_containerCLP_Excl_Generation"
        //this._ContainersharedvataSerice.Containerno = this.CONTAINERNO;
        //this._vslsharedvataSerice.RtnosharedData = this.vslRtno;
        this._vslsharedvataSerice.vslPortsharedData = "MAA" //this.PORT;

        const jsonExport = { ContainerNo: containerno, vsl_rtno: this.vslRtno, vsl_port: "MAA", CMPCODE: "01", CITYCODE: "MAA" };

        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {
                    this.loaderService.display(false);

                }
                else {
                    this.loaderService.display(false);
                    this._toasterService.toast('error', 'Error', data.Table[0].statusText);
                    this.loaderService.display(false);
                }
            });
    } */

    ClpDownload(containerno)
    {
        this._toasterService.toast('info', 'processing', "Download Clp Excel format");
        this.loaderService.display(true);
         

      //  const jsonExport = { ContainerNo: containerno, vsl_rtno: this.vslRtno, vsl_port:this.vslport, CMPCODE: "01", CITYCODE: "MAA" };
      const jsonExport = { ContainerNo: containerno, vsl_rtno: this.vslRtno, vsl_port:  this._vslsharedvataSerice.vslPortsharedData , CMPCODE: this._loginService.getLogin()[0].CMPCODE, CITYCODE: this._loginService.getLogin()[0].CITYCODE };

        this._dataService.getDownload("Export/ConvertHtmlToExcelDownload", jsonExport,{responseType:'arraybuffer'})
            .subscribe((data: any) => {
                this._dataService.downloadFileByUrl(data)
                this.loaderService.display(false);
               
            });
    }

    back() {
        //this.result.emit(true);
        this._router.navigate(['/export/container/vessel-view']);
    }

}


