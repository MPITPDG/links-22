import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import {Router} from '@angular/router';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoginService } from '../../../shared/service/loginService';
import { SharedDataSerice } from '../../export-share-data.service';
import { ButtonService } from '../../../shared/common-font-changer.directive';

@Component({
    templateUrl: 'order-booking-list.component.html'
})
export class OrderBookingListComponent implements OnInit {

    ExporterName: any = '';
    ConsigneeName: any = '';
    OrderList: any = [];
    TempOrderList: any = [];
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _sharedconsig: SharedDataSerice,
        private _disabled: ButtonService) { }

    ngOnInit() {
        if (this._sharedconsig.sharedData === undefined) {
            this._toasterService.toast('error', 'info', "Your data is lost due to page refresh.");
            this._router.navigate(['export/Consignment/start']);
            return false;
        }
        this._disabled.disableButton(this.submitButton);
        this.ExporterName = this._sharedconsig.sharedData.exportername;
        this.ConsigneeName = this._sharedconsig.sharedData.consigneename;
        this.getOrderList(this._sharedconsig.sharedData.consigneeid, this._sharedconsig.sharedData.modeofship);
    }

    getOrderList(concode, mode) {
        const _jsonData = {
            Concode: concode,
            Mode: mode,
            Citycode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData("Export/OrderBookingList", _jsonData)
            .subscribe((data: any) => {
                this._disabled.enableButton(this.submitButton);
                if (data.Table.length > 0) {
                    if (data.Table[0].STATUS == undefined) {
                        this.OrderList = data.Table;
                        for (let obj in this.OrderList) {
                            this.OrderList[obj]["Check"] = false;
                        }
                        for (let obj in this.OrderList) {
                            this.TempOrderList.push({
                                ORDERNO: this.OrderList[obj]["ORDERNO"],
                                STYLENO: this.OrderList[obj]["STYLENO"],
                                PCS: this.OrderList[obj]["PCS"],
                                TYPEOFPCS: this.OrderList[obj]["TYPEOFPCS"],
                                ID: this.OrderList[obj]["ID"],
                                APPFRMCON: this.OrderList[obj]["APPFRMCON"]
                            });
                        }
                    } else {
                        this._toasterService.toast("error", "Error", data.Table[0].STATUSTEXT);
                    }
                } else {
                    this._router.navigate(['export/Consignment/main']);
                }
            });
    }

    setPieces(id, check) {
        if (check == true) {
            let filterData = this.TempOrderList.filter((filter: any) => filter.ID == id)[0].PCS;
            let updateItem = this.OrderList.find(item => item.ID === id);
            let index = this.OrderList.indexOf(updateItem);
            this.OrderList[index]["PCS"] = filterData;
        }
    }

    checkPieces(id, pieces) {
        let filterData = this.TempOrderList.filter((filter: any) => filter.ID == id)[0].PCS;
        if (Number(pieces) > Number(filterData)) {
            this._toasterService.toast("error", "Alert", "Pieces can not be greater than " + filterData);
            this._disabled.disableButton(this.submitButton);
        } else {
            this._disabled.enableButton(this.submitButton);
        }
    }

    submit() {
        this._disabled.disableButton(this.submitButton);
        let totalPcs = 0;
        for (let i of this.OrderList) {
            if (i["Check"] == true) {
                totalPcs = totalPcs + Number(i["PCS"]);
            }
        }
        this._sharedconsig.sharedData.pcs = totalPcs;
        this._router.navigate(['export/Consignment/main']);
        this._disabled.enableButton(this.submitButton);
    }
}