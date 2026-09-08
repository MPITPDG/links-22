import { Component, OnInit, Input, OnChanges} from '@angular/core';
import { AuthService } from '../../shared/service/authService';
import { DataService } from '../../shared/service/dataService';
import { Router} from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
 
@Component({
    selector: 'app-container-list',
    templateUrl: 'export-list-container.component.html'

})
export class listcontainer implements OnInit {
    Searchdata: any=[];
    Exportdata:any[];
    Palletdata:any[];
    Containerno: any;
    vslRtno:any;
    vslport:any;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService ,
        private loaderService: LoaderService       ) {
    }
    ngOnInit(): void {
        this._loginService.verifyRights(231, '')
        .subscribe((data: any) => { this._loginService.checkVerify('View', data); });
    }
    serchList() {
        this.loaderService.display(true);
        if (this.Containerno === undefined || this.Containerno === null || this.Containerno === "") {
            this._toasterService.toast('error', 'Error', "Please enter Container no");
            return false;
        }
        const jsonExport = { ContainerID: this.Containerno};
        this._dataService.Common('Export/listcontainer', jsonExport)
        .subscribe((data: any) => {

            if (data.Table[0].STATUS === "100") {
               
                this.Searchdata = data.Table;  
               this.vslRtno=this.Searchdata[0].EXPT_VESSEL;
               this.vslport=this.Searchdata[0].ORIGINCITY;

                this.Exportdata=data.Table1;
                this.Palletdata =data.Table2;              
                this.loaderService.display(false);  
            } else {
                this.loaderService.display(false);
                this._toasterService.toast('error', 'Error', data.Table[0].statusText);
            }
        });
   
    }
 
    ClpDownload(containerno)
    {
        this._toasterService.toast('info', 'Complete', "Download Clp Excel format");
        this.loaderService.display(true);
         

        const jsonExport = { ContainerNo: containerno, vsl_rtno: this.vslRtno, vsl_port:this.vslport, CMPCODE: this._loginService.getLogin()[0].CMPCODE, CITYCODE: this._loginService.getLogin()[0].CITYCODE };

        this._dataService.getDownload("Export/ConvertHtmlToExcelDownload", jsonExport,{responseType:'arraybuffer'})
            .subscribe((data: any) => {
                this._dataService.downloadFileByUrl(data)
                this.loaderService.display(false);
               
            });
    }

  consignmentview(exptno)
    {
         
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);

        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popupexport/Consignment/view/'+exptno+'/'   , "consignmentview", toolbar);

        
       // this._router.navigate(['importfra/delivery/delivery-bonmagasinier'])
    }
    back() {
        //this.result.emit(true);
        this._router.navigate(['/export/list-container/container']);
    }


}
