import { Component, OnInit, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import {Router} from '@angular/router';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoginService } from '../../../shared/service/loginService';
import { SharedDataSerice } from '../../export-share-data.service';
import { ButtonService } from '../../../shared/common-font-changer.directive';

@Component({
    templateUrl: 'order-booking-list.component.html',
    // Page kit is global (src/styles/kit); kit-consignment scopes consignment-page.css.
    host: { class: 'kit-consignment' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class OrderBookingListComponent implements OnInit {

    ExporterName: any = '';
    ConsigneeName: any = '';
    OrderList: any = [];
    TempOrderList: any = [];
    // static: the Submit button sits in the pinned bar outside any @if, and ngOnInit disables it.
    @ViewChild('submitButton', {static: true}) submitButton: ElementRef;

    /** How many orders are ticked - shown in the toolbar and the bar (MP). */
    get selectedCount(): number {
        return (this.OrderList || []).filter((o: any) => o.Check === true).length;
    }

    /** Total pieces across the ticked orders, mirroring what submit() sends on. */
    get selectedPieces(): number {
        return (this.OrderList || [])
            .filter((o: any) => o.Check === true)
            .reduce((sum: number, o: any) => sum + Number(o.PCS || 0), 0);
    }
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
        this.loading = true;
        this.loadError = '';
        this._dataService.getData("Export/OrderBookingList", _jsonData)
            .subscribe((data: any) => {
                this.loading = false;
                this._disabled.enableButton(this.submitButton);
                // fail soft: a missing Table is treated as empty
                if (!data || !Array.isArray(data.Table)) { data = { Table: [] }; }
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
                        this.loadError = data.Table[0].STATUSTEXT;
                        this._toasterService.toast("error", "Error", data.Table[0].STATUSTEXT);
                    }
                } else {
                    this._router.navigate(['export/Consignment/main']);
                }
            }, () => {
                this.loading = false;
                this._disabled.enableButton(this.submitButton);
                this.loadError = 'Could not load orders. Reload the page to try again.';
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

    // ================================================================ redesign: list state (MP)
    readonly pageSize = 10;
    page: number = 1;
    loading: boolean = false;
    loadError: string = '';
    quickFilter: string = '';
    showFilter: string = '';

    /** Rows after the client-side filters; ticks and pieces stay on the OrderList objects. */
    get filteredOrders(): Array<any> {
        const q = (this.quickFilter || '').trim().toLowerCase();
        return (this.OrderList || [])
            .filter((o: any) => this.showFilter === '' || (this.showFilter === 'T' ? o.Check === true : o.Check !== true))
            .filter((o: any) => !q || [o.ORDERNO, o.STYLENO, o.TYPEOFPCS].some(v => v != null && String(v).toLowerCase().indexOf(q) >= 0));
    }

    get pageCount(): number { return Math.max(1, Math.ceil(this.filteredOrders.length / this.pageSize)); }
    get pageRows(): Array<any> { const st = (this.page - 1) * this.pageSize; return this.filteredOrders.slice(st, st + this.pageSize); }
    get rangeStart(): number { return this.filteredOrders.length ? (this.page - 1) * this.pageSize + 1 : 0; }
    get rangeEnd(): number { return Math.min(this.page * this.pageSize, this.filteredOrders.length); }
    get pageList(): number[] {
        const n = this.pageCount, p = this.page;
        if (n <= 7) { return Array.from({ length: n }, (_, i) => i + 1); }
        const out: number[] = [1];
        const lo = Math.max(2, p - 1), hi = Math.min(n - 1, p + 1);
        if (lo > 2) { out.push(0); }
        for (let i = lo; i <= hi; i++) { out.push(i); }
        if (hi < n - 1) { out.push(0); }
        out.push(n);
        return out;
    }
    goPage(p: number) { if (p >= 1 && p <= this.pageCount) { this.page = p; } }

    clearFilters() {
        this.quickFilter = '';
        this.showFilter = '';
        this.page = 1;
    }

    exportCsv() {
        const head = ['Order no', 'Style no', 'Pieces', 'Type of pieces', 'Ticked'];
        const rows = this.filteredOrders.map((o: any) => [o.ORDERNO, o.STYLENO, o.PCS, o.TYPEOFPCS, o.Check ? 'Yes' : 'No']);
        const q = (v: any) => '"' + (v == null ? '' : String(v)).replace(/"/g, '""') + '"';
        const csv = [head, ...rows].map(line => line.map(q).join(',')).join('\r\n');
        const d = new Date();
        const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'order-booking-list-' + stamp + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }
}
