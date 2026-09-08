import { Component, OnInit, ViewChild, ElementRef ,ViewEncapsulation} from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-import-air-search',
    templateUrl: 'search.component.html',
    styleUrls: ['../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None

})
export class AirSearchComponent implements OnInit {
    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '16px',
        width: '120px',
        componentDisabled: false,
        selectionTxtFontSize: '12px',
        editableDateField: false,
        sunHighlight: true,
        satHighlight: true,
        firstDayOfWeek: 'su',
        openSelectorTopOfInput: false,
        openSelectorOnInputClick: true,
        selectorHeight: '198px',
        selectorWidth: '200px'
    };
    ImporterList: any = [];
    BillToList: any = [];
    VesselList: any = [];
    AgentList: any = [];
    searchList: any = [];

    displayType: string = 'SEARCH';
    searchHeaderText: string = 'List of Air';
    Mode: string = 'Air';
    Type: string = 'CODE';
    ImportCode: any = '';
    ImportFromDate: any = null;
    ImportToDate: any = null;
    Importer: any = null;
    ImporterType: string = 'All';
    BillTo: any = null;
    BillToType: string = 'All';
    Vessel: any = null;
    VesselType: string = 'All';
    Agent: any = null;
    AgentType: string = 'All';
    GlFromDate: any = null;
    GlToDate: any = null;
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _router: Router,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this.verifyPermission(125, "Modify");
    }

    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                if (this._loginService.checkVerify(userMode, data)) {
                    this.fillCommonDropdownList();
                } else { this._loaderService.display(false); }
            });
    }

    fillCommonDropdownList() {
        const _jsonData = {
            citycode: this._loginService.getLogin()[0].CITYCODE,
        };
        this._dataService.getData("Import/Fill_Dropdown_Report_Search", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.ImporterList = data.Table;
                this.BillToList = data.Table;
                this.VesselList = data.Table1;
                this.AgentList = data.Table;
            });
    }

    fnValidate_Code(): boolean {
        if (this.ImportCode.trim().length === 0) {
            alert("Please Enter Import Code.");
            return false;
        } else if (this.ImportCode.trim().length != 15) {
            alert("Invalid Import Code.");
            return false;
        }
        return true;
    }
    fnValidate_Date(): boolean {
        if (!this.ImportFromDate) {
            alert("Please select From Date.");
            return false;
        }
        else if (!this.ImportToDate) {
            alert("Please select To Date.");
            return false;
        }
        else if (!this._dataService.DateFromAndToComparision(this.ImportFromDate.formatted,this.ImportToDate.formatted)) {
            alert("To Date should be greater than From Date");
            return false;
        }
        return true;
    }
    fnValidate_Importer(): boolean {
        if (!this.Importer) {
            alert("Please select Importer.");
            return false;
        }
        return true;
    }
    fnValidate_BillTo(): boolean {
        if (!this.BillTo) {
            alert("Please select Bill To.");
            return false;
        }
        return true;
    }
    fnValidate_Vessel(): boolean {
        if (!this.BillTo) {
            alert("Please select Vessel Name.");
            return false;
        }
        return true;
    }
    fnValidate_Agent(): boolean {
        if (!this.Agent) {
            alert("Please select Agent Name.");
            return false;
        }
        return true;
    }
    fnValidate_Gl(): boolean {
        if (!this.GlFromDate) {
            alert("Please select From Date.");
            return false;
        }
        else if (!this.GlToDate) {
            alert("Please select To Date.");
            return false;
        }
        else if (!this._dataService.DateFromAndToComparision(this.ImportFromDate.formatted, this.ImportToDate.formatted)) {
            alert("To Date should be greater than From Date");
            return false;
        }
        return true;
    }

    SqlDate(strdateP) {
        if (strdateP != "" || strdateP != undefined) {
            let strdate = strdateP.split("/");
            let StrSqlDate = strdate[1] + "/" + strdate[0] + "/" + strdate[2];
            return StrSqlDate;
        }
        else return "";
    }


    search() {
        let SearchType = "";
        if (this.Type == 'CODE') { if (this.fnValidate_Code()) { SearchType = "1"; this.getData(SearchType); }; }
        else if (this.Type == 'DATE') { if (this.fnValidate_Date()) { SearchType = "2"; this.getData(SearchType); } }
        else if (this.Type == 'IMPORTER') { if (this.fnValidate_Importer()) { SearchType = "3"; this.getData(SearchType); } }
        else if (this.Type == 'BILLTO') { if (this.fnValidate_BillTo()) { SearchType = "4"; this.getData(SearchType); } }
        else if (this.Type == 'VESSEL') { if (this.fnValidate_Vessel()) { SearchType = "5"; this.getData(SearchType); } }
        else if (this.Type == 'AGENT') { if (this.fnValidate_Agent()) { SearchType = "6"; this.getData(SearchType); } }
        else if (this.Type == 'GL') { if (this.fnValidate_Gl()) { SearchType = "7"; this.getData(SearchType); } }
    }

    getData(searchtype) {
        const _jsonData = {
            Mode: this.Mode,
            ImportCode: this.ImportCode,
            ImportFromDate: (this.ImportFromDate) ? this.SqlDate(this.ImportFromDate.formatted) : "",
            ImportToDate: (this.ImportToDate) ? this.SqlDate(this.ImportToDate.formatted) : "",
            Importer: (this.Importer) ? this.Importer : "",
            ImporterType: this.ImporterType,
            BillTo: (this.BillTo) ? this.BillTo : "",
            BillToType: this.BillToType,
            Vessel: (this.Vessel) ? this.Vessel : "",
            VesselType: this.VesselType,
            Agent: (this.Agent) ? this.Agent : "",
            AgentType: this.AgentType,
            GlFromDate: (this.GlToDate) ? this.SqlDate(this.GlToDate.formatted) : "",
            GlToDate: (this.GlToDate) ? this.SqlDate(this.GlToDate.formatted) : "",
            SearchType: searchtype,
            CityCode1: this._loginService.getLogin()[0].CITYCODE1,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
        };
        this._loaderService.display(true);
        this._dataService.Common("Import/Report_Search", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
              //  console.log(data);
                if (data.Table.length == 0) {
                    this._toasterService.toast("warning", "Alert", "No record found");
                }
                else if (data.Table.length == 1) {
                    this._router.navigate(["./import/air/update-data/", data.Table[0].pk_ImpoterId]);
                }
                else if (data.Table.length > 1) {
                    this.displayType = 'LIST';
                    this.searchList = data.Table;
                }
            });
    }

    redirectToEdit(pkid) {
        this._router.navigate(["./import/air/update-data/", pkid]);
    }

}