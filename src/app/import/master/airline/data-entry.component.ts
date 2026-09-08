import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-import-master-airline-data-entry',
    templateUrl: 'data-entry.component.html'
})
export class EntryAirlineMasterComponent implements OnInit {
    Header: string = "AIRLINE MASTER - ADD";
    Id: string = '0';
    AirlineCodeI: string = '';
    AirlineCodeII: string = '';
    AirlineName: string = '';
    ErrorType: string = '0';
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this._activatedRoute.params.subscribe(params => {
            if (params["param"]) {
                this.Id = params["param"];
                this.Header = 'AIRLINE MASTER - UPDATE';
                //this.verifyPermission(121, "Modify");
            }
            else {
                this.Header = 'AIRLINE MASTER - ADD';
                //this.verifyPermission(121, "Add");
            }
        });
    }

    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (this._loginService.checkVerify(userMode, data)) {
                    if (this.Id != '0') {
                        this.populateForEdit(this.Id);
                    }
                }
            });
    }

    populateForEdit(id) {
        this._loaderService.display(true);
        this._dataService.getData("Import/AirlineDetails", { id: id })
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.Id = data.Table[0]["pk_ArilineId"];
                this.AirlineCodeI = data.Table[0]["Airline_Code"].substring(0, 3);
                this.AirlineCodeII = data.Table[0]["Airline_Code"].substring(3);
                this.AirlineName = data.Table[0]["Airline_Name"];
            });
    }

    submit() {
        if (this.AirlineCodeI.trim() == '') { this.ErrorType = '1'; return false; }
        else if (this.AirlineCodeI.trim() != '') {
            if ((this.AirlineCodeI.trim().length) < 3) { this.ErrorType = '1.1'; return false; }
        }
        if (this.AirlineCodeII.trim() == '') { this.ErrorType = '2'; return false; }
        else if (this.AirlineCodeII.trim() != '') {
            if ((this.AirlineCodeII.trim().length) < 4) { this.ErrorType = '2.1'; return false; }
        }
        if (this.AirlineName.trim() == '') { this.ErrorType = '3'; return false; }
        this.ErrorType = '0';
        let _jsonData = {
            Id: this.Id,
            AirlineCode: this.AirlineCodeI + this.AirlineCodeII,
            AirlineName: this.AirlineName,
            MakerIp: this._loginService.getLogin()[0].MAKERIP,
            MakerId: this._loginService.getLogin()[0].CMPID
        }
        this._loaderService.display(true);
        this._dataService.Common("Import/Imp_Airline_IU", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table[0]["STATUS"] == "100") {
                    if (this.Id == '0') {
                        alert("The Airline Code "+ data.Table[0]["AirlineCode"] +" added successfully!");
                    } else {
                        alert("The Airline Code "+ data.Table[0]["AirlineCode"] +" updated successfully!");
                    }
                    this.cancel();
                }
            });
    }

    cancel() {
        if (this.Id == '0') { this.reset(); }
        else { this._router.navigate(["./import/master/airline/search"]); }
    }

    reset() {
        this.Id = '0';
        this.AirlineCodeI = '';
        this.AirlineCodeII = '';
        this.AirlineName = '';
    }

}