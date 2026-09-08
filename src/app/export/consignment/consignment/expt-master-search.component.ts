import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { OkModalComponent } from '../../../shared/common-modal.directive';
import { SharedDataSerice } from '../../export-share-data.service';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-search-modal',
    templateUrl: 'expt-master-search.component.html'
})
export class ExportMasterSearchComponent implements OnInit {
    @ViewChild('okModal', {static: false}) okModal: OkModalComponent;
    countryList: any = [];
    cityList: any = [];
    vesselList: any = [];
    searchList: any = [];
    searchHeaderText: string = "";

    checkWise: string = "1";

    numberWise: string = "EXPORTNO";
    numberName: string = "Export No.";
    numberText: any = "";

    vesselname: any = "";
    voyageno: any = "";
    searchby: any = null;

    shipmentWise: string = "SHIP_CUR";
    consigneeWise: string = "CON_CUR";

    shippersearchby: any = "COUNTRY";
    shippername: any = "";
    shippercountry: any = null;
    shippercity: any = null;
    shipperList: any = [];
    shipper: any = null;


    consigneesearchby: any = "COUNTRY";
    consigneename: any = "";
    consigneecountry: any = null;
    consigneeList: any = [];
    consignee: any = null;

    MAWBNO : string = "";
    DESTINATION	 : string = "";
    PKGS	 : string = "";
    GRWT : string = "";
    CHBLWT : string = "";
    PLANNEDFLIGHT  : string = "";
    ACTUALFLIGHT  : string = "";
    ETA : string = "";

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _router: Router,
        private _sharedEditExport: SharedDataSerice,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this._loginService.verifyRights('214', '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('View', data);
            });
        this.getData("PAGELOAD", "", "");
    }

    mainCheck(ctype) {
        this.checkWise = ctype;
    }

    numberOption(text, ntype) {
        this.numberWise = ntype;
        this.numberName = text;
    }

    changeShipmentType(stype) {
        this.shipmentWise = stype;
    }

    changeConsigneeType(stype) {
        this.consigneeWise = stype;
    }

    search() {
        let SearchType, Value;
        if (this.checkWise == '1') {
            if (this.numberText == "") {
                this._toasterService.toast('error', 'Alert', "Please Enter " + this.numberName); return false;
            }
            else if (this.numberWise == 'EXPORTNO') {
                if (this._loginService.getLogin()[0].CITYCODE =='LIL')
                {
                    if (this.numberText.length != 10) {
                        this._toasterService.toast('error', 'Alert', "Invalid Export number."); return false;
                    }
                }
                else{
                if (this.numberText.length != 15) {
                    this._toasterService.toast('error', 'Alert', "Invalid Export number."); return false;
                }
            }
            }
            Value = this.numberText;
            SearchType = this.numberWise;
        } else if (this.checkWise == '2') {
            if (this.searchby == null) { this._toasterService.toast('error', 'Alert', "Please select Vessel Name."); return false; }
            Value = this.searchby;
            SearchType = "VESSEL";
        }
        else if (this.checkWise == '3') {
            if (this.shipper == null) { this._toasterService.toast('error', 'Alert', "Please select Shipper Name."); return false; }
            Value = this.shipper;
            SearchType = this.shipmentWise;
        }
        else if (this.checkWise == '4') {
            if (this.consignee == null) { this._toasterService.toast('error', 'Alert', "Please select Shipper Name."); return false; }
            Value = this.consignee;
            SearchType = this.consigneeWise;
        }
        //Value = "011011820000005";//"011011810000022";//"011081710002162";//"011020210075028";//'E100394';//'E101781';//
        //SearchType = "EXPORTNO";//'SHIP_CUR';
        this.getSearchData(Value, SearchType);

    }

    getSearchData(value, stype) {
        const _jsonData = {
            Type1: stype,
            Type2: value,
            Type3: this._loginService.getLogin()[0].CMPCODE,
            Type4: this._loginService.getLogin()[0].CITYCODE
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentSearchList", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.length >0) {

                if (data.Table.length == 1) {
                    this.setValue(data.Table[0]);
                }
                else if (data.Table.length > 0) {
                    this.searchHeaderText = data.Table1[0].SEARCH_HEAD;
                    this.searchList = data.Table;

                   this.MAWBNO  = this.searchList[0].MAWBNO
                   this.DESTINATION	  = this.searchList[0].MAWBDEST
                   this.PKGS	= this.searchList[0].P_PKGS
                   this.GRWT  = this.searchList[0].P_GRWT
                   this.CHBLWT = this.searchList[0].P_CHBLWT
                   this.PLANNEDFLIGHT  = this.searchList[0].FLIGHTDTLS
                   this.ACTUALFLIGHT  = this.searchList[0].ACTFLIGHTDTLS
                   this.ETA = this.searchList[0].ETAPORT1

                }
                else { this.okModal.show(); }
            }
            else
            {
                this._toasterService.toast('error', 'Error',  "No record found");
            }
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            },
            () => {
            });
    }

    getData(ptype, vslname, voyageno) {
        const _jsonData = {
            Type: ptype,
            VslName: vslname,
            VoyageNo: voyageno
        };
        this._loaderService.display(true);
        return this._dataService.Common("Export/ConsignmentSearchFillDropdown", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (ptype == 'PAGELOAD') {
                    this.countryList = data.Table;
                    this.cityList = data.Table1;
                } else if (ptype == 'VSLWISE') {
                    this.vesselList = data.Table;
                }
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            },
            () => {
            });
    }

    getVessel() {
        this.getData("VSLWISE", this.vesselname, this.voyageno);
    }

    getShipper() {
        if (this.shippersearchby == 'COUNTRY') {
            if (this.shippercountry == null) { this._toasterService.toast('error', 'Alert', "Please Select Country"); return false; }
        } else if (this.shippersearchby == 'CITY') {
            if (this.shippercity == null) { this._toasterService.toast('error', 'Alert', "Please Select City"); return false; }
        }
        else if (this.shippersearchby == 'NAME') {
            if (this.shippername == "") { this._toasterService.toast('error', 'Alert', "Please Enter Name"); return false; }
        }
        let value = "";
        if (this.shippersearchby == 'COUNTRY') { value = this.shippercountry; }
        else if (this.shippersearchby == 'CITY') { value = this.shippercity; }
        else if (this.shippersearchby == 'NAME') { value = this.shippername; }
        else { value = "ALL"; }
        this.fillShipperConsignee('S', this.shippersearchby, value);
    }


    getConsignee() {
        if (this.consigneesearchby == 'COUNTRY') {
            if (this.consigneecountry == null) { this._toasterService.toast('error', 'Alert', "Please Select Country"); return false; }
        } else if (this.consigneesearchby == 'NAME') {
            if (this.consigneename == "") { this._toasterService.toast('error', 'Alert', "Please Enter Name"); return false; }
        }
        let value = "";
        if (this.consigneesearchby == 'COUNTRY') { value = this.consigneecountry; }
        else if (this.consigneesearchby == 'NAME') { value = this.consigneename; }
        else { value = "ALL"; }
        this.fillShipperConsignee('C', this.consigneesearchby, value);
    }

    fillShipperConsignee(ship_con, searchby, value) {
        const _jsonData = {
            Type: ship_con,
            VslName: searchby,
            VoyageNo: value
        };
        this._loaderService.display(true);
        return this._dataService.Common("Export/ConsignmentSearchShipperConsignee", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (ship_con == "S") {
                    this.shipperList = data.Table;
                } else {
                    this.consigneeList = data.Table;
                }
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            });
    }

    setValue(event) {
        if  (event.EXPTCANCEL == 'Y')
        {
            this._toasterService.toast("error", "Alert", "This DOCS. " + event.EXPTNO + " CANCELED"); 
            this._sharedEditExport.exportEditData = event;
            this._router.navigate(['export/Consignment/view', event.EXPTNO]);
        }
        else
        {
            if (event.EXPT_MODE == 'AIR') {
                if (event.JOBEXIST != 'NO') {
                    if (event.ACTUALFLIGHTDT != '' && event.CO2_EMITION_LVL != '0') {
                       // this._toasterService.toast("error", "Alert", "This Export No. " + event.EXPTNO + " Already Imported");
                        this._sharedEditExport.exportEditData = event;
                        this._sharedEditExport.jobcreationtype='M';
                        //this._router.navigate(['export/Consignment/view', event.EXPTNO]);
                        this.setEditAndRedirect(event.EXPTNO);
                    }  else if (event.ACTUALFLIGHTDT == '' || event.CO2_EMITION_LVL == '0') {
                       this._sharedEditExport.jobcreationtype='M';
                        this.setEditAndRedirect(event.EXPTNO);
                    // this._router.navigate(["export/consignment/edit-actual-flight-date", event.EXPTNO]);
                    }
                }
                else {
                    this._sharedEditExport.exportEditData = event;
                    this._sharedEditExport.jobcreationtype='M';
                    this.setEditAndRedirect(event.EXPTNO);
                }
            } else if (event.EXPT_MODE == 'SEA' && event.ISDIFFAIR =='0'  ) {
                if (event.JOBEXIST != 'NO') { 
                    this._toasterService.toast("error", "Alert", "This Export No. " + event.EXPTNO + " Already Imported"); 
                    this._sharedEditExport.exportEditData = event;
                    this._sharedEditExport.jobcreationtype='M';
                    this._router.navigate(['export/Consignment/view', event.EXPTNO]);
                }
                else {
                    this._sharedEditExport.exportEditData = event;
                    this._sharedEditExport.jobcreationtype='M';
                    this.setEditAndRedirect(event.EXPTNO);
                }                
            } 
            else if (event.EXPT_MODE == 'SEA' && event.ISDIFFAIR =='2'  ) {
                this._sharedEditExport.exportEditData = event;
                this._sharedEditExport.jobcreationtype='M';
                this.setEditAndRedirect(event.EXPTNO);
            }  
        }
    }

    setViewAndRedirect(exptno){
        this._toasterService.toast('info', '', "Please wait fetching data...");
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentEditSearchView", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this._sharedEditExport.exportEditData = data.Table[0];
                this._sharedEditExport.jobcreationtype='M';
                this._router.navigate(['export/Consignment/edit']);
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            });
    }

    setEditAndRedirect(exptno){
        this._toasterService.toast('info', '', "Please wait fetching data...");
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentEditSearchView", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this._sharedEditExport.exportEditData = data.Table[0];
                this._sharedEditExport.jobcreationtype='M';
                this._router.navigate(['export/Consignment/edit']);
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            });
    }
}