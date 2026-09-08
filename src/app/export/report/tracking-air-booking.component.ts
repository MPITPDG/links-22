import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    templateUrl: 'tracking-air-booking.component.html'
})
export class TrackingAirBookingReportComponent implements OnInit {
    ConsigneeList: Array<any> = [];
    SourcingAgentList: Array<any> = [];
    CityList: Array<any> = [];
    Type: string = 'Consignee';
    Consignee: any = null;
    SourcingAgent: any = null;
    Shipment: any = null;


    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService) {
    }

    ngOnInit() {
        this.CityList = [{ citycode: "All", citycode1: "All", cityname: "All" }];
        this._loginService.verifyRights('242', '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('View', data);  //For verify user access
            });
        this.pageLoad();
    }

    pageLoad() {
        this._loaderService.display(true);
        this._dataService.getData("Common/getCityList", {})
            .subscribe((data: any) => {
                data.Table.forEach((key) => {
                    this.CityList.push({ citycode: key.citycode, citycode1: key.citycode1, cityname: key.cityname });
                });
                this.CityList = JSON.parse(JSON.stringify(this.CityList));
                this.Shipment = this._loginService.getLogin()[0].CITYCODE;
            });
        this._dataService.getData("Export/Fill_dsr_PAGELOAD", {})
            .subscribe((data: any) => {
                this.ConsigneeList = data.Table;
                this.SourcingAgentList = data.Table1;
                this._loaderService.display(false);
            });
    }

    onSearch() {
        if (this.Type === 'Consignee') {
            if (this.Consignee == null) {
                alert('Please Select the Consignee Name. ');
                return false;
            }
        } else if (this.Type === 'Sourcing') {
            if (this.SourcingAgent == null) {
                alert('Please Select the Sourcing Agent. ');
                return false;
            }
        }
        
        let _jsonGet = {
            client: (this.Consignee != null) ? this.Consignee : '',
            agent: (this.SourcingAgent != null) ? this.SourcingAgent : '',
            origin: this.Shipment,
            cmpid: this._loginService.getLogin()[0].CMPID,
            cmpcode: this._loginService.getLogin()[0].CMPCODE
        };
        this._loaderService.display(true);
        this._dataService.getDownload("Export/Generate_Tracking_Air_Booking_Report", _jsonGet, { responseType: 'arraybuffer' })
            .subscribe((data: any) => {
                this._dataService.commonDownloadExcelFile(data, "RPT_TRACKING_AIR_BOOKING_REPORT_" + this._dataService.timeFormatAMPM() + ".xls");
                this._loaderService.display(false);
            });
    }
}