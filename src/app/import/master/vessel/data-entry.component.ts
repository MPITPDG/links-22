import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-import-master-vessel-data-entry',
    templateUrl: 'data-entry.component.html',
    styleUrls: ['../master-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EntryVesselMasterComponent implements OnInit {
    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd-mmm-yyyy',
        inline: false,
        height: '30px',
        width: '100%',
        componentDisabled: false,
        selectionTxtFontSize: '13px',
        editableDateField: false,
        sunHighlight: true,
        satHighlight: true,
        firstDayOfWeek: 'su',
        openSelectorTopOfInput: false,
        openSelectorOnInputClick: true,
        selectorHeight: '198px',
        selectorWidth: '200px'
    };
    Header: string = "VESSEL MASTER - ADD";

    Id: string = '0';
    Name: string = "";
    VoyageNo: string = "";
    IGMNo: string = "";
    ArrivalPort: any = '0';
    BerthNo: string = "";
    ExpectedArrivalDate: any = null;
    ActualArrivalDate: any = null;

    ArrivalList: Array<any> = [];

    /** rotation number from VesselDetails when editing; assigned by the API on save */
    Rotation: string = "";
    /** read-only context shown in the Record aside */
    BranchName: string = "";
    CreatedBy: string = "";

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        const login = this._loginService.getLogin();
        if (login && login[0]) {
            this.BranchName = login[0].CITYNAME || "";
            this.CreatedBy = login[0].CMP_USERNAME || "";
        }
        this._activatedRoute.params.subscribe(params => {
            if (params["param"]) {
                this.Id = params["param"];
                this.Header = 'VESSEL MASTER - UPDATE';
                this.verifyPermission(121, "Modify");
                this.populateForEdit(this.Id);
            }
            else {
                this.Header = 'VESSEL MASTER - ADD';
                this.verifyPermission(121, "Add");
            }
        });
    }

    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                if (this._loginService.checkVerify(userMode, data)) {
                    this.fillData();
                } else { this._loaderService.display(false); }
            });
    }

    fillData() {
        this._dataService.getData("Import/GetArrivalPort", {})
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.ArrivalList = (data && Array.isArray(data.Table)) ? data.Table : [];
            });
    }

    populateForEdit(id) {
        this._loaderService.display(true);
        this._dataService.getData("Import/VesselDetails", { vessel_id: id })
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (!data || !Array.isArray(data.Table) || data.Table.length == 0) { return; }
                this.Id = data.Table[0]["pk_vsl_id"];
                this.Name = data.Table[0]["vsl_name"];
                this.VoyageNo = data.Table[0]["vsl_voyageno"];
                this.IGMNo = data.Table[0]["vsl_igmno"];
                this.ArrivalPort = data.Table[0]["vsl_Arrivalport"];
                this.BerthNo = data.Table[0]["vsl_Berthno"];
                this.ExpectedArrivalDate = (data.Table[0]["vsl_ExpectedDt"].trim() != "") ? this._dataService.stringdttoArry(this._dataService.returnMonthMMFromMMM(data.Table[0]["vsl_ExpectedDt"])) : null;
                this.ActualArrivalDate = (data.Table[0]["vsl_ActualDt"].trim() != "") ? this._dataService.stringdttoArry(this._dataService.returnMonthMMFromMMM(data.Table[0]["vsl_ActualDt"])) : null;
                this.Rotation = data.Table[0]["vsl_rotation"] || data.Table[0]["vsl_Rotation"] || "";
            });
    }

    submit() {
        if (this.Name == '') {
            alert("Name could not be blank.");
            return false;
        }
        if (this.ArrivalPort == '0') {
            alert("Please Select Arrival Port.");
            return false;
        }
        if (this.ExpectedArrivalDate == null) {
            alert("Expected Arrival Date could not be blank.");
            return false;
        }
        let _jsonData = {
            Id: this.Id,
            Name: this.Name,
            VoyageNo: this.VoyageNo,
            IGMNo: this.IGMNo,
            ArrivalPort: this.ArrivalPort,
            BerthNo: this.BerthNo,
            ExpectedArrivalDate: (this.ExpectedArrivalDate) ? this.ExpectedArrivalDate.formatted : "",
            ActualArrivalDate: (this.ActualArrivalDate) ? this.ActualArrivalDate.formatted : "",
            MakerIp: this._loginService.getLogin()[0].MAKERIP,
            MakerId: this._loginService.getLogin()[0].CMPID,
            CityCode1: this._loginService.getLogin()[0].CITYCODE1
        }
        this._loaderService.display(true);
        this._dataService.Common("Import/Imp_Vessel_IU", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table[0]["STATUS"] == "100") {
                    if (this.Id == '0') {
                        alert("Vessel Rotation Number : " + data.Table[0]["ROTATION"] + " added successfully!");
                    }
                    else {
                        alert("Vessel Rotation Number : " + data.Table[0]["ROTATION"] + " updated successfully!");
                        this._router.navigate(["./import/master/vessel/search"]);
                    }
                    this.cancel();
                }
            });
    }

    cancel() {
        if (this.Id == '0') { this.reset(); }
        else { this._router.navigate(["./import/master/vessel/search"]); }
    }

    reset() {
        this.Id = "0";
        this.Name = "";
        this.VoyageNo = "";
        this.IGMNo = "";
        this.ArrivalPort = "0";
        this.BerthNo = "";
        this.ExpectedArrivalDate = null;
        this.ActualArrivalDate = null;
        this.Rotation = "";
    }

}