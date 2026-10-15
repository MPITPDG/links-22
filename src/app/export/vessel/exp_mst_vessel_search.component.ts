import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router} from '@angular/router'; 
import { LoginService } from '../../shared/service/loginService'; 
import { ToastCommonService } from '../../shared/service/toastService';
import { SharedDataSerice } from '../export-share-data.service';
import { LoaderService } from '../../shared/service/loader.service';

@Component({
    selector: 'app-vessel-search',
    templateUrl: 'exp_mst_vessel_search.component.html',
    styleUrls: ['./vessel-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class VesselSearchComponent implements OnInit {
    
    Searchlist: any=[];
    vslSname: any;
    vslSvoyno: any;
    /** true once a search has come back, so the empty state can tell "not searched yet" from "nothing found" */
    searched = false;
     

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

                // Fail soft: a reply without a Table is an empty result, not a crash.
                const rows = (data && Array.isArray(data.Table)) ? data.Table : [];
                this.searched = true;
                if (rows.length && rows[0].STATUS === "100") {
                    this.Searchlist = rows;
                } else if (rows.length) {
                    this._toasterService.toast('error', 'Error', rows[0].MSG);
                } else {
                    this.Searchlist = [];
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