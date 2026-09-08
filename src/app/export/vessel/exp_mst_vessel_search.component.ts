import { Component, OnInit} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router} from '@angular/router'; 
import { LoginService } from '../../shared/service/loginService'; 
import { ToastCommonService } from '../../shared/service/toastService';
import { SharedDataSerice } from '../export-share-data.service';
import { LoaderService } from '../../shared/service/loader.service';

@Component({
    selector: 'app-vessel-search',
    templateUrl: 'exp_mst_vessel_search.component.html'

})
export class VesselSearchComponent implements OnInit {
    
    Searchlist: any=[];
    vslSname: any;
    vslSvoyno: any;
     

    private baseUrl: string  = "";

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _vslsharedvataSerice: SharedDataSerice,
        private loaderService: LoaderService,
    ) {
        
    }
    ngOnInit(): void {
        this._loginService.verifyRights(413, '')
        .subscribe((data: any) => { this._loginService.checkVerify('View', data); });


    }
    serchList() {
        this.baseUrl = 'Export/ExportVslMst_Search';

        this._loginService.verifyRights(413, '')
        .subscribe((data: any) => { 
            this._loginService.checkVerify('View', data); 
            
        });
       
      //  var citycode    = this._loginService.getCity();
        if (this.vslSname === undefined || this.vslSname === null || this.vslSname === "") {
            this._toasterService.toast('error', 'Error', "Please enter vessel ");
            return false;
        }
        if (this.vslSvoyno === undefined || this.vslSvoyno === null || this.vslSvoyno === "") {
            this._toasterService.toast('error', 'Error', "Please enter voyage no");
            return false;
        }
        const jsonExport = {
            VSL_NAME: this.vslSname,
            VSL_VOYNO: this.vslSvoyno,
            citycode:  this._loginService.getLogin()[0].CITYCODE
        };
       
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {

                if (data.Table[0].STATUS === "100") {
                    this.Searchlist = data.Table;                   
                } else {
                    this._toasterService.toast('error', 'Error', data.Table[0].MSG);
                }
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            },
            () => {
            });
    }
     
    ListOnclick(vslrTno)
    {
        this._vslsharedvataSerice.sharedData = vslrTno;
        this._router.navigate(['/export/vessel/form']);
    }
    
}