import { Component, OnInit} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router} from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { ToastCommonService } from '../../shared/service/toastService';
import { VesselSearchSharedDataService } from '../export-share-data.service';
import { LoaderService } from '../../shared/service/loader.service';

@Component({
    selector: 'app-container-iu',
    templateUrl: 'exp_sp_vessel_search.component.html'
})

export class ExptSpVesselSearch implements OnInit {
    private baseUrl: string = 'Export/Export_Vessel_List';

    vslName: any = "";
    vsl_voyno: any = "";

    vslcmpName: string = "-1";
    vessel: any = [];
    vesselSearch: any = [];
	searchmode:any="0";

    listdisable = true;
    vsldisable = false;
	buttonStatus: boolean = false;
    vsllist :string="0";
    
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _rtnosharedvataSerice: VesselSearchSharedDataService,
        private _vslportsharedvataSerice: VesselSearchSharedDataService,
        private loaderService: LoaderService,) {
    }

    ngOnInit(): void {
        this.loaderService.display(true);    
        this._loginService.verifyRights(231, '')
        .subscribe((data: any) => { this._loginService.checkVerify('View', data); });

        const jsonExport = { SEARCHMODE:"0", VSLNAME: this.vslName, VSL_VOY: this.vsl_voyno, CITYCODE:this._loginService.getLogin()[0].CITYCODE };
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {
                    this.vessel = data.Table1;
                    this.loaderService.display(false);      
                }
                else {

                    this._toasterService.toast('Warning', 'Warning', 'Data Loaded Successfully');
                    this.loaderService.display(false);      
                }
            });
    }
    onSearch() {
        let vslval;
        if (this.vsllist=="1")
        {
            if (this.vslName == undefined || this.vslName == null || this.vslName == "") {
                this._toasterService.toast('error', 'Error', "Please enter Vessel Name ");
                return false;
            }
            if (this.vsl_voyno == undefined || this.vsl_voyno == null || this.vsl_voyno == "") {
                this._toasterService.toast('error', 'Error', "Please enter Vessel Voyage ");
                return false;
            }
            vslval=this.vslName
        }
        else
        {
            if (this.vslcmpName == undefined || this. vslcmpName == null || this. vslcmpName == "-1") {
                this._toasterService.toast('error', 'Error', "Please select Vessel Name ");
                return false;
            }
            vslval=this.vslcmpName;

        }
        this.loaderService.display(true);    
        if (this.vsllist == "1")
        {
        const jsonExport = { SEARCHMODE: this.vsllist, VSLNAME: this.vslName, VSL_VOY: this.vsl_voyno, CITYCODE: this._loginService.getLogin()[0].CITYCODE };
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {
                    this.vesselSearch = data.Table1;
                    this.loaderService.display(false);
                    if (this.vesselSearch.length ==1)
                    {
                        this._rtnosharedvataSerice.RtnosharedData = data.Table1[0].VSL_RTNO;
                        this._vslportsharedvataSerice.vslPortsharedData = data.Table1[0].PORT;                      
                         this._router.navigate(['/export/container/container-vessel-view']);//container/container-vessel-view
                    }                   
                }
                else {
                    this._toasterService.toast('error', 'Error', 'No record found');
                    this.loaderService.display(false);    
                }
            });
        }
        else
        {
            let rtnos="",ports=""
            rtnos=this.vslcmpName.split('|')[0];
            ports=this.vslcmpName.split('|')[1];
            this._rtnosharedvataSerice.RtnosharedData =rtnos;
            this._vslportsharedvataSerice.vslPortsharedData = ports;         
            this._router.navigate(['/export/container/container-vessel-view']);//container/container-vessel-view
           
        }



    }
    ListOnclick(Rtno,Port)
    {
        this._rtnosharedvataSerice.RtnosharedData = Rtno;
        this._vslportsharedvataSerice.vslPortsharedData = Port;
        this._router.navigate(['/export/container/container-vessel-view']);//container/container-vessel-view
    }
}