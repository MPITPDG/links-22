import { Component, Input, Output, ViewChild, EventEmitter, OnInit, OnChanges, ElementRef, ViewEncapsulation } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { IMyDpOptions } from 'mydatepicker';
import { SharedDataSerice } from '../../export-share-data.service';
import { FontChangerComponent } from '../../../shared/common-font-changer.directive';
import { RedirectPage } from '../../../shared/common-modal.directive';
import { LoaderService } from '../../../shared/service/loader.service';
import { environment } from '../../../../environments/environment';


@Component({
    selector: 'app-consignment-edit-modal',
    templateUrl: 'consig_main_edit_modal.component.html',
})
export class ConsignmentEditModalComponent implements OnInit {
    @ViewChild('ConsignmentEditModal', { static: false }) public editModal: ModalDirective;
    @ViewChild('updateButton', { static: false }) updateButton: ElementRef;
    @ViewChild(FontChangerComponent, { static: false }) private disableButton: FontChangerComponent;

    @ViewChild('View', { static: false }) public View: ConsigneeViewPageComponent;
    @ViewChild('ShipmentClearanceEdit', { static: false }) public shipclearanceEdit: ShipmentClearanceEditComponent;
    @ViewChild('MainEdit', { static: false }) public mainEdit: MainEditComponent;
    @ViewChild('PortEdit', { static: false }) public portEdit: PortEditComponent;
    @ViewChild('InvoiceEdit', { static: false }) public invoiceEdit: InvoiceEditComponent;
    @ViewChild('DocumentEdit', { static: false }) public documentEdit: DocumentEditComponent;
    @ViewChild('OrderNoEdit', { static: false }) public ordernoEdit: OrderNoEditComponent;
    @ViewChild('ITCCodeEdit', { static: false }) public itccodeEdit: ITCCodeEditComponent;
    @ViewChild('MarksNumberEdit', { static: false }) public marksnoEdit: MarksNumberEditComponent;
    @ViewChild('PackageEdit', { static: false }) public packageEdit: PackageEditComponent;
    @ViewChild('QuotaEdit', { static: false }) public quotaEdit: QuotaEditComponent;
    @ViewChild('ConsigneeRemarkEdit', { static: false }) public consigneeremarkEdit: ConsigneeRemarkEditComponent;
    @ViewChild('MawbEdit', { static: false }) public mawbEdit: MAWBEditComponent;
    @ViewChild('HawbEdit', { static: false }) public hawbEdit: HAWBEditComponent;
    @ViewChild('JobEdit', { static: false }) public jobEdit: JobEditComponent;
    @ViewChild('QualityChecking', { static: false }) public QualityChecking: OrderNoQualityCheckingComponent;
    @ViewChild('CANCEL', { static: false }) public cancelshipedit: CancelShipmentComponent;

    @Input() type: string;
    @Input() exptno: string;

    title: string = "";

    constructor(private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService,
        private _loginService: LoginService) { }

    ngOnInit() {
        if (this._sharedconsig.exportEditData != undefined) {
            this.exptno = this._sharedconsig.exportEditData.EXPTNO;
        }
    }
    //

    show(etype) {
        this.type = etype;
        let editList = this._sharedconsig.exportEditData;
        let exptno_view
        if (this._loginService.getLogin()[0].CITYCODE == 'LIL' || this._loginService.getLogin()[0].CITYCODE == 'PAR') { exptno_view = editList.EXPTNO.substring(4, 14) }
        else { exptno_view = editList.EXPTNO }
        //this.type = 'QUALITYCHECKING';
        if (this.type == 'VIEW') { this.title = "CONSIGNMENT DETAILS - " + exptno_view; this.View.fnchangesview(); }
        else if (this.type == 'SHIPCLEAR') { this.title = "Export - Clearance - Update - " + exptno_view; this.shipclearanceEdit.changeclearancedt(); }
        else if (this.type == 'MAIN') { this.title = "Export - Main Details - Update - " + exptno_view; this.mainEdit.changefunctionmain() }
        else if (this.type == 'PORT') { this.title = "Export - Port/Goods Details - Update - " + exptno_view; this.portEdit.changefunPort(); }
        else if (this.type == 'INVOICE') { this.title = "Export - Invoice Details - Update - " + exptno_view; this.invoiceEdit.funChangeInv(); }
        else if (this.type == 'DOC') { this.title = "Export - Document Details - Update - " + exptno_view; this.documentEdit.changeFunction(); }
        else if (this.type == 'ORDER') { this.title = "Export - Order No Details - Update - " + exptno_view; this.ordernoEdit.chnageFunOrder(); }
        else if (this.type == 'ITC') { this.title = "Export - ITC Code Details - Update - " + exptno_view; this.itccodeEdit.changeItcedit(); }
        else if (this.type == 'MARKS_NUMBERS') { this.title = "Export - Marks & Numbers Details - Update -  " + exptno_view; }
        else if (this.type == 'PKG') { this.title = "Export - Package Details - Update - " + exptno_view; this.packageEdit.changeFunction(); }
        else if (this.type == 'QUOTA') { this.title = "Export - Quota Details - Update - " + exptno_view; }
        else if (this.type == 'CONREMARK') { this.title = "Export - Consignee Remark - Update - " + exptno_view; }
        else if (this.type == 'MAWB') { this.title = "MAWB - Update - " + this._sharedconsig.exportEditData.MAWBNO; this.mawbEdit.changefunction(); }
        else if (this.type == 'HAWB') { this.title = "HAWB - Update - " + this._sharedconsig.exportEditData.HAWBNO; this.hawbEdit.changefunHawb(); }
        else if (this.type == 'JOB') { this.title = "JOB - Update - " + exptno_view; this.jobEdit.changeFunction(); }
        else if (this.type == 'QUALITYCHECKING') { this.title = "ORDER NO. QUALITY CHECKING - " + exptno_view; }
        else if (this.type == 'CANCEL') { this.title = "Cancel Shipment - " + exptno_view; }
        this.editModal.show();
    }
    hide() {
        this.editModal.hide();
    }

    updateData() {
        if (this.type == 'SHIPCLEAR') { this.shipclearanceEdit.validate(); }
        else if (this.type == 'MAIN') { this.mainEdit.validate(); }
        else if (this.type == 'PORT') { this.portEdit.validate(); }
        else if (this.type == 'INVOICE') { this.invoiceEdit.validate(); }
        else if (this.type == 'DOC') { this.documentEdit.validate(); }
        else if (this.type == 'ORDER') { this.ordernoEdit.validate(); }
        else if (this.type == 'ITC') { this.itccodeEdit.validate(); }
        else if (this.type == 'MARKS_NUMBERS') { this.marksnoEdit.validate(); }
        else if (this.type == 'PKG') { this.packageEdit.validate(); }
        else if (this.type == 'QUOTA') { this.quotaEdit.validate(); }
        else if (this.type == 'CONREMARK') { this.consigneeremarkEdit.validate(); }
        else if (this.type == 'MAWB') { this.mawbEdit.validate(); }
        else if (this.type == 'HAWB') { this.hawbEdit.validate(); }
        else if (this.type == 'EXPJOB') { this.jobEdit.validate(); }
        else if (this.type == 'QUALITYCHECKING') { this.QualityChecking.validate(); }
        else if (this.type == 'CANCEL') { this.cancelshipedit.cancel_update(); }
    }

    onSuccess(result: any) {
        if (result.status == 100) {
            if (this.type == 'ORDER') {
                if (this._sharedconsig.exportEditData.GRPID == 1) {
                    if (this._sharedconsig.exportEditData.EDISENT == 'NO') {
                        this.type = 'QUALITYCHECKING';
                    } else {
                        this.hide();
                    }
                } else {
                    this.hide();
                }
            } else {
                this._toasterService.toast('success', '', result.message);
                this.hide();
            }
        }
    }

    onDisabled(event: boolean) {
        if (event == false) {
            this.disableButton.changeFontwithEnableButton(4, this.updateButton);
        } else if (event == true) {
            this.disableButton.changeFontwithDisableButton(11, this.updateButton);
        }
    }
}

//Start Consignment View
@Component({
    selector: 'app-consignment-view',
    template: `
                        <table class="table table-bordered table-striped table-sm-new">
						    <tbody>
                                <tr *ngIf="viewData?.Table[0].EXPTCANCEL == 'Y'">
						            <td colspan="4"><span class="col-form-span-label red"><strong>CONSIGNMENT IS CANCELLED</strong></span></td>
							    </tr>
							    <tr  *ngIf="edocView == 1">
								    <th class="col-form-span-heading centerlabel  link-label" colspan="4"><span (click)="openEdoc()">E-Document - View/Upload File</span></th>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">EXPORT NO </span></td>
						            <td colspan="3"><span class="col-form-span-label">{{exptno_view}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Mode Of Shipment</span></td>
						            <td colspan="2"><span class="col-form-span-label">{{modeship}}</span></td>
						            <td class="width130 centerlabel" rowspan="14">
                                        <span class="col-form-span-label" *ngIf="viewData?.Table[0].CLEARANCE == 'S'"><strong>SHIPMENT CLEARANCE BY SHIPPER'S AGENT</strong></span>
                                        <span class="col-form-span-label" *ngIf="viewData?.Table[0].CLEARANCE != 'S'"><strong>SHIPMENT CLEARANCE BY US</strong></span>
                                    </td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Exporter/Shipper </span></td>
						            <td colspan="2"><span class="col-form-span-label">{{viewData?.Table[0].EXP_NAME}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Bill To </span></td>
						            <td colspan="2"><span class="col-form-span-label">{{viewData?.Table[0].BILLTO_NAME}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Agent </span></td>
						            <td colspan="2"><span class="col-form-span-label">{{viewData?.Table[0].AGENT_NAME}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Consignee </span></td>
						            <td colspan="2"><span class="col-form-span-label">{{viewData?.Table[0].CON_NAME}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Sourcing Agent </span></td>
						            <td colspan="2"><span class="col-form-span-label">{{viewData?.Table[0].SRCAGT_NAME}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Consignee Bank </span></td>
						            <td colspan="2"><span class="col-form-span-label">{{viewData?.Table[0].BANK_NAME}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Buyer Name </span></td>
						            <td colspan="2"><span class="col-form-span-label">{{viewData?.Table[0].BUYER_NAME}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Loading Port </span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].EXPT_LDGPORT}}</span></td>
                                    <td><span class="col-form-span-label">Origin City : {{viewData?.Table[0].ORIGIN}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Port Of Discharge </span></td>
						            <td colspan="2"><span class="col-form-span-label">{{viewData?.Table[0].PORT_OF_DISCHARGE}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">I / T </span></td>
						            <td colspan="2"><span class="col-form-span-label">{{viewData?.Table[0].IT}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Destination City </span></td>
						            <td colspan="2"><span class="col-form-span-label">{{viewData?.Table[0].DEST_CITY}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Destination Country </span></td>
						            <td colspan="2"><span class="col-form-span-label">{{viewData?.Table[0].DEST_COUNTRY}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Doc Recd. Date </span></td>
						            <td colspan="2"><span class="col-form-span-label">{{viewData?.Table[0].EXPT_DOCRECD}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">No. of Packages </span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].EXPT_NOOFPKGS}}</span></td>
						            <td class="width150"><span class="col-form-span-label">No. of Pieces </span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].EXPT_NOOFPCS}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Gross Weight </span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].EXPT_GRWT}}</span></td>
						            <td class="width150"><span class="col-form-span-label">Net Weight </span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].EXPT_NETWT}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Volume </span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].EXPT_VOLUME}}</span></td>
						            <td class="width150"><span class="col-form-span-label">CHBL Weight </span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].EXPT_CHBLWT}}</span></td>
							    </tr>
                            <tbody>
                        </table>
                        <table class="table table-bordered table-striped table-sm-new">
						    <tbody>
                                <tr>
                                    <td><span class="col-form-span-label"><strong>ORDER NO. DETAILS:</strong></span></td>
                                </tr>
                            <tbody>
                        </table>
                        <div class="row xscroll">
                            <table class="table table-bordered table-striped table-sm-new">
								<thead>
									<tr class="col-form-span-heading">
										<th class="centerlabel"><span class="col-form-span-label">Order No.</span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">Reference No</span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">Pieces</span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">Type of Pieces</span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">Warehouse</span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">Item Description</span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">Pkgs</span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">Gr. Wt</span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">Net Wt</span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">Volume</span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">Chbl. Wt.</span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">LSD Date</span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">DRN Date</span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">FOB Value</span></th>
                                        <th class="width100 centerlabel"><span class="col-form-span-label">Currency </span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">Cnee Dept (Rayon)</span></th>
										<th class="width100 centerlabel"><span class="col-form-span-label">Container No</span></th>
									</tr>
								</thead>
								<tbody>
									<tr *ngFor="let obj of viewData?.Table4">
                                        <td class="centerlabel">
                                            <span class="col-form-span-label">
                                                <a href="javascript:void(0);" *ngIf="viewData?.Table[0]?.GRPID=='1'" (click)="openWindow(obj.ORDERNO, obj.STYLENO, obj.CONCODE)">{{obj.ORDERNO}}</a>
                                                  </span>
                                        </td>
										<td class="width100"><span class="col-form-span-label">{{obj.STYLENO}}</span></td>
										<td class="width100"><span class="col-form-span-label">{{obj.PIECES}}</span></td>
										<td class="width100"><span class="col-form-span-label">{{obj.TYPEOFPCS}}</span></td>
										<td class="width100"><span class="col-form-span-label">{{obj.WAREHOUSE}}</span></td>
										<td class="width100"><span class="col-form-span-label">{{obj.ITEMDESC}}</span></td>
										<td class="width100"><span class="col-form-span-label">{{obj.PKGS}}</span></td>
										<td class="width100"><span class="col-form-span-label">{{obj.GRWT}}</span></td>
                                        <td class="width100"><span class="col-form-span-label">{{obj.NETWT}}</span></td>
                                        <td class="width100"><span class="col-form-span-label">{{obj.VOLUME}}</span></td>
										<td class="width100"><span class="col-form-span-label">{{obj.CHBLWT}}</span></td>
										<td class="width100"><span class="col-form-span-label">{{obj.LSD}}</span></td>
										<td class="width100"><span class="col-form-span-label">{{obj.DRNDATE}}</span></td>
										<td class="width100"><span class="col-form-span-label">{{obj.FOBVALUE}}</span></td>
                                        <td class="width100"><span class="col-form-span-label">{{obj.CURENCY}}</span></td>
										<td class="width100"><span class="col-form-span-label">{{obj.CNEEDEPT}}</span></td>
										<td class="width100"><span class="col-form-span-label">{{obj.CONTAINERNO}}</span></td>
									</tr>
								</tbody>
							</table>
						</div><br />
                        <table class="table table-bordered table-striped table-sm-new">
						    <tbody>
                                <tr>
                                    <td><span class="col-form-span-label"><strong>PKG NO. DETAILS:</strong></span></td>
                                </tr>
                            <tbody>
                        </table>
                        <table class="table table-bordered table-striped table-sm-new">
							<thead>
								<tr class="col-form-span-heading">
									<th class="width150 centerlabel"><span class="col-form-span-label">From.</span></th>
									<th class="width150 centerlabel"><span class="col-form-span-label">To</span></th>
									<th class="centerlabel"><span class="col-form-span-label">Alphabet</span></th>
								</tr>
							</thead>
							<tbody>
								<tr *ngFor="let obj of viewData?.Table5">
									<td class="width150"><span class="col-form-span-label">{{obj.FROM}}</span></td>
									<td class="width150"><span class="col-form-span-label">{{obj.TO}}</span></td>
									<td><span class="col-form-span-label">{{obj.ALPHABET}}</span></td>
								</tr>
							</tbody>
						</table><br />
                        <table class="table table-bordered table-striped table-sm-new"  *ngIf="viewData?.Table[0].EXPT_MODE == 'SEA'">
						    <tbody>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Container No </span></td>
						            <td colspan="3">
                                        <p class="col-form-span-label" *ngFor="let obj of containerData"><span class="link-label" (click)="showClpView(obj.CONTAINERNO)"><u>{{obj.CONTAINER}}</u></span>{{obj.CONTAINER_STATUS}}</p>
                                    </td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">B/L No. </span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].BL_NO}}</span></td>
						            <td class="width150"><span class="col-form-span-label">B/L Date </span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].BL_DATE}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">HBL No.</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].HBL_NO}}</span></td>
						            <td class="width150"><span class="col-form-span-label">HBL Date</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].HBL_DATE}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Surrendered Date </span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].FCRSDT}}</span></td>
						            <td class="width150"><span class="col-form-span-label"></span></td>
						            <td><span class="col-form-span-label"></span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Name of The Vessel </span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table[0].VSL_NAME}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Rotation</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].EXPT_VESSEL}}</span></td>
						            <td class="width150"><span class="col-form-span-label">Voyage Number </span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].VSL_VOYNO}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Shipping Line </span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table2[0].LINER_NAME}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Vessel Agent </span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table[0].AGT_NAME}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">E.T.D. (SCHEDULED) </span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table[0].ETD}}</span></td>
							    </tr>
                                <tr *ngIf="viewData?.Table[0].SAILING == ''">
						            <td colspan="4" class="bglightgreen red"><strong><span class="col-form-span-label">VESSEL DELAYED</span></strong></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">SAILED ON (ACTUAL) </span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table[0].SAILING}}</span></td>
							    </tr>
                                <tr *ngIf="viewData?.Table[0].EXPT_MODE == 'SEA'">
						            <td class="width150"><span class="col-form-span-label"></span></td>
						            <td colspan="3"><span class="col-form-span-label">Direct </span></td>
							    </tr>
							</tbody>
                        </table>
                        <ng-container *ngIf="viewData?.Table2.length > 0" >
                        <table class="table table-bordered table-striped table-sm-new" *ngIf="viewData?.Table[0].EXPT_MODE == 'SEA'">
						    <tbody>
                                <tr><td colspan="4"><span class="col-form-span-label"><strong>TRANSHIPMENT DETAILS - VESSEL #1</strong></span></td></tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Name of The Port</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table2[0].TRANSPORT1}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Name of The Vessel</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table2[0].VSL_NAME1}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Voyage # of vessel</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table2[0].VSL_VOYNO1}}</span></td>
						            <td class="width150"><span class="col-form-span-label">ETD of vessel</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table2[0].ETD1}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">ETA</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table2[0].ETA1}}</span></td>
							    </tr>
                                <tr><td colspan="4"><span class="col-form-span-label"><strong>TRANSHIPMENT DETAILS - VESSEL #2</strong></span></td></tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Name of The Port</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table2[0].TRANSPORT2}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Name of The Vessel</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table2[0].VSL_NAME2}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Voyage # of vessel</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table2[0].VSL_VOYNO2}}</span></td>
						            <td class="width150"><span class="col-form-span-label">ETD of vessel</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table2[0].ETD2}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">ETA</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table2[0].ETA2}}</span></td>
							    </tr>
							</tbody>
						</table>
                        <table class="table table-bordered table-striped table-sm-new" *ngIf="viewData?.Table[0].EXPT_MODE == 'SEA'">
						    <tbody>
                                <tr>
						            <td colspan="4"><span class="col-form-span-label"><strong>ONWARD TRANSPORTATION DETAILS</strong></span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">By</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table2[0].ONWARDTRANSBY}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">From</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table2[0].ONWARDTRANSPORT}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">To</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table2[0].DESTPORT}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">ETA</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table2[0].ETA3}}</span></td>
							    </tr>
							</tbody>
                        </table>
                        </ng-container>

                        <table class="table table-bordered table-striped table-sm-new">
						    <tbody>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Airline Name</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table[0].AIRLINENAME}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Planned Flight No.</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].PLANFLIGHTNO}}</span></td>
						            <td class="width150"><span class="col-form-span-label">Planned Flight Date</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].PLANFLIGHTDT}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Actual Flight No.</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].ACTUALFLIGHTNO}}</span></td>
						            <td class="width150"><span class="col-form-span-label">Actual Flight Date</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].ACTUALFLIGHTDT}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">MAWB No.</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].AEROBILLNO}}</span>  </td>
						            <td class="width150"><span class="col-form-span-label">MAWB Date</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].AEROBILLDT}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">House AWB No.</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].HOUSEBILLNO}}</span>  </td>
						            <td class="width150"><span class="col-form-span-label">House AWB Date.</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].HOUSEBILLDT}}</span></td>
							    </tr>
                                <tr *ngIf="viewData?.Table[0].EXPT_MODE == 'AIR'">
						            <td class="width150"><span class="col-form-span-label"></span></td>
						            <td colspan="3"><span class="col-form-span-label">Direct </span></td>
							    </tr>
							</tbody>
						</table>
                        <table class="table table-bordered table-striped table-sm-new">
						    <tbody>
                                <tr>
						            <td colspan="4"><span class="col-form-span-label"><strong>TRANSHIPMENT DETAILS</strong></span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Transhipment Port1</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table[0].TRANSPORT1_CITYNAME}} </span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Flight No.</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].FLIGHTNO1}}</span></td>
						            <td class="width150"><span class="col-form-span-label">ETD</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].ETDPORT1}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">ETA</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table[0].ETAPORT1}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Transhipment Port2</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table[0].TRANSPORT2_CITYNAME}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Flight No.</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].FLIGHTNO2}}</span></td>
						            <td class="width150"><span class="col-form-span-label">ETD</span></td>
						            <td><span class="col-form-span-label">{{viewData?.Table[0].ETDPORT2}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">ETA</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table[0].ETAPORT2}}</span></td>
                                </tr>
                                <ng-container *ngIf="viewData?.Table2.length > 0" >
                                    <tr  *ngIf="viewData?.Table2[0].DIRECTVSL == 'YES'">
                                        <td class="width150"><span class="col-form-span-label">E.T.A</span></td>
                                        <td colspan="3"><span class="col-form-span-label">{{viewData?.Table[0].FCRSDT}}</span></td>
                                    </tr>
                                </ng-container>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">D/douane No.</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table[0].FCRSDT}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">D/douane Date</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table[0].FCRSDT}}</span></td>
							    </tr>
							</tbody>
						</table>
                        <table class="table table-bordered table-striped table-sm-new">
						    <tbody>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Actual Arrival date </span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table[0].ARRIVALDT}}</span></td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">Delivery given date </span></td>
						            <td colspan="3">
                                        <table class="table table-bordered table-striped table-sm-new">
						                    <tbody>
                                                <tr *ngFor="let obj of viewData?.Table3">
						                            <td class="width150"><span class="col-form-span-label">{{obj.ACTUALDT}}</span></td>
							                    </tr>
							                </tbody>
						                </table>
                                    </td>
							    </tr>
                                <tr>
						            <td class="width150"><span class="col-form-span-label">PSS</span></td>
						            <td colspan="3"><span class="col-form-span-label">{{viewData?.Table[0].EXPT_PSS}}</span></td>
							    </tr>
                            <tbody>
                        </table>
                        <table class="table table-bordered table-striped table-sm-new">
						    <tbody>
                                <tr>
						            <td class="width200 centerlabel"><span class="col-form-span-label link-label" (click)="show('I', null)">EXPORTER'S INVOICE DETAILS </span></td>
						            <td class="width200 centerlabel"><span class="col-form-span-label link-label" (click)="show('C', null)">CHRONOLOGY </span></td>
						            <td class="width200 centerlabel"><span class="col-form-span-label link-label" (click)="show('R', null)">REMARK </span></td>
							    </tr>
						    </tbody>
						</table>
                `
})
export class ConsigneeViewPageComponent {

    @Input() exptno: any;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

    exptno_view: any;
    viewData: any;
    edocView: number;
    containerData: any = [];
    deliveryData: any = [];
    loadTrans: any = {};
    remark: any = {};
    modeship: string = '';

    links: string = null;

    containerno: string = null;
    vessel: string = null;

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _redirectToEdoc: RedirectPage,
        private _loaderService: LoaderService) {
        this.exptno = this.exptno;
    }


    fnchangesview() {
        if (this._loginService.getLogin()[0].CITYCODE == 'LIL' || this._loginService.getLogin()[0].CITYCODE == 'PAR') { this.exptno_view = this.exptno.substring(4, 14) }
        else { this.exptno_view = this.exptno }

        this.exptno = this.exptno;
        this.setViewData(this.exptno);
    }
    setViewData(exptno) {
        this._loaderService.display(true);
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.Common("Export/ConsignmentView", _jsonData)
            .subscribe((data: any) => {

                this.viewData = data;
                if (this.viewData.Table[0].ISDIFFAIR == '1') { this.modeship = 'Diff Air'; }
                else if (this.viewData.Table[0].ISDIFFAIR == '2') { this.modeship = 'SEA-AIR'; }
                else { this.modeship = this.viewData.Table[0].EXPT_MODE; }

                this.containerData = data.Table1;
                if (this._loginService.getLogin()[0].ROLETYPE == "SA") {
                    this.edocView = 1;
                } else { if (data.Table6.length > 0) { this.edocView = data.Table6[0].VIEWFORM; } else { this.edocView = 0; } }
                this.deliveryData = data.Table3;
                if (data.Table2.length > 0) {
                    this.loadTrans = {
                        EXPT_LOAD_DATE: this.viewData.Table2[0].LOADDT,
                        EXPT_LOAD1_DATE: this.viewData.Table2[0].PORT1LOADDT,
                        EXPT_LOAD2_DATE: this.viewData.Table2[0].PORT2LOADDT,
                        EXPT_TRANSPORT1: this.viewData.Table2[0].TRANSPORT1,
                        EXPT_TRANSPORT2: this.viewData.Table2[0].TRANSPORT2
                    };
                }
                this._loaderService.display(false);
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); this._loaderService.display(false); },
                () => { });
    }


    showClpView(containerno) {
        this.vessel = (this.viewData.Table[0].EXPT_VESSEL != undefined) ? this.viewData.Table[0].EXPT_VESSEL : null;
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);

        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/consignment-clp-view/' + this.exptno + '/' + containerno + '/' + this.vessel, "Clp_View", toolbar);
    }

    show(type, num) {
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        if (type == 'I') {
            window.open('./#/popup/consignment-exporter-invoice-detail/' + this.exptno, "Invoice_Details", toolbar);
        } else if (type == 'C') {
            window.open('./#/popup/consignment-chronology-view/' + this.exptno, "Chronology_view", toolbar);
        }
        else if (type == 'R') {
            window.open('./#/popup/consignment-remark-view/' + this.exptno, "Remark_View", toolbar);
        }
    }

    openWindow(orderno, styleno, concode) {
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);

        let toolbar = 'resizable=no,scrollbars=no,width=500,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/order-size-detail/' + this.exptno + '/' + orderno + '/' + styleno + '/' + concode, "Order_Size", toolbar);
    }

    openEdoc() {
        // this._redirectToEdoc.redirectToNewTab("EDOC");
        let URL = environment.edocumentIp + "eDocument-Links/View.html#/AutoRedirect?eformid=258&huhpnk=" + this._loginService.getLogin()[0].CMP_USERENCCODE + "&JOBNO=" + this.exptno + "&cmpcode=" + this._loginService.getLogin()[0].CMPCODE + "&citycode=" + this._loginService.getLogin()[0].CITYCODE + "&CurLogInIP=" + environment.edocumentIp
        let theTop = (screen.height / 2) - (510 / 2);
        let theLeft = (screen.width / 2) - (760 / 2);
        let toolbar = 'resizable=yes,scrollbars=no,width=740,height=490,status=no,left=' + theLeft + ',top=' + theTop
        let NewWin = window.open(URL, "EDOC_VIEW", toolbar);
        NewWin.focus();

    }
}
//End  Consignment View



//Start Shipment Clearance
@Component({
    selector: 'app-consignment-shipment-clearance-edit',
    template: `
                        <table class="table table-bordered table-striped table-sm-new">
						    <tbody>
							    <tr>
								    <th class="col-form-span-heading" colspan="3">Clearance Detail</th>
							    </tr>
                                <tr>
						            <td  class="col-form-span-label bgyellow centerlabel" colspan="3">
							            <input type="checkbox" class="col-form-span-label"  name="ExWork" [(ngModel)]="exwork">
							            EX-WORKS &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
							            <input type="checkbox" class="col-form-span-label"  name="CustomClr" [(ngModel)]="customclr">
							            CUSTOMS CLEARANCE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
							            <input type="checkbox" class="col-form-span-label"  name="Freightfrd" [(ngModel)]="freightfrd">
							            FREIGHT FORWARDING
						            </td>
							    </tr>
						    </tbody>
						</table>
                   		<app-consignment-consignee-view></app-consignment-consignee-view>
                `
})
export class ShipmentClearanceEditComponent {

    @Input() exptno: any;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

    shipData: any;
    pkid: number = null;
    exwork: any = null;
    customclr: any = null;
    freightfrd: any = null;

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) { }


    changeclearancedt() {
        this.shipData = this._sharedconsig.exportEditData;
        this.pkid = this.shipData.ID;
        this.exwork = (this.shipData.EXWORKS == "EX") ? true : false;
        this.customclr = (this.shipData.CUSTOM_CLR == "CUSTOM") ? true : false;
        this.freightfrd = (this.shipData.FREIGHT_FRD == "FRTFRD") ? true : false;
    }

    validate() {
        this.disabledBtn.emit(true);
        this._loaderService.display(true);
        const _jsonData = {
            Type1: this.pkid,
            Type2: this.exptno,
            Type3: (this.exwork == true) ? "EX" : "",
            Type4: (this.customclr == true) ? "CUSTOM" : "",
            Type5: (this.freightfrd == true) ? "FRTFRD" : "",
            Type6: this._loginService.getLogin()[0].CMPID,
            Type7: this._loginService.getLogin()[0].CMPID   //Chnage later by IP
        };
        this._dataService.Common("Export/UpdateShipmentClr", _jsonData)
            .subscribe((data: any) => {
                this.disabledBtn.emit(false);
                this._loaderService.display(false);
                this._sharedconsig.exportEditData.EXWORKS = (this.exwork == true) ? "EX" : "";
                this._sharedconsig.exportEditData.CUSTOM_CLR = (this.customclr == true) ? "CUSTOM" : "";
                this._sharedconsig.exportEditData.FREIGHT_FRD = (this.freightfrd == true) ? "FRTFRD" : "";
                this.result.emit({ status: data.Table[0].STATUS, message: "Export Clearance detail updated Successfully!." });
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

}
//End Shipment Clearance

//Start Main Details
@Component({
    selector: 'app-consignment-main-edit',

    template: `
                   		<table class="table table-bordered table-striped table-sm-new">
							   <tbody>
								  <tr>
									 <td class="col-form-span-heading" colspan="3">EXPORT CONSINGNMENT MAIN DETAILS </td>
								  </tr>
								  <tr>
                                     <td class="width150"></td>
									 <td colspan="2"><input type="checkbox"  class="col-form-span-label"  name="checkbox1" value="option1" [(ngModel)]="chkClearence">CHECK IF CLEARANCE BY SHIPPER'S - OWN AGENT</td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Exporter/Shipper<span class="col-form-span-error">*</span></span> </td>
									 <td colspan="2">

                                            <select class="form-control " [(ngModel)]="drpShipper">
                                                <option value="">--select--</option>
                                                <option *ngFor="let d of exporters" value={{d.VALUEFIELD}}>{{d.TEXTFIELD}}</option>
                                            </select>
                                      </td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Bill To<span class="col-form-span-error">*</span></span> </td>
									 <td colspan="2">

                                            <select class="form-control " [(ngModel)]="drpBillTo">
                                            <option value="">--select--</option>
                                            <option *ngFor="let d of exporters" value={{d.VALUEFIELD}}>{{d.TEXTFIELD}}</option>
                                        </select>
                                      </td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Manufacturer </span> </td>
									 <td colspan="2">

                                            <select class="form-control " [(ngModel)]="drpManufact">
                                            <option value="">--select--</option>
                                            <option *ngFor="let d of exporters" value={{d.VALUEFIELD}}>{{d.TEXTFIELD}}</option>
                                        </select>
                                      </td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Consignee<span class="col-form-span-error">*</span></span> </td>
									 <td colspan="2">


                                    <select class="form-control " [(ngModel)]="drpConsignee">
                                    <option value="">--select--</option>
                                    <option *ngFor="let d of consignees" value={{d.VALUEFIELD}}>{{d.TEXTFIELD}}</option>
                                     </select>

                                      </td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">If consigned to bank </span> </td>
									 <td colspan="2">

                                        <select class="form-control " [(ngModel)]="drpBank">
                                        <option value="">--select--</option>
                                        <option *ngFor="let d of banks" value={{d.VALUEFIELD}}>{{d.TEXTFIELD}}</option>
                                         </select>
                                      </td>
								  </tr>
								  <tr>
									 <td class="width100"></td>
									 <td colspan="2"><input type="checkbox" id="chknotify"  class="col-form-span-label"  name="checkbox1" value="option1" (change)="onChangeNotify(chknotify)" [(ngModel)]="chknotify"><span class="col-form-span-label">Notify whether consignee & buyer are the same</span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Buyer Name<span class="col-form-span-error">*</span></span> </td>
									 <td colspan="2">

                                            <select class="form-control " [(ngModel)]="drpBuyer">
                                            <option value="">--select--</option>
                                            <option *ngFor="let d of consignees" value={{d.VALUEFIELD}}>{{d.TEXTFIELD}}</option>
                                             </select>
                                      </td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Sourcing Agent</span> </td>
									 <td>

                                            <select class="form-control " [(ngModel)]="drpSrcAgt" [disabled]="agents == null" >
                                            <option value="">--select--</option>
                                            <option *ngFor="let d of agents" value={{d.VALUEFIELD}}>{{d.TEXTFIELD}}</option>
                                             </select>
                                      </td>
								  </tr>
								</tbody>
							</table>

                `

})
export class MainEditComponent {

    @Input() exptno: any;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

    exporters: Array<any> = [];
    agents: Array<any> = [];
    consignees: Array<any> = [];
    banks: Array<any> = [];

    chkClearence: boolean = false;
    drpShipper: any = null;
    drpBillTo: any = null;
    drpManufact: any = null;
    drpConsignee: any = null;
    drpBuyer: any = null;
    chknotify: boolean = false;
    drpBank: any = null;
    drpSrcAgt: any = null;

    pkid: number = null;
    modetype: string = null;
    hdSrcAgent: any = null;

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) { }


    changefunctionmain() {
        this.initfillData();
        this.modetype = this._sharedconsig.exportEditData.EXPT_MODE;
        this.setMainData(this.type, this._sharedconsig.exportEditData.EXPTNO, this._sharedconsig.exportEditData.EXPT_MODE);
    }
    initfillData() {
        this._loaderService.display(true);
        this._dataService.Common("Export/GetExportConsignment", { citycode: this._loginService.getLogin()[0].CITYCODE, cmpcode: this._loginService.getLogin()[0].CMPCODE })
            .subscribe((data: any) => {

                this.exporters = data.Table;
                this.consignees = data.Table2;
                this.banks = data.Table3;
                // this._loaderService.display(false);
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                    this._loaderService.display(false);
                },
                () => {
                });
    }

    setMainData(typ, exptno, mode) {
        this._loaderService.display(true);
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID,
            Type3: typ,
            Type4: this._loginService.getLogin()[0].GUID,
            Type5: mode
        };
        this._dataService.Common("Export/ConsignmentEditFillDetail", _jsonData)
            .subscribe((data: any) => {

                if (data.Table.length > 0) {
                    this.pkid = data.Table[0].PKID;
                    this.chkClearence = (data.Table[0].CLEARANCE == "Y" || data.Table[0].CLEARANCE == "S") ? true : false;
                    this.drpShipper = data.Table[0].EXP_CODE;
                    this.drpBillTo = data.Table[0].BILLTO_CODE;
                    this.drpManufact = (data.Table[0].MANU_CODE != "") ? data.Table[0].MANU_CODE : null;
                    this.drpConsignee = data.Table[0].CON_CODE;

                    this.drpBank = (data.Table[0].BANK_CODE != "") ? data.Table[0].BANK_CODE : null;
                    this.hdSrcAgent = data.Table[0].SRCAGT_CODE;
                    this.chknotify = (data.Table[0].NOTIFYBUYER == "yes") ? true : false;
                    this.drpBuyer = (data.Table[0].NOTIFYBUYER == "yes") ? null : data.Table[0].BUYER_CODE;
                    this.setSrcAgent(this.drpConsignee);
                    this._loaderService.display(false);
                }
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                    this._loaderService.display(false);
                },
                () => { });
    }

    onChangeNotify(chk: any): void {
        this.drpBuyer = null;
    }

    setSrcAgent(con_code) {
        if (con_code) {
            const _jsonData = {
                Type1: con_code,
                Type2: this._loginService.getLogin()[0].CITYCODE
            };
            this._loaderService.display(true);
            this._dataService.Common("Export/SourceAgent", _jsonData)
                .subscribe((data: any) => {
                    this._loaderService.display(false);
                    if (data.Table.length > 0) { this.agents = data.Table; }
                    else { this.agents = null; }
                },
                    (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                    () => { });
        } else { this.agents = null; }
    }

    fillData() {

    }

    validate() {
        if (this.drpShipper == null) { this._toasterService.toast('error', 'Error', "Exporter can not be Blank."); return false; }
        if (this.drpBillTo == null) { this._toasterService.toast('error', 'Error', "Bill To can not be Blank."); return false; }
        if (this.drpConsignee == null) { this._toasterService.toast('error', 'Error', "Consignee can not be Blank."); return false; }
        if (this.chknotify == false) {
            if (this.drpBuyer == null || this.drpBuyer == "") { this._toasterService.toast('error', 'Error', "Buyer can not be Blank."); return false; }
        }

        let PKID = this.pkid;
        let Expt_No = this.exptno;
        let Expt_Mode = this.modetype;
        let Exp_Code = (this.drpShipper != null) ? this.drpShipper : "";
        let Billto_Code = (this.drpBillTo != null) ? this.drpBillTo : "";
        let Manu_Code = (this.drpManufact != null) ? this.drpManufact : "";
        let Con_Code = (this.drpConsignee != null) ? this.drpConsignee : "";
        let Bank_Code = (this.drpBank != null) ? this.drpBank : "";
        let Notify = (this.chknotify == false) ? "no" : "yes";
        let Buyer_Code = (this.chknotify == true) ? "" : this.drpBuyer;
        let SrcAgent_Code = (this.drpSrcAgt != null) ? this.drpSrcAgt : "";

        const _jsonData = {
            PkId: PKID,
            exptno: Expt_No,
            expt_mode: Expt_Mode,
            expt_exporter: Exp_Code,
            expt_billto: Billto_Code,
            manufacturer: Manu_Code,
            expt_consignee: Con_Code,
            expt_bank: Bank_Code,
            notifybuyer: Notify,
            expt_buyer: Buyer_Code,
            expt_srcagt: SrcAgent_Code,
            CmpId: this._loginService.getLogin()[0].CMPID,
            MakerIp: this._loginService.getLogin()[0].MAKERIP // Change later by IP
        };
        this.disabledBtn.emit(true);
        this._loaderService.display(true);
        this._dataService.Common("Export/UpdateMain", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.disabledBtn.emit(false);
                this.result.emit({ status: data.Table[0].STATUS, message: "Export Main details updated Successfully!." });
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

}
//End Main Details

//Start Ports and Goods
@Component({
    selector: 'app-consignment-port-edit',
    template: `
    <div class="animated fadeIn">
        <table class="table table-bordered table-striped table-sm-new" *ngIf="isvisiblevessel == 'SEA' ">
            <tbody>
                <tr>
                    <td class="col-form-span-heading" colspan="4">VESSEL DETAILS
                </td>
                </tr>
                <tr>
                    <td class="width150"><span class="col-form-span-label">Vessel Name </span> </td>
                    <td colspan="2">
                        <ng-select [items]="vesselList"
                                bindLabel="TEXTFIELD"
                                bindValue="VALUEFIELD"

                                [(ngModel)]="vessel"
                                class="form-control"
                                (change)="changeVessel(vessel)"
                                [disabled] ="vis_port"
                                >
                        </ng-select>
                    </td>
                </tr>
                <tr>
                    <td class="width150"><span class="col-form-span-label">Agent Name </span> </td>
                    <td  colspan="2">
                    <ng-select [items]="agentList"
                                bindLabel="TEXTFIELD"
                                bindValue="VALUEFIELD"

                                [(ngModel)]="agent"
                                class="form-control"
                                [disabled] ="vis_port"
                                >
                    </ng-select>
                </td>
                    <td class="width200"></td>
                </tr>
            </tbody>
        </table>
        <table class="table table-bordered table-striped table-sm-new"  *ngIf="isvisiblevessel == 'AIR' || ISDIFFAIR == '2'">
                <tbody>
                    <tr>
                        <td class="col-form-span-heading" colspan="4">AIR SHIPMENT DETAILS</td>
                    </tr>
            </tbody>
        </table>
        <table class="table table-bordered table-striped table-sm-new"  *ngIf="isvisiblevessel == 'AIR' || ISDIFFAIR == '2'">
                <tbody>
                    <tr>
                        <td colspan="4" class="col-form-span-heading">
                        &nbsp;<span (click)="fontChange()"><app-font-changer [fontIndex]="fontIndex"></app-font-changer></span>
                        <span class="red">ALL INFORMATION WILL BE AUTOMATICALLY GET UPDATED IN THIS EXPORTS</span>
                        </td>
                    </tr>
            </tbody>
        </table>
        <table class="table-sm-new bgwhite" *ngIf="fontIndex == 9 || isvisiblevessel == 'AIR' || ISDIFFAIR == '2'">
                <tbody>
                    <tr *ngFor="let obj of exptnoList">
                        <td colspan="4">
                            <span class="col-form-span-label">{{obj.EXPTNO}}</span>
                        </td>
                    </tr>
            </tbody>
        </table>
        <table class="table table-bordered table-striped table-sm-new"  *ngIf="isvisiblevessel == 'AIR' || ISDIFFAIR == '2'">
                <tbody>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">Carting Date</span> </td>
                        <td><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="cartingdt"></my-date-picker></td>
                        <td class="width150"><span class="col-form-span-label">Prealert Sent On.</span> </td>
                        <td><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="prealertsentdt"></my-date-picker></td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">Airline Name</span> </td>
                        <td colspan="3"><input type="text" [(ngModel)]="airlinename" class="form-control"/></td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">Planned Flight No.</span> </td>
                        <td><input type="text" [(ngModel)]="plannedfltno" class="form-control"/></td>
                        <td class="width150"><span class="col-form-span-label">Date</span> </td>
                        <td><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="plannedfltdt" required></my-date-picker></td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">Actual Flight No.</span> </td>
                        <td><input type="text" [(ngModel)]="actualfltno" class="form-control"/></td>
                        <td class="width150"><span class="col-form-span-label">Date</span> </td>
                        <td><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="actualfltdt" required></my-date-picker></td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">MAWB No.</span> </td>
                        <td><input type="text" [(ngModel)]="mawbno" class="form-control" [disabled]="true"/></td>
                        <td class="width150"><span class="col-form-span-label">MAWB Date</span> </td>
                        <td><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="mawbdt" [disabled]="true"></my-date-picker></td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">MAWB Destination</span></td>
                        <td class="width230">
                        <ng-select [items]="commoncities"
                                    bindLabel="CITY_COUNTRY"
                                    bindValue="CITY_CODE"

                                    [(ngModel)]="mawbdest"
                                    class="form-control"
                                    >
                        </ng-select>
                        </td>
                        <td class="width150"><span class="col-form-span-label">MAWB Freight</span> </td>
                        <td class="width230">
                        <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                    bindLabel="TEXTFIELD"
                                    bindValue="VALUEFIELD"

                                    [(ngModel)]="mawbfreight"
                                    class="form-control"
                                    >
                        </ng-select>
                        </td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">House AWB No.</span> </td>
                        <td><input type="text" [(ngModel)]="houseawbno" class="form-control" [disabled]="true"/></td>
                        <td class="width150"><span class="col-form-span-label">Date</span> </td>
                        <td><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="houseawbdt" [disabled]="true"></my-date-picker></td>
                    </tr>
                    <tr>
                        <td class="width150"></td>
                        <td colspan="3" class="width150">
                        <input type="radio" name="TransType" [checked]="transtype == 'Direct'" value="Direct"  (click)="transType('Direct')"/><span class="col-form-span-label">Direct</span>
                        <input type="radio" name="TransType" [checked]="transtype == 'Trans'" value="Trans" (click)="transType('Trans')"/><span class="col-form-span-label">Transhipment</span>
                    </td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">Transhipment Port1</span>   </td>
                        <td>
                        <ng-select [items]="commoncities"
                                    bindLabel="CITY_COUNTRY"
                                    bindValue="CITY_CODE"

                                    [(ngModel)]="transportone"
                                    class="form-control"
                                    [disabled]="transtype == 'Direct'"
                                    >
                        </ng-select>
                        </td>
                        <td class="width150"><span class="col-form-span-label">Transhipment Port2</span> </td>
                        <td>
                        <ng-select [items]="commoncities"
                                    bindLabel="CITY_COUNTRY"
                                    bindValue="CITY_CODE"

                                    [(ngModel)]="transporttwo"
                                    class="form-control"
                                    [disabled]="transtype == 'Direct'"
                                    >
                        </ng-select>
                        </td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">Flight No.</span> </td>
                        <td><input type="text" [(ngModel)]="fltno1" class="form-control"/></td>
                        <td class="width150"><span class="col-form-span-label">Flight No.</span> </td>
                        <td><input type="text" [(ngModel)]="fltno2" class="form-control"/></td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">ETD</span></td>
                        <td><my-date-picker name="etdonedt" [options]="myDatePickerOptions" [(ngModel)]="etdonedt" [disabled]="transtype == 'Direct'"></my-date-picker></td>
                        <td class="width150"><span class="col-form-span-label">ETD</span></td>
                        <td><my-date-picker name="etdtwodt" [options]="myDatePickerOptions" [(ngModel)]="etdtwodt" [disabled]="transtype == 'Direct'"></my-date-picker></td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">ETA</span></td>
                        <td><my-date-picker name="etaonedt" [options]="myDatePickerOptions" [(ngModel)]="etaonedt"></my-date-picker></td>
                        <td class="width150"><span class="col-form-span-label">ETA</span></td>
                        <td><my-date-picker name="etatwodt" [options]="myDatePickerOptions" [(ngModel)]="etatwodt" [disabled]="transtype == 'Direct'"></my-date-picker></td>
                    </tr>
                </tbody>
            </table>
            <table class="table table-bordered table-striped table-sm-new">
                <tbody>
                    <tr>
                        <td class="col-form-span-heading" colspan="4">PORT DETAILS </td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">Loading Port</span> </td>

                    <td>
                    <ng-select [items]="commoncities"
                                bindLabel="CITY_NAME"
                                bindValue="CITY_CODE"
                                [(ngModel)]="loadingport"
                                class="form-control"
                                (change)="GetTerminal(loadingport)"
                                >
                    </ng-select>
                    </td>
                    <td class="width100"><span class="col-form-span-label">Terminal</span> </td>
                    <td>
                    <ng-select [items]="portterminal"
                                bindLabel="TERMINAL"
                                bindValue="ID"
                                [(ngModel)]="loadingportterminal"
                                class="form-control"

                                >
                    </ng-select>
                    </td>

                    </tr>
                    <tr>
                    <td class="width150"><span class="col-form-span-label">Carting Place</span> </td>
                    <td colspan="3"><input type="text" [(ngModel)]="cartingplace" class="form-control"/></td>

                </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">Port of Discharge</span>  </td>
                        <td>
                        <ng-select [items]="commoncities"
                                    bindLabel="CITY_NAME"
                                    bindValue="CITY_CODE"

                                    [(ngModel)]="podchrg" (change)="Countryfilter(podchrg)"
                                    class="form-control"
                                    >
                        </ng-select>
                        </td>
                        <td class="width150"><span class="col-form-span-label">I / T</span> </td>
                        <td>
                        <ng-select [items]="[{VALUEFIELD:'I/T', TEXTFIELD:'I/T'}]"
                                    bindLabel="TEXTFIELD"
                                    bindValue="VALUEFIELD"

                                    [(ngModel)]="portit"
                                    class="form-control"
                                    >
                        </ng-select>
                        </td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">Dest. City/Country</span></td>
                        <td colspan="3">
                        <ng-select [items]="commoncities"
                                    bindLabel="CITY_COUNTRY"
                                    bindValue="CITY_CODE"

                                    [(ngModel)]="destcity"
                                    class="form-control"
                                    >
                        </ng-select>
                        </td>
                    </tr>
                </tbody>
            </table>
            <table class="table table-bordered table-striped table-sm-new">
                <tbody>
                    <tr>
                        <td class="col-form-span-heading" colspan="4">GOODS DETAILS </td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">No. of Packages</span><span class="col-form-span-error">*</span></td>
                        <td><input type="text" [(ngModel)]="noofpkgs" class="form-control" OnlyNumber="true"/></td>
                        <td class="width150"><span class="col-form-span-label">Type of Pkgs </span> </td>
                        <td>
                        <ng-select [items]="[{VALUEFIELD: 'PKG', TEXTFIELD: 'PKG'},{VALUEFIELD: 'BUNDLES', TEXTFIELD: 'BUNDLES'},{VALUEFIELD: 'CARTONS', TEXTFIELD: 'CARTONS'},{VALUEFIELD: 'BOXES', TEXTFIELD: 'BOXES'},{VALUEFIELD: 'BASES', TEXTFIELD: 'BASES'},{VALUEFIELD: 'CASES', TEXTFIELD: 'CASES'},{VALUEFIELD: 'PALLETS', TEXTFIELD: 'PALLETS'},{VALUEFIELD: 'ROLL', TEXTFIELD: 'ROLL'},{VALUEFIELD: 'BALES', TEXTFIELD: 'BALES'},{VALUEFIELD: 'DRUMS', TEXTFIELD: 'DRUMS'},{VALUEFIELD: 'CABLE', TEXTFIELD: 'CABLE'},{VALUEFIELD: 'PACKS', TEXTFIELD: 'PACKS'},{VALUEFIELD: 'NOS', TEXTFIELD: 'NOS'},{VALUEFIELD: 'CRATES', TEXTFIELD: 'CRATES'},{VALUEFIELD: 'BAGS', TEXTFIELD: 'BAGS'},{VALUEFIELD: 'TANKS', TEXTFIELD: 'TANKS'} ]"
                            bindLabel="TEXTFIELD"
                            bindValue="VALUEFIELD"

                            [(ngModel)]="typeofpkgs"
                            class="form-control"
                            >
                        </ng-select>
                    </td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">No of Pcs</span><span class="col-form-span-error">*</span></td>
                        <td><input type="text" [(ngModel)]="noofpcs" class="form-control" OnlyNumber="true"/></td>
                        <td class="width150"><span class="col-form-span-label">Type of Pcs</span><span class="col-form-span-error">*</span></td>
                        <td>
                        <ng-select [items]="[{VALUEFIELD: 'PIECES', TEXTFIELD: 'PIECES'},{VALUEFIELD: 'SETS', TEXTFIELD: 'SETS'},{VALUEFIELD: 'DOZENS', TEXTFIELD: 'DOZENS'},{VALUEFIELD: 'PAIRS', TEXTFIELD: 'PAIRS'},{VALUEFIELD: 'BOXES', TEXTFIELD: 'BOXES'},{VALUEFIELD: 'NOS', TEXTFIELD: 'NOS'},{VALUEFIELD: 'UNIT', TEXTFIELD: 'UNIT'},{VALUEFIELD: 'LOTS', TEXTFIELD: 'LOTS'},{VALUEFIELD: 'MTR', TEXTFIELD: 'MTR'},{VALUEFIELD: 'PACK', TEXTFIELD: 'PACK'},{VALUEFIELD: 'KGS', TEXTFIELD: 'KGS'},{VALUEFIELD: 'KGS/MTRS', TEXTFIELD: 'KGS/MTRS'},{VALUEFIELD: 'PCS/PAIR', TEXTFIELD: 'PCS/PAIR'},{VALUEFIELD: 'SQ.MTRS', TEXTFIELD: 'SQ.MTRS'},{VALUEFIELD: 'PCS/SETS', TEXTFIELD: 'PCS/SETS'},{VALUEFIELD: 'EA', TEXTFIELD: 'EA'},{VALUEFIELD: 'PCS/PAIR/KGS', TEXTFIELD: 'PCS/PAIR/KGS'},{VALUEFIELD: 'AMPOULES', TEXTFIELD: 'AMPOULES'},{VALUEFIELD: 'MT', TEXTFIELD: 'MT'},{VALUEFIELD: 'MATS', TEXTFIELD: 'MATS'},{VALUEFIELD: 'CASES', TEXTFIELD: 'CASES'}]"
                                    bindLabel="TEXTFIELD"
                                    bindValue="VALUEFIELD"

                                    [(ngModel)]="typeofpcs"
                                    class="form-control"
                                    >
                        </ng-select>
                        </td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">Shipper Gross Weight</span><span class="col-form-span-error">*</span></td>
                        <td><input type="text" [(ngModel)]="shprgrosswt" class="form-control" OnlyNumber="true"/></td>
                        <td class="width150"><span class="col-form-span-label">Shipper Volume</span> </td>
                        <td><input type="text" [(ngModel)]="shprvolume" class="form-control" OnlyNumber="true"/></td>
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">Gross Weight</span><span class="col-form-span-error">*</span></td>
                        <td><input type="text" [(ngModel)]="grosswt" class="form-control" OnlyNumber="true"  /></td>
                        <td class="width150"><span class="col-form-span-label">Volume</span><span class="col-form-span-error">*</span></td>
                        <td><input type="text" [(ngModel)]="volume" [disabled]="modetype!='SEA'" class="form-control" OnlyNumber="true" (blur)="calculateCHBL(grosswt)"/></td>
                        
                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">Net Weight</span><span class="col-form-span-error">*</span></td>
                        <td><input type="text" [(ngModel)]="netwt" class="form-control" OnlyNumber="true"/></td>
                        <td colspan="2"  align="right">

                        <button type="button" [disabled]='disablecalcbmbtn' class="btn btn-sm btn-primary" (click)="CalcbmModal()"><span class="col-form-span-label">
                        <i class="fa fa-dot-circle-o"></i> Calculate CBM</span></button>
                        </td>

                    </tr>
                    <tr>
                        <td class="width150"><span class="col-form-span-label">Net Weight</span><span class="col-form-span-error">*</span></td>
                        <td><input type="text" [(ngModel)]="netwt" class="form-control" OnlyNumber="true"/></td>
                        <td class="width150"><span class="col-form-span-label">CHBL Weight</span> </td>
                        <td><input type="text" [(ngModel)]="chblwt" class="form-control" OnlyNumber="true" disabled/></td>
                    </tr>

                    <tr>
                        <td class="width150"><span class="col-form-span-label">Remarks</span> </td>
                        <td colspan="3"><textarea rows="2" class="form-control" [(ngModel)]="goodsremark"></textarea></td>
                    </tr>
                </tbody>
        </table>
    </div>

    <div bsModal #CalculateCBM="bs-modal" style="width:400px;display:inline-block;margin:0 auto;" class="modal fade"  tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true" [config]="{backdrop: 'static'}" >
        <div class="modal-dialog modal-md"  style="display: inline block;">
            <div class="modal-content" style="width:400px;">
                <div class="modal-header">
                    <span class="modal-title pull-left">
                        <strong>Calculate CBM</strong>
                    </span>
                </div>
                <div class="modal-body modal-fix-body" style="height:400px;width:400px; " >
                    <app-main-consignment-calcbm-add (hideModal)="abortcalc($event)"  (result)="changevolume($event)" [grosswt]="grosswt"  [noofpkgs]="noofpkgs"  [exptno]="exptno"></app-main-consignment-calcbm-add>
                </div>
            </div>
        </div>
    </div>
                `
})
export class PortEditComponent {


    @Input() exptno: any;
    @Input() type: string;
    @ViewChild(FontChangerComponent, { static: false }) private _fontChange: FontChangerComponent;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();
    @ViewChild('updateButton', { static: false }) updateButton: ElementRef;
    @ViewChild('CalculateCBM', { static: false }) public calcCBMmodel: ModalDirective;
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
        selectorHeight: '180px',
        selectorWidth: '200px'
    };

    fontIndex: number = 9;
    exptnoList: any = [];
    agentList: any = [];
    vesselList: any = [];
    agent: string = null;
    vessel: string = null;
    portterminal: Array<any> = [];
    Allportterminallist: any = [];
    loadingportlst: any = [];
    commoncities: any = [];
    editloadingportlst: any[];
    allportlist: any = [];
    isvisiblevessel: any = "";
    modetype: any = "";

    pkid: number;
    ISDIFFAIR: string = "";
    IS_EDITABLE: string = ""
    cartingdt: any = null;
    prealertsentdt: any = null;
    airlinename: any = "";
    plannedfltno: any = "";
    plannedfltdt: any = null;
    actualfltno: any = "";
    actualfltdt: any = null;
    mawbno: any = "";
    mawbdt: any = null;
    mawbdest: any = null;
    mawbfreight: any = "PP";
    houseawbno: any = "";
    houseawbdt: any = null;
    transtype: any = "Direct";//radio buttonoptions: Direct, Trans
    transportone: any = null;
    transporttwo: any = null;
    fltno1: any = "";
    fltno2: any = "";
    etdonedt: any = null;
    etdtwodt: any = null;
    etaonedt: any = null;
    etatwodt: any = null;
    loadingport: any = "";
    loadingportterminal: string = "";
    loadingportname: string = "";
    loadingportcode: string = "";
    cartingplace: any = "";
    podchrg: any = null;
    portit: any = null;
    destcity: any = null;
    noofpkgs: any = "";
    typeofpkgs: any = null;
    noofpcs: any = "";
    typeofpcs: any = null;
    shprgrosswt: any = "";
    shprvolume: any = "";
    grosswt: any = "";
    volume: any = "0.001";
    netwt: any = "";
    frieght: any = "PP";
    chblwt: any = "";
    goodsremark: any = "";
    listcnt: any[];
    sumpcs: any = "0";
    sumpkgs: any = "0";
    vis_port: any = null
    public showModal_calccmb: boolean = false;
    disablecalcbmbtn: boolean = false;
    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) { }

    calculateCHBL(grosswt) {
        if (this.volume != "") { this.volume = Math.abs(this.volume); } else { this.volume = 0; }
        // if (this.grosswt != '') {
        //     this.grosswt = Math.abs(this.grosswt);
        // } else { this.grosswt = ""; }

        let cblwt = Math.abs(this.volume) / 0.006;
        //  cblwt = Math.round(cblwt);
        cblwt = Math.round(cblwt * 100) / 100
        if (cblwt > this.grosswt) { this.chblwt = cblwt; } else { this.chblwt = this.grosswt; }
        //this.chblwt = this.grosswt;
        return false;
    }
    changevolume(event) {
        this.calcCBMmodel.hide();
        console.log(event);
        console.log(event.totcbm, event.chblwt)
        this.volume = event.totcbm;
        //this.chblwt = event.chblwt
        if (event.chblwt > this.grosswt) { this.chblwt = event.chblwt; } else { this.chblwt = this.grosswt; }

    }
    changefunPort() {
        let vslCode = (this._sharedconsig.exportEditData.VSL_CODE != "") ? this._sharedconsig.exportEditData.VSL_CODE.split('|')[0] : "";
        let vslPort = (this._sharedconsig.exportEditData.VSL_CODE != "") ? this._sharedconsig.exportEditData.VSL_CODE.split('|')[1] : "";
        this.modetype = this._sharedconsig.exportEditData.EXPT_MODE;
        this.fillDropdown(this._sharedconsig.exportEditData.EXPT_MODE, vslCode, vslPort);
        //this.Fillportterminal("");
        this.setPortData(this.type, this._sharedconsig.exportEditData.EXPTNO, this._sharedconsig.exportEditData.EXPT_MODE);
        this.ISDIFFAIR = this._sharedconsig.exportEditData.ISDIFFAIR;
        this.IS_EDITABLE = this._sharedconsig.exportEditData.IS_EDITABLE;
        if(this.modetype=='AIR'){
            this.disablecalcbmbtn=false;
        }else{this.disablecalcbmbtn=true;}
        // console.log(this._sharedconsig.exportEditData);
        //this.exptno=this._sharedconsig.exportEditData.EXPTNO;
        if (this.IS_EDITABLE == "YES") { this.vis_port = null; }
        else { this.vis_port = this.IS_EDITABLE; }
        //  if(this._sharedconsig.exportEditData.EXPTNO!=''){
        //      this.updatevolume();
        //  }

    }
    abortcalc(event) {
        this.calcCBMmodel.hide();
        // this.result.emit({totcbm:this.volume,chblwt:this.VolWt});
    }
    updatevolume() {
        const jsondata =
        {
            JOBNO: this.exptno,
            VGUID: this._loginService.getLogin()[0].GUID
        }
        this._dataService.getData("Export/Export_JobDimension_GetData", jsondata)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS.split("#")[0] == "100") {
                    //this._toasterService.toast('success', 'success', data.Table1[0].STATUS.split("#")[1]);
                    this.volume = data.Table1[0].TOTCBM;
                    this.chblwt = data.Table1[0].TOTVOLWT;
                }

            });
    }

    fontChange() {
        if (this.fontIndex == 9) { this.fontIndex = 10; }
        else { this.fontIndex = 9; }
        this._fontChange.changeFontOnly(this.fontIndex);
    }

    fillDropdown(mode, vslcode, vslport) {
        this._loaderService.display(true);
        const _jsonData = {
            Type1: mode,
            Type2: vslcode,
            Type3: vslport,
            Type4: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.Common("Export/PortGoods_FillDropDown", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.length > 0) {
                    this.commoncities = data.Table;
                    //  this.Allportterminallist=data.Table1;
                    // this.podchrg=data.Table;
                    if (mode == "SEA") {
                        if (data.Table1 != undefined) {
                            this.vesselList = data.Table1;
                            this.agentList = data.Table2;
                            this.portterminal = data.Table3;
                            this.Allportterminallist = data.Table3;

                        }
                    }
                    else {
                        this.portterminal = data.Table1;
                        this.Allportterminallist = data.Table1;
                    }


                }
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }


    Countryfilter(citycode) {
        console.log(citycode);
        this.listcnt = this.commoncities.filter((cntrylist: any) => cntrylist.CITY_CODE == citycode);

        this.destcity = this.listcnt[0].CITY_CODE;

    }
    setPortData(typ, exptno, mode) {
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID,
            Type3: typ,
            Type4: this._loginService.getLogin()[0].GUID,
            Type5: mode
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentEditFillDetail", _jsonData)
            .subscribe((data: any) => {

                if (data.Table.length > 0) {
                    this.isvisiblevessel = data.Table[0].EXPT_MODE;
                    this.pkid = data.Table[0].PKID;

                    if (data.Table[0].EXPT_MODE == "SEA") {
                        this.vessel = data.Table[0].VSL_CODE;
                        this.agent = data.Table[0].AGT_CODE;

                        if (this.ISDIFFAIR == '2') {
                            this.cartingdt = (data.Table[0].CARTEDDT) ? this._dataService.stringdttoArry(data.Table[0].CARTEDDT) : null;// this._dataService.stringdttoArry(data.Table[0].CARTEDDT);
                            this.prealertsentdt = (data.Table[0].PREALERTDT) ? this._dataService.stringdttoArry(data.Table[0].PREALERTDT) : null;
                            this.airlinename = data.Table[0].AIRLINENAME;
                            this.plannedfltno = data.Table[0].FLIGHTNO;
                            this.plannedfltdt = (data.Table[0].FLIGHTDT) ? this._dataService.stringdttoArry(data.Table[0].FLIGHTDT) : null;// this._dataService.stringdttoArry(data.Table[0].FLIGHTDT);
                            this.actualfltno = data.Table[0].ACTUALFLIGHTNO;
                            this.actualfltdt = (data.Table[0].ACTUALFLIGHTDT) ? this._dataService.stringdttoArry(data.Table[0].ACTUALFLIGHTDT) : null;//this._dataService.stringdttoArry(data.Table[0].ACTUALFLIGHTDT);
                            this.mawbno = data.Table[0].AEROBILLNO;
                            this.mawbdt = (data.Table[0].AEROBILLDT) ? this._dataService.stringdttoArry(data.Table[0].AEROBILLDT) : null;//this._dataService.stringdttoArry(data.Table[0].AEROBILLDT);
                            this.mawbdest = data.Table[0].MAWBDEST;
                            this.mawbfreight = data.Table[0].MAWBFRT;
                            this.houseawbno = data.Table[0].HOUSEBILLNO;
                            this.houseawbdt = this._dataService.stringdttoArry(data.Table[0].HOUSEBILLDT);
                            if (data.Table[0].TRANSPORT1 != "") {
                                this.transtype = "Trans";
                                this.transportone = (data.Table[0].TRANSPORT1 != "") ? data.Table[0].TRANSPORT1 : null;
                                this.transporttwo = (data.Table[0].TRANSPORT2 != "") ? data.Table[0].TRANSPORT2 : null;
                                this.etdonedt = (data.Table[0].ETDPORT1 != "") ? this._dataService.stringdttoArry(data.Table[0].ETDPORT1) : null;
                                this.etdtwodt = (data.Table[0].ETDPORT2 != "") ? this._dataService.stringdttoArry(data.Table[0].ETDPORT2) : null;
                                this.etatwodt = (data.Table[0].ETAPORT2 != "") ? this._dataService.stringdttoArry(data.Table[0].ETAPORT2) : null;
                            } else { this.transtype = "Direct"; }
                            this.etaonedt = (data.Table[0].ETAPORT1) ? this._dataService.stringdttoArry(data.Table[0].ETAPORT1) : null;// this._dataService.stringdttoArry(data.Table[0].ETAPORT1);
                            this.fltno1 = data.Table[0].FLIGHTNO1;
                            this.fltno2 = data.Table[0].FLIGHTNO2;
                            if (data.Table[0].AEROBILLNO != "") {
                                this.show_otherexptnohavingmawbno(data.Table[0].AEROBILLNO, data.Table[0].PKID);
                            }
                        }
                    }
                    else {
                        this.cartingdt = (data.Table[0].CARTEDDT) ? this._dataService.stringdttoArry(data.Table[0].CARTEDDT) : null;// this._dataService.stringdttoArry(data.Table[0].CARTEDDT);
                        this.prealertsentdt = (data.Table[0].PREALERTDT) ? this._dataService.stringdttoArry(data.Table[0].PREALERTDT) : null;
                        this.airlinename = data.Table[0].AIRLINENAME;
                        this.plannedfltno = data.Table[0].FLIGHTNO;
                        this.plannedfltdt = (data.Table[0].FLIGHTDT) ? this._dataService.stringdttoArry(data.Table[0].FLIGHTDT) : null;//this._dataService.stringdttoArry(data.Table[0].FLIGHTDT);
                        this.actualfltno = data.Table[0].ACTUALFLIGHTNO;
                        this.actualfltdt = (data.Table[0].ACTUALFLIGHTDT) ? this._dataService.stringdttoArry(data.Table[0].ACTUALFLIGHTDT) : null;//this._dataService.stringdttoArry(data.Table[0].ACTUALFLIGHTDT);
                        this.mawbno = data.Table[0].AEROBILLNO;
                        this.mawbdt = (data.Table[0].AEROBILLDT) ? this._dataService.stringdttoArry(data.Table[0].AEROBILLDT) : null;//this._dataService.stringdttoArry(data.Table[0].AEROBILLDT);
                        this.mawbdest = data.Table[0].MAWBDEST;
                        this.mawbfreight = data.Table[0].MAWBFRT;
                        this.houseawbno = data.Table[0].HOUSEBILLNO;
                        this.houseawbdt = (data.Table[0].HOUSEBILLDT) ? this._dataService.stringdttoArry(data.Table[0].HOUSEBILLDT) : null;//this._dataService.stringdttoArry(data.Table[0].HOUSEBILLDT);
                        if (data.Table[0].TRANSPORT1 != "") {
                            this.transtype = "Trans";
                            this.transportone = (data.Table[0].TRANSPORT1 != "") ? data.Table[0].TRANSPORT1 : null;
                            this.transporttwo = (data.Table[0].TRANSPORT2 != "") ? data.Table[0].TRANSPORT2 : null;
                            this.etdonedt = (data.Table[0].ETDPORT1 != "") ? this._dataService.stringdttoArry(data.Table[0].ETDPORT1) : null;
                            this.etdtwodt = (data.Table[0].ETDPORT2 != "") ? this._dataService.stringdttoArry(data.Table[0].ETDPORT2) : null;
                            this.etatwodt = (data.Table[0].ETAPORT2 != "") ? this._dataService.stringdttoArry(data.Table[0].ETAPORT2) : null;
                        } else { this.transtype = "Direct"; }
                        this.etaonedt = (data.Table[0].ETAPORT1) ? this._dataService.stringdttoArry(data.Table[0].ETAPORT1) : null;// this._dataService.stringdttoArry(data.Table[0].ETAPORT1);
                        this.fltno1 = data.Table[0].FLIGHTNO1;
                        this.fltno2 = data.Table[0].FLIGHTNO2;
                        if (data.Table[0].AEROBILLNO != "") {
                            this.show_otherexptnohavingmawbno(data.Table[0].AEROBILLNO, data.Table[0].PKID);
                        }
                    }


                    this.loadingport = data.Table[0].LDG_PORT;//this.loadingportcode;
                    this.GetTerminal(this.loadingport)
                    this.loadingportterminal = data.Table[0].FK_TERMINALID + "|" + data.Table[0].LDG_PORT;
                    this.cartingplace = data.Table[0].CART_PLACE;
                    this.podchrg = data.Table[0].PORT_CODE;
                    this.portit = data.Table[0].IT;
                    this.destcity = data.Table[0].CITY_COUN_CODE;
                    this.shprgrosswt = data.Table[0].SHIP_GRWT;
                    this.shprvolume = data.Table[0].SHIP_VOLUME;
                    this.grosswt = data.Table[0].GRWT;
                    this.volume = data.Table[0].VOLUME;
                    this.netwt = data.Table[0].NET_WGT;
                    this.frieght = data.Table[0].FRT;
                    this.chblwt = data.Table[0].CHBL;
                    this.goodsremark = data.Table[0].REMARKS_PORT;
                    this.noofpkgs = data.Table[0].NOOFPKGS;
                    this.typeofpkgs = (data.Table[0].TYPEOFPKGS != "") ? data.Table[0].TYPEOFPKGS : null;
                    this.noofpcs = (data.Table[0].NOOFPCS != "") ? data.Table[0].NOOFPCS : null;
                    this.typeofpcs = data.Table[0].TYPEOFPCS;
                }
                if (data.Table1 !== undefined) {
                    this.sumpcs = data.Table1[0].SUM_PCS;
                    this.sumpkgs = data.Table1[0].SUM_PKGS;
                }
                this._loaderService.display(false);
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); this._loaderService.display(false); },
                () => { });
    }

    show_otherexptnohavingmawbno(airobillno, exptno) {
        const _jsonData = {
            Type1: airobillno,
            Type2: exptno
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/AirShipment_Show_OtherExptNo", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.length > 0) {
                    this.exptnoList = data.Table;
                }
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

    transType(check): void {
        this.transtype = check;
        if (check == "Direct") {
            this.transportone = null;
            this.transporttwo = null;
            this.etdonedt = null;
            this.etdtwodt = null;
            this.etatwodt = null;
        } else if (check == "Trans") { }
    }

    changeVessel(vessel) {
        if (vessel != null) {
            const _jsonData = {
                Type1: vessel.split('|')[0],
                Type2: vessel.split('|')[1]
            };
            this._loaderService.display(true);
            this._dataService.Common("Export/FillAgentDropdown", _jsonData)
                .subscribe((data: any) => {
                    this._loaderService.display(false);
                    this.agentList = data.Table;
                },
                    (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                    () => { });
        }
    }

    validatePort(): boolean {
        if (this.shprgrosswt == null) { this._toasterService.toast('error', 'Error', "Shipper Gross Weight can not be blank"); return false; }
        if (this.grosswt == null) { this._toasterService.toast('error', 'Error', "Gross Weight can not be blank"); return false; }
        if (this.netwt == null) { this._toasterService.toast('error', 'Error', "Net Weight can not be blank"); return false; }
        if (eval(this.netwt) > eval(this.grosswt)) { this._toasterService.toast('error', 'Error', "Net Weight should be less than or equal to Gross Weight"); return false; }
        if (this.volume == null) { this._toasterService.toast('error', 'Error', "Volume can not be blank"); return false; }
        if (this.modetype == "AIR") {
            if (eval(this.grosswt) == 0) { this._toasterService.toast('error', 'Error', "Gross Weight can not be blank"); return false; }
            else if (eval(this.volume) > (eval(this.grosswt) * 0.25)) { this._toasterService.toast('error', 'Error', "Volume should not be greter than 25% of Gross wt."); return false; }
        }
        return true;
    }

    validate() {
        if (this.validatePort() == false) { return false; }
        let cartdate = "", prealertdate = "", airlinename = "",
            planflightno = "", planflightdate = "", actflightno = "",
            actflightdate = "", mawbno = "", mawbdate = "", mawbdest = "",
            mawbfrt = "", hawbno = "", hawbdate = "", direct = "",
            tranport1 = "", flightno1 = "", etd1 = "", eta1 = "",
            tranport2 = "", flightno2 = "", etd2 = "", eta2 = "", aerobillno = "",
            aerobilldt = "", housebillno = "", housebilldt = "", vsl_code = "", vsl_port = "";

        let agent = "";

        if (this.modetype == "AIR" || this.ISDIFFAIR == '2') {

            cartdate = (this.cartingdt != null) ? this.cartingdt.formatted : "";
            prealertdate = (this.prealertsentdt != null) ? this.prealertsentdt.formatted : "";
            airlinename = this.airlinename;
            planflightno = this.plannedfltno;
            planflightdate = (this.plannedfltdt != null) ? this.plannedfltdt.formatted : "";
            actflightno = this.actualfltno;
            actflightdate = (this.actualfltdt != null) ? this.actualfltdt.formatted : "";
            mawbno = this.mawbno;
            mawbdate = (this.mawbdt != null) ? this.mawbdt.formatted : "";

            mawbdest = (this.mawbdest != null) ? this.mawbdest : "";


            mawbfrt = this.mawbfreight;
            hawbno = this.houseawbno;
            hawbdate = (this.houseawbdt != null) ? this.houseawbdt.formatted : "";

            if (this.transtype == "Direct") {
                direct = 'yes';
                tranport1 = "";
                tranport2 = "";
                etd1 = "";
                etd2 = "";
                eta2 = "";
            } else {
                direct = 'no';
                tranport1 = (this.transportone != null) ? this.transportone : "";
                tranport2 = (this.transporttwo != null) ? this.transporttwo : "";

                etd1 = (this.etdonedt != null) ? this.etdonedt.formatted : "";
                etd2 = (this.etdtwodt != null) ? this.etdtwodt.formatted : "";
                eta2 = (this.etatwodt != null) ? this.etatwodt.formatted : "";
            }

            flightno1 = this.fltno1;
            eta1 = (this.etaonedt != null) ? this.etaonedt.formatted : "";
            flightno2 = this.fltno2;

            aerobillno = this.mawbno;
            aerobilldt = (this.mawbdt != null) ? this.mawbdt.formatted : "";
            housebillno = this.houseawbno;
            housebilldt = (this.houseawbdt != null) ? this.houseawbdt.formatted : "";
            vsl_code = "";
            vsl_port = "";
            agent = "";

            if (actflightdate != '' && mawbdate != '') {
                if (this._dataService.DateFromAndToComparision(mawbdate, actflightdate) == false) {
                    this._toasterService.toast("error", "Alert", "Actual Flight date should be greater than or equal to MAWB date");
                    return false;
                }
                if (this._dataService.DateFromAndToComparision_exp(actflightdate, this._dataService.getCurrentdate()) == false) {
                    this._toasterService.toast("error", "Alert", "Actual Flight date Should be Less than or Equal to Current Date [ " + this._dataService.getCurrentdate() + "]");
                    return false;
                }
            }
        }
        else {
            vsl_code = this.vessel.split("|")[0];
            vsl_port = this.vessel.split("|")[1];
            agent = (this.agent != null) ? this.agent : "";
        }

        if (this.ISDIFFAIR == '2') {
            vsl_code = this.vessel.split("|")[0];
            vsl_port = this.vessel.split("|")[1];
            agent = (this.agent != null) ? this.agent : "";
        }
        let expt_ldgport = this.loadingport;
        let expt_cartplace = this.cartingplace;
        let expt_pod = (this.podchrg != null) ? this.podchrg : "";
        let expt_it = (this.portit != null) ? this.portit : "";
        let expt_destcity = (this.destcity != null) ? this.destcity : "";
        let expt_destcountry = (this.destcity != null) ? this.destcity : "";
        let expt_grwtshipper = this.shprgrosswt;
        let expt_volumeshipper = this.shprvolume;
        let expt_grwt = this.grosswt;
        let expt_netwt = this.netwt;
        let expt_volume = this.volume;
        let expt_frt = this.frieght;
        let expt_chblwt = this.chblwt;
        let expt_remarks = this.goodsremark;


        let expt_noofpkgs = this.noofpkgs;
        let expt_typeofpkgs = (this.typeofpkgs != null) ? this.typeofpkgs : "";
        let expt_noofpcs = this.noofpcs;
        let expt_typeofpcs = (this.typeofpcs != null) ? this.typeofpcs : "";
        let fkterminalid = (this.loadingportterminal.split("|")[0] == undefined || this.loadingportterminal.split("|")[0] == "") ? "" : this.loadingportterminal.split("|")[0];
        if (fkterminalid == "undefined") {
            fkterminalid = ""
        }
        let _jsonFinal = {
            Exptno: this.exptno,
            PKID: this.pkid,
            Expt_Guid: this._loginService.getLogin()[0].GUID,
            Expt_Mode: this.modetype,
            Expt_Noofpkgs: expt_noofpkgs,
            Expt_Typeofpkgs: expt_typeofpkgs,
            Expt_Noofpcs: expt_noofpcs,
            Expt_Typeofpcs: expt_typeofpcs,
            Expt_Grwt: expt_grwt,
            Expt_Netwt: expt_netwt,
            Expt_Volume: expt_volume,
            Expt_Vslagent: agent,
            Vsl_Code: vsl_code,
            Vsl_Port: vsl_port,
            Expt_Pod: expt_pod,
            Expt_It: expt_it,
            Expt_Destcity: expt_destcity,
            Expt_Destcountry: expt_destcountry,
            Expt_Frt: expt_frt,
            Expt_Remarks: expt_remarks,
            Citycode: this._loginService.getLogin()[0].CITYCODE,
            Cmpcode: this._loginService.getLogin()[0].CMPCODE,
            Expt_Grwtshipper: expt_grwtshipper,
            Expt_Volumeshipper: expt_volumeshipper,
            Expt_Ldgport: expt_ldgport,
            Expt_Cartplace: expt_cartplace,
            Expt_Chblwt: expt_chblwt,
            Username: this._loginService.getLogin()[0].CMPID,
            Citycode1: this._loginService.getLogin()[0].CITYCODE1,
            Cartdate: cartdate,
            Prealertdate: prealertdate,
            Airlinename: airlinename,
            Planflightno: planflightno,
            Planflightdate: planflightdate,
            Actflightno: actflightno,
            Actflightdate: actflightdate,
            Mawbdest: mawbdest,
            Mawbfrt: mawbfrt,
            Tranport1: tranport1,
            Flightno1: flightno1,
            Etd1: etd1,
            Eta1: eta1,
            Tranport2: tranport2,
            Flightno2: flightno2,
            Etd2: etd2,
            Eta2: eta2,
            Mawbno: mawbno,
            Mawbdate: mawbdate,
            Hawbno: hawbno,
            Hawbdate: hawbdate,
            CmpId: this._loginService.getLogin()[0].CMPID,
            MakerIp: this._loginService.getLogin()[0].CMPID, //Waiting for link to ip
            FK_TERMINALID: fkterminalid,
            VGUID: this._loginService.getLogin()[0].GUID
        }
        this.disabledBtn.emit(true);
        this._loaderService.display(true);
        this._dataService.Common("Export/UpdatePort", _jsonFinal)
            .subscribe((data: any) => {
                this.disabledBtn.emit(false);
                this._loaderService.display(false);
                this.result.emit({ status: data.Table[0].STATUS, message: "Export Port/Goods details updated Successfully!." });
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                });
    }

    // CalcbmModal() {
    //     let theTop = (screen.height / 2) - (350 / 2);
    //     let theLeft = (screen.width / 2) - (500 / 2);
    //     let toolbar = 'resizable=no,scrollbars=no,width=550,height=200,status=no,left=' + theLeft + ',top=' + theTop;

    //         window.open('./#/popup/consignment-calcbm-view/' + this.exptno, "CalculateCBM", toolbar);

    // }
    CalcbmModal() {
        if (this.noofpkgs == null || this.noofpkgs == 0 || this.noofpkgs == undefined) {
            this._toasterService.toast('error', 'Error', "No. of Packages can not be blank");
            return false;
        }

        if (this.grosswt == null || this.grosswt == "" || this.grosswt == undefined) {
            this._toasterService.toast('error', 'Error', "Gross Wt can not be blank");
            return false;
        }
        this.calcCBMmodel.show();

        // window.open('./#/popup/consignment-calcbm-Add/'  + this.grosswt + '/' + this.noofpieces + '/' , "CalculateCBM", toolbar);
    }
    CalcbmModalEdit() {
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        if (this.noofpkgs == null || this.noofpkgs == 0 || this.noofpkgs == undefined) {
            this._toasterService.toast('error', 'Error', "No. of Packages can not be blank");
            return false;
        }

        if (this.grosswt == null || this.grosswt == "" || this.grosswt == undefined) {
            this._toasterService.toast('error', 'Error', "Gross Wt can not be blank");
            return false;
        }
        this.calcCBMmodel.show();
        //  window.open('./#/popup/consignment-calcbm-Edit/'  + this.grosswt + '/' + this.noofpkgs + '/' + this.exptno + '/' , "CalculateCBM", toolbar);
    }
    GetTerminal(portcode) {
        this.portterminal = [];
        this.loadingportterminal = "";
        this.portterminal = this.Allportterminallist.filter((code: any) => code.ID.split("|")[1] === portcode);

    }

}
//End Ports and Goods




//Start Invoice
@Component({
    selector: 'app-consignment-invoice-edit',
    template: `
            				<table class="table table-bordered table-striped table-sm-new">
							   <tbody>
								  <tr>
									 <td class="col-form-span-heading" colspan="6">EXPORTER'S INVOICE DETAIL</td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Doc Recd. Date <span class="col-form-span-error">*</span></span> </td>
									 <td colspan="2"><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="docrecdt" required></my-date-picker></td>
									 <td class="width150"><span class="col-form-span-label"></span> </td>
									 <td colspan="2"></td>
								  </tr>
								 <tr>
									 <td class="width150"><span class="col-form-span-label">Gri No </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="grino" class="form-control"/></td>
									 <td class="width150"><span class="col-form-span-label">Gri Date </span> </td>
									 <td colspan="2"><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="gridt" required></my-date-picker></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Exporter Inv no.<span class="col-form-span-error">*</span></span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="expinvno" class="form-control"/></td>
									 <td class="width150"><span class="col-form-span-label">Inv Date<span class="col-form-span-error">*</span></span> </td>
									 <td colspan="2"><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="exptinvdt" required></my-date-picker></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Currency  </span> </td>
									 <td colspan="2">
										<ng-select [items]="commoncurrencies"
												   bindLabel="TEXTFIELD"
												   bindValue="VALUEFIELD"

												   [(ngModel)]="currency"
												   class="form-control"
												   (change)="changeCurrency(currency)"
												   >
										</ng-select>
									 </td>
									 <td class="width150"><span class="col-form-span-label">Currency Rate  </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="currencyrate" OnlyNumber="true" class="form-control" [disabled]="currency== 'CR115'"/></td>

								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">INR Rate </span> </td>
                                     <td colspan="2"><input type="text" [(ngModel)]="inrrate" OnlyNumber="true"  class="form-control" [disabled]="currency== 'CR115'"/></td>
                                     <td class="width150"><span class="col-form-span-label">Currency Rate  </span> </td>
									 <td colspan="2"></td>
								  </tr>
                                   <tr>
                                   <td class="width150"><span class="col-form-span-label">Incoterm </span> </td>
                                   <td colspan="2">
                                      <ng-select [items]="[{VALUEFIELD: 'FOB', TEXTFIELD: 'FOB'},{VALUEFIELD: 'CIF', TEXTFIELD: 'CIF'},{VALUEFIELD: 'C&F', TEXTFIELD: 'C&F'},{VALUEFIELD: 'C&I', TEXTFIELD: 'C&I'}]"
                                                 bindLabel="TEXTFIELD"
                                                 bindValue="VALUEFIELD"

                                                 [(ngModel)]="incoterm"
                                                 class="form-control"
                                                 (change)="changeIncoterm(incoterm)"
                                                 >
                                      </ng-select>
                                   </td>
                                    <td class="width150"><span class="col-form-span-label">Freight</span> </td>
                                    <td colspan="2">
                                        <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                                bindLabel="TEXTFIELD"
                                                bindValue="VALUEFIELD"

                                                [(ngModel)]="frieght"
                                                class="form-control"
                                                (change)="changefreight(frieght)"
                                                >
                                        </ng-select>
                                    </td>

								  </tr>
                                   <tr>
                                   <td class="width150"><span class="col-form-span-label">Invoice Amount<span class="col-form-span-error">*</span></span> </td>
                                   <td colspan="2"><input type="text" [(ngModel)]="invamt" OnlyNumber="true"  class="form-control" (keyup)="calculateFOBMarket()"/></td>
									 <td class="width150"><span class="col-form-span-label">Frieght Charges </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="frtchrgs" OnlyNumber="true" (keyup)="calculateFOBMarket()" class="form-control" [disabled]="incoterm== 'FOB' || incoterm== 'C&I'"/></td>

								  </tr>
                                   <tr>
                                   <td class="width150"><span class="col-form-span-label">Insurance Amount </span> </td>
                                   <td colspan="2"><input type="text" [(ngModel)]="insuramt" OnlyNumber="true" (keyup)="calculateFOBMarket()" class="form-control" [disabled]="incoterm== 'FOB' || incoterm== 'C&F'"/></td>
									 <td class="width150"><span class="col-form-span-label">Discount </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="discount" OnlyNumber="true" class="form-control"/></td>

								  </tr>
                                   <tr>
                                   <td class="width150"><span class="col-form-span-label">Packing & Others </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="pkgothrs" OnlyNumber="true" class="form-control"/></td>
									 <td class="width150"><span class="col-form-span-label">Commission </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="commission" OnlyNumber="true" class="form-control"/></td>

								  </tr>
                                   <tr>
                                   <td class="width150"><span class="col-form-span-label">Commission Paid to </span> </td>
                                   <td colspan="2"><input type="text" [(ngModel)]="commissionpaidto" class="form-control"/></td>
									 <td class="width150"><span class="col-form-span-label">Address1 </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="addrsone" class="form-control"/></td>

								  </tr>
                                   <tr>
                                   <td class="width150"><span class="col-form-span-label">Address2 </span> </td>
                                   <td colspan="2"><input type="text" [(ngModel)]="addrstwo" class="form-control"/></td>
									 <td class="width150"><span class="col-form-span-label">Nature of Payment </span> </td>
                                     <td colspan="2">

										<ng-select [items]="[{VALUEFIELD: '(LC)Letter of credit', TEXTFIELD: '(LC)Letter of credit'},{VALUEFIELD: '(DA)Delivery against acceptance', TEXTFIELD: '(DA)Delivery against acceptance'},{VALUEFIELD: '(DP)Delivery against payment', TEXTFIELD: '(DP)Delivery against payment'},{VALUEFIELD: '(AP)Advance payment', TEXTFIELD: '(AP)Advance payment'},{VALUEFIELD: '(NA)Not applicable', TEXTFIELD: '(NA)Not applicable'}]"
												   bindLabel="TEXTFIELD"
												   bindValue="VALUEFIELD"

												   [(ngModel)]="natureofpayment"
												   class="form-control"
												   >
										</ng-select>
									 </td>

								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Other Deduction </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="othrdeduction" OnlyNumber="true" class="form-control"/></td>
									 <td class="width150"><span class="col-form-span-label">Remark </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="remark" class="form-control"/></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">FOB INR </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="fobinr" class="form-control" OnlyNumber="true" disabled/></td>
									 <td class="width150"><span class="col-form-span-label">Market Value </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="marketval" class="form-control" OnlyNumber="true" disabled/></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Type of Shipping Bill </span> </td>
									 <td colspan="5">
										<ng-select [items]="[{VALUEFIELD: 'FREE', TEXTFIELD: 'FREE'},{VALUEFIELD: 'DEEC', TEXTFIELD: 'DEEC'},{VALUEFIELD: 'DEPB', TEXTFIELD: 'DEPB'},{VALUEFIELD: 'DBK', TEXTFIELD: 'DBK'},{VALUEFIELD: 'DEEC DBK', TEXTFIELD: 'DEEC DBK'},{VALUEFIELD: 'DUTY', TEXTFIELD: 'DUTY'},{VALUEFIELD: 'EOU/EX.BOND', TEXTFIELD: 'EOU/EX.BOND'},{VALUEFIELD: 'DFRC', TEXTFIELD: 'DFRC'},{VALUEFIELD: 'DFRC DEPB', TEXTFIELD: 'DFRC DEPB'},{VALUEFIELD: 'DFRC DRAWBACK', TEXTFIELD: 'DFRC DRAWBACK'},{VALUEFIELD: 'DEPB CUM DRAWBACK', TEXTFIELD: 'DEPB CUM DRAWBACK'}]"
												   bindLabel="TEXTFIELD"
												   bindValue="VALUEFIELD"

												   [(ngModel)]="typeshpnbill"
												   class="form-control"
												   (change)="changeddInvoiceShipType(typeshpnbill)"
												   >
										</ng-select>
									 </td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Value Addition % </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="valueaddition" class="form-control" OnlyNumber="true" [disabled]="typeshpnbill != 'EOU/EX.BOND'"/></td>
									 <td class="width150"><span class="col-form-span-label">Amount </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="valueamt" class="form-control" OnlyNumber="true" [disabled]="typeshpnbill != 'EOU/EX.BOND'"/></td>
								  </tr>
								   <tr>
									 <td class="width150" colspan="6">
										<span class="col-form-span-label">
											<input type="radio" name="InvShipType" [checked]="invshiptype == 'Provisional'" value="Provisional" (click)="changerbInvoiceShipType('Provisional')" [disabled]="typeshpnbill == 'FREE' || typeshpnbill == 'DBK' || typeshpnbill == 'DUTY' || typeshpnbill == 'EOU/EX.BOND' || typeshpnbill == 'DFRC' || typeshpnbill == 'DFRC DEPB' || typeshpnbill == 'DFRC DRAWBACK' || typeshpnbill == 'DEPB CUM DRAWBACK'"/>Provisional
										</span>
									</td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Receipt No. </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="receiptno" class="form-control" [disabled]="invshiptype != 'Provisional'"/></td>
									 <td class="width150"><span class="col-form-span-label">Date </span> </td>
									 <td colspan="2"><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="receiptdt" [disabled]="invshiptype != 'Provisional'"></my-date-picker></td>
								  </tr>
								   <tr>
									 <td class="width150" colspan="6"><span class="col-form-span-label"><input type="radio" name="InvShipType" [checked]="invshiptype == 'DEEC'" value="DEEC" (click)="changerbInvoiceShipType('DEEC')" [disabled]="typeshpnbill == 'FREE' || typeshpnbill == 'DBK' || typeshpnbill == 'DUTY' || typeshpnbill == 'EOU/EX.BOND' || typeshpnbill == 'DFRC' || typeshpnbill == 'DFRC DEPB' || typeshpnbill == 'DFRC DRAWBACK' || typeshpnbill == 'DEPB CUM DRAWBACK'"/>DEEC Book  </span> </td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Book No. </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="bookno" class="form-control" [disabled]="invshiptype != 'DEEC'"/></td>
									 <td class="width150"><span class="col-form-span-label">Date </span> </td>
									 <td colspan="2"><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="bookdt" [disabled]="invshiptype != 'DEEC'"></my-date-picker></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Advance Licence No  </span> </td>
									 <td colspan="5"><input type="text" [(ngModel)]="advlicenceno" class="form-control" [disabled]="invshiptype != 'DEEC'"/></td>
								  </tr>
								   <tr>
									 <td class="width150" colspan="6"><span class="col-form-span-label"><input type="radio" name="InvShipType" [checked]="invshiptype == 'Book'" value="Book" (click)="changerbInvoiceShipType('Book')" [disabled]="typeshpnbill == 'FREE' || typeshpnbill == 'DBK' || typeshpnbill == 'DUTY' || typeshpnbill == 'EOU/EX.BOND' || typeshpnbill == 'DFRC' || typeshpnbill == 'DFRC DEPB' || typeshpnbill == 'DFRC DRAWBACK' || typeshpnbill == 'DEPB CUM DRAWBACK'"/>Exp/Imp Book  </span> </td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Passbook No. </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="passbookno" class="form-control" [disabled]="invshiptype != 'Book'"/></td>
									 <td class="width150"><span class="col-form-span-label">Date </span> </td>
									 <td colspan="2"><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="passbookdt"  [disabled]="invshiptype != 'Book'"></my-date-picker></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Exempted Material Value </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="emvone" class="form-control" OnlyNumber="true" [disabled]="typeshpnbill == 'FREE' || typeshpnbill == 'DBK' || typeshpnbill == 'DUTY' || typeshpnbill == 'EOU/EX.BOND' || typeshpnbill == 'DFRC' || typeshpnbill == 'DFRC DEPB' || typeshpnbill == 'DFRC DRAWBACK' || typeshpnbill == 'DEPB CUM DRAWBACK'"/></td>
									 <td class="width150"><input type="text" [(ngModel)]="emvtwo" class="form-control" OnlyNumber="true" [disabled]="typeshpnbill == 'FREE' || typeshpnbill == 'DBK' || typeshpnbill == 'DUTY' || typeshpnbill == 'EOU/EX.BOND' || typeshpnbill == 'DFRC' || typeshpnbill == 'DFRC DEPB' || typeshpnbill == 'DFRC DRAWBACK' || typeshpnbill == 'DEPB CUM DRAWBACK'"/></td>
									 <td colspan="2"><input type="text" [(ngModel)]="emvthree" class="form-control" OnlyNumber="true" [disabled]="typeshpnbill == 'FREE' || typeshpnbill == 'DBK' || typeshpnbill == 'DUTY' || typeshpnbill == 'EOU/EX.BOND' || typeshpnbill == 'DFRC' || typeshpnbill == 'DFRC DEPB' || typeshpnbill == 'DFRC DRAWBACK' || typeshpnbill == 'DEPB CUM DRAWBACK'"/></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Group Code </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="groupcode" class="form-control" [disabled]="typeshpnbill != 'DEPB'"/></td>
									 <td class="width150"><span class="col-form-span-label">SION No. </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="sionno" class="form-control" [disabled]="typeshpnbill != 'DEPB'"/></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Duty % </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="dutyper" class="form-control" OnlyNumber="true" [disabled]="typeshpnbill != 'DUTY'"/></td>
									 <td class="width150"><span class="col-form-span-label">Duty Amount </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="dutyamt" class="form-control" OnlyNumber="true" [disabled]="typeshpnbill != 'DUTY'"/></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Cess % </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="cssper" class="form-control" OnlyNumber="true" [disabled]="typeshpnbill != 'DUTY'"/></td>
									 <td class="width150"></td>
									 <td colspan="2"></td>
								  </tr>
								   <tr>
									 <td class="width150" colspan="6"><span class="col-form-span-label"><input type="checkbox" class="col-form-span-label"  name="checkbox1" [(ngModel)]="imptlbluse">Import Lable Used </span> </td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Bill of Entry No. </span> </td>
									 <td colspan="2"><input type="text" [(ngModel)]="billentryno" class="form-control"/></td>
									 <td class="width150"><span class="col-form-span-label">Date </span> </td>
									 <td colspan="2"><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="billentrydt" required></my-date-picker></td>
								  </tr>

								</tbody>
							</table>

        `
})
export class InvoiceEditComponent {

    @Input() exptno: any;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

    commoncurrencies: any;

    pkid: number = null;
    docrecdt: any = null;
    grino: any = null;
    gridt: any = null;
    expinvno: any = null;
    exptinvdt: any = null;
    currency: any = null;
    currencyrate: any = null;
    inrrate: any = null;
    incoterm: any = "FOB";
    invamt: any = null;
    frtchrgs: any = null;
    insuramt: any = null;
    discount: any = "";
    pkgothrs: any = "";
    commission: any = "";
    commissionpaidto: any = "";
    addrsone: any = "";
    addrstwo: any = "";
    natureofpayment: any = null;
    othrdeduction: any = "";
    remark: any = "";
    fobinr: any = 0;
    marketval: any = 0;
    typeshpnbill: any = "FREE";
    valueaddition: any = "";
    valueamt: any = "";
    invshiptype: any = "";  //radio buttonoptions: Provisional ,DEEC, Book
    receiptno: any = "";
    receiptdt: any = null;
    bookno: any = "";
    bookdt: any = null;
    advlicenceno: any = "";
    passbookno: any = "";
    passbookdt: any = null;
    emvone: any = "";
    emvtwo: any = "";
    emvthree: any = "";
    groupcode: any = "";
    sionno: any = "";
    dutyper: any = "";
    dutyamt: any = "";
    cssper: any = "";
    imptlbluse: any = false;
    billentryno: any = "";
    billentrydt: any = null;
    arformnoone: any = "";
    arformdtone: any = null;
    arformcommone: any = "";
    arformdivone: any = "";
    arformrateone: any = "";
    arformnotwo: any = "";
    arformdttwo: any = null;
    arformcommtwo: any = "";
    arformdivtwo: any = "";
    arformratetwo: any = "";
    arformnothree: any = "";
    arformdtthree: any = null;
    arformcommthree: any = "";
    arformdivthree: any = "";
    arformratethree: any = "";
    arformnofour: any = "";
    arformdtfour: any = null;
    arformcommfour: any = "";
    arformdivfour: any = "";
    arformratefour: any = "";
    frieght: any = 'CC'

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
        selectorHeight: '180px',
        selectorWidth: '200px'
    };

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) { }


    funChangeInv() {
        this.dropdownfill();
        this.setInvoiceData(this.type, this._sharedconsig.exportEditData.EXPTNO, this._sharedconsig.exportEditData.EXPT_MODE);
    }

    dropdownfill() {
        const _jsonData = { Type1: "" };
        this._loaderService.display(true);
        this._dataService.Common("Export/InvoiceFillDropdown", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.commoncurrencies = data.Table;
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }
    changefreight(check): void {
        if (check != null) {
            if (check != "CC" && this.incoterm == "FOB") {
                var vrf = confirm("You selected Incoterm FOB and freight 'PP',It should be 'CC' ,Are you sure you want to freight as . " + check + "?");
                if (vrf == true) {
                    this.frieght = check;
                }
                else { this.frieght = 'CC'; }

            }
            else {
                if (check == "CC" && this.incoterm != "FOB") {
                    var vr = confirm("You selected Incoterm " + this.incoterm + " and freight 'CC',It should be 'PP' ,Are you sure you want to freight as . " + check + "?");
                    if (vr == true) {
                        this.frieght = check;
                    }
                    else { this.frieght = 'PP'; }
                }

            }
        }
    }

    setInvoiceData(typ, exptno, mode) {
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID,
            Type3: typ,
            Type4: this._loginService.getLogin()[0].GUID,
            Type5: mode
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentEditFillDetail", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.pkid = data.Table[0].PKID;
                this.docrecdt = (data.Table[0].DOC_RECD != "") ? this._dataService.stringdttoArry(data.Table[0].DOC_RECD) : null;
                this.grino = data.Table[0].GRI_NO;
                this.gridt = (data.Table[0].GRI_DATE != "") ? this._dataService.stringdttoArry(data.Table[0].GRI_DATE) : null;
                this.expinvno = data.Table[0].INV_NO;
                this.exptinvdt = (data.Table[0].INV_DATE != "") ? this._dataService.stringdttoArry(data.Table[0].INV_DATE) : null;
                this.currency = (data.Table[0].CUR_CODE != "") ? data.Table[0].CUR_CODE : null;
                this.currencyrate = data.Table[0].CUR_RATE;
                this.inrrate = data.Table[0].INR_RATE;
                this.incoterm = data.Table[0].INCOTERM;
                this.invamt = data.Table[0].INV_AMT;
                this.frtchrgs = data.Table[0].FREIGHT;
                this.insuramt = data.Table[0].INS_AMT;
                this.discount = data.Table[0].DISCOUNT;
                this.pkgothrs = data.Table[0].PACKING;
                this.commission = data.Table[0].COMMISSION;
                this.commissionpaidto = data.Table[0].COMMISSION_TO;
                this.addrsone = data.Table[0].ADDRESS1;
                this.addrstwo = data.Table[0].ADDRESS2;
                this.natureofpayment = (data.Table[0].NATUREOFPAYMENT != "") ? data.Table[0].NATUREOFPAYMENT : null;
                this.othrdeduction = data.Table[0].DEDUCTION;
                this.remark = data.Table[0].DEDUCTION_DESC;
                this.fobinr = data.Table[0].FOB;
                this.marketval = data.Table[0].MARKET_VALUE;
                this.typeshpnbill = (data.Table[0].SHIP_BILL != "") ? data.Table[0].SHIP_BILL : null;
                this.valueaddition = data.Table[0].SB_VALUE;
                this.valueamt = data.Table[0].SB_AMOUNT;

                if (data.Table[0].SB_BOOKTYPE == "P") { this.invshiptype = "Provisional"; }
                else if (data.Table[0].SB_BOOKTYPE == "B") { this.invshiptype = "DEEC"; }
                else if (data.Table[0].SB_BOOKTYPE == "E") { this.invshiptype = "Book"; }

                this.receiptno = data.Table[0].SB_PRO_RECNO;
                this.receiptdt = (data.Table[0].SB_PRO_RECDATE != "") ? this._dataService.stringdttoArry(data.Table[0].SB_PRO_RECDATE) : null;
                this.bookno = data.Table[0].SB_DEEC_BOOKNO;
                this.bookdt = (data.Table[0].SB_DEEC_BOOKDATE != "") ? this._dataService.stringdttoArry(data.Table[0].SB_DEEC_BOOKDATE) : null;
                this.advlicenceno = data.Table[0].SB_DEEC_LICNO;
                this.passbookno = data.Table[0].SB_EXP_BOOKNO;
                this.passbookdt = (data.Table[0].SB_EXP_BOOKDATE != "") ? this._dataService.stringdttoArry(data.Table[0].SB_EXP_BOOKDATE) : null;
                this.emvone = data.Table[0].SB_EXEMPT1;
                this.emvtwo = data.Table[0].SB_EXEMPT2;
                this.emvthree = data.Table[0].SB_EXEMPT3;
                this.groupcode = data.Table[0].SB_GROUPCODE;
                this.sionno = data.Table[0].SB_SIONNO;
                this.dutyper = data.Table[0].SB_DUTY;
                this.dutyamt = data.Table[0].SB_DUTYAMT;
                this.cssper = data.Table[0].SB_CESS;
                this.imptlbluse = (data.Table[0].IMP_LABLE == "yes") ? true : false;
                this.billentryno = data.Table[0].BILL_ENTRYNO;
                this.billentrydt = (data.Table[0].BILL_ENTRYDATE != "") ? this._dataService.stringdttoArry(data.Table[0].BILL_ENTRYDATE) : null;
                this.arformnoone = data.Table[0].ARFORMNO1;
                this.arformdtone = (data.Table[0].ARFORMDATE1 != "") ? this._dataService.stringdttoArry(data.Table[0].ARFORMDATE1) : null;
                this.arformcommone = data.Table[0].COMM_RATE1;
                this.arformdivone = data.Table[0].DIVISION1;
                this.arformrateone = data.Table[0].RANGE1;
                this.arformnotwo = data.Table[0].ARFORMNO2;
                this.arformdttwo = (data.Table[0].ARFORMDATE2 != "") ? this._dataService.stringdttoArry(data.Table[0].ARFORMDATE2) : null;
                this.arformcommtwo = data.Table[0].COMM_RATE2;
                this.arformdivtwo = data.Table[0].DIVISION2;
                this.arformratetwo = data.Table[0].RANGE2;
                this.arformnothree = data.Table[0].ARFORMNO3;
                this.arformdtthree = (data.Table[0].ARFORMDATE3 != "") ? this._dataService.stringdttoArry(data.Table[0].ARFORMDATE3) : null;
                this.arformcommthree = data.Table[0].COMM_RATE3;
                this.arformdivthree = data.Table[0].DIVISION3;
                this.arformratethree = data.Table[0].RANGE3;
                this.arformnofour = data.Table[0].ARFORMNO4;
                this.arformdtfour = (data.Table[0].ARFORMDATE4 != "") ? this._dataService.stringdttoArry(data.Table[0].ARFORMDATE4) : null;
                this.arformcommfour = data.Table[0].COMM_RATE4;
                this.arformdivfour = data.Table[0].DIVISION4;
                this.arformratefour = data.Table[0].RANGE4;
                this.frieght = data.Table[0].EXPT_FRT;
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

    changeCurrency(check): void {
        if (check != null) {
            if (check.split('|')[0] == 'CR115') { this.currencyrate = "1.00"; this.inrrate = "1.00"; }
            else { this.currencyrate = check.split('|')[2]; this.inrrate = check.split('|')[3]; }
        } else { this.currencyrate = ""; this.inrrate = ""; }
        this.calculateFOBMarket();
    }

    changeIncoterm(check): void {
        if (check != null) {
            this.incoterm = check;
            this.frtchrgs = (this.incoterm == 'FOB' || this.incoterm == 'C&I') ? '' : this.frtchrgs;
            this.insuramt = (this.incoterm == 'FOB' || this.incoterm == 'C&F') ? '' : this.insuramt;
        } else { this.frtchrgs = null; this.insuramt = null; }
        if (this.incoterm == 'FOB') {
            this.frieght = "CC"
        }
    }

    changeddInvoiceShipType(check): void {
        this.typeshpnbill = check;
        this.invshiptype = "";
    }

    changerbInvoiceShipType(check): void {
        this.invshiptype = check;
    }

    calculateFOBMarket() {
        let tmp: any, fob: any, mktvalue: any;
        if (this.currency.split('|')[0] == 'CR115') {
            fob = Math.abs(this.invamt) - (((this.insuramt != null) ? this.insuramt : 0) + ((this.frtchrgs != null) ? this.frtchrgs : 0));
        } else {
            tmp = (this.invamt - (((this.insuramt != null) ? this.insuramt : 0) + ((this.frtchrgs != null) ? this.frtchrgs : 0))) * this.inrrate;
            fob = tmp / this.currencyrate;
        }
        mktvalue = (fob * 1.10);
        this.fobinr = Math.round(fob * 100) / 100;
        this.marketval = Math.round(mktvalue * 100) / 100;
    }


    validateInvoice(): boolean {
        if (this.docrecdt == null) { this._toasterService.toast('error', 'Error', "Document Received Date can not be blank"); return false; }
        if (this.expinvno == null) { this._toasterService.toast('error', 'Error', "Invoice No. can not be blank"); return false; }
        if (this.exptinvdt == null) { this._toasterService.toast('error', 'Error', "Invoice Date can not be blank"); return false; }
        if (this._dataService.date2Comparison(this.exptinvdt.formatted, this.docrecdt.formatted) == false) { this._toasterService.toast('error', 'Error', "Invoice Date Should be less than or Equal to Doc. Recd Date."); return false; }
        if (this.invamt == null) { this._toasterService.toast('error', 'Error', "Invoice amount can not be blank"); return false; }
        if (this.incoterm != null) {
            if ((this.incoterm == "CIF") || (this.incoterm == "C&I")) {
                if (this.insuramt == null) {
                    this._toasterService.toast('error', 'Error', "Insurance amount can not be blank"); return false;
                } else if (this.insuramt > (this.invamt * 10 / 100)) {
                    this._toasterService.toast('error', 'Error', "Insurance Amount should be less than 10% of Invoice Amount"); return false;
                }
            }
            if ((this.incoterm == "CIF") || (this.incoterm == "C&I")) {
                if (this.frtchrgs == null) {
                    this._toasterService.toast('error', 'Error', "Freight Charges can not be blank"); return false;
                } else if (this.frtchrgs > (this.invamt * 60 / 100)) {
                    this._toasterService.toast('error', 'Error', "Freight Charges should be less than 60% of Invoice Amount"); return false;
                }
            }
        }
        return true;
    }

    validate() {
        if (this.validateInvoice() == false) { return false; }
        let expt_docrecd = (this.docrecdt != null) ? this.docrecdt.formatted : "";
        let expt_grino = (this.grino != null) ? this.grino : "";
        let expt_gridate = (this.gridt != null) ? this.gridt.formatted : "";
        let expt_invno = (this.expinvno != null) ? this.expinvno : "";
        let expt_invdate = (this.exptinvdt != null) ? this.exptinvdt.formatted : "";

        let expt_cur = (this.currency != null) ? this.currency.split("|")[0] : "";
        let expt_curname = (this.currency != null) ? this.currency.split("|")[1] : "";
        let expt_currate = (this.currency != null) ? this.currencyrate : "";
        let expt_curinrrate = (this.currency != null) ? this.inrrate : "";

        let expt_invtype = (this.incoterm != null) ? this.incoterm : "";

        let expt_invamt = (this.invamt != null) ? this.invamt : "";
        let expt_freight = (this.frtchrgs != null) ? this.frtchrgs : "";
        let expt_insamt = (this.insuramt != null) ? this.insuramt : "";
        let invdiscount = this.discount;
        let expt_packing = this.pkgothrs;
        let invcommission = this.commission;
        let commname = this.commissionpaidto;
        let commaddr1 = this.addrsone;
        let commaddr2 = this.addrstwo;
        let natureofpayment = (this.natureofpayment != null) ? this.natureofpayment : "";
        let invdeductamt = this.othrdeduction;
        let invdeductdesc = this.remark;
        let expt_fob = (this.fobinr != null) ? this.fobinr : "";
        let expt_mktvalue = this.marketval;

        let expt_shipbilltype = (this.typeshpnbill != null) ? this.typeshpnbill : "";
        let sbvalue = this.valueaddition;
        let sbamount = this.valueamt;

        let sbbooktype = "";
        if (this.invshiptype == "Provisional") { sbbooktype = "P"; }
        if (this.invshiptype == "DEEC") { sbbooktype = "B"; }
        if (this.invshiptype == "Book") { sbbooktype = "E"; }


        let sbprorecptno = this.receiptno;
        let sbprorecptdt = (this.receiptdt != null) ? this.receiptdt.formatted : "";
        let sbdeecbookno = this.bookno;
        let sbdeecbookdt = (this.bookdt != null) ? this.bookdt.formatted : "";
        let sbdeeclicno = this.advlicenceno;
        let sbexpbookno = this.passbookno;
        let sbexpbookdt = (this.passbookdt != null) ? this.passbookdt.formatted : "";
        let sbexempt1 = this.emvone;
        let sbexempt2 = this.emvtwo;
        let sbexempt3 = this.emvthree;
        let sbgroupcode = this.groupcode;
        let sbsionno = this.sionno;
        let sbduty = this.dutyper;
        let sbdutyamt = this.dutyamt;
        let sbcess = this.cssper;

        let implable = (this.imptlbluse == true) ? "yes" : "";

        let billentryno = this.billentryno;
        let billentrydt = (this.billentrydt != null) ? this.billentrydt.formatted : "";
        let arformno = this.arformnoone;
        let arformdt = (this.arformdtone != null) ? this.arformdtone.formatted : "";
        let commissionrate = this.arformcommone;
        let division = this.arformdivone;
        let range = this.arformrateone;
        let arformno1 = this.arformnotwo;
        let arformdt1 = (this.arformdttwo != null) ? this.arformdttwo.formatted : "";
        let commissionrate1 = this.arformcommtwo;
        let division1 = this.arformdivtwo;
        let range1 = this.arformratetwo;
        let arformno2 = this.arformnothree;
        let arformdt2 = (this.arformdtthree != null) ? this.arformdtthree.formatted : "";
        let commissionrate2 = this.arformcommthree;
        let division2 = this.arformdivthree;
        let range2 = this.arformratethree;
        let arformno3 = this.arformnofour;
        let arformdt3 = (this.arformdtfour != null) ? this.arformdtfour.formatted : "";
        let commissionrate3 = this.arformcommfour;
        let division3 = this.arformdivfour;
        let range3 = this.arformratefour;
        let _jsonFinal = {
            PKID: this.pkid,
            Exptno: this.exptno,
            Expt_Guid: this._loginService.getLogin()[0].GUID,
            Expt_Docrecd: expt_docrecd,
            Expt_Grino: expt_grino,
            Expt_Gridate: expt_gridate,
            Expt_Invno: expt_invno,
            Expt_Invdate: expt_invdate,
            Expt_Invtype: expt_invtype,
            Expt_Cur: expt_cur,
            Expt_Curname: expt_curname,
            Expt_Currate: expt_currate,
            Expt_Curinrrate: expt_curinrrate,
            Expt_Invamt: expt_invamt,
            Expt_Insamt: expt_insamt,
            Expt_Freight: expt_freight,
            Expt_Fob: expt_fob,
            Expt_Mktvalue: expt_mktvalue,
            Expt_Shipbilltype: expt_shipbilltype,
            Citycode: this._loginService.getLogin()[0].CITYCODE,
            Cmpcode: this._loginService.getLogin()[0].CMPCODE,
            Invcommission: invcommission,
            Invdiscount: invdiscount,
            Invdeductamt: invdeductamt,
            Invdeductdesc: invdeductdesc,
            Implable: implable,
            Billentryno: billentryno,
            Billentrydt: billentrydt,
            Sbvalue: sbvalue,
            Sbamount: sbamount,
            Sbbooktype: sbbooktype,
            Arformno: arformno,
            Arformdt: arformdt,
            Sbprorecptno: sbprorecptno,
            Sbprorecptdt: sbprorecptdt,
            Sbexempt1: sbexempt1,
            Sbexempt2: sbexempt2,
            Sbexempt3: sbexempt3,
            Sbdeecbookno: sbdeecbookno,
            Sbdeecbookdt: sbdeecbookdt,
            Sbdeeclicno: sbdeeclicno,
            Sbgroupcode: sbgroupcode,
            Sbsionno: sbsionno,
            Sbexpbookno: sbexpbookno,
            Sbexpbookdt: sbexpbookdt,
            Sbduty: sbduty,
            Sbdutyamt: sbdutyamt,
            Sbcess: sbcess,
            Natureofpayment: natureofpayment,
            Expt_Packing: expt_packing,
            Commname: commname,
            Commaddr1: commaddr1,
            Commaddr2: commaddr2,
            Commissionrate: commissionrate,
            Division: division,
            Range: range,
            Arformno1: arformno1,
            Arformdt1: arformdt1,
            Commissionrate1: commissionrate1,
            Division1: division1,
            Range1: range1,
            Arformno2: arformdt2,
            Arformdt2: arformdt2,
            Commissionrate2: commissionrate2,
            Division2: division2,
            Range2: range2,
            Arformno3: arformdt3,
            Arformdt3: arformdt3,
            Commissionrate3: commissionrate3,
            Division3: division3,
            Range3: range3,
            CmpId: this._loginService.getLogin()[0].CMPID,
            MakerIp: this._loginService.getLogin()[0].MAKERIP,
            Expt_Frt: this.frieght //Change later by IP
        }
        this.disabledBtn.emit(true);
        this._loaderService.display(true);
        this._dataService.Common("Export/UpdateInvoice", _jsonFinal)
            .subscribe((data: any) => {
                this.disabledBtn.emit(false);
                this._loaderService.display(false);
                this.result.emit({ status: data.Table[0].STATUS, message: "Export Invoice details updated Successfully!." });
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                });
    }
}
//End Invoice


//Start Documents
@Component({
    selector: 'app-consignment-document-edit',
    template: `
                        <table class="table table-bordered table-striped table-sm-new" *ngIf="receivedocumentlist.length > 0">
                           <thead>
                              <tr>
                                 <td class="col-form-span-heading" colspan="3">Received Documents </td>
                              </tr>
                              <tr class="col-form-span-heading">
                                 <th class="width75 centerlabel"></th>
                                 <th class="centerlabel"><span class="col-form-span-label">DOCUMENT NAME</span></th>
                                 <th class="width100 centerlabel"><span class="col-form-span-label">RECD DATE</span></th>
                              </tr>
						   </thead>
                           <tbody>
                              <tr *ngFor="let doc of receivedocumentlist">
                                 <td class="width75"><span class="col-form-span-label">{{doc.DOCCODE}}</span> </td>
                                 <td><span class="col-form-span-label">{{doc.DOCUMENT}}</span></td>
                                 <td class="width150"><span class="col-form-span-label">{{doc.RECDDATE}}</span></td>
                              </tr>
							</tbody>
						</table>
                        <table class="table table-bordered table-striped table-sm-new" *ngIf="calldocumentlist.length > 0">
                           <thead>
                              <tr>
                                 <td class="col-form-span-heading" colspan="6">Call Documents </td>
                              </tr>
                              <tr class="col-form-span-heading">
                                 <th class="width75 centerlabel"></th>
                                 <th class="centerlabel"><span class="col-form-span-label">DOCUMENT NAME</span></th>
                                 <th class="width150 centerlabel" colspan="2"><span class="col-form-span-label">RECD</span></th>
                                 <th class="width150 centerlabel" colspan="2"><span class="col-form-span-label">Call DATE</span></th>
                              </tr>
						   </thead>
                           <tbody>
                              <tr *ngFor="let doc of calldocumentlist">
                                 <td class="width75"><span class="col-form-span-label">{{doc.DOCCODE}}</span> </td>
                                 <td><span class="col-form-span-label">{{doc.DOCUMENT}}</span></td>
                                <td class="width10 centerlabel">
                                    <input type="radio" name="{{doc.DOCCODE}}" value="{{'R'+doc.DOCCODE}}" [(ngModel)]="doc.RECD" (click)="changeCallDocumentList(doc.DOCCODE, 'R')"/>
                                </td>
                                <td class="width150 centerlabel">
                                    <my-date-picker name="recdate" [options]="myDatePickerOptions" [(ngModel)]="doc.RECDT" [disabled]="doc.RECD == null"></my-date-picker>
                                </td>
                                <td class="width10 centerlabel">
                                    <input type="radio" name="{{doc.DOCCODE}}" value="{{'C'+doc.DOCCODE}}" [(ngModel)]="doc.CALL" (click)="changeCallDocumentList(doc.DOCCODE, 'C')"/>
                                </td>
                                 <td class="width150"><span class="col-form-span-label">{{doc.CALLEDDATE}}</span></td>
                              </tr>

                            </tbody>

                        </table>
                        <table *ngIf ="ActDocRECDT == '' ">
                            <tbody>
                                <tr>
                                    <td class="col-form-span-label" colspan="3" style="background-color: #91b57785; "><b>Actual Document Received on </b> </td>
                                    <td class="col-form-span-label" colspan="4" style="background-color: #91b57785; " >
                                        <my-date-picker name="recdate" [options]="myDatePickerOptions" [(ngModel)]="ActDocRECDT"></my-date-picker>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <table class="table table-bordered table-striped table-sm-new" *ngIf="otherdocumentlist.length > 0">
                           <thead>
                              <tr>
                                 <td class="col-form-span-heading" colspan="7">Other Documents </td>
                              </tr>
                              <tr class="col-form-span-heading">
                                 <th class="width75 centerlabel"><span class="col-form-span-label">SR. NO.</span></th>
                                 <th class="centerlabel"><span class="col-form-span-label">List of Documents</span></th>
                                 <th class="width150 centerlabel" colspan="2"><span class="col-form-span-label">RECD</span></th>
                                 <th class="width150 centerlabel" colspan="2"><span class="col-form-span-label">CALL FOR</span></th>
                                 <th class="width75 centerlabel"><span class="col-form-span-label">N.A.</span></th>
                              </tr>
							</thead>
                            <tbody>
							    <tr *ngFor="let doc of otherdocumentlist">
                                    <td class="width75"><span class="col-form-span-label">{{doc.DOCCODE}}</span></td>
                                    <td><span class="col-form-span-label">{{doc.DOCUMENT}}</span></td>
                                    <td class="width10 centerlabel">
                                        <input type="radio" name="{{doc.DOCCODE}}" value="{{'R'+doc.DOCCODE}}" [(ngModel)]="doc.RECD" (click)="changeDocumentList(doc.DOCCODE, 'R')"/>
                                    </td>
                                    <td class="width150 centerlabel">
                                        <my-date-picker name="recdate" [options]="myDatePickerOptions" [(ngModel)]="doc.RECDT" [disabled]="doc.RECD == null"></my-date-picker>
                                    </td>
                                    <td class="width10 centerlabel">
                                        <input type="radio" name="{{doc.DOCCODE}}" value="{{'C'+doc.DOCCODE}}" [(ngModel)]="doc.CALL" (click)="changeDocumentList(doc.DOCCODE, 'C')"/>
                                    </td>
                                    <td class="width150 centerlabel">
                                        <my-date-picker name="calldate" [options]="myDatePickerOptions" [(ngModel)]="doc.CALLT" [disabled]="doc.CALL == null"></my-date-picker>
                                    </td>
								    <td class="width75 centerlabel">
                                        <input type="radio" name="{{doc.DOCCODE}}" value="{{'N'+doc.DOCCODE}}" [(ngModel)]="doc.NA" (click)="changeDocumentList(doc.DOCCODE, 'N')"/>
                                    </td>
                                </tr>

                            </tbody>


						</table>
                `
})
export class DocumentEditComponent {

    @Input() exptno: any;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

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
        selectorHeight: '180px',
        selectorWidth: '200px'
    };

    receivedocumentlist: any = [];
    calldocumentlist: any = [];
    otherdocumentlist: any = [];
    ActDocRECDT: any = "";

    docreceived: any = "";
    doccallfor: any = "";
    recdstrfromcall: any = "";


    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) { }


    changeFunction() {
        this.setDocumentData(this.type, this._sharedconsig.exportEditData.EXPTNO, this._sharedconsig.exportEditData.EXPT_MODE);
        console.log(this._sharedconsig.exportEditData);
    }
    setDocumentData(typ, exptno, mode) {
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID,
            Type3: typ,
            Type4: this._loginService.getLogin()[0].GUID,
            Type5: mode
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentEditFillDetail", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.length > 0) {
                    this.receivedocumentlist = data.Table;
                    this.calldocumentlist = data.Table1;
                    this.otherdocumentlist = data.Table2;
                    this.ActDocRECDT = (data.Table3[0].ACTUAL_DOCRECDDT != "") ? this._dataService.stringdttoArry(data.Table3[0].ACTUAL_DOCRECDDT) : "";
                }
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

    changeDocumentList(check, rbtype): void {
        let updateItem = this.otherdocumentlist.find(item => item.DOCCODE === check);
        let rType = null, cType = null, ntype = null;
        if (rbtype == "R") { rType = 'R' + check; cType = null; ntype = null; }
        else if (rbtype == "C") { rType = null; cType = 'C' + check; ntype = null; }
        else if (rbtype == "N") { rType = null; cType = null; ntype = 'N' + check; }
        let index = this.otherdocumentlist.indexOf(updateItem);
        this.otherdocumentlist[index]["RECD"] = rType;
        this.otherdocumentlist[index]["RECDT"] = null;
        this.otherdocumentlist[index]["CALL"] = cType;
        this.otherdocumentlist[index]["CALLT"] = null;
        this.otherdocumentlist[index]["NA"] = ntype;
    }

    changeCallDocumentList(check, rbtype): void {
        let updateItem = this.calldocumentlist.find(item => item.DOCCODE === check);
        let rType = null, cType = null, ntype = null;
        if (rbtype == "R") { rType = 'R' + check; cType = null; ntype = null; }
        else if (rbtype == "C") { rType = null; cType = 'C' + check; ntype = null; }
        let index = this.calldocumentlist.indexOf(updateItem);
        this.calldocumentlist[index]["RECD"] = rType;
        this.calldocumentlist[index]["RECDT"] = null;
        this.calldocumentlist[index]["CALL"] = cType;
    }

    getCallDocumentValue() {
        this.recdstrfromcall = "";
        for (let doc of this.calldocumentlist) {
            if (doc.RECD != null) {
                if (doc.RECDT != null) {
                    this.recdstrfromcall += doc.RECD.substring(1) + ';' + doc.RECDT.formatted + ',';
                } else {
                    this._toasterService.toast('error', 'Error', "Please enter Recd Date.");
                    return false;
                }
            }
        }
    }

    getDocumentValue() {
        this.docreceived = "";
        this.doccallfor = "";
        for (let doc of this.otherdocumentlist) {
            if (doc.RECD != null) {
                if (doc.RECDT != null) {
                    this.docreceived += doc.RECD.substring(1) + ';' + doc.RECDT.formatted + ',';
                } else {
                    this._toasterService.toast('error', 'Error', "Please enter Recd Date.");
                    return false;
                }
            }
            else if (doc.CALL != null) {
                this.doccallfor += doc.CALL.substring(1) + ',';
                if (doc.CALLT != null) {
                    this.doccallfor += doc.CALL.substring(1) + ';' + doc.CALLT.formatted + ',';
                } else {
                    this._toasterService.toast('error', 'Error', "Please enter Called Date.");
                    return false;
                }
            }
        }
    }

    validate() {
        this.getCallDocumentValue();
        this.getDocumentValue();
        this.disabledBtn.emit(true);
        let actdocrecvd = ""
        if (this.ActDocRECDT == "") { actdocrecvd = "" } else { actdocrecvd = this.ActDocRECDT.formatted; }
        const _jsonData = {
            Type1: this.exptno,
            Type2: this.recdstrfromcall,
            Type3: this.docreceived,
            Type4: this.doccallfor,
            Type5: this._loginService.getLogin()[0].CITYCODE,
            Type6: this._loginService.getLogin()[0].CMPID,
            Type7: this._loginService.getLogin()[0].CMPID, //Change after by ip
            Type8: actdocrecvd
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/UpdateDocument", _jsonData)
            .subscribe((data: any) => {
                this.disabledBtn.emit(false);
                this._loaderService.display(false);
                this.result.emit({ status: data.Table[0].STATUS, message: "Document updated successfully." });
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

}
//End Documents

//Start ITC Code
@Component({
    selector: 'app-consignment-itc-code-edit',
    template: `
                <table class="table table-bordered table-striped table-sm-new">
							   <tbody>
								  <tr>
									 <td class="col-form-span-heading" colspan="6">ITC CODE DETAILS  </td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">ITC Code </span> </td>
									 <td><input type="text" [(ngModel)]="itccode" class="form-control"/></td>
									 <td class="width150"><span class="col-form-span-label">FOB INR </span> </td>
									 <td><input type="text" [(ngModel)]="itcfobinr" OnlyNumber="true" class="form-control"/></td>
									 <td class="width150"><span class="col-form-span-label">Drawback Sub Sr.No</span> </td>
									 <td><input type="text" [(ngModel)]="itcsrno" class="form-control"/></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Unit1 </span> </td>
									 <td><input type="text" [(ngModel)]="itcunitone" class="form-control" OnlyNumber="true"/></td>
									 <td class="width150"><span class="col-form-span-label">Type1  </span> </td>
									 <td><input type="text" [(ngModel)]="itctypeone" class="form-control"/></td>
									 <td class="width150"><span class="col-form-span-label">Group Code </span> </td>
									 <td><input type="text" [(ngModel)]="itcgroupcode" class="form-control"/></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Condition No. </span> </td>
									 <td><input type="text" [(ngModel)]="itcconditionno" class="form-control"/></td>
									 <td class="width150"><span class="col-form-span-label">Unit2 </span> </td>
									 <td><input type="text" [(ngModel)]="itcunittwo" class="form-control" OnlyNumber="true"/></td>
									 <td class="width150"><span class="col-form-span-label">Type2 </span> </td>
									 <td><input type="text" [(ngModel)]="itctypetwo" class="form-control"/></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Appendix of public notice </span> </td>
									 <td><input type="text" [(ngModel)]="itcnotice" class="form-control"/></td>
									 <td class="width150"><input type="radio" name="rbITC" [checked]="rbitc == 'yes'" (click)="changePercentUnit('Percent')" [disabled]="true"/><span class="col-form-span-label">% of Drawback </span> </td>
									 <td><input type="text" [(ngModel)]="itcpercent" class="form-control" OnlyNumber="true" [disabled]="true"/></td>
									 <td class="width150"><input type="radio" name="rbITC" [checked]="rbitc != 'yes'" (click)="changePercentUnit('PerUnit')"  [disabled]="true"/><span class="col-form-span-label">Rate per Unit</span> </td>
									 <td><input type="text" [(ngModel)]="itcperunit" OnlyNumber="true" class="form-control" [disabled]="true"/></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Description </span> </td>
									 <td colspan="5"><textarea rows="3" cols="20" class="form-control" OnlyCharacter="true" [maxlength]="380" [(ngModel)]="itcdescription"></textarea></td>
								  </tr>
								  <tr class="centerlabel">
									 <td colspan="6">
										<button type="button" class="btn btn-success" (click)="addEditITCDtls()" *ngIf="this.hditcid == '0'"><span class="col-form-span-label"><i class="fa fa-plus"></i>&nbsp;Add</span></button>
										<button type="button" class="btn btn-success" (click)="addEditITCDtls()" *ngIf="this.hditcid != '0'"><span class="col-form-span-label"><i class="fa fa-refresh"></i>&nbsp;Update</span></button>
										<button type="button" class="btn btn-secondary" (click)="resetITC()"><span class="col-form-span-label"><i class="fa fa-undo"></i>&nbsp;Reset</span></button>
									 </td>
								  </tr>
								</tbody>
							</table>
                            <div class="row xscroll" *ngIf="itclist.length > 0">
                                <table class="table table-bordered table-striped table-sm-new">
									<thead>
										<tr class="col-form-span-heading">
											<th class="width50 centerlabel"><span class="col-form-span-label"></span></th>
											<th class="width100 centerlabel"><span class="col-form-span-label">ITC Code</span></th>
											<th class="width100 centerlabel"><span class="col-form-span-label">FOB INR</span></th>
											<th class="width100 centerlabel"><span class="col-form-span-label">Drawback Sub Sr.No</span></th>
											<th class="width100 centerlabel"><span class="col-form-span-label">Unit1</span></th>
											<th class="width100 centerlabel"><span class="col-form-span-label">Type1</span></th>
											<th class="width100 centerlabel"><span class="col-form-span-label">Group Code</span></th>
											<th class="width100 centerlabel"><span class="col-form-span-label">Appendix of public notice</span></th>
											<th class="width100 centerlabel"><span class="col-form-span-label">Condition No.</span></th>
											<th class="width100 centerlabel"><span class="col-form-span-label">Unit2</span></th>
											<th class="width100 centerlabel"><span class="col-form-span-label">Type2</span></th>
											<th class="width100 centerlabel"><span class="col-form-span-label">% of Drawback</span></th>
											<th class="width100 centerlabel"><span class="col-form-span-label">Rate per Unit</span></th>
											<th class="width100 centerlabel"><span class="col-form-span-label">Description</span></th>
											</tr>
									</thead>
									<tbody>
										<tr *ngFor="let obj of itclist">
											<td class="centerlabel">
												<i class="fa fa-pencil" (click)="editITC(obj.TBL_INDEXID,obj.ITCCODEID,obj.ITCCODE,obj.EXPTNO)"></i>
												&nbsp;
												<i class="fa fa-trash" (click)="deleteModal.show(obj.TBL_INDEXID,obj.ITCCODEID,obj.ITCCODE,obj.EXPTNO)"></i>
											</td>
											<td><span class="col-form-span-label">{{obj.ITCCODE}}</span></td>
											<td><span class="col-form-span-label">{{obj.FOBINR}}</span></td>
											<td><span class="col-form-span-label">{{obj.DBKSUBSRNO}}</span></td>
											<td><span class="col-form-span-label">{{obj.UNIT}}</span></td>
											<td><span class="col-form-span-label">{{obj.TPE}}</span></td>
											<td><span class="col-form-span-label">{{obj.EXP_ITCGROUPCODE}}</span></td>
											<td><span class="col-form-span-label">{{obj.APPENDIXNO}}</span></td>
											<td><span class="col-form-span-label">{{obj.CONDITIONNO}}</span></td>
											<td><span class="col-form-span-label">{{obj.UNITA}}</span></td>
											<td><span class="col-form-span-label">{{obj.TPEA}}</span></td>
											<td><span class="col-form-span-label">{{obj.DBKPERCENT}}</span></td>
											<td><span class="col-form-span-label">{{obj.RATEPERUNIT}}</span></td>
											<td><span class="col-form-span-label">{{obj.DESCRIPTION}}</span></td>
											</tr>
									<tbody>
								</table>
                              </div>
        `
})
export class ITCCodeEditComponent {

    itclist: any = [];
    //ITC hd
    hditcid: any = "0";
    hditccodeid: any = "0";
    hditcdescid: any = "0";
    hditccount: any = "0";

    @Input() exptno: any;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

    itccode: any = "";
    itcfobinr: any = "";
    itcsrno: any = "";
    itcunitone: any = "";
    itctypeone: any = "";
    itcgroupcode: any = "";
    itcconditionno: any = "";
    itcunittwo: any = "";
    itctypetwo: any = "";
    itcnotice: any = "";
    itcpercent: any = 0;
    itcperunit: any = 0;
    rbitc: any = "yes"; //radio buttonoptions: yes
    itcdescription: any = "";


    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) { }


    changeItcedit() { this.setItcCodeData(this.type, this._sharedconsig.exportEditData.EXPTNO, this._sharedconsig.exportEditData.EXPT_MODE); }

    setItcCodeData(typ, exptno, mode) {
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID,
            Type3: typ,
            Type4: this._loginService.getLogin()[0].GUID,
            Type5: mode
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentEditFillDetail", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.length > 0) {
                    this.itclist = data.Table;
                    this.hditccount = data.Table[0].TOTALCOUNT;
                }
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

    changePercentUnit(check): void {
        this.rbitc = check;
        this.itcpercent = 0;
        this.itcperunit = 0;
    }

    addEditITCDtls() {
        if (this.validateITC() == false) { return false; }
        if (this.hditcid == '0') { if (this.itclist.length == 12) { this._toasterService.toast('error', 'Error', "You cant add ITC Details. -[MAX 12]"); return false; } }
        this.crudITC((this.hditcid == "0") ? "A" : "E", this.hditccodeid, this.exptno, this.itccode, this.itcfobinr, this.itcsrno, this.itcunitone, this.itctypeone, this.itcnotice, this.itcconditionno, this.itcunittwo, this.itctypetwo, this.itcpercent, (this.rbitc == "Percent") ? "yes" : "no", this.itcperunit, (this.rbitc == "Percent") ? this.itcpercent * this.itcfobinr / 100 : this.itcunittwo * this.itcperunit, this.itcgroupcode, this.itcdescription, this._loginService.getLogin()[0].CMPID, this.hditcid, this._loginService.getLogin()[0].GUID, this.hditcdescid);
    }

    validateITC() {
        if (this.itccode != "") {
            let pos = this.itccode.indexOf(".") + 1;
            let server = this.itccode.substring(pos);
            if (this.itccode.length < 9 || this.itccode.indexOf(".") == -1 || this.itccode.indexOf(" ") != -1 || server.length != 2) {
                this._toasterService.toast('error', 'Error', "Invalid ITC Code");
                return false;
            } else if (this.itcfobinr == "") { this._toasterService.toast('error', 'Error', "FOB INR can not be blank"); return false; }
            else if (this.itcsrno == "") { this._toasterService.toast('error', 'Error', "Drawback Sub sr.no can not be blank"); return false; }
        } else {
            this._toasterService.toast('error', 'Error', "ITC Code can not be empty.");
            return false;
        }
    }

    editITC(indexid, itcid, itccodeid, exptno) {
        let popData = this.itclist.filter((list: any) => list.TBL_INDEXID === indexid);
        //this.hdexptno = exptno;
        this.itccode = popData[0].ITCCODE;
        this.itcfobinr = popData[0].FOBINR;
        this.itcsrno = popData[0].DBKSUBSRNO;
        this.itcunitone = popData[0].UNIT;
        this.itctypeone = popData[0].TPE;
        this.itcnotice = popData[0].APPENDIXNO;
        this.itcconditionno = popData[0].CONDITIONNO;
        this.itcunittwo = popData[0].UNITA;
        this.itctypetwo = popData[0].TPEA;
        this.itcpercent = popData[0].DBKPERCENT;
        this.rbitc = (popData[0].DBKPERCENTA == "yes") ? "Percent" : "PerUnit";
        this.itcperunit = popData[0].RATEPERUNIT;
        this.itcgroupcode = popData[0].EXP_ITCGROUPCODE;
        this.itcdescription = popData[0].DESCRIPTION;
        this.hditcid = popData[0].TBL_INDEXID;
        this.hditccodeid = popData[0].ITCCODEID;
        this.hditcdescid = popData[0].ITCDESCID;
    }

    deleteITC(indexid, itcid, itccodeid, exptno) {
        this.crudITC("D", itcid, exptno, itccodeid, "", "", "", "", "", "", "", "", "", "", "", "", "", "", this._loginService.getLogin()[0].CMPID, indexid, this._loginService.getLogin()[0].GUID, "");
    }

    resetITC() {
        this.itccode = "";
        this.itcfobinr = "";
        this.itcsrno = "";
        this.itcunitone = "";
        this.itctypeone = "";
        this.itcgroupcode = "";
        this.itcconditionno = "";
        this.itcunittwo = "";
        this.itctypetwo = "";
        this.itcnotice = "";
        this.itcpercent = 0;
        this.itcperunit = 0;
        this.rbitc = "Percent";
        this.itcdescription = "";
        this.hditcid = "0";
        this.hditccodeid = "0";
        this.hditcdescid = "0";
    }

    crudITC(itctype, hditccodeid, hdexptno, itccode, itcfobinr, itcsrno, itcunitone, itctypeone, itcnotice, itcconditionno, itcunittwo, itctypetwo, itcpercent, itcpercenta, itcperunit, dbkamt, itcgroupcode, itcdescription, userid, hditcid, guid, hditcdescid) {
        const _itcsjsonData = {
            itctype: itctype,
            hditccodeid: hditccodeid,
            hdexptno: hdexptno,
            itccode: itccode,
            itcfobinr: itcfobinr,
            itcsrno: itcsrno,
            itcunitone: itcunitone,
            itctypeone: itctypeone,
            itcnotice: itcnotice,
            itcconditionno: itcconditionno,
            itcunittwo: itcunittwo,
            itctypetwo: itctypetwo,
            itcpercent: itcpercent,
            itcpercenta: itcpercenta,
            itcperunit: itcperunit,
            dbkamt: dbkamt,
            itcgroupcode: itcgroupcode,
            itcdescription: itcdescription,
            userid: userid,
            hditcid: hditcid,
            guid: guid,
            hditcdescid: hditcdescid
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentITC", _itcsjsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table[0].STATUS == "100") {
                    if (data.Table[0].STATUS.length == 0) {
                        this.hditccount = 0;
                    } else { this.hditccount = data.Table[0].TOTALCOUNT; }
                    this.itclist = data.Table;
                    this.resetITC();
                } else if (data.Table[0].STATUS == "103") {
                    this._toasterService.toast('error', 'Error', 'Drawback Sub Sr.No can not be same for same ITC code [' + data.Table[0].ITCCODE + ']');
                }
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                });
    }

    validate() {
        this.disabledBtn.emit(true);
        const _jsonData = {
            Type1: this.exptno,
            Type2: this._loginService.getLogin()[0].CMPID,
            Type3: this._loginService.getLogin()[0].MAKERIP,  //Change later by IP
            Type4: this._loginService.getLogin()[0].GUID
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/UpdateITC", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.disabledBtn.emit(false);
                this.result.emit({ status: data.Table[0].STATUS, message: "Export ITC details updated Successfully!." });
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

}
//End ITC Code




//Start Order No
@Component({
    selector: 'app-consignment-orderno-edit',
    template: `
                        <table class="table table-bordered table-striped table-sm-new">
                           <tbody>
							  <tr>
                                 <td class="width100"><span class="col-form-span-label">No.of Pieces </span> </td>
                                 <td class="width50"><input type="text" class="form-control width50" [(ngModel)]="ordernoofpcs" [readonly]="true"/></td>
                                 <td class="width100"><span class="col-form-span-label">{{ordertypeofpcs}}</span></td>
                                 <td class="width150"><span class="col-form-span-label">Export Contract No.</span> </td>
                                 <td><input type="text" class="form-control" [(ngModel)]="ordercontractno" /></td>
                                 <td class="width150"><span class="col-form-span-label">Period of Payment </span> </td>
                                 <td><input type="text" class="form-control" OnlyNumber="true" [(ngModel)]="orderpayment" /></td>
                              </tr>
                              <tr>
                              <td class="width100"><span class="col-form-span-label">No.of pkgs </span> </td>
                              <td class="width50"> <span class="col-form-span-label">{{hdnoofpkgs_total}}</span></td>
                              <td class="width100"><span class="col-form-span-label">Gr.Wt</span></td>
                              <td class="width150"><span class="col-form-span-label">{{hdnoofgrwt_total}}</span> </td>
                              <td> <span class="col-form-span-label">Net Wt</span></td>
                              <td class="width150"><span class="col-form-span-label">{{hdnoofnetwt_total}}</span></td>
                              <td><span class="col-form-span-label">Volume : {{hdnoofvolume_total}}</span></td>
                           </tr>
                            </tbody>
                        </table>
                        <table class="table table-bordered table-striped table-sm-new">
                           <tbody>
                              <tr>
                                 <td class="col-form-span-heading" colspan="6">ORDER NO DETAILS </td>
                              </tr>
                              <tr>
                                <td class="width130"><span class="col-form-span-label">Exists Order No. </span> </td>
                                    <td colspan="5">
                                        <ng-select [items]="orderexistnolist"
                                                    bindLabel="TEXTFIELD"
                                                    bindValue="VALUEFIELD"

                                                    [(ngModel)]="orderexistno"
                                                    class="form-control"
                                                    (change)="changeExistOrderNo(orderexistno)"
                                                    [disabled]="disabledExistOrderNoList"
                                                    >
                                        </ng-select>
                                    </td>
                              </tr>
							  <tr>
                                 <td class="width130"><span class="col-form-span-label">Order No. </span><span class="col-form-span-error">*</span> </td>
                                 <td><input type="text" class="form-control" OnlyCharacter="true" [(ngModel)]="orderno" /></td>
                                 <td class="width130"><span class="col-form-span-label">Reference No. </span> </td>
                                 <td colspan="2"><input type="text" class="form-control" OnlyCharacter="true" [(ngModel)]="orderreferenceno" /></td>

                              </tr>
                              <tr>
                                <td class="width130"><span class="col-form-span-label">Item Description </span> </td>
                                <td colspan="5"><input type="text" class="form-control" OnlyCharacter="true" [(ngModel)]="orderitemdesc" /></td>
                              </tr>
							  <tr>
                                 <td class="width130"><span class="col-form-span-label">Pieces </span> <span class="col-form-span-error">*</span></td>
                                 <td><input type="text" class="form-control" [(ngModel)]="orderpiece" OnlyNumber="true"/></td>
                                 <td class="width130"><span class="col-form-span-label">Type of Pieces </span> </td>
                                 <td><input type="text" class="form-control" [(ngModel)]="ordertypeofpiece" /></td>
								 <td class="width130"><span class="col-form-span-label">Pkgs </span> </td>
                                 <td><input type="text" class="form-control" [(ngModel)]="orderpackage"  OnlyNumber="true"/></td>
                              </tr>
							  <tr>
                                 <td class="width130"><span class="col-form-span-label">Warehouse </span> </td>
                                 <td><input type="text" class="form-control" OnlyCharacter="true" [(ngModel)]="orderwarehouse" /></td>
                                 <td class="width130"><span class="col-form-span-label">LSD Date  </span> </td>
                                 <td><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="orderlsddt" required></my-date-picker></td>
								 <td class="width130"><span class="col-form-span-label">DRN Date </span> </td>
                                 <td><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="orderdrndt" required></my-date-picker></td>
                              </tr>
							  <tr>
                                 <td class="width130"><span class="col-form-span-label">Gr. Wt </span> </td>
                                 <td><input type="text" class="form-control" [(ngModel)]="ordergrwt"  OnlyNumber="true"/></td>
                                 <td class="width130"><span class="col-form-span-label">Net Wts </span> </td>
                                 <td><input type="text" class="form-control" [(ngModel)]="ordernetwt"  OnlyNumber="true"/></td>
								 <td class="width130"><span class="col-form-span-label">Volume(CBM) </span> </td>
                                 <td><input type="text" class="form-control" [(ngModel)]="ordervolume"  OnlyNumber="true"/></td>
                              </tr>
							  <tr>
                                 <td class="width130"><span class="col-form-span-label">Chbl. Wt </span></td>
                                 <td><input type="text" class="form-control" [(ngModel)]="orderchblwt"  OnlyNumber="true"/></td>
                                 <td class="width130"><span class="col-form-span-label">FOB Value </span> </td>
                                 <td><input type="text" class="form-control" [(ngModel)]="orderfobval"  OnlyNumber="true"/></td>
								 <td class="width130"><span class="col-form-span-label">Currency </span> </td>
                                 <td><input type="text" class="form-control" [(ngModel)]="ordercurrency" /></td>
                              </tr>
							  <tr>
                                 <td class="width130"><span class="col-form-span-label">Cnee Dept (Rayon)</span></td>
                                 <td colspan="2"><input type="text" class="form-control" [(ngModel)]="ordercneedept" /></td>
                                 <td class="width130"><span class="col-form-span-label">Container No</span> </td>
                                 <td colspan="2"><input type="text" class="form-control" [(ngModel)]="ordercontainerno" /></td>
                              </tr>
							  <tr>
                                 <td class="width130"><span class="col-form-span-label">ICS HS Code</span></td>
                                 <td colspan="2"><input type="text" class="form-control" [(ngModel)]="ordericshscode"/></td>
                                 <td class="width130"><span class="col-form-span-label">ICS HS Description</span> </td>
                                 <td colspan="2"><input type="text" class="form-control" [(ngModel)]="ordericshsdescription"/></td>
                              </tr>
							  <tr class="centerlabel">
                                 <td colspan="6">
									<button type="button" class="btn btn-success" (click)="addEditOrderDtls()" *ngIf="this.hdordernoid == '0'"><span class="col-form-span-label"><i class="fa fa-plus"></i>&nbsp;Add</span></button>
									<button type="button" class="btn btn-success" (click)="addEditOrderDtls()" *ngIf="this.hdordernoid != '0'"><span class="col-form-span-label"><i class="fa fa-refresh"></i>&nbsp;Update</span></button>
									<button type="button" class="btn btn-secondary" (click)="resetOrder()"><span class="col-form-span-label"><i class="fa fa-undo"></i>&nbsp;Reset</span></button>
								 </td>
                              </tr>
							</tbody>
						</table>
                        <div class="row xscroll" *ngIf="orderlist.length > 0">
                            <table class="table table-bordered table-striped table-sm-new">
							    <thead>
								    <tr class="col-form-span-heading">
									    <th class="width50 centerlabel"><span class="col-form-span-label"></span></th>
									    <th class="width100 centerlabel"><span class="col-form-span-label">Order No.</span></th>
									    <th class="width100 centerlabel"><span class="col-form-span-label">Reference No</span></th>
									    <th class="width100 centerlabel"><span class="col-form-span-label">Pieces</span></th>
									    <th class="width100 centerlabel"><span class="col-form-span-label">Type of Pieces</span></th>
									    <th class="width100 centerlabel"><span class="col-form-span-label">Warehouse</span></th>
									    <th class="width100 centerlabel"><span class="col-form-span-label">Item Description</span></th>
									    <th class="width100 centerlabel"><span class="col-form-span-label">Pkgs</span></th>
									    <th class="width100 centerlabel"><span class="col-form-span-label">Gr. Wt</span></th>
									    <th class="width100 centerlabel"><span class="col-form-span-label">Net Wt</span></th>
									    <th class="width100 centerlabel"><span class="col-form-span-label">Volume</span></th>
									    <th class="width100 centerlabel"><span class="col-form-span-label">Chbl. Wt.</span></th>
									    <th class="width100 centerlabel"><span class="col-form-span-label">LSD Date</span></th>
									    <th class="width100 centerlabel"><span class="col-form-span-label">DRN Date</span></th>
									    <th class="width100 centerlabel"><span class="col-form-span-label">FOB Value</span></th>
                                        <th class="width100 centerlabel"><span class="col-form-span-label">Currency</span></th>
                                        <th class="width100 centerlabel"><span class="col-form-span-label">Cnee Dept (Rayon)</span></th>
                                        <th class="width100 centerlabel"><span class="col-form-span-label">Container No</span></th>
                                        <th class="width100 centerlabel"><span class="col-form-span-label">ICS HS Code</span></th>
                                        <th class="width100 centerlabel"><span class="col-form-span-label">ICS HS Description</span></th>
									    </tr>
							    </thead>
							    <tbody>
								    <tr *ngFor="let obj of orderlist">
									    <td class="centerlabel">
										    <i class="fa fa-pencil" (click)="editOrder(obj.TBL_INDEXID,obj.ORDERID,obj.EXPTNO,obj.ORDERNO)"></i>
										    <i class="fa fa-trash" (click)="deleteOrder(obj.TBL_INDEXID,obj.ORDERID,obj.EXPTNO,obj.ORDERNO)"></i>
									    </td>
									    <td><span class="col-form-span-label">{{obj.ORDERNO}}</span></td>
									    <td><span class="col-form-span-label">{{obj.STYLENO}}</span></td>
									    <td><span class="col-form-span-label">{{obj.PIECES}}</span></td>
									    <td><span class="col-form-span-label">{{obj.TYPEOFPCS}}</span></td>
									    <td><span class="col-form-span-label">{{obj.WAREHOUSE}}</span></td>
									    <td><span class="col-form-span-label">{{obj.ITEMDESC}}</span></td>
									    <td><span class="col-form-span-label">{{obj.PKGS}}</span></td>
									    <td><span class="col-form-span-label">{{obj.GRWT}}</span></td>
                                        <td><span class="col-form-span-label">{{obj.NETWT}}</span></td>
                                        <td><span class="col-form-span-label">{{obj.VOLUME}}</span></td>
									    <td><span class="col-form-span-label">{{obj.CHBLWT}}</span></td>
									    <td><span class="col-form-span-label">{{obj.LSD}}</span></td>
									    <td><span class="col-form-span-label">{{obj.DRNDATE}}</span></td>
									    <td><span class="col-form-span-label">{{obj.FOBVALUE}}</span></td>
                                        <td><span class="col-form-span-label">{{obj.CURENCY}}</span></td>
                                        <td><span class="col-form-span-label">{{obj.CneeDept}}</span></td>
                                        <td><span class="col-form-span-label">{{obj.ContainerNo}}</span></td>
                                        <td><span class="col-form-span-label">{{obj.ICSHSCode}}</span></td>
                                        <td><span class="col-form-span-label">{{obj.ICSHSDescription}}</span></td>
									    </tr>
							    <tbody>
						    </table>
                        </div>
    `
})
export class OrderNoEditComponent {

    @Input() exptno: string;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

    orderlist: any = [];

    hdorderid: any = "0";
    hdordernoid: any = "0";

    ordernoofpcs: number;
    ordertypeofpcs: any = "";
    ordercontractno: any = "";
    orderpayment: any = "";
    orderexistno: any = null;
    orderno: any = "";
    orderreferenceno: any = "";
    orderitemdesc: any = "";
    orderpiece: any = "";
    ordertypeofpiece: any = "";
    orderpackage: any = "";
    orderwarehouse: any = "";
    orderlsddt: any = null;
    orderdrndt: any = null;
    ordergrwt: any = "";
    ordernetwt: any = "";
    ordervolume: any = "";
    orderchblwt: any = "";
    orderfobval: any = "";
    ordercurrency: any = "";
    ordercneedept: any = "";
    ordercontainerno: any = "";
    ordericshscode: any = "";
    ordericshsdescription: any = "";

    hdnoofpcs_edit: any = "0";
    hdnoofpcs_total: any = "0";
    hdnoofpkgs_total: any = "0";
    hdnoofgrwt_total: any = "0";
    hdnoofnetwt_total: any = "0";
    hdnoofvolume_total: any = "0";
    hdchbl_total: any = "0";

    ordgrwt_total: any = "0";
    ordpkgs_total: any = "0";
    ordchbl_total: any = "0";



    orderexistnolist: Array<any> = [];
    disabledExistOrderNoList: boolean = false;
    dataConcode: any = '';
    dataGrpId: any = '';
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
        selectorHeight: '180px',
        selectorWidth: '200px'
    };

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) { }


    chnageFunOrder() {
        this.setOrderData(this.type, this._sharedconsig.exportEditData.EXPTNO, this._sharedconsig.exportEditData.EXPT_MODE);
    }

    setOrderData(typ, exptno, mode) {
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID,
            Type3: typ,
            Type4: this._loginService.getLogin()[0].GUID,
            Type5: mode
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentEditFillDetail", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table[0].STATUS == 100) {
                    this.orderlist = data.Table1;
                    if (data.Table.length > 0) {
                        this.ordercontractno = data.Table[0].EXPTCONTRACTNO;
                        this.orderpayment = data.Table[0].PERIODOFPAYMENT;
                        this.ordernoofpcs = data.Table[0].EXPT_NOOFPCS;
                        this.hdnoofpcs_total = data.Table[0].TOTAL;
                        this.hdnoofpcs_edit = "0";
                        this.ordertypeofpcs = data.Table[0].EXPT_TYPEOFPCS;
                        this.hdnoofpkgs_total = data.Table[0].expt_noofpkgs;
                        this.hdnoofgrwt_total = data.Table[0].expt_grwt;
                        this.hdnoofnetwt_total = data.Table[0].expt_netwt;
                        this.hdnoofvolume_total = data.Table[0].expt_volume;
                        this.hdchbl_total = data.Table[0].expt_chblwt;
                    }
                    else {
                        this.hdnoofpcs_total = "0";
                        this.hdnoofpcs_edit = "0";
                    }
                    this.dataConcode = (data.Table3[0].CON_CODE != '') ? data.Table3[0].CON_CODE : '';
                    this.dataGrpId = (data.Table3[0].GRPID != '0') ? data.Table3[0].GRPID : '0';
                    if (this._loginService.getLogin()[0].CMPCODE == "01") {
                        this.disabledExistOrderNoList = true;
                    } else {
                        this.getOrderList(data.Table3[0].CON_CODE, data.Table3[0].EXP_CODE, this._sharedconsig.exportEditData.EXPT_MODE + this._sharedconsig.exportEditData.ISDIFFAIR);
                    }
                    if (data.Table1.length > 0) {
                        this.ordgrwt_total = data.Table1[0].TOTAL_GRWT;
                        this.ordpkgs_total = data.Table1[0].TOTAL_PKG;
                        this.ordchbl_total = data.Table1[0].TOTAL_CHBL;
                    }
                }
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

    getOrderList(concode, expcode, exptmode) {
        const _jsonData = {
            concode: concode,
            expcode: expcode,
            exptmode: exptmode
        };
        this._loaderService.display(true);
        this._dataService.getData('Export/GetMainConsignmentOrderList', _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.orderexistnolist = data.Table;
                if (data.Table[0].STATUS == '100') {
                    this.orderexistnolist = data.Table;
                    this.orderexistnolist.forEach(obj => {
                        obj["VALUEFIELD"] = obj.ORDERNO + '|' + obj.STYLENO + '|' + obj.PCS + '|' + obj.STYLENO;
                        obj["TEXTFIELD"] = '<strong style="font-weight: bold;">Order No: </strong>' + obj.ORDERNO + '&nbsp;&nbsp;&nbsp;&nbsp;<strong style="font-weight: bold;"> Style No: </strong>' + obj.STYLENO + '&nbsp;&nbsp;&nbsp;&nbsp;<strong style="font-weight: bold;">Ref Assorti: </strong>' + obj.REF_ASSORTI;
                    });
                } else if (data.Table[0].STATUS == '103') {
                    alert(data.Table[0].STATUSTEXT);
                }
            });
    }

    changeExistOrderNo(check): void {
        if (check != null) {
            let filterData = this.orderexistnolist.filter((filterby) => filterby.ORDERNO == check.split("|")[0] && filterby.STYLENO == check.split("|")[1])[0];
            this.orderno = filterData.ORDERNO;
            this.orderreferenceno = filterData.STYLENO;
            this.orderpiece = filterData.PCS;
            this.ordergrwt = filterData.GRWT;
            this.ordernetwt = filterData.NETWT
            this.ordervolume = filterData.CBM;
            this.ordercneedept = filterData.REF_ASSORTI;
            this.orderpackage = filterData.PKGS;
        } else {
            this.orderno = "";
            this.orderreferenceno = "";
            this.orderpiece = "";
            this.ordergrwt = "";
            this.ordernetwt = "";
            this.ordervolume = "";
            this.orderpackage = "";
        }
    }

    addEditOrderDtls() {
        if (this.validateOrder()) {
            if (this._loginService.getLogin()[0].CMPCODE != "01") {
                if (!this.checkOrderExistInAddedList()) {
                    this.crudOrder((this.hdordernoid == "0") ? "A" : "E", this.hdordernoid,
                        this.hdorderid, this.exptno, this.orderno, this.orderpiece,
                        this.ordertypeofpiece, this.orderwarehouse, this.orderpackage,
                        this.ordergrwt, this.ordervolume, this.ordernetwt,
                        this.orderchblwt, this.orderitemdesc, (this.orderlsddt == null) ? "" : this.orderlsddt.formatted,
                        this.orderreferenceno, this.orderfobval, this.ordercurrency, (this.orderdrndt == null) ? "" : this.orderdrndt.formatted,
                        this.ordercneedept, this.ordercontainerno, this.ordericshscode, this.ordericshsdescription);
                }
            } else {
                this.crudOrder((this.hdordernoid == "0") ? "A" : "E", this.hdordernoid,
                    this.hdorderid, this.exptno, this.orderno, this.orderpiece,
                    this.ordertypeofpiece, this.orderwarehouse, this.orderpackage,
                    this.ordergrwt, this.ordervolume, this.ordernetwt,
                    this.orderchblwt, this.orderitemdesc, (this.orderlsddt == null) ? "" : this.orderlsddt.formatted,
                    this.orderreferenceno, this.orderfobval, this.ordercurrency, (this.orderdrndt == null) ? "" : this.orderdrndt.formatted,
                    this.ordercneedept, this.ordercontainerno, this.ordericshscode, this.ordericshsdescription);
            }
        }
    }

    checkOrderExistInAddedList(): boolean {
        let filterData = this.orderlist.filter((filterby) => filterby.ORDERNO == this.orderno && filterby.STYLENO == this.orderreferenceno && filterby.REF_ASSORTI == this.ordercneedept);
        if (this.orderlist.length > 0) {
            if (this.hdordernoid == 0) {
                if (filterData.length > 0) {
                    this._toasterService.toast('warning', 'Alert', 'You can not add same order number again.');
                    return true;
                } else { return false; }
            }
        }
        else {
            if (this.dataGrpId != '0') {
                let filterExist = this.orderexistnolist.filter((filterby) => filterby.ORDERNO == this.orderno && filterby.STYLENO == this.orderreferenceno);
                if (filterExist.length > 0) {
                    return false;
                } else {
                    this._toasterService.toast('warning', 'Alert', 'Order No does not exist in the list. You can not add manually');
                    return true;
                }
            }
        }
    }

    validateOrder(): boolean {
        if (this.orderno == "") { this._toasterService.toast('error', 'Error', 'Order No. can not be Empty.'); return false; }
        else if (Math.abs(this.orderpiece) == 0) { this._toasterService.toast('error', 'Error', 'Pieces can not be Empty.'); return false; }
        let TotalPcs = 0;
        TotalPcs = (Math.abs(this.orderpiece)) + (Math.abs(this.hdnoofpcs_total) - Math.abs(this.hdnoofpcs_edit));
        if (this.ordernoofpcs == null) {
            this._toasterService.toast('error', 'Error', "Please enter Total No.of Pcs.");
            return false;
        }
        if (Math.abs(TotalPcs) > Math.abs(this.ordernoofpcs)) {
            this._toasterService.toast('error', 'Error', "Sum of Pcs should be less then or equal to Total No.of Pcs (" + String(this.ordernoofpcs) + ")");
            return false;
        }

        return true;
    }

    editOrder(indexid, orderid, exptno, ordernoid) {
        let popData = this.orderlist.filter((list: any) => list.TBL_INDEXID === indexid);
        this.orderno = popData[0].ORDERNO;
        this.orderreferenceno = popData[0].STYLENO;
        this.orderitemdesc = popData[0].ITEMDESC;
        this.orderpiece = popData[0].PIECES;
        this.ordertypeofpiece = popData[0].TYPEOFPCS;
        this.orderpackage = popData[0].PKGS;
        this.orderwarehouse = popData[0].WAREHOUSE;
        this.orderlsddt = (popData[0].LSD != "") ? this._dataService.stringdttoArry(popData[0].LSD) : null;
        this.orderdrndt = (popData[0].DRNDATE != "") ? this._dataService.stringdttoArry(popData[0].DRNDATE) : null;
        this.ordergrwt = popData[0].GRWT;
        this.ordernetwt = popData[0].NETWT;
        this.ordervolume = popData[0].VOLUME;
        this.orderchblwt = popData[0].CHBLWT;
        this.orderfobval = popData[0].FOBVALUE;
        this.ordercurrency = popData[0].CURENCY;
        this.hdorderid = orderid;
        this.hdordernoid = indexid;
        this.hdnoofpcs_edit = popData[0].PIECES;
        this.ordercneedept = popData[0].CneeDept;
        this.ordercontainerno = popData[0].ContainerNo;
        this.ordericshscode = popData[0].ICSHSCode;
        this.ordericshsdescription = popData[0].ICSHSDescription;
    }

    deleteOrder(indexid, orderid, exptno, orderno) {
        this.crudOrder("D", indexid, orderid, exptno, orderno, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "");
    }

    crudOrder(ordertype, ordernoid, orderid, exptno, orderno, orderpiece, ordertypeofpiece, orderwarehouse, orderpackage, ordergrwt, ordervolume, ordernetwt, orderchblwt, orderitemdesc, orderlsddt, orderreferenceno, orderfobval, ordercurrency, orderdrndt, ordercneedept, ordercontainerno, ordericshscode, ordericshsdescription) {
        const _orderjsonData = {
            ordertype: ordertype,
            ordernoid: ordernoid,
            orderid: orderid,
            exptno: exptno,
            orderno: orderno,
            orderpiece: orderpiece,
            ordertypeofpiece: ordertypeofpiece,
            orderwarehouse: orderwarehouse,
            orderpackage: orderpackage,
            ordergrwt: ordergrwt,
            ordervolume: ordervolume,
            ordernetwt: ordernetwt,
            orderchblwt: orderchblwt,
            orderitemdesc: orderitemdesc,
            orderlsddt: orderlsddt,
            orderreferenceno: orderreferenceno,
            orderfobval: orderfobval,
            ordercurrency: ordercurrency,
            orderdrndt: orderdrndt,
            userid: this._loginService.getLogin()[0].CMPID,
            guid: this._loginService.getLogin()[0].GUID,
            ordercneedept: ordercneedept,
            ordercontainerno: ordercontainerno,
            ordericshscode: ordericshscode,
            ordericshsdescription: ordericshsdescription,
            concode: this.dataConcode
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentOrder", _orderjsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.orderlist = data.Table;
                this.hdnoofpcs_edit = "0";
                this.hdnoofpcs_total = data.Table[0].TOTAL;
                this.resetOrder();
                this.orderexistno = null;

                this.ordgrwt_total = data.Table[0].TOTAL_GRWT;
                this.ordpkgs_total = data.Table[0].TOTAL_PKG;
                this.ordchbl_total = data.Table[0].TOTAL_CHBL;
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                });
    }
    resetOrder() {
        this.orderno = "";
        this.orderreferenceno = "";
        this.orderitemdesc = "";
        this.orderpiece = "";
        this.ordertypeofpiece = "";
        this.orderpackage = "";
        this.orderwarehouse = "";
        this.orderlsddt = null;
        this.orderdrndt = null;
        this.ordergrwt = "";
        this.ordernetwt = "";
        this.ordervolume = "";
        this.orderchblwt = "";
        this.orderfobval = "";
        this.ordercurrency = "";
        this.hdorderid = "0";
        this.hdordernoid = "0";
    }

    validate() {


        if (this.ordpkgs_total != this.hdnoofpkgs_total) {
            this._toasterService.toast('warning', 'warning', "Sum of No.of Pkgs (" + String(this.ordpkgs_total) + ") should not match with Total ex-Job Pkgs (" + String(this.hdnoofpkgs_total) + ")");
            return false;
        }
        if (this._sharedconsig.exportEditData.EXPT_MODE != "SEA") {
            if (this.ordgrwt_total != this.hdnoofgrwt_total) {
                this._toasterService.toast('warning', 'warning', "Sum of  Grwt (" + String(this.ordgrwt_total) + ") shoulds  not match with Total ex-Job grwt (" + String(this.hdnoofgrwt_total) + ")");
                return false;
            }
            if (this.ordchbl_total != this.hdchbl_total) {
                this._toasterService.toast('warning', 'warning', "Sum of   ChblWt (" + String(this.ordchbl_total) + ") should not match with Total ex-Job chblwt (" + String(this.hdchbl_total) + ")");
                return false;
            }
        }
        this.disabledBtn.emit(true);
        const _jsonData = {
            Type1: this.exptno,
            Type2: this.ordercontractno,
            Type3: this.orderpayment,
            Type4: this._loginService.getLogin()[0].CMPID,
            Type5: this._loginService.getLogin()[0].MAKERIP,  //Change later by IP
            Type6: this._loginService.getLogin()[0].GUID
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/UpdateOrder", _jsonData)
            .subscribe((data: any) => {
                this.disabledBtn.emit(false);
                this._loaderService.display(false);
                this.result.emit({ status: data.Table[0].STATUS, message: "Export Order no details updated Successfully!." });
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }
}


@Component({
    selector: 'app-consignment-orderno-quality-checking-edit',
    templateUrl: 'consg-main-orderno-qc.component.html',
})
export class OrderNoQualityCheckingComponent implements OnInit {
    @Input() exptno: string;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

    OrderNorQcList: Array<any> = [];
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
        selectorHeight: '180px',
        selectorWidth: '200px'
    };

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        const jsonExport = {
            exptno: this.exptno
        };
        this._loaderService.display(true);
        this._dataService.getData('Export/OrderNoQcList', jsonExport)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.OrderNorQcList = data.Table;
            });
    }

    validate() {
        let Data_Rec = '';
        for (let i = 0; i < this.OrderNorQcList.length; i++) {
            if (this.OrderNorQcList[i]["IS_QCFLAG"] == '1') {
                if (this.OrderNorQcList[i]["QC_TYPE"] == '0') {
                    alert("Please Select Type of Qc");
                    return false;
                } else {
                    if (this.OrderNorQcList[i]["QC_PLANNEDDT"] == '' || this.OrderNorQcList[i]["QC_PLANNEDDT"] == null) {
                        alert("Please Enter Planned Date");
                        return false;
                    }
                    if (this.OrderNorQcList[i]["QC_ACTUALDT"] != '' || this.OrderNorQcList[i]["QC_ACTUALDT"] != null) {
                        if (this._dataService.DateFromAndToComparision(this.OrderNorQcList[i]["QC_ACTUALDT"].formatted, this.OrderNorQcList[i]["QC_PLANNEDDT"].formatted) == false) {
                            alert("Actual date should be greater than Planned date");
                            return false;
                        }
                    }
                }
            }
            let PlannedDate = '', ActualDate = '';
            PlannedDate = (this.OrderNorQcList[i]["QC_PLANNEDDT"] == '' || this.OrderNorQcList[i]["QC_PLANNEDDT"] == null) ? '' : this.OrderNorQcList[i]["QC_PLANNEDDT"].formatted;
            ActualDate = (this.OrderNorQcList[i]["QC_ACTUALDT"] == '' || this.OrderNorQcList[i]["QC_ACTUALDT"] == null) ? '' : this.OrderNorQcList[i]["QC_ACTUALDT"].formatted;
            Data_Rec += '|' + this.OrderNorQcList[i]["ORDERNO"] + '|' + this.OrderNorQcList[i]["STYLENO"] + '|' + this.OrderNorQcList[i]["IS_QCFLAG"] + '|' + this.OrderNorQcList[i]["QC_TYPE"] + '|' + PlannedDate + '|' + ActualDate + ';'
        }
        this.disabledBtn.emit(true);
        const _jsonExport = {
            Type1: Data_Rec,
            Type2: this.exptno,
            Type3: this._loginService.getLogin()[0].CMPID,
            Type4: this._loginService.getLogin()[0].MAKERIP     //Change later by Ip
        };
        this._loaderService.display(true);
        this._dataService.Common('Export/OrderNoQcListSubmit', _jsonExport)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.disabledBtn.emit(false);
                this.result.emit({ status: data.Table[0].STATUS, message: "Export Order no Quality Checking updated Successfully!." });
            });
    }

    openWindow(exptno, orderno, styleno, concode) {
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);

        let toolbar = 'resizable=no,scrollbars=no,width=500,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/order-size-detail/' + exptno + '/' + orderno + '/' + styleno + '/' + concode, "Order_Size", toolbar);
    }

}
//End Order No

//Start Package No
@Component({
    selector: 'app-consignment-package-edit',
    template: `
                       <table class="table table-bordered table-striped table-sm-new">
                           <tbody>
                              <tr>
                                 <td class="col-form-span-heading" colspan="8">PACKAGE NO - DETAILS </td>
                              </tr>
                              <tr>
                                 <td class="width75"><span class="col-form-span-label">No.Of Pkg. </span> </td>
                                 <td class="width50"><input type="text" class="form-control width50" [(ngModel)]="noofpkg" OnlyNumber="true" [readonly]="true"/></td>
                                 <td colspan="6"><span class="col-form-span-label">{{typeofpkg}}</span></td>
                              </tr>
                            </tbody>
                        </table>
                        <table class="table table-bordered table-striped table-sm-new">
                           <tbody>
                              <tr>
                                 <td class="width75"><span class="col-form-span-label">From </span> </td>
                                 <td class="width200"><input type="text" class="form-control" [(ngModel)]="packagefrom" OnlyNumber="true" /></td>
                                 <td class="width75"><span class="col-form-span-label">To </span> </td>
                                 <td class="width200"><input type="text" class="form-control" [(ngModel)]="packageto" OnlyNumber="true" /></td>
								 <td class="width75"><span class="col-form-span-label">Alphabet </span> </td>
                                 <td class="width200"><input type="text" class="form-control" [(ngModel)]="packagealphabet" OnlyCharacter="true" /></td>
                              </tr>
							</tbody>
						</table>
                        <table class="table table-bordered table-striped table-sm-new">
                           <tbody>
                              <tr>
                                 <td class="centerlabel">
									<button type="button" class="btn btn-success" (click)="addEditPkgDtls()" *ngIf="this.hdpkgindexid == '0'"><span class="col-form-span-label"><i class="fa fa-plus"></i>&nbsp;Add</span></button>
									<button type="button" class="btn btn-success" (click)="addEditPkgDtls()" *ngIf="this.hdpkgindexid != '0'"><span class="col-form-span-refresh"><i class="fa fa-plus"></i>&nbsp;Update</span></button>
                                    <button type="button" class="btn btn-secondary" (click)="resetPackage()"><span class="col-form-span-label"><i class="fa fa-undo"></i>&nbsp;Reset</span></button>
								</td>
                              </tr>
							</tbody>
						</table>
                        <table class="table table-bordered table-striped table-sm-new" *ngIf="packagelist.length > 0">
							<thead>
								<tr class="col-form-span-heading">
									<th class="width50 centerlabel"><span class="col-form-span-label"></span></th>
									<th colspan="2" class="width250 centerlabel"><span class="col-form-span-label">From</span></th>
									<th colspan="2" class="width250 centerlabel"><span class="col-form-span-label">To</span></th>
									<th colspan="3" class="width300 centerlabel"><span class="col-form-span-label">Alphabet</span></th>
									</tr>
							</thead>
							<tbody>
								<tr *ngFor="let pl of packagelist">
									<td class="centerlabel">
										<i class="fa fa-pencil" (click)="editPackage(pl.TBL_INDEXID,pl.PKGNOID,pl.EXPTNO)"></i>
										&nbsp;&nbsp;
										<i class="fa fa-trash" (click)="deletePackage(pl.TBL_INDEXID,pl.PKGNOID,pl.EXPTNO)"></i>
									</td>
									<td colspan="2"><span class="col-form-span-label">{{pl.FROM}}</span></td>
									<td colspan="2"><span class="col-form-span-label">{{pl.TO}}</span></td>
									<td colspan="3"><span class="col-form-span-label">{{pl.ALPHABET}}</span></td>
									</tr>
							<tbody>
						</table>
                `
})
export class PackageEditComponent {

    @Input() exptno: any;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

    packagelist: any = [];
    hdexptno = null;
    hdpkgindexid: any = "0";
    hdpkgnoid: any = "0";
    packagefrom: any = "";
    packageto: any = "";
    packagealphabet: any = "";
    noofpkg: number;
    typeofpkg: any = null;
    hdnoofpkg_edit: any = null;
    hdnoofpkg_total: any = null;

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) { }

    changeFunction() {
        this.setPackageData(this.type, this._sharedconsig.exportEditData.EXPTNO, this._sharedconsig.exportEditData.EXPT_MODE);
        this.hdexptno = this._sharedconsig.exportEditData.EXPTNO;
    }

    setPackageData(typ, exptno, mode) {
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID,
            Type3: typ,
            Type4: this._loginService.getLogin()[0].GUID,
            Type5: mode
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentEditFillDetail", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table2[0].STATUS == 100) {
                    this.packagelist = data.Table;
                    this.noofpkg = data.Table1[0].EXPT_NOOFPKGS;
                    this.typeofpkg = data.Table1[0].EXPT_TYPEOFPKGS;
                    this.hdnoofpkg_edit = "0";
                    this.hdnoofpkg_total = data.Table1[0].TOTAL;
                }
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }


    addEditPkgDtls() {
        if (this.validatePkgs() == false) { return false; };
        this.crudPackage(this.hdpkgindexid, this.hdpkgnoid, this.hdexptno, (this.hdpkgindexid == "0") ? "A" : "E", this.packagefrom, this.packageto, this.packagealphabet);
        return false;
    }

    editPackage(indexid, pkgnoid, exptno) {
        let popData = this.packagelist.filter((list: any) => list.TBL_INDEXID === indexid);
        this.hdpkgindexid = popData[0].TBL_INDEXID;
        this.hdpkgnoid = popData[0].PKGNOID;
        this.hdexptno = popData[0].EXPTNO;
        this.packagefrom = popData[0].FROM;
        this.packageto = popData[0].TO;
        this.packagealphabet = popData[0].ALPHABET;
        //this.hdnoofpkg_edit = "0";


    }

    deletePackage(indexid, pkgnoid, exptno) {
        this.crudPackage(indexid, pkgnoid, exptno, "D", "", "", "");
    }

    crudPackage(indexid, pkgnoid, exptno, pkgtype, pkgfrom, pkgto, pkgalphabet) {
        const _pkgsjsonData = {
            indexid: indexid,
            pkgnoid: pkgnoid,
            exptno: exptno,
            pkgtype: pkgtype,
            pkgfrom: pkgfrom,
            pkgto: pkgto,
            pkgalphabet: pkgalphabet,
            userid: this._loginService.getLogin()[0].CMPID,
            guid: this._loginService.getLogin()[0].GUID
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentPackage", _pkgsjsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.packagelist = data.Table;
                this.hdnoofpkg_edit = "0";
                if (data.Table.length > 0) {
                    this.hdnoofpkg_total = data.Table[0].TOTAL;
                }
                else { this.hdnoofpkg_total = "0"; }
                this.resetPackage();
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                });
    }

    resetPackage() {
        this.hdpkgindexid = "0";
        this.hdpkgnoid = "0";
        this.packagefrom = "";
        this.packageto = "";
        this.packagealphabet = "";
        this.hdnoofpkg_edit = "0";
    }

    validatePkgs() {
        if (Math.abs(this.packagefrom) == 0) { this._toasterService.toast('error', 'Error', "From No. can not be Empty & should be greater then 0."); return false; }
        if (Math.abs(this.packageto) == 0) { this._toasterService.toast('error', 'Error', "To No. can not be Empty & should be greater then 0."); return false; }
        if (Math.abs(this.packagefrom) > Math.abs(this.packageto)) { this._toasterService.toast('error', 'Error', "From No. should be less then To No."); return false; }
        let TotalPkgs = 0;
        TotalPkgs = ((Math.abs(this.packageto) - Math.abs(this.packagefrom)) + 1) + (Math.abs(this.hdnoofpkg_total) - Math.abs(this.hdnoofpkg_edit));

        if (this.noofpkg == null) { this._toasterService.toast('error', 'Error', "Please enter Total No.of Pkgs."); return false; }
        if (Math.abs(TotalPkgs) > Math.abs(this.noofpkg)) {
            this._toasterService.toast('error', 'Error', "Sum of No.of Pkgs(" + String(TotalPkgs) + ") should be less then or equal to Total No.of Pkgs (" + String(this.noofpkg) + ")");
            return false;
        }
    }

    validate() {
        this.disabledBtn.emit(true);
        const _jsonData = {
            Type1: this.exptno,
            Type2: this._loginService.getLogin()[0].CMPID,
            Type3: this._loginService.getLogin()[0].MAKERIP,  //Change later by IP
            Type4: this._loginService.getLogin()[0].GUID
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/UpdatePackage", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(true);
                this.disabledBtn.emit(false);
                this.result.emit({ status: data.Table[0].STATUS, message: "Package updated Successfully!." });
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

}
//End Package No


//Start Marks & Numbers
@Component({
    selector: 'app-consignment-marks-number-edit',
    template: `
                        <table class="table table-bordered table-striped table-sm-new">
                           <tbody>
                              <tr>
                                 <td class="col-form-span-heading" colspan="4">MASRKS & NUMBERS - DETAILS </td>
                              </tr>
                              <tr>
                                 <td class="width150"><span class="col-form-span-label">Marks & Numbers </span> </td>
                                 <td><textarea rows="15" cols="25" class="form-control" OnlyCharacter="true" [(ngModel)]="marksandnumbers"></textarea></td>
                                 <td colspan="2" class="width150"></td>
                              </tr>
							</tbody>
						</table>
                `
})
export class MarksNumberEditComponent implements OnInit {

    @Input() exptno: any;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

    marksandnumbers: any = null;

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this.setMarksData(this.type, this._sharedconsig.exportEditData.EXPTNO, this._sharedconsig.exportEditData.EXPT_MODE);
    }


    setMarksData(typ, exptno, mode) {
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID,
            Type3: typ,
            Type4: this._loginService.getLogin()[0].GUID,
            Type5: mode
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentEditFillDetail", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.marksandnumbers = data.Table[0].REMARKS;
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

    validate() {
        this.disabledBtn.emit(true);
        const _jsonData = {
            Type1: this.exptno,
            Type2: this.marksandnumbers,
            Type3: this._loginService.getLogin()[0].CMPID,
            Type4: this._loginService.getLogin()[0].GUID
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/UpdateMarksNumber", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.disabledBtn.emit(false);
                this.result.emit({ status: data.Table[0].STATUS, message: "Marks and Number updated Successfully!." });
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

}
//End Marks & Numbers

//Start Quota
@Component({
    selector: 'app-consignment-quota-edit',
    template: `
                   		<table class="table table-bordered table-striped table-sm-new">
							   <tbody>
								  <tr>
									 <td class="col-form-span-heading" colspan="6">QUOTA DETAILS </td>
								  </tr>
								  <tr>
									 <td class="width100"><span class="col-form-span-label">Certificate No.1 </span> </td>
									 <td><input type="text" class="form-control" [(ngModel)]="quotacertnoone"  OnlyCharacter="true"/></td>
									 <td class="width100"><span class="col-form-span-label">Certificate No.2 </span> </td>
									 <td><input type="text" class="form-control" [(ngModel)]="quotacertnotwo"  OnlyCharacter="true"/></td>
									 <td class="width100"><span class="col-form-span-label">Certificate No. </span> </td>
									 <td><input type="text" class="form-control" [(ngModel)]="quotacertnothree"  OnlyCharacter="true"/></td>
								  </tr>
								  <tr>
									 <td class="width100"><span class="col-form-span-label">Validate Date </span> </td>
									 <td><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="quotavalidatedt"></my-date-picker></td>
									 <td class="width100"><span class="col-form-span-label">Obtain Date </span> </td>
									 <td><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="quotaobtaindt"></my-date-picker></td>
									 <td class="width100"><span class="col-form-span-label">Expiry Date  </span> </td>
									 <td><my-date-picker name="mydate3" [options]="myDatePickerOptions" [(ngModel)]="quotaexpirydt"></my-date-picker></td>
								  </tr>
								</tbody>
							</table>

                `
})
export class QuotaEditComponent implements OnInit {

    @Input() exptno: any;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

    pkid: number = null;
    quotacertnoone: any = "";
    quotacertnotwo: any = "";
    quotacertnothree: any = "";
    quotavalidatedt: any = null;
    quotaobtaindt: any = null;
    quotaexpirydt: any = null;

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
        selectorHeight: '180px',
        selectorWidth: '200px'
    };

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this.setQuotaData(this.type, this._sharedconsig.exportEditData.EXPTNO, this._sharedconsig.exportEditData.EXPT_MODE);
    }

    setQuotaData(typ, exptno, mode) {
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID,
            Type3: typ,
            Type4: this._loginService.getLogin()[0].GUID,
            Type5: mode
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentEditFillDetail", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.length > 0) {
                    this.pkid = data.Table[0].PKID;
                    this.exptno = data.Table[0].EXPTNO;
                    this.quotacertnoone = data.Table[0].CRT1;
                    this.quotacertnotwo = data.Table[0].CRT2;
                    this.quotacertnothree = data.Table[0].CRT3;
                    this.quotavalidatedt = (data.Table[0].VALID_DATE != "") ? this._dataService.stringdttoArry(data.Table[0].VALID_DATE) : null;
                    this.quotaobtaindt = (data.Table[0].OBTAIN_DATE != "") ? this._dataService.stringdttoArry(data.Table[0].OBTAIN_DATE) : null;
                    this.quotaexpirydt = (data.Table[0].EXPIRY_DATE != "") ? this._dataService.stringdttoArry(data.Table[0].EXPIRY_DATE) : null;
                }
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

    validate() {
        this.disabledBtn.emit(true);
        const _jsonData = {
            Type1: this.pkid,
            Type2: this.exptno,
            Type3: this.quotacertnoone,
            Type4: this.quotacertnotwo,
            Type5: this.quotacertnothree,
            Type6: (this.quotavalidatedt != null) ? this.quotavalidatedt.formatted : '',
            Type7: (this.quotaobtaindt != null) ? this.quotaobtaindt.formatted : '',
            Type8: (this.quotaexpirydt != null) ? this.quotaexpirydt.formatted : '',
            Type9: this._loginService.getLogin()[0].CMPID,
            Type10: this._loginService.getLogin()[0].MAKERIP  //Change later by IP
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/UpdateQuota", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.disabledBtn.emit(false);
                this.result.emit({ status: data.Table[0].STATUS, message: "Export Quota details updated Successfully!." });
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

}
//End Quota

//Start Consignee Remark
@Component({
    selector: 'app-consignment-consignree-remark-edit',
    template: `
                    <app-consignment-consignee-view></app-consignment-consignee-view>
                    <table class="table table-bordered table-striped table-sm-new">
						<tbody>
                            <tr>
								<td class="width150"><span class="col-form-span-label">Remark</span></td>
                                <td colspan="3"><textarea rows="15" cols="15" class="form-control width150" OnlyCharacter="true" [(ngModel)]="remarks"></textarea></td>
							</tr>
						</tbody>
					</table>
                `
})
export class ConsigneeRemarkEditComponent implements OnInit {

    @Input() exptno: any;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

    pkid: any = null;
    remarks: any = null;

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this.setConsigneeData(this.type, this._sharedconsig.exportEditData.EXPTNO, this._sharedconsig.exportEditData.EXPT_MODE);
    }

    setConsigneeData(typ, exptno, mode) {
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID,
            Type3: typ,
            Type4: this._loginService.getLogin()[0].GUID,
            Type5: mode
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentEditFillDetail", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.status != undefined) {
                    this._toasterService.toast('error', 'Error', data.status + '<br/>' + data.statusText);
                } else {
                    this.remarks = data.Table[0].CONREMARK;
                    this.pkid = data.Table[0].PKID;
                }
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

    validate() {
        this.disabledBtn.emit(true);
        const _jsonData = {
            Type1: this.pkid,
            Type2: this.exptno,
            Type3: this.remarks,
            Type4: this._loginService.getLogin()[0].CMPID,
            Type5: this._loginService.getLogin()[0].MAKERIP //Change later to IP
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/UpdateConsigneeRemark", _jsonData)
            .subscribe((data: any) => {
                this.disabledBtn.emit(false);
                this._loaderService.display(false);
                this.result.emit({ status: data.Table[0].STATUS, message: "Remark updated successfully." });
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

}
//End Consignee Remark

//Start Consignee View
@Component({
    selector: 'app-consignment-consignee-view',
    template: `
                   		<table class="table table-bordered table-striped table-sm-new">
							   <tbody>
								  <tr>
									 <td class="col-form-span-heading" colspan="4">General Details </td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Export No.</span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.exptno_view}}</span></td>
									 <td class="width150"><span class="col-form-span-label">Doc recd date </span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.DOC_RECD_DATE}}</span></td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">Shipper Name </span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{consigneeData.SHIPPER_NAME}}</span></td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">Consignee </span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{consigneeData.CONSIGNEE}}</span></td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">Invoice No.</span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.INV_NO}}</span></td>
									 <td class="width150"><span class="col-form-span-label">Invoice date </span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.INV_DATE}}</span></td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">GRI No.</span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.GRI_NO}}</span></td>
									 <td class="width150"><span class="col-form-span-label">GRI date </span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.GRI_DATE}}</span></td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">Total No. of Packages </span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.TOTAL_NO_OF_PACKAGES}}</span></td>
									 <td class="width150"><span class="col-form-span-label">Total No. of Pieces </span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.TOTAL_NO_OF_PIECES}}</span></td>
								  </tr>
								  <tr>
									 <td class="col-form-span-heading" colspan="4">Vessel Detail</td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">Vessel Name </span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{vesselData.VESSEL_NAME}}</span></td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">ETD   </span> </td>
									 <td><span class="col-form-span-label">{{vesselData.ETD}}</span></td>
									 <td class="width150"><span class="col-form-span-label">Actual Departure </span> </td>
									 <td><span class="col-form-span-label">{{vesselData.ACTUAL_DEPARTURE}}</span></td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">Order No. </span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{consigneeData.ORDERNO}}</span></td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">GR.WT. </span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.GR_WT}}</span></td>
									 <td class="width150"><span class="col-form-span-label">NET WT. </span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.NET_WT}}</span></td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">VOLUME </span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.VOLUME}}</span></td>
									 <td class="width150"><span class="col-form-span-label"></span> </td>
									 <td></td>
								  </tr>
								</tbody>
							</table>
                `
})
export class ConsigneeViewComponent implements OnInit {

    consigneeData: any = {
        EXPORT_NO: null,
        EXPT_EXPORTER: null,
        EXPT_CONSIGNEE: null,
        TOTAL_NO_OF_PACKAGES: null,
        TOTAL_NO_OF_PIECES: null,
        EXPT_VESSEL: null,
        DOC_RECD_DATE: null,
        INV_NO: null,
        INV_DATE: null,
        GRI_NO: null,
        GRI_DATE: null,
        EXPT_SHIPBILLTYPE: null,
        EXPT_FOB: null,
        TYPE_OF_PACKAGES: null,
        TYPE_OF_PIECES: null,
        GR_WT: null,
        NET_WT: null,
        VOLUME: null,
        SHIPPER_NAME: null,
        CONSIGNEE: null,
        ORDERNO: null,
        exptno_view: null,
    };
    vesselData: any = {
        VESSEL_NAME: null,
        VSL_RTNO: null,
        VSL_NAME: null,
        VSL_VOYNO: null,
        ROTATION: null,
        ETD: null,
        ACTUAL_DEPARTURE: null,
        CARTING: null,
        VSLDELAY: null
    };

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this.setConsigneeData(this._sharedconsig.exportEditData.EXPTNO);
    }

    setConsigneeData(exptno) {
        const _jsonData = {
            Type1: exptno
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsigneeView", _jsonData)
            .subscribe((data: any) => {

                this.consigneeData = {
                    EXPORT_NO: data.Table[0].EXPORT_NO,
                    EXPT_EXPORTER: data.Table[0].EXPT_EXPORTER,
                    EXPT_CONSIGNEE: data.Table[0].EXPT_CONSIGNEE,
                    TOTAL_NO_OF_PACKAGES: data.Table[0].TOTAL_NO_OF_PACKAGES,
                    TOTAL_NO_OF_PIECES: data.Table[0].TOTAL_NO_OF_PIECES,
                    EXPT_VESSEL: data.Table[0].EXPT_VESSEL,
                    DOC_RECD_DATE: data.Table[0].DOC_RECD_DATE,
                    INV_NO: data.Table[0].INV_NO,
                    INV_DATE: data.Table[0].INV_DATE,
                    GRI_NO: data.Table[0].GRI_NO,
                    GRI_DATE: data.Table[0].GRI_DATE,
                    EXPT_SHIPBILLTYPE: data.Table[0].EXPT_SHIPBILLTYPE,
                    EXPT_FOB: data.Table[0].EXPT_FOB,
                    TYPE_OF_PACKAGES: data.Table[0].TYPE_OF_PACKAGES,
                    TYPE_OF_PIECES: data.Table[0].TYPE_OF_PIECES,
                    GR_WT: data.Table[0].GR_WT,
                    NET_WT: data.Table[0].NET_WT,
                    VOLUME: data.Table[0].VOLUME,
                    SHIPPER_NAME: data.Table[0].SHIPPER_NAME,
                    CONSIGNEE: data.Table[0].CONSIGNEE,
                    ORDERNO: data.Table[0].ORDERNO,
                    exptno_view: data.Table[0].exptno_view
                };
                if (data.Table1.length > 0) {
                    this.vesselData = {
                        VESSEL_NAME: data.Table1[0].VESSEL_NAME,
                        VSL_RTNO: data.Table1[0].VSL_RTNO,
                        VSL_NAME: data.Table1[0].VSL_NAME,
                        VSL_VOYNO: data.Table1[0].VSL_VOYNO,
                        ROTATION: data.Table1[0].ROTATION,
                        ETD: data.Table1[0].ETD,
                        ACTUAL_DEPARTURE: data.Table1[0].ACTUAL_DEPARTURE,
                        CARTING: data.Table1[0].CARTING,
                        VSLDELAY: data.Table1[0].VSLDELAY
                    };
                }
                this._loaderService.display(false);
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); this._loaderService.display(false); },
                () => { });
    }

    validate() {
        alert('Consignee View');
    }

}
//End Consignee View


// @Component({
//     selector: 'app-consignment-mawb-edit',
//     templateUrl: 'consign_main_mawb_rating.component.html',

// })
// export class MAWBEditComponent   {

//     @Input() exptno: any;
//     @Input() type: string;
//     @Output() result: EventEmitter<any> = new EventEmitter<any>();
//     @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

//     netData: any = [];
//     tdsData: any = [];
//     serviceTax: any = [];

//     pageload: boolean = false;
//     SupplierNet: any = null;
//     TariffRate: any = null;
//     NetRate: any = null;
//     CityCode: any = null;

//     CalOneDcTar: number = null;
//     CalOneDcNet: number = null;
//     CalTwoDcTar: number = null;
//     CalTwoDcNet: number = null;

//     NetRightsAdd: boolean = false;
//     NetRights: boolean = false;
//     hdNetRights: boolean = false;

//     dataMode: string = null;

//     Wgt: any = null;
//     UserWgt: any = null;
//     GrossWeight: any = null;
//     UserGrossWeight: any = null;
//     isMinRate: boolean = false;
//     FreightRate: any = 'PP';
//     AgentsRate: any = '0.00';

//     //FREIGHT (BASIC)
//     TarFreightPayOn: any = 'CW';
//     TarFreightRate: any = null;
//     TarFreight: any = null;
//     TarFreightFrt: string = 'PP';
//     NetFreightPayOn: any = 'CW';
//     NetFreightRate: any = null;
//     NetFreight: any = null;
//     NetFreightFrt: string = 'PP';
//     //FSC
//     TarFscPayOn: any = null;
//     TarFscRate: any = null;
//     TarFsc: any = null;
//     TarFscFrt: string = 'PP';
//     NetFscPayOn: any = null;
//     NetFscRate: any = null;
//     NetFsc: any = null;
//     NetFscFrt: string = 'PP';
//     //IRC
//     TarIrcPayOn: any = null;
//     TarIrcRate: any = null;
//     TarIrc: any = null;
//     TarIrcFrt: string = 'PP';
//     NetIrcPayOn: any = null;
//     NetIrcRate: any = null;
//     NetIrc: any = null;
//     NetIrcFrt: string = 'PP';
//     //XRAY
//     TarXrayPayOn: any = null;
//     TarXrayRate: any = null;
//     TarXray: any = null;
//     TarXrayFrt: string = 'PP';
//     NetXrayPayOn: any = null;
//     NetXrayRate: any = null;
//     NetXray: any = null;
//     NetXrayFrt: string = 'PP';
//     //MISCELLANEOUS CHARGES
//     TarMcPayOn: any = 'CW';
//     TarMcRate: any = null;
//     TarMc: any = null;
//     TarMcFrt: string = 'PP';
//     NetMcPayOn: any = 'CW';
//     NetMcRate: any = null;
//     NetMc: any = null;
//     NetMcFrt: string = 'PP';
//     //CTG
//     TarCtgPayOn: any = 'GW';
//     TarCtgRate: any = null;
//     TarCtg: any = null;
//     TarCtgFrt: string = 'PP';
//     NetCtgPayOn: any = 'GW';
//     NetCtgRate: any = null;
//     NetCtg: any = null;
//     NetCtgFrt: string = 'PP';
//     //THC
//     TarThcPayOn: any = 'CW';
//     TarThcRate: any = null;
//     TarThc: any = null;
//     TarThcFrt: string = 'PP';
//     NetThcPayOn: any = 'GW';
//     NetThcRate: any = null;
//     NetThc: any = null;
//     NetThcFrt: string = 'PP';
//     //BUSINESS PROMOTION
//     TarBPPayOn: any = 'CW';
//     TarBPRate: any = null;
//     TarBP: any = null;
//     TarBPFrt: string = 'PP';
//     NetBPPayOn: any = 'CW';
//     NetBPRate: any = null;
//     NetBP: any = null;
//     NetBPFrt: string = 'PP';

//     TarAms: any = null;
//     TarAmsFrt: any = 'PP';
//     NetAms: any = null;
//     NetAmsFrt: any = 'PP';

//     HawbTar: any = null;
//     HawbTarFrt: any = 'PP';
//     HawbNet: any = null;
//     HawbNetFrt: any = 'PP';

//     PcaTar: any = null;
//     PcaTarFrt: any = 'PP';
//     PcaNet: any = null;
//     PcaNetFrt: any = 'PP';

//     DurCarrierTar: any = null;
//     DurCarrierTarCC: any = null;
//     DurCarrierNet: any = null;
//     DurCarrierNetCC: any = null;

//     DueAgentTar: any = null;
//     DueAgentTarCC: any = null;
//     DueAgentNet: any = null;
//     DueAgentNetCC: any = null;

//     TotalTar: any = null;
//     TotalTarCC: any = null;
//     TotalNet: any = null;
//     TotalNetCC: any = null;

//     OtherTar: any = null;
//     OtherTarFrt: any = 'PP';
//     OtherNet: any = null;
//     OtherNetFrt: any = 'PP';

//     AirFrtCommission: any = null;

//     FrtRebate: any = null;

//     BusinesPromo: any = null;

//     DrpTDS: any = null;
//     TxtTDS: any = null;

//     DrpServiceTax: any = null;
//     TxtServiceTax: any = null;

//     OtherChrg1: any = null;
//     OtherAmt1_Tar: any = null;
//     OtherAmt1TarFrt: any = 'PP';
//     OtherAmt1_Net: any = null;
//     OtherAmt1NetFrt: any = 'PP';

//     OtherChrg2: any = null;
//     OtherAmt2_Tar: any = null;
//     OtherAmt2TarFrt: any = 'PP';
//     OtherAmt2_Net: any = null;
//     OtherAmt2NetFrt: any = 'PP';

//     Remark: string = null;
//     Ppchrg: string = null;
//     Ccchrg: string = null;
//     Pptotagt: string = null;
//     Cctotagt: string = null;
//     Pptotcarr: string = null;
//     Cctotcarr: string = null;
//     Pptot: string = null;
//     Cctot: string = null;
//     Othchrg: string = null;
//     ISAUTO_FRT_INV: string ="";
//     oldchblwt: any = null;
//     oldgrwt : any = null;
// //AIRLINE CHARGES
// dtAirLineCharges: Array<any> = [];
// AirLineCharges: any = [];
// AllAirLineChargeslist:any=[];
// ChrgTypelist:any=[];
// ChrgTypelistold:Array<any> = [];
// CHARGETYPE:string;
// DELCHARGETYPE:string;
// CHARGENAME:string;
// EDIT_CHARGETYPE:string="";
// EDIT_RATE_TAR:any = null;
// DEL_RATE_TAR:any = null;
// RATE_TAR: any = null;
// RATE_TAR_FRT:string="";
// DEL_RATE_TAR_FRT:string;
// RATE_NET: any = null;
// EDIT_RATE_NET:any = null;
// DEL_RATE_NET:any = null;
// RATE_NET_FRT:string;
// DEL_RATE_NET_FRT:string;
// childID:string="0";
// Chargeslist: any = [];
// HAWBChargeslist: any = [];
// makerid:string;
// guid :string="";
// txtchild : string ="Add"
// CHRGDETAILSID:string="0";
// FK_ID: string="0";
// PK_ID: string="0";
// tot_rate_tar_pp_da:any = null;
// tot_rate_tar_pp_dc:any = null;
// tot_rate_tar_cc_da:any = null;
// tot_rate_tar_cc_dc:any = null;
// tot_rate_net_pp_da:any = null;
// tot_rate_net_pp_dc:any = null;
// tot_rate_net_cc_da:any = null;
// tot_rate_net_cc_dc:any = null;
// dttable6: any = [];

//     constructor(private _dataService: DataService,
//         private _loginService: LoginService,
//         private _toasterService: ToastCommonService,
//         private _sharedconsig: SharedDataSerice,
//         private _loaderService: LoaderService) {
//         this.exptno = this.exptno;
//     }


//     changefunction()
//     {  var verifyData = null;
//         this._loginService.verifyRights(236, '')
//             .subscribe((data: any) => {
//                 this._loginService.checkVerify('Modify', data);  //For verify user access
//                 this._loginService.verifyRights(264, '')
//                     .subscribe((returnData: any) => {
//                         this.NetRightsAdd = this._loginService.returnRights('Add', returnData, this._loginService.getLogin()[0].ROLETYPE);
//                         if (this.NetRightsAdd == false) {
//                             this.NetRights = this._loginService.returnRights('View', returnData, this._loginService.getLogin()[0].ROLETYPE);
//                         }
//                         this.hdNetRights = (this.NetRightsAdd == true) ? true : false;
//                     });
//                // this._loaderService.display(true);
//                 verifyData = data.Table;
//                 this.Resetchildrcrd();
//                 this.setDropDownData(this._sharedconsig.exportEditData.MAWBNO, this._sharedconsig.exportEditData.EXPTNO);
//                 this.setData(this._sharedconsig.exportEditData.MAWBNO, this._loginService.getLogin()[0].CMP_USERENCCODE, this._sharedconsig.exportEditData.EXPTNO);
//             });
//     }
//     AddALCharges()
//        {
//         if(this.CHARGETYPE=='' || this.CHARGETYPE==undefined)
//         {
//             alert("Please select Charge Type.")
//             return false;
//         }
//         if(this.CHARGENAME=='' || this.CHARGENAME==undefined)
//         {
//             alert("Please select Charge. ")
//             return false;
//         }
//         if(this.RATE_TAR==null)
//         {
//             alert("Please enter Tariff Rate. ")
//             return false;
//         }
//         if(this.RATE_TAR_FRT=='')
//         {
//             alert("Please enter Tariff Rate Freight. ")
//             return false;
//         }
//         if (this.Chargeslist.length > "0") {
//             let chrgnm: any = []
//             chrgnm = this.Chargeslist.filter((code: any) => code.FK_CHARGEID === parseInt(this.CHARGENAME.split("|")[0]))
//             if (chrgnm.length > "0") {
//                 this._toasterService.toast('warning', 'warning', 'Same Charge already Exists!');
//                 return false;
//             }
//             }
//         const jsonchild= {PK_ID:this.PK_ID,
//         FKID:this.FK_ID,
//         CHRGDETAILSID:this.CHRGDETAILSID,
//         MAWBNO:this._sharedconsig.exportEditData.MAWBNO,
//         FK_CHARGEID:this.CHARGENAME.split("|")[0] ,
//         CHARGETYPE:this.CHARGETYPE,
//         RATE_TAR:this.RATE_TAR,
//         RATE_TAR_FRT:this.RATE_TAR_FRT,
//         RATE_NET:this.RATE_NET,
//         RATE_NET_FRT:this.RATE_NET_FRT,
//         MAKERID:this._loginService.getLogin()[0].CMPID,
//         VGUID:this._loginService.getLogin()[0].GUID,

//         }
//        this._dataService.Common("Export/EXPT_MAWB_PRINT_RATE_AIRLINE_CHARGES_TMPIU", jsonchild)
//            .subscribe((data: any) => {
//            if (data.Table[0].STATUS == "100") {
//                    this.Chargeslist=data.Table1;
//                    this.dttable6=data.Table6;
//                    if(this.EDIT_CHARGETYPE != undefined){
//                     this.fn_CalculateAlCharges_Tar(data.Table6);
//                       }
//                    else
//                 {
//                     this.fn_CalculateAlCharges_Add(data.Table6);
//                 }

//                    //this.fn_CalculateAlCharges_Net(data.Table6)
//                    this.tot_rate_tar_pp_da=data.Table2[0].RATE_TAR_TOTAL_PP_DA;
//                    this.tot_rate_net_pp_da=data.Table2[0].RATE_NET_TOTAL_PP_DA;
//                    this.tot_rate_tar_cc_da=data.Table3[0].RATE_TAR_TOTAL_CC_DA;
//                    this.tot_rate_net_cc_da=data.Table3[0].RATE_NET_TOTAL_CC_DA;
//                    this.tot_rate_tar_pp_dc=data.Table4[0].RATE_TAR_TOTAL_PP_DC;
//                    this.tot_rate_net_pp_dc=data.Table4[0].RATE_NET_TOTAL_PP_DC;
//                    this.tot_rate_tar_cc_dc=data.Table5[0].RATE_TAR_TOTAL_CC_DC;
//                    this.tot_rate_net_cc_dc=data.Table5[0].RATE_NET_TOTAL_CC_DC;
//                    this.Resetchildrcrd();
//                 //    this.loaderService.display(false);
//                }
//            else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT);
//                       // this.loaderService.display(false);
//                }
//            });
//     }
//     fn_CalculateAlCharges_Add(dtbl){
//         if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='PP')
//         {
//          this.DueAgentNet=Math.abs(this.DueAgentNet)  + Math.abs(dtbl[0].RATE_NET);
//          this.TotalNet=Math.abs(this.TotalNet) +  Math.abs(dtbl[0].RATE_NET);
//          this.DueAgentTar=Math.abs(this.DueAgentTar)  + Math.abs(dtbl[0].RATE_TAR);
//          this.TotalTar=Math.abs(this.TotalTar)  +  Math.abs(dtbl[0].RATE_TAR);
//         }
//         if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='CC')
//         {
//          this.DueAgentNetCC=Math.abs(this.DueAgentNetCC)  + Math.abs(dtbl[0].RATE_NET);
//          this.TotalNet=Math.abs(this.TotalNet)  +  Math.abs(dtbl[0].RATE_NET);
//          this.DueAgentTarCC=Math.abs(this.DueAgentTarCC)  + Math.abs(dtbl[0].RATE_TAR);
//          this.TotalTar=Math.abs(this.TotalTar)  +  Math.abs(dtbl[0].RATE_TAR);
//         }
//         if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='PP')
//         {
//          this.DurCarrierNet=Math.abs(this.DurCarrierNet) + Math.abs(dtbl[0].RATE_NET);
//          this.TotalNet=Math.abs(this.TotalNet)  +  Math.abs(dtbl[0].RATE_NET);
//          this.DurCarrierTar=Math.abs(this.DurCarrierTar)  + Math.abs(dtbl[0].RATE_TAR);
//          this.TotalTar=Math.abs(this.TotalTar)+ Math.abs(dtbl[0].RATE_TAR);
//         }
//         if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='CC')
//         {
//          this.DurCarrierNetCC=Math.abs(this.DurCarrierNetCC)+ Math.abs(dtbl[0].RATE_NET);
//          this.TotalNet=Math.abs(this.TotalNet) +  Math.abs(dtbl[0].RATE_NET);
//          this.DurCarrierTarCC=Math.abs(this.DurCarrierTarCC)  + Math.abs(dtbl[0].RATE_TAR);
//          this.TotalTar=Math.abs(this.TotalTar) +  Math.abs(dtbl[0].RATE_TAR);
//          }
//     }
//     fn_CalculateAlCharges_Net(dtbl){
//         if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='PP')
//         {
//          this.DueAgentNet=(Math.abs(this.DueAgentNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//          this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET) ) +  Math.abs(dtbl[0].RATE_NET);
//         }
//         if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='CC')
//         {
//          this.DueAgentNetCC=(Math.abs(this.DueAgentNetCC) - Math.abs(this.EDIT_RATE_NET))  + Math.abs(dtbl[0].RATE_NET);
//          this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(dtbl[0].RATE_NET);
//         }
//         if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='PP')
//         {
//          this.DurCarrierNet=(Math.abs(this.DurCarrierNet) -Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//          this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(dtbl[0].RATE_NET);
//         }
//         if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='CC')
//         {
//          this.DurCarrierNetCC=Math.abs(this.DurCarrierNetCC)+ Math.abs(dtbl[0].RATE_NET);
//          this.TotalNet=Math.abs(this.TotalNet) +  Math.abs(dtbl[0].RATE_NET);

//          }
//     }
//     fn_CalculateAlCharges_Tar(dtbl){
//         if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='PP' &&  this.EDIT_CHARGETYPE=='DA')
//         {
//          this.DueAgentTar=(Math.abs(this.DueAgentTar) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
//          this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR)) +  Math.abs(dtbl[0].RATE_TAR);
//          this.DueAgentNet=(Math.abs(this.DueAgentNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//          this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET) ) +  Math.abs(dtbl[0].RATE_NET);
//         }
//         if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='CC' &&  this.EDIT_CHARGETYPE=='DA')
//         {
//          this.DueAgentTarCC=(Math.abs(this.DueAgentTarCC) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
//          this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR)) +  Math.abs(dtbl[0].RATE_TAR);
//          this.DueAgentNetCC=(Math.abs(this.DueAgentNetCC) - Math.abs(this.EDIT_RATE_NET))  + Math.abs(dtbl[0].RATE_NET);
//          this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(dtbl[0].RATE_NET);
//         }
//         if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='CC' &&  this.EDIT_CHARGETYPE=='DC')
//         {
//          this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC) - Math.abs(this.EDIT_RATE_TAR));
//          this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC) - Math.abs(this.EDIT_RATE_TAR)) ;
//          this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_NET));
//          this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) ;
//          this.DueAgentNetCC=Math.abs(this.DueAgentNetCC)  + Math.abs(dtbl[0].RATE_NET);
//          this.TotalNet=Math.abs(this.TotalNet)  +  Math.abs(dtbl[0].RATE_NET);
//          this.DueAgentTarCC=Math.abs(this.DueAgentTarCC)  + Math.abs(dtbl[0].RATE_TAR);
//          this.TotalTar=Math.abs(this.TotalTar)  +  Math.abs(dtbl[0].RATE_TAR);
//         }
//         if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='PP' &&  this.EDIT_CHARGETYPE=='DC')
//         {
//         this.DueAgentTar=Math.abs(this.DueAgentTar)  + Math.abs(dtbl[0].RATE_TAR);
//         this.TotalTar=Math.abs(this.TotalTar)  +  Math.abs(dtbl[0].RATE_TAR);
//         this.DueAgentNet=Math.abs(this.DueAgentNet)  + Math.abs(dtbl[0].RATE_NET);
//         this.TotalNet=Math.abs(this.TotalNet) +  Math.abs(dtbl[0].RATE_NET);
//         this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC) - Math.abs(this.EDIT_RATE_TAR));
//         this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC) - Math.abs(this.EDIT_RATE_NET)) ;
//         this.TotalTar=(Math.abs(this.TotalTar) + Math.abs(this.EDIT_RATE_TAR));
//         this.TotalNet=(Math.abs(this.TotalNet) + Math.abs(this.EDIT_RATE_NET)) ;
//         }
//         if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='PP' &&  this.EDIT_CHARGETYPE=='DC')
//         {
//          this.DurCarrierTar=(Math.abs(this.DurCarrierTar) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
//          this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR)) +  Math.abs(dtbl[0].RATE_TAR);
//          this.DurCarrierNet=(Math.abs(this.DurCarrierNet) -Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//          this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(dtbl[0].RATE_NET);
//         }
//         if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='CC' &&  this.EDIT_CHARGETYPE=='DC')
//         {
//          this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
//          this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR))  +  Math.abs(dtbl[0].RATE_TAR);
//          this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC)- Math.abs(this.EDIT_RATE_TAR))  +  Math.abs(dtbl[0].RATE_TAR);
//          this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_TAR))  +  Math.abs(dtbl[0].RATE_TAR);
//         }
//         if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='CC' &&  this.EDIT_CHARGETYPE=='DA')
//         {
//         this.DueAgentNetCC=(Math.abs(this.DueAgentNetCC)  - Math.abs(this.EDIT_RATE_NET));
//         this.TotalNet=(Math.abs(this.TotalNet)  - Math.abs(this.EDIT_RATE_NET));
//         this.DueAgentTarCC=(Math.abs(this.DueAgentTarCC)  - Math.abs(this.EDIT_RATE_TAR));
//         this.TotalTar=(Math.abs(this.TotalTar)  - Math.abs(this.EDIT_RATE_TAR));
//         this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC)  +Math.abs(dtbl[0].RATE_TAR));
//         this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC) + Math.abs(dtbl[0].RATE_NET));
//         this.TotalTar=(Math.abs(this.TotalTar) + Math.abs(dtbl[0].RATE_TAR));
//         this.TotalNet=(Math.abs(this.TotalNet)  + Math.abs(dtbl[0].RATE_NET));
//         }
//         if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='PP' &&  this.EDIT_CHARGETYPE=='DA')
//         {
//         this.DueAgentNet=(Math.abs(this.DueAgentNet)  - Math.abs(this.EDIT_RATE_NET));
//         this.TotalNet=(Math.abs(this.TotalNet)  - Math.abs(this.EDIT_RATE_NET));
//         this.DueAgentTar=(Math.abs(this.DueAgentTar)  - Math.abs(this.EDIT_RATE_TAR));
//         this.TotalTar=(Math.abs(this.TotalTar)  - Math.abs(this.EDIT_RATE_TAR));
//         this.DurCarrierTar=(Math.abs(this.DurCarrierTar)  +Math.abs(dtbl[0].RATE_TAR));
//         this.DurCarrierNet=(Math.abs(this.DurCarrierNet) + Math.abs(dtbl[0].RATE_NET));
//         this.TotalTar=(Math.abs(this.TotalTar) + Math.abs(dtbl[0].RATE_TAR));
//         this.TotalNet=(Math.abs(this.TotalNet)  + Math.abs(dtbl[0].RATE_NET));
//         }
//     }
//     Resetchildrcrd(){
//         this.CHARGETYPE=undefined;
//         this.CHARGENAME="";
//         this.RATE_TAR="";
//         this.RATE_TAR_FRT="";
//         this.RATE_NET="";
//         this.RATE_NET_FRT="";
//         this.txtchild="Add";
//         this.CHRGDETAILSID="0";
//         this.PK_ID="0";
//         this.EDIT_CHARGETYPE=undefined;

//     }
//     Editchildrecd(id) {
//         let filterData = this.Chargeslist.filter((filter) => filter.PK_ID == id)[0];
//         //this.fk=filterData.ID;
//         this.PK_ID=filterData.PK_ID,
//         this.FK_ID=filterData.FK_ID,
//         this.CHARGETYPE=filterData.CHARGETYPE;
//         this.CHRGDETAILSID=filterData.FK_CHRGDETAILSID;
//         this.AirLineCharges =this.AllAirLineChargeslist.filter((code: any) => code.DataValueField.split("|")[1] === this.CHARGETYPE);
//         this.CHARGENAME=filterData.FK_CHARGEID + '|' + filterData.CHARGETYPE;
//         this.RATE_TAR=filterData.RATE_TAR;
//         this.RATE_TAR_FRT=filterData.RATE_TAR_FRT;
//         this.RATE_NET=filterData.RATE_NET;
//         this.RATE_NET_FRT=filterData.RATE_NET_FRT;
//         this.EDIT_RATE_TAR=filterData.RATE_TAR;
//         this.EDIT_RATE_NET=filterData.RATE_NET;
//         this.EDIT_CHARGETYPE=filterData.CHARGETYPE;
//         this.txtchild="Update";
//         }

//         deletechildrecd(id,chrgdtlsid){

//                 if(confirm('Are you sure want to delete the record ?')) {
//                     this._loaderService.display(true);
//                     const jsondelete = { ID  : id,VGUID :this._loginService.getLogin()[0].GUID,FK_CHRGDTLSID:chrgdtlsid}
//                     this._dataService.getData("Export/EXPT_MAWB_PRINT_RATE_AIRLINE_CHARGES_TMP_DEL", jsondelete)
//                         .subscribe((data: any) => {

//                             if (data.Table[0].STATUS== "100") {
//                                 this.Chargeslist=data.Table
//                                 this.DELCHARGETYPE=data.Table1[0].CHARGETYPE;
//                                 this.DEL_RATE_TAR=data.Table1[0].RATE_TAR;
//                                 this.DEL_RATE_TAR_FRT=data.Table1[0].RATE_TAR_FRT;
//                                 this.DEL_RATE_NET=data.Table1[0].RATE_NET;
//                                 this.DEL_RATE_NET_FRT=data.Table1[0].RATE_NET_FRT;
//                                 if(this.DELCHARGETYPE=='DA' && this.DEL_RATE_TAR_FRT=='PP')
//                                 {
//                                  this.DueAgentTar=(Math.abs(this.DueAgentTar) - Math.abs(this.DEL_RATE_TAR)) ;
//                                  this.DueAgentNet=(Math.abs(this.DueAgentNet) - Math.abs(this.DEL_RATE_NET)) ;
//                                  this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR)) ;
//                                  this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET)) ;
//                                 }

//                                 if(this.DELCHARGETYPE=='DA' && this.DEL_RATE_TAR_FRT=='CC')
//                                 {
//                                  this.DueAgentTarCC=(Math.abs(this.DueAgentTarCC) - Math.abs(this.DEL_RATE_TAR)) ;
//                                  this.DueAgentNetCC=(Math.abs(this.DueAgentNetCC) - Math.abs(this.DEL_RATE_NET)) ;
//                                  this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR)) ;
//                                  this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET));
//                                 }
//                                 if(this.DELCHARGETYPE=='DC' && this.DEL_RATE_TAR_FRT=='PP')
//                                 {
//                                  this.DurCarrierTar=(Math.abs(this.DurCarrierTar) - Math.abs(this.DEL_RATE_TAR));
//                                  this.DurCarrierNet=(Math.abs(this.DurCarrierNet) -Math.abs(this.DEL_RATE_NET));
//                                  this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR));
//                                  this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET));
//                                 }
//                                 if(this.DELCHARGETYPE=='DC' && this.DEL_RATE_TAR_FRT=='CC')
//                                 {
//                                  this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC) - Math.abs(this.DEL_RATE_TAR));
//                                  this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC) - Math.abs(this.DEL_RATE_NET));
//                                  this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR)) ;
//                                  this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET)) ;
//                                 }
//                                 this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT );
//                                 this._loaderService.display(false);
//                                 }
//                                 else {
//                                 this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT);
//                                 this._loaderService.display(false);
//                                 }


//                         });
//                 }
//                 else{return false;
//                     this._loaderService.display(false); }
//             }
//             GetChrges(chrgtype)
//     {
//         this.AirLineCharges =this.AllAirLineChargeslist.filter((code: any) => code.DataValueField.split("|")[1] === chrgtype);
//     }
//     changeNetRate(rate1) {
//         this.RATE_NET=rate1;
//        }
//     changeNetFreight(frt1) {
//         this.RATE_NET_FRT=frt1
//        }
//     tarCheck(num: number) {
//         this.TariffRate = num;
//         //FSC
//         this.TarFscPayOn = null;
//         this.TarFscRate = "";
//         this.TarFsc = "";
//         //IRC
//         this.TarIrcPayOn = null;
//         this.TarIrcRate = "";
//         this.TarIrc = "";
//         //XRAY
//         this.TarXrayPayOn = null;
//         this.TarXrayRate = "";
//         this.TarXray = "";
//     }

//     netCheck(num: number) {
//         this.NetRate = num;
//         //FSC
//         this.NetFscPayOn = null;
//         this.NetFscRate = "";
//         this.NetFsc = "";
//         //IRC
//         this.NetIrcPayOn = null;
//         this.NetIrcRate = "";
//         this.NetIrc = "";
//         //XRAY
//         this.NetXrayPayOn = null;
//         this.NetXrayRate = "";
//         this.NetXray = "";
//     }

//     calOneTarCheck(num: number) {
//         this.CalOneDcTar = num;
//     }

//     calOneNetCheck(num: number) {
//         this.CalOneDcNet = num;
//     }

//     calTwoTarCheck(num: number) {
//         this.CalTwoDcTar = num;
//     }

//     calTwoNetCheck(num: number) {
//         this.CalTwoDcNet = num;
//     }

//     changeFreight(typ) {
//         this.FreightRate = typ;
//     }

//     fn_PageLoad() {
//         let CWt = this.UserWgt;
//         let GWt = this.UserGrossWeight;

//         if (Math.abs(CWt) < 151) // || Math.abs(GWt) < 151)---LAST CHANGES
//         {
//             this.fn_Load_150_check();
//         }
//         else {
//             this.HawbTar = "150.00";
//             this.PcaTar = "250.00";
//             this.fn_MC_CTG_Tar();
//             this.fn_THC_Tar();
//             this.fn_ChangeChareableAsTar();
//             if (this.hdNetRights == true) {
//                 this.HawbNet = "150.00";
//                 this.PcaNet = "250.00";
//                 // this.HawbNet = true;
//                 // this.PcaNet = false;
//                 this.fn_MC_CTG_Net();
//                 this.fn_THC_Net();
//                 this.fn_ChangeChareableAsNet();
//             }
//         }
//     }

//     fn_Load_150_check() {
//         // this.TarFreightRate = "";
//         // this.TarFscRate = "";
//         // this.TarIrcRate = "";
//         // this.TarXrayRate = "";
//         // this.TarMcRate = "";
//         // this.TarCtgRate = "";
//         // this.TarThcRate = "";
//         // this.TarBPRate = "";

//         this.fn_THC_Tar();
//         this.fn_ChangeChareableAsTar();

//         if (this.hdNetRights == true) {
//             // this.NetFreightRate = "";
//             // this.NetFscRate = "";
//             // this.NetIrcRate = "";
//             // this.NetXrayRate = "";
//             // this.NetMcRate = "";
//             // this.NetCtgRate = "";
//             // this.NetThcRate = "";
//             this.fn_THC_Net();
//             this.fn_ChangeChareableAsNet();
//         }
//     }

//     fn_ChangeChareableAsTar() {

//         if (this.TariffRate == 1) {
//             this.TarFscPayOn = null;
//             this.TarFscRate = "";
//             this.TarIrcPayOn = null;
//             this.TarIrcRate = "";
//             this.TarXrayPayOn = null;
//             this.TarXrayRate = "";
//             this.TarFsc = "";
//             this.TarIrc = "";
//             this.TarXray = "";
//         }
//         else {
//             let CWt = this.UserWgt;
//             let GWt = this.UserGrossWeight;
//             if (Math.abs(CWt) < 151) // || Math.abs(GWt) < 151)---LAST CHANGES
//             {


//             }
//             else {

//             }
//         }
//         this.fnCalculate_Tar();
//     }

//     fn_ChangeChareableAsNet() {
//         let CWt = this.UserWgt;
//         let GWt = this.UserGrossWeight;

//         if (this.NetRate == 1) {
//             this.NetFscPayOn = null;
//             this.NetFscRate = "";
//             this.NetIrcPayOn = null;
//             this.NetIrcRate = "";
//             this.NetXrayPayOn = null;
//             this.NetXrayRate = "";

//             this.NetFsc = "";
//             this.NetIrc = "";
//             this.NetXray = "";
//         }
//         else {
//             CWt = this.UserWgt
//             GWt = this.UserGrossWeight
//             if (Math.abs(CWt) < 151) // || Math.abs(GWt) < 151)---LAST CHANGES
//             {

//             }
//             else {

//             }
//         }
//         this.fnCalculate_Net()
//     }

//     setDropDownData(mawbno, exptno) {
//         const _jsonData = {
//             Type1: mawbno.substring(0, 3),
//             Type2: exptno.substring(2, 5)
//         };
//         this._loaderService.display(true);
//         this.exptno=exptno;
//         this._dataService.Common("Export/ConsignmentMAWBFill_DROPDOWN", _jsonData)
//             .subscribe((data: any) => {
//                 this._loaderService.display(false);
//                 this.netData = data.Table;
//                 this.tdsData = data.Table1;
//                 this.serviceTax = data.Table2;
//                 this.AllAirLineChargeslist=data.Table3
//                 this.ChrgTypelist=data.Table4;
//             },
//                 (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
//                 () => { });
//     }

//     setData(mawbno, code, exptno) {
//         this._loaderService.display(true);
//         const _jsonData = {
//             Type1: mawbno,
//             Type2: code,
//             Type3: exptno.substring(2, 5),
//             GUID:this._loginService.getLogin()[0].GUID,
//             CmpId: this._loginService.getLogin()[0].CMPID,
//             RoleType: this._loginService.getLogin()[0].ROLETYPE,
//             CodeCity: this._loginService.getLogin()[0].CMPCODE + '' + this._loginService.getLogin()[0].CITYCODE1
//         };

//         this._dataService.Common("Export/Consignment_MAWB_PP_CC_View", _jsonData)
//             .subscribe((data: any) => {

//                 this.CityCode = data.Table1[0].CITYCODE;

//                 this.Wgt = data.Table1[0].CHRGWT;
//                 this.UserWgt = data.Table1[0].CHBL_WGT_USER;
//                 this.oldchblwt=this.UserWgt;
//                 this.GrossWeight = data.Table1[0].GROSSWT;
//                 this.oldgrwt=this.GrossWeight;
//                 this.UserGrossWeight = data.Table1[0].GROSS_WGT_USER;
//                 this.isMinRate = (data.Table1[0].ISMIN == 'Y') ? true : false;
//                 this.FreightRate = (data.Table1[0].FREIGHT != '') ? data.Table1[0].FREIGHT : null;
//                 this.SupplierNet = (data.Table1[0].SUPPLIER_NET != '') ? data.Table1[0].SUPPLIER_NET : null;
//                 this.AgentsRate = (data.Table1[0].AGENTS_RATE != '') ? data.Table1[0].AGENTS_RATE : 0.00;
//                 this.TariffRate = (data.Table1[0].FRT_CHARGEABLE_AS_TAR == 'FS') ? 2 : 1;
//                 this.NetRate = (data.Table1[0].FRT_CHARGEABLE_AS_NET == 'FS') ? 2 : 1;


//                 //FREIGHT (BASIC)
//                 this.TarFreightPayOn = (data.Table1[0].FRT_PAYABLE_ON_TAR != '') ? data.Table1[0].FRT_PAYABLE_ON_TAR : 'CW';
//                 this.TarFreightRate = data.Table1[0].FRT_RATE_PER_KG_TAR;
//                 this.TarFreight = data.Table1[0].FRT_RATE_TAR;
//                 this.NetFreightPayOn = (data.Table1[0].FRT_PAYABLE_ON_NET != '') ? data.Table1[0].FRT_PAYABLE_ON_NET : 'CW';
//                 this.NetFreightRate = data.Table1[0].FRT_RATE_PER_KG_NET;
//                 this.NetFreight = data.Table1[0].FRT_RATE_NET;
//                 //FSC
//                 this.TarFscPayOn = (data.Table1[0].FSC_PAYABLE_ON_TAR != '') ? data.Table1[0].FSC_PAYABLE_ON_TAR : null;
//                 this.TarFscRate = data.Table1[0].FSC_RATE_PER_KG_TAR;
//                 this.TarFsc = data.Table1[0].FSC_RATE_TAR;
//                 this.NetFscPayOn = (data.Table1[0].FSC_PAYABLE_ON_NET != '') ? data.Table1[0].FSC_PAYABLE_ON_NET : null;
//                 this.NetFscRate = data.Table1[0].FSC_RATE_PER_KG_NET;
//                 this.NetFsc = data.Table1[0].FSC_RATE_NET;
//                 //IRC
//                 this.TarIrcPayOn = (data.Table1[0].IRC_PAYABLE_ON_TAR != '') ? data.Table1[0].IRC_PAYABLE_ON_TAR : null;
//                 this.TarIrcRate = data.Table1[0].IRC_RATE_PER_KG_TAR;
//                 this.TarIrc = data.Table1[0].IRC_RATE_TAR;
//                 this.NetIrcPayOn = (data.Table1[0].IRC_PAYABLE_ON_NET != '') ? data.Table1[0].IRC_PAYABLE_ON_NET : null;
//                 this.NetIrcRate = data.Table1[0].IRC_RATE_PER_KG_NET;
//                 this.NetIrc = data.Table1[0].IRC_RATE_NET;
//                 //XRAY
//                 this.TarXrayPayOn = (data.Table1[0].XRAY_PAYABLE_ON_TAR != '') ? data.Table1[0].XRAY_PAYABLE_ON_TAR : null;
//                 this.TarXrayRate = data.Table1[0].XRAY_RATE_PER_KG_TAR;
//                 this.TarXray = data.Table1[0].XRAY_RATE_TAR;
//                 this.NetXrayPayOn = (data.Table1[0].XRAY_PAYABLE_ON_NET != '') ? data.Table1[0].XRAY_PAYABLE_ON_NET : null;
//                 this.NetXrayRate = data.Table1[0].XRAY_RATE_PER_KG_NET;
//                 this.NetXray = data.Table1[0].XRAY_RATE_NET;
//                 //MISCELLANEOUS CHARGES
//                 this.TarMcPayOn = (data.Table1[0].MC_PAYABLE_ON_TAR != '') ? data.Table1[0].MC_PAYABLE_ON_TAR : null;
//                 this.TarMcRate = data.Table1[0].MC_RATE_PER_KG_TAR;
//                 this.TarMc = data.Table1[0].MC_RATE_TAR;
//                 this.NetMcPayOn = (data.Table1[0].MC_PAYABLE_ON_NET != '') ? data.Table1[0].MC_PAYABLE_ON_NET : null;
//                 this.NetMcRate = data.Table1[0].MC_RATE_PER_KG_NET;
//                 this.NetMc = data.Table1[0].MC_RATE_NET;
//                 //CTG
//                 this.TarCtgPayOn = (data.Table1[0].CTG_PAYABLE_ON_TAR != '') ? data.Table1[0].CTG_PAYABLE_ON_TAR : 'CW';
//                 this.TarCtgRate = data.Table1[0].CTG_RATE_PER_KG_TAR;
//                 this.TarCtg = data.Table1[0].CTG_RATE_TAR;
//                 this.NetCtgPayOn = (data.Table1[0].CTG_PAYABLE_ON_NET != '') ? data.Table1[0].CTG_PAYABLE_ON_NET : 'CW';
//                 this.NetCtgRate = data.Table1[0].CTG_RATE_PER_KG_NET;
//                 this.NetCtg = data.Table1[0].CTG_RATE_NET;
//                 //THC
//                 this.TarThcPayOn = (data.Table1[0].THC_PAYABLE_ON_TAR != '') ? data.Table1[0].THC_PAYABLE_ON_TAR : 'CW';
//                 this.TarThcRate = data.Table1[0].THC_RATE_PER_KG_TAR;
//                 this.TarThc = data.Table1[0].THC_RATE_TAR;
//                 this.NetThcPayOn = (data.Table1[0].THC_PAYABLE_ON_NET != '') ? data.Table1[0].THC_PAYABLE_ON_NET : 'CW';
//                 this.NetThcRate = data.Table1[0].THC_RATE_PER_KG_NET;
//                 this.NetThc = data.Table1[0].THC_RATE_NET;
//                 //BUSINESS PROMOTION
//                 this.TarBPPayOn = (data.Table1[0].BP_PAYABLE_ON_TAR != '') ? data.Table1[0].BP_PAYABLE_ON_TAR : null;
//                 this.TarBPRate = data.Table1[0].BP_RATE_PER_KG_TAR;
//                 this.TarBP = data.Table1[0].BP_RATE_TAR;
//                 this.NetBPPayOn = (data.Table1[0].BP_PAYABLE_ON_NET != '') ? data.Table1[0].BP_PAYABLE_ON_NET : null;
//                 this.NetBPRate = data.Table1[0].BP_RATE_PER_KG_NET;
//                 this.NetBP = data.Table1[0].BP_RATE_NET;

//                 // if (this.UserWgt > 151) {
//                 //     this.tarCheck(this.TariffRate);
//                 //     this.tarCheck(this.NetRate);
//                 // }

//                 this.TarAms = data.Table1[0].AMS_RATE_TAR;
//                 this.TarAmsFrt = (data.Table1[0].AMS_RATE_TAR_FRT) ? data.Table1[0].AMS_RATE_TAR_FRT : null;
//                 this.NetAms = data.Table1[0].AMS_RATE_NET;
//                 this.NetAmsFrt = (data.Table1[0].AMS_RATE_NET_FRT) ? data.Table1[0].AMS_RATE_NET_FRT : null;

//                 this.HawbTar = data.Table1[0].HAWB_TAR;
//                 if (data.Table1[0].HAWB_RATE_TAR_FRT !="")
//                { this.HawbTarFrt = data.Table1[0].HAWB_RATE_TAR_FRT;}
//                 this.HawbNet = data.Table1[0].HAWB_NET;
//                 if(data.Table1[0].HAWB_RATE_NET_FRT !="")
//                 {this.HawbNetFrt = data.Table1[0].HAWB_RATE_NET_FRT;}

//                 this.PcaTar = data.Table1[0].PCA_TAR;
//                 if (data.Table1[0].PCA_RATE_TAR_FRT!="")
//                 {this.PcaTarFrt = data.Table1[0].PCA_RATE_TAR_FRT;}
//                 this.PcaNet = data.Table1[0].PCA_NET;
//                 if(data.Table1[0].PCA_RATE_NET_FRT !="")
//                 {this.PcaNetFrt = data.Table1[0].PCA_RATE_NET_FRT;}

//                 this.DurCarrierTar = data.Table1[0].DUE_CARRIER_TAR;
//                 this.DurCarrierTarCC = data.Table1[0].DUE_CARRIER_TAR_CC;
//                 this.DurCarrierNet = data.Table1[0].DUE_CARRIER_NET;
//                 this.DurCarrierNetCC = data.Table1[0].DUE_CARRIER_NET_CC;

//                 this.DueAgentTar = data.Table1[0].DUE_AGENT_TAR;
//                 this.DueAgentTarCC = data.Table1[0].DUE_AGENT_TAR_CC;
//                 this.DueAgentNet = data.Table1[0].DUE_AGENT_NET;
//                 this.DueAgentNetCC = data.Table1[0].DUE_AGENT_NET_CC;

//                 this.TotalTar = data.Table1[0].TOTAL_TAR;
//                 this.TotalTarCC = data.Table1[0].TOTAL_TAR_CC;
//                 this.TotalNet = data.Table1[0].TOTAL_NET;
//                 this.TotalNetCC = data.Table1[0].TOTAL_NET_CC;

//                 this.OtherTar = data.Table1[0].OTHER_CHRG_TAR;
//                 this.OtherTarFrt = (data.Table1[0].OTHER_RATE_TAR_FRT != '') ? data.Table1[0].OTHER_RATE_TAR_FRT : 'PP';
//                 this.OtherNet = data.Table1[0].OTHER_CHRG_NET;
//                 this.OtherNetFrt = (data.Table1[0].OTHER_RATE_NET_FRT != '') ? data.Table1[0].OTHER_RATE_NET_FRT : 'PP';

//                 this.AirFrtCommission = data.Table1[0].AIR_FRT_COMM_NET;

//                 this.FrtRebate = data.Table1[0].FRT_REBATE_NET;

//                 this.BusinesPromo = data.Table1[0].BUSINES_PROMO_NET;

//                 this.DrpTDS = data.Table1[0].TDS_ACCTCODE;
//                 this.TxtTDS = data.Table1[0].TDS_NET;

//                 this.DrpServiceTax = data.Table1[0].SERVICETAX_ACCTCODE;
//                 this.TxtServiceTax = data.Table1[0].SERVICE_TAX_NET;

//                 this.OtherChrg1 = data.Table1[0].OTHER_NAME1;
//                 this.OtherAmt1_Tar = data.Table1[0].OTHER_RATE1_TAR;
//                 this.CalOneDcTar = (data.Table1[0].OTHER_RATE1_TAR_CAL == 'DA') ? 2 : 1;
//                 this.OtherAmt1TarFrt = (data.Table1[0].OTHER_RATE1_TAR_FRT != '') ? data.Table1[0].OTHER_RATE1_TAR_FRT : 'PP';
//                 this.OtherAmt1_Net = data.Table1[0].OTHER_RATE1_NET;
//                 this.CalOneDcNet = (data.Table1[0].OTHER_RATE1_NET_CAL == 'DA') ? 2 : 1;
//                 this.OtherAmt1NetFrt = (data.Table1[0].OTHER_RATE1_NET_FRT != '') ? data.Table1[0].OTHER_RATE1_NET_FRT : 'PP';

//                 this.OtherChrg2 = data.Table1[0].OTHER_NAME2;
//                 this.OtherAmt2_Tar = data.Table1[0].OTHER_RATE2_TAR;
//                 this.CalTwoDcTar = (data.Table1[0].OTHER_RATE2_TAR_CAL == 'DA') ? 2 : 1;
//                 this.OtherAmt2TarFrt = (data.Table1[0].OTHER_RATE2_TAR_FRT != '') ? data.Table1[0].OTHER_RATE2_TAR_FRT : 'PP';
//                 this.OtherAmt2_Net = data.Table1[0].OTHER_RATE2_NET;
//                 this.CalTwoDcNet = (data.Table1[0].OTHER_RATE2_NET_CAL == 'DA') ? 2 : 1;
//                 this.OtherAmt2NetFrt = (data.Table1[0].OTHER_RATE2_NET_FRT != '') ? data.Table1[0].OTHER_RATE2_NET_FRT : 'PP';

//                 this.Remark = data.Table1[0].REMARK;
//                 this.Ppchrg = data.Table1[0].PPCHRG;
//                 this.Ccchrg = data.Table1[0].CCCHRG;
//                 this.Pptotagt = data.Table1[0].PPTOTAGT;
//                 this.Cctotagt = data.Table1[0].CCTOTAGT;
//                 this.Pptotcarr = data.Table1[0].PPTOTCARR;
//                 this.Cctotcarr = data.Table1[0].CCTOTCARR;
//                 this.Pptot = data.Table1[0].PPTOT;
//                 this.Cctot = data.Table1[0].CCTOT;
//                 this.Othchrg = data.Table1[0].OTHCHRG;
//                 this.ISAUTO_FRT_INV=data.Table1[0].FRTINV_FLG;
//                 /* this is not in links present in manilal*/
//                 // this.TarTruckPayOn = (data.Table1[0].DEST_TRUCKING_PAYABLE_ON_TAR != '') ? data.Table1[0].DEST_TRUCKING_PAYABLE_ON_TAR : null;
//                 // this.TarTruckRate = data.Table1[0].DEST_TRUCKING_RATE_PER_KG_TAR;
//                 // this.TarTruck = data.Table1[0].DEST_TRUCKING_RATE_TAR;
//                 // this.NetTruckPayOn = (data.Table1[0].DEST_TRUCKING_PAYABLE_ON_NET != '') ? data.Table1[0].DEST_TRUCKING_PAYABLE_ON_NET : null;
//                 // this.NetTruckRate = data.Table1[0].DEST_TRUCKING_RATE_PER_KG_NET;
//                 // this.NetTruck = data.Table1[0].DEST_TRUCKING_RATE_NET;
//                    ///ADDED BY NALINI FOR AIRLINECHARGES
//               this.Chargeslist=data.Table2
//               this.tot_rate_tar_pp_da=data.Table3[0].RATE_TAR_TOTAL_PP_DA;
//               this.tot_rate_net_pp_da=data.Table3[0].RATE_NET_TOTAL_PP_DA;
//               this.tot_rate_tar_cc_da=data.Table4[0].RATE_TAR_TOTAL_CC_DA;
//               this.tot_rate_net_cc_da=data.Table4[0].RATE_NET_TOTAL_CC_DA;
//               this.tot_rate_tar_pp_dc=data.Table5[0].RATE_TAR_TOTAL_PP_DC;
//               this.tot_rate_net_pp_dc=data.Table5[0].RATE_NET_TOTAL_PP_DC;
//               this.tot_rate_tar_cc_dc=data.Table6[0].RATE_TAR_TOTAL_CC_DC;
//               this.tot_rate_net_cc_dc=data.Table6[0].RATE_NET_TOTAL_CC_DC;
//                 this.fn_PageLoad();
//                 if(this.ISAUTO_FRT_INV=="1")
//                 {
//                     alert("MAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This MAWB !!");
//                     this._toasterService.toast('Warning', 'Warning', "MAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This MAWB !!");
//                 }
//                 this._loaderService.display(false);
//             },
//                 (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
//                  this._loaderService.display(false);},
//                 () => { });
//     }

//     changePayOnTariff(tarType: string) {
//         if (tarType == 'Fsc') {
//             this.TarFscRate = 0;
//             this.TarFsc = 0;
//         } else if (tarType == 'Irc') {
//             this.TarIrcRate = 0;
//             this.TarIrc = 0;
//         } else if (tarType == 'Xray') {
//             this.TarXrayRate = 0;
//             this.TarXray = 0;
//         } else if (tarType == 'BP') {
//             this.TarBPRate = 0;
//             this.TarBP = 0;
//         }
//         this.fnCalculate_Tar();
//     }

//     changePayOnNet(tarType: string) {
//         if (tarType == 'Fsc') {
//             this.NetFscRate = 0;
//             this.NetFsc = 0;
//         } else if (tarType == 'Irc') {
//             this.NetIrcRate = 0;
//             this.NetIrc = 0;
//         } else if (tarType == 'Xray') {
//             this.NetXrayRate = 0;
//             this.NetXray = 0;
//         } else if (tarType == 'BP') {
//             this.NetBPRate = 0;
//             this.NetBP = 0;
//         }
//         this.fnCalculate_Net();
//     }

//     changeTariffRates(tarType: string) {
//         if (tarType == 'Freight') {
//             if (Math.abs(this.TarFreightRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearTariff(); return false; }
//                 if (this.TarFreightPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarFreight = 0; }
//             this.onChangeTariffRates('Freight');
//         } else if (tarType == 'Fsc') {
//             if (Math.abs(this.TarFscRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearTariff(); return false; }
//                 if (this.TarFscPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarFsc = 0; }
//             this.onChangeTariffRates('Fsc');
//         } else if (tarType == 'Irc') {
//             if (Math.abs(this.TarIrcRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearTariff(); return false; }
//                 if (this.TarIrcPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarIrc = 0; }
//             this.onChangeTariffRates('Irc');
//         } else if (tarType == 'Xray') {
//             if (Math.abs(this.TarXrayRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearTariff(); return false; }
//                 if (this.TarXrayPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarXray = 0; }
//             this.onChangeTariffRates('Xray');
//         } else if (tarType == 'BP') {
//             if (Math.abs(this.TarBPRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearTariff(); return false; }
//                 if (this.TarBPPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarBP = 0; }
//             this.onChangeTariffRates('BP');
//         }
//         this.fnCalculate_Tar();
//     }

//     changeNetRates(tarType: string) {
//         if (tarType == 'Freight') {
//             if (Math.abs(this.NetFreightRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearNet(); return false; }
//                 if (this.NetFreightPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.NetFreight = 0; }
//             this.onChangeNetRates('Freight');
//         } else if (tarType == 'Fsc') {
//             if (Math.abs(this.NetFscRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearNet(); return false; }
//                 if (this.NetFscPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.NetFsc = 0; }
//             this.onChangeNetRates('Fsc');
//         } else if (tarType == 'Irc') {
//             if (Math.abs(this.NetIrcRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearNet(); return false; }
//                 if (this.NetIrcPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.NetIrc = 0; }
//             this.onChangeNetRates('Irc');
//         } else if (tarType == 'Xray') {
//             if (Math.abs(this.NetXrayRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearNet(); return false; }
//                 if (this.NetXrayPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.NetXray = 0; }
//             this.onChangeNetRates('Xray');
//         } else if (tarType == 'BP') {
//             if (Math.abs(this.NetBPRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearNet(); return false; }
//                 if (this.NetBPPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.NetBP = 0; }
//             this.onChangeNetRates('BP');
//         }
//         this.fnCalculate_Net();
//     }

//     validateWeight() {
//         let CHBLWT = Math.abs(this.UserWgt);
//         let GRWT = Math.abs(this.UserGrossWeight);
//         if (CHBLWT == 0) {
//             alert("Please enter Chageable Weight.");
//             return false;
//         }
//         if (GRWT == 0) {
//             alert("Please enter Gross Weight.");
//             return false;
//         }
//         if (CHBLWT < GRWT) {
//             alert("Chargable Wgt should be greaterthen or equal to Gross Weight.")
//             return false;
//         }
//     }

//     clearTariff() {
//         this.TarFreightRate = "";
//         this.TarFreight = "";
//         this.TarFscPayOn = "0";
//         this.TarFscRate = "";
//         this.TarFsc = "";
//         this.TarIrcPayOn = "0";
//         this.TarIrcRate = "";
//         this.TarIrc = "";
//         this.TarXrayPayOn = "0";
//         this.TarXrayRate = "";
//         this.TarXray = "";
//         this.TarMcRate = 1;
//         let GRWT = Math.abs(this.UserGrossWeight);
//         GRWT = Math.round(Math.abs(GRWT));
//         GRWT = Math.abs(Number(GRWT.toFixed(2)));
//         this.TarMc = GRWT;
//         this.fn_MC_CTG_Tar();
//         this.fn_THC_Tar();
//     }

//     clearNet() {
//         this.NetFreightRate = null;
//         this.NetFreight = null;
//         this.NetFscPayOn = 0;
//         this.NetFscRate = null;
//         this.NetFsc = null;
//         this.NetIrcPayOn = 0;
//         this.NetIrcRate = null;
//         this.NetIrc = null;
//         this.NetXrayPayOn = 0;
//         this.NetXrayRate = null;
//         this.NetXray = null;
//         this.NetMcRate = 1;
//         this.NetMc = Math.abs(this.UserGrossWeight);
//         this.fn_MC_CTG_Net();
//         this.fn_THC_Net();
//     }
//     AddMAWBALCharges()
//     {
//      if(this.CHARGETYPE=='' || this.CHARGETYPE==undefined)
//      {
//          alert("Please select Charge Type.")
//          return false;
//      }
//      if(this.CHARGENAME=='' || this.CHARGENAME==undefined)
//      {
//          alert("Please select Charge. ")
//          return false;
//      }
//      if(this.RATE_TAR==null)
//      {
//          alert("Please enter Tariff Rate. ")
//          return false;
//      }
//      if(this.RATE_TAR_FRT=='')
//      {
//          alert("Please enter Tariff Rate Freight. ")
//          return false;
//      }
//      if(this.PK_ID=="0"){
//      if (this.Chargeslist.length > "0") {
//          let chrgnm: any = []
//          chrgnm = this.Chargeslist.filter((code: any) => code.FK_CHARGEID === parseInt(this.CHARGENAME.split("|")[0]))
//          if (chrgnm.length > "0") {
//              this._toasterService.toast('warning', 'warning', 'Same Charge already Exists!');
//              return false;
//          }
//          }
//      }
//      const jsonchild= {PK_ID:this.PK_ID,
//      FKID:this.FK_ID,
//      CHRGDETAILSID:this.CHRGDETAILSID,
//      MAWBNO:this._sharedconsig.exportEditData.MAWBNO,
//      FK_CHARGEID:this.CHARGENAME.split("|")[0] ,
//      CHARGETYPE:this.CHARGETYPE,
//      RATE_TAR:this.RATE_TAR,
//      RATE_TAR_FRT:this.RATE_TAR_FRT,
//      RATE_NET:this.RATE_NET,
//      RATE_NET_FRT:this.RATE_NET_FRT,
//      MAKERID:this._loginService.getLogin()[0].CMPID,
//      VGUID:this._loginService.getLogin()[0].GUID,
//      }
//     this._dataService.Common("Export/EXPT_MAWB_PRINT_RATE_AIRLINE_CHARGES_TMPIU", jsonchild)
//         .subscribe((data: any) => {
//         if (data.Table[0].STATUS == "100") {
//                 this.Chargeslist=data.Table1;
//                 this.dttable6=data.Table6;
//                 if(this.EDIT_CHARGETYPE != undefined){
//                  this.fn_CalculateAlCharges_Tar(data.Table6);
//                    }
//                 else
//              {
//                  this.fn_CalculateAlCharges_Add(data.Table6);
//              }

//                 //this.fn_CalculateAlCharges_Net(data.Table6)
//                 this.tot_rate_tar_pp_da=data.Table2[0].RATE_TAR_TOTAL_PP_DA;
//                 this.tot_rate_net_pp_da=data.Table2[0].RATE_NET_TOTAL_PP_DA;
//                 this.tot_rate_tar_cc_da=data.Table3[0].RATE_TAR_TOTAL_CC_DA;
//                 this.tot_rate_net_cc_da=data.Table3[0].RATE_NET_TOTAL_CC_DA;
//                 this.tot_rate_tar_pp_dc=data.Table4[0].RATE_TAR_TOTAL_PP_DC;
//                 this.tot_rate_net_pp_dc=data.Table4[0].RATE_NET_TOTAL_PP_DC;
//                 this.tot_rate_tar_cc_dc=data.Table5[0].RATE_TAR_TOTAL_CC_DC;
//                 this.tot_rate_net_cc_dc=data.Table5[0].RATE_NET_TOTAL_CC_DC;
//                 this.Resetchildrcrd();
//              //    this.loaderService.display(false);
//             }
//         else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT);
//                    // this.loaderService.display(false);
//             }
//         });
//  }
//  ResetMAWBCharges(){
//     this.CHARGETYPE=""
//     this.CHARGENAME=""
//     this.RATE_TAR=""
//  //  this.RATE_TAR_FRT=""
//     this.RATE_NET=""
//     //this.RATE_NET_FRT=""
// }



// Resetchildrcrdpageload(){
//     this.CHARGETYPE=undefined;
//     this.CHARGENAME="";
//     this.RATE_TAR="";
//     this.RATE_NET="";
//     this.txtchild="Add";
//     this.CHRGDETAILSID="0";
//     this.PK_ID="0";
//     this.FK_ID="0";
//     this.EDIT_CHARGETYPE=undefined;

// }





//     fn_MC_CTG_Tar() {
//         let VALUE = 0;
//         VALUE = Math.abs(this.UserWgt);
//         VALUE = Math.round(Math.abs(VALUE))
//         VALUE = (Math.abs(Number(VALUE.toFixed(2))));
//         let Mawbno=this._sharedconsig.exportEditData.MAWBNO;
//         let prestrg=Mawbno.substring(0,3);
//         if (prestrg!="232" && this.CityCode != 'AMD' )
//         {
//             this.TarMcRate = 1;
//             this.TarMc = VALUE;
//         }
//         if (prestrg!="232" && this.CityCode == 'AMD' )
//         {
//             this.TarMcRate = 1;
//             this.TarMc = VALUE;
//         }
//         if (this.CityCode == 'MUM') {
//             this.TarCtgRate = 1;
//             VALUE = Math.abs(this.UserGrossWeight);
//             VALUE = Math.round(Math.abs(VALUE));
//             VALUE = (Math.abs(Number(VALUE.toFixed(2))));
//             this.TarCtg = VALUE;
//         }
//         else {
//             this.TarCtgRate = 0;
//             this.TarCtg = 0;
//         }
//     }
//     fn_THC_Tar() {
//         let VALUE = 0;
//         VALUE = Math.abs(this.UserWgt);
//         VALUE = Math.round(Math.abs(VALUE));
//         VALUE = (Math.abs(Number(VALUE.toFixed(2))));

//         //THC CALCULATED ON CW * 0.08 AS PER ARJUN MAIL Tue 3/10/2015 1:41 PM

//         this.TarThcRate = 0.08;
//         this.TarThc = VALUE;

//         if (this.CityCode == 'DAC') {
//             this.TarThcRate = 0.08;
//             VALUE = Math.abs(VALUE);
//             let TOT = ((this.TarThcRate) * Math.abs(VALUE)).toFixed(2);
//             this.TarThc = Math.abs(Number(TOT));
//         }
//         else {
//             this.TarThcRate = 0;
//             this.TarThc = 0;
//         }
//     }
//     fn_MC_CTG_Net() {
//         let VALUE = 0;
//         if (this.hdNetRights == true) {
//             VALUE = Math.abs(this.UserWgt);
//             VALUE = Math.round(Math.abs(VALUE));
//             VALUE = (Math.abs(Number(VALUE.toFixed(2))));
//             let Mawbno=this._sharedconsig.exportEditData.MAWBNO;
//             let prestrg=Mawbno.substring(0,3);
//             if (prestrg !="232"   && this.CityCode != 'AMD')
//             {   this.NetMcRate = 1;
//                 this.NetMc = VALUE;
//             }
//             if (prestrg !="232"   && this.CityCode == 'AMD')
//             {   this.NetMcRate = 1;
//                 this.NetMc = VALUE;
//             }
//             if (this.CityCode == 'MUM') {
//                 this.NetCtgRate = 1;
//                 VALUE = Math.abs(this.UserGrossWeight);
//                 VALUE = Math.round(Math.abs(VALUE));
//                 VALUE = Math.abs(Number(VALUE.toFixed(2)));
//                 this.NetCtg = VALUE;
//             }
//             else {
//                 this.NetCtgRate = 0;
//                 this.NetCtg = 0;
//             }
//         }
//     }
//     fn_THC_Net() {
//         let VALUE = 0;
//         if (this.hdNetRights == true) {
//             VALUE = Math.abs(this.UserWgt);
//             VALUE = Math.round(Math.abs(VALUE));
//             VALUE = (Math.abs(VALUE));
//             //THC CALCULATED ON CW * 0.08 AS PER ARJUN MAIL Tue 3/10/2015 1:41 PM
//             this.NetThcRate = 0.08;
//             this.NetThc = VALUE;
//             if (this.CityCode == "DAC") {
//                 this.NetThcRate = 0.08;
//                 VALUE = Math.abs(VALUE); // Math.abs(this.UserGrossWeight);
//                 let TOT = ((this.NetThcRate) * Math.abs(VALUE));
//                 this.NetThc = Math.abs(TOT).toFixed(2);
//             }
//             else {
//                 this.NetThcRate = 0;
//                 this.NetThc = 0;
//             }
//         }
//     }

//     onChangeTariffRates(tarType: string) {
//         let MUL_VALUE = 0;
//         let TOT = 0;
//         if (tarType == 'Freight') {
//             if (this.TarFreightPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.TarFreightPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.TarFreightRate) * Math.abs(MUL_VALUE));
//             this.TarFreight = Math.round(TOT).toFixed(2);
//         } else if (tarType == 'Fsc') {
//             if (this.TarFscPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.TarFscPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.TarFscRate) * Math.abs(MUL_VALUE));
//             this.TarFsc = Math.round(TOT).toFixed(2);
//         } else if (tarType == 'Irc') {
//             if (this.TarIrcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.TarIrcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.TarIrcRate) * Math.abs(MUL_VALUE));
//             this.TarIrc = Math.round(TOT).toFixed(2);
//         } else if (tarType == 'Xray') {
//             if (this.TarXrayPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.TarXrayPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.TarXrayRate) * Math.abs(MUL_VALUE));
//             this.TarXray = Math.round(TOT).toFixed(2);
//         } else if (tarType == 'BP') {
//             if (this.TarBPPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.TarBPPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.TarBPRate) * Math.abs(MUL_VALUE));
//             this.TarBP = Math.round(TOT).toFixed(2);
//         }
//     }

//     onChangeNetRates(tarType: string) {
//         let MUL_VALUE = 0;
//         let TOT = 0;
//         if (tarType == 'Freight') {
//             if (this.NetFreightPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.NetFreightPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.NetFreightRate) * Math.abs(MUL_VALUE));
//             this.NetFreight = Math.round(TOT).toFixed(2);
//         } else if (tarType == 'Fsc') {
//             if (this.NetFscPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.NetFscPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.NetFscRate) * Math.abs(MUL_VALUE));
//             this.NetFsc = Math.round(TOT).toFixed(2);
//         } else if (tarType == 'Irc') {
//             if (this.NetIrcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.NetIrcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.NetIrcRate) * Math.abs(MUL_VALUE));
//             this.NetIrc = Math.round(TOT).toFixed(2);
//         } else if (tarType == 'Xray') {
//             if (this.NetXrayPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.NetXrayPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.NetXrayRate) * Math.abs(MUL_VALUE));
//             this.NetXray = Math.round(TOT).toFixed(2);
//         } else if (tarType == 'BP') {
//             if (this.NetBPPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.NetBPPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.NetBPRate) * Math.abs(MUL_VALUE));
//             this.NetBP = Math.round(TOT).toFixed(2);
//         }
//     }

//     fnCalculate_Tar() {
//         let FSC = 0, IRC = 0, XRAY = 0, MC = 0, CTG = 0, OC1_DC = 0, OC2_DC = 0, OC1_DA = 0, OC2_DA = 0, DUE_CARRIER = 0,
//             HAWB = 0, PCA = 0, DUE_AGENT = 0, TOTAL = 0, FREIGHT = 0, AMS = 0, THC = 0, BUSINESPROMO = 0, BP = 0,
//             FSC_CC = 0, IRC_CC = 0, XRAY_CC = 0, MC_CC = 0, CTG_CC = 0, OC1_DC_CC = 0, OC2_DC_CC = 0, OC1_DA_CC = 0,
//             OC2_DA_CC = 0, DUE_CARRIER_CC = 0, HAWB_CC = 0, PCA_CC = 0, DUE_AGENT_CC = 0, TOTAL_CC = 0, FREIGHT_CC = 0,
//             AMS_CC = 0, THC_CC = 0, BP_CC = 0;

//         if (this.TarFscFrt == "PP") { FSC = (Math.abs(this.TarFsc)); }
//         else { FSC_CC = (Math.abs(this.TarFsc)); }

//         if (this.TarIrcFrt == "PP") { IRC = (Math.abs(this.TarIrc)); }
//         else { IRC_CC = (Math.abs(this.TarIrc)); }

//         if (this.TarXrayFrt == "PP") { XRAY = (Math.abs(this.TarXray)); }
//         else { XRAY_CC = (Math.abs(this.TarXray)); }

//         if (this.TarMcFrt == "PP") { MC = (Math.abs(this.TarMc)); }
//         else { MC_CC = (Math.abs(this.TarMc)); }

//         if (this.TarAmsFrt == "PP") { AMS = (Math.abs(this.TarAms)); }
//         else { AMS_CC = (Math.abs(this.TarAms)); }

//         if (this.CityCode == "MUM") {
//             if (this.TarCtgFrt == "PP") { CTG = Math.abs(this.TarCtg); }
//             else { CTG_CC = Math.abs(this.TarCtg); }
//         }
//         else {
//             CTG = 0;
//             CTG_CC = 0;
//         }

//         if (this.CityCode == "DAC") {
//             if (this.TarThcFrt == "PP")
//                 THC = Math.abs(this.TarThc);
//             else
//                 THC_CC = Math.abs(this.TarThc);
//         }
//         else {
//             THC = 0;
//             THC_CC = 0;
//         }

//         if (this.CityCode == "DAC") {
//             BP = 0;
//             BP_CC = 0;
//         }
//         else {
//             if (this.TarBPFrt == "PP") { BP = Math.abs(this.TarBP); }
//             else { BP_CC = Math.abs(this.TarBP); }
//         }

//         if (this.OtherAmt1TarFrt == "PP") {
//             if (this.CalOneDcTar == 1) { OC1_DC = Math.abs(this.OtherAmt1_Tar); }
//             else { OC1_DA = Math.abs(this.OtherAmt1_Tar); }
//         }
//         else {
//             if (this.CalOneDcTar == 1) { OC1_DC_CC = Math.abs(this.OtherAmt1_Tar); }
//             else { OC1_DA_CC = Math.abs(this.OtherAmt1_Tar); }
//         }

//         if (this.OtherAmt2TarFrt == "PP") {
//             if (this.CalTwoDcTar == 1) { OC2_DC = Math.abs(this.OtherAmt2_Tar); }
//             else { OC2_DA = Math.abs(this.OtherAmt2_Tar); }
//         }
//         else {
//             if (this.CalTwoDcTar == 1) { OC2_DC_CC = Math.abs(this.OtherAmt2_Tar); }
//             else { OC2_DA_CC = Math.abs(this.OtherAmt2_Tar); }
//         }

//         if (this.HawbTarFrt == "PP") { HAWB = Math.abs(this.HawbTar); }
//         else { HAWB_CC = Math.abs(this.HawbTar); }

//         if (this.PcaTarFrt == "PP") { PCA = Math.abs(this.PcaTar); }
//         else { PCA_CC = Math.abs(this.PcaTar); }

//         if (this.TarFreightFrt == "PP") { FREIGHT = Math.abs(this.TarFreight); }
//         else { FREIGHT_CC = Math.abs(this.TarFreight); }

//         let DUE_CARRIER1 = Math.abs(FSC) + Math.abs(IRC) + Math.abs(XRAY) + Math.abs(MC) + Math.abs(CTG) + Math.abs(AMS) + Math.abs(OC1_DC) + Math.abs(OC2_DC) + Math.abs(THC) + Math.abs(BP);
//         DUE_CARRIER = Math.round(Math.abs(DUE_CARRIER1));
//         DUE_CARRIER = DUE_CARRIER;
//         let DUE_CARRIER1_CC = Math.abs(FSC_CC) + Math.abs(IRC_CC) + Math.abs(XRAY_CC) + Math.abs(MC_CC) + Math.abs(CTG_CC) + Math.abs(AMS_CC) + Math.abs(OC1_DC_CC) + Math.abs(OC2_DC_CC) + Math.abs(THC_CC) + Math.abs(BP_CC);
//         DUE_CARRIER_CC = Math.round(Math.abs(DUE_CARRIER1_CC));
//         DUE_CARRIER_CC = DUE_CARRIER_CC;

//         let DUE_AGENT1 = Math.abs(HAWB) + Math.abs(PCA) + Math.abs(OC1_DA) + Math.abs(OC2_DA);
//         DUE_AGENT1 = Math.round(DUE_AGENT1);
//         DUE_AGENT = DUE_AGENT1;
//         let DUE_AGENT1_CC = Math.abs(HAWB_CC) + Math.abs(PCA_CC) + Math.abs(OC1_DA_CC) + Math.abs(OC2_DA_CC);
//         DUE_AGENT1_CC = Math.round(DUE_AGENT1_CC);
//         DUE_AGENT_CC = DUE_AGENT1_CC;

//         let TOTAL1 = Math.abs(DUE_CARRIER) + Math.abs(DUE_AGENT) + Math.abs(FREIGHT)
//         TOTAL1 = Math.round(TOTAL1);
//         TOTAL = Math.abs(TOTAL1);
//         let TOTAL1_CC = Math.abs(DUE_CARRIER_CC) + Math.abs(DUE_AGENT_CC) + Math.abs(FREIGHT_CC)
//         TOTAL1_CC = Math.round(TOTAL1_CC);
//         TOTAL_CC = TOTAL1_CC;

//         this.DurCarrierTar = DUE_CARRIER.toFixed(2);
//         this.DueAgentTar = DUE_AGENT.toFixed(2);
//         this.TotalTar = TOTAL.toFixed(2);
//         this.DurCarrierTarCC = DUE_CARRIER_CC.toFixed(2);
//         this.DueAgentTarCC = DUE_AGENT_CC.toFixed(2);
//         this.TotalTarCC = TOTAL_CC.toFixed(2);
//     }

//     fnCalculate_Net() {
//         let FSC = 0, IRC = 0, XRAY = 0, MC = 0, CTG = 0, THC = 0, BP = 0, OC1_DC = 0, OC2_DC = 0, OC1_DA = 0, OC2_DA = 0,
//             DUE_CARRIER = 0, HAWB = 0, PCA = 0, DUE_AGENT = 0, TOTAL = 0, FREIGHT = 0, AMS = 0, FSC_CC = 0, IRC_CC = 0,
//             XRAY_CC = 0, MC_CC = 0, CTG_CC = 0, THC_CC = 0, BP_CC = 0, OC1_DC_CC = 0, OC2_DC_CC = 0, OC1_DA_CC = 0,
//             OC2_DA_CC = 0, DUE_CARRIER_CC = 0, HAWB_CC = 0, PCA_CC = 0, DUE_AGENT_CC = 0, TOTAL_CC = 0, FREIGHT_CC = 0,
//             AMS_CC = 0;

//         if (this.NetFscFrt == "PP") { FSC = Math.abs(this.NetFsc); }
//         else { FSC_CC = Math.abs(this.NetFsc); }

//         if (this.NetIrcFrt == "PP") { IRC = Math.abs(this.NetIrc); }
//         else { IRC_CC = Math.abs(this.NetIrc); }

//         if (this.NetXrayFrt == "PP") { XRAY = Math.abs(this.NetXray); }
//         else { XRAY_CC = Math.abs(this.NetXray); }

//         if (this.NetMcFrt == "PP") { MC = Math.abs(this.NetMc); }
//         else { MC_CC = Math.abs(this.NetMc); }

//         if (this.NetAmsFrt == "PP") { AMS = Math.abs(this.NetAms); }
//         else { AMS_CC = Math.abs(this.NetAms); }

//         if (this.CityCode == "MUM") {
//             if (this.NetCtgFrt == "PP") { CTG = Math.abs(this.NetCtg); }
//             else { CTG_CC = Math.abs(this.NetCtg); }
//         }
//         else {
//             CTG = 0;
//             CTG_CC = 0;
//         }

//         if (this.CityCode == "DAC") {
//             if (this.NetThcFrt == "PP") { THC = Math.abs(this.NetThc); }
//             else { THC_CC = Math.abs(this.NetThc); }
//         }
//         else {
//             THC = 0;
//             THC_CC = 0;
//         }

//         if (this.CityCode == "DAC") {
//             BP = 0;
//             BP_CC = 0;
//         }
//         else {
//             if (this.NetBPFrt == "PP") { BP = Math.abs(this.NetBP); }
//             else { BP_CC = Math.abs(this.NetBP); }
//         }

//         if (this.OtherAmt1NetFrt == "PP") {
//             if (this.CalOneDcNet == 1) { OC1_DC = Math.abs(this.OtherAmt1_Net); }
//             else { OC1_DA = Math.abs(this.OtherAmt1_Net); }
//         }
//         else {
//             if (this.CalOneDcNet == 1) { OC1_DC_CC = Math.abs(this.OtherAmt1_Net); }
//             else { OC1_DA_CC = Math.abs(this.OtherAmt1_Net); }
//         }

//         if (this.OtherAmt2NetFrt == "PP") {
//             if (this.CalTwoDcTar == 1) { OC2_DC = Math.abs(this.OtherAmt2_Net); }
//             else { OC2_DA = Math.abs(this.OtherAmt2_Net); }
//         }
//         else {
//             if (this.CalTwoDcTar == 1) { OC2_DC_CC = Math.abs(this.OtherAmt2_Net); }
//             else { OC2_DA_CC = Math.abs(this.OtherAmt2_Net); }
//         }

//         if (this.HawbNetFrt == "PP") { HAWB = Math.abs(this.HawbNet); }
//         else { HAWB_CC = Math.abs(this.HawbNet); }

//         if (this.PcaNetFrt == "PP") { PCA = Math.abs(this.PcaNet); }
//         else { PCA_CC = Math.abs(this.PcaNet); }

//         if (this.NetFreightFrt == "PP") { FREIGHT = Math.abs(this.NetFreight); }
//         else { FREIGHT_CC = Math.abs(this.NetFreight); }



//         let DUE_CARRIER1 = Math.abs(FSC) + Math.abs(IRC) + Math.abs(XRAY) + Math.abs(MC) + Math.abs(CTG) + Math.abs(AMS) + Math.abs(OC1_DC) + Math.abs(OC2_DC) + Math.abs(THC) + Math.abs(BP);
//         DUE_CARRIER1 = Math.round(Math.abs(DUE_CARRIER1));
//         DUE_CARRIER = Math.abs(DUE_CARRIER1);
//         let DUE_CARRIER1_CC = Math.abs(FSC_CC) + Math.abs(IRC_CC) + Math.abs(XRAY_CC) + Math.abs(MC_CC) + Math.abs(CTG_CC) + Math.abs(AMS_CC) + Math.abs(OC1_DC_CC) + Math.abs(OC2_DC_CC) + Math.abs(THC_CC) + Math.abs(BP_CC);
//         DUE_CARRIER1_CC = Math.round(Math.abs(DUE_CARRIER1_CC));
//         DUE_CARRIER_CC = Math.abs(DUE_CARRIER1_CC);

//         let DUE_AGENT1 = Math.abs(HAWB) + Math.abs(PCA) + Math.abs(OC1_DA) + Math.abs(OC2_DA);
//         DUE_AGENT1 = Math.round(Math.abs(DUE_AGENT1));
//         DUE_AGENT = Math.abs(DUE_AGENT1);
//         let DUE_AGENT1_CC = Math.abs(HAWB_CC) + Math.abs(PCA_CC) + Math.abs(OC1_DA_CC) + Math.abs(OC2_DA_CC);
//         DUE_AGENT1_CC = Math.round(Math.abs(DUE_AGENT1_CC));
//         DUE_AGENT_CC = Math.abs(DUE_AGENT1_CC);

//         let TOTAL1 = Math.abs(DUE_CARRIER) + Math.abs(DUE_AGENT) + Math.abs(FREIGHT)
//         TOTAL1 = Math.round(Math.abs(TOTAL1));
//         TOTAL = Math.abs(TOTAL1);
//         let TOTAL1_CC = Math.abs(DUE_CARRIER_CC) + Math.abs(DUE_AGENT_CC) + Math.abs(FREIGHT_CC)
//         TOTAL1_CC = Math.round(Math.abs(TOTAL1_CC));
//         TOTAL_CC = Math.abs(TOTAL1_CC);

//         this.DurCarrierNet = DUE_CARRIER.toFixed(2);
//         this.DueAgentNet = DUE_AGENT.toFixed(2);
//         this.TotalNet = TOTAL.toFixed(2);
//         this.DurCarrierNetCC = DUE_CARRIER_CC.toFixed(2);
//         this.DueAgentNetCC = DUE_AGENT_CC.toFixed(2);
//         this.TotalNetCC = TOTAL_CC.toFixed(2);
//     }

//     changeUserWeight() {
//         if (this.oldchblwt!= this.UserWgt)
//         {
//             var answer = confirm("Are you sure you want to change Charable Weight from "+this.oldchblwt+" to "+this.UserWgt+"?")
//             if (answer == false) { return false; }
//             else
//             {
//                 this.oldchblwt=this.UserWgt;
//                 this.fn_PageLoad();
//                 this.changeTariffRates('Freight');
//                 this.changeNetRates('Freight');
//                 this.changeTariffRates('Fsc');
//                 this.changeNetRates('Fsc');
//                 this.changeTariffRates('Irc');
//                 this.changeNetRates('Irc');
//                 this.changeTariffRates('Xray');
//                 this.changeNetRates('Xray');
//                 this.fnCalculate_Tar();
//                 this.fnCalculate_Net();

//             }
//         }
//         if (this.oldgrwt!= this.UserGrossWeight)
//         {
//             var answer = confirm("Are you sure you want to change Gross Weight from "+this.oldgrwt+" to "+this.UserGrossWeight+"?")
//         if (answer == false) { return false; }
//         }
//         else
//         {
//             this.oldgrwt=this.UserGrossWeight;
//             this.fn_PageLoad();
//             this.fnCalculate_Tar();
//             this.fnCalculate_Net();
//         }
//      }

//     onChangeAms(rateType: string) {
//         if (rateType == 'TAR') {
//             this.fnCalculate_Tar();
//         }
//         else if (rateType == 'NET') {
//             this.fnCalculate_Net();
//         }
//     }

//     onChangeOtherChargeName(cnType: number) {
//         if (cnType == 1) {
//             if (this.OtherChrg1 == "") {
//                 this.OtherAmt1_Tar = "";
//                 this.fnCalculate_Tar();
//                 if (this.hdNetRights == true) {
//                     this.OtherAmt1_Net = "";
//                     this.fnCalculate_Net();
//                 }
//             }
//         }
//         else if (cnType == 2) {
//             if (this.OtherChrg2 == "") {
//                 this.OtherAmt2_Tar = "";
//                 this.fnCalculate_Tar();
//                 if (this.hdNetRights == true) {
//                     this.OtherAmt2_Net = "";
//                     this.fnCalculate_Net();
//                 }
//             }
//         }
//     }

//     onChangeOther_Tar(oType: number) {
//         if (oType == 1) {
//             if (Math.abs(this.OtherAmt1_Tar) > 0) {
//                 if (this.OtherChrg1 == "" || this.OtherChrg1 == null) {
//                     alert("Please enter name of Charge1.");
//                     this.OtherAmt1_Tar = null;
//                     return false;
//                 }
//             }
//             this.fnCalculate_Tar();
//         }
//         else if (oType == 2) {
//             if (Math.abs(this.OtherAmt2_Tar) > 0) {
//                 if (this.OtherChrg2 == "" || this.OtherChrg2 == null) {
//                     alert("Please enter name of Charge2.");
//                     this.OtherAmt2_Tar = null;
//                     return false;
//                 }
//             }
//             this.fnCalculate_Tar();
//         }
//     }

//     onChangeOther_Net(ChargeType) {
//         if (ChargeType == '1') {
//             if (Math.abs(this.OtherAmt1_Net) > 0) {
//                 if (this.OtherChrg1 == "" || this.OtherChrg1 == null) {
//                     alert("Please enter name of Charge1.");
//                     this.OtherAmt1_Net = null;
//                     return false;
//                 }
//             }
//             this.fnCalculate_Net();
//         }
//         else if (ChargeType == '2') {
//             if (Math.abs(this.OtherAmt2_Net) > 0) {
//                 if (this.OtherChrg2 == "" || this.OtherChrg2 == null) {
//                     alert("Please enter name of Charge2.");
//                     this.OtherAmt2_Net = null;
//                     return false;
//                 }
//             }
//             this.fnCalculate_Net();
//         }

//     }

//     fnChangeFreight_PP_CC_TAR() {
//         let Value = this.TarFreightFrt;
//         this.TarFscFrt = Value;
//         this.TarIrcFrt = Value;
//         this.TarXrayFrt = Value;
//         this.fnCalculate_Tar();
//     }

//     fnChangeFreight_PP_CC_NET() {
//         let Value = this.NetFreightFrt;
//         this.NetFscFrt = Value;
//         this.NetIrcFrt = Value;
//         this.NetXrayFrt = Value;
//         this.fnCalculate_Net();
//     }

//     fn_MAWB_IU() {

//         if (this.validateWeight() == false) { return false; }

//         let AGENTS_RATE = this.AgentsRate;

//         if (parseFloat(AGENTS_RATE) > 20.00) {
//             alert("Please Enter below 20 on Agent Charges! ");
//             return false;
//         }

//         let MAWBNO = this._sharedconsig.exportEditData.MAWBNO;
//         let CITYCODE = this.CityCode;
//         let CHBL_WGT = this.Wgt;
//         let GROSS_WGT = this.GrossWeight;
//         let CHBL_WGT_USER = Math.abs(this.UserWgt);
//         let GROSS_WGT_USER = Math.abs(this.UserGrossWeight);

//         let FREIGHT = (this.FreightRate != null) ? this.FreightRate : "";

//         let FRT_CHARGEABLE_AS_TAR = (this.TariffRate == 1) ? "AI" : "FS";

//         let FRT_PAYABLE_ON_TAR = (this.TarFreightPayOn != null) ? this.TarFreightPayOn : "";
//         let FRT_RATE_PER_KG_TAR = Math.abs(this.TarFreightRate);
//         let FRT_RATE_TAR = Math.abs(this.TarFreight);

//         let FSC_PAYABLE_ON_TAR = (this.TarFscPayOn != null) ? this.TarFscPayOn : "";
//         let FSC_RATE_PER_KG_TAR = Math.abs(this.TarFscRate);
//         let FSC_RATE_TAR = Math.abs(this.TarFsc);

//         let IRC_PAYABLE_ON_TAR = (this.TarIrcPayOn != null) ? this.TarIrcPayOn : "";
//         let IRC_RATE_PER_KG_TAR = Math.abs(this.TarIrcRate);
//         let IRC_RATE_TAR = Math.abs(this.TarIrc);

//         let XRAY_PAYABLE_ON_TAR = (this.TarXrayPayOn != null) ? this.TarXrayPayOn : "";
//         let XRAY_RATE_PER_KG_TAR = Math.abs(this.TarXrayRate);
//         let XRAY_RATE_TAR = Math.abs(this.TarXray);


//         if (FRT_CHARGEABLE_AS_TAR == 'FS') {
//             // if (FSC_RATE_TAR == 0) {
//             //     alert("Please enter any one TARIFF RATE - FSC");
//             //     return false;
//             // }
//             if (FSC_RATE_TAR == 0 && IRC_RATE_TAR == 0 && XRAY_RATE_TAR == 0) {
//                 alert("Please enter any one TARIFF RATE :[FSC] or [IRC] or [X-RAY]");
//                 return false;
//             }

//         }

//         let MC_PAYABLE_ON_TAR = (this.TarMcPayOn != null) ? this.TarMcPayOn : "";
//         let MC_RATE_PER_KG_TAR = Math.abs(this.TarMcRate);
//         let MC_RATE_TAR = Math.abs(this.TarMc);

//         let CTG_PAYABLE_ON_TAR = (this.TarCtgPayOn != null) ? this.TarCtgPayOn : "";
//         let CTG_RATE_PER_KG_TAR = Math.abs(this.TarCtgRate);
//         let CTG_RATE_TAR = Math.abs(this.TarCtg);

//         let THC_PAYABLE_ON_TAR = (this.TarThcPayOn != null) ? this.TarThcPayOn : "";
//         let THC_RATE_PER_KG_TAR = Math.abs(this.TarThcRate);
//         let THC_RATE_TAR = Math.abs(this.TarThc);

//         let BP_PAYABLE_ON_TAR = (this.TarBPPayOn != null) ? this.TarBPPayOn : "";
//         let BP_RATE_PER_KG_TAR = Math.abs(this.TarBPRate);
//         let BP_RATE_TAR = Math.abs(this.TarBP);

//         let DUE_CARRIER_TAR = Math.abs(this.DurCarrierTar);
//         let HAWB_TAR = Math.abs(this.HawbTar);
//         let PCA_TAR = Math.abs(this.PcaTar);
//         let DUE_AGENT_TAR = Math.abs(this.DueAgentTar);
//         let TOTAL_TAR = Math.abs(this.TotalTar);
//         let OTHER_CHRG_TAR = Math.abs(this.OtherTar);
//         let REMARK = this.Remark;
//         let AMS_RATE_TAR = Math.abs(this.TarAms);

//         let OTHER_NAME1 = this.OtherChrg1;
//         let OTHER_NAME2 = this.OtherChrg2;
//         let OTHER_RATE1_TAR = Math.abs(this.OtherAmt1_Tar);
//         let OTHER_RATE2_TAR = Math.abs(this.OtherAmt2_Tar);

//         let OTHER_RATE1_TAR_CAL = (this.CalOneDcTar == 1) ? "DC" : "DA";
//         let OTHER_RATE2_TAR_CAL = this.OtherAmt2_Tar;

//         OTHER_RATE2_TAR_CAL = (this.CalTwoDcTar == 1) ? "DC" : "DA"; //Line 1413 one variable with different data

//         let OTHER_RATE1_NET_CAL = (this.CalOneDcNet == 1) ? "DC" : "DA";

//         let OTHER_RATE2_NET_CAL = (this.CalTwoDcNet == 1) ? "DC" : "DA";

//         let ISMIN = (this.isMinRate == true) ? "Y" : "N";

//         let EXPTNO = this.exptno;

//         var FRT_RATE_TAR_FRT = '',
//             FSC_RATE_TAR_FRT = '',
//             IRC_RATE_TAR_FRT = '',
//             XRAY_RATE_TAR_FRT = '',
//             MC_RATE_TAR_FRT = '',
//             CTG_RATE_TAR_FRT = '',
//             THC_RATE_TAR_FRT = '',
//             BP_RATE_TAR_FRT = '',
//             HAWB_RATE_TAR_FRT = '',
//             PCA_RATE_TAR_FRT = '',
//             OTHER_RATE_TAR_FRT = '',

//             FRT_RATE_NET_FRT = '',
//             FSC_RATE_NET_FRT = '',
//             IRC_RATE_NET_FRT = '',
//             XRAY_RATE_NET_FRT = '',
//             MC_RATE_NET_FRT = '',
//             CTG_RATE_NET_FRT = '',
//             THC_RATE_NET_FRT = '',
//             BP_RATE_NET_FRT = '',
//             AMS_RATE_NET_FRT = '',
//             HAWB_RATE_NET_FRT = '',
//             PCA_RATE_NET_FRT = '',
//             OTHER_RATE_NET_FRT = '',
//             AMS_RATE_TAR_FRT = '';

//         var FRT_CHARGEABLE_AS_NET = '',
//             FRT_PAYABLE_ON_NET = '',
//             FRT_RATE_PER_KG_NET: number,
//             FRT_RATE_NET: number,
//             FSC_PAYABLE_ON_NET = '',
//             FSC_RATE_PER_KG_NET: number,
//             FSC_RATE_NET: number,
//             IRC_PAYABLE_ON_NET = '',
//             IRC_RATE_PER_KG_NET: number,
//             IRC_RATE_NET: number,
//             XRAY_PAYABLE_ON_NET = '',
//             XRAY_RATE_PER_KG_NET: number,
//             XRAY_RATE_NET: number,
//             MC_PAYABLE_ON_NET = '',
//             MC_RATE_PER_KG_NET: number,
//             MC_RATE_NET: number,
//             CTG_PAYABLE_ON_NET = '',
//             CTG_RATE_PER_KG_NET: number | string,
//             CTG_RATE_NET: number,
//             DUE_CARRIER_NET: number | string,
//             HAWB_NET: number,
//             PCA_NET: number,
//             DUE_AGENT_NET: number | string,
//             TOTAL_NET: number | string,
//             OTHER_CHRG_NET: number,
//             AMS_RATE_NET: number,
//             OTHER_RATE1_NET: number,
//             OTHER_RATE2_NET: number,
//             ISNETEDIT = '',
//             SupplierNet = '',
//             AIR_FRT_COMMISSION = '',
//             FRT_REBATE: number,
//             TDS: number,
//             SERVICE_TAX: number,
//             THC_PAYABLE_ON_NET = '',
//             THC_RATE_PER_KG_NET: number,
//             THC_RATE_NET: number,
//             BUSINES_PROMO = '',
//             BP_PAYABLE_ON_NET = '',
//             BP_RATE_PER_KG_NET: number | string,
//             BP_RATE_NET: number;


//         if (Math.abs(FRT_RATE_TAR) > 0)
//             FRT_RATE_TAR_FRT = this.TarFreightFrt;
//         if (Math.abs(FSC_RATE_TAR) > 0)
//             FSC_RATE_TAR_FRT = this.TarFscFrt;
//         if (Math.abs(IRC_RATE_TAR) > 0)
//             IRC_RATE_TAR_FRT = this.TarIrcFrt;
//         if (Math.abs(XRAY_RATE_TAR) > 0)
//             XRAY_RATE_TAR_FRT = this.TarXrayFrt;
//         if (Math.abs(MC_RATE_TAR) > 0)
//             MC_RATE_TAR_FRT = this.TarMcFrt;
//         if (Math.abs(CTG_RATE_TAR) > 0)
//             CTG_RATE_TAR_FRT = this.TarCtgFrt;
//         if (Math.abs(THC_RATE_TAR) > 0)
//             THC_RATE_TAR_FRT = this.TarThcFrt;
//         if (Math.abs(BP_RATE_TAR) > 0)
//             BP_RATE_TAR_FRT = this.TarBPFrt;
//         if (Math.abs(AMS_RATE_TAR) > 0)
//             AMS_RATE_TAR_FRT = this.TarAmsFrt;
//         if (Math.abs(HAWB_TAR) > 0)
//             HAWB_RATE_TAR_FRT = this.HawbTarFrt;
//         if (Math.abs(PCA_TAR) > 0)
//             PCA_RATE_TAR_FRT = this.PcaTarFrt;
//         if (Math.abs(OTHER_CHRG_TAR) > 0)
//             OTHER_RATE_TAR_FRT = this.OtherTarFrt;


//         let OTHER_RATE1_TAR_FRT = '',
//             OTHER_RATE2_TAR_FRT = '',
//             OTHER_RATE1_NET_FRT = '',
//             OTHER_RATE2_NET_FRT = '',
//             DUE_CARRIER_NET_CC = 0,
//             DUE_AGENT_NET_CC = 0,
//             TOTAL_NET_CC = 0;

//         if (Math.abs(OTHER_RATE1_TAR) > 0)
//             OTHER_RATE1_TAR_FRT = this.OtherAmt1TarFrt;
//         if (Math.abs(OTHER_RATE2_TAR) > 0)
//             OTHER_RATE2_TAR_FRT = this.OtherAmt2TarFrt;

//         let DUE_CARRIER_TAR_CC = Math.abs(this.DurCarrierTarCC),
//             DUE_AGENT_TAR_CC = Math.abs(this.DueAgentTarCC),
//             TOTAL_TAR_CC = Math.abs(this.TotalTarCC);

//         let TDS_ACCTCODE = '',
//             SERVICETAX_ACCTCODE = '';

//         if (this.hdNetRights == true) {
//             ISNETEDIT = 'Y';

//             TDS = Math.abs(this.TxtTDS);
//             SERVICE_TAX = Math.abs(this.TxtServiceTax);
//             TDS_ACCTCODE = this.DrpTDS;
//             SERVICETAX_ACCTCODE = this.DrpServiceTax;

//             if (Math.abs(TDS) > 0) {
//                 if (TDS_ACCTCODE == "0") {
//                     alert("Please select TDS Account Name.");
//                     return false;
//                 }
//             }
//             else { TDS_ACCTCODE = ''; }

//             if (Math.abs(SERVICE_TAX) > 0) {
//                 if (SERVICETAX_ACCTCODE == "0") {
//                     alert("Please select Service Tax Account Name.");
//                     return false;
//                 }
//             }
//             else { SERVICETAX_ACCTCODE = ''; }

//             if (this.SupplierNet == null) {
//                 alert("Please select Supplier.");
//                 return false;
//             }
//             SupplierNet = this.SupplierNet;

//             FRT_CHARGEABLE_AS_NET = (this.NetRate == 1) ? "AI" : "FS";

//             FRT_PAYABLE_ON_NET = (this.NetFreightPayOn != null) ? this.NetFreightPayOn : "";
//             FRT_RATE_PER_KG_NET = Math.abs(this.NetFreightRate);
//             FRT_RATE_NET = Math.abs(this.NetFreight);

//             FSC_PAYABLE_ON_NET = (this.NetFscPayOn != null) ? this.NetFscPayOn : "";
//             FSC_RATE_PER_KG_NET = Math.abs(this.NetFscRate);
//             FSC_RATE_NET = Math.abs(this.NetFsc);

//             IRC_PAYABLE_ON_NET = (this.NetIrcPayOn != null) ? this.NetIrcPayOn : "";
//             IRC_RATE_PER_KG_NET = Math.abs(this.NetIrcRate);
//             IRC_RATE_NET = Math.abs(this.NetIrc);

//             XRAY_PAYABLE_ON_NET = (this.NetXrayPayOn != null) ? this.NetXrayPayOn : "";
//             XRAY_RATE_PER_KG_NET = Math.abs(this.NetXrayRate);
//             XRAY_RATE_NET = Math.abs(this.NetXray);

//             // if (FRT_CHARGEABLE_AS_NET == 'FS') {
//             //     if (FSC_RATE_NET == 0) {
//             //         alert("Please enter any one NET NET RATE - FSC");
//             //         return false;
//             //     }
//                 //        if (FSC_RATE_NET == 0 && IRC_RATE_NET == 0 && XRAY_RATE_NET == 0) {
//                 //            alert("Please enter any one NET NET RATE :[FSC] or [IRC] or [X-RAY]");
//                 //            return false;
//                 //        }

//            // }

//             MC_PAYABLE_ON_NET = (this.NetMcPayOn != null) ? this.NetMcPayOn : "";
//             MC_RATE_PER_KG_NET = Math.abs(this.NetMcRate);
//             MC_RATE_NET = Math.abs(this.NetMc);

//             CTG_PAYABLE_ON_NET = (this.NetCtgPayOn != null || this.NetCtgPayOn != '') ? this.NetCtgPayOn : "";
//             CTG_RATE_PER_KG_NET = (this.NetCtgRate != null || this.NetCtgRate != '') ? Math.abs(this.NetCtgRate) : "";
//             CTG_RATE_NET = Math.abs(this.NetCtg);


//             THC_PAYABLE_ON_NET = (this.NetThcPayOn != null) ? this.NetThcPayOn : "";
//             THC_RATE_PER_KG_NET = Math.abs(this.NetThcRate);
//             THC_RATE_NET = Math.abs(this.NetThc);

//             BP_PAYABLE_ON_NET = (this.NetBPPayOn != null) ? this.NetBPPayOn : "";
//             BP_RATE_PER_KG_NET = (this.NetBPRate != null || this.NetBPRate != '') ? Math.abs(this.NetBPRate) : "";
//             BP_RATE_NET = Math.abs(this.NetBP);

//             DUE_CARRIER_NET = (this.DurCarrierNet != null || this.DurCarrierNet != '') ? Math.abs(this.DurCarrierNet) : "";
//             HAWB_NET = Math.abs(this.HawbNet);
//             PCA_NET = Math.abs(this.PcaNet);
//             DUE_AGENT_NET = (this.DueAgentNet != null || this.DueAgentNet != '') ? Math.abs(this.DueAgentNet) : "";
//             TOTAL_NET = Math.abs(this.TotalNet);
//             OTHER_CHRG_NET = Math.abs(this.OtherNet);
//             AMS_RATE_NET = Math.abs(this.NetAms);
//             OTHER_RATE1_NET = Math.abs(this.OtherAmt1_Net);
//             OTHER_RATE2_NET = Math.abs(this.OtherAmt2_Net);

//             AIR_FRT_COMMISSION = (this.AirFrtCommission != null) ? this.AirFrtCommission : "";
//             FRT_REBATE = this.FrtRebate;
//             BUSINES_PROMO = (this.BusinesPromo != null || this.BusinesPromo != '') ? this.BusinesPromo : "";

//             if (Math.abs(FRT_RATE_NET) > 0)
//                 FRT_RATE_NET_FRT = this.NetFreightFrt;
//             if (Math.abs(FSC_RATE_NET) > 0)
//                 FSC_RATE_NET_FRT = this.NetFscFrt;
//             if (Math.abs(IRC_RATE_NET) > 0)
//                 IRC_RATE_NET_FRT = this.NetIrcFrt;
//             if (Math.abs(XRAY_RATE_NET) > 0)
//                 XRAY_RATE_NET_FRT = this.NetXrayFrt;
//             if (Math.abs(MC_RATE_NET) > 0)
//                 MC_RATE_NET_FRT = this.NetMcFrt;
//             if (Math.abs(CTG_RATE_NET) > 0)
//                 CTG_RATE_NET_FRT = this.NetCtgFrt;
//             if (Math.abs(THC_RATE_NET) > 0)
//                 THC_RATE_NET_FRT = this.NetThcFrt;
//             if (Math.abs(BP_RATE_NET) > 0)
//                 BP_RATE_NET_FRT = this.NetBPFrt;

//             if (Math.abs(AMS_RATE_NET) > 0)
//                 AMS_RATE_NET_FRT = this.NetAmsFrt;
//             if (Math.abs(HAWB_NET) > 0)
//                 HAWB_RATE_NET_FRT = this.HawbNetFrt;
//             if (Math.abs(PCA_NET) > 0)
//                 PCA_RATE_NET_FRT = this.PcaNetFrt;
//             if (Math.abs(OTHER_CHRG_NET) > 0)
//                 OTHER_RATE_NET_FRT = this.OtherNetFrt;

//             if (Math.abs(OTHER_RATE1_NET) > 0)
//                 OTHER_RATE1_NET_FRT = this.OtherAmt1NetFrt;
//             if (Math.abs(OTHER_RATE2_NET) > 0)
//                 OTHER_RATE2_NET_FRT = this.OtherAmt2NetFrt;

//             DUE_CARRIER_NET_CC = Math.abs(this.DurCarrierNetCC);
//             DUE_AGENT_NET_CC = Math.abs(this.DueAgentNetCC);
//             TOTAL_NET_CC = Math.abs(this.TotalNetCC);
//         }
//         else {
//             let ISNETEDIT = 'N',
//                 SupplierNet = '',
//                 FRT_CHARGEABLE_AS_NET = "AI",
//                 FRT_PAYABLE_ON_NET = '0',
//                 FRT_RATE_PER_KG_NET = '0',
//                 FRT_RATE_NET = '0',

//                 FSC_PAYABLE_ON_NET = '0',
//                 FSC_RATE_PER_KG_NET = '0',
//                 FSC_RATE_NET = '0',

//                 IRC_PAYABLE_ON_NET = '0',
//                 IRC_RATE_PER_KG_NET = '0',
//                 IRC_RATE_NET = '0',

//                 XRAY_PAYABLE_ON_NET = '0',
//                 XRAY_RATE_PER_KG_NET = '0',
//                 XRAY_RATE_NET = '0',

//                 MC_PAYABLE_ON_NET = '0',
//                 MC_RATE_PER_KG_NET = '0',
//                 MC_RATE_NET = '0',

//                 CTG_PAYABLE_ON_NET = '0',
//                 CTG_RATE_PER_KG_NET = '0',
//                 CTG_RATE_NET = '0',

//                 THC_PAYABLE_ON_NET = '0',
//                 THC_RATE_PER_KG_NET = '0',
//                 THC_RATE_NET = '0',

//                 BP_PAYABLE_ON_NET = '0',
//                 BP_RATE_PER_KG_NET = '0',
//                 BP_RATE_NET = '0',

//                 DUE_CARRIER_NET = '0',
//                 HAWB_NET = '0',
//                 PCA_NET = '0',
//                 DUE_AGENT_NET = '0',
//                 TOTAL_NET = '0',
//                 OTHER_CHRG_NET = '0',
//                 AMS_RATE_NET = '0',
//                 OTHER_RATE1_NET = '0',
//                 OTHER_RATE2_NET = '0',

//                 AIR_FRT_COMMISSION = '',
//                 FRT_REBATE = '',
//                 BUSINES_PROMO = '',
//                 TDS = '',
//                 SERVICE_TAX = '';

//             FRT_RATE_NET_FRT = '';
//             FSC_RATE_NET_FRT = '';
//             IRC_RATE_NET_FRT = '';
//             XRAY_RATE_NET_FRT = '';
//             MC_RATE_NET_FRT = '';
//             CTG_RATE_NET_FRT = '';
//             THC_RATE_NET_FRT = '';
//             BP_RATE_NET_FRT = '';
//             AMS_RATE_NET_FRT = '';
//             HAWB_RATE_NET_FRT = '';
//             PCA_RATE_NET_FRT = '';
//             OTHER_RATE_NET_FRT = '';

//             OTHER_RATE1_NET_FRT = '';
//             OTHER_RATE2_NET_FRT = '';
//             DUE_CARRIER_NET_CC = 0;
//             DUE_AGENT_NET_CC = 0;
//             TOTAL_NET_CC = 0;

//             TDS_ACCTCODE = '';
//             SERVICETAX_ACCTCODE = '';
//         }

//         const _jsonData = {
//             EXPTNO: EXPTNO,
//             MAWBNO: MAWBNO,
//             CITYCODE: CITYCODE,
//             CHBL_WGT: CHBL_WGT,
//             GROSS_WGT: GROSS_WGT,
//             CHBL_WGT_USER: CHBL_WGT_USER,
//             GROSS_WGT_USER: GROSS_WGT_USER,
//             FREIGHT: FREIGHT,
//             FRT_CHARGEABLE_AS_TAR: FRT_CHARGEABLE_AS_TAR,
//             FRT_CHARGEABLE_AS_NET: FRT_CHARGEABLE_AS_NET,
//             FRT_PAYABLE_ON_TAR: FRT_PAYABLE_ON_TAR,
//             FRT_RATE_PER_KG_TAR: FRT_RATE_PER_KG_TAR,
//             FRT_RATE_TAR: FRT_RATE_TAR,
//             FRT_PAYABLE_ON_NET: FRT_PAYABLE_ON_NET,
//             FRT_RATE_PER_KG_NET: FRT_RATE_PER_KG_NET,
//             FRT_RATE_NET: FRT_RATE_NET,
//             FSC_PAYABLE_ON_TAR: FSC_PAYABLE_ON_TAR,
//             FSC_RATE_PER_KG_TAR: FSC_RATE_PER_KG_TAR,
//             FSC_RATE_TAR: FSC_RATE_TAR,
//             FSC_PAYABLE_ON_NET: FSC_PAYABLE_ON_NET,
//             FSC_RATE_PER_KG_NET: FSC_RATE_PER_KG_NET,
//             FSC_RATE_NET: FSC_RATE_NET,
//             IRC_PAYABLE_ON_TAR: IRC_PAYABLE_ON_TAR,
//             IRC_RATE_PER_KG_TAR: IRC_RATE_PER_KG_TAR,
//             IRC_RATE_TAR: IRC_RATE_TAR,
//             IRC_PAYABLE_ON_NET: IRC_PAYABLE_ON_NET,
//             IRC_RATE_PER_KG_NET: IRC_RATE_PER_KG_NET,
//             IRC_RATE_NET: IRC_RATE_NET,
//             XRAY_PAYABLE_ON_TAR: XRAY_PAYABLE_ON_TAR,
//             XRAY_RATE_PER_KG_TAR: XRAY_RATE_PER_KG_TAR,
//             XRAY_RATE_TAR: XRAY_RATE_TAR,
//             XRAY_PAYABLE_ON_NET: XRAY_PAYABLE_ON_NET,
//             XRAY_RATE_PER_KG_NET: XRAY_RATE_PER_KG_NET,
//             XRAY_RATE_NET: XRAY_RATE_NET,
//             MC_PAYABLE_ON_TAR: MC_PAYABLE_ON_TAR,
//             MC_RATE_PER_KG_TAR: MC_RATE_PER_KG_TAR,
//             MC_RATE_TAR: MC_RATE_TAR,
//             MC_PAYABLE_ON_NET: MC_PAYABLE_ON_NET,
//             MC_RATE_PER_KG_NET: MC_RATE_PER_KG_NET,
//             MC_RATE_NET: MC_RATE_NET,
//             CTG_PAYABLE_ON_TAR: CTG_PAYABLE_ON_TAR,
//             CTG_RATE_PER_KG_TAR: CTG_RATE_PER_KG_TAR,
//             CTG_RATE_TAR: CTG_RATE_TAR,
//             CTG_PAYABLE_ON_NET: CTG_PAYABLE_ON_NET,
//             CTG_RATE_PER_KG_NET: CTG_RATE_PER_KG_NET,
//             CTG_RATE_NET: CTG_RATE_NET,
//             DUE_CARRIER_TAR: DUE_CARRIER_TAR,
//             DUE_CARRIER_NET: DUE_CARRIER_NET,
//             HAWB_TAR: HAWB_TAR,
//             HAWB_NET: HAWB_NET,
//             PCA_TAR: PCA_TAR,
//             PCA_NET: PCA_NET,
//             DUE_AGENT_TAR: DUE_AGENT_TAR,
//             DUE_AGENT_NET: DUE_AGENT_NET,
//             TOTAL_TAR: TOTAL_TAR,
//             TOTAL_NET: TOTAL_NET,
//             OTHER_CHRG_TAR: OTHER_CHRG_TAR,
//             OTHER_CHRG_NET: OTHER_CHRG_NET,
//             REMARK: REMARK,
//             AMS_RATE_TAR: AMS_RATE_TAR,
//             AMS_RATE_NET: AMS_RATE_NET,
//             OTHER_NAME1: OTHER_NAME1,
//             OTHER_NAME2: OTHER_NAME2,
//             OTHER_RATE1_TAR: OTHER_RATE1_TAR,
//             OTHER_RATE2_TAR: OTHER_RATE2_TAR,
//             OTHER_RATE1_NET: OTHER_RATE1_NET,
//             OTHER_RATE2_NET: OTHER_RATE2_NET,
//             OTHER_RATE1_TAR_CAL: OTHER_RATE1_TAR_CAL,
//             OTHER_RATE2_TAR_CAL: OTHER_RATE2_TAR_CAL,
//             OTHER_RATE1_NET_CAL: OTHER_RATE1_NET_CAL,
//             OTHER_RATE2_NET_CAL: OTHER_RATE2_NET_CAL,
//             ISNETEDIT: ISNETEDIT,
//             ISMIN: ISMIN,
//             SUPPLIER_NET: SupplierNet,
//             AIR_FRT_COMM_NET: AIR_FRT_COMMISSION,
//             FRT_REBATE_NET: FRT_REBATE,
//             TDS_NET: TDS,
//             SERVICE_TAX_NET: SERVICE_TAX,
//             FRT_RATE_TAR_FRT: FRT_RATE_TAR_FRT,
//             FSC_RATE_TAR_FRT: FSC_RATE_TAR_FRT,
//             IRC_RATE_TAR_FRT: IRC_RATE_TAR_FRT,
//             XRAY_RATE_TAR_FRT: XRAY_RATE_TAR_FRT,
//             MC_RATE_TAR_FRT: MC_RATE_TAR_FRT,
//             CTG_RATE_TAR_FRT: CTG_RATE_TAR_FRT,
//             AMS_RATE_TAR_FRT: AMS_RATE_TAR_FRT,
//             HAWB_RATE_TAR_FRT: HAWB_RATE_TAR_FRT,
//             PCA_RATE_TAR_FRT: PCA_RATE_TAR_FRT,
//             OTHER_RATE_TAR_FRT: OTHER_RATE_TAR_FRT,
//             FRT_RATE_NET_FRT: FRT_RATE_NET_FRT,
//             FSC_RATE_NET_FRT: FSC_RATE_NET_FRT,
//             IRC_RATE_NET_FRT: IRC_RATE_NET_FRT,
//             XRAY_RATE_NET_FRT: XRAY_RATE_NET_FRT,
//             MC_RATE_NET_FRT: MC_RATE_NET_FRT,
//             CTG_RATE_NET_FRT: CTG_RATE_NET_FRT,
//             AMS_RATE_NET_FRT: AMS_RATE_NET_FRT,
//             HAWB_RATE_NET_FRT: HAWB_RATE_NET_FRT,
//             PCA_RATE_NET_FRT: PCA_RATE_NET_FRT,
//             OTHER_RATE_NET_FRT: OTHER_RATE_NET_FRT,
//             OTHER_RATE1_TAR_FRT: OTHER_RATE1_TAR_FRT,
//             OTHER_RATE2_TAR_FRT: OTHER_RATE2_TAR_FRT,
//             DUE_CARRIER_TAR_CC: DUE_CARRIER_TAR_CC,
//             DUE_AGENT_TAR_CC: DUE_AGENT_TAR_CC,
//             TOTAL_TAR_CC: TOTAL_TAR_CC,
//             OTHER_RATE1_NET_FRT: OTHER_RATE1_NET_FRT,
//             OTHER_RATE2_NET_FRT: OTHER_RATE2_NET_FRT,
//             DUE_CARRIER_NET_CC: DUE_CARRIER_NET_CC,
//             DUE_AGENT_NET_CC: DUE_AGENT_NET_CC,
//             TOTAL_NET_CC: TOTAL_NET_CC,
//             TDS_ACCTCODE: TDS_ACCTCODE,
//             SERVICETAX_ACCTCODE: SERVICETAX_ACCTCODE,
//             AGENTS_RATE: AGENTS_RATE,
//             THC_PAYABLE_ON_TAR: THC_PAYABLE_ON_TAR,
//             THC_RATE_PER_KG_TAR: THC_RATE_PER_KG_TAR,
//             THC_RATE_TAR: THC_RATE_TAR,
//             THC_PAYABLE_ON_NET: THC_PAYABLE_ON_NET,
//             THC_RATE_PER_KG_NET: THC_RATE_PER_KG_NET,
//             THC_RATE_NET: THC_RATE_NET,
//             THC_RATE_TAR_FRT: THC_RATE_TAR_FRT,
//             THC_RATE_NET_FRT: THC_RATE_NET_FRT,
//             BUSINES_PROMO_NET: BUSINES_PROMO,
//             BP_PAYABLE_ON_TAR: BP_PAYABLE_ON_TAR,
//             BP_RATE_PER_KG_TAR: BP_RATE_PER_KG_TAR,
//             BP_RATE_TAR: BP_RATE_TAR,
//             BP_PAYABLE_ON_NET: BP_PAYABLE_ON_NET,
//             BP_RATE_PER_KG_NET: BP_RATE_PER_KG_NET,
//             BP_RATE_NET: BP_RATE_NET,
//             BP_RATE_TAR_FRT: BP_RATE_TAR_FRT,
//             BP_RATE_NET_FRT: BP_RATE_NET_FRT,
//             CmpCode: this._loginService.getLogin()[0].CMPCODE,
//             CmpId: this._loginService.getLogin()[0].CMPID,
//             MakerIp: this._loginService.getLogin()[0].MAKERIP, //Change later by Ip
//             DEST_TRUCKING_PAYABLE_ON_TAR: Truck_PAYABLE_ON_TAR,
//             DEST_TRUCKING_RATE_PER_KG_TAR: Truck_RATE_PER_KG_TAR,
//             DEST_TRUCKING_RATE_TAR: Truck_RATE_TAR,
//             DEST_TRUCKING_PAYABLE_ON_NET: TRUCK_PAYABLE_ON_NET,
//             DEST_TRUCKING_RATE_PER_KG_NET: TRUCK_RATE_PER_KG_NET,
//             DEST_TRUCKING_RATE_NET: TRUCK_RATE_NET,
//             DEST_TRUCKING_RATE_TAR_FRT: TRUCK_RATE_TAR_FRT,
//             DEST_TRUCKING_RATE_NET_FRT: TRUCK_RATE_NET_FRT,
//             VGUID:this._loginService.getLogin()[0].GUID,
//         };
//         this._loaderService.display(true);
//         this._dataService.Common("Export/EXP_MST_EXPORT_MAWB_PP_CC_UPDATE", _jsonData)
//             .subscribe((data: any) => {
//                 if (data.Table[0].STATUS.split('#')[0]== '100') {
//                     this._toasterService.toast('success', 'Alert', data.Table[0].STATUS.split('#')[1]);
//                     this._loaderService.display(false);
//                 }
//                 else {
//                     this._toasterService.toast('error', 'error', data.Table[0].STATUSTEXT);
//                     this._loaderService.display(false);
//                 }
//             });
//     }

//     validate() {   if(this.ISAUTO_FRT_INV=="1")
//     {alert("MAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This MAWB !!");return false;}
//     else{this.fn_MAWB_IU(); }
//     }
// }

@Component({
    selector: 'app-consignment-mawb-edit',
    templateUrl: 'consign_main_mawb_rating.component.html',
    // styleUrls: ['../../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'],
    // encapsulation: ViewEncapsulation.None
})
export class MAWBEditComponent   {

    @Input() exptno: any;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

    netData: any = [];
    tdsData: any = [];
    serviceTax: any = [];

    pageload: boolean = false;
    SupplierNet: any = null;
    TariffRate: any = null;
    NetRate: any = null;
    CityCode: any = null;

    CalOneDcTar: number = null;
    CalOneDcNet: number = null;
    CalTwoDcTar: number = null;
    CalTwoDcNet: number = null;

    NetRightsAdd: boolean = false;
    NetRights: boolean = false;
    hdNetRights: boolean = false;
    hdRightsView: boolean = false;
    public disableupdatebtn:boolean=true;
    dataMode: string = null;

    Wgt: any = null;
    UserWgt: any = null;
    GrossWeight: any = null;
    UserGrossWeight: any = null;
    isMinRate: boolean = false;
    FreightRate: any = 'PP';
    AgentsRate: any = '0.00';

    //FREIGHT (BASIC)
    TarFreightPayOn: any = 'CW';
    TarFreightRate: any = null;
    TarFreight: any = null;
    TarFreightFrt: string = 'PP';
    NetFreightPayOn: any = 'CW';
    NetFreightRate: any = null;
    NetFreight: any = null;
    NetFreightFrt: string = 'PP';
    //FSC
    TarFscPayOn: any = null;
    TarFscRate: any = null;
    TarFsc: any = null;
    TarFscFrt: string = 'PP';
    NetFscPayOn: any = null;
    NetFscRate: any = null;
    NetFsc: any = null;
    NetFscFrt: string = 'PP';
    //IRC
    TarIrcPayOn: any = null;
    TarIrcRate: any = null;
    TarIrc: any = null;
    TarIrcFrt: string = 'PP';
    NetIrcPayOn: any = null;
    NetIrcRate: any = null;
    NetIrc: any = null;
    NetIrcFrt: string = 'PP';
    //XRAY
    TarXrayPayOn: any = null;
    TarXrayRate: any = null;
    TarXray: any = null;
    TarXrayFrt: string = 'PP';
    NetXrayPayOn: any = null;
    NetXrayRate: any = null;
    NetXray: any = null;
    NetXrayFrt: string = 'PP';
    //MISCELLANEOUS CHARGES
    TarMcPayOn: any = 'CW';
    TarMcRate: any = null;
    TarMc: any = null;
    TarMcFrt: string = 'PP';
    NetMcPayOn: any = 'CW';
    NetMcRate: any = null;
    NetMc: any = null;
    NetMcFrt: string = 'PP';
    //CTG
    TarCtgPayOn: any = 'GW';
    TarCtgRate: any = null;
    TarCtg: any = null;
    TarCtgFrt: string = 'PP';
    NetCtgPayOn: any = 'GW';
    NetCtgRate: any = null;
    NetCtg: any = null;
    NetCtgFrt: string = 'PP';
    //THC
    TarThcPayOn: any = 'CW';
    TarThcRate: any = null;
    TarThc: any = null;
    TarThcFrt: string = 'PP';
    NetThcPayOn: any = 'GW';
    NetThcRate: any = null;
    NetThc: any = null;
    NetThcFrt: string = 'PP';
    //BUSINESS PROMOTION
    TarBPPayOn: any = 'CW';
    TarBPRate: any = null;
    TarBP: any = null;
    TarBPFrt: string = 'PP';
    NetBPPayOn: any = 'CW';
    NetBPRate: any = null;
    NetBP: any = null;
    NetBPFrt: string = 'PP';

      //DESTIMATION TRUCKING
      TarTruckPayOn: any = 'CW';
      TarTruckRate: any = null;
      TarTruck: any = null;
      TarTruckFrt: string = 'PP';
      NetTruckPayOn: any = 'CW';
      NetTruckRate: any = null;
      NetTruck: any = null;
      NetTruckFrt: string = 'PP';

    TarAms: any = null;
    TarAmsFrt: any = 'PP';
    NetAms: any = null;
    NetAmsFrt: any = 'PP';

    HawbTar: any = null;
    HawbTarFrt: any = 'PP';
    HawbNet: any = null;
    HawbNetFrt: any = 'PP';

    PcaTar: any = null;
    PcaTarFrt: any = 'PP';
    PcaNet: any = null;
    PcaNetFrt: any = 'PP';

    DurCarrierTar: any = null;
    DurCarrierTarCC: any = null;
    DurCarrierNet: any = null;
    DurCarrierNetCC: any = null;

    DueAgentTar: any = null;
    DueAgentTarCC: any = null;
    DueAgentNet: any = null;
    DueAgentNetCC: any = null;

    TotalTar: any = null;
    TotalTarCC: any = null;
    TotalNet: any = null;
    TotalNetCC: any = null;

    OtherTar: any = null;
    OtherTarFrt: any = 'PP';
    OtherNet: any = null;
    OtherNetFrt: any = 'PP';

    AirFrtCommission: any = null;

    FrtRebate: any = null;

    BusinesPromo: any = null;

    DrpTDS: any = null;
    TxtTDS: any = null;

    DrpServiceTax: any = null;
    TxtServiceTax: any = null;

    OtherChrg1: any = null;
    OtherAmt1_Tar: any = null;
    OtherAmt1TarFrt: any = 'PP';
    OtherAmt1_Net: any = null;
    OtherAmt1NetFrt: any = 'PP';

    OtherChrg2: any = null;
    OtherAmt2_Tar: any = null;
    OtherAmt2TarFrt: any = 'PP';
    OtherAmt2_Net: any = null;
    OtherAmt2NetFrt: any = 'PP';

    Remark: string = null;
    Ppchrg: string = null;
    Ccchrg: string = null;
    Pptotagt: string = null;
    Cctotagt: string = null;
    Pptotcarr: string = null;
    Cctotcarr: string = null;
    Pptot: string = null;
    Cctot: string = null;
    Othchrg: string = null;
    ISAUTO_FRT_INV: string ="";
    oldchblwt: any = null;
    oldgrwt : any = null;
    //datatableMawbRate: Array<any> = [];

    //AIRLINE CHARGES
    dtAirLineCharges: Array<any> = [];
    AirLineCharges: any = [];
    AllAirLineChargeslist:any=[];
    ChrgTypelist:any=[];
    ChrgTypelistold:Array<any> = [];
    CHARGETYPE:string;
    DELCHARGETYPE:string;
    CHARGENAME:string;
    EDIT_CHARGETYPE:string="";
    EDIT_RATE_TAR:any = null;
    DEL_RATE_TAR:any = null;
    RATE_TAR: any = null;
    RATE_TAR_FRT: string = 'PP';
    DEL_RATE_TAR_FRT:string;
    RATE_NET: any = null;
    EDIT_RATE_NET:any = null;
    DEL_RATE_NET:any = null;
    RATE_NET_FRT: string = 'PP';
    DEL_RATE_NET_FRT:string;
    childID:string="0";
    Chargeslist: any = [];
    HAWBChargeslist: any = [];
    makerid:string;
    guid :string="";
    txtchild : string ="Add"
    CHRGDETAILSID:string="0";
    FK_ID: string="0";
    PK_ID: string="0";
    tot_rate_tar_pp_da:any = null;
    tot_rate_tar_pp_dc:any = null;
    tot_rate_tar_cc_da:any = null;
    tot_rate_tar_cc_dc:any = null;
    tot_rate_net_pp_da:any = null;
    tot_rate_net_pp_dc:any = null;
    tot_rate_net_cc_da:any = null;
    tot_rate_net_cc_dc:any = null;
    dttable6: any = [];
   //CHARGETYPE:string="";
    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) {
        this.exptno = this.exptno;
    }


    changefunction()
    {  var verifyData = null;
        console.log(this.type);
        this._loginService.verifyRights(236, '')
            .subscribe((data: any) => {
                this.hdRightsView=this._loginService.checkVerify('View', data);  //For verify user access
                this.NetRights = this._loginService.returnRights('View', data, this._loginService.getLogin()[0].ROLETYPE);
                this._loginService.verifyRights(264, '')
                    .subscribe((returnData: any) => {
                        this.NetRightsAdd = this._loginService.returnRights('Modify', returnData, this._loginService.getLogin()[0].ROLETYPE);

                        if (this.NetRightsAdd == false) {
                            this.NetRightsAdd = this._loginService.returnRights('Add', returnData, this._loginService.getLogin()[0].ROLETYPE);
                        }
                       this.hdNetRights = (this.NetRightsAdd == true) ? true : false;

                    });

               // this._loaderService.display(true);
                this.Resetchildrcrdpageload();
                verifyData = data.Table;
                this.setDropDownData(this._sharedconsig.exportEditData.MAWBNO, this._sharedconsig.exportEditData.EXPTNO);
                this.setData(this._sharedconsig.exportEditData.MAWBNO, this._loginService.getLogin()[0].CMP_USERENCCODE, this._sharedconsig.exportEditData.EXPTNO,this._loginService.getLogin()[0].CMPID,this._loginService.getLogin()[0].GUID);

            });

    }

    tarCheck(num: number) {
        this.TariffRate = num;
        this.NetRate = num;
        //FSC
        this.TarFscPayOn = null;
        this.TarFscRate = "";
        this.TarFsc = "";
        //IRC
        this.TarIrcPayOn = null;
        this.TarIrcRate = "";
        this.TarIrc = "";
        //XRAY
        this.TarXrayPayOn = null;
        this.TarXrayRate = "";
        this.TarXray = "";

    }

    netCheck(num: number) {
        this.NetRate = num;
        this.TariffRate = num;
        //FSC
        this.NetFscPayOn = null;
        this.NetFscRate = "";
        this.NetFsc = "";
        //IRC
        this.NetIrcPayOn = null;
        this.NetIrcRate = "";
        this.NetIrc = "";
        //XRAY
        this.NetXrayPayOn = null;
        this.NetXrayRate = "";
        this.NetXray = "";
    }

    calOneTarCheck(num: number) {
        this.CalOneDcTar = num;
    }

    calOneNetCheck(num: number) {
        this.CalOneDcNet = num;
    }

    calTwoTarCheck(num: number) {
        this.CalTwoDcTar = num;
    }

    calTwoNetCheck(num: number) {
        this.CalTwoDcNet = num;
    }

    changeFreight(typ) {
        this.FreightRate = typ;
    }

    fn_PageLoad() {
        let CWt = this.UserWgt;
        let GWt = this.UserGrossWeight;

        if (Math.abs(CWt) < 151) // || Math.abs(GWt) < 151)---LAST CHANGES
        {
            this.fn_Load_150_check();
        }
        else {
            this.HawbTar = "150.00";
            this.PcaTar = "250.00";
            this.fn_MC_CTG_Tar();
            this.fn_THC_Tar();
            this.fn_ChangeChareableAsTar();
            if (this.hdNetRights == true) {
                this.HawbNet = "150.00";
                this.PcaNet = "250.00";
                // this.HawbNet = true;
                // this.PcaNet = false;
                this.fn_MC_CTG_Net();
                this.fn_THC_Net();
                this.fn_ChangeChareableAsNet();
            }
        }
    }

    fn_Load_150_check() {
        // this.TarFreightRate = "";
        // this.TarFscRate = "";
        // this.TarIrcRate = "";
        // this.TarXrayRate = "";
        // this.TarMcRate = "";
        // this.TarCtgRate = "";
        // this.TarThcRate = "";
        // this.TarBPRate = "";

        this.fn_THC_Tar();
        this.fn_ChangeChareableAsTar();

        if (this.hdNetRights == true) {
            // this.NetFreightRate = "";
            // this.NetFscRate = "";
            // this.NetIrcRate = "";
            // this.NetXrayRate = "";
            // this.NetMcRate = "";
            // this.NetCtgRate = "";
            // this.NetThcRate = "";
            this.fn_THC_Net();
            this.fn_ChangeChareableAsNet();
        }
    }
    GetChrgType(chrgid,chrgindex)  {
        //for (let i = 0; i < this.dtAirLineCharges.length; i++) {
            //this.ChrgTypelistold = this.AllChrgTypelist.filter((code: any) => code.DataValueField === chrgid);
           // this.ChrgTypelist[chrgindex] =this.AllChrgTypelist.filter((code: any) => code.DataValueField === chrgid);

    //console.log(this.AllChrgTypelist.filter((code: any) => code.DataValueField === chrgid.split("|")[0]));
       // }
    }
    AddMAWBALCharges()
       {
        if(this.CHARGETYPE=='' || this.CHARGETYPE==undefined)
        {
            alert("Please select Charge Type.")
            return false;
        }
        if(this.CHARGENAME=='' || this.CHARGENAME==undefined)
        {
            alert("Please select Charge. ")
            return false;
        }
        if(this.RATE_TAR==null)
        {
            alert("Please enter Tariff Rate. ")
            return false;
        }
        if(this.RATE_TAR_FRT=='')
        {
            alert("Please enter Tariff Rate Freight. ")
            return false;
        }
        if(this.PK_ID=="0"){
        if (this.Chargeslist.length > "0") {
            let chrgnm: any = []
            chrgnm = this.Chargeslist.filter((code: any) => code.FK_CHARGEID === parseInt(this.CHARGENAME.split("|")[0]))
            if (chrgnm.length > "0") {
                this._toasterService.toast('warning', 'warning', 'Same Charge already Exists!');
                return false;
            }
            }
        }
        const jsonchild= {PK_ID:this.PK_ID,
        FKID:this.FK_ID,
        CHRGDETAILSID:this.CHRGDETAILSID,
        MAWBNO:this._sharedconsig.exportEditData.MAWBNO,
        FK_CHARGEID:this.CHARGENAME.split("|")[0] ,
        CHARGETYPE:this.CHARGETYPE,
        RATE_TAR:this.RATE_TAR,
        RATE_TAR_FRT:this.RATE_TAR_FRT,
        RATE_NET:this.RATE_NET,
        RATE_NET_FRT:this.RATE_NET_FRT,
        MAKERID:this._loginService.getLogin()[0].CMPID,
        VGUID:this._loginService.getLogin()[0].GUID,
        }
       this._dataService.Common("Export/EXPT_MAWB_PRINT_RATE_AIRLINE_CHARGES_TMPIU", jsonchild)
           .subscribe((data: any) => {
           if (data.Table[0].STATUS == "100") {
                   this.Chargeslist=data.Table1;
                   this.dttable6=data.Table6;
                   if(this.EDIT_CHARGETYPE != undefined){
                    this.fn_CalculateAlCharges_Tar(data.Table6);
                      }
                   else
                {
                    this.fn_CalculateAlCharges_Add(data.Table6);
                }

                   //this.fn_CalculateAlCharges_Net(data.Table6)
                   this.tot_rate_tar_pp_da=data.Table2[0].RATE_TAR_TOTAL_PP_DA;
                   this.tot_rate_net_pp_da=data.Table2[0].RATE_NET_TOTAL_PP_DA;
                   this.tot_rate_tar_cc_da=data.Table3[0].RATE_TAR_TOTAL_CC_DA;
                   this.tot_rate_net_cc_da=data.Table3[0].RATE_NET_TOTAL_CC_DA;
                   this.tot_rate_tar_pp_dc=data.Table4[0].RATE_TAR_TOTAL_PP_DC;
                   this.tot_rate_net_pp_dc=data.Table4[0].RATE_NET_TOTAL_PP_DC;
                   this.tot_rate_tar_cc_dc=data.Table5[0].RATE_TAR_TOTAL_CC_DC;
                   this.tot_rate_net_cc_dc=data.Table5[0].RATE_NET_TOTAL_CC_DC;
                   this.Resetchildrcrd();
                //    this.loaderService.display(false);
               }
           else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT);
                      // this.loaderService.display(false);
               }
           });
    }
    ResetMAWBCharges(){
        this.CHARGETYPE=""
        this.CHARGENAME=""
        this.RATE_TAR=""
     //  this.RATE_TAR_FRT=""
        this.RATE_NET=""
        //this.RATE_NET_FRT=""
    }
    fn_CalculateAlCharges_Add(dtbl){
        if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='PP')
        {
         this.DueAgentNet=Math.abs(this.DueAgentNet)  + Math.abs(dtbl[0].RATE_NET);
         this.TotalNet=Math.abs(this.TotalNet) +  Math.abs(dtbl[0].RATE_NET);
         this.DueAgentTar=Math.abs(this.DueAgentTar)  + Math.abs(dtbl[0].RATE_TAR);
         this.TotalTar=Math.abs(this.TotalTar)  +  Math.abs(dtbl[0].RATE_TAR);
        }
        if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='CC')
        {
         this.DueAgentNetCC=Math.abs(this.DueAgentNetCC)  + Math.abs(dtbl[0].RATE_NET);
         this.TotalNet=Math.abs(this.TotalNet)  +  Math.abs(dtbl[0].RATE_NET);
         this.DueAgentTarCC=Math.abs(this.DueAgentTarCC)  + Math.abs(dtbl[0].RATE_TAR);
         this.TotalTar=Math.abs(this.TotalTar)  +  Math.abs(dtbl[0].RATE_TAR);
        }
        if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='PP')
        {
         this.DurCarrierNet=Math.abs(this.DurCarrierNet) + Math.abs(dtbl[0].RATE_NET);
         this.TotalNet=Math.abs(this.TotalNet)  +  Math.abs(dtbl[0].RATE_NET);
         this.DurCarrierTar=Math.abs(this.DurCarrierTar)  + Math.abs(dtbl[0].RATE_TAR);
         this.TotalTar=Math.abs(this.TotalTar)+ Math.abs(dtbl[0].RATE_TAR);
        }
        if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='CC')
        {
         this.DurCarrierNetCC=Math.abs(this.DurCarrierNetCC)+ Math.abs(dtbl[0].RATE_NET);
         this.TotalNet=Math.abs(this.TotalNet) +  Math.abs(dtbl[0].RATE_NET);
         this.DurCarrierTarCC=Math.abs(this.DurCarrierTarCC)  + Math.abs(dtbl[0].RATE_TAR);
         this.TotalTar=Math.abs(this.TotalTar) +  Math.abs(dtbl[0].RATE_TAR);
         }
    }
    fn_CalculateAlCharges_Net(dtbl){
        if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='PP')
        {
         this.DueAgentNet=(Math.abs(this.DueAgentNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
         this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET) ) +  Math.abs(dtbl[0].RATE_NET);
        }
        if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='CC')
        {
         this.DueAgentNetCC=(Math.abs(this.DueAgentNetCC) - Math.abs(this.EDIT_RATE_NET))  + Math.abs(dtbl[0].RATE_NET);
         this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(dtbl[0].RATE_NET);
        }
        if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='PP')
        {
         this.DurCarrierNet=(Math.abs(this.DurCarrierNet) -Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
         this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(dtbl[0].RATE_NET);
        }
        if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='CC')
        {
         this.DurCarrierNetCC=Math.abs(this.DurCarrierNetCC)+ Math.abs(dtbl[0].RATE_NET);
         this.TotalNet=Math.abs(this.TotalNet) +  Math.abs(dtbl[0].RATE_NET);

         }
    }
    fn_CalculateAlCharges_Tar(dtbl){
        if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='PP' &&  this.EDIT_CHARGETYPE=='DA')
        {
         this.DueAgentTar=(Math.abs(this.DueAgentTar) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
         this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR)) +  Math.abs(dtbl[0].RATE_TAR);
         this.DueAgentNet=(Math.abs(this.DueAgentNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
         this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET) ) +  Math.abs(dtbl[0].RATE_NET);
        }
        if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='CC' &&  this.EDIT_CHARGETYPE=='DA')
        {
         this.DueAgentTarCC=(Math.abs(this.DueAgentTarCC) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
         this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR)) +  Math.abs(dtbl[0].RATE_TAR);
         this.DueAgentNetCC=(Math.abs(this.DueAgentNetCC) - Math.abs(this.EDIT_RATE_NET))  + Math.abs(dtbl[0].RATE_NET);
         this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(dtbl[0].RATE_NET);
        }
        if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='CC' &&  this.EDIT_CHARGETYPE=='DC')
        {
         this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC) - Math.abs(this.EDIT_RATE_TAR));
         this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC) - Math.abs(this.EDIT_RATE_TAR)) ;
         this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_NET));
         this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) ;
         this.DueAgentNetCC=Math.abs(this.DueAgentNetCC)  + Math.abs(dtbl[0].RATE_NET);
         this.TotalNet=Math.abs(this.TotalNet)  +  Math.abs(dtbl[0].RATE_NET);
         this.DueAgentTarCC=Math.abs(this.DueAgentTarCC)  + Math.abs(dtbl[0].RATE_TAR);
         this.TotalTar=Math.abs(this.TotalTar)  +  Math.abs(dtbl[0].RATE_TAR);
        }
        if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='PP' &&  this.EDIT_CHARGETYPE=='DC')
        {
        this.DueAgentTar=Math.abs(this.DueAgentTar)  + Math.abs(dtbl[0].RATE_TAR);
        this.TotalTar=Math.abs(this.TotalTar)  +  Math.abs(dtbl[0].RATE_TAR);
        this.DueAgentNet=Math.abs(this.DueAgentNet)  + Math.abs(dtbl[0].RATE_NET);
        this.TotalNet=Math.abs(this.TotalNet) +  Math.abs(dtbl[0].RATE_NET);
        this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC) - Math.abs(this.EDIT_RATE_TAR));
        this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC) - Math.abs(this.EDIT_RATE_NET)) ;
        this.TotalTar=(Math.abs(this.TotalTar) + Math.abs(this.EDIT_RATE_TAR));
        this.TotalNet=(Math.abs(this.TotalNet) + Math.abs(this.EDIT_RATE_NET)) ;
        }
        if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='PP' &&  this.EDIT_CHARGETYPE=='DC')
        {
         this.DurCarrierTar=(Math.abs(this.DurCarrierTar) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
         this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR)) +  Math.abs(dtbl[0].RATE_TAR);
         this.DurCarrierNet=(Math.abs(this.DurCarrierNet) -Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
         this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(dtbl[0].RATE_NET);
        }
        if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='CC' &&  this.EDIT_CHARGETYPE=='DC')
        {
         this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
         this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR))  +  Math.abs(dtbl[0].RATE_TAR);
         this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC)- Math.abs(this.EDIT_RATE_TAR))  +  Math.abs(dtbl[0].RATE_TAR);
         this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_TAR))  +  Math.abs(dtbl[0].RATE_TAR);
        }
        if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='CC' &&  this.EDIT_CHARGETYPE=='DA')
        {
        this.DueAgentNetCC=(Math.abs(this.DueAgentNetCC)  - Math.abs(this.EDIT_RATE_NET));
        this.TotalNet=(Math.abs(this.TotalNet)  - Math.abs(this.EDIT_RATE_NET));
        this.DueAgentTarCC=(Math.abs(this.DueAgentTarCC)  - Math.abs(this.EDIT_RATE_TAR));
        this.TotalTar=(Math.abs(this.TotalTar)  - Math.abs(this.EDIT_RATE_TAR));
        this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC)  +Math.abs(dtbl[0].RATE_TAR));
        this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC) + Math.abs(dtbl[0].RATE_NET));
        this.TotalTar=(Math.abs(this.TotalTar) + Math.abs(dtbl[0].RATE_TAR));
        this.TotalNet=(Math.abs(this.TotalNet)  + Math.abs(dtbl[0].RATE_NET));
        }
        if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='PP' &&  this.EDIT_CHARGETYPE=='DA')
        {
        this.DueAgentNet=(Math.abs(this.DueAgentNet)  - Math.abs(this.EDIT_RATE_NET));
        this.TotalNet=(Math.abs(this.TotalNet)  - Math.abs(this.EDIT_RATE_NET));
        this.DueAgentTar=(Math.abs(this.DueAgentTar)  - Math.abs(this.EDIT_RATE_TAR));
        this.TotalTar=(Math.abs(this.TotalTar)  - Math.abs(this.EDIT_RATE_TAR));
        this.DurCarrierTar=(Math.abs(this.DurCarrierTar)  +Math.abs(dtbl[0].RATE_TAR));
        this.DurCarrierNet=(Math.abs(this.DurCarrierNet) + Math.abs(dtbl[0].RATE_NET));
        this.TotalTar=(Math.abs(this.TotalTar) + Math.abs(dtbl[0].RATE_TAR));
        this.TotalNet=(Math.abs(this.TotalNet)  + Math.abs(dtbl[0].RATE_NET));
        }
    }
    Resetchildrcrd(){
        this.CHARGETYPE=undefined;
        this.CHARGENAME="";
        this.RATE_TAR="";
        this.RATE_TAR_FRT="";
        this.RATE_NET="";
        this.RATE_NET_FRT="";
        this.txtchild="Add";
        this.CHRGDETAILSID="0";
        this.PK_ID="0";
        this.FK_ID="0";
        this.EDIT_CHARGETYPE=undefined;

    }
    Resetchildrcrdpageload(){
        this.CHARGETYPE=undefined;
        this.CHARGENAME="";
        this.RATE_TAR="";
        this.RATE_NET="";
        this.txtchild="Add";
        this.CHRGDETAILSID="0";
        this.PK_ID="0";
        this.FK_ID="0";
        this.EDIT_CHARGETYPE=undefined;

    }
    Editchildrecd(id) {
        let filterData = this.Chargeslist.filter((filter) => filter.PK_ID == id)[0];
        //this.fk=filterData.ID;
        this.PK_ID=filterData.PK_ID,
        this.FK_ID=filterData.FK_ID,
        this.CHARGETYPE=filterData.CHARGETYPE;
        this.CHRGDETAILSID=filterData.FK_CHRGDETAILSID;
        this.AirLineCharges =this.AllAirLineChargeslist.filter((code: any) => code.DataValueField.split("|")[1] === this.CHARGETYPE);
        this.CHARGENAME=filterData.FK_CHARGEID + '|' + filterData.CHARGETYPE;
        this.RATE_TAR=filterData.RATE_TAR;
        this.RATE_TAR_FRT=filterData.RATE_TAR_FRT;
        this.RATE_NET=filterData.RATE_NET;
        this.RATE_NET_FRT=filterData.RATE_NET_FRT;
        this.EDIT_RATE_TAR=filterData.RATE_TAR;
        this.EDIT_RATE_NET=filterData.RATE_NET;
        this.EDIT_CHARGETYPE=filterData.CHARGETYPE;
        this.txtchild="Update";
        }

        deletechildrecd(id,chrgdtlsid){

                if(confirm('Are you sure want to delete the record ?')) {
                    this._loaderService.display(true);
                    const jsondelete = { ID  : id,VGUID :this._loginService.getLogin()[0].GUID,FK_CHRGDTLSID:chrgdtlsid}
                    this._dataService.getData("Export/EXPT_MAWB_PRINT_RATE_AIRLINE_CHARGES_TMP_DEL", jsondelete)
                        .subscribe((data: any) => {

                            if (data.Table[0].STATUS== "100") {
                                this.Chargeslist=data.Table
                                this.DELCHARGETYPE=data.Table1[0].CHARGETYPE;
                                this.DEL_RATE_TAR=data.Table1[0].RATE_TAR;
                                this.DEL_RATE_TAR_FRT=data.Table1[0].RATE_TAR_FRT;
                                this.DEL_RATE_NET=data.Table1[0].RATE_NET;
                                this.DEL_RATE_NET_FRT=data.Table1[0].RATE_NET_FRT;
                                if(this.DELCHARGETYPE=='DA' && this.DEL_RATE_TAR_FRT=='PP')
                                {
                                 this.DueAgentTar=(Math.abs(this.DueAgentTar) - Math.abs(this.DEL_RATE_TAR)) ;
                                 this.DueAgentNet=(Math.abs(this.DueAgentNet) - Math.abs(this.DEL_RATE_NET)) ;
                                 this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR)) ;
                                 this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET)) ;
                                }

                                if(this.DELCHARGETYPE=='DA' && this.DEL_RATE_TAR_FRT=='CC')
                                {
                                 this.DueAgentTarCC=(Math.abs(this.DueAgentTarCC) - Math.abs(this.DEL_RATE_TAR)) ;
                                 this.DueAgentNetCC=(Math.abs(this.DueAgentNetCC) - Math.abs(this.DEL_RATE_NET)) ;
                                 this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR)) ;
                                 this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET));
                                }
                                if(this.DELCHARGETYPE=='DC' && this.DEL_RATE_TAR_FRT=='PP')
                                {
                                 this.DurCarrierTar=(Math.abs(this.DurCarrierTar) - Math.abs(this.DEL_RATE_TAR));
                                 this.DurCarrierNet=(Math.abs(this.DurCarrierNet) -Math.abs(this.DEL_RATE_NET));
                                 this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR));
                                 this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET));
                                }
                                if(this.DELCHARGETYPE=='DC' && this.DEL_RATE_TAR_FRT=='CC')
                                {
                                 this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC) - Math.abs(this.DEL_RATE_TAR));
                                 this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC) - Math.abs(this.DEL_RATE_NET));
                                 this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR)) ;
                                 this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET)) ;
                                }
                                this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT );
                                this._loaderService.display(false);
                                }
                                else {
                                this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT);
                                this._loaderService.display(false);
                                }


                        });
                }
                else{return false;
                    this._loaderService.display(false); }
            }

    GetChrges(chrgtype)
    {
        this.AirLineCharges =this.AllAirLineChargeslist.filter((code: any) => code.DataValueField.split("|")[1] === chrgtype);
    }
    changeNetRate(rate1) {
        this.RATE_NET=rate1;
       }
    changeNetFreight(frt1) {
        this.RATE_NET_FRT=frt1
       }
    fn_ChangeChareableAsTar() {

        if (this.TariffRate == 1) {
            this.TarFscPayOn = null;
            this.TarFscRate = "";
            this.TarIrcPayOn = null;
            this.TarIrcRate = "";
            this.TarXrayPayOn = null;
            this.TarXrayRate = "";
            this.TarFsc = "";
            this.TarIrc = "";
            this.TarXray = "";
        }
        else {
            let CWt = this.UserWgt;
            let GWt = this.UserGrossWeight;
            if (Math.abs(CWt) < 151) // || Math.abs(GWt) < 151)---LAST CHANGES
            {


            }
            else {

            }
        }
        this.fnCalculate_Tar();
    }
    fn_ChangeChareableAsNet() {
        let CWt = this.UserWgt;
        let GWt = this.UserGrossWeight;
        if (this.NetRate == 1) {
            this.NetFscPayOn = null;
            this.NetFscRate = "";
            this.NetIrcPayOn = null;
            this.NetIrcRate = "";
            this.NetXrayPayOn = null;
            this.NetXrayRate = "";
            this.NetFsc = "";
            this.NetIrc = "";
            this.NetXray = "";
        }
        else {
            CWt = this.UserWgt
            GWt = this.UserGrossWeight
            if (Math.abs(CWt) < 151) // || Math.abs(GWt) < 151)---LAST CHANGES
            {

            }
            else {

            }
        }
        this.fnCalculate_Net()
    }

    setDropDownData(mawbno, exptno) {
        const _jsonData = {
            Type1: mawbno.substring(0, 3),
            Type2: exptno.substring(2, 5)
        };
        this._loaderService.display(true);
        this.exptno=exptno;
        this._dataService.Common("Export/ConsignmentMAWBFill_DROPDOWN", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.netData = data.Table;
                this.tdsData = data.Table1;
                this.serviceTax = data.Table2;
              //this.AirLineCharges=data.Table3;
                this.AllAirLineChargeslist=data.Table3
                this.ChrgTypelist=data.Table4;
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

    setData(mawbno, code, exptno,makerid,guid) {
        this.makerid=makerid;
        this.guid=guid;
        this._loaderService.display(true);
        const _jsonData = {
            Type1: mawbno,
            Type2: code,
            Type3: exptno.substring(2, 5),
            GUID:this._loginService.getLogin()[0].GUID,
             CmpId: this._loginService.getLogin()[0].CMPID,
             RoleType: this._loginService.getLogin()[0].ROLETYPE,
             CodeCity: this._loginService.getLogin()[0].CMPCODE + '' + this._loginService.getLogin()[0].CITYCODE1,

        };

        this._dataService.Common("Export/Consignment_MAWB_PP_CC_View", _jsonData)
            .subscribe((data: any) => {

                this.CityCode = data.Table1[0].CITYCODE;
                this.Wgt = data.Table1[0].CHRGWT;
                this.UserWgt = data.Table1[0].CHBL_WGT_USER;
                this.oldchblwt=this.UserWgt;
                this.GrossWeight = data.Table1[0].GROSSWT;
                this.oldgrwt=this.GrossWeight;
                this.UserGrossWeight = data.Table1[0].GROSS_WGT_USER;
                this.isMinRate = (data.Table1[0].ISMIN == 'Y') ? true : false;
                this.FreightRate = (data.Table1[0].FREIGHT != '') ? data.Table1[0].FREIGHT : null;
                this.SupplierNet = (data.Table1[0].SUPPLIER_NET != '') ? data.Table1[0].SUPPLIER_NET : null;
                this.AgentsRate = (data.Table1[0].AGENTS_RATE != '') ? data.Table1[0].AGENTS_RATE : 0.00;
                this.TariffRate = (data.Table1[0].FRT_CHARGEABLE_AS_TAR == 'FS') ? 2 : 1;
                this.NetRate = (data.Table1[0].FRT_CHARGEABLE_AS_NET == 'FS') ? 2 : 1;


                //FREIGHT (BASIC)
                this.TarFreightPayOn = (data.Table1[0].FRT_PAYABLE_ON_TAR != '') ? data.Table1[0].FRT_PAYABLE_ON_TAR : 'CW';
                this.TarFreightRate = data.Table1[0].FRT_RATE_PER_KG_TAR;
                this.TarFreight = data.Table1[0].FRT_RATE_TAR;
                this.NetFreightPayOn = (data.Table1[0].FRT_PAYABLE_ON_NET != '') ? data.Table1[0].FRT_PAYABLE_ON_NET : 'CW';
                this.NetFreightRate = data.Table1[0].FRT_RATE_PER_KG_NET;
                this.NetFreight = data.Table1[0].FRT_RATE_NET;
                //FSC
                this.TarFscPayOn = (data.Table1[0].FSC_PAYABLE_ON_TAR != '') ? data.Table1[0].FSC_PAYABLE_ON_TAR : null;
                this.TarFscRate = data.Table1[0].FSC_RATE_PER_KG_TAR;
                this.TarFsc = data.Table1[0].FSC_RATE_TAR;
                this.NetFscPayOn = (data.Table1[0].FSC_PAYABLE_ON_NET != '') ? data.Table1[0].FSC_PAYABLE_ON_NET : null;
                this.NetFscRate = data.Table1[0].FSC_RATE_PER_KG_NET;
                this.NetFsc = data.Table1[0].FSC_RATE_NET;
                //IRC
                this.TarIrcPayOn = (data.Table1[0].IRC_PAYABLE_ON_TAR != '') ? data.Table1[0].IRC_PAYABLE_ON_TAR : null;
                this.TarIrcRate = data.Table1[0].IRC_RATE_PER_KG_TAR;
                this.TarIrc = data.Table1[0].IRC_RATE_TAR;
                this.NetIrcPayOn = (data.Table1[0].IRC_PAYABLE_ON_NET != '') ? data.Table1[0].IRC_PAYABLE_ON_NET : null;
                this.NetIrcRate = data.Table1[0].IRC_RATE_PER_KG_NET;
                this.NetIrc = data.Table1[0].IRC_RATE_NET;
                //XRAY
                this.TarXrayPayOn = (data.Table1[0].XRAY_PAYABLE_ON_TAR != '') ? data.Table1[0].XRAY_PAYABLE_ON_TAR : null;
                this.TarXrayRate = data.Table1[0].XRAY_RATE_PER_KG_TAR;
                this.TarXray = data.Table1[0].XRAY_RATE_TAR;
                this.NetXrayPayOn = (data.Table1[0].XRAY_PAYABLE_ON_NET != '') ? data.Table1[0].XRAY_PAYABLE_ON_NET : null;
                this.NetXrayRate = data.Table1[0].XRAY_RATE_PER_KG_NET;
                this.NetXray = data.Table1[0].XRAY_RATE_NET;
                //MISCELLANEOUS CHARGES
                this.TarMcPayOn = (data.Table1[0].MC_PAYABLE_ON_TAR != '') ? data.Table1[0].MC_PAYABLE_ON_TAR : null;
                this.TarMcRate = data.Table1[0].MC_RATE_PER_KG_TAR;
                this.TarMc = data.Table1[0].MC_RATE_TAR;
                this.NetMcPayOn = (data.Table1[0].MC_PAYABLE_ON_NET != '') ? data.Table1[0].MC_PAYABLE_ON_NET : null;
                this.NetMcRate = data.Table1[0].MC_RATE_PER_KG_NET;
                this.NetMc = data.Table1[0].MC_RATE_NET;
                //CTG
                this.TarCtgPayOn = (data.Table1[0].CTG_PAYABLE_ON_TAR != '') ? data.Table1[0].CTG_PAYABLE_ON_TAR : 'CW';
                this.TarCtgRate = data.Table1[0].CTG_RATE_PER_KG_TAR;
                this.TarCtg = data.Table1[0].CTG_RATE_TAR;
                this.NetCtgPayOn = (data.Table1[0].CTG_PAYABLE_ON_NET != '') ? data.Table1[0].CTG_PAYABLE_ON_NET : 'CW';
                this.NetCtgRate = data.Table1[0].CTG_RATE_PER_KG_NET;
                this.NetCtg = data.Table1[0].CTG_RATE_NET;
                //THC
                this.TarThcPayOn = (data.Table1[0].THC_PAYABLE_ON_TAR != '') ? data.Table1[0].THC_PAYABLE_ON_TAR : 'CW';
                this.TarThcRate = data.Table1[0].THC_RATE_PER_KG_TAR;
                this.TarThc = data.Table1[0].THC_RATE_TAR;
                this.NetThcPayOn = (data.Table1[0].THC_PAYABLE_ON_NET != '') ? data.Table1[0].THC_PAYABLE_ON_NET : 'CW';
                this.NetThcRate = data.Table1[0].THC_RATE_PER_KG_NET;
                this.NetThc = data.Table1[0].THC_RATE_NET;
                //BUSINESS PROMOTION
                this.TarBPPayOn = (data.Table1[0].BP_PAYABLE_ON_TAR != '') ? data.Table1[0].BP_PAYABLE_ON_TAR : null;
                this.TarBPRate = data.Table1[0].BP_RATE_PER_KG_TAR;
                this.TarBP = data.Table1[0].BP_RATE_TAR;
                this.NetBPPayOn = (data.Table1[0].BP_PAYABLE_ON_NET != '') ? data.Table1[0].BP_PAYABLE_ON_NET : null;
                this.NetBPRate = data.Table1[0].BP_RATE_PER_KG_NET;
                this.NetBP = data.Table1[0].BP_RATE_NET;

                // if (this.UserWgt > 151) {
                //     this.tarCheck(this.TariffRate);
                //     this.tarCheck(this.NetRate);
                // }

                this.TarAms = data.Table1[0].AMS_RATE_TAR;
                this.TarAmsFrt = (data.Table1[0].AMS_RATE_TAR_FRT) ? data.Table1[0].AMS_RATE_TAR_FRT : null;
                this.NetAms = data.Table1[0].AMS_RATE_NET;
                this.NetAmsFrt = (data.Table1[0].AMS_RATE_NET_FRT) ? data.Table1[0].AMS_RATE_NET_FRT : null;

                this.HawbTar = data.Table1[0].HAWB_TAR;
                if (data.Table1[0].HAWB_RATE_TAR_FRT !="")
               { this.HawbTarFrt = data.Table1[0].HAWB_RATE_TAR_FRT;}
                this.HawbNet = data.Table1[0].HAWB_NET;
                if(data.Table1[0].HAWB_RATE_NET_FRT !="")
                {this.HawbNetFrt = data.Table1[0].HAWB_RATE_NET_FRT;}

                this.PcaTar = data.Table1[0].PCA_TAR;
                if (data.Table1[0].PCA_RATE_TAR_FRT!="")
                {this.PcaTarFrt = data.Table1[0].PCA_RATE_TAR_FRT;}
                this.PcaNet = data.Table1[0].PCA_NET;
                if(data.Table1[0].PCA_RATE_NET_FRT !="")
                {this.PcaNetFrt = data.Table1[0].PCA_RATE_NET_FRT;}

                this.DurCarrierTar = data.Table1[0].DUE_CARRIER_TAR;
                this.DurCarrierTarCC = data.Table1[0].DUE_CARRIER_TAR_CC;
                this.DurCarrierNet = data.Table1[0].DUE_CARRIER_NET;
                this.DurCarrierNetCC = data.Table1[0].DUE_CARRIER_NET_CC;

                this.DueAgentTar = data.Table1[0].DUE_AGENT_TAR;
                this.DueAgentTarCC = data.Table1[0].DUE_AGENT_TAR_CC;
                this.DueAgentNet = data.Table1[0].DUE_AGENT_NET;
                this.DueAgentNetCC = data.Table1[0].DUE_AGENT_NET_CC;

                this.TotalTar = data.Table1[0].TOTAL_TAR;
                this.TotalTarCC = data.Table1[0].TOTAL_TAR_CC;
                this.TotalNet = data.Table1[0].TOTAL_NET;
                this.TotalNetCC = data.Table1[0].TOTAL_NET_CC;
                this.OtherTar = data.Table1[0].OTHER_CHRG_TAR;
                this.OtherTarFrt = (data.Table1[0].OTHER_RATE_TAR_FRT != '') ? data.Table1[0].OTHER_RATE_TAR_FRT : 'PP';
                this.OtherNet = data.Table1[0].OTHER_CHRG_NET;
                this.OtherNetFrt = (data.Table1[0].OTHER_RATE_NET_FRT != '') ? data.Table1[0].OTHER_RATE_NET_FRT : 'PP';
                this.AirFrtCommission = data.Table1[0].AIR_FRT_COMM_NET;
                this.FrtRebate = data.Table1[0].FRT_REBATE_NET;
                this.BusinesPromo = data.Table1[0].BUSINES_PROMO_NET;
                this.DrpTDS = data.Table1[0].TDS_ACCTCODE;
                this.TxtTDS = data.Table1[0].TDS_NET;
                this.DrpServiceTax = data.Table1[0].SERVICETAX_ACCTCODE;
                this.TxtServiceTax = data.Table1[0].SERVICE_TAX_NET;
                this.OtherChrg1 = data.Table1[0].OTHER_NAME1;
                this.OtherAmt1_Tar = data.Table1[0].OTHER_RATE1_TAR;
                this.CalOneDcTar = (data.Table1[0].OTHER_RATE1_TAR_CAL == 'DA') ? 2 : 1;
                this.OtherAmt1TarFrt = (data.Table1[0].OTHER_RATE1_TAR_FRT != '') ? data.Table1[0].OTHER_RATE1_TAR_FRT : 'PP';
                this.OtherAmt1_Net = data.Table1[0].OTHER_RATE1_NET;
                this.CalOneDcNet = (data.Table1[0].OTHER_RATE1_NET_CAL == 'DA') ? 2 : 1;
                this.OtherAmt1NetFrt = (data.Table1[0].OTHER_RATE1_NET_FRT != '') ? data.Table1[0].OTHER_RATE1_NET_FRT : 'PP';
                this.OtherChrg2 = data.Table1[0].OTHER_NAME2;
                this.OtherAmt2_Tar = data.Table1[0].OTHER_RATE2_TAR;
                this.CalTwoDcTar = (data.Table1[0].OTHER_RATE2_TAR_CAL == 'DA') ? 2 : 1;
                this.OtherAmt2TarFrt = (data.Table1[0].OTHER_RATE2_TAR_FRT != '') ? data.Table1[0].OTHER_RATE2_TAR_FRT : 'PP';
                this.OtherAmt2_Net = data.Table1[0].OTHER_RATE2_NET;
                this.CalTwoDcNet = (data.Table1[0].OTHER_RATE2_NET_CAL == 'DA') ? 2 : 1;
                this.OtherAmt2NetFrt = (data.Table1[0].OTHER_RATE2_NET_FRT != '') ? data.Table1[0].OTHER_RATE2_NET_FRT : 'PP';
                this.Remark = data.Table1[0].REMARK;
                this.Ppchrg = data.Table1[0].PPCHRG;
                this.Ccchrg = data.Table1[0].CCCHRG;
                this.Pptotagt = data.Table1[0].PPTOTAGT;
                this.Cctotagt = data.Table1[0].CCTOTAGT;
                this.Pptotcarr = data.Table1[0].PPTOTCARR;
                this.Cctotcarr = data.Table1[0].CCTOTCARR;
                this.Pptot = data.Table1[0].PPTOT;
                this.Cctot = data.Table1[0].CCTOT;
                this.Othchrg = data.Table1[0].OTHCHRG;
                this.ISAUTO_FRT_INV=data.Table1[0].FRTINV_FLG;

                this.TarTruckPayOn = (data.Table1[0].DEST_TRUCKING_PAYABLE_ON_TAR != '') ? data.Table1[0].DEST_TRUCKING_PAYABLE_ON_TAR : null;
                this.TarTruckRate = data.Table1[0].DEST_TRUCKING_RATE_PER_KG_TAR;
                this.TarTruck = data.Table1[0].DEST_TRUCKING_RATE_TAR;
                this.NetTruckPayOn = (data.Table1[0].DEST_TRUCKING_PAYABLE_ON_NET != '') ? data.Table1[0].DEST_TRUCKING_PAYABLE_ON_NET : null;
                this.NetTruckRate = data.Table1[0].DEST_TRUCKING_RATE_PER_KG_NET;
                this.NetTruck = data.Table1[0].DEST_TRUCKING_RATE_NET;
              ///ADDED BY NALINI FOR AIRLINECHARGES
              this.Chargeslist=data.Table2
              this.tot_rate_tar_pp_da=data.Table3[0].RATE_TAR_TOTAL_PP_DA;
              this.tot_rate_net_pp_da=data.Table3[0].RATE_NET_TOTAL_PP_DA;
              this.tot_rate_tar_cc_da=data.Table4[0].RATE_TAR_TOTAL_CC_DA;
              this.tot_rate_net_cc_da=data.Table4[0].RATE_NET_TOTAL_CC_DA;
              this.tot_rate_tar_pp_dc=data.Table5[0].RATE_TAR_TOTAL_PP_DC;
              this.tot_rate_net_pp_dc=data.Table5[0].RATE_NET_TOTAL_PP_DC;
              this.tot_rate_tar_cc_dc=data.Table6[0].RATE_TAR_TOTAL_CC_DC;
              this.tot_rate_net_cc_dc=data.Table6[0].RATE_NET_TOTAL_CC_DC;
                this.fn_PageLoad();
                if(this.ISAUTO_FRT_INV=="1")
                {
                    alert("MAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This MAWB !!");
                    this._toasterService.toast('Warning', 'Warning', "MAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This MAWB !!");
                }
                this._loaderService.display(false);
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                 this._loaderService.display(false);},
                () => { });
    }

    changePayOnTariff(tarType: string) {
        if (tarType == 'Fsc') {
            this.TarFscRate = 0;
            this.TarFsc = 0;
        } else if (tarType == 'Irc') {
            this.TarIrcRate = 0;
            this.TarIrc = 0;
        } else if (tarType == 'Xray') {
            this.TarXrayRate = 0;
            this.TarXray = 0;
        } else if (tarType == 'BP') {
            this.TarBPRate = 0;
            this.TarBP = 0;
        }
        else if (tarType == 'DT') {
            this.TarTruckRate = 0;
            this.TarTruck = 0;
        }
        else if (tarType == 'Misc') {
            this.TarMcRate = 0;
            this.TarMc = 0;
        }
        else if (tarType == 'CTG') {
            this.TarCtgRate = 0;
            this.TarCtg = 0;
        }
        else if (tarType == 'THC') {
            this.TarThcRate = 0;
            this.TarThc = 0;
        }
        this.fnCalculate_Tar();
    }

    changePayOnNet(tarType: string) {
        if (tarType == 'Fsc') {
            this.NetFscRate = 0;
            this.NetFsc = 0;
        } else if (tarType == 'Irc') {
            this.NetIrcRate = 0;
            this.NetIrc = 0;
        } else if (tarType == 'Xray') {
            this.NetXrayRate = 0;
            this.NetXray = 0;
        } else if (tarType == 'Misc') {
            this.NetMcRate = 0;
            this.NetMc = 0;
        }else if (tarType == 'CTG') {
            this.NetCtgRate = 0;
            this.NetCtg = 0;
        }
        else if (tarType == 'THC') {
            this.NetThcRate = 0;
            this.NetThc = 0;
        }else if (tarType == 'BP') {
            this.NetBPRate = 0;
            this.NetBP = 0;
        }
        else if (tarType == 'DT') {
            this.NetTruckRate = 0;
            this.NetTruck = 0;
        }
        this.fnCalculate_Net();
    }
    selectionChange(value: any) {
        this.TarFreightRate=this.NetFreightRate = value.target.value;
      }
      XrayChange(value: any) {
          this.NetXrayRate = value.target.value;

       }
       XraypayChange(value: any) {
         this.NetXrayPayOn = value.target.value;
      }
      TariffRateChange(value: any) {
         this.NetFscRate = value.target.value;
      }
      TarFscPayOnChange(value: any) {
         this.NetFscPayOn = value.target.value;
      }
      TarIrcChange(value: any) {
         this.NetIrcRate = value.target.value;
      }
      TarIrcPayOnChange(value: any) {
         this.NetIrcPayOn = value.target.value;
      }
      TarMcPayOnChange(value: any) {
         this.NetMcPayOn = value.target.value;
      }
      TarMcRateChange(value: any) {
         this.NetMcRate = value.target.value;
      }
      TarCtgPayOnChange(value: any) {
         this.NetCtgPayOn = value.target.value;
      }
      TarCtgRateChange(value: any) {
         this.NetCtgRate = value.target.value;
      }
      TarThcPayOnChange(value: any) {
         this.NetThcPayOn = value.target.value;
      }
      TarThcRateChange(value: any) {
         this.NetThcRate = value.target.value;
      }
      TarBPPayOnChange(value: any) {
         this.NetBPPayOn = value.target.value;
      }
      TarBPRateChange(value: any) {
         this.NetBPRate = value.target.value;
      }
      TarAmsChange(value: any) {
         this.NetAms = value.target.value;
      }
      TarAmsFrtChange(value: any) {
         this.NetAmsFrt = value.target.value;
      }
      TarTruckPayOnChange(value: any) {
         this.NetTruckPayOn = value.target.value;
      }
      TarTruckRateChange(value: any) {
         this.NetTruckRate = value.target.value;
      }

    changeTariffRates(tarType: string) {
        if (tarType == 'Freight') {
            if (Math.abs(this.TarFreightRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarFreightPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarFreight = 0; }
            this.onChangeTariffRates('Freight');
        } else if (tarType == 'Fsc') {
            if (Math.abs(this.TarFscRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarFscPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarFsc = 0; }
            this.onChangeTariffRates('Fsc');
        } else if (tarType == 'Irc') {
            if (Math.abs(this.TarIrcRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarIrcPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarIrc = 0; }
            this.onChangeTariffRates('Irc');
        } else if (tarType == 'Xray') {
            if (Math.abs(this.TarXrayRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarXrayPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarXray = 0; }
            this.onChangeTariffRates('Xray');
        }
        else if (tarType == 'Misc') {
            if (Math.abs(this.TarMcRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarMcPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarMc = 0; }
            this.onChangeTariffRates('Misc');
        }
        else if (tarType == 'CTG') {
            if (Math.abs(this.TarCtgRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarCtgPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarCtg = 0; }
            this.onChangeTariffRates('CTG');
        }  else if (tarType == 'THC') {
            if (Math.abs(this.TarThcRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarThcPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarThc = 0; }
            this.onChangeTariffRates('THC');
        }else if (tarType == 'BP') {
            if (Math.abs(this.TarBPRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarBPPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarBP = 0; }
            this.onChangeTariffRates('BP');
        }
        else if (tarType == 'DT') {
            if (Math.abs(this.TarTruckRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarTruckPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarTruck = 0; }
            this.onChangeTariffRates('DT');
        }
        this.fnCalculate_Tar();
    }

    changeNetRates(tarType: string) {
        if (tarType == 'Freight') {
            if (Math.abs(this.NetFreightRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetFreightPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetFreight = 0; }
            this.onChangeNetRates('Freight');
        } else if (tarType == 'Fsc') {
            if (Math.abs(this.NetFscRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetFscPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetFsc = 0; }
            this.onChangeNetRates('Fsc');
        } else if (tarType == 'Irc') {
            if (Math.abs(this.NetIrcRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetIrcPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetIrc = 0; }
            this.onChangeNetRates('Irc');
        } else if (tarType == 'Xray') {
            if (Math.abs(this.NetXrayRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetXrayPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetXray = 0; }
            this.onChangeNetRates('Xray');
        }else if (tarType == 'Misc') {
            if (Math.abs(this.NetMcRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetMcPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetMc = 0; }
            this.onChangeNetRates('Misc');
        }else if (tarType == 'CTG') {
            if (Math.abs(this.NetCtgRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetCtgPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetCtg = 0; }
            this.onChangeNetRates('CTG');
        }else if (tarType == 'THC') {
            if (Math.abs(this.TarThcRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.TarThcPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarThc = 0; }
            this.onChangeNetRates('THC');
        }
         else if (tarType == 'BP') {
            if (Math.abs(this.NetBPRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetBPPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetBP = 0; }
            this.onChangeNetRates('BP');
        }
        else if (tarType == 'DT') {
            if (Math.abs(this.NetTruckRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetTruckPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetTruck = 0; }
            this.onChangeNetRates('DT');
        }
        this.fnCalculate_Net();
    }

    validateWeight() {
        let CHBLWT = Math.abs(this.UserWgt);
        let GRWT = Math.abs(this.UserGrossWeight);
        if (CHBLWT == 0) {
            alert("Please enter Chargeable Weight.");
            return false;
        }
        if (GRWT == 0) {
            alert("Please enter Gross Weight.");
            return false;
        }
        if (CHBLWT < GRWT) {
            alert("Chargable Wgt should be greater than or equal to Gross Weight.")
            return false;
        }
    }

    clearTariff() {
        this.TarFreightRate = "";
        this.TarFreight = "";
        this.TarFscPayOn = "0";
        this.TarFscRate = "";
        this.TarFsc = "";
        this.TarIrcPayOn = "0";
        this.TarIrcRate = "";
        this.TarIrc = "";
        this.TarXrayPayOn = "0";
        this.TarXrayRate = "";
        this.TarXray = "";
        this.TarMcRate = 1;
        let GRWT = Math.abs(this.UserGrossWeight);
        GRWT = Math.round(Math.abs(GRWT));
        GRWT = Math.abs(Number(GRWT.toFixed(2)));
        this.TarMc = GRWT;
        this.fn_MC_CTG_Tar();
        this.fn_THC_Tar();
    }

    clearNet() {
        this.NetFreightRate = null;
        this.NetFreight = null;
        this.NetFscPayOn = 0;
        this.NetFscRate = null;
        this.NetFsc = null;
        this.NetIrcPayOn = 0;
        this.NetIrcRate = null;
        this.NetIrc = null;
        this.NetXrayPayOn = 0;
        this.NetXrayRate = null;
        this.NetXray = null;
        this.NetMcRate = 1;
        this.NetMc = Math.abs(this.UserGrossWeight);
        this.fn_MC_CTG_Net();
        this.fn_THC_Net();
    }

    fn_MC_CTG_Tar() {
        let VALUE = 0;
        VALUE = Math.abs(this.UserWgt);
        VALUE = Math.round(Math.abs(VALUE))
        VALUE = (Math.abs(Number(VALUE.toFixed(2))));
        let Mawbno=this._sharedconsig.exportEditData.MAWBNO;
        let prestrg=Mawbno.substring(0,3);
        if (prestrg!="232" && this.CityCode != 'AMD' )
        {
            this.TarMcRate = 1;
            this.TarMc = VALUE;
        }
        if (prestrg!="232" && this.CityCode == 'AMD' )
        {
            this.TarMcRate = 1;
            this.TarMc = VALUE;
        }
        if (this.CityCode == 'MUM') {
            this.TarCtgRate = 1;
            VALUE = Math.abs(this.UserGrossWeight);
            VALUE = Math.round(Math.abs(VALUE));
            VALUE = (Math.abs(Number(VALUE.toFixed(2))));
            this.TarCtg = VALUE;
        }
        else {
            this.TarCtgRate = 0;
            this.TarCtg = 0;
        }
    }
    fn_THC_Tar() {
        let VALUE = 0;
        VALUE = Math.abs(this.UserWgt);
        VALUE = Math.round(Math.abs(VALUE));
        VALUE = (Math.abs(Number(VALUE.toFixed(2))));

        //THC CALCULATED ON CW * 0.08 AS PER ARJUN MAIL Tue 3/10/2015 1:41 PM

        this.TarThcRate = 0.08;
        this.TarThc = VALUE;

        if (this.CityCode == 'DAC') {
            this.TarThcRate = 0.08;
            VALUE = Math.abs(VALUE);
            let TOT = ((this.TarThcRate) * Math.abs(VALUE)).toFixed(2);
            this.TarThc = Math.abs(Number(TOT));
        }
        else {
            this.TarThcRate = 0;
            this.TarThc = 0;
        }
    }
    fn_MC_CTG_Net() {
        let VALUE = 0;
        if (this.hdNetRights == true) {
            VALUE = Math.abs(this.UserWgt);
            VALUE = Math.round(Math.abs(VALUE));
            VALUE = (Math.abs(Number(VALUE.toFixed(2))));
            let Mawbno=this._sharedconsig.exportEditData.MAWBNO;
            let prestrg=Mawbno.substring(0,3);
            if (prestrg !="232"   && this.CityCode != 'AMD')
            {   this.NetMcRate = 1;
                this.NetMc = VALUE;
            }
            if (prestrg !="232"   && this.CityCode == 'AMD')
            {   this.NetMcRate = 1;
                this.NetMc = VALUE;
            }
            if (this.CityCode == 'MUM') {
                this.NetCtgRate = 1;
                VALUE = Math.abs(this.UserGrossWeight);
                VALUE = Math.round(Math.abs(VALUE));
                VALUE = Math.abs(Number(VALUE.toFixed(2)));
                this.NetCtg = VALUE;
            }
            else {
                this.NetCtgRate = 0;
                this.NetCtg = 0;
            }
        }
    }
    fn_THC_Net() {
        let VALUE = 0;
        if (this.hdNetRights == true) {
            VALUE = Math.abs(this.UserWgt);
            VALUE = Math.round(Math.abs(VALUE));
            VALUE = (Math.abs(VALUE));
            //THC CALCULATED ON CW * 0.08 AS PER ARJUN MAIL Tue 3/10/2015 1:41 PM
            this.NetThcRate = 0.08;
            this.NetThc = VALUE;
            if (this.CityCode == "DAC") {
                this.NetThcRate = 0.08;
                VALUE = Math.abs(VALUE); // Math.abs(this.UserGrossWeight);
                let TOT = ((this.NetThcRate) * Math.abs(VALUE));
                this.NetThc = Math.abs(TOT).toFixed(2);
            }
            else {
                this.NetThcRate = 0;
                this.NetThc = 0;
            }
        }
    }

    onChangeTariffRates(tarType: string) {
        let MUL_VALUE = 0;
        let TOT = 0;
        if (tarType == 'Freight') {
            if (this.TarFreightPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarFreightPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarFreightRate) * Math.abs(MUL_VALUE));
            this.TarFreight = Math.round(TOT).toFixed(2);
        } else if (tarType == 'Fsc') {
            if (this.TarFscPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarFscPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarFscRate) * Math.abs(MUL_VALUE));
            this.TarFsc = Math.round(TOT).toFixed(2);
        } else if (tarType == 'Irc') {
            if (this.TarIrcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarIrcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarIrcRate) * Math.abs(MUL_VALUE));
            this.TarIrc = Math.round(TOT).toFixed(2);
        } else if (tarType == 'Xray') {
            if (this.TarXrayPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarXrayPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarXrayRate) * Math.abs(MUL_VALUE));
            this.TarXray = Math.round(TOT).toFixed(2);
        }
        else if (tarType == 'Misc') {
            if (this.TarMcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarMcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarMcRate) * Math.abs(MUL_VALUE));
            this.TarMc = Math.round(TOT).toFixed(2);
        }else if (tarType == 'CTG') {
            if (this.TarCtgPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarCtgPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarCtgRate) * Math.abs(MUL_VALUE));
            this.TarCtg = Math.round(TOT).toFixed(2);
        }else if (tarType == 'THC') {
            if (this.TarThcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarThcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarThcRate) * Math.abs(MUL_VALUE));
            this.TarThc = Math.round(TOT).toFixed(2);
        }
        else if (tarType == 'BP') {
            if (this.TarBPPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarBPPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarBPRate) * Math.abs(MUL_VALUE));
            this.TarBP = Math.round(TOT).toFixed(2);
        }
        else if (tarType == 'DT') {
            if (this.TarTruckPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarTruckPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarTruckRate) * Math.abs(MUL_VALUE));
            this.TarTruck = Math.round(TOT).toFixed(2);
        }
    }

    onChangeNetRates(tarType: string) {
        let MUL_VALUE = 0;
        let TOT = 0;
        if (tarType == 'Freight') {
            if (this.NetFreightPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetFreightPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetFreightRate) * Math.abs(MUL_VALUE));
            this.NetFreight = Math.round(TOT).toFixed(2);
        } else if (tarType == 'Fsc') {
            if (this.NetFscPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetFscPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetFscRate) * Math.abs(MUL_VALUE));
            this.NetFsc = Math.round(TOT).toFixed(2);
        } else if (tarType == 'Irc') {
            if (this.NetIrcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetIrcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetIrcRate) * Math.abs(MUL_VALUE));
            this.NetIrc = Math.round(TOT).toFixed(2);
        } else if (tarType == 'Xray') {
            if (this.NetXrayPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetXrayPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetXrayRate) * Math.abs(MUL_VALUE));
            this.NetXray = Math.round(TOT).toFixed(2);
        } else if (tarType == 'Misc') {
            if (this.NetMcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetMcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetMcRate) * Math.abs(MUL_VALUE));
            this.NetMc = Math.round(TOT).toFixed(2);
        }
        else if (tarType == 'CTG') {
            if (this.NetCtgPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetCtgPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetCtgRate) * Math.abs(MUL_VALUE));
            this.NetCtg = Math.round(TOT).toFixed(2);
        }    else if (tarType == 'THC') {
            if (this.NetThcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetThcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetThcRate) * Math.abs(MUL_VALUE));
            this.NetThc = Math.round(TOT).toFixed(2);
        }
        else if (tarType == 'BP') {
            if (this.NetBPPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetBPPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetBPRate) * Math.abs(MUL_VALUE));
            this.NetBP = Math.round(TOT).toFixed(2);
        }
        else if (tarType == 'DT') {
            if (this.NetTruckPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetTruckPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetTruckRate) * Math.abs(MUL_VALUE));
            this.NetTruck = Math.round(TOT).toFixed(2);
        }
    }

    fnCalculate_Tar() {
        let FSC = 0, IRC = 0, XRAY = 0, MC = 0, CTG = 0, OC1_DC = 0, OC2_DC = 0, OC1_DA = 0, OC2_DA = 0, DUE_CARRIER = 0,
            HAWB = 0, PCA = 0, DUE_AGENT = 0, TOTAL = 0, FREIGHT = 0, AMS = 0, THC = 0, BUSINESPROMO = 0, BP = 0,
            FSC_CC = 0, IRC_CC = 0, XRAY_CC = 0, MC_CC = 0, CTG_CC = 0, OC1_DC_CC = 0, OC2_DC_CC = 0, OC1_DA_CC = 0,
            OC2_DA_CC = 0, DUE_CARRIER_CC = 0, HAWB_CC = 0, PCA_CC = 0, DUE_AGENT_CC = 0, TOTAL_CC = 0, FREIGHT_CC = 0,
            AMS_CC = 0, THC_CC = 0, BP_CC = 0,Truck_CC = 0,Truck=0;

        if (this.TarFscFrt == "PP") { FSC = (Math.abs(this.TarFsc)); }
        else { FSC_CC = (Math.abs(this.TarFsc)); }

        if (this.TarIrcFrt == "PP") { IRC = (Math.abs(this.TarIrc)); }
        else { IRC_CC = (Math.abs(this.TarIrc)); }

        if (this.TarXrayFrt == "PP") { XRAY = (Math.abs(this.TarXray)); }
        else { XRAY_CC = (Math.abs(this.TarXray)); }

        if (this.TarMcFrt == "PP") { MC = (Math.abs(this.TarMc)); }
        else { MC_CC = (Math.abs(this.TarMc)); }

        if (this.TarAmsFrt == "PP") { AMS = (Math.abs(this.TarAms)); }
        else { AMS_CC = (Math.abs(this.TarAms)); }

        if (this.CityCode == "MUM") {
            if (this.TarCtgFrt == "PP") { CTG = Math.abs(this.TarCtg); }
            else { CTG_CC = Math.abs(this.TarCtg); }
        }
        else {
            CTG = 0;
            CTG_CC = 0;
        }
        if (this.TarThcFrt == "PP") { THC = (Math.abs(this.TarThc)); }
        else { THC_CC = (Math.abs(this.TarThc)); }
        // if (this.CityCode == "DAC") {
        //     if (this.TarThcFrt == "PP")
        //         THC = Math.abs(this.TarThc);
        //     else
        //         THC_CC = Math.abs(this.TarThc);
        // }
        // else {
        //     THC = 0;
        //     THC_CC = 0;
        // }

        if (this.CityCode == "DAC") {
            BP = 0;
            BP_CC = 0;
        }
        else {
            if (this.TarBPFrt == "PP") { BP = Math.abs(this.TarBP); }
            else { BP_CC = Math.abs(this.TarBP); }
        }

        if (this.OtherAmt1TarFrt == "PP") {
            if (this.CalOneDcTar == 1) { OC1_DC = Math.abs(this.OtherAmt1_Tar); }
            else { OC1_DA = Math.abs(this.OtherAmt1_Tar); }
        }
        else {
            if (this.CalOneDcTar == 1) { OC1_DC_CC = Math.abs(this.OtherAmt1_Tar); }
            else { OC1_DA_CC = Math.abs(this.OtherAmt1_Tar); }
        }

        if (this.OtherAmt2TarFrt == "PP") {
            if (this.CalTwoDcTar == 1) { OC2_DC = Math.abs(this.OtherAmt2_Tar); }
            else { OC2_DA = Math.abs(this.OtherAmt2_Tar); }
        }
        else {
            if (this.CalTwoDcTar == 1) { OC2_DC_CC = Math.abs(this.OtherAmt2_Tar); }
            else { OC2_DA_CC = Math.abs(this.OtherAmt2_Tar); }
        }

        if (this.HawbTarFrt == "PP") { HAWB = Math.abs(this.HawbTar); }
        else { HAWB_CC = Math.abs(this.HawbTar); }

        if (this.PcaTarFrt == "PP") { PCA = Math.abs(this.PcaTar); }
        else { PCA_CC = Math.abs(this.PcaTar); }

        if (this.TarFreightFrt == "PP") { FREIGHT = Math.abs(this.TarFreight); }
        else { FREIGHT_CC = Math.abs(this.TarFreight); }

        if (this.TarTruckFrt == "PP") { Truck = Math.abs(this.TarTruck); }
        else { Truck_CC = Math.abs(this.TarTruck); }


        ///ADDED BY NALINI FOR ALCHARGES ON 21/04/2022
        let totrate_tar_pp_dc=Math.abs(this.tot_rate_tar_pp_dc)
        let tot_rate_tar_cc_dc=Math.abs(this.tot_rate_tar_cc_dc)

        let DUE_CARRIER1 = Math.abs(FSC) + Math.abs(IRC) + Math.abs(XRAY) + Math.abs(MC) + Math.abs(CTG) + Math.abs(AMS) + Math.abs(OC1_DC) + Math.abs(OC2_DC) + Math.abs(THC) + Math.abs(BP)+Math.abs(totrate_tar_pp_dc);
        DUE_CARRIER = Math.round(Math.abs(DUE_CARRIER1));
        DUE_CARRIER = DUE_CARRIER;
        let DUE_CARRIER1_CC = Math.abs(FSC_CC) + Math.abs(IRC_CC) + Math.abs(XRAY_CC) + Math.abs(MC_CC) + Math.abs(CTG_CC) + Math.abs(AMS_CC) + Math.abs(OC1_DC_CC) + Math.abs(OC2_DC_CC) + Math.abs(THC_CC) + Math.abs(BP_CC)+Math.abs(tot_rate_tar_cc_dc);
        DUE_CARRIER_CC = Math.round(Math.abs(DUE_CARRIER1_CC));
        DUE_CARRIER_CC = DUE_CARRIER_CC;

         ///ADDED BY NALINI FOR ALCHARGES ON 21/04/2022

        let totrate_tar_pp_da=Math.abs(this.tot_rate_tar_pp_da)
        let totrate_tar_cc_da=Math.abs(this.tot_rate_tar_cc_da)

        let DUE_AGENT1 = Math.abs(HAWB) + Math.abs(PCA) + Math.abs(OC1_DA) + Math.abs(OC2_DA)+ Math.abs(totrate_tar_pp_da);
        DUE_AGENT1 = Math.round(DUE_AGENT1);
        DUE_AGENT = DUE_AGENT1;
        let DUE_AGENT1_CC = Math.abs(HAWB_CC) + Math.abs(PCA_CC) + Math.abs(OC1_DA_CC) + Math.abs(OC2_DA_CC)+ Math.abs(totrate_tar_cc_da);
        DUE_AGENT1_CC = Math.round(DUE_AGENT1_CC);
        DUE_AGENT_CC = DUE_AGENT1_CC;

        let TOTAL1 = Math.abs(DUE_CARRIER) + Math.abs(DUE_AGENT) + Math.abs(FREIGHT)+ Math.abs(Truck)
        TOTAL1 = Math.round(TOTAL1);
        TOTAL = Math.abs(TOTAL1);
        let TOTAL1_CC = Math.abs(DUE_CARRIER_CC) + Math.abs(DUE_AGENT_CC) + Math.abs(FREIGHT_CC)+ Math.abs(Truck_CC)
        TOTAL1_CC = Math.round(TOTAL1_CC);
        TOTAL_CC = TOTAL1_CC;

        this.DurCarrierTar = DUE_CARRIER.toFixed(2);
        this.DueAgentTar = DUE_AGENT.toFixed(2);
        this.TotalTar = TOTAL.toFixed(2);
        this.DurCarrierTarCC = DUE_CARRIER_CC.toFixed(2);
        this.DueAgentTarCC = DUE_AGENT_CC.toFixed(2);
        this.TotalTarCC = TOTAL_CC.toFixed(2);
       // this.fn_CalculateAlCharges_Tar( this.dttable6);
    }

    fnCalculate_Net() {
        let FSC = 0, IRC = 0, XRAY = 0, MC = 0, CTG = 0, THC = 0, BP = 0, OC1_DC = 0, OC2_DC = 0, OC1_DA = 0, OC2_DA = 0,
            DUE_CARRIER = 0, HAWB = 0, PCA = 0, DUE_AGENT = 0, TOTAL = 0, FREIGHT = 0, AMS = 0, FSC_CC = 0, IRC_CC = 0,
            XRAY_CC = 0, MC_CC = 0, CTG_CC = 0, THC_CC = 0, BP_CC = 0, OC1_DC_CC = 0, OC2_DC_CC = 0, OC1_DA_CC = 0,
            OC2_DA_CC = 0, DUE_CARRIER_CC = 0, HAWB_CC = 0, PCA_CC = 0, DUE_AGENT_CC = 0, TOTAL_CC = 0, FREIGHT_CC = 0,
            AMS_CC = 0,Truck=0,Truck_CC=0 ;

        if (this.NetFscFrt == "PP") { FSC = Math.abs(this.NetFsc); }
        else { FSC_CC = Math.abs(this.NetFsc); }

        if (this.NetIrcFrt == "PP") { IRC = Math.abs(this.NetIrc); }
        else { IRC_CC = Math.abs(this.NetIrc); }

        if (this.NetXrayFrt == "PP") { XRAY = Math.abs(this.NetXray); }
        else { XRAY_CC = Math.abs(this.NetXray); }

        if (this.NetMcFrt == "PP") { MC = Math.abs(this.NetMc); }
        else { MC_CC = Math.abs(this.NetMc); }

        if (this.NetAmsFrt == "PP") { AMS = Math.abs(this.NetAms); }
        else { AMS_CC = Math.abs(this.NetAms); }

        if (this.CityCode == "MUM") {
            if (this.NetCtgFrt == "PP") { CTG = Math.abs(this.NetCtg); }
            else { CTG_CC = Math.abs(this.NetCtg); }
        }
        else {
            CTG = 0;
            CTG_CC = 0;
        }

        // if (this.CityCode == "DAC") {
        //     if (this.NetThcFrt == "PP") { THC = Math.abs(this.NetThc); }
        //     else { THC_CC = Math.abs(this.NetThc); }
        // }
        // else {
        //     THC = 0;
        //     THC_CC = 0;
        // }

        if (this.NetThcFrt == "PP") { THC = Math.abs(this.NetThc); }
        else { THC_CC = Math.abs(this.NetThc); }

        if (this.CityCode == "DAC") {
            BP = 0;
            BP_CC = 0;
        }
        else {
            if (this.NetBPFrt == "PP") { BP = Math.abs(this.NetBP); }
            else { BP_CC = Math.abs(this.NetBP); }
        }

        if (this.OtherAmt1NetFrt == "PP") {
            if (this.CalOneDcNet == 1) { OC1_DC = Math.abs(this.OtherAmt1_Net); }
            else { OC1_DA = Math.abs(this.OtherAmt1_Net); }
        }
        else {
            if (this.CalOneDcNet == 1) { OC1_DC_CC = Math.abs(this.OtherAmt1_Net); }
            else { OC1_DA_CC = Math.abs(this.OtherAmt1_Net); }
        }

        if (this.OtherAmt2NetFrt == "PP") {
            if (this.CalTwoDcTar == 1) { OC2_DC = Math.abs(this.OtherAmt2_Net); }
            else { OC2_DA = Math.abs(this.OtherAmt2_Net); }
        }
        else {
            if (this.CalTwoDcTar == 1) { OC2_DC_CC = Math.abs(this.OtherAmt2_Net); }
            else { OC2_DA_CC = Math.abs(this.OtherAmt2_Net); }
        }

        if (this.HawbNetFrt == "PP") { HAWB = Math.abs(this.HawbNet); }
        else { HAWB_CC = Math.abs(this.HawbNet); }

        if (this.PcaNetFrt == "PP") { PCA = Math.abs(this.PcaNet); }
        else { PCA_CC = Math.abs(this.PcaNet); }

        if (this.NetFreightFrt == "PP") { FREIGHT = Math.abs(this.NetFreight); }
        else { FREIGHT_CC = Math.abs(this.NetFreight); }

        if (this.NetTruckFrt == "PP") { Truck = Math.abs(this.NetTruck); }
        else { Truck_CC = Math.abs(this.NetTruck); }

         //ADDED BY NALINI ON 21/04/2022 FOR ALCHARGES DUE CARRIER
         let totrate_net_pp_dc=Math.abs(this.tot_rate_net_pp_dc)
         let tot_rate_net_cc_dc=Math.abs(this.tot_rate_net_cc_dc)

        let DUE_CARRIER1 = Math.abs(FSC) + Math.abs(IRC) + Math.abs(XRAY) + Math.abs(MC) + Math.abs(CTG) + Math.abs(AMS) + Math.abs(OC1_DC) + Math.abs(OC2_DC) + Math.abs(THC) + Math.abs(BP)+Math.abs(totrate_net_pp_dc);
        DUE_CARRIER1 = Math.round(Math.abs(DUE_CARRIER1));
        DUE_CARRIER = Math.abs(DUE_CARRIER1);
        let DUE_CARRIER1_CC = Math.abs(FSC_CC) + Math.abs(IRC_CC) + Math.abs(XRAY_CC) + Math.abs(MC_CC) + Math.abs(CTG_CC) + Math.abs(AMS_CC) + Math.abs(OC1_DC_CC) + Math.abs(OC2_DC_CC) + Math.abs(THC_CC) + Math.abs(BP_CC) +Math.abs(tot_rate_net_cc_dc);
        DUE_CARRIER1_CC = Math.round(Math.abs(DUE_CARRIER1_CC));
        DUE_CARRIER_CC = Math.abs(DUE_CARRIER1_CC);

            //ADDED BY NALINI ON 21/04/2022 FOR ALCHARGES DUE AGENT
            let totrate_net_pp_da=Math.abs(this.tot_rate_net_pp_da)
            let totrate_net_cc_da=Math.abs(this.tot_rate_net_cc_da)

        let DUE_AGENT1 = Math.abs(HAWB) + Math.abs(PCA) + Math.abs(OC1_DA) + Math.abs(OC2_DA) + Math.abs(totrate_net_pp_da);
        DUE_AGENT1 = Math.round(Math.abs(DUE_AGENT1));
        DUE_AGENT = Math.abs(DUE_AGENT1);
        let DUE_AGENT1_CC = Math.abs(HAWB_CC) + Math.abs(PCA_CC) + Math.abs(OC1_DA_CC) + Math.abs(OC2_DA_CC)  + Math.round(totrate_net_cc_da);
        DUE_AGENT1_CC = Math.round(Math.abs(DUE_AGENT1_CC));
        DUE_AGENT_CC = Math.abs(DUE_AGENT1_CC);

        let TOTAL1 = Math.abs(DUE_CARRIER) + Math.abs(DUE_AGENT) + Math.abs(FREIGHT)+ Math.abs(Truck)
        TOTAL1 = Math.round(Math.abs(TOTAL1));
        TOTAL = Math.abs(TOTAL1);
        let TOTAL1_CC = Math.abs(DUE_CARRIER_CC) + Math.abs(DUE_AGENT_CC) + Math.abs(FREIGHT_CC)+ Math.abs(Truck_CC)
        TOTAL1_CC = Math.round(Math.abs(TOTAL1_CC));
        TOTAL_CC = Math.abs(TOTAL1_CC);

        this.DurCarrierNet = DUE_CARRIER.toFixed(2);
        this.DueAgentNet = DUE_AGENT.toFixed(2);
        this.TotalNet = TOTAL.toFixed(2);
        this.DurCarrierNetCC = DUE_CARRIER_CC.toFixed(2);
        this.DueAgentNetCC = DUE_AGENT_CC.toFixed(2);
        this.TotalNetCC = TOTAL_CC.toFixed(2);
    }

    changeUserWeight() {
        if (this.oldchblwt!= this.UserWgt)
        {
            var answer = confirm("Are you sure you want to change Charable Weight from "+this.oldchblwt+" to "+this.UserWgt+"?")
            if (answer == false) { return false; }
            else
            {
                this.oldchblwt=this.UserWgt;
                this.fn_PageLoad();
                this.changeTariffRates('Freight');
                this.changeNetRates('Freight');
                this.changeTariffRates('Fsc');
                this.changeNetRates('Fsc');
                this.changeTariffRates('Irc');
                this.changeNetRates('Irc');
                this.changeTariffRates('Xray');
                this.changeNetRates('Xray');
                this.changeTariffRates('Misc');
                this.changeNetRates('Misc');
                this.changeTariffRates('CTG');
                this.changeNetRates('CTG');
                this.changeTariffRates('THC');
                this.changeNetRates('THC');
                this.fnCalculate_Tar();
                this.fnCalculate_Net();

            }
        }
        if (this.oldgrwt!= this.UserGrossWeight)
        {
            var answer = confirm("Are you sure you want to change Gross Weight from "+this.oldgrwt+" to "+this.UserGrossWeight+"?")
        if (answer == false) { return false; }
        }
        else
        {
            this.oldgrwt=this.UserGrossWeight;
            this.fn_PageLoad();
            this.fnCalculate_Tar();
            this.fnCalculate_Net();
        }
     }

    onChangeAms(rateType: string) {
        if (rateType == 'TAR') {
            this.fnCalculate_Tar();
        }
        else if (rateType == 'NET') {
            this.fnCalculate_Net();
        }
    }

    onChangeOtherChargeName(cnType: number) {
        if (cnType == 1) {
            if (this.OtherChrg1 == "") {
                this.OtherAmt1_Tar = "";
                this.fnCalculate_Tar();
                if (this.hdNetRights == true) {
                    this.OtherAmt1_Net = "";
                    this.fnCalculate_Net();
                }
            }
        }
        else if (cnType == 2) {
            if (this.OtherChrg2 == "") {
                this.OtherAmt2_Tar = "";
                this.fnCalculate_Tar();
                if (this.hdNetRights == true) {
                    this.OtherAmt2_Net = "";
                    this.fnCalculate_Net();
                }
            }
        }
    }

    onChangeOther_Tar(oType: number) {
        if (oType == 1) {
            if (Math.abs(this.OtherAmt1_Tar) > 0) {
                if (this.OtherChrg1 == "" || this.OtherChrg1 == null) {
                    alert("Please enter name of Charge1.");
                    this.OtherAmt1_Tar = null;
                    return false;
                }
            }
            this.fnCalculate_Tar();
        }
        else if (oType == 2) {
            if (Math.abs(this.OtherAmt2_Tar) > 0) {
                if (this.OtherChrg2 == "" || this.OtherChrg2 == null) {
                    alert("Please enter name of Charge2.");
                    this.OtherAmt2_Tar = null;
                    return false;
                }
            }
            this.fnCalculate_Tar();
        }
    }

    onChangeOther_Net(ChargeType) {
        if (ChargeType == '1') {
            if (Math.abs(this.OtherAmt1_Net) > 0) {
                if (this.OtherChrg1 == "" || this.OtherChrg1 == null) {
                    alert("Please enter name of Charge1.");
                    this.OtherAmt1_Net = null;
                    return false;
                }
            }
            this.fnCalculate_Net();
        }
        else if (ChargeType == '2') {
            if (Math.abs(this.OtherAmt2_Net) > 0) {
                if (this.OtherChrg2 == "" || this.OtherChrg2 == null) {
                    alert("Please enter name of Charge2.");
                    this.OtherAmt2_Net = null;
                    return false;
                }
            }
            this.fnCalculate_Net();
        }

    }

    fnChangeFreight_PP_CC_TAR() {
        let Value = this.TarFreightFrt;
        this.TarFscFrt = Value;
        this.TarIrcFrt = Value;
        this.TarXrayFrt = Value;
        this.fnCalculate_Tar();
    }

    fnChangeFreight_PP_CC_NET() {
        let Value = this.NetFreightFrt;
        this.NetFscFrt = Value;
        this.NetIrcFrt = Value;
        this.NetXrayFrt = Value;
        this.fnCalculate_Net();
    }

    fn_MAWB_IU() {

        if (this.validateWeight() == false) { return false; }

        let AGENTS_RATE = this.AgentsRate;

        if (parseFloat(AGENTS_RATE) > 20.00) {
            alert("Please Enter below 20 on Agent Charges! ");
            return false;
        }

        let MAWBNO = this._sharedconsig.exportEditData.MAWBNO;
        let CITYCODE = this.CityCode;
        let CHBL_WGT = this.Wgt;
        let GROSS_WGT = this.GrossWeight;
        let CHBL_WGT_USER = Math.abs(this.UserWgt);
        let GROSS_WGT_USER = Math.abs(this.UserGrossWeight);

        let FREIGHT = (this.FreightRate != null) ? this.FreightRate : "";

        let FRT_CHARGEABLE_AS_TAR = (this.TariffRate == 1) ? "AI" : "FS";

        let FRT_PAYABLE_ON_TAR = (this.TarFreightPayOn != null) ? this.TarFreightPayOn : "";
        let FRT_RATE_PER_KG_TAR = Math.abs(this.TarFreightRate);
        let FRT_RATE_TAR = Math.abs(this.TarFreight);

        let FSC_PAYABLE_ON_TAR = (this.TarFscPayOn != null) ? this.TarFscPayOn : "";
        let FSC_RATE_PER_KG_TAR = Math.abs(this.TarFscRate);
        let FSC_RATE_TAR = Math.abs(this.TarFsc);

        let IRC_PAYABLE_ON_TAR = (this.TarIrcPayOn != null) ? this.TarIrcPayOn : "";
        let IRC_RATE_PER_KG_TAR = Math.abs(this.TarIrcRate);
        let IRC_RATE_TAR = Math.abs(this.TarIrc);

        let XRAY_PAYABLE_ON_TAR = (this.TarXrayPayOn != null) ? this.TarXrayPayOn : "";
        let XRAY_RATE_PER_KG_TAR = Math.abs(this.TarXrayRate);
        let XRAY_RATE_TAR = Math.abs(this.TarXray);


        if (FRT_CHARGEABLE_AS_TAR == 'FS') {
            // if (FSC_RATE_TAR == 0) {
            //     alert("Please enter any one TARIFF RATE - FSC");
            //     return false;
            // }
            if (FSC_RATE_TAR == 0 && IRC_RATE_TAR == 0 && XRAY_RATE_TAR == 0) {
                alert("Please enter any one TARIFF RATE :[FSC] or [IRC] or [X-RAY]");
                return false;
            }

        }

        let MC_PAYABLE_ON_TAR = (this.TarMcPayOn != null) ? this.TarMcPayOn : "";
        let MC_RATE_PER_KG_TAR = Math.abs(this.TarMcRate);
        let MC_RATE_TAR = Math.abs(this.TarMc);

        let CTG_PAYABLE_ON_TAR = (this.TarCtgPayOn != null) ? this.TarCtgPayOn : "";
        let CTG_RATE_PER_KG_TAR = Math.abs(this.TarCtgRate);
        let CTG_RATE_TAR = Math.abs(this.TarCtg);

        let THC_PAYABLE_ON_TAR = (this.TarThcPayOn != null) ? this.TarThcPayOn : "";
        let THC_RATE_PER_KG_TAR = Math.abs(this.TarThcRate);
        let THC_RATE_TAR = Math.abs(this.TarThc);

        let BP_PAYABLE_ON_TAR = (this.TarBPPayOn != null) ? this.TarBPPayOn : "";
        let BP_RATE_PER_KG_TAR = Math.abs(this.TarBPRate);
        let BP_RATE_TAR = Math.abs(this.TarBP);

        let Truck_PAYABLE_ON_TAR = (this.TarTruckPayOn != null) ? this.TarTruckPayOn : "";
        let Truck_RATE_PER_KG_TAR = Math.abs(this.TarTruckRate);
        let Truck_RATE_TAR = Math.abs(this.TarTruck);

        let DUE_CARRIER_TAR = Math.abs(this.DurCarrierTar);
        let HAWB_TAR = Math.abs(this.HawbTar);
        let PCA_TAR = Math.abs(this.PcaTar);
        let DUE_AGENT_TAR = Math.abs(this.DueAgentTar);
        let TOTAL_TAR = Math.abs(this.TotalTar);
        let OTHER_CHRG_TAR = Math.abs(this.OtherTar);
        let REMARK = this.Remark;
        let AMS_RATE_TAR = Math.abs(this.TarAms);

        let OTHER_NAME1 = this.OtherChrg1;
        let OTHER_NAME2 = this.OtherChrg2;
        let OTHER_RATE1_TAR = Math.abs(this.OtherAmt1_Tar);
        let OTHER_RATE2_TAR = Math.abs(this.OtherAmt2_Tar);

        let OTHER_RATE1_TAR_CAL = (this.CalOneDcTar == 1) ? "DC" : "DA";
        let OTHER_RATE2_TAR_CAL = this.OtherAmt2_Tar;

        OTHER_RATE2_TAR_CAL = (this.CalTwoDcTar == 1) ? "DC" : "DA"; //Line 1413 one variable with different data

        let OTHER_RATE1_NET_CAL = (this.CalOneDcNet == 1) ? "DC" : "DA";

        let OTHER_RATE2_NET_CAL = (this.CalTwoDcNet == 1) ? "DC" : "DA";

        let ISMIN = (this.isMinRate == true) ? "Y" : "N";

        let EXPTNO = this.exptno;

        var FRT_RATE_TAR_FRT = '',
            FSC_RATE_TAR_FRT = '',
            IRC_RATE_TAR_FRT = '',
            XRAY_RATE_TAR_FRT = '',
            MC_RATE_TAR_FRT = '',
            CTG_RATE_TAR_FRT = '',
            THC_RATE_TAR_FRT = '',
            BP_RATE_TAR_FRT = '',
            HAWB_RATE_TAR_FRT = '',
            PCA_RATE_TAR_FRT = '',
            OTHER_RATE_TAR_FRT = '',
            TRUCK_RATE_TAR_FRT = '',

            FRT_RATE_NET_FRT = '',
            FSC_RATE_NET_FRT = '',
            IRC_RATE_NET_FRT = '',
            XRAY_RATE_NET_FRT = '',
            MC_RATE_NET_FRT = '',
            CTG_RATE_NET_FRT = '',
            THC_RATE_NET_FRT = '',
            BP_RATE_NET_FRT = '',
            AMS_RATE_NET_FRT = '',
            HAWB_RATE_NET_FRT = '',
            PCA_RATE_NET_FRT = '',
            OTHER_RATE_NET_FRT = '',
            AMS_RATE_TAR_FRT = '',
            TRUCK_RATE_NET_FRT;

        var FRT_CHARGEABLE_AS_NET = '',
            FRT_PAYABLE_ON_NET = '',
            FRT_RATE_PER_KG_NET: number,
            FRT_RATE_NET: number,
            FSC_PAYABLE_ON_NET = '',
            FSC_RATE_PER_KG_NET: number,
            FSC_RATE_NET: number,
            IRC_PAYABLE_ON_NET = '',
            IRC_RATE_PER_KG_NET: number,
            IRC_RATE_NET: number,
            XRAY_PAYABLE_ON_NET = '',
            XRAY_RATE_PER_KG_NET: number,
            XRAY_RATE_NET: number,
            MC_PAYABLE_ON_NET = '',
            MC_RATE_PER_KG_NET: number,
            MC_RATE_NET: number,
            CTG_PAYABLE_ON_NET = '',
            CTG_RATE_PER_KG_NET: number | string,
            CTG_RATE_NET: number,
            DUE_CARRIER_NET: number | string,
            HAWB_NET: number,
            PCA_NET: number,
            DUE_AGENT_NET: number | string,
            TOTAL_NET: number | string,
            OTHER_CHRG_NET: number,
            AMS_RATE_NET: number,
            OTHER_RATE1_NET: number,
            OTHER_RATE2_NET: number,
            ISNETEDIT = '',
            SupplierNet = '',
            AIR_FRT_COMMISSION = '',
            FRT_REBATE: number,
            TDS: number,
            SERVICE_TAX: number,
            THC_PAYABLE_ON_NET = '',
            THC_RATE_PER_KG_NET: number,
            THC_RATE_NET: number,
            BUSINES_PROMO = '',
            BP_PAYABLE_ON_NET = '',
            BP_RATE_PER_KG_NET: number | string,
            BP_RATE_NET: number,

            TRUCK_PAYABLE_ON_NET = '',
            TRUCK_RATE_PER_KG_NET: number | string,
            TRUCK_RATE_NET: number;


        if (Math.abs(FRT_RATE_TAR) > 0)
            FRT_RATE_TAR_FRT = this.TarFreightFrt;
        if (Math.abs(FSC_RATE_TAR) > 0)
            FSC_RATE_TAR_FRT = this.TarFscFrt;
        if (Math.abs(IRC_RATE_TAR) > 0)
            IRC_RATE_TAR_FRT = this.TarIrcFrt;
        if (Math.abs(XRAY_RATE_TAR) > 0)
            XRAY_RATE_TAR_FRT = this.TarXrayFrt;
        if (Math.abs(MC_RATE_TAR) > 0)
            MC_RATE_TAR_FRT = this.TarMcFrt;
        if (Math.abs(CTG_RATE_TAR) > 0)
            CTG_RATE_TAR_FRT = this.TarCtgFrt;
        if (Math.abs(THC_RATE_TAR) > 0)
            THC_RATE_TAR_FRT = this.TarThcFrt;
        if (Math.abs(BP_RATE_TAR) > 0)
            BP_RATE_TAR_FRT = this.TarBPFrt;
        if (Math.abs(AMS_RATE_TAR) > 0)
            AMS_RATE_TAR_FRT = this.TarAmsFrt;
        if (Math.abs(HAWB_TAR) > 0)
            HAWB_RATE_TAR_FRT = this.HawbTarFrt;
        if (Math.abs(PCA_TAR) > 0)
            PCA_RATE_TAR_FRT = this.PcaTarFrt;
        if (Math.abs(OTHER_CHRG_TAR) > 0)
            OTHER_RATE_TAR_FRT = this.OtherTarFrt;


        let OTHER_RATE1_TAR_FRT = '',
            OTHER_RATE2_TAR_FRT = '',
            OTHER_RATE1_NET_FRT = '',
            OTHER_RATE2_NET_FRT = '',
            DUE_CARRIER_NET_CC = 0,
            DUE_AGENT_NET_CC = 0,
            TOTAL_NET_CC = 0;

        if (Math.abs(OTHER_RATE1_TAR) > 0)
            OTHER_RATE1_TAR_FRT = this.OtherAmt1TarFrt;
        if (Math.abs(OTHER_RATE2_TAR) > 0)
            OTHER_RATE2_TAR_FRT = this.OtherAmt2TarFrt;

        let DUE_CARRIER_TAR_CC = Math.abs(this.DurCarrierTarCC),
            DUE_AGENT_TAR_CC = Math.abs(this.DueAgentTarCC),
            TOTAL_TAR_CC = Math.abs(this.TotalTarCC);

        let TDS_ACCTCODE = '',
            SERVICETAX_ACCTCODE = '';

        if (this.hdNetRights == true) {
            ISNETEDIT = 'Y';

            TDS = Math.abs(this.TxtTDS);
            SERVICE_TAX = Math.abs(this.TxtServiceTax);
            TDS_ACCTCODE = this.DrpTDS;
            SERVICETAX_ACCTCODE = this.DrpServiceTax;

            if (Math.abs(TDS) > 0) {
                if (TDS_ACCTCODE == "0") {
                    alert("Please select TDS Account Name.");
                    return false;
                }
            }
            else { TDS_ACCTCODE = ''; }

            if (Math.abs(SERVICE_TAX) > 0) {
                if (SERVICETAX_ACCTCODE == "0") {
                    alert("Please select Service Tax Account Name.");
                    return false;
                }
            }
            else { SERVICETAX_ACCTCODE = ''; }

            if (this.SupplierNet == null || this.SupplierNet == "" || this.SupplierNet==undefined) {
                alert("Please select Supplier / Airline.");
                return false;
            }
            SupplierNet = this.SupplierNet;

            FRT_CHARGEABLE_AS_NET = (this.NetRate == 1) ? "AI" : "FS";

            FRT_PAYABLE_ON_NET = (this.NetFreightPayOn != null) ? this.NetFreightPayOn : "";
            FRT_RATE_PER_KG_NET = Math.abs(this.NetFreightRate);
            FRT_RATE_NET = Math.abs(this.NetFreight);

            FSC_PAYABLE_ON_NET = (this.NetFscPayOn != null) ? this.NetFscPayOn : "";
            FSC_RATE_PER_KG_NET = Math.abs(this.NetFscRate);
            FSC_RATE_NET = Math.abs(this.NetFsc);

            IRC_PAYABLE_ON_NET = (this.NetIrcPayOn != null) ? this.NetIrcPayOn : "";
            IRC_RATE_PER_KG_NET = Math.abs(this.NetIrcRate);
            IRC_RATE_NET = Math.abs(this.NetIrc);

            XRAY_PAYABLE_ON_NET = (this.NetXrayPayOn != null) ? this.NetXrayPayOn : "";
            XRAY_RATE_PER_KG_NET = Math.abs(this.NetXrayRate);
            XRAY_RATE_NET = Math.abs(this.NetXray);

            // if (FRT_CHARGEABLE_AS_NET == 'FS') {
            //     if (FSC_RATE_NET == 0) {
            //         alert("Please enter any one NET NET RATE - FSC");
            //         return false;
            //     }
                //        if (FSC_RATE_NET == 0 && IRC_RATE_NET == 0 && XRAY_RATE_NET == 0) {
                //            alert("Please enter any one NET NET RATE :[FSC] or [IRC] or [X-RAY]");
                //            return false;
                //        }

           // }

            MC_PAYABLE_ON_NET = (this.NetMcPayOn != null) ? this.NetMcPayOn : "";
            MC_RATE_PER_KG_NET = Math.abs(this.NetMcRate);
            MC_RATE_NET = Math.abs(this.NetMc);

            CTG_PAYABLE_ON_NET = (this.NetCtgPayOn != null || this.NetCtgPayOn != '') ? this.NetCtgPayOn : "";
            CTG_RATE_PER_KG_NET = (this.NetCtgRate != null || this.NetCtgRate != '') ? Math.abs(this.NetCtgRate) : "";
            CTG_RATE_NET = Math.abs(this.NetCtg);


            THC_PAYABLE_ON_NET = (this.NetThcPayOn != null) ? this.NetThcPayOn : "";
            THC_RATE_PER_KG_NET = Math.abs(this.NetThcRate);
            THC_RATE_NET = Math.abs(this.NetThc);

            BP_PAYABLE_ON_NET = (this.NetBPPayOn != null) ? this.NetBPPayOn : "";
            BP_RATE_PER_KG_NET = (this.NetBPRate != null || this.NetBPRate != '') ? Math.abs(this.NetBPRate) : "";
            BP_RATE_NET = Math.abs(this.NetBP);

            DUE_CARRIER_NET = (this.DurCarrierNet != null || this.DurCarrierNet != '') ? Math.abs(this.DurCarrierNet) : "";
            HAWB_NET = Math.abs(this.HawbNet);
            PCA_NET = Math.abs(this.PcaNet);
            DUE_AGENT_NET = (this.DueAgentNet != null || this.DueAgentNet != '') ? Math.abs(this.DueAgentNet) : "";
            TOTAL_NET = Math.abs(this.TotalNet);
            OTHER_CHRG_NET = Math.abs(this.OtherNet);
            AMS_RATE_NET = Math.abs(this.NetAms);
            OTHER_RATE1_NET = Math.abs(this.OtherAmt1_Net);
            OTHER_RATE2_NET = Math.abs(this.OtherAmt2_Net);

            AIR_FRT_COMMISSION = (this.AirFrtCommission != null) ? this.AirFrtCommission : "";
            FRT_REBATE = this.FrtRebate;
            BUSINES_PROMO = (this.BusinesPromo != null || this.BusinesPromo != '') ? this.BusinesPromo : "";

            TRUCK_PAYABLE_ON_NET = (this.NetTruckPayOn != null) ? this.NetTruckPayOn : "";
            TRUCK_RATE_PER_KG_NET = (this.NetTruckRate != null || this.NetTruckRate != '') ? Math.abs(this.NetTruckRate) : "";
            TRUCK_RATE_NET = Math.abs(this.NetTruck);

            if (Math.abs(FRT_RATE_NET) > 0)
                FRT_RATE_NET_FRT = this.NetFreightFrt;
            if (Math.abs(FSC_RATE_NET) > 0)
                FSC_RATE_NET_FRT = this.NetFscFrt;
            if (Math.abs(IRC_RATE_NET) > 0)
                IRC_RATE_NET_FRT = this.NetIrcFrt;
            if (Math.abs(XRAY_RATE_NET) > 0)
                XRAY_RATE_NET_FRT = this.NetXrayFrt;
            if (Math.abs(MC_RATE_NET) > 0)
                MC_RATE_NET_FRT = this.NetMcFrt;
            if (Math.abs(CTG_RATE_NET) > 0)
                CTG_RATE_NET_FRT = this.NetCtgFrt;
            if (Math.abs(THC_RATE_NET) > 0)
                THC_RATE_NET_FRT = this.NetThcFrt;
            if (Math.abs(BP_RATE_NET) > 0)
                BP_RATE_NET_FRT = this.NetBPFrt;

            if (Math.abs(AMS_RATE_NET) > 0)
                AMS_RATE_NET_FRT = this.NetAmsFrt;
            if (Math.abs(HAWB_NET) > 0)
                HAWB_RATE_NET_FRT = this.HawbNetFrt;
            if (Math.abs(PCA_NET) > 0)
                PCA_RATE_NET_FRT = this.PcaNetFrt;
            if (Math.abs(OTHER_CHRG_NET) > 0)
                OTHER_RATE_NET_FRT = this.OtherNetFrt;

            if (Math.abs(OTHER_RATE1_NET) > 0)
                OTHER_RATE1_NET_FRT = this.OtherAmt1NetFrt;
            if (Math.abs(OTHER_RATE2_NET) > 0)
                OTHER_RATE2_NET_FRT = this.OtherAmt2NetFrt;

            if (Math.abs(TRUCK_RATE_NET) > 0)
                TRUCK_RATE_NET_FRT = this.NetTruckFrt;


            DUE_CARRIER_NET_CC = Math.abs(this.DurCarrierNetCC);
            DUE_AGENT_NET_CC = Math.abs(this.DueAgentNetCC);
            TOTAL_NET_CC = Math.abs(this.TotalNetCC);
        }
        else {
            let ISNETEDIT = 'N',
                SupplierNet = '',
                FRT_CHARGEABLE_AS_NET = "AI",
                FRT_PAYABLE_ON_NET = '0',
                FRT_RATE_PER_KG_NET = '0',
                FRT_RATE_NET = '0',

                FSC_PAYABLE_ON_NET = '0',
                FSC_RATE_PER_KG_NET = '0',
                FSC_RATE_NET = '0',

                IRC_PAYABLE_ON_NET = '0',
                IRC_RATE_PER_KG_NET = '0',
                IRC_RATE_NET = '0',

                XRAY_PAYABLE_ON_NET = '0',
                XRAY_RATE_PER_KG_NET = '0',
                XRAY_RATE_NET = '0',

                MC_PAYABLE_ON_NET = '0',
                MC_RATE_PER_KG_NET = '0',
                MC_RATE_NET = '0',

                CTG_PAYABLE_ON_NET = '0',
                CTG_RATE_PER_KG_NET = '0',
                CTG_RATE_NET = '0',

                THC_PAYABLE_ON_NET = '0',
                THC_RATE_PER_KG_NET = '0',
                THC_RATE_NET = '0',

                BP_PAYABLE_ON_NET = '0',
                BP_RATE_PER_KG_NET = '0',
                BP_RATE_NET = '0',

                Truck_PAYABLE_ON_NET = '0',
                Truck_RATE_PER_KG_NET = '0',
                Truck_RATE_NET = '0',

                DUE_CARRIER_NET = '0',
                HAWB_NET = '0',
                PCA_NET = '0',
                DUE_AGENT_NET = '0',
                TOTAL_NET = '0',
                OTHER_CHRG_NET = '0',
                AMS_RATE_NET = '0',
                OTHER_RATE1_NET = '0',
                OTHER_RATE2_NET = '0',

                AIR_FRT_COMMISSION = '',
                FRT_REBATE = '',
                BUSINES_PROMO = '',
                TDS = '',
                SERVICE_TAX = '';

            FRT_RATE_NET_FRT = '';
            FSC_RATE_NET_FRT = '';
            IRC_RATE_NET_FRT = '';
            XRAY_RATE_NET_FRT = '';
            MC_RATE_NET_FRT = '';
            CTG_RATE_NET_FRT = '';
            THC_RATE_NET_FRT = '';
            BP_RATE_NET_FRT = '';
            AMS_RATE_NET_FRT = '';
            HAWB_RATE_NET_FRT = '';
            PCA_RATE_NET_FRT = '';
            OTHER_RATE_NET_FRT = '';

            OTHER_RATE1_NET_FRT = '';
            OTHER_RATE2_NET_FRT = '';
            DUE_CARRIER_NET_CC = 0;
            DUE_AGENT_NET_CC = 0;
            TOTAL_NET_CC = 0;

            TDS_ACCTCODE = '';
            SERVICETAX_ACCTCODE = '';
        }

        const _jsonData = {
            EXPTNO: EXPTNO,
            MAWBNO: MAWBNO,
            CITYCODE: CITYCODE,
            CHBL_WGT: CHBL_WGT,
            GROSS_WGT: GROSS_WGT,
            CHBL_WGT_USER: CHBL_WGT_USER,
            GROSS_WGT_USER: GROSS_WGT_USER,
            FREIGHT: FREIGHT,
            FRT_CHARGEABLE_AS_TAR: FRT_CHARGEABLE_AS_TAR,
            FRT_CHARGEABLE_AS_NET: FRT_CHARGEABLE_AS_NET,
            FRT_PAYABLE_ON_TAR: FRT_PAYABLE_ON_TAR,
            FRT_RATE_PER_KG_TAR: FRT_RATE_PER_KG_TAR,
            FRT_RATE_TAR: FRT_RATE_TAR,
            FRT_PAYABLE_ON_NET: FRT_PAYABLE_ON_NET,
            FRT_RATE_PER_KG_NET: FRT_RATE_PER_KG_NET,
            FRT_RATE_NET: FRT_RATE_NET,
            FSC_PAYABLE_ON_TAR: FSC_PAYABLE_ON_TAR,
            FSC_RATE_PER_KG_TAR: FSC_RATE_PER_KG_TAR,
            FSC_RATE_TAR: FSC_RATE_TAR,
            FSC_PAYABLE_ON_NET: FSC_PAYABLE_ON_NET,
            FSC_RATE_PER_KG_NET: FSC_RATE_PER_KG_NET,
            FSC_RATE_NET: FSC_RATE_NET,
            IRC_PAYABLE_ON_TAR: IRC_PAYABLE_ON_TAR,
            IRC_RATE_PER_KG_TAR: IRC_RATE_PER_KG_TAR,
            IRC_RATE_TAR: IRC_RATE_TAR,
            IRC_PAYABLE_ON_NET: IRC_PAYABLE_ON_NET,
            IRC_RATE_PER_KG_NET: IRC_RATE_PER_KG_NET,
            IRC_RATE_NET: IRC_RATE_NET,
            XRAY_PAYABLE_ON_TAR: XRAY_PAYABLE_ON_TAR,
            XRAY_RATE_PER_KG_TAR: XRAY_RATE_PER_KG_TAR,
            XRAY_RATE_TAR: XRAY_RATE_TAR,
            XRAY_PAYABLE_ON_NET: XRAY_PAYABLE_ON_NET,
            XRAY_RATE_PER_KG_NET: XRAY_RATE_PER_KG_NET,
            XRAY_RATE_NET: XRAY_RATE_NET,
            MC_PAYABLE_ON_TAR: MC_PAYABLE_ON_TAR,
            MC_RATE_PER_KG_TAR: MC_RATE_PER_KG_TAR,
            MC_RATE_TAR: MC_RATE_TAR,
            MC_PAYABLE_ON_NET: MC_PAYABLE_ON_NET,
            MC_RATE_PER_KG_NET: MC_RATE_PER_KG_NET,
            MC_RATE_NET: MC_RATE_NET,
            CTG_PAYABLE_ON_TAR: CTG_PAYABLE_ON_TAR,
            CTG_RATE_PER_KG_TAR: CTG_RATE_PER_KG_TAR,
            CTG_RATE_TAR: CTG_RATE_TAR,
            CTG_PAYABLE_ON_NET: CTG_PAYABLE_ON_NET,
            CTG_RATE_PER_KG_NET: CTG_RATE_PER_KG_NET,
            CTG_RATE_NET: CTG_RATE_NET,
            DUE_CARRIER_TAR: DUE_CARRIER_TAR,
            DUE_CARRIER_NET: DUE_CARRIER_NET,
            HAWB_TAR: HAWB_TAR,
            HAWB_NET: HAWB_NET,
            PCA_TAR: PCA_TAR,
            PCA_NET: PCA_NET,
            DUE_AGENT_TAR: DUE_AGENT_TAR,
            DUE_AGENT_NET: DUE_AGENT_NET,
            TOTAL_TAR: TOTAL_TAR,
            TOTAL_NET: TOTAL_NET,
            OTHER_CHRG_TAR: OTHER_CHRG_TAR,
            OTHER_CHRG_NET: OTHER_CHRG_NET,
            REMARK: REMARK,
            AMS_RATE_TAR: AMS_RATE_TAR,
            AMS_RATE_NET: AMS_RATE_NET,
            OTHER_NAME1: OTHER_NAME1,
            OTHER_NAME2: OTHER_NAME2,
            OTHER_RATE1_TAR: OTHER_RATE1_TAR,
            OTHER_RATE2_TAR: OTHER_RATE2_TAR,
            OTHER_RATE1_NET: OTHER_RATE1_NET,
            OTHER_RATE2_NET: OTHER_RATE2_NET,
            OTHER_RATE1_TAR_CAL: OTHER_RATE1_TAR_CAL,
            OTHER_RATE2_TAR_CAL: OTHER_RATE2_TAR_CAL,
            OTHER_RATE1_NET_CAL: OTHER_RATE1_NET_CAL,
            OTHER_RATE2_NET_CAL: OTHER_RATE2_NET_CAL,
            ISNETEDIT: ISNETEDIT,
            ISMIN: ISMIN,
            SUPPLIER_NET: SupplierNet,
            AIR_FRT_COMM_NET: AIR_FRT_COMMISSION,
            FRT_REBATE_NET: FRT_REBATE,
            TDS_NET: TDS,
            SERVICE_TAX_NET: SERVICE_TAX,
            FRT_RATE_TAR_FRT: FRT_RATE_TAR_FRT,
            FSC_RATE_TAR_FRT: FSC_RATE_TAR_FRT,
            IRC_RATE_TAR_FRT: IRC_RATE_TAR_FRT,
            XRAY_RATE_TAR_FRT: XRAY_RATE_TAR_FRT,
            MC_RATE_TAR_FRT: MC_RATE_TAR_FRT,
            CTG_RATE_TAR_FRT: CTG_RATE_TAR_FRT,
            AMS_RATE_TAR_FRT: AMS_RATE_TAR_FRT,
            HAWB_RATE_TAR_FRT: HAWB_RATE_TAR_FRT,
            PCA_RATE_TAR_FRT: PCA_RATE_TAR_FRT,
            OTHER_RATE_TAR_FRT: OTHER_RATE_TAR_FRT,
            FRT_RATE_NET_FRT: FRT_RATE_NET_FRT,
            FSC_RATE_NET_FRT: FSC_RATE_NET_FRT,
            IRC_RATE_NET_FRT: IRC_RATE_NET_FRT,
            XRAY_RATE_NET_FRT: XRAY_RATE_NET_FRT,
            MC_RATE_NET_FRT: MC_RATE_NET_FRT,
            CTG_RATE_NET_FRT: CTG_RATE_NET_FRT,
            AMS_RATE_NET_FRT: AMS_RATE_NET_FRT,
            HAWB_RATE_NET_FRT: HAWB_RATE_NET_FRT,
            PCA_RATE_NET_FRT: PCA_RATE_NET_FRT,
            OTHER_RATE_NET_FRT: OTHER_RATE_NET_FRT,
            OTHER_RATE1_TAR_FRT: OTHER_RATE1_TAR_FRT,
            OTHER_RATE2_TAR_FRT: OTHER_RATE2_TAR_FRT,
            DUE_CARRIER_TAR_CC: DUE_CARRIER_TAR_CC,
            DUE_AGENT_TAR_CC: DUE_AGENT_TAR_CC,
            TOTAL_TAR_CC: TOTAL_TAR_CC,
            OTHER_RATE1_NET_FRT: OTHER_RATE1_NET_FRT,
            OTHER_RATE2_NET_FRT: OTHER_RATE2_NET_FRT,
            DUE_CARRIER_NET_CC: DUE_CARRIER_NET_CC,
            DUE_AGENT_NET_CC: DUE_AGENT_NET_CC,
            TOTAL_NET_CC: TOTAL_NET_CC,
            TDS_ACCTCODE: TDS_ACCTCODE,
            SERVICETAX_ACCTCODE: SERVICETAX_ACCTCODE,
            AGENTS_RATE: AGENTS_RATE,
            THC_PAYABLE_ON_TAR: THC_PAYABLE_ON_TAR,
            THC_RATE_PER_KG_TAR: THC_RATE_PER_KG_TAR,
            THC_RATE_TAR: THC_RATE_TAR,
            THC_PAYABLE_ON_NET: THC_PAYABLE_ON_NET,
            THC_RATE_PER_KG_NET: THC_RATE_PER_KG_NET,
            THC_RATE_NET: THC_RATE_NET,
            THC_RATE_TAR_FRT: THC_RATE_TAR_FRT,
            THC_RATE_NET_FRT: THC_RATE_NET_FRT,
            BUSINES_PROMO_NET: BUSINES_PROMO,
            BP_PAYABLE_ON_TAR: BP_PAYABLE_ON_TAR,
            BP_RATE_PER_KG_TAR: BP_RATE_PER_KG_TAR,
            BP_RATE_TAR: BP_RATE_TAR,
            BP_PAYABLE_ON_NET: BP_PAYABLE_ON_NET,
            BP_RATE_PER_KG_NET: BP_RATE_PER_KG_NET,
            BP_RATE_NET: BP_RATE_NET,
            BP_RATE_TAR_FRT: BP_RATE_TAR_FRT,
            BP_RATE_NET_FRT: BP_RATE_NET_FRT,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CmpId: this._loginService.getLogin()[0].CMPID,
            MakerIp: this._loginService.getLogin()[0].MAKERIP, //Change later by Ip
            DEST_TRUCKING_PAYABLE_ON_TAR: Truck_PAYABLE_ON_TAR,
            DEST_TRUCKING_RATE_PER_KG_TAR: Truck_RATE_PER_KG_TAR,
            DEST_TRUCKING_RATE_TAR: Truck_RATE_TAR,
            DEST_TRUCKING_PAYABLE_ON_NET: TRUCK_PAYABLE_ON_NET,
            DEST_TRUCKING_RATE_PER_KG_NET: TRUCK_RATE_PER_KG_NET,
            DEST_TRUCKING_RATE_NET: TRUCK_RATE_NET,
            DEST_TRUCKING_RATE_TAR_FRT: TRUCK_RATE_TAR_FRT,
            DEST_TRUCKING_RATE_NET_FRT: TRUCK_RATE_NET_FRT,
            VGUID:this._loginService.getLogin()[0].GUID,
        };
        this._loaderService.display(true);
      //  this.saveMAWBALChargesdetails("30521","15778704102")
         this._dataService.Common("Export/EXP_MST_EXPORT_MAWB_PP_CC_UPDATE", _jsonData)
             .subscribe((data: any) => {
                 if (data.Table[0].STATUS.split('#')[0]== '100') {
                     this._toasterService.toast('success', 'Alert', data.Table[0].STATUS.split('#')[1]);
                   ///  this.saveMAWBALChargesdetails("30521","15778704102")
                     this._loaderService.display(false);
                 }
                 else {
                     this._toasterService.toast('error', 'error', data.Table[0].STATUSTEXT);
                     this._loaderService.display(false);
                 }
             });
    }
    saveMAWBALChargesdetails(fkid,mawbno) {
        let strData = '';
        this.dtAirLineCharges.forEach((key)=>{
               strData += fkid
                +'@'+  mawbno
                +'@'+  key["CHARGECODE"]
                +'@'+  key["CHARGETYPE"]
                +'@'+  key["CHRGAMT1"]
                +'@'+  key["FREIGHT1"]
                +'@'+  key["CHRGAMT2"]
                +'@'+  key["FREIGHT2"]
                  + '|';

        });
        this._loaderService.display(true);
        const _jsonData = {
            MAWBNO: mawbno,
            StrData: strData
        };
        this._dataService.Common("Export/Expt_MAWB_ALCharges_IU", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                alert("Data Updated Successfully");

            });
    }
    validate() {
        if (this._loginService.getLogin()[0].ROLETYPE != 'SA') {
            if(this.hdRightsView==true && (this.NetRightsAdd==false || this.NetRights==false)){
                alert("You dont have rights to add/update");
                return false;
            }
        }

        if(this.ISAUTO_FRT_INV=="1")
        {alert("MAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This MAWB !!");return false;}
        else{this.fn_MAWB_IU(); }

        }
   }
// export class MAWBEditComponent {

//     @Input() exptno: any;
//     @Input() type: string;
//     @Output() result: EventEmitter<any> = new EventEmitter<any>();
//     @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

//     netData: any = [];
//     tdsData: any = [];
//     serviceTax: any = [];

//     pageload: boolean = false;
//     SupplierNet: any = null;
//     TariffRate: any = null;
//     NetRate: any = null;
//     CityCode: any = null;

//     CalOneDcTar: number = null;
//     CalOneDcNet: number = null;
//     CalTwoDcTar: number = null;
//     CalTwoDcNet: number = null;

//     NetRightsAdd: boolean = false;
//     NetRights: boolean = false;
//     hdNetRights: boolean = false;
//     hdRightsView: boolean = false;
//     public disableupdatebtn: boolean = true;
//     dataMode: string = null;

//     Wgt: any = null;
//     UserWgt: any = null;
//     GrossWeight: any = null;
//     UserGrossWeight: any = null;
//     isMinRate: boolean = false;
//     FreightRate: any = 'PP';
//     AgentsRate: any = '0.00';

//     //FREIGHT (BASIC)
//     TarFreightPayOn: any = 'CW';
//     TarFreightRate: any = null;
//     TarFreight: any = null;
//     TarFreightFrt: string = 'PP';
//     NetFreightPayOn: any = 'CW';
//     NetFreightRate: any = null;
//     NetFreight: any = null;
//     NetFreightFrt: string = 'PP';
//     //FSC
//     TarFscPayOn: any = null;
//     TarFscRate: any = null;
//     TarFsc: any = null;
//     TarFscFrt: string = 'PP';
//     NetFscPayOn: any = null;
//     NetFscRate: any = null;
//     NetFsc: any = null;
//     NetFscFrt: string = 'PP';
//     //IRC
//     TarIrcPayOn: any = null;
//     TarIrcRate: any = null;
//     TarIrc: any = null;
//     TarIrcFrt: string = 'PP';
//     NetIrcPayOn: any = null;
//     NetIrcRate: any = null;
//     NetIrc: any = null;
//     NetIrcFrt: string = 'PP';
//     //XRAY
//     TarXrayPayOn: any = null;
//     TarXrayRate: any = null;
//     TarXray: any = null;
//     TarXrayFrt: string = 'PP';
//     NetXrayPayOn: any = null;
//     NetXrayRate: any = null;
//     NetXray: any = null;
//     NetXrayFrt: string = 'PP';
//     //MISCELLANEOUS CHARGES
//     TarMcPayOn: any = 'CW';
//     TarMcRate: any = null;
//     TarMc: any = null;
//     TarMcFrt: string = 'PP';
//     NetMcPayOn: any = 'CW';
//     NetMcRate: any = null;
//     NetMc: any = null;
//     NetMcFrt: string = 'PP';
//     //CTG
//     TarCtgPayOn: any = 'GW';
//     TarCtgRate: any = null;
//     TarCtg: any = null;
//     TarCtgFrt: string = 'PP';
//     NetCtgPayOn: any = 'GW';
//     NetCtgRate: any = null;
//     NetCtg: any = null;
//     NetCtgFrt: string = 'PP';
//     //THC
//     TarThcPayOn: any = 'CW';
//     TarThcRate: any = null;
//     TarThc: any = null;
//     TarThcFrt: string = 'PP';
//     NetThcPayOn: any = 'GW';
//     NetThcRate: any = null;
//     NetThc: any = null;
//     NetThcFrt: string = 'PP';
//     //BUSINESS PROMOTION
//     TarBPPayOn: any = 'CW';
//     TarBPRate: any = null;
//     TarBP: any = null;
//     TarBPFrt: string = 'PP';
//     NetBPPayOn: any = 'CW';
//     NetBPRate: any = null;
//     NetBP: any = null;
//     NetBPFrt: string = 'PP';

//     //DESTIMATION TRUCKING
//     TarTruckPayOn: any = 'CW';
//     TarTruckRate: any = null;
//     TarTruck: any = null;
//     TarTruckFrt: string = 'PP';
//     NetTruckPayOn: any = 'CW';
//     NetTruckRate: any = null;
//     NetTruck: any = null;
//     NetTruckFrt: string = 'PP';

//     TarAms: any = null;
//     TarAmsFrt: any = 'PP';
//     NetAms: any = null;
//     NetAmsFrt: any = 'PP';

//     HawbTar: any = null;
//     HawbTarFrt: any = 'PP';
//     HawbNet: any = null;
//     HawbNetFrt: any = 'PP';

//     PcaTar: any = null;
//     PcaTarFrt: any = 'PP';
//     PcaNet: any = null;
//     PcaNetFrt: any = 'PP';

//     DurCarrierTar: any = null;
//     DurCarrierTarCC: any = null;
//     DurCarrierNet: any = null;
//     DurCarrierNetCC: any = null;

//     DueAgentTar: any = null;
//     DueAgentTarCC: any = null;
//     DueAgentNet: any = null;
//     DueAgentNetCC: any = null;

//     TotalTar: any = null;
//     TotalTarCC: any = null;
//     TotalNet: any = null;
//     TotalNetCC: any = null;

//     OtherTar: any = null;
//     OtherTarFrt: any = 'PP';
//     OtherNet: any = null;
//     OtherNetFrt: any = 'PP';

//     AirFrtCommission: any = null;

//     FrtRebate: any = null;

//     BusinesPromo: any = null;

//     DrpTDS: any = null;
//     TxtTDS: any = null;

//     DrpServiceTax: any = null;
//     TxtServiceTax: any = null;

//     OtherChrg1: any = null;
//     OtherAmt1_Tar: any = null;
//     OtherAmt1TarFrt: any = 'PP';
//     OtherAmt1_Net: any = null;
//     OtherAmt1NetFrt: any = 'PP';

//     OtherChrg2: any = null;
//     OtherAmt2_Tar: any = null;
//     OtherAmt2TarFrt: any = 'PP';
//     OtherAmt2_Net: any = null;
//     OtherAmt2NetFrt: any = 'PP';

//     Remark: string = null;
//     Ppchrg: string = null;
//     Ccchrg: string = null;
//     Pptotagt: string = null;
//     Cctotagt: string = null;
//     Pptotcarr: string = null;
//     Cctotcarr: string = null;
//     Pptot: string = null;
//     Cctot: string = null;
//     Othchrg: string = null;
//     ISAUTO_FRT_INV: string = "";
//     oldchblwt: any = null;
//     oldgrwt: any = null;
//     //datatableMawbRate: Array<any> = [];

//     //AIRLINE CHARGES
//     dtAirLineCharges: Array<any> = [];
//     AirLineCharges: any = [];
//     AllAirLineChargeslist: any = [];
//     ChrgTypelist: any = [];
//     ChrgTypelistold: Array<any> = [];
//     CHARGETYPE: string;
//     DELCHARGETYPE: string;
//     CHARGENAME: string;
//     EDIT_CHARGETYPE: string = "";
//     EDIT_RATE_TAR: any = null;
//     DEL_RATE_TAR: any = null;
//     RATE_TAR: any = null;
//     RATE_TAR_FRT: string = 'PP';
//     DEL_RATE_TAR_FRT: string;
//     RATE_NET: any = null;
//     EDIT_RATE_NET: any = null;
//     DEL_RATE_NET: any = null;
//     RATE_NET_FRT: string = 'PP';
//     DEL_RATE_NET_FRT: string;
//     childID: string = "0";
//     Chargeslist: any = [];
//     HAWBChargeslist: any = [];
//     makerid: string;
//     guid: string = "";
//     txtchild: string = "Add"
//     CHRGDETAILSID: string = "0";
//     FK_ID: string = "0";
//     PK_ID: string = "0";
//     tot_rate_tar_pp_da: any = null;
//     tot_rate_tar_pp_dc: any = null;
//     tot_rate_tar_cc_da: any = null;
//     tot_rate_tar_cc_dc: any = null;
//     tot_rate_net_pp_da: any = null;
//     tot_rate_net_pp_dc: any = null;
//     tot_rate_net_cc_da: any = null;
//     tot_rate_net_cc_dc: any = null;
//     dttable6: any = [];
//     //CHARGETYPE:string="";
//     constructor(private _dataService: DataService,
//         private _loginService: LoginService,
//         private _toasterService: ToastCommonService,
//         private _sharedconsig: SharedDataSerice,
//         private _loaderService: LoaderService) {
//         this.exptno = this.exptno;
//     }


//     changefunction() {
//         var verifyData = null;
//         console.log(this.type);
//         this._loginService.verifyRights(236, '')
//             .subscribe((data: any) => {
//                 this.hdRightsView = this._loginService.checkVerify('View', data);  //For verify user access
//                 this.NetRights = this._loginService.returnRights('View', data, this._loginService.getLogin()[0].ROLETYPE);
//                 this._loginService.verifyRights(264, '')
//                     .subscribe((returnData: any) => {
//                         this.NetRightsAdd = this._loginService.returnRights('Modify', returnData, this._loginService.getLogin()[0].ROLETYPE);

//                         if (this.NetRightsAdd == false) {
//                             this.NetRightsAdd = this._loginService.returnRights('Add', returnData, this._loginService.getLogin()[0].ROLETYPE);
//                         }
//                         this.hdNetRights = (this.NetRightsAdd == true) ? true : false;

//                     });

//                 // this._loaderService.display(true);
//                 this.Resetchildrcrdpageload();
//                 verifyData = data.Table;
//                 this.setDropDownData(this._sharedconsig.exportEditData.MAWBNO, this._sharedconsig.exportEditData.EXPTNO);
//                 this.setData(this._sharedconsig.exportEditData.MAWBNO, this._loginService.getLogin()[0].CMP_USERENCCODE, this._sharedconsig.exportEditData.EXPTNO, this._loginService.getLogin()[0].CMPID, this._loginService.getLogin()[0].GUID);

//             });

//     }

//     tarCheck(num: number) {
//         this.TariffRate = num;
//         //FSC
//         this.TarFscPayOn = null;
//         this.TarFscRate = "";
//         this.TarFsc = "";
//         //IRC
//         this.TarIrcPayOn = null;
//         this.TarIrcRate = "";
//         this.TarIrc = "";
//         //XRAY
//         this.TarXrayPayOn = null;
//         this.TarXrayRate = "";
//         this.TarXray = "";
//     }

//     netCheck(num: number) {
//         this.NetRate = num;
//         //FSC
//         this.NetFscPayOn = null;
//         this.NetFscRate = "";
//         this.NetFsc = "";
//         //IRC
//         this.NetIrcPayOn = null;
//         this.NetIrcRate = "";
//         this.NetIrc = "";
//         //XRAY
//         this.NetXrayPayOn = null;
//         this.NetXrayRate = "";
//         this.NetXray = "";
//     }

//     calOneTarCheck(num: number) {
//         this.CalOneDcTar = num;
//     }

//     calOneNetCheck(num: number) {
//         this.CalOneDcNet = num;
//     }

//     calTwoTarCheck(num: number) {
//         this.CalTwoDcTar = num;
//     }

//     calTwoNetCheck(num: number) {
//         this.CalTwoDcNet = num;
//     }

//     changeFreight(typ) {
//         this.FreightRate = typ;
//     }

//     fn_PageLoad() {
//         let CWt = this.UserWgt;
//         let GWt = this.UserGrossWeight;

//         if (Math.abs(CWt) < 151) // || Math.abs(GWt) < 151)---LAST CHANGES
//         {
//             this.fn_Load_150_check();
//         }
//         else {
//             this.HawbTar = "150.00";
//             this.PcaTar = "250.00";
//             this.fn_MC_CTG_Tar();
//             this.fn_THC_Tar();
//             this.fn_ChangeChareableAsTar();
//             if (this.hdNetRights == true) {
//                 this.HawbNet = "150.00";
//                 this.PcaNet = "250.00";
//                 // this.HawbNet = true;
//                 // this.PcaNet = false;
//                 this.fn_MC_CTG_Net();
//                 this.fn_THC_Net();
//                 this.fn_ChangeChareableAsNet();
//             }
//         }
//     }

//     fn_Load_150_check() {
//         // this.TarFreightRate = "";
//         // this.TarFscRate = "";
//         // this.TarIrcRate = "";
//         // this.TarXrayRate = "";
//         // this.TarMcRate = "";
//         // this.TarCtgRate = "";
//         // this.TarThcRate = "";
//         // this.TarBPRate = "";

//         this.fn_THC_Tar();
//         this.fn_ChangeChareableAsTar();

//         if (this.hdNetRights == true) {
//             // this.NetFreightRate = "";
//             // this.NetFscRate = "";
//             // this.NetIrcRate = "";
//             // this.NetXrayRate = "";
//             // this.NetMcRate = "";
//             // this.NetCtgRate = "";
//             // this.NetThcRate = "";
//             this.fn_THC_Net();
//             this.fn_ChangeChareableAsNet();
//         }
//     }
//     GetChrgType(chrgid, chrgindex) {
//         //for (let i = 0; i < this.dtAirLineCharges.length; i++) {
//         //this.ChrgTypelistold = this.AllChrgTypelist.filter((code: any) => code.DataValueField === chrgid);
//         // this.ChrgTypelist[chrgindex] =this.AllChrgTypelist.filter((code: any) => code.DataValueField === chrgid);

//         //console.log(this.AllChrgTypelist.filter((code: any) => code.DataValueField === chrgid.split("|")[0]));
//         // }
//     }
//     AddMAWBALCharges() {
//         if (this.CHARGETYPE == '' || this.CHARGETYPE == undefined) {
//             alert("Please select Charge Type.")
//             return false;
//         }
//         if (this.CHARGENAME == '' || this.CHARGENAME == undefined) {
//             alert("Please select Charge. ")
//             return false;
//         }
//         if (this.RATE_TAR == null) {
//             alert("Please enter Tariff Rate. ")
//             return false;
//         }
//         if (this.RATE_TAR_FRT == '') {
//             alert("Please enter Tariff Rate Freight. ")
//             return false;
//         }
//         if (this.PK_ID == "0") {
//             if (this.Chargeslist.length > "0") {
//                 let chrgnm: any = []
//                 chrgnm = this.Chargeslist.filter((code: any) => code.FK_CHARGEID === parseInt(this.CHARGENAME.split("|")[0]))
//                 if (chrgnm.length > "0") {
//                     this._toasterService.toast('warning', 'warning', 'Same Charge already Exists!');
//                     return false;
//                 }
//             }
//         }
//         const jsonchild = {
//             PK_ID: this.PK_ID,
//             FKID: this.FK_ID,
//             CHRGDETAILSID: this.CHRGDETAILSID,
//             MAWBNO: this._sharedconsig.exportEditData.MAWBNO,
//             FK_CHARGEID: this.CHARGENAME.split("|")[0],
//             CHARGETYPE: this.CHARGETYPE,
//             RATE_TAR: this.RATE_TAR,
//             RATE_TAR_FRT: this.RATE_TAR_FRT,
//             RATE_NET: this.RATE_NET,
//             RATE_NET_FRT: this.RATE_NET_FRT,
//             MAKERID: this._loginService.getLogin()[0].CMPID,
//             VGUID: this._loginService.getLogin()[0].GUID,
//         }
//         this._dataService.Common("Export/EXPT_MAWB_PRINT_RATE_AIRLINE_CHARGES_TMPIU", jsonchild)
//             .subscribe((data: any) => {
//                 if (data.Table[0].STATUS == "100") {
//                     this.Chargeslist = data.Table1;
//                     this.dttable6 = data.Table6;
//                     if (this.EDIT_CHARGETYPE != undefined) {
//                         this.fn_CalculateAlCharges_Tar(data.Table6);
//                     }
//                     else {
//                         this.fn_CalculateAlCharges_Add(data.Table6);
//                     }

//                     //this.fn_CalculateAlCharges_Net(data.Table6)
//                     this.tot_rate_tar_pp_da = data.Table2[0].RATE_TAR_TOTAL_PP_DA;
//                     this.tot_rate_net_pp_da = data.Table2[0].RATE_NET_TOTAL_PP_DA;
//                     this.tot_rate_tar_cc_da = data.Table3[0].RATE_TAR_TOTAL_CC_DA;
//                     this.tot_rate_net_cc_da = data.Table3[0].RATE_NET_TOTAL_CC_DA;
//                     this.tot_rate_tar_pp_dc = data.Table4[0].RATE_TAR_TOTAL_PP_DC;
//                     this.tot_rate_net_pp_dc = data.Table4[0].RATE_NET_TOTAL_PP_DC;
//                     this.tot_rate_tar_cc_dc = data.Table5[0].RATE_TAR_TOTAL_CC_DC;
//                     this.tot_rate_net_cc_dc = data.Table5[0].RATE_NET_TOTAL_CC_DC;
//                     this.Resetchildrcrd();
//                     //    this.loaderService.display(false);
//                 }
//                 else {
//                     this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT);
//                     // this.loaderService.display(false);
//                 }
//             });
//     }
//     ResetMAWBCharges() {
//         this.CHARGETYPE = ""
//         this.CHARGENAME = ""
//         this.RATE_TAR = ""
//         //  this.RATE_TAR_FRT=""
//         this.RATE_NET = ""
//         //this.RATE_NET_FRT=""
//     }
//     fn_CalculateAlCharges_Add(dtbl) {
//         if (dtbl[0].CHARGETYPE == 'DA' && dtbl[0].RATE_TAR_FRT == 'PP') {
//             this.DueAgentNet = Math.abs(this.DueAgentNet) + Math.abs(dtbl[0].RATE_NET);
//             this.TotalNet = Math.abs(this.TotalNet) + Math.abs(dtbl[0].RATE_NET);
//             this.DueAgentTar = Math.abs(this.DueAgentTar) + Math.abs(dtbl[0].RATE_TAR);
//             this.TotalTar = Math.abs(this.TotalTar) + Math.abs(dtbl[0].RATE_TAR);
//         }
//         if (dtbl[0].CHARGETYPE == 'DA' && dtbl[0].RATE_TAR_FRT == 'CC') {
//             this.DueAgentNetCC = Math.abs(this.DueAgentNetCC) + Math.abs(dtbl[0].RATE_NET);
//             this.TotalNet = Math.abs(this.TotalNet) + Math.abs(dtbl[0].RATE_NET);
//             this.DueAgentTarCC = Math.abs(this.DueAgentTarCC) + Math.abs(dtbl[0].RATE_TAR);
//             this.TotalTar = Math.abs(this.TotalTar) + Math.abs(dtbl[0].RATE_TAR);
//         }
//         if (dtbl[0].CHARGETYPE == 'DC' && dtbl[0].RATE_TAR_FRT == 'PP') {
//             this.DurCarrierNet = Math.abs(this.DurCarrierNet) + Math.abs(dtbl[0].RATE_NET);
//             this.TotalNet = Math.abs(this.TotalNet) + Math.abs(dtbl[0].RATE_NET);
//             this.DurCarrierTar = Math.abs(this.DurCarrierTar) + Math.abs(dtbl[0].RATE_TAR);
//             this.TotalTar = Math.abs(this.TotalTar) + Math.abs(dtbl[0].RATE_TAR);
//         }
//         if (dtbl[0].CHARGETYPE == 'DC' && dtbl[0].RATE_TAR_FRT == 'CC') {
//             this.DurCarrierNetCC = Math.abs(this.DurCarrierNetCC) + Math.abs(dtbl[0].RATE_NET);
//             this.TotalNet = Math.abs(this.TotalNet) + Math.abs(dtbl[0].RATE_NET);
//             this.DurCarrierTarCC = Math.abs(this.DurCarrierTarCC) + Math.abs(dtbl[0].RATE_TAR);
//             this.TotalTar = Math.abs(this.TotalTar) + Math.abs(dtbl[0].RATE_TAR);
//         }
//     }
//     fn_CalculateAlCharges_Net(dtbl) {
//         if (dtbl[0].CHARGETYPE == 'DA' && dtbl[0].RATE_TAR_FRT == 'PP') {
//             this.DueAgentNet = (Math.abs(this.DueAgentNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//             this.TotalNet = (Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//         }
//         if (dtbl[0].CHARGETYPE == 'DA' && dtbl[0].RATE_TAR_FRT == 'CC') {
//             this.DueAgentNetCC = (Math.abs(this.DueAgentNetCC) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//             this.TotalNet = (Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//         }
//         if (dtbl[0].CHARGETYPE == 'DC' && dtbl[0].RATE_TAR_FRT == 'PP') {
//             this.DurCarrierNet = (Math.abs(this.DurCarrierNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//             this.TotalNet = (Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//         }
//         if (dtbl[0].CHARGETYPE == 'DC' && dtbl[0].RATE_TAR_FRT == 'CC') {
//             this.DurCarrierNetCC = Math.abs(this.DurCarrierNetCC) + Math.abs(dtbl[0].RATE_NET);
//             this.TotalNet = Math.abs(this.TotalNet) + Math.abs(dtbl[0].RATE_NET);

//         }
//     }
//     fn_CalculateAlCharges_Tar(dtbl) {
//         if (dtbl[0].CHARGETYPE == 'DA' && dtbl[0].RATE_TAR_FRT == 'PP' && this.EDIT_CHARGETYPE == 'DA') {
//             this.DueAgentTar = (Math.abs(this.DueAgentTar) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
//             this.TotalTar = (Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
//             this.DueAgentNet = (Math.abs(this.DueAgentNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//             this.TotalNet = (Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//         }
//         if (dtbl[0].CHARGETYPE == 'DA' && dtbl[0].RATE_TAR_FRT == 'CC' && this.EDIT_CHARGETYPE == 'DA') {
//             this.DueAgentTarCC = (Math.abs(this.DueAgentTarCC) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
//             this.TotalTar = (Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
//             this.DueAgentNetCC = (Math.abs(this.DueAgentNetCC) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//             this.TotalNet = (Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//         }
//         if (dtbl[0].CHARGETYPE == 'DA' && dtbl[0].RATE_TAR_FRT == 'CC' && this.EDIT_CHARGETYPE == 'DC') {
//             this.DurCarrierTarCC = (Math.abs(this.DurCarrierTarCC) - Math.abs(this.EDIT_RATE_TAR));
//             this.DurCarrierNetCC = (Math.abs(this.DurCarrierNetCC) - Math.abs(this.EDIT_RATE_TAR));
//             this.TotalTar = (Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_NET));
//             this.TotalNet = (Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET));
//             this.DueAgentNetCC = Math.abs(this.DueAgentNetCC) + Math.abs(dtbl[0].RATE_NET);
//             this.TotalNet = Math.abs(this.TotalNet) + Math.abs(dtbl[0].RATE_NET);
//             this.DueAgentTarCC = Math.abs(this.DueAgentTarCC) + Math.abs(dtbl[0].RATE_TAR);
//             this.TotalTar = Math.abs(this.TotalTar) + Math.abs(dtbl[0].RATE_TAR);
//         }
//         if (dtbl[0].CHARGETYPE == 'DA' && dtbl[0].RATE_TAR_FRT == 'PP' && this.EDIT_CHARGETYPE == 'DC') {
//             this.DueAgentTar = Math.abs(this.DueAgentTar) + Math.abs(dtbl[0].RATE_TAR);
//             this.TotalTar = Math.abs(this.TotalTar) + Math.abs(dtbl[0].RATE_TAR);
//             this.DueAgentNet = Math.abs(this.DueAgentNet) + Math.abs(dtbl[0].RATE_NET);
//             this.TotalNet = Math.abs(this.TotalNet) + Math.abs(dtbl[0].RATE_NET);
//             this.DurCarrierTarCC = (Math.abs(this.DurCarrierTarCC) - Math.abs(this.EDIT_RATE_TAR));
//             this.DurCarrierNetCC = (Math.abs(this.DurCarrierNetCC) - Math.abs(this.EDIT_RATE_NET));
//             this.TotalTar = (Math.abs(this.TotalTar) + Math.abs(this.EDIT_RATE_TAR));
//             this.TotalNet = (Math.abs(this.TotalNet) + Math.abs(this.EDIT_RATE_NET));
//         }
//         if (dtbl[0].CHARGETYPE == 'DC' && dtbl[0].RATE_TAR_FRT == 'PP' && this.EDIT_CHARGETYPE == 'DC') {
//             this.DurCarrierTar = (Math.abs(this.DurCarrierTar) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
//             this.TotalTar = (Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
//             this.DurCarrierNet = (Math.abs(this.DurCarrierNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//             this.TotalNet = (Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
//         }
//         if (dtbl[0].CHARGETYPE == 'DC' && dtbl[0].RATE_TAR_FRT == 'CC' && this.EDIT_CHARGETYPE == 'DC') {
//             this.DurCarrierTarCC = (Math.abs(this.DurCarrierTarCC) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
//             this.TotalTar = (Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
//             this.DurCarrierNetCC = (Math.abs(this.DurCarrierNetCC) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
//             this.TotalNet = (Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
//         }
//         if (dtbl[0].CHARGETYPE == 'DC' && dtbl[0].RATE_TAR_FRT == 'CC' && this.EDIT_CHARGETYPE == 'DA') {
//             this.DueAgentNetCC = (Math.abs(this.DueAgentNetCC) - Math.abs(this.EDIT_RATE_NET));
//             this.TotalNet = (Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET));
//             this.DueAgentTarCC = (Math.abs(this.DueAgentTarCC) - Math.abs(this.EDIT_RATE_TAR));
//             this.TotalTar = (Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR));
//             this.DurCarrierTarCC = (Math.abs(this.DurCarrierTarCC) + Math.abs(dtbl[0].RATE_TAR));
//             this.DurCarrierNetCC = (Math.abs(this.DurCarrierNetCC) + Math.abs(dtbl[0].RATE_NET));
//             this.TotalTar = (Math.abs(this.TotalTar) + Math.abs(dtbl[0].RATE_TAR));
//             this.TotalNet = (Math.abs(this.TotalNet) + Math.abs(dtbl[0].RATE_NET));
//         }
//         if (dtbl[0].CHARGETYPE == 'DC' && dtbl[0].RATE_TAR_FRT == 'PP' && this.EDIT_CHARGETYPE == 'DA') {
//             this.DueAgentNet = (Math.abs(this.DueAgentNet) - Math.abs(this.EDIT_RATE_NET));
//             this.TotalNet = (Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET));
//             this.DueAgentTar = (Math.abs(this.DueAgentTar) - Math.abs(this.EDIT_RATE_TAR));
//             this.TotalTar = (Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR));
//             this.DurCarrierTar = (Math.abs(this.DurCarrierTar) + Math.abs(dtbl[0].RATE_TAR));
//             this.DurCarrierNet = (Math.abs(this.DurCarrierNet) + Math.abs(dtbl[0].RATE_NET));
//             this.TotalTar = (Math.abs(this.TotalTar) + Math.abs(dtbl[0].RATE_TAR));
//             this.TotalNet = (Math.abs(this.TotalNet) + Math.abs(dtbl[0].RATE_NET));
//         }
//     }
//     Resetchildrcrd() {
//         this.CHARGETYPE = undefined;
//         this.CHARGENAME = "";
//         this.RATE_TAR = "";
//         this.RATE_TAR_FRT = "";
//         this.RATE_NET = "";
//         this.RATE_NET_FRT = "";
//         this.txtchild = "Add";
//         this.CHRGDETAILSID = "0";
//         this.PK_ID = "0";
//         this.FK_ID = "0";
//         this.EDIT_CHARGETYPE = undefined;

//     }
//     Resetchildrcrdpageload() {
//         this.CHARGETYPE = undefined;
//         this.CHARGENAME = "";
//         this.RATE_TAR = "";
//         this.RATE_NET = "";
//         this.txtchild = "Add";
//         this.CHRGDETAILSID = "0";
//         this.PK_ID = "0";
//         this.FK_ID = "0";
//         this.EDIT_CHARGETYPE = undefined;

//     }
//     Editchildrecd(id) {
//         let filterData = this.Chargeslist.filter((filter) => filter.PK_ID == id)[0];
//         //this.fk=filterData.ID;
//         this.PK_ID = filterData.PK_ID,
//             this.FK_ID = filterData.FK_ID,
//             this.CHARGETYPE = filterData.CHARGETYPE;
//         this.CHRGDETAILSID = filterData.FK_CHRGDETAILSID;
//         this.AirLineCharges = this.AllAirLineChargeslist.filter((code: any) => code.DataValueField.split("|")[1] === this.CHARGETYPE);
//         this.CHARGENAME = filterData.FK_CHARGEID + '|' + filterData.CHARGETYPE;
//         this.RATE_TAR = filterData.RATE_TAR;
//         this.RATE_TAR_FRT = filterData.RATE_TAR_FRT;
//         this.RATE_NET = filterData.RATE_NET;
//         this.RATE_NET_FRT = filterData.RATE_NET_FRT;
//         this.EDIT_RATE_TAR = filterData.RATE_TAR;
//         this.EDIT_RATE_NET = filterData.RATE_NET;
//         this.EDIT_CHARGETYPE = filterData.CHARGETYPE;
//         this.txtchild = "Update";
//     }

//     deletechildrecd(id, chrgdtlsid) {

//         if (confirm('Are you sure want to delete the record ?')) {
//             this._loaderService.display(true);
//             const jsondelete = { ID: id, VGUID: this._loginService.getLogin()[0].GUID, FK_CHRGDTLSID: chrgdtlsid }
//             this._dataService.getData("Export/EXPT_MAWB_PRINT_RATE_AIRLINE_CHARGES_TMP_DEL", jsondelete)
//                 .subscribe((data: any) => {

//                     if (data.Table[0].STATUS == "100") {
//                         this.Chargeslist = data.Table
//                         this.DELCHARGETYPE = data.Table1[0].CHARGETYPE;
//                         this.DEL_RATE_TAR = data.Table1[0].RATE_TAR;
//                         this.DEL_RATE_TAR_FRT = data.Table1[0].RATE_TAR_FRT;
//                         this.DEL_RATE_NET = data.Table1[0].RATE_NET;
//                         this.DEL_RATE_NET_FRT = data.Table1[0].RATE_NET_FRT;
//                         if (this.DELCHARGETYPE == 'DA' && this.DEL_RATE_TAR_FRT == 'PP') {
//                             this.DueAgentTar = (Math.abs(this.DueAgentTar) - Math.abs(this.DEL_RATE_TAR));
//                             this.DueAgentNet = (Math.abs(this.DueAgentNet) - Math.abs(this.DEL_RATE_NET));
//                             this.TotalTar = (Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR));
//                             this.TotalNet = (Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET));
//                         }

//                         if (this.DELCHARGETYPE == 'DA' && this.DEL_RATE_TAR_FRT == 'CC') {
//                             this.DueAgentTarCC = (Math.abs(this.DueAgentTarCC) - Math.abs(this.DEL_RATE_TAR));
//                             this.DueAgentNetCC = (Math.abs(this.DueAgentNetCC) - Math.abs(this.DEL_RATE_NET));
//                             this.TotalTar = (Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR));
//                             this.TotalNet = (Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET));
//                         }
//                         if (this.DELCHARGETYPE == 'DC' && this.DEL_RATE_TAR_FRT == 'PP') {
//                             this.DurCarrierTar = (Math.abs(this.DurCarrierTar) - Math.abs(this.DEL_RATE_TAR));
//                             this.DurCarrierNet = (Math.abs(this.DurCarrierNet) - Math.abs(this.DEL_RATE_NET));
//                             this.TotalTar = (Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR));
//                             this.TotalNet = (Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET));
//                         }
//                         if (this.DELCHARGETYPE == 'DC' && this.DEL_RATE_TAR_FRT == 'CC') {
//                             this.DurCarrierTarCC = (Math.abs(this.DurCarrierTarCC) - Math.abs(this.DEL_RATE_TAR));
//                             this.DurCarrierNetCC = (Math.abs(this.DurCarrierNetCC) - Math.abs(this.DEL_RATE_NET));
//                             this.TotalTar = (Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR));
//                             this.TotalNet = (Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET));
//                         }
//                         this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT);
//                         this._loaderService.display(false);
//                     }
//                     else {
//                         this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT);
//                         this._loaderService.display(false);
//                     }


//                 });
//         }
//         else {
//             return false;
//             this._loaderService.display(false);
//         }
//     }

//     GetChrges(chrgtype) {
//         this.AirLineCharges = this.AllAirLineChargeslist.filter((code: any) => code.DataValueField.split("|")[1] === chrgtype);
//     }
//     changeNetRate(rate1) {
//         this.RATE_NET = rate1;
//     }
//     changeNetFreight(frt1) {
//         this.RATE_NET_FRT = frt1
//     }
//     fn_ChangeChareableAsTar() {

//         if (this.TariffRate == 1) {
//             this.TarFscPayOn = null;
//             this.TarFscRate = "";
//             this.TarIrcPayOn = null;
//             this.TarIrcRate = "";
//             this.TarXrayPayOn = null;
//             this.TarXrayRate = "";
//             this.TarFsc = "";
//             this.TarIrc = "";
//             this.TarXray = "";
//         }
//         else {
//             let CWt = this.UserWgt;
//             let GWt = this.UserGrossWeight;
//             if (Math.abs(CWt) < 151) // || Math.abs(GWt) < 151)---LAST CHANGES
//             {


//             }
//             else {

//             }
//         }
//         this.fnCalculate_Tar();
//     }
//     fn_ChangeChareableAsNet() {
//         let CWt = this.UserWgt;
//         let GWt = this.UserGrossWeight;
//         if (this.NetRate == 1) {
//             this.NetFscPayOn = null;
//             this.NetFscRate = "";
//             this.NetIrcPayOn = null;
//             this.NetIrcRate = "";
//             this.NetXrayPayOn = null;
//             this.NetXrayRate = "";
//             this.NetFsc = "";
//             this.NetIrc = "";
//             this.NetXray = "";
//         }
//         else {
//             CWt = this.UserWgt
//             GWt = this.UserGrossWeight
//             if (Math.abs(CWt) < 151) // || Math.abs(GWt) < 151)---LAST CHANGES
//             {

//             }
//             else {

//             }
//         }
//         this.fnCalculate_Net()
//     }

//     setDropDownData(mawbno, exptno) {
//         const _jsonData = {
//             Type1: mawbno.substring(0, 3),
//             Type2: exptno.substring(2, 5)
//         };
//         this._loaderService.display(true);
//         this.exptno = exptno;
//         this._dataService.Common("Export/ConsignmentMAWBFill_DROPDOWN", _jsonData)
//             .subscribe((data: any) => {
//                 this._loaderService.display(false);
//                 this.netData = data.Table;
//                 this.tdsData = data.Table1;
//                 this.serviceTax = data.Table2;
//                 //this.AirLineCharges=data.Table3;
//                 this.AllAirLineChargeslist = data.Table3
//                 this.ChrgTypelist = data.Table4;
//             },
//                 (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
//                 () => { });
//     }

//     setData(mawbno, code, exptno, makerid, guid) {
//         this.makerid = makerid;
//         this.guid = guid;
//         this._loaderService.display(true);
//         const _jsonData = {
//             Type1: mawbno,
//             Type2: code,
//             Type3: exptno.substring(2, 5),
//             GUID: this._loginService.getLogin()[0].GUID,
//             CmpId: this._loginService.getLogin()[0].CMPID,
//             RoleType: this._loginService.getLogin()[0].ROLETYPE,
//             CodeCity: this._loginService.getLogin()[0].CMPCODE + '' + this._loginService.getLogin()[0].CITYCODE1,

//         };

//         this._dataService.Common("Export/Consignment_MAWB_PP_CC_View", _jsonData)
//             .subscribe((data: any) => {

//                 this.CityCode = data.Table1[0].CITYCODE;
//                 this.Wgt = data.Table1[0].CHRGWT;
//                 this.UserWgt = data.Table1[0].CHBL_WGT_USER;
//                 this.oldchblwt = this.UserWgt;
//                 this.GrossWeight = data.Table1[0].GROSSWT;
//                 this.oldgrwt = this.GrossWeight;
//                 this.UserGrossWeight = data.Table1[0].GROSS_WGT_USER;
//                 this.isMinRate = (data.Table1[0].ISMIN == 'Y') ? true : false;
//                 this.FreightRate = (data.Table1[0].FREIGHT != '') ? data.Table1[0].FREIGHT : null;
//                 this.SupplierNet = (data.Table1[0].SUPPLIER_NET != '') ? data.Table1[0].SUPPLIER_NET : null;
//                 this.AgentsRate = (data.Table1[0].AGENTS_RATE != '') ? data.Table1[0].AGENTS_RATE : 0.00;
//                 this.TariffRate = (data.Table1[0].FRT_CHARGEABLE_AS_TAR == 'FS') ? 2 : 1;
//                 this.NetRate = (data.Table1[0].FRT_CHARGEABLE_AS_NET == 'FS') ? 2 : 1;


//                 //FREIGHT (BASIC)
//                 this.TarFreightPayOn = (data.Table1[0].FRT_PAYABLE_ON_TAR != '') ? data.Table1[0].FRT_PAYABLE_ON_TAR : 'CW';
//                 this.TarFreightRate = data.Table1[0].FRT_RATE_PER_KG_TAR;
//                 this.TarFreight = data.Table1[0].FRT_RATE_TAR;
//                 this.NetFreightPayOn = (data.Table1[0].FRT_PAYABLE_ON_NET != '') ? data.Table1[0].FRT_PAYABLE_ON_NET : 'CW';
//                 this.NetFreightRate = data.Table1[0].FRT_RATE_PER_KG_NET;
//                 this.NetFreight = data.Table1[0].FRT_RATE_NET;
//                 //FSC
//                 this.TarFscPayOn = (data.Table1[0].FSC_PAYABLE_ON_TAR != '') ? data.Table1[0].FSC_PAYABLE_ON_TAR : null;
//                 this.TarFscRate = data.Table1[0].FSC_RATE_PER_KG_TAR;
//                 this.TarFsc = data.Table1[0].FSC_RATE_TAR;
//                 this.NetFscPayOn = (data.Table1[0].FSC_PAYABLE_ON_NET != '') ? data.Table1[0].FSC_PAYABLE_ON_NET : null;
//                 this.NetFscRate = data.Table1[0].FSC_RATE_PER_KG_NET;
//                 this.NetFsc = data.Table1[0].FSC_RATE_NET;
//                 //IRC
//                 this.TarIrcPayOn = (data.Table1[0].IRC_PAYABLE_ON_TAR != '') ? data.Table1[0].IRC_PAYABLE_ON_TAR : null;
//                 this.TarIrcRate = data.Table1[0].IRC_RATE_PER_KG_TAR;
//                 this.TarIrc = data.Table1[0].IRC_RATE_TAR;
//                 this.NetIrcPayOn = (data.Table1[0].IRC_PAYABLE_ON_NET != '') ? data.Table1[0].IRC_PAYABLE_ON_NET : null;
//                 this.NetIrcRate = data.Table1[0].IRC_RATE_PER_KG_NET;
//                 this.NetIrc = data.Table1[0].IRC_RATE_NET;
//                 //XRAY
//                 this.TarXrayPayOn = (data.Table1[0].XRAY_PAYABLE_ON_TAR != '') ? data.Table1[0].XRAY_PAYABLE_ON_TAR : null;
//                 this.TarXrayRate = data.Table1[0].XRAY_RATE_PER_KG_TAR;
//                 this.TarXray = data.Table1[0].XRAY_RATE_TAR;
//                 this.NetXrayPayOn = (data.Table1[0].XRAY_PAYABLE_ON_NET != '') ? data.Table1[0].XRAY_PAYABLE_ON_NET : null;
//                 this.NetXrayRate = data.Table1[0].XRAY_RATE_PER_KG_NET;
//                 this.NetXray = data.Table1[0].XRAY_RATE_NET;
//                 //MISCELLANEOUS CHARGES
//                 this.TarMcPayOn = (data.Table1[0].MC_PAYABLE_ON_TAR != '') ? data.Table1[0].MC_PAYABLE_ON_TAR : null;
//                 this.TarMcRate = data.Table1[0].MC_RATE_PER_KG_TAR;
//                 this.TarMc = data.Table1[0].MC_RATE_TAR;
//                 this.NetMcPayOn = (data.Table1[0].MC_PAYABLE_ON_NET != '') ? data.Table1[0].MC_PAYABLE_ON_NET : null;
//                 this.NetMcRate = data.Table1[0].MC_RATE_PER_KG_NET;
//                 this.NetMc = data.Table1[0].MC_RATE_NET;
//                 //CTG
//                 this.TarCtgPayOn = (data.Table1[0].CTG_PAYABLE_ON_TAR != '') ? data.Table1[0].CTG_PAYABLE_ON_TAR : 'CW';
//                 this.TarCtgRate = data.Table1[0].CTG_RATE_PER_KG_TAR;
//                 this.TarCtg = data.Table1[0].CTG_RATE_TAR;
//                 this.NetCtgPayOn = (data.Table1[0].CTG_PAYABLE_ON_NET != '') ? data.Table1[0].CTG_PAYABLE_ON_NET : 'CW';
//                 this.NetCtgRate = data.Table1[0].CTG_RATE_PER_KG_NET;
//                 this.NetCtg = data.Table1[0].CTG_RATE_NET;
//                 //THC
//                 this.TarThcPayOn = (data.Table1[0].THC_PAYABLE_ON_TAR != '') ? data.Table1[0].THC_PAYABLE_ON_TAR : 'CW';
//                 this.TarThcRate = data.Table1[0].THC_RATE_PER_KG_TAR;
//                 this.TarThc = data.Table1[0].THC_RATE_TAR;
//                 this.NetThcPayOn = (data.Table1[0].THC_PAYABLE_ON_NET != '') ? data.Table1[0].THC_PAYABLE_ON_NET : 'CW';
//                 this.NetThcRate = data.Table1[0].THC_RATE_PER_KG_NET;
//                 this.NetThc = data.Table1[0].THC_RATE_NET;
//                 //BUSINESS PROMOTION
//                 this.TarBPPayOn = (data.Table1[0].BP_PAYABLE_ON_TAR != '') ? data.Table1[0].BP_PAYABLE_ON_TAR : null;
//                 this.TarBPRate = data.Table1[0].BP_RATE_PER_KG_TAR;
//                 this.TarBP = data.Table1[0].BP_RATE_TAR;
//                 this.NetBPPayOn = (data.Table1[0].BP_PAYABLE_ON_NET != '') ? data.Table1[0].BP_PAYABLE_ON_NET : null;
//                 this.NetBPRate = data.Table1[0].BP_RATE_PER_KG_NET;
//                 this.NetBP = data.Table1[0].BP_RATE_NET;

//                 // if (this.UserWgt > 151) {
//                 //     this.tarCheck(this.TariffRate);
//                 //     this.tarCheck(this.NetRate);
//                 // }

//                 this.TarAms = data.Table1[0].AMS_RATE_TAR;
//                 this.TarAmsFrt = (data.Table1[0].AMS_RATE_TAR_FRT) ? data.Table1[0].AMS_RATE_TAR_FRT : null;
//                 this.NetAms = data.Table1[0].AMS_RATE_NET;
//                 this.NetAmsFrt = (data.Table1[0].AMS_RATE_NET_FRT) ? data.Table1[0].AMS_RATE_NET_FRT : null;

//                 this.HawbTar = data.Table1[0].HAWB_TAR;
//                 if (data.Table1[0].HAWB_RATE_TAR_FRT != "") { this.HawbTarFrt = data.Table1[0].HAWB_RATE_TAR_FRT; }
//                 this.HawbNet = data.Table1[0].HAWB_NET;
//                 if (data.Table1[0].HAWB_RATE_NET_FRT != "") { this.HawbNetFrt = data.Table1[0].HAWB_RATE_NET_FRT; }

//                 this.PcaTar = data.Table1[0].PCA_TAR;
//                 if (data.Table1[0].PCA_RATE_TAR_FRT != "") { this.PcaTarFrt = data.Table1[0].PCA_RATE_TAR_FRT; }
//                 this.PcaNet = data.Table1[0].PCA_NET;
//                 if (data.Table1[0].PCA_RATE_NET_FRT != "") { this.PcaNetFrt = data.Table1[0].PCA_RATE_NET_FRT; }

//                 this.DurCarrierTar = data.Table1[0].DUE_CARRIER_TAR;
//                 this.DurCarrierTarCC = data.Table1[0].DUE_CARRIER_TAR_CC;
//                 this.DurCarrierNet = data.Table1[0].DUE_CARRIER_NET;
//                 this.DurCarrierNetCC = data.Table1[0].DUE_CARRIER_NET_CC;

//                 this.DueAgentTar = data.Table1[0].DUE_AGENT_TAR;
//                 this.DueAgentTarCC = data.Table1[0].DUE_AGENT_TAR_CC;
//                 this.DueAgentNet = data.Table1[0].DUE_AGENT_NET;
//                 this.DueAgentNetCC = data.Table1[0].DUE_AGENT_NET_CC;

//                 this.TotalTar = data.Table1[0].TOTAL_TAR;
//                 this.TotalTarCC = data.Table1[0].TOTAL_TAR_CC;
//                 this.TotalNet = data.Table1[0].TOTAL_NET;
//                 this.TotalNetCC = data.Table1[0].TOTAL_NET_CC;
//                 this.OtherTar = data.Table1[0].OTHER_CHRG_TAR;
//                 this.OtherTarFrt = (data.Table1[0].OTHER_RATE_TAR_FRT != '') ? data.Table1[0].OTHER_RATE_TAR_FRT : 'PP';
//                 this.OtherNet = data.Table1[0].OTHER_CHRG_NET;
//                 this.OtherNetFrt = (data.Table1[0].OTHER_RATE_NET_FRT != '') ? data.Table1[0].OTHER_RATE_NET_FRT : 'PP';
//                 this.AirFrtCommission = data.Table1[0].AIR_FRT_COMM_NET;
//                 this.FrtRebate = data.Table1[0].FRT_REBATE_NET;
//                 this.BusinesPromo = data.Table1[0].BUSINES_PROMO_NET;
//                 this.DrpTDS = data.Table1[0].TDS_ACCTCODE;
//                 this.TxtTDS = data.Table1[0].TDS_NET;
//                 this.DrpServiceTax = data.Table1[0].SERVICETAX_ACCTCODE;
//                 this.TxtServiceTax = data.Table1[0].SERVICE_TAX_NET;
//                 this.OtherChrg1 = data.Table1[0].OTHER_NAME1;
//                 this.OtherAmt1_Tar = data.Table1[0].OTHER_RATE1_TAR;
//                 this.CalOneDcTar = (data.Table1[0].OTHER_RATE1_TAR_CAL == 'DA') ? 2 : 1;
//                 this.OtherAmt1TarFrt = (data.Table1[0].OTHER_RATE1_TAR_FRT != '') ? data.Table1[0].OTHER_RATE1_TAR_FRT : 'PP';
//                 this.OtherAmt1_Net = data.Table1[0].OTHER_RATE1_NET;
//                 this.CalOneDcNet = (data.Table1[0].OTHER_RATE1_NET_CAL == 'DA') ? 2 : 1;
//                 this.OtherAmt1NetFrt = (data.Table1[0].OTHER_RATE1_NET_FRT != '') ? data.Table1[0].OTHER_RATE1_NET_FRT : 'PP';
//                 this.OtherChrg2 = data.Table1[0].OTHER_NAME2;
//                 this.OtherAmt2_Tar = data.Table1[0].OTHER_RATE2_TAR;
//                 this.CalTwoDcTar = (data.Table1[0].OTHER_RATE2_TAR_CAL == 'DA') ? 2 : 1;
//                 this.OtherAmt2TarFrt = (data.Table1[0].OTHER_RATE2_TAR_FRT != '') ? data.Table1[0].OTHER_RATE2_TAR_FRT : 'PP';
//                 this.OtherAmt2_Net = data.Table1[0].OTHER_RATE2_NET;
//                 this.CalTwoDcNet = (data.Table1[0].OTHER_RATE2_NET_CAL == 'DA') ? 2 : 1;
//                 this.OtherAmt2NetFrt = (data.Table1[0].OTHER_RATE2_NET_FRT != '') ? data.Table1[0].OTHER_RATE2_NET_FRT : 'PP';
//                 this.Remark = data.Table1[0].REMARK;
//                 this.Ppchrg = data.Table1[0].PPCHRG;
//                 this.Ccchrg = data.Table1[0].CCCHRG;
//                 this.Pptotagt = data.Table1[0].PPTOTAGT;
//                 this.Cctotagt = data.Table1[0].CCTOTAGT;
//                 this.Pptotcarr = data.Table1[0].PPTOTCARR;
//                 this.Cctotcarr = data.Table1[0].CCTOTCARR;
//                 this.Pptot = data.Table1[0].PPTOT;
//                 this.Cctot = data.Table1[0].CCTOT;
//                 this.Othchrg = data.Table1[0].OTHCHRG;
//                 this.ISAUTO_FRT_INV = data.Table1[0].FRTINV_FLG;

//                 this.TarTruckPayOn = (data.Table1[0].DEST_TRUCKING_PAYABLE_ON_TAR != '') ? data.Table1[0].DEST_TRUCKING_PAYABLE_ON_TAR : null;
//                 this.TarTruckRate = data.Table1[0].DEST_TRUCKING_RATE_PER_KG_TAR;
//                 this.TarTruck = data.Table1[0].DEST_TRUCKING_RATE_TAR;
//                 this.NetTruckPayOn = (data.Table1[0].DEST_TRUCKING_PAYABLE_ON_NET != '') ? data.Table1[0].DEST_TRUCKING_PAYABLE_ON_NET : null;
//                 this.NetTruckRate = data.Table1[0].DEST_TRUCKING_RATE_PER_KG_NET;
//                 this.NetTruck = data.Table1[0].DEST_TRUCKING_RATE_NET;
//                 ///ADDED BY NALINI FOR AIRLINECHARGES
//                 this.Chargeslist = data.Table2
//                 this.tot_rate_tar_pp_da = data.Table3[0].RATE_TAR_TOTAL_PP_DA;
//                 this.tot_rate_net_pp_da = data.Table3[0].RATE_NET_TOTAL_PP_DA;
//                 this.tot_rate_tar_cc_da = data.Table4[0].RATE_TAR_TOTAL_CC_DA;
//                 this.tot_rate_net_cc_da = data.Table4[0].RATE_NET_TOTAL_CC_DA;
//                 this.tot_rate_tar_pp_dc = data.Table5[0].RATE_TAR_TOTAL_PP_DC;
//                 this.tot_rate_net_pp_dc = data.Table5[0].RATE_NET_TOTAL_PP_DC;
//                 this.tot_rate_tar_cc_dc = data.Table6[0].RATE_TAR_TOTAL_CC_DC;
//                 this.tot_rate_net_cc_dc = data.Table6[0].RATE_NET_TOTAL_CC_DC;
//                 this.fn_PageLoad();
//                 if (this.ISAUTO_FRT_INV == "1") {
//                     alert("MAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This MAWB !!");
//                     this._toasterService.toast('Warning', 'Warning', "MAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This MAWB !!");
//                 }
//                 this._loaderService.display(false);
//             },
//                 (error) => {
//                     this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
//                     this._loaderService.display(false);
//                 },
//                 () => { });
//     }

//     changePayOnTariff(tarType: string) {
//         if (tarType == 'Fsc') {
//             this.TarFscRate = 0;
//             this.TarFsc = 0;
//         } else if (tarType == 'Irc') {
//             this.TarIrcRate = 0;
//             this.TarIrc = 0;
//         } else if (tarType == 'Xray') {
//             this.TarXrayRate = 0;
//             this.TarXray = 0;
//         }
//         else if (tarType == 'Misc') {
//             this.TarMcRate = 0;
//             this.TarMc = 0;
//         }
//         else if (tarType == 'CTG') {
//             this.TarCtgRate = 0;
//             this.TarCtg = 0;
//         }
//         else if (tarType == 'THC') {
//             this.TarThcRate = 0;
//             this.TarThc = 0;
//         } else if (tarType == 'BP') {
//             this.TarBPRate = 0;
//             this.TarBP = 0;
//         }
//         else if (tarType == 'DT') {
//             this.TarTruckRate = 0;
//             this.TarTruck = 0;
//         }

//         this.fnCalculate_Tar();
//     }

//     changePayOnNet(tarType: string) {
//         if (tarType == 'Fsc') {
//             this.NetFscRate = 0;
//             this.NetFsc = 0;
//         } else if (tarType == 'Irc') {
//             this.NetIrcRate = 0;
//             this.NetIrc = 0;
//         } else if (tarType == 'Xray') {
//             this.NetXrayRate = 0;
//             this.NetXray = 0;
//         } else if (tarType == 'Misc') {
//             this.NetMcRate = 0;
//             this.NetMc = 0;
//         }else if (tarType == 'CTG') {
//             this.NetCtgRate = 0;
//             this.NetCtg = 0;
//         }
//         else if (tarType == 'THC') {
//             this.NetThcRate = 0;
//             this.NetThc = 0;
//         }else if (tarType == 'BP') {
//             this.NetBPRate = 0;
//             this.NetBP = 0;
//         }
//         else if (tarType == 'DT') {
//             this.NetTruckRate = 0;
//             this.NetTruck = 0;
//         }
//         this.fnCalculate_Net();
//     }

//     changeTariffRates(tarType: string) {
//         if (tarType == 'Freight') {
//             if (Math.abs(this.TarFreightRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearTariff(); return false; }
//                 if (this.TarFreightPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarFreight = 0; }
//             this.onChangeTariffRates('Freight');
//         } else if (tarType == 'Fsc') {
//             if (Math.abs(this.TarFscRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearTariff(); return false; }
//                 if (this.TarFscPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarFsc = 0; }
//             this.onChangeTariffRates('Fsc');
//         } else if (tarType == 'Irc') {
//             if (Math.abs(this.TarIrcRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearTariff(); return false; }
//                 if (this.TarIrcPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarIrc = 0; }
//             this.onChangeTariffRates('Irc');
//         } else if (tarType == 'Xray') {
//             if (Math.abs(this.TarXrayRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearTariff(); return false; }
//                 if (this.TarXrayPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarXray = 0; }
//             this.onChangeTariffRates('Xray');
//         } 
//         else if (tarType == 'Misc') {
//             if (Math.abs(this.TarMcRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearTariff(); return false; }
//                 if (this.TarMcPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarMc = 0; }
//             this.onChangeTariffRates('Misc');
//         }
//         else if (tarType == 'CTG') {
//             if (Math.abs(this.TarCtgRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearTariff(); return false; }
//                 if (this.TarCtgPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarCtg = 0; }
//             this.onChangeTariffRates('CTG');
//         }  else if (tarType == 'THC') {
//             if (Math.abs(this.TarThcRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearTariff(); return false; }
//                 if (this.TarThcPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarThc = 0; }
//             this.onChangeTariffRates('THC');
//         }else if (tarType == 'BP') {
//             if (Math.abs(this.TarBPRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearTariff(); return false; }
//                 if (this.TarBPPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarBP = 0; }
//             this.onChangeTariffRates('BP');
//         }
//         else if (tarType == 'DT') {
//             if (Math.abs(this.TarTruckRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearTariff(); return false; }
//                 if (this.TarTruckPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarTruck = 0; }
//             this.onChangeTariffRates('DT');
//         }
//         this.fnCalculate_Tar();
//     }

//     changeNetRates(tarType: string) {
//         if (tarType == 'Freight') {
//             if (Math.abs(this.NetFreightRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearNet(); return false; }
//                 if (this.NetFreightPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.NetFreight = 0; }
//             this.onChangeNetRates('Freight');
//         } else if (tarType == 'Fsc') {
//             if (Math.abs(this.NetFscRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearNet(); return false; }
//                 if (this.NetFscPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.NetFsc = 0; }
//             this.onChangeNetRates('Fsc');
//         } else if (tarType == 'Irc') {
//             if (Math.abs(this.NetIrcRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearNet(); return false; }
//                 if (this.NetIrcPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.NetIrc = 0; }
//             this.onChangeNetRates('Irc');
//         } else if (tarType == 'Xray') {
//             if (Math.abs(this.NetXrayRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearNet(); return false; }
//                 if (this.NetXrayPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.NetXray = 0; }
//             this.onChangeNetRates('Xray');
//         } else if (tarType == 'Misc') {
//             if (Math.abs(this.NetMcRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearNet(); return false; }
//                 if (this.NetMcPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.NetMc = 0; }
//             this.onChangeNetRates('Misc');
//         }else if (tarType == 'CTG') {
//             if (Math.abs(this.NetCtgRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearNet(); return false; }
//                 if (this.NetCtgPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.NetCtg = 0; }
//             this.onChangeNetRates('CTG');
//         }else if (tarType == 'THC') {
//             if (Math.abs(this.TarThcRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearNet(); return false; }
//                 if (this.TarThcPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.TarThc = 0; }
//             this.onChangeNetRates('THC');
//         }else if (tarType == 'BP') {
//             if (Math.abs(this.NetBPRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearNet(); return false; }
//                 if (this.NetBPPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.NetBP = 0; }
//             this.onChangeNetRates('BP');
//         }
//         else if (tarType == 'DT') {
//             if (Math.abs(this.NetTruckRate) != 0) {
//                 if (this.validateWeight() == false) { this.clearNet(); return false; }
//                 if (this.NetTruckPayOn == null) { alert('Please select Payable On.'); return false; }
//             } else { this.NetTruck = 0; }
//             this.onChangeNetRates('DT');
//         }
//         this.fnCalculate_Net();
//     }

//     validateWeight() {
//         let CHBLWT = Math.abs(this.UserWgt);
//         let GRWT = Math.abs(this.UserGrossWeight);
//         if (CHBLWT == 0) {
//             alert("Please enter Chargeable Weight.");
//             return false;
//         }
//         if (GRWT == 0) {
//             alert("Please enter Gross Weight.");
//             return false;
//         }
//         if (CHBLWT < GRWT) {
//             alert("Chargable Wgt should be greater than or equal to Gross Weight.")
//             return false;
//         }
//     }

//     clearTariff() {
//         this.TarFreightRate = "";
//         this.TarFreight = "";
//         this.TarFscPayOn = "0";
//         this.TarFscRate = "";
//         this.TarFsc = "";
//         this.TarIrcPayOn = "0";
//         this.TarIrcRate = "";
//         this.TarIrc = "";
//         this.TarXrayPayOn = "0";
//         this.TarXrayRate = "";
//         this.TarXray = "";
//         this.TarMcRate = 1;
//         let GRWT = Math.abs(this.UserGrossWeight);
//         GRWT = Math.round(Math.abs(GRWT));
//         GRWT = Math.abs(Number(GRWT.toFixed(2)));
//         this.TarMc = GRWT;
//         this.fn_MC_CTG_Tar();
//         this.fn_THC_Tar();
//     }

//     clearNet() {
//         this.NetFreightRate = null;
//         this.NetFreight = null;
//         this.NetFscPayOn = 0;
//         this.NetFscRate = null;
//         this.NetFsc = null;
//         this.NetIrcPayOn = 0;
//         this.NetIrcRate = null;
//         this.NetIrc = null;
//         this.NetXrayPayOn = 0;
//         this.NetXrayRate = null;
//         this.NetXray = null;
//         this.NetMcRate = 1;
//         this.NetMc = Math.abs(this.UserGrossWeight);
//         this.fn_MC_CTG_Net();
//         this.fn_THC_Net();
//     }

//     fn_MC_CTG_Tar() {
//         let VALUE = 0;
//         VALUE = Math.abs(this.UserWgt);
//         VALUE = Math.round(Math.abs(VALUE))
//         VALUE = (Math.abs(Number(VALUE.toFixed(2))));
//         let Mawbno = this._sharedconsig.exportEditData.MAWBNO;
//         let prestrg = Mawbno.substring(0, 3);
//         if (prestrg != "232" && this.CityCode != 'AMD') {
//             this.TarMcRate = 1;
//             this.TarMc = VALUE;
//         }
//         if (prestrg != "232" && this.CityCode == 'AMD') {
//             this.TarMcRate = 1;
//             this.TarMc = VALUE;
//         }
//         if (this.CityCode == 'MUM') {
//             this.TarCtgRate = 1;
//             VALUE = Math.abs(this.UserGrossWeight);
//             VALUE = Math.round(Math.abs(VALUE));
//             VALUE = (Math.abs(Number(VALUE.toFixed(2))));
//             this.TarCtg = VALUE;
//         }
//         else {
//             this.TarCtgRate = 0;
//             this.TarCtg = 0;
//         }
//     }
//     fn_THC_Tar() {
//         let VALUE = 0;
//         VALUE = Math.abs(this.UserWgt);
//         VALUE = Math.round(Math.abs(VALUE));
//         VALUE = (Math.abs(Number(VALUE.toFixed(2))));

//         //THC CALCULATED ON CW * 0.08 AS PER ARJUN MAIL Tue 3/10/2015 1:41 PM

//         this.TarThcRate = 0.08;
//         this.TarThc = VALUE;

//         if (this.CityCode == 'DAC') {
//             this.TarThcRate = 0.08;
//             VALUE = Math.abs(VALUE);
//             let TOT = ((this.TarThcRate) * Math.abs(VALUE)).toFixed(2);
//             this.TarThc = Math.abs(Number(TOT));
//         }
//         else {
//             this.TarThcRate = 0;
//             this.TarThc = 0;
//         }
//     }
//     fn_MC_CTG_Net() {
//         let VALUE = 0;
//         if (this.hdNetRights == true) {
//             VALUE = Math.abs(this.UserWgt);
//             VALUE = Math.round(Math.abs(VALUE));
//             VALUE = (Math.abs(Number(VALUE.toFixed(2))));
//             let Mawbno = this._sharedconsig.exportEditData.MAWBNO;
//             let prestrg = Mawbno.substring(0, 3);
//             if (prestrg != "232" && this.CityCode != 'AMD') {
//                 this.NetMcRate = 1;
//                 this.NetMc = VALUE;
//             }
//             if (prestrg != "232" && this.CityCode == 'AMD') {
//                 this.NetMcRate = 1;
//                 this.NetMc = VALUE;
//             }
//             if (this.CityCode == 'MUM') {
//                 this.NetCtgRate = 1;
//                 VALUE = Math.abs(this.UserGrossWeight);
//                 VALUE = Math.round(Math.abs(VALUE));
//                 VALUE = Math.abs(Number(VALUE.toFixed(2)));
//                 this.NetCtg = VALUE;
//             }
//             else {
//                 this.NetCtgRate = 0;
//                 this.NetCtg = 0;
//             }
//         }
//     }
//     fn_THC_Net() {
//         let VALUE = 0;
//         if (this.hdNetRights == true) {
//             VALUE = Math.abs(this.UserWgt);
//             VALUE = Math.round(Math.abs(VALUE));
//             VALUE = (Math.abs(VALUE));
//             //THC CALCULATED ON CW * 0.08 AS PER ARJUN MAIL Tue 3/10/2015 1:41 PM
//             this.NetThcRate = 0.08;
//             this.NetThc = VALUE;
//             if (this.CityCode == "DAC") {
//                 this.NetThcRate = 0.08;
//                 VALUE = Math.abs(VALUE); // Math.abs(this.UserGrossWeight);
//                 let TOT = ((this.NetThcRate) * Math.abs(VALUE));
//                 this.NetThc = Math.abs(TOT).toFixed(2);
//             }
//             else {
//                 this.NetThcRate = 0;
//                 this.NetThc = 0;
//             }
//         }
//     }

//     onChangeTariffRates(tarType: string) {
//         let MUL_VALUE = 0;
//         let TOT = 0;
//         if (tarType == 'Freight') {
//             if (this.TarFreightPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.TarFreightPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.TarFreightRate) * Math.abs(MUL_VALUE));
//             this.TarFreight = Math.round(TOT).toFixed(2);
//         } else if (tarType == 'Fsc') {
//             if (this.TarFscPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.TarFscPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.TarFscRate) * Math.abs(MUL_VALUE));
//             this.TarFsc = Math.round(TOT).toFixed(2);
//         } else if (tarType == 'Irc') {
//             if (this.TarIrcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.TarIrcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.TarIrcRate) * Math.abs(MUL_VALUE));
//             this.TarIrc = Math.round(TOT).toFixed(2);
//         } else if (tarType == 'Xray') {
//             if (this.TarXrayPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.TarXrayPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.TarXrayRate) * Math.abs(MUL_VALUE));
//             this.TarXray = Math.round(TOT).toFixed(2);
//         }  else if (tarType == 'Misc') {
//             if (this.TarMcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.TarMcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.TarMcRate) * Math.abs(MUL_VALUE));
//             this.TarMc = Math.round(TOT).toFixed(2);
//         }else if (tarType == 'CTG') {
//             if (this.TarCtgPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.TarCtgPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.TarCtgRate) * Math.abs(MUL_VALUE));
//             this.TarCtg = Math.round(TOT).toFixed(2);
//         }else if (tarType == 'THC') {
//             if (this.TarThcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.TarThcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.TarThcRate) * Math.abs(MUL_VALUE));
//             this.TarThc = Math.round(TOT).toFixed(2);
//         }else if (tarType == 'BP') {
//             if (this.TarBPPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.TarBPPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.TarBPRate) * Math.abs(MUL_VALUE));
//             this.TarBP = Math.round(TOT).toFixed(2);
//         }
//         else if (tarType == 'DT') {
//             if (this.TarTruckPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.TarTruckPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.TarTruckRate) * Math.abs(MUL_VALUE));
//             this.TarTruck = Math.round(TOT).toFixed(2);
//         }
//     }

//     onChangeNetRates(tarType: string) {
//         let MUL_VALUE = 0;
//         let TOT = 0;
//         if (tarType == 'Freight') {
//             if (this.NetFreightPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.NetFreightPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.NetFreightRate) * Math.abs(MUL_VALUE));
//             this.NetFreight = Math.round(TOT).toFixed(2);
//         } else if (tarType == 'Fsc') {
//             if (this.NetFscPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.NetFscPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.NetFscRate) * Math.abs(MUL_VALUE));
//             this.NetFsc = Math.round(TOT).toFixed(2);
//         } else if (tarType == 'Irc') {
//             if (this.NetIrcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.NetIrcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.NetIrcRate) * Math.abs(MUL_VALUE));
//             this.NetIrc = Math.round(TOT).toFixed(2);
//         } else if (tarType == 'Xray') {
//             if (this.NetXrayPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.NetXrayPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.NetXrayRate) * Math.abs(MUL_VALUE));
//             this.NetXray = Math.round(TOT).toFixed(2);
//         }  else if (tarType == 'Misc') {
//             if (this.NetMcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.NetMcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.NetMcRate) * Math.abs(MUL_VALUE));
//             this.NetMc = Math.round(TOT).toFixed(2);
//         }
//         else if (tarType == 'CTG') {
//             if (this.NetCtgPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.NetCtgPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.NetCtgRate) * Math.abs(MUL_VALUE));
//             this.NetCtg = Math.round(TOT).toFixed(2);
//         }    else if (tarType == 'THC') {
//             if (this.NetThcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.NetThcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.NetThcRate) * Math.abs(MUL_VALUE));
//             this.NetThc = Math.round(TOT).toFixed(2);
//         }else if (tarType == 'BP') {
//             if (this.NetBPPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.NetBPPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.NetBPRate) * Math.abs(MUL_VALUE));
//             this.NetBP = Math.round(TOT).toFixed(2);
//         }
//         else if (tarType == 'DT') {
//             if (this.NetTruckPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
//             else if (this.NetTruckPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
//             TOT = (Math.abs(this.NetTruckRate) * Math.abs(MUL_VALUE));
//             this.NetTruck = Math.round(TOT).toFixed(2);
//         }
//     }

//     fnCalculate_Tar() {
//         let FSC = 0, IRC = 0, XRAY = 0, MC = 0, CTG = 0, OC1_DC = 0, OC2_DC = 0, OC1_DA = 0, OC2_DA = 0, DUE_CARRIER = 0,
//             HAWB = 0, PCA = 0, DUE_AGENT = 0, TOTAL = 0, FREIGHT = 0, AMS = 0, THC = 0, BUSINESPROMO = 0, BP = 0,
//             FSC_CC = 0, IRC_CC = 0, XRAY_CC = 0, MC_CC = 0, CTG_CC = 0, OC1_DC_CC = 0, OC2_DC_CC = 0, OC1_DA_CC = 0,
//             OC2_DA_CC = 0, DUE_CARRIER_CC = 0, HAWB_CC = 0, PCA_CC = 0, DUE_AGENT_CC = 0, TOTAL_CC = 0, FREIGHT_CC = 0,
//             AMS_CC = 0, THC_CC = 0, BP_CC = 0, Truck_CC = 0, Truck = 0;

//         if (this.TarFscFrt == "PP") { FSC = (Math.abs(this.TarFsc)); }
//         else { FSC_CC = (Math.abs(this.TarFsc)); }

//         if (this.TarIrcFrt == "PP") { IRC = (Math.abs(this.TarIrc)); }
//         else { IRC_CC = (Math.abs(this.TarIrc)); }

//         if (this.TarXrayFrt == "PP") { XRAY = (Math.abs(this.TarXray)); }
//         else { XRAY_CC = (Math.abs(this.TarXray)); }

//         if (this.TarMcFrt == "PP") { MC = (Math.abs(this.TarMc)); }
//         else { MC_CC = (Math.abs(this.TarMc)); }

//         if (this.TarAmsFrt == "PP") { AMS = (Math.abs(this.TarAms)); }
//         else { AMS_CC = (Math.abs(this.TarAms)); }

//         if (this.CityCode == "MUM") {
//             if (this.TarCtgFrt == "PP") { CTG = Math.abs(this.TarCtg); }
//             else { CTG_CC = Math.abs(this.TarCtg); }
//         }
//         else {
//             CTG = 0;
//             CTG_CC = 0;
//         }
//         if (this.TarThcFrt == "PP") { THC = (Math.abs(this.TarThc)); }
//         else { THC_CC = (Math.abs(this.TarThc)); }
//         // if (this.CityCode == "DAC") {
//         //     if (this.TarThcFrt == "PP")
//         //         THC = Math.abs(this.TarThc);
//         //     else
//         //         THC_CC = Math.abs(this.TarThc);
//         // }
//         // else {
//         //     THC = 0;
//         //     THC_CC = 0;
//         // }

//         if (this.CityCode == "DAC") {
//             BP = 0;
//             BP_CC = 0;
//         }
//         else {
//             if (this.TarBPFrt == "PP") { BP = Math.abs(this.TarBP); }
//             else { BP_CC = Math.abs(this.TarBP); }
//         }

//         if (this.OtherAmt1TarFrt == "PP") {
//             if (this.CalOneDcTar == 1) { OC1_DC = Math.abs(this.OtherAmt1_Tar); }
//             else { OC1_DA = Math.abs(this.OtherAmt1_Tar); }
//         }
//         else {
//             if (this.CalOneDcTar == 1) { OC1_DC_CC = Math.abs(this.OtherAmt1_Tar); }
//             else { OC1_DA_CC = Math.abs(this.OtherAmt1_Tar); }
//         }

//         if (this.OtherAmt2TarFrt == "PP") {
//             if (this.CalTwoDcTar == 1) { OC2_DC = Math.abs(this.OtherAmt2_Tar); }
//             else { OC2_DA = Math.abs(this.OtherAmt2_Tar); }
//         }
//         else {
//             if (this.CalTwoDcTar == 1) { OC2_DC_CC = Math.abs(this.OtherAmt2_Tar); }
//             else { OC2_DA_CC = Math.abs(this.OtherAmt2_Tar); }
//         }

//         if (this.HawbTarFrt == "PP") { HAWB = Math.abs(this.HawbTar); }
//         else { HAWB_CC = Math.abs(this.HawbTar); }

//         if (this.PcaTarFrt == "PP") { PCA = Math.abs(this.PcaTar); }
//         else { PCA_CC = Math.abs(this.PcaTar); }

//         if (this.TarFreightFrt == "PP") { FREIGHT = Math.abs(this.TarFreight); }
//         else { FREIGHT_CC = Math.abs(this.TarFreight); }

//         if (this.TarTruckFrt == "PP") { Truck = Math.abs(this.TarTruck); }
//         else { Truck_CC = Math.abs(this.TarTruck); }


//         ///ADDED BY NALINI FOR ALCHARGES ON 21/04/2022
//         let totrate_tar_pp_dc = Math.abs(this.tot_rate_tar_pp_dc)
//         let tot_rate_tar_cc_dc = Math.abs(this.tot_rate_tar_cc_dc)

//         let DUE_CARRIER1 = Math.abs(FSC) + Math.abs(IRC) + Math.abs(XRAY) + Math.abs(MC) + Math.abs(CTG) + Math.abs(AMS) + Math.abs(OC1_DC) + Math.abs(OC2_DC) + Math.abs(THC) + Math.abs(BP) + Math.abs(totrate_tar_pp_dc);
//         DUE_CARRIER = Math.round(Math.abs(DUE_CARRIER1));
//         DUE_CARRIER = DUE_CARRIER;
//         let DUE_CARRIER1_CC = Math.abs(FSC_CC) + Math.abs(IRC_CC) + Math.abs(XRAY_CC) + Math.abs(MC_CC) + Math.abs(CTG_CC) + Math.abs(AMS_CC) + Math.abs(OC1_DC_CC) + Math.abs(OC2_DC_CC) + Math.abs(THC_CC) + Math.abs(BP_CC) + Math.abs(tot_rate_tar_cc_dc);
//         DUE_CARRIER_CC = Math.round(Math.abs(DUE_CARRIER1_CC));
//         DUE_CARRIER_CC = DUE_CARRIER_CC;

//         ///ADDED BY NALINI FOR ALCHARGES ON 21/04/2022

//         let totrate_tar_pp_da = Math.abs(this.tot_rate_tar_pp_da)
//         let totrate_tar_cc_da = Math.abs(this.tot_rate_tar_cc_da)

//         let DUE_AGENT1 = Math.abs(HAWB) + Math.abs(PCA) + Math.abs(OC1_DA) + Math.abs(OC2_DA) + Math.abs(totrate_tar_pp_da);
//         DUE_AGENT1 = Math.round(DUE_AGENT1);
//         DUE_AGENT = DUE_AGENT1;
//         let DUE_AGENT1_CC = Math.abs(HAWB_CC) + Math.abs(PCA_CC) + Math.abs(OC1_DA_CC) + Math.abs(OC2_DA_CC) + Math.abs(totrate_tar_cc_da);
//         DUE_AGENT1_CC = Math.round(DUE_AGENT1_CC);
//         DUE_AGENT_CC = DUE_AGENT1_CC;

//         let TOTAL1 = Math.abs(DUE_CARRIER) + Math.abs(DUE_AGENT) + Math.abs(FREIGHT) + Math.abs(Truck)
//         TOTAL1 = Math.round(TOTAL1);
//         TOTAL = Math.abs(TOTAL1);
//         let TOTAL1_CC = Math.abs(DUE_CARRIER_CC) + Math.abs(DUE_AGENT_CC) + Math.abs(FREIGHT_CC) + Math.abs(Truck_CC)
//         TOTAL1_CC = Math.round(TOTAL1_CC);
//         TOTAL_CC = TOTAL1_CC;

//         this.DurCarrierTar = DUE_CARRIER.toFixed(2);
//         this.DueAgentTar = DUE_AGENT.toFixed(2);
//         this.TotalTar = TOTAL.toFixed(2);
//         this.DurCarrierTarCC = DUE_CARRIER_CC.toFixed(2);
//         this.DueAgentTarCC = DUE_AGENT_CC.toFixed(2);
//         this.TotalTarCC = TOTAL_CC.toFixed(2);
//         // this.fn_CalculateAlCharges_Tar( this.dttable6);
//     }

//     fnCalculate_Net() {
//         let FSC = 0, IRC = 0, XRAY = 0, MC = 0, CTG = 0, THC = 0, BP = 0, OC1_DC = 0, OC2_DC = 0, OC1_DA = 0, OC2_DA = 0,
//             DUE_CARRIER = 0, HAWB = 0, PCA = 0, DUE_AGENT = 0, TOTAL = 0, FREIGHT = 0, AMS = 0, FSC_CC = 0, IRC_CC = 0,
//             XRAY_CC = 0, MC_CC = 0, CTG_CC = 0, THC_CC = 0, BP_CC = 0, OC1_DC_CC = 0, OC2_DC_CC = 0, OC1_DA_CC = 0,
//             OC2_DA_CC = 0, DUE_CARRIER_CC = 0, HAWB_CC = 0, PCA_CC = 0, DUE_AGENT_CC = 0, TOTAL_CC = 0, FREIGHT_CC = 0,
//             AMS_CC = 0, Truck = 0, Truck_CC = 0;

//         if (this.NetFscFrt == "PP") { FSC = Math.abs(this.NetFsc); }
//         else { FSC_CC = Math.abs(this.NetFsc); }

//         if (this.NetIrcFrt == "PP") { IRC = Math.abs(this.NetIrc); }
//         else { IRC_CC = Math.abs(this.NetIrc); }

//         if (this.NetXrayFrt == "PP") { XRAY = Math.abs(this.NetXray); }
//         else { XRAY_CC = Math.abs(this.NetXray); }

//         if (this.NetMcFrt == "PP") { MC = Math.abs(this.NetMc); }
//         else { MC_CC = Math.abs(this.NetMc); }

//         if (this.NetAmsFrt == "PP") { AMS = Math.abs(this.NetAms); }
//         else { AMS_CC = Math.abs(this.NetAms); }

//         if (this.CityCode == "MUM") {
//             if (this.NetCtgFrt == "PP") { CTG = Math.abs(this.NetCtg); }
//             else { CTG_CC = Math.abs(this.NetCtg); }
//         }
//         else {
//             CTG = 0;
//             CTG_CC = 0;
//         }

//         // if (this.CityCode == "DAC") {
//         //     if (this.NetThcFrt == "PP") { THC = Math.abs(this.NetThc); }
//         //     else { THC_CC = Math.abs(this.NetThc); }
//         // }
//         // else {
//         //     THC = 0;
//         //     THC_CC = 0;
//         // }
//         if (this.NetThcFrt == "PP") { THC = Math.abs(this.NetThc); }
//         else { THC_CC = Math.abs(this.NetThc); }

//         if (this.CityCode == "DAC") {
//             BP = 0;
//             BP_CC = 0;
//         }
//         else {
//             if (this.NetBPFrt == "PP") { BP = Math.abs(this.NetBP); }
//             else { BP_CC = Math.abs(this.NetBP); }
//         }

//         if (this.OtherAmt1NetFrt == "PP") {
//             if (this.CalOneDcNet == 1) { OC1_DC = Math.abs(this.OtherAmt1_Net); }
//             else { OC1_DA = Math.abs(this.OtherAmt1_Net); }
//         }
//         else {
//             if (this.CalOneDcNet == 1) { OC1_DC_CC = Math.abs(this.OtherAmt1_Net); }
//             else { OC1_DA_CC = Math.abs(this.OtherAmt1_Net); }
//         }

//         if (this.OtherAmt2NetFrt == "PP") {
//             if (this.CalTwoDcTar == 1) { OC2_DC = Math.abs(this.OtherAmt2_Net); }
//             else { OC2_DA = Math.abs(this.OtherAmt2_Net); }
//         }
//         else {
//             if (this.CalTwoDcTar == 1) { OC2_DC_CC = Math.abs(this.OtherAmt2_Net); }
//             else { OC2_DA_CC = Math.abs(this.OtherAmt2_Net); }
//         }

//         if (this.HawbNetFrt == "PP") { HAWB = Math.abs(this.HawbNet); }
//         else { HAWB_CC = Math.abs(this.HawbNet); }

//         if (this.PcaNetFrt == "PP") { PCA = Math.abs(this.PcaNet); }
//         else { PCA_CC = Math.abs(this.PcaNet); }

//         if (this.NetFreightFrt == "PP") { FREIGHT = Math.abs(this.NetFreight); }
//         else { FREIGHT_CC = Math.abs(this.NetFreight); }

//         if (this.NetTruckFrt == "PP") { Truck = Math.abs(this.NetTruck); }
//         else { Truck_CC = Math.abs(this.NetTruck); }

//         //ADDED BY NALINI ON 21/04/2022 FOR ALCHARGES DUE CARRIER
//         let totrate_net_pp_dc = Math.abs(this.tot_rate_net_pp_dc)
//         let tot_rate_net_cc_dc = Math.abs(this.tot_rate_net_cc_dc)

//         let DUE_CARRIER1 = Math.abs(FSC) + Math.abs(IRC) + Math.abs(XRAY) + Math.abs(MC) + Math.abs(CTG) + Math.abs(AMS) + Math.abs(OC1_DC) + Math.abs(OC2_DC) + Math.abs(THC) + Math.abs(BP) + Math.abs(totrate_net_pp_dc);
//         DUE_CARRIER1 = Math.round(Math.abs(DUE_CARRIER1));
//         DUE_CARRIER = Math.abs(DUE_CARRIER1);
//         let DUE_CARRIER1_CC = Math.abs(FSC_CC) + Math.abs(IRC_CC) + Math.abs(XRAY_CC) + Math.abs(MC_CC) + Math.abs(CTG_CC) + Math.abs(AMS_CC) + Math.abs(OC1_DC_CC) + Math.abs(OC2_DC_CC) + Math.abs(THC_CC) + Math.abs(BP_CC) + Math.abs(tot_rate_net_cc_dc);
//         DUE_CARRIER1_CC = Math.round(Math.abs(DUE_CARRIER1_CC));
//         DUE_CARRIER_CC = Math.abs(DUE_CARRIER1_CC);

//         //ADDED BY NALINI ON 21/04/2022 FOR ALCHARGES DUE AGENT
//         let totrate_net_pp_da = Math.abs(this.tot_rate_net_pp_da)
//         let totrate_net_cc_da = Math.abs(this.tot_rate_net_cc_da)

//         let DUE_AGENT1 = Math.abs(HAWB) + Math.abs(PCA) + Math.abs(OC1_DA) + Math.abs(OC2_DA) + Math.abs(totrate_net_pp_da);
//         DUE_AGENT1 = Math.round(Math.abs(DUE_AGENT1));
//         DUE_AGENT = Math.abs(DUE_AGENT1);
//         let DUE_AGENT1_CC = Math.abs(HAWB_CC) + Math.abs(PCA_CC) + Math.abs(OC1_DA_CC) + Math.abs(OC2_DA_CC) + Math.round(totrate_net_cc_da);
//         DUE_AGENT1_CC = Math.round(Math.abs(DUE_AGENT1_CC));
//         DUE_AGENT_CC = Math.abs(DUE_AGENT1_CC);

//         let TOTAL1 = Math.abs(DUE_CARRIER) + Math.abs(DUE_AGENT) + Math.abs(FREIGHT) + Math.abs(Truck)
//         TOTAL1 = Math.round(Math.abs(TOTAL1));
//         TOTAL = Math.abs(TOTAL1);
//         let TOTAL1_CC = Math.abs(DUE_CARRIER_CC) + Math.abs(DUE_AGENT_CC) + Math.abs(FREIGHT_CC) + Math.abs(Truck_CC)
//         TOTAL1_CC = Math.round(Math.abs(TOTAL1_CC));
//         TOTAL_CC = Math.abs(TOTAL1_CC);

//         this.DurCarrierNet = DUE_CARRIER.toFixed(2);
//         this.DueAgentNet = DUE_AGENT.toFixed(2);
//         this.TotalNet = TOTAL.toFixed(2);
//         this.DurCarrierNetCC = DUE_CARRIER_CC.toFixed(2);
//         this.DueAgentNetCC = DUE_AGENT_CC.toFixed(2);
//         this.TotalNetCC = TOTAL_CC.toFixed(2);
//     }

//     changeUserWeight() {
//         if (this.oldchblwt != this.UserWgt) {
//             var answer = confirm("Are you sure you want to change Charable Weight from " + this.oldchblwt + " to " + this.UserWgt + "?")
//             if (answer == false) { return false; }
//             else {
//                 this.oldchblwt = this.UserWgt;
//                 this.fn_PageLoad();
//                 this.changeTariffRates('Freight');
//                 this.changeNetRates('Freight');
//                 this.changeTariffRates('Fsc');
//                 this.changeNetRates('Fsc');
//                 this.changeTariffRates('Irc');
//                 this.changeNetRates('Irc');
//                 this.changeTariffRates('Xray');
//                 this.changeNetRates('Xray');
//                 this.changeTariffRates('Misc');
//                 this.changeNetRates('Misc');
//                 this.changeTariffRates('CTG');
//                 this.changeNetRates('CTG');
//                 this.changeTariffRates('THC');
//                 this.changeNetRates('THC');
//                 this.fnCalculate_Tar();
//                 this.fnCalculate_Net();

//             }
//         }
//         if (this.oldgrwt != this.UserGrossWeight) {
//             var answer = confirm("Are you sure you want to change Gross Weight from " + this.oldgrwt + " to " + this.UserGrossWeight + "?")
//             if (answer == false) { return false; }
//         }
//         else {
//             this.oldgrwt = this.UserGrossWeight;
//             this.fn_PageLoad();
//             this.fnCalculate_Tar();
//             this.fnCalculate_Net();
//         }
//     }

//     onChangeAms(rateType: string) {
//         if (rateType == 'TAR') {
//             this.fnCalculate_Tar();
//         }
//         else if (rateType == 'NET') {
//             this.fnCalculate_Net();
//         }
//     }

//     onChangeOtherChargeName(cnType: number) {
//         if (cnType == 1) {
//             if (this.OtherChrg1 == "") {
//                 this.OtherAmt1_Tar = "";
//                 this.fnCalculate_Tar();
//                 if (this.hdNetRights == true) {
//                     this.OtherAmt1_Net = "";
//                     this.fnCalculate_Net();
//                 }
//             }
//         }
//         else if (cnType == 2) {
//             if (this.OtherChrg2 == "") {
//                 this.OtherAmt2_Tar = "";
//                 this.fnCalculate_Tar();
//                 if (this.hdNetRights == true) {
//                     this.OtherAmt2_Net = "";
//                     this.fnCalculate_Net();
//                 }
//             }
//         }
//     }

//     onChangeOther_Tar(oType: number) {
//         if (oType == 1) {
//             if (Math.abs(this.OtherAmt1_Tar) > 0) {
//                 if (this.OtherChrg1 == "" || this.OtherChrg1 == null) {
//                     alert("Please enter name of Charge1.");
//                     this.OtherAmt1_Tar = null;
//                     return false;
//                 }
//             }
//             this.fnCalculate_Tar();
//         }
//         else if (oType == 2) {
//             if (Math.abs(this.OtherAmt2_Tar) > 0) {
//                 if (this.OtherChrg2 == "" || this.OtherChrg2 == null) {
//                     alert("Please enter name of Charge2.");
//                     this.OtherAmt2_Tar = null;
//                     return false;
//                 }
//             }
//             this.fnCalculate_Tar();
//         }
//     }

//     onChangeOther_Net(ChargeType) {
//         if (ChargeType == '1') {
//             if (Math.abs(this.OtherAmt1_Net) > 0) {
//                 if (this.OtherChrg1 == "" || this.OtherChrg1 == null) {
//                     alert("Please enter name of Charge1.");
//                     this.OtherAmt1_Net = null;
//                     return false;
//                 }
//             }
//             this.fnCalculate_Net();
//         }
//         else if (ChargeType == '2') {
//             if (Math.abs(this.OtherAmt2_Net) > 0) {
//                 if (this.OtherChrg2 == "" || this.OtherChrg2 == null) {
//                     alert("Please enter name of Charge2.");
//                     this.OtherAmt2_Net = null;
//                     return false;
//                 }
//             }
//             this.fnCalculate_Net();
//         }

//     }

//     fnChangeFreight_PP_CC_TAR() {
//         let Value = this.TarFreightFrt;
//         this.TarFscFrt = Value;
//         this.TarIrcFrt = Value;
//         this.TarXrayFrt = Value;
//         this.fnCalculate_Tar();
//     }

//     fnChangeFreight_PP_CC_NET() {
//         let Value = this.NetFreightFrt;
//         this.NetFscFrt = Value;
//         this.NetIrcFrt = Value;
//         this.NetXrayFrt = Value;
//         this.fnCalculate_Net();
//     }

//     fn_MAWB_IU() {

//         if (this.validateWeight() == false) { return false; }

//         let AGENTS_RATE = this.AgentsRate;

//         if (parseFloat(AGENTS_RATE) > 20.00) {
//             alert("Please Enter below 20 on Agent Charges! ");
//             return false;
//         }

//         let MAWBNO = this._sharedconsig.exportEditData.MAWBNO;
//         let CITYCODE = this.CityCode;
//         let CHBL_WGT = this.Wgt;
//         let GROSS_WGT = this.GrossWeight;
//         let CHBL_WGT_USER = Math.abs(this.UserWgt);
//         let GROSS_WGT_USER = Math.abs(this.UserGrossWeight);

//         let FREIGHT = (this.FreightRate != null) ? this.FreightRate : "";

//         let FRT_CHARGEABLE_AS_TAR = (this.TariffRate == 1) ? "AI" : "FS";

//         let FRT_PAYABLE_ON_TAR = (this.TarFreightPayOn != null) ? this.TarFreightPayOn : "";
//         let FRT_RATE_PER_KG_TAR = Math.abs(this.TarFreightRate);
//         let FRT_RATE_TAR = Math.abs(this.TarFreight);

//         let FSC_PAYABLE_ON_TAR = (this.TarFscPayOn != null) ? this.TarFscPayOn : "";
//         let FSC_RATE_PER_KG_TAR = Math.abs(this.TarFscRate);
//         let FSC_RATE_TAR = Math.abs(this.TarFsc);

//         let IRC_PAYABLE_ON_TAR = (this.TarIrcPayOn != null) ? this.TarIrcPayOn : "";
//         let IRC_RATE_PER_KG_TAR = Math.abs(this.TarIrcRate);
//         let IRC_RATE_TAR = Math.abs(this.TarIrc);

//         let XRAY_PAYABLE_ON_TAR = (this.TarXrayPayOn != null) ? this.TarXrayPayOn : "";
//         let XRAY_RATE_PER_KG_TAR = Math.abs(this.TarXrayRate);
//         let XRAY_RATE_TAR = Math.abs(this.TarXray);


//         if (FRT_CHARGEABLE_AS_TAR == 'FS') {
//             // if (FSC_RATE_TAR == 0) {
//             //     alert("Please enter any one TARIFF RATE - FSC");
//             //     return false;
//             // }
//             if (FSC_RATE_TAR == 0 && IRC_RATE_TAR == 0 && XRAY_RATE_TAR == 0) {
//                 alert("Please enter any one TARIFF RATE :[FSC] or [IRC] or [X-RAY]");
//                 return false;
//             }

//         }

//         let MC_PAYABLE_ON_TAR = (this.TarMcPayOn != null) ? this.TarMcPayOn : "";
//         let MC_RATE_PER_KG_TAR = Math.abs(this.TarMcRate);
//         let MC_RATE_TAR = Math.abs(this.TarMc);

//         let CTG_PAYABLE_ON_TAR = (this.TarCtgPayOn != null) ? this.TarCtgPayOn : "";
//         let CTG_RATE_PER_KG_TAR = Math.abs(this.TarCtgRate);
//         let CTG_RATE_TAR = Math.abs(this.TarCtg);

//         let THC_PAYABLE_ON_TAR = (this.TarThcPayOn != null) ? this.TarThcPayOn : "";
//         let THC_RATE_PER_KG_TAR = Math.abs(this.TarThcRate);
//         let THC_RATE_TAR = Math.abs(this.TarThc);

//         let BP_PAYABLE_ON_TAR = (this.TarBPPayOn != null) ? this.TarBPPayOn : "";
//         let BP_RATE_PER_KG_TAR = Math.abs(this.TarBPRate);
//         let BP_RATE_TAR = Math.abs(this.TarBP);

//         let Truck_PAYABLE_ON_TAR = (this.TarTruckPayOn != null) ? this.TarTruckPayOn : "";
//         let Truck_RATE_PER_KG_TAR = Math.abs(this.TarTruckRate);
//         let Truck_RATE_TAR = Math.abs(this.TarTruck);

//         let DUE_CARRIER_TAR = Math.abs(this.DurCarrierTar);
//         let HAWB_TAR = Math.abs(this.HawbTar);
//         let PCA_TAR = Math.abs(this.PcaTar);
//         let DUE_AGENT_TAR = Math.abs(this.DueAgentTar);
//         let TOTAL_TAR = Math.abs(this.TotalTar);
//         let OTHER_CHRG_TAR = Math.abs(this.OtherTar);
//         let REMARK = this.Remark;
//         let AMS_RATE_TAR = Math.abs(this.TarAms);

//         let OTHER_NAME1 = this.OtherChrg1;
//         let OTHER_NAME2 = this.OtherChrg2;
//         let OTHER_RATE1_TAR = Math.abs(this.OtherAmt1_Tar);
//         let OTHER_RATE2_TAR = Math.abs(this.OtherAmt2_Tar);

//         let OTHER_RATE1_TAR_CAL = (this.CalOneDcTar == 1) ? "DC" : "DA";
//         let OTHER_RATE2_TAR_CAL = this.OtherAmt2_Tar;

//         OTHER_RATE2_TAR_CAL = (this.CalTwoDcTar == 1) ? "DC" : "DA"; //Line 1413 one variable with different data

//         let OTHER_RATE1_NET_CAL = (this.CalOneDcNet == 1) ? "DC" : "DA";

//         let OTHER_RATE2_NET_CAL = (this.CalTwoDcNet == 1) ? "DC" : "DA";

//         let ISMIN = (this.isMinRate == true) ? "Y" : "N";

//         let EXPTNO = this.exptno;

//         var FRT_RATE_TAR_FRT = '',
//             FSC_RATE_TAR_FRT = '',
//             IRC_RATE_TAR_FRT = '',
//             XRAY_RATE_TAR_FRT = '',
//             MC_RATE_TAR_FRT = '',
//             CTG_RATE_TAR_FRT = '',
//             THC_RATE_TAR_FRT = '',
//             BP_RATE_TAR_FRT = '',
//             HAWB_RATE_TAR_FRT = '',
//             PCA_RATE_TAR_FRT = '',
//             OTHER_RATE_TAR_FRT = '',
//             TRUCK_RATE_TAR_FRT = '',

//             FRT_RATE_NET_FRT = '',
//             FSC_RATE_NET_FRT = '',
//             IRC_RATE_NET_FRT = '',
//             XRAY_RATE_NET_FRT = '',
//             MC_RATE_NET_FRT = '',
//             CTG_RATE_NET_FRT = '',
//             THC_RATE_NET_FRT = '',
//             BP_RATE_NET_FRT = '',
//             AMS_RATE_NET_FRT = '',
//             HAWB_RATE_NET_FRT = '',
//             PCA_RATE_NET_FRT = '',
//             OTHER_RATE_NET_FRT = '',
//             AMS_RATE_TAR_FRT = '',
//             TRUCK_RATE_NET_FRT;

//         var FRT_CHARGEABLE_AS_NET = '',
//             FRT_PAYABLE_ON_NET = '',
//             FRT_RATE_PER_KG_NET: number,
//             FRT_RATE_NET: number,
//             FSC_PAYABLE_ON_NET = '',
//             FSC_RATE_PER_KG_NET: number,
//             FSC_RATE_NET: number,
//             IRC_PAYABLE_ON_NET = '',
//             IRC_RATE_PER_KG_NET: number,
//             IRC_RATE_NET: number,
//             XRAY_PAYABLE_ON_NET = '',
//             XRAY_RATE_PER_KG_NET: number,
//             XRAY_RATE_NET: number,
//             MC_PAYABLE_ON_NET = '',
//             MC_RATE_PER_KG_NET: number,
//             MC_RATE_NET: number,
//             CTG_PAYABLE_ON_NET = '',
//             CTG_RATE_PER_KG_NET: number | string,
//             CTG_RATE_NET: number,
//             DUE_CARRIER_NET: number | string,
//             HAWB_NET: number,
//             PCA_NET: number,
//             DUE_AGENT_NET: number | string,
//             TOTAL_NET: number | string,
//             OTHER_CHRG_NET: number,
//             AMS_RATE_NET: number,
//             OTHER_RATE1_NET: number,
//             OTHER_RATE2_NET: number,
//             ISNETEDIT = '',
//             SupplierNet = '',
//             AIR_FRT_COMMISSION = '',
//             FRT_REBATE: number,
//             TDS: number,
//             SERVICE_TAX: number,
//             THC_PAYABLE_ON_NET = '',
//             THC_RATE_PER_KG_NET: number,
//             THC_RATE_NET: number,
//             BUSINES_PROMO = '',
//             BP_PAYABLE_ON_NET = '',
//             BP_RATE_PER_KG_NET: number | string,
//             BP_RATE_NET: number,

//             TRUCK_PAYABLE_ON_NET = '',
//             TRUCK_RATE_PER_KG_NET: number | string,
//             TRUCK_RATE_NET: number;


//         if (Math.abs(FRT_RATE_TAR) > 0)
//             FRT_RATE_TAR_FRT = this.TarFreightFrt;
//         if (Math.abs(FSC_RATE_TAR) > 0)
//             FSC_RATE_TAR_FRT = this.TarFscFrt;
//         if (Math.abs(IRC_RATE_TAR) > 0)
//             IRC_RATE_TAR_FRT = this.TarIrcFrt;
//         if (Math.abs(XRAY_RATE_TAR) > 0)
//             XRAY_RATE_TAR_FRT = this.TarXrayFrt;
//         if (Math.abs(MC_RATE_TAR) > 0)
//             MC_RATE_TAR_FRT = this.TarMcFrt;
//         if (Math.abs(CTG_RATE_TAR) > 0)
//             CTG_RATE_TAR_FRT = this.TarCtgFrt;
//         if (Math.abs(THC_RATE_TAR) > 0)
//             THC_RATE_TAR_FRT = this.TarThcFrt;
//         if (Math.abs(BP_RATE_TAR) > 0)
//             BP_RATE_TAR_FRT = this.TarBPFrt;
//         if (Math.abs(AMS_RATE_TAR) > 0)
//             AMS_RATE_TAR_FRT = this.TarAmsFrt;
//         if (Math.abs(HAWB_TAR) > 0)
//             HAWB_RATE_TAR_FRT = this.HawbTarFrt;
//         if (Math.abs(PCA_TAR) > 0)
//             PCA_RATE_TAR_FRT = this.PcaTarFrt;
//         if (Math.abs(OTHER_CHRG_TAR) > 0)
//             OTHER_RATE_TAR_FRT = this.OtherTarFrt;


//         let OTHER_RATE1_TAR_FRT = '',
//             OTHER_RATE2_TAR_FRT = '',
//             OTHER_RATE1_NET_FRT = '',
//             OTHER_RATE2_NET_FRT = '',
//             DUE_CARRIER_NET_CC = 0,
//             DUE_AGENT_NET_CC = 0,
//             TOTAL_NET_CC = 0;

//         if (Math.abs(OTHER_RATE1_TAR) > 0)
//             OTHER_RATE1_TAR_FRT = this.OtherAmt1TarFrt;
//         if (Math.abs(OTHER_RATE2_TAR) > 0)
//             OTHER_RATE2_TAR_FRT = this.OtherAmt2TarFrt;

//         let DUE_CARRIER_TAR_CC = Math.abs(this.DurCarrierTarCC),
//             DUE_AGENT_TAR_CC = Math.abs(this.DueAgentTarCC),
//             TOTAL_TAR_CC = Math.abs(this.TotalTarCC);

//         let TDS_ACCTCODE = '',
//             SERVICETAX_ACCTCODE = '';

//         if (this.hdNetRights == true) {
//             ISNETEDIT = 'Y';

//             TDS = Math.abs(this.TxtTDS);
//             SERVICE_TAX = Math.abs(this.TxtServiceTax);
//             TDS_ACCTCODE = this.DrpTDS;
//             SERVICETAX_ACCTCODE = this.DrpServiceTax;

//             if (Math.abs(TDS) > 0) {
//                 if (TDS_ACCTCODE == "0") {
//                     alert("Please select TDS Account Name.");
//                     return false;
//                 }
//             }
//             else { TDS_ACCTCODE = ''; }

//             if (Math.abs(SERVICE_TAX) > 0) {
//                 if (SERVICETAX_ACCTCODE == "0") {
//                     alert("Please select Service Tax Account Name.");
//                     return false;
//                 }
//             }
//             else { SERVICETAX_ACCTCODE = ''; }

//             if (this.SupplierNet == null || this.SupplierNet == "" || this.SupplierNet == undefined) {
//                 alert("Please select Supplier / Airline.");
//                 return false;
//             }
//             SupplierNet = this.SupplierNet;

//             FRT_CHARGEABLE_AS_NET = (this.NetRate == 1) ? "AI" : "FS";

//             FRT_PAYABLE_ON_NET = (this.NetFreightPayOn != null) ? this.NetFreightPayOn : "";
//             FRT_RATE_PER_KG_NET = Math.abs(this.NetFreightRate);
//             FRT_RATE_NET = Math.abs(this.NetFreight);

//             FSC_PAYABLE_ON_NET = (this.NetFscPayOn != null) ? this.NetFscPayOn : "";
//             FSC_RATE_PER_KG_NET = Math.abs(this.NetFscRate);
//             FSC_RATE_NET = Math.abs(this.NetFsc);

//             IRC_PAYABLE_ON_NET = (this.NetIrcPayOn != null) ? this.NetIrcPayOn : "";
//             IRC_RATE_PER_KG_NET = Math.abs(this.NetIrcRate);
//             IRC_RATE_NET = Math.abs(this.NetIrc);

//             XRAY_PAYABLE_ON_NET = (this.NetXrayPayOn != null) ? this.NetXrayPayOn : "";
//             XRAY_RATE_PER_KG_NET = Math.abs(this.NetXrayRate);
//             XRAY_RATE_NET = Math.abs(this.NetXray);

//             // if (FRT_CHARGEABLE_AS_NET == 'FS') {
//             //     if (FSC_RATE_NET == 0) {
//             //         alert("Please enter any one NET NET RATE - FSC");
//             //         return false;
//             //     }
//             //        if (FSC_RATE_NET == 0 && IRC_RATE_NET == 0 && XRAY_RATE_NET == 0) {
//             //            alert("Please enter any one NET NET RATE :[FSC] or [IRC] or [X-RAY]");
//             //            return false;
//             //        }

//             // }

//             MC_PAYABLE_ON_NET = (this.NetMcPayOn != null) ? this.NetMcPayOn : "";
//             MC_RATE_PER_KG_NET = Math.abs(this.NetMcRate);
//             MC_RATE_NET = Math.abs(this.NetMc);

//             CTG_PAYABLE_ON_NET = (this.NetCtgPayOn != null || this.NetCtgPayOn != '') ? this.NetCtgPayOn : "";
//             CTG_RATE_PER_KG_NET = (this.NetCtgRate != null || this.NetCtgRate != '') ? Math.abs(this.NetCtgRate) : "";
//             CTG_RATE_NET = Math.abs(this.NetCtg);


//             THC_PAYABLE_ON_NET = (this.NetThcPayOn != null) ? this.NetThcPayOn : "";
//             THC_RATE_PER_KG_NET = Math.abs(this.NetThcRate);
//             THC_RATE_NET = Math.abs(this.NetThc);

//             BP_PAYABLE_ON_NET = (this.NetBPPayOn != null) ? this.NetBPPayOn : "";
//             BP_RATE_PER_KG_NET = (this.NetBPRate != null || this.NetBPRate != '') ? Math.abs(this.NetBPRate) : "";
//             BP_RATE_NET = Math.abs(this.NetBP);

//             DUE_CARRIER_NET = (this.DurCarrierNet != null || this.DurCarrierNet != '') ? Math.abs(this.DurCarrierNet) : "";
//             HAWB_NET = Math.abs(this.HawbNet);
//             PCA_NET = Math.abs(this.PcaNet);
//             DUE_AGENT_NET = (this.DueAgentNet != null || this.DueAgentNet != '') ? Math.abs(this.DueAgentNet) : "";
//             TOTAL_NET = Math.abs(this.TotalNet);
//             OTHER_CHRG_NET = Math.abs(this.OtherNet);
//             AMS_RATE_NET = Math.abs(this.NetAms);
//             OTHER_RATE1_NET = Math.abs(this.OtherAmt1_Net);
//             OTHER_RATE2_NET = Math.abs(this.OtherAmt2_Net);

//             AIR_FRT_COMMISSION = (this.AirFrtCommission != null) ? this.AirFrtCommission : "";
//             FRT_REBATE = this.FrtRebate;
//             BUSINES_PROMO = (this.BusinesPromo != null || this.BusinesPromo != '') ? this.BusinesPromo : "";

//             TRUCK_PAYABLE_ON_NET = (this.NetTruckPayOn != null) ? this.NetTruckPayOn : "";
//             TRUCK_RATE_PER_KG_NET = (this.NetTruckRate != null || this.NetTruckRate != '') ? Math.abs(this.NetTruckRate) : "";
//             TRUCK_RATE_NET = Math.abs(this.NetTruck);

//             if (Math.abs(FRT_RATE_NET) > 0)
//                 FRT_RATE_NET_FRT = this.NetFreightFrt;
//             if (Math.abs(FSC_RATE_NET) > 0)
//                 FSC_RATE_NET_FRT = this.NetFscFrt;
//             if (Math.abs(IRC_RATE_NET) > 0)
//                 IRC_RATE_NET_FRT = this.NetIrcFrt;
//             if (Math.abs(XRAY_RATE_NET) > 0)
//                 XRAY_RATE_NET_FRT = this.NetXrayFrt;
//             if (Math.abs(MC_RATE_NET) > 0)
//                 MC_RATE_NET_FRT = this.NetMcFrt;
//             if (Math.abs(CTG_RATE_NET) > 0)
//                 CTG_RATE_NET_FRT = this.NetCtgFrt;
//             if (Math.abs(THC_RATE_NET) > 0)
//                 THC_RATE_NET_FRT = this.NetThcFrt;
//             if (Math.abs(BP_RATE_NET) > 0)
//                 BP_RATE_NET_FRT = this.NetBPFrt;

//             if (Math.abs(AMS_RATE_NET) > 0)
//                 AMS_RATE_NET_FRT = this.NetAmsFrt;
//             if (Math.abs(HAWB_NET) > 0)
//                 HAWB_RATE_NET_FRT = this.HawbNetFrt;
//             if (Math.abs(PCA_NET) > 0)
//                 PCA_RATE_NET_FRT = this.PcaNetFrt;
//             if (Math.abs(OTHER_CHRG_NET) > 0)
//                 OTHER_RATE_NET_FRT = this.OtherNetFrt;

//             if (Math.abs(OTHER_RATE1_NET) > 0)
//                 OTHER_RATE1_NET_FRT = this.OtherAmt1NetFrt;
//             if (Math.abs(OTHER_RATE2_NET) > 0)
//                 OTHER_RATE2_NET_FRT = this.OtherAmt2NetFrt;

//             if (Math.abs(TRUCK_RATE_NET) > 0)
//                 TRUCK_RATE_NET_FRT = this.NetTruckFrt;


//             DUE_CARRIER_NET_CC = Math.abs(this.DurCarrierNetCC);
//             DUE_AGENT_NET_CC = Math.abs(this.DueAgentNetCC);
//             TOTAL_NET_CC = Math.abs(this.TotalNetCC);
//         }
//         else {
//             let ISNETEDIT = 'N',
//                 SupplierNet = '',
//                 FRT_CHARGEABLE_AS_NET = "AI",
//                 FRT_PAYABLE_ON_NET = '0',
//                 FRT_RATE_PER_KG_NET = '0',
//                 FRT_RATE_NET = '0',

//                 FSC_PAYABLE_ON_NET = '0',
//                 FSC_RATE_PER_KG_NET = '0',
//                 FSC_RATE_NET = '0',

//                 IRC_PAYABLE_ON_NET = '0',
//                 IRC_RATE_PER_KG_NET = '0',
//                 IRC_RATE_NET = '0',

//                 XRAY_PAYABLE_ON_NET = '0',
//                 XRAY_RATE_PER_KG_NET = '0',
//                 XRAY_RATE_NET = '0',

//                 MC_PAYABLE_ON_NET = '0',
//                 MC_RATE_PER_KG_NET = '0',
//                 MC_RATE_NET = '0',

//                 CTG_PAYABLE_ON_NET = '0',
//                 CTG_RATE_PER_KG_NET = '0',
//                 CTG_RATE_NET = '0',

//                 THC_PAYABLE_ON_NET = '0',
//                 THC_RATE_PER_KG_NET = '0',
//                 THC_RATE_NET = '0',

//                 BP_PAYABLE_ON_NET = '0',
//                 BP_RATE_PER_KG_NET = '0',
//                 BP_RATE_NET = '0',

//                 Truck_PAYABLE_ON_NET = '0',
//                 Truck_RATE_PER_KG_NET = '0',
//                 Truck_RATE_NET = '0',

//                 DUE_CARRIER_NET = '0',
//                 HAWB_NET = '0',
//                 PCA_NET = '0',
//                 DUE_AGENT_NET = '0',
//                 TOTAL_NET = '0',
//                 OTHER_CHRG_NET = '0',
//                 AMS_RATE_NET = '0',
//                 OTHER_RATE1_NET = '0',
//                 OTHER_RATE2_NET = '0',

//                 AIR_FRT_COMMISSION = '',
//                 FRT_REBATE = '',
//                 BUSINES_PROMO = '',
//                 TDS = '',
//                 SERVICE_TAX = '';

//             FRT_RATE_NET_FRT = '';
//             FSC_RATE_NET_FRT = '';
//             IRC_RATE_NET_FRT = '';
//             XRAY_RATE_NET_FRT = '';
//             MC_RATE_NET_FRT = '';
//             CTG_RATE_NET_FRT = '';
//             THC_RATE_NET_FRT = '';
//             BP_RATE_NET_FRT = '';
//             AMS_RATE_NET_FRT = '';
//             HAWB_RATE_NET_FRT = '';
//             PCA_RATE_NET_FRT = '';
//             OTHER_RATE_NET_FRT = '';

//             OTHER_RATE1_NET_FRT = '';
//             OTHER_RATE2_NET_FRT = '';
//             DUE_CARRIER_NET_CC = 0;
//             DUE_AGENT_NET_CC = 0;
//             TOTAL_NET_CC = 0;

//             TDS_ACCTCODE = '';
//             SERVICETAX_ACCTCODE = '';
//         }

//         const _jsonData = {
//             EXPTNO: EXPTNO,
//             MAWBNO: MAWBNO,
//             CITYCODE: CITYCODE,
//             CHBL_WGT: CHBL_WGT,
//             GROSS_WGT: GROSS_WGT,
//             CHBL_WGT_USER: CHBL_WGT_USER,
//             GROSS_WGT_USER: GROSS_WGT_USER,
//             FREIGHT: FREIGHT,
//             FRT_CHARGEABLE_AS_TAR: FRT_CHARGEABLE_AS_TAR,
//             FRT_CHARGEABLE_AS_NET: FRT_CHARGEABLE_AS_NET,
//             FRT_PAYABLE_ON_TAR: FRT_PAYABLE_ON_TAR,
//             FRT_RATE_PER_KG_TAR: FRT_RATE_PER_KG_TAR,
//             FRT_RATE_TAR: FRT_RATE_TAR,
//             FRT_PAYABLE_ON_NET: FRT_PAYABLE_ON_NET,
//             FRT_RATE_PER_KG_NET: FRT_RATE_PER_KG_NET,
//             FRT_RATE_NET: FRT_RATE_NET,
//             FSC_PAYABLE_ON_TAR: FSC_PAYABLE_ON_TAR,
//             FSC_RATE_PER_KG_TAR: FSC_RATE_PER_KG_TAR,
//             FSC_RATE_TAR: FSC_RATE_TAR,
//             FSC_PAYABLE_ON_NET: FSC_PAYABLE_ON_NET,
//             FSC_RATE_PER_KG_NET: FSC_RATE_PER_KG_NET,
//             FSC_RATE_NET: FSC_RATE_NET,
//             IRC_PAYABLE_ON_TAR: IRC_PAYABLE_ON_TAR,
//             IRC_RATE_PER_KG_TAR: IRC_RATE_PER_KG_TAR,
//             IRC_RATE_TAR: IRC_RATE_TAR,
//             IRC_PAYABLE_ON_NET: IRC_PAYABLE_ON_NET,
//             IRC_RATE_PER_KG_NET: IRC_RATE_PER_KG_NET,
//             IRC_RATE_NET: IRC_RATE_NET,
//             XRAY_PAYABLE_ON_TAR: XRAY_PAYABLE_ON_TAR,
//             XRAY_RATE_PER_KG_TAR: XRAY_RATE_PER_KG_TAR,
//             XRAY_RATE_TAR: XRAY_RATE_TAR,
//             XRAY_PAYABLE_ON_NET: XRAY_PAYABLE_ON_NET,
//             XRAY_RATE_PER_KG_NET: XRAY_RATE_PER_KG_NET,
//             XRAY_RATE_NET: XRAY_RATE_NET,
//             MC_PAYABLE_ON_TAR: MC_PAYABLE_ON_TAR,
//             MC_RATE_PER_KG_TAR: MC_RATE_PER_KG_TAR,
//             MC_RATE_TAR: MC_RATE_TAR,
//             MC_PAYABLE_ON_NET: MC_PAYABLE_ON_NET,
//             MC_RATE_PER_KG_NET: MC_RATE_PER_KG_NET,
//             MC_RATE_NET: MC_RATE_NET,
//             CTG_PAYABLE_ON_TAR: CTG_PAYABLE_ON_TAR,
//             CTG_RATE_PER_KG_TAR: CTG_RATE_PER_KG_TAR,
//             CTG_RATE_TAR: CTG_RATE_TAR,
//             CTG_PAYABLE_ON_NET: CTG_PAYABLE_ON_NET,
//             CTG_RATE_PER_KG_NET: CTG_RATE_PER_KG_NET,
//             CTG_RATE_NET: CTG_RATE_NET,
//             DUE_CARRIER_TAR: DUE_CARRIER_TAR,
//             DUE_CARRIER_NET: DUE_CARRIER_NET,
//             HAWB_TAR: HAWB_TAR,
//             HAWB_NET: HAWB_NET,
//             PCA_TAR: PCA_TAR,
//             PCA_NET: PCA_NET,
//             DUE_AGENT_TAR: DUE_AGENT_TAR,
//             DUE_AGENT_NET: DUE_AGENT_NET,
//             TOTAL_TAR: TOTAL_TAR,
//             TOTAL_NET: TOTAL_NET,
//             OTHER_CHRG_TAR: OTHER_CHRG_TAR,
//             OTHER_CHRG_NET: OTHER_CHRG_NET,
//             REMARK: REMARK,
//             AMS_RATE_TAR: AMS_RATE_TAR,
//             AMS_RATE_NET: AMS_RATE_NET,
//             OTHER_NAME1: OTHER_NAME1,
//             OTHER_NAME2: OTHER_NAME2,
//             OTHER_RATE1_TAR: OTHER_RATE1_TAR,
//             OTHER_RATE2_TAR: OTHER_RATE2_TAR,
//             OTHER_RATE1_NET: OTHER_RATE1_NET,
//             OTHER_RATE2_NET: OTHER_RATE2_NET,
//             OTHER_RATE1_TAR_CAL: OTHER_RATE1_TAR_CAL,
//             OTHER_RATE2_TAR_CAL: OTHER_RATE2_TAR_CAL,
//             OTHER_RATE1_NET_CAL: OTHER_RATE1_NET_CAL,
//             OTHER_RATE2_NET_CAL: OTHER_RATE2_NET_CAL,
//             ISNETEDIT: ISNETEDIT,
//             ISMIN: ISMIN,
//             SUPPLIER_NET: SupplierNet,
//             AIR_FRT_COMM_NET: AIR_FRT_COMMISSION,
//             FRT_REBATE_NET: FRT_REBATE,
//             TDS_NET: TDS,
//             SERVICE_TAX_NET: SERVICE_TAX,
//             FRT_RATE_TAR_FRT: FRT_RATE_TAR_FRT,
//             FSC_RATE_TAR_FRT: FSC_RATE_TAR_FRT,
//             IRC_RATE_TAR_FRT: IRC_RATE_TAR_FRT,
//             XRAY_RATE_TAR_FRT: XRAY_RATE_TAR_FRT,
//             MC_RATE_TAR_FRT: MC_RATE_TAR_FRT,
//             CTG_RATE_TAR_FRT: CTG_RATE_TAR_FRT,
//             AMS_RATE_TAR_FRT: AMS_RATE_TAR_FRT,
//             HAWB_RATE_TAR_FRT: HAWB_RATE_TAR_FRT,
//             PCA_RATE_TAR_FRT: PCA_RATE_TAR_FRT,
//             OTHER_RATE_TAR_FRT: OTHER_RATE_TAR_FRT,
//             FRT_RATE_NET_FRT: FRT_RATE_NET_FRT,
//             FSC_RATE_NET_FRT: FSC_RATE_NET_FRT,
//             IRC_RATE_NET_FRT: IRC_RATE_NET_FRT,
//             XRAY_RATE_NET_FRT: XRAY_RATE_NET_FRT,
//             MC_RATE_NET_FRT: MC_RATE_NET_FRT,
//             CTG_RATE_NET_FRT: CTG_RATE_NET_FRT,
//             AMS_RATE_NET_FRT: AMS_RATE_NET_FRT,
//             HAWB_RATE_NET_FRT: HAWB_RATE_NET_FRT,
//             PCA_RATE_NET_FRT: PCA_RATE_NET_FRT,
//             OTHER_RATE_NET_FRT: OTHER_RATE_NET_FRT,
//             OTHER_RATE1_TAR_FRT: OTHER_RATE1_TAR_FRT,
//             OTHER_RATE2_TAR_FRT: OTHER_RATE2_TAR_FRT,
//             DUE_CARRIER_TAR_CC: DUE_CARRIER_TAR_CC,
//             DUE_AGENT_TAR_CC: DUE_AGENT_TAR_CC,
//             TOTAL_TAR_CC: TOTAL_TAR_CC,
//             OTHER_RATE1_NET_FRT: OTHER_RATE1_NET_FRT,
//             OTHER_RATE2_NET_FRT: OTHER_RATE2_NET_FRT,
//             DUE_CARRIER_NET_CC: DUE_CARRIER_NET_CC,
//             DUE_AGENT_NET_CC: DUE_AGENT_NET_CC,
//             TOTAL_NET_CC: TOTAL_NET_CC,
//             TDS_ACCTCODE: TDS_ACCTCODE,
//             SERVICETAX_ACCTCODE: SERVICETAX_ACCTCODE,
//             AGENTS_RATE: AGENTS_RATE,
//             THC_PAYABLE_ON_TAR: THC_PAYABLE_ON_TAR,
//             THC_RATE_PER_KG_TAR: THC_RATE_PER_KG_TAR,
//             THC_RATE_TAR: THC_RATE_TAR,
//             THC_PAYABLE_ON_NET: THC_PAYABLE_ON_NET,
//             THC_RATE_PER_KG_NET: THC_RATE_PER_KG_NET,
//             THC_RATE_NET: THC_RATE_NET,
//             THC_RATE_TAR_FRT: THC_RATE_TAR_FRT,
//             THC_RATE_NET_FRT: THC_RATE_NET_FRT,
//             BUSINES_PROMO_NET: BUSINES_PROMO,
//             BP_PAYABLE_ON_TAR: BP_PAYABLE_ON_TAR,
//             BP_RATE_PER_KG_TAR: BP_RATE_PER_KG_TAR,
//             BP_RATE_TAR: BP_RATE_TAR,
//             BP_PAYABLE_ON_NET: BP_PAYABLE_ON_NET,
//             BP_RATE_PER_KG_NET: BP_RATE_PER_KG_NET,
//             BP_RATE_NET: BP_RATE_NET,
//             BP_RATE_TAR_FRT: BP_RATE_TAR_FRT,
//             BP_RATE_NET_FRT: BP_RATE_NET_FRT,
//             CmpCode: this._loginService.getLogin()[0].CMPCODE,
//             CmpId: this._loginService.getLogin()[0].CMPID,
//             MakerIp: this._loginService.getLogin()[0].MAKERIP, //Change later by Ip
//             DEST_TRUCKING_PAYABLE_ON_TAR: Truck_PAYABLE_ON_TAR,
//             DEST_TRUCKING_RATE_PER_KG_TAR: Truck_RATE_PER_KG_TAR,
//             DEST_TRUCKING_RATE_TAR: Truck_RATE_TAR,
//             DEST_TRUCKING_PAYABLE_ON_NET: TRUCK_PAYABLE_ON_NET,
//             DEST_TRUCKING_RATE_PER_KG_NET: TRUCK_RATE_PER_KG_NET,
//             DEST_TRUCKING_RATE_NET: TRUCK_RATE_NET,
//             DEST_TRUCKING_RATE_TAR_FRT: TRUCK_RATE_TAR_FRT,
//             DEST_TRUCKING_RATE_NET_FRT: TRUCK_RATE_NET_FRT,
//             VGUID: this._loginService.getLogin()[0].GUID,
//         };
//         this._loaderService.display(true);
//         //  this.saveMAWBALChargesdetails("30521","15778704102")
//         this._dataService.Common("Export/EXP_MST_EXPORT_MAWB_PP_CC_UPDATE", _jsonData)
//             .subscribe((data: any) => {
//                 if (data.Table[0].STATUS.split('#')[0] == '100') {
//                     this._toasterService.toast('success', 'Alert', data.Table[0].STATUS.split('#')[1]);
//                     ///  this.saveMAWBALChargesdetails("30521","15778704102")
//                     this._loaderService.display(false);
//                 }
//                 else {
//                     this._toasterService.toast('error', 'error', data.Table[0].STATUSTEXT);
//                     this._loaderService.display(false);
//                 }
//             });
//     }
//     saveMAWBALChargesdetails(fkid, mawbno) {
//         let strData = '';
//         this.dtAirLineCharges.forEach((key) => {
//             strData += fkid
//                 + '@' + mawbno
//                 + '@' + key["CHARGECODE"]
//                 + '@' + key["CHARGETYPE"]
//                 + '@' + key["CHRGAMT1"]
//                 + '@' + key["FREIGHT1"]
//                 + '@' + key["CHRGAMT2"]
//                 + '@' + key["FREIGHT2"]
//                 + '|';

//         });
//         this._loaderService.display(true);
//         const _jsonData = {
//             MAWBNO: mawbno,
//             StrData: strData
//         };
//         this._dataService.Common("Export/Expt_MAWB_ALCharges_IU", _jsonData)
//             .subscribe((data: any) => {
//                 this._loaderService.display(false);
//                 alert("Data Updated Successfully");

//             });
//     }
//     validate() {
//         if (this._loginService.getLogin()[0].ROLETYPE != 'SA') {
//             if (this.hdRightsView == true && (this.NetRightsAdd == false || this.NetRights == false)) {
//                 alert("You dont have rights to add/update");
//                 return false;
//             }
//         }

//         if (this.ISAUTO_FRT_INV == "1") { alert("MAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This MAWB !!"); return false; }
//         else { this.fn_MAWB_IU(); }

//     }
// }

@Component({
    selector: 'app-consignment-hawb-edit',
    templateUrl: 'consign_main_hawb_rating.component.html'
    // styleUrls: ['../../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'],
    // encapsulation: ViewEncapsulation.None
})
export class HAWBEditComponent   {

    @Input() exptno: any;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

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
        selectorHeight: '180px',
        selectorWidth: '200px'
    };

    rateList: any = [];
    currencyList: any = [{ VALUEFIELD: 'INR', TEXTFIELD: 'INR' }, { VALUEFIELD: 'USD', TEXTFIELD: 'USD' }];

    Type: any = '';
    TransportMode: any = null;

    NetRate: any = '';
    CityCode: any = '';

    dataMode: string = '';

    Wgt: any = '';
    UserWgt: any = '';
    GrossWeight: any = '';
    UserGrossWeight: any = '';
    FreightRate: any = 'PP';
    PrepaidPercent: any = null;
    CollectPer: any = '';
    Procument: any = '';

    FreightChargeble: any = '';
    FrtSell: any = 'FREIGHT(ALL INCLUSIVE)';
    RateAgreedby: any = '';
    RateAgreedOn: any = '';
    TxtExchRate: any = '';
    DrpExchRate: any = null;
    InrRate: any = '';

    RateFreightPayOn: any = 'CW';
    RateFreight: any = '';
    Ppchrg_Selling: any = '';
    PPchrg_SellingCur: any = 'INR';
    Ppchrg_SellingInr: any = '';
    Ccchrg_Selling: any = '';
    Ccchrg_SellingCur: any = 'INR';
    Ccchrg_SellingInr: any = '';

    RateFscPayOn: any = null;
    RateFsc: any = '';
    PpFsc_Selling: any = '';
    PpFsc_SellingCur: any = 'INR';
    PpFsc_SellingInr: any = '';
    CcFsc_Selling: any = '';
    CcFsc_SellingCur: any = 'INR';
    CcFsc_SellingInr: any = '';

    RateIrcPayOn: any = null;
    RateIrc: any = '';
    PpIrc_Selling: any = '';
    PpIrc_SellingCur: any = 'INR';
    PpIrc_SellingInr: any = '';
    CcIrc_Selling: any = '';
    CcIrc_SellingCur: any = 'INR';
    CcIrc_SellingInr: any = '';

    RateXrayPayOn: any = null;
    RateXray: any = '';
    PpXray_Selling: any = '';
    PpXray_SellingCur: any = 'INR';
    PpXray_SellingInr: any = '';
    CcXray_Selling: any = '';
    CcXray_SellingCur: any = 'INR';
    CcXray_SellingInr: any = '';

    McPayOn: any = 'CW';
    McRate: any = '';
    McRatePP: any = '';
    McCurPP: any = 'INR';
    McRatePPInr: any = '';
    McRateCC: any = '';
    McCur: any = 'INR';
    McCCInr: any = '';

    fobPayOn: any = 'CW';
    fobRate: any = '';
    fobRatePP: any = '';
    fobCurPP: any = 'INR';
    fobRatePPInr: any = '';
    fobRateCC: any = '';
    fobCur: any = 'INR';
    fobCCInr: any = '';


    CtgPayOn: any = 'GW';
    CtgRate: any = '';
    CtgRatePP: any = '';
    CtgCurPP: any = 'INR';
    CtgRatePPInr: any = '';
    CtgRateCC: any = '';
    CtgCur: any = 'INR';
    CtgCCInr: any = '';

    ThcPayOn: any = 'CW';
    ThcRate: any = '';
    ThcRatePP: any = '';
    ThcCurPP: any = 'INR';
    ThcRatePPInr: any = '';
    ThcRateCC: any = '';
    ThcCur: any = 'INR';
    ThcCCInr: any = '';

    DdcPayOn: any = 'CW';
    DdcRate: any = '';
    DdcRatePP: any = '';
    DdcCurPP: any = 'INR';
    DdcRatePPInr: any = '';
    DdcRateCC: any = '';
    DdcCur: any = 'INR';
    DdcCCInr: any = '';

    DcRatePP: any = '';
    DcCurPP: any = 'INR';
    DcRatePPInr: any = '';
    DcRateCC: any = '';
    DcCur: any = 'INR';
    DcCCInr: any = '';

    ScrRatePP: any = '';
    ScrCurPP: any = 'INR';
    ScrRatePPInr: any = '';
    ScrRateCC: any = '';
    ScrCur: any = 'INR';
    ScrCCInr: any = '';

    MycRatePP: any = '';
    MycCurPP: any = 'INR';
    MycRatePPInr: any = '';
    MycRateCC: any = '';
    MycCur: any = 'INR';
    MycCCInr: any = '';

    Pptotcarr_Selling: any = '';
    Cctotcarr_SellingInr: any = '';

    HawbRatePP: any = '';
    HawbCurPP: any = 'INR';
    HawbRatePPInr: any = '';
    HawbRateCC: any = '';
    HawbCur: any = 'INR';
    HawbCCInr: any = '';

    PcaRatePP: any = '';
    PcaCurPP: any = 'INR';
    PcaRatePPInr: any = '';
    PcaRateCC: any = '';
    PcaCur: any = 'INR';
    PcaCCInr: any = '';

    Pptotagt_Selling: any = '';
    Cctotagt_SellingInr: any = '';

    Pptot_Selling: any = '';
    Cctot_Selling: any = '';

    OtherRatePP: any = '';
    OtherRateCurPP: any = 'INR';
    OtherRatePPInr: any = '';
    OtherRateCC: any = '';
    OtherRateCur: any = 'INR';
    OtherRateInr: any = '';

    Remark: any = '';

    CurrencyPopulated: any = '';

    ISNUMERIC_CHRGWT: any = '';
    ISNUMERIC_GRWT: any = '';
    ISAUTO_FRT_INV: any = '';

    ErrorMessage: any = null;
//AIRLINE CHARGES
dtAirLineCharges: Array<any> = [];
AirLineCharges: any = [];
AllAirLineChargeslist:any=[];
ChrgTypelist:any=[];
ChrgTypelistold:Array<any> = [];
CHARGETYPE:string;
DELCHARGETYPE:string;
CHARGENAME:string;
EDIT_RATE_TAR:any = null;
DEL_RATE_TAR:any = null;
RATE_TAR: any = null;
EDIT_RATE_TAR_FRT:string;
RATE_TAR_FRT:string="";
DEL_RATE_TAR_FRT:string;
EDIT_CHARGETYPE:string;
RATE_NET: any = null;
EDIT_RATE_NET:any = null;
DEL_RATE_NET:any = null;
RATE_NET_FRT:string;
DEL_RATE_NET_FRT:string;
EDIT_RATE_NET_FRT:string;
childID:string="0";
Chargeslist: any = [];
makerid:string;
guid :string="";
txtchild : string ="Add"
CHRGDETAILSID:string="0";
FK_ID: string="0";
PK_ID: string="0";
tot_rate_tar_pp_da:any = null;
tot_rate_tar_pp_dc:any = null;
tot_rate_tar_cc_da:any = null;
tot_rate_tar_cc_dc:any = null;
tot_rate_net_pp_da:any = null;
tot_rate_net_pp_dc:any = null;
tot_rate_net_cc_da:any = null;
tot_rate_net_cc_dc:any = null;

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) {
        this.exptno = this.exptno;
    }


    changefunHawb(){
        var verifyData = null;

        this._loginService.verifyRights(236, '')
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this._loginService.checkVerify('Modify', data);  //For verify user access
                verifyData = data.Table;
                this.ResetHAWBCharges();
                this.setDropDownData();
                this.setData(this._sharedconsig.exportEditData.HAWBNO, this._loginService.getLogin()[0].CMP_USERENCCODE, this._sharedconsig.exportEditData.EXPTNO);
            });
    }

    checkType(num: number) {
        this.Type = num;
    }

    setDropDownData() {
        this._loaderService.display(true);
        this._dataService.getData("Export/ConsignmentHAWBFill_DROPDOWN", null)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.rateList = data.Table;
                this.AllAirLineChargeslist=data.Table1
                this.ChrgTypelist=data.Table2;
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

    setData(hawbno, code, exptno) {
        const _jsonData = {
            Type1: this._loginService.getLogin()[0].CMP_USERENCCODE,
            Type2: hawbno,
            Type3: exptno,
            GUID:this._loginService.getLogin()[0].GUID
        };
        this._loaderService.display(true);
        this._dataService.getData("Export/Consignment_HAWB_PP_CC_View", _jsonData)
            .subscribe((data: any) => {

                this.CityCode = data.Table[0].CITYCODE;

                if (data.Table1[0].IS_AGREED_RATED == "A") {
                    this.Type = 1;
                } else if (data.Table1[0].IS_AGREED_RATED == "R") {
                    this.Type = 2;
                }
                this.Wgt = data.Table1[0].CHRGWT;
                this.GrossWeight = data.Table1[0].GROSSWT;
                this.UserWgt = data.Table1[0].CHARGEBLE_WT;
                this.UserGrossWeight = data.Table1[0].GROSS_WT;
                this.FreightRate = data.Table1[0].FREIGHT_RATE_PER_KG;
                this.PrepaidPercent = data.Table1[0].PREPAID_PER;
                this.CollectPer = data.Table1[0].COLLECT_PER;
                if (data.Table1[0].FREIGHT_CHARGABLE_AS == "AI") {
                    this.FreightChargeble = 1;
                } else if (data.Table1[0].FREIGHT_CHARGABLE_AS == "FS") {
                    this.FreightChargeble = 2;
                }
                this.RateAgreedby = data.Table1[0].RATE_AGREED_BY;
                this.RateAgreedOn = (data.Table1[0].RATE_AGREED_ON != "") ? this._dataService.stringdttoArry(data.Table1[0].RATE_AGREED_ON) : null;
                this.TxtExchRate = data.Table1[0].EXCH_RATE;
                if (data.Table1[0].EXCH_CUR != "") {
                    this.DrpExchRate = data.Table1[0].EXCH_CUR;
                    this.changeCurrencyList(data.Table1[0].EXCH_CUR);
                }
                this.InrRate = data.Table1[0].INR_RATE;
                if (data.Table1[0].EXCH_CUR == "") {
                    this.CurrencyPopulated = "N";
                }
                this.RateFreight = data.Table1[0].FREIGHT_RATE_BASIC;
                this.Ppchrg_Selling = data.Table1[0].PPCHRG_SELLING;
                this.PPchrg_SellingCur = (data.Table1[0].PPCHRG_SELLING_CUR == "") ? "INR" : data.Table1[0].PPCHRG_SELLING_CUR;
                this.Ppchrg_SellingInr = data.Table1[0].PPCHRG_SELLING_INR;
                this.Ccchrg_Selling = data.Table1[0].CCCHRG_SELLING;
                this.Ccchrg_SellingCur = data.Table1[0].CCCHRG_SELLING_CUR;
                this.Ccchrg_SellingInr = data.Table1[0].CCCHRG_SELLING_INR;
                this.RateFreightPayOn = (data.Table1[0].FREIGHT_RATE_BASIC_PO == "") ? null : data.Table1[0].FREIGHT_RATE_BASIC_PO;
                this.RateFscPayOn = (data.Table1[0].FRT_RATE_SCHRG_FSC_PO == "") ? null : data.Table1[0].FRT_RATE_SCHRG_FSC_PO;
                this.RateIrcPayOn = (data.Table1[0].FRT_RATE_SCHRG_IRC_PO == "") ? null : data.Table1[0].FRT_RATE_SCHRG_IRC_PO;
                this.RateXrayPayOn = (data.Table1[0].FRT_RATE_SCHRG_XRAY_PO == "") ? null : data.Table1[0].FRT_RATE_SCHRG_XRAY_PO;

                this.RateFsc = data.Table1[0].FRT_RATE_SCHRG_FSC;
                this.PpFsc_Selling = data.Table1[0].PP_SCHRG_FSC_SELL;
                this.PpFsc_SellingInr = data.Table1[0].PP_SCHRG_FSC_SELL_INR;
                this.PpFsc_SellingCur = (data.Table1[0].PP_SCHRG_FSC_SELL_CUR == "") ? "INR" : data.Table1[0].PP_SCHRG_FSC_SELL_CUR;
                this.CcFsc_Selling = data.Table1[0].CC_SCHRG_FSC_SELL;
                this.CcFsc_SellingInr = data.Table1[0].CC_SCHRG_FSC_SELL_INR;
                this.CcFsc_SellingCur = (data.Table1[0].CC_SCHRG_FSC_SELL_CUR == "") ? "INR" : data.Table1[0].CC_SCHRG_FSC_SELL_CUR;
                this.RateIrc = data.Table1[0].FRT_RATE_SCHRG_IRC;
                this.PpIrc_Selling = data.Table1[0].PP_SCHRG_IRC_SELL;
                this.PpIrc_SellingInr = data.Table1[0].PP_SCHRG_IRC_SELL_INR;
                this.PpIrc_SellingCur = (data.Table1[0].PP_SCHRG_IRC_SELL_CUR == "") ? "INR" : data.Table1[0].PP_SCHRG_IRC_SELL_CUR;
                this.CcIrc_Selling = data.Table1[0].CC_SCHRG_IRC_SELL;
                this.CcIrc_SellingInr = data.Table1[0].CC_SCHRG_IRC_SELL_INR;
                this.CcIrc_SellingCur = (data.Table1[0].CC_SCHRG_IRC_SELL_CUR == "") ? "INR" : data.Table1[0].CC_SCHRG_IRC_SELL_CUR;


                this.RateXray = data.Table1[0].FRT_RATE_SCHRG_XRAY;
                this.PpXray_Selling = data.Table1[0].PP_SCHRG_XRAY_SELL;
                this.PpXray_SellingInr = data.Table1[0].PP_SCHRG_XRAY_SELL_INR;
                this.PpXray_SellingCur = (data.Table1[0].PP_SCHRG_XRAY_SELL_CUR == "") ? "INR" : data.Table1[0].PP_SCHRG_XRAY_SELL_CUR;
                this.CcXray_Selling = data.Table1[0].CC_SCHRG_XRAY_SELL;
                this.CcXray_SellingInr = data.Table1[0].CC_SCHRG_XRAY_SELL_INR;
                this.CcXray_SellingCur = (data.Table1[0].CC_SCHRG_XRAY_SELL_CUR == "") ? "INR" : data.Table1[0].CC_SCHRG_XRAY_SELL_CUR;

                this.McRate = data.Table1[0].FRT_RATE_MC;
                this.McRatePP = data.Table1[0].PP_MC_SELL;
                this.McRatePPInr = data.Table1[0].PP_MC_SELL_INR;
                this.McCurPP = (data.Table1[0].PP_MC_SELL_CUR == "") ? "INR" : data.Table1[0].PP_MC_SELL_CUR;
                this.McRateCC = data.Table1[0].CC_MC_SELL;
                this.McCCInr = data.Table1[0].CC_MC_SELL_INR;
                this.McCur = (data.Table1[0].CC_MC_SELL_CUR == "") ? "INR" : data.Table1[0].CC_MC_SELL_CUR;

                this.ThcRate = data.Table1[0].FRT_RATE_THC;
                this.ThcRatePP = data.Table1[0].PP_THC_SELL;
                this.ThcRatePPInr = data.Table1[0].PP_THC_SELL_INR;
                this.ThcCurPP = (data.Table1[0].PP_THC_SELL_CUR == "") ? "INR" : data.Table1[0].PP_THC_SELL_CUR;
                this.ThcRateCC = data.Table1[0].CC_THC_SELL;
                this.ThcCCInr = data.Table1[0].CC_THC_SELL_INR;
                this.ThcCur = (data.Table1[0].CC_THC_SELL_CUR == "") ? "INR" : data.Table1[0].CC_THC_SELL_CUR;

                this.CtgRate = data.Table1[0].FRT_RATE_CTG;
                this.CtgRatePP = data.Table1[0].PP_CTG_SELL;
                this.CtgRatePPInr = data.Table1[0].PP_CTG_SELL_INR;
                this.CtgCurPP = (data.Table1[0].PP_CTG_SELL_CUR == "") ? "INR" : data.Table1[0].PP_CTG_SELL_CUR;
                this.CtgRateCC = data.Table1[0].CC_CTG_SELL;
                this.CtgCCInr = data.Table1[0].CC_CTG_SELL_INR;
                this.CtgCur = (data.Table1[0].CC_CTG_SELL_CUR == "") ? "INR" : data.Table1[0].CC_CTG_SELL_CUR;

                this.DdcRate = data.Table1[0].FRT_RATE_DDC;
                this.DdcRatePP = data.Table1[0].PP_DDC_SELL;
                this.DdcRatePPInr = data.Table1[0].PP_DDC_SELL_INR;
                this.DdcCurPP = (data.Table1[0].PP_DDC_SELL_CUR == "") ? "INR" : data.Table1[0].PP_DDC_SELL_CUR;
                this.DdcRateCC = data.Table1[0].CC_DDC_SELL;
                this.DdcCCInr = data.Table1[0].CC_DDC_SELL_INR;
                this.DdcCur = (data.Table1[0].CC_DDC_SELL_CUR == "") ? "INR" : data.Table1[0].CC_DDC_SELL_CUR;

                this.DcRatePP = data.Table1[0].PP_DC_SELL;
                this.DcRatePPInr = data.Table1[0].PP_DC_SELL_INR;
                this.DcCurPP = (data.Table1[0].PP_DC_SELL_CUR == "") ? "INR" : data.Table1[0].PP_DC_SELL_CUR;
                this.DcRateCC = data.Table1[0].CC_DC_SELL;
                this.DcCCInr = data.Table1[0].CC_DC_SELL_INR;
                this.DcCur = (data.Table1[0].CC_DC_SELL_CUR == "") ? "INR" : data.Table1[0].CC_DC_SELL_CUR;

                this.ScrRatePP = data.Table1[0].PP_SCR_SELL;
                this.ScrRatePPInr = data.Table1[0].PP_SCR_SELL_INR;
                this.ScrCurPP = (data.Table1[0].PP_SCR_SELL_CUR == "") ? "INR" : data.Table1[0].PP_SCR_SELL_CUR;
                this.ScrRateCC = data.Table1[0].CC_SCR_SELL;
                this.ScrCCInr = data.Table1[0].CC_SCR_SELL_INR;
                this.ScrCur = (data.Table1[0].CC_SCR_SELL_CUR == "") ? "INR" : data.Table1[0].CC_SCR_SELL_CUR;

                this.MycRatePP = data.Table1[0].PP_MYC_SELL;
                this.MycRatePPInr = data.Table1[0].PP_MYC_SELL_INR;
                this.MycCurPP = (data.Table1[0].PP_MYC_SELL_CUR == "") ? "INR" : data.Table1[0].PP_MYC_SELL_CUR;
                this.MycRateCC = data.Table1[0].CC_MYC_SELL;
                this.MycCCInr = data.Table1[0].CC_MYC_SELL_INR;
                this.MycCur = (data.Table1[0].CC_MYC_SELL_CUR == "") ? "INR" : data.Table1[0].CC_MYC_SELL_CUR;

                this.Pptotcarr_Selling = data.Table1[0].PPTOTCARR_SELLING;
                this.Cctotcarr_SellingInr = data.Table1[0].CCTOTCARR_SELLING_INR;

                this.HawbRatePP = data.Table1[0].PP_HAWB_SELL;
                this.HawbRatePPInr = data.Table1[0].PP_HAWB_SELL_INR;
                this.HawbCurPP = (data.Table1[0].PP_HAWB_SELL_CUR == "") ? "INR" : data.Table1[0].PP_HAWB_SELL_CUR;
                this.HawbRateCC = data.Table1[0].CC_HAWB_SELL;
                this.HawbCCInr = data.Table1[0].CC_HAWB_SELL_INR;
                this.HawbCur = (data.Table1[0].CC_HAWB_SELL_CUR == "") ? "INR" : data.Table1[0].CC_HAWB_SELL_CUR;

                this.PcaRatePP = data.Table1[0].PP_PCA_SELL;
                this.PcaRatePPInr = data.Table1[0].PP_PCA_SELL_INR;
                this.PcaCurPP = (data.Table1[0].PP_PCA_SELL_CUR == "") ? "INR" : data.Table1[0].PP_PCA_SELL_CUR;
                this.PcaRateCC = data.Table1[0].CC_PCA_SELL;
                this.PcaCCInr = data.Table1[0].CC_PCA_SELL_INR;
                this.PcaCur = (data.Table1[0].CC_PCA_SELL_CUR == "") ? "INR" : data.Table1[0].CC_PCA_SELL_CUR;

                this.Pptotagt_Selling = data.Table1[0].PPTOTAGT_SELLING;
                this.Cctotagt_SellingInr = data.Table1[0].CCTOTAGT_SELLING_INR;
                this.Pptot_Selling = data.Table1[0].PPTOT_SELLING;
                this.Cctot_Selling = data.Table1[0].CCTOT_SELLING;

                this.OtherRatePP = data.Table1[0].PP_OTHER_SELL;
                this.OtherRatePPInr = data.Table1[0].PP_OTHER_SELL_INR;
                this.OtherRateCurPP = (data.Table1[0].PP_OTHER_SELL_CUR == "") ? "INR" : data.Table1[0].PP_OTHER_SELL_CUR;
                this.OtherRateCC = data.Table1[0].CC_OTHER_SELL;
                this.OtherRateInr = data.Table1[0].CC_OTHER_SELL_INR;
                this.OtherRateCur = (data.Table1[0].CC_OTHER_SELL_CUR == "") ? "INR" : data.Table1[0].CC_OTHER_SELL_CUR;

                this.TransportMode = (data.Table1[0].TRANS_MODE != "") ? data.Table1[0].TRANS_MODE : null;

                this.Remark = data.Table1[0].REMARK;
                this.Procument = data.Table1[0].BUSI_PROCUR_EXPENCES;

                this.ISNUMERIC_CHRGWT = data.Table1[0].ISNUMERIC_CHRGWT;
                this.ISNUMERIC_GRWT = data.Table1[0].ISNUMERIC_GRWT;
                this.ISAUTO_FRT_INV = data.Table1[0].FRTINV_FLG;

                this.fobRate = data.Table1[0].FRT_RATE_FOB;
                this.fobRatePP = data.Table1[0].PP_FOB_SELL;
                this.fobRatePPInr = data.Table1[0].PP_FOB_SELL_INR;
                this.fobCurPP = (data.Table1[0].PP_FOB_SELL_CUR == "") ? "INR" : data.Table1[0].PP_FOB_SELL_CUR;
                this.fobRateCC = data.Table1[0].CC_FOB_SELL;
                this.fobCCInr = data.Table1[0].CC_FOB_SELL_INR;
                this.fobCur = (data.Table1[0].CC_FOB_SELL_CUR == "") ? "INR" : data.Table1[0].CC_FOB_SELL_CUR;
                  ///ADDED BY NALINI FOR AIRLINECHARGES
              this.Chargeslist=data.Table2
              this.tot_rate_tar_pp_da=data.Table3[0].RATE_TAR_TOTAL_PP_DA;
              this.tot_rate_net_pp_da=data.Table3[0].RATE_NET_TOTAL_PP_DA;
              this.tot_rate_tar_cc_da=data.Table4[0].RATE_TAR_TOTAL_CC_DA;
              this.tot_rate_net_cc_da=data.Table4[0].RATE_NET_TOTAL_CC_DA;
              this.tot_rate_tar_pp_dc=data.Table5[0].RATE_TAR_TOTAL_PP_DC;
              this.tot_rate_net_pp_dc=data.Table5[0].RATE_NET_TOTAL_PP_DC;
              this.tot_rate_tar_cc_dc=data.Table6[0].RATE_TAR_TOTAL_CC_DC;
              this.tot_rate_net_cc_dc=data.Table6[0].RATE_NET_TOTAL_CC_DC;


                if ((this.UserWgt == "0" || this.UserWgt == "0.00") && (this.UserGrossWeight == "0" || this.UserGrossWeight == "0.00")) {
                    if (this.ISNUMERIC_CHRGWT == 0 && this.ISNUMERIC_GRWT == 0) {
                        this.UserWgt = "0";
                        this.UserGrossWeight = "0";
                        this.ErrorMessage = "Invalid gross weigt and chargeble weight!";
                    } else if (this.ISNUMERIC_CHRGWT == 0 && this.ISNUMERIC_GRWT == 1) {
                        this.UserWgt = "0";
                        this.UserGrossWeight = this.GrossWeight;
                        this.ErrorMessage = "Invalid chargeble weight !";
                    } else if (this.ISNUMERIC_CHRGWT == 1 && this.ISNUMERIC_GRWT == "0") {
                        this.Wgt = "0";
                        this.UserWgt = this.Wgt;
                        this.UserGrossWeight = "0";
                        this.ErrorMessage = "Invalid Gross weight !";
                    } else if (this.ISNUMERIC_CHRGWT == 1 && this.ISNUMERIC_GRWT == 1) {
                        this.UserWgt = this.Wgt;
                        this.UserGrossWeight = this.GrossWeight;
                    }

                }
               if ( this.ISAUTO_FRT_INV=="1")
               {
                   alert("HAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This HAWB !!");
                   this._toasterService.toast('warning', 'warning', "HAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This HAWB !!");
               }
                this._loaderService.display(false);
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                    this._loaderService.display(false);
                },
                () => { });
    }

    changeCurrencyList(val: string) {
        if (val != "" && val != "EURO") {
            this.currencyList = [{ VALUEFIELD: 'INR', TEXTFIELD: 'INR' }, { VALUEFIELD: val, TEXTFIELD: val }];
            this.PPchrg_SellingCur=val;
            this.Ccchrg_SellingCur=val;
            this.PpFsc_SellingCur=val;
            this.CcFsc_SellingCur=val;
            this.PpIrc_SellingCur=val;
            this.CcIrc_SellingCur=val;
            this.PpXray_SellingCur=val;
            this.CcXray_SellingCur=val;
            this.McCurPP=val;
            this.McCur=val;
            this.fobCurPP=val;
            this.fobCur=val;
            this.CtgCurPP=val;
            this.CtgCur=val;
            this.DcCurPP=val;
            this.DcCur=val;
            this.ScrCurPP=val;
            this.ScrCur=val;
            this.MycCurPP=val;
            this.MycCur=val;
            this.HawbCurPP=val;
            this.HawbCur=val;
            this.PcaCurPP=val;
            this.PcaCur=val;
            this.OtherRateCurPP=val;
            this.OtherRateCur=val;
        }
    }

    changeFreight(fType: string) {   //fn_ChangeFreightRatePerKG  original function
        this.PrepaidPercent = null;
        this.CollectPer = "";
        this.clearCharges();
        this.fn_ChangeFreight_CC_PP_PC();
    }

    changePrepaidPercentage(ppType: number) {   //fn_ChangePrepaidPercentage  original function
        if (this.PrepaidPercent != null) {
            var Prepaid, Collect;
            Prepaid = Math.abs(ppType);
            Collect = 100 - Math.abs(Prepaid);
            this.CollectPer = Collect;
        }
        else {
            this.CollectPer = '';
        }
        this.clearCharges();
    }

    changeFreightChargebleAs(fcType: number) {   //fn_ChangeFreight_Chargeble_As  original function
        this.FreightChargeble = fcType;
        this.FrtSell = (fcType == 1) ? "FREIGHT (ALL INCLUSIVE)" : "FREIGHT (BASIC)";
        if (fcType == 1) {
            this.RateFsc = "";
            this.PpFsc_Selling = "";
            this.CcFsc_Selling = "";
            this.PpFsc_SellingCur = "INR";
            this.CcFsc_SellingCur = "INR";
            this.RateFscPayOn = null;
            this.RateIrc = "";
            this.PpIrc_Selling = "";
            this.PpIrc_SellingCur = "INR";
            this.CcIrc_Selling = "";
            this.CcIrc_SellingCur = "INR";
            this.RateIrcPayOn = null;
            this.RateXray = "";
            this.PpXray_Selling = "";
            this.PpXray_SellingCur = "INR";
            this.CcXray_Selling = "";
            this.CcXray_SellingCur = "INR";
            this.RateXrayPayOn = null;
        }
        this.fn_ChangeFreight_CC_PP_PC();
    }

    checkExchangeRateDrp(CtrlName) {  //fnChkExchangeRateDrp  original function

    }

    checkExchRateCurDrp(erType: string) {    //fnCheck_ExchRate_CurDrp  original function
        let ExchCur = erType;
        let NEW_VALUE = (ExchCur != null) ? ExchCur : "";

        this.changeCurrencyList(NEW_VALUE);
        this.fnCalCC_HAWBFreight();
        this.fnCalPP_HAWBFreight();
    }

    clearCharges() {     //fn_ClearCharges original function
        this.RateFreight = '';
        this.Ccchrg_Selling = "";
        this.Ccchrg_SellingCur = "INR";
        this.Ppchrg_Selling = "";

        this.RateFsc = "";
        this.PpFsc_Selling = "";
        this.CcFsc_Selling = "";
        this.CcFsc_SellingCur = "INR";
        this.RateFscPayOn = "0";

        this.RateIrc = "";
        this.PpIrc_Selling = "";
        this.CcIrc_Selling = "";
        this.CcIrc_SellingCur = "INR";
        this.RateIrcPayOn = "0";

        this.RateXray = "";
        this.PpXray_Selling = "";
        this.CcXray_Selling = "";
        this.CcXray_SellingCur = "INR";
        this.RateXrayPayOn = "0";

        this.McCur = "INR";
        this.McRatePP = "";
        this.McRateCC = "";
        this.McCCInr = "";

        this.ThcCur = "INR";
        this.ThcRatePP = "";
        this.ThcRateCC = "";
        this.ThcCCInr = "";

        this.CtgCur = "INR";
        this.CtgRatePP = "";
        this.CtgRateCC = "";
        this.CtgCCInr = "";

        this.DdcCur = "INR";
        this.DdcRatePP = "";
        this.DdcRateCC = "";
        this.DdcCCInr = "";

        this.fnCalPP_HAWBFreight();
        this.fnCalCC_HAWBFreight();
    }

    fn_ChangeFreight_CC_PP_PC() {
        if (this.FreightRate == "PP") {
            this.Ccchrg_SellingCur = "INR";
            this.CcFsc_SellingCur = "INR";
            this.CcIrc_SellingCur = "INR";
            this.CcXray_SellingCur = "INR";
            this.McCur = "INR";

            this.ThcCur = "INR";
            this.DdcCur = "INR";

            this.CtgCur = "INR";
            this.DcCur = "INR";
            this.ScrCur = "INR";
            this.MycCur = "INR";
            this.HawbCur = "INR";
            this.PcaCur = "INR";
            this.OtherRateCur = "INR";

            this.HawbRateCC = "";
            this.PcaRateCC = "";
            this.DcRateCC = "";
            this.ScrRateCC = "";
            this.MycRateCC = "";
            this.OtherRateCC = "";

            this.HawbCCInr = "";
            this.PcaCCInr = "";
            this.OtherRateInr = "";
            this.DcCCInr = "";
            this.ScrCCInr = "";
            this.MycCCInr = "";
        }
        else if (this.FreightRate == "CC") {
            this.PPchrg_SellingCur = "INR";
            this.PpFsc_SellingCur = "INR";
            this.PpIrc_SellingCur = "INR";
            this.PpXray_SellingCur = "INR";
            this.McCurPP = "INR";
            this.fobCurPP = "INR";

            this.ThcCurPP = "INR";
            this.DdcCurPP = "INR";

            this.CtgCurPP = "INR";
            this.DcCurPP = "INR";
            this.ScrCurPP = "INR";
            this.MycCurPP = "INR";
            this.HawbCurPP = "INR";
            this.PcaCurPP = "INR";
            this.OtherRateCurPP = "INR";

            this.HawbRatePP = '';
            this.PcaRatePP = '';
            this.ScrRatePP = '';
            this.MycRatePP = '';
            this.OtherRatePP = '';
            this.OtherRatePP = '';

        }
        this.fnCalPP_HAWBFreight();
        this.fnCalCC_HAWBFreight();
    }

    fnCalPP_HAWBFreight() {

        var PPCHRG, PPTOTAGT, PPTOTCARR, PPTOT;
        var PP_SCHRG_FSC, PP_SCHRG_IRC, PP_SCHRG_XRAY, PP_MC, PP_CTG, PP_THC, PP_DDC,PP_FOB;
        var PP_DC, PP_SCR, PP_MYC;
        var PP_HAWB, PP_PCA, PP_OTHER;
        var airchrgppda,airchrgppdc,airchrgccda,airchrgccdc
        PPCHRG = 0;
        PPTOTAGT = 0;
        PPTOTCARR = 0;
        airchrgppda=this.tot_rate_tar_pp_da;
        airchrgppdc=this.tot_rate_tar_pp_dc;
        airchrgccda=this.tot_rate_tar_cc_da;
        airchrgccdc=this.tot_rate_tar_cc_dc;
        var InrRate = Math.abs(this.InrRate);
        var UsdRate = Math.abs(this.TxtExchRate);
        var ExchRate = InrRate / UsdRate;
        ExchRate = (InrRate == 0 || UsdRate == 0) ? 0 : InrRate / UsdRate;
        PPCHRG = (this.PPchrg_SellingCur != "INR") ? Math.abs(this.Ppchrg_Selling) * ExchRate : Math.abs(this.Ppchrg_Selling);
        PP_SCHRG_FSC = (this.PpFsc_SellingCur != "INR") ? Math.abs(this.PpFsc_Selling) * ExchRate : Math.abs(this.PpFsc_Selling);
        PP_SCHRG_IRC = (this.PpIrc_SellingCur != "INR") ? Math.abs(this.PpIrc_Selling) * ExchRate : Math.abs(this.PpIrc_Selling);
        PP_SCHRG_XRAY = (this.PpXray_SellingCur != "INR") ? Math.abs(this.PpXray_Selling) * ExchRate : Math.abs(this.PpXray_Selling);
        PP_MC = (this.McCurPP != "INR") ? Math.abs(this.McRatePP) * ExchRate : Math.abs(this.McRatePP);
        PP_DC = (this.DcCurPP != "INR") ? Math.abs(this.DcRatePP) * ExchRate : Math.abs(this.DcRatePP);
        PP_SCR = (this.ScrCurPP != "INR") ? Math.abs(this.ScrRatePP) * ExchRate : Math.abs(this.ScrRatePP);
        PP_MYC = (this.MycCurPP != "INR") ? Math.abs(this.MycRatePP) * ExchRate : Math.abs(this.MycRatePP);
        //PP_CTG = (this.CityCode == "MUM") ? ((this.CtgCurPP != "INR") ? Math.abs(this.CtgRatePP) * ExchRate : Math.abs(this.CtgRatePP)) : 0;
        PP_CTG = (this.CityCode == "MUM") ? ((this.CtgCurPP != "INR") ? Math.abs(this.CtgRatePP) * ExchRate : Math.abs(this.CtgRatePP)) : 0;
        PP_THC = (this.CityCode == "DAC") ? ((this.ThcCurPP != "INR") ? Math.abs(this.ThcRatePP) * ExchRate : Math.abs(this.ThcRatePP)) : 0;
        PP_DDC = (this.DdcCurPP != "INR") ? Math.abs(this.DdcRatePP) * ExchRate : Math.abs(this.DdcRatePP);
        PP_HAWB = (this.HawbCurPP != "INR") ? Math.abs(this.HawbRatePP) * ExchRate : Math.abs(this.HawbRatePP);
        PP_PCA = (this.PcaCurPP != "INR") ? Math.abs(this.PcaRatePP) * ExchRate : Math.abs(this.PcaRatePP);
        PP_OTHER = (this.OtherRateCurPP != "INR") ? Math.abs(this.OtherRatePP) * ExchRate : Math.abs(this.OtherRatePP);
        PP_FOB = (this.fobCurPP != "INR") ? Math.abs(this.fobRatePP) * ExchRate : Math.abs(this.fobRatePP);

        PPCHRG = Math.abs(PPCHRG.toFixed(2))
        PP_SCHRG_FSC = Math.abs(PP_SCHRG_FSC.toFixed(2))
        PP_SCHRG_IRC = Math.abs(PP_SCHRG_IRC.toFixed(2))
        PP_SCHRG_XRAY = Math.abs(PP_SCHRG_XRAY.toFixed(2))
        PP_MC = Math.abs(PP_MC.toFixed(2))
        PP_CTG = Math.abs(PP_CTG.toFixed(2))
        PP_THC = Math.abs(PP_THC.toFixed(2));
        PP_DDC = Math.abs(PP_DDC.toFixed(2));
        PP_OTHER = Math.abs(PP_OTHER.toFixed(2))
        PP_DC = Math.abs(PP_DC.toFixed(2))
        PP_SCR = Math.abs(PP_SCR.toFixed(2))
        PP_MYC = Math.abs(PP_MYC.toFixed(2))
        PP_FOB = Math.abs(PP_FOB.toFixed(2))


        PP_HAWB = Math.abs(PP_HAWB.toFixed(2))
        PP_PCA = Math.abs(PP_PCA.toFixed(2))

        this.OtherRatePPInr = PP_OTHER.toFixed(2);

        var PPTOTCARR1 = Math.abs(PP_SCHRG_FSC) + Math.abs(PP_SCHRG_IRC) + Math.abs(PP_SCHRG_XRAY) + Math.abs(PP_MC) + Math.abs(PP_CTG) + Math.abs(PP_DC) + Math.abs(PP_SCR) + Math.abs(PP_MYC) + Math.abs(PP_THC) + Math.abs(PP_DDC) + Math.abs(PP_FOB) ;
        PPTOTCARR = Math.abs(PPTOTCARR1).toFixed(2);

        var PPTOTAGT1 = Math.abs(PP_HAWB) + Math.abs(PP_PCA)
        PPTOTAGT = Math.abs(PPTOTAGT1).toFixed(2);

        var PPTOT1 = Math.abs(PPCHRG) + Math.abs(PPTOTAGT) + Math.abs(PPTOTCARR) + Math.abs(airchrgppda) + Math.abs(airchrgccda);
        PPTOT = Math.abs(PPTOT1).toFixed(2);

        this.Ppchrg_SellingInr = PPCHRG;
        this.PpFsc_SellingInr = PP_SCHRG_FSC;
        this.PpIrc_SellingInr = PP_SCHRG_IRC;
        this.PpXray_SellingInr = PP_SCHRG_XRAY;
        this.McRatePPInr = PP_MC;

        this.ThcRatePPInr = PP_THC;
        this.DdcRatePPInr = PP_DDC;

        this.CtgRatePPInr = PP_CTG;
        this.HawbRatePPInr = PP_HAWB;
        this.PcaRatePPInr = PP_PCA;
        this.DcRatePPInr = PP_DC;
        this.ScrRatePPInr = PP_SCR;
        this.MycRatePPInr = PP_MYC;

        this.Pptotagt_Selling = Math.abs(PPTOTAGT) + Math.abs(airchrgppda);
        this.Pptotcarr_Selling = Math.abs(PPTOTCARR) + Math.abs(airchrgppdc);
        this.Pptot_Selling = Math.abs(PPTOT);
    }

    fnCalCC_HAWBFreight() {

        var CCCHRG, CCTOTAGT, CCTOTCARR, CCTOT;
        var CC_SCHRG_FSC, CC_SCHRG_IRC, CC_SCHRG_XRAY, CC_MC, CC_CTG, CC_THC, CC_DDC, CC_FOB;
        var CC_DC, CC_SCR, CC_MYC;
        var CC_HAWB, CC_PCA, CC_OTHER,airchrgppdc,airchrgccdc;

        CCCHRG = 0;
        CCTOTAGT = 0;
        CCTOTCARR = 0;

        airchrgppdc=this.tot_rate_tar_pp_dc;
        airchrgccdc=this.tot_rate_tar_cc_dc;


        var InrRate = Math.abs(this.InrRate)
        var UsdRate = Math.abs(this.TxtExchRate)
        var ExchRate = (InrRate == 0 || UsdRate == 0) ? 0 : InrRate / UsdRate;
        CCCHRG = (this.Ccchrg_SellingCur != "INR") ? Math.abs(this.Ccchrg_Selling) * ExchRate : Math.abs(this.Ccchrg_Selling);
        CC_SCHRG_FSC = (this.CcFsc_SellingCur != "INR") ? Math.abs(this.CcFsc_Selling) * ExchRate : Math.abs(this.CcFsc_Selling);
        CC_SCHRG_IRC = (this.CcIrc_SellingCur != "INR") ? Math.abs(this.CcIrc_Selling) * ExchRate : Math.abs(this.CcIrc_Selling);
        CC_SCHRG_XRAY = (this.CcXray_SellingCur != "INR") ? Math.abs(this.CcXray_Selling) * ExchRate : Math.abs(this.CcXray_Selling);
        CC_MC = (this.McCur != "INR") ? Math.abs(this.McRateCC) * ExchRate : Math.abs(this.McRateCC);
        CC_DC = (this.DcCur != "INR") ? Math.abs(this.DcRateCC) * ExchRate : Math.abs(this.DcRateCC);
        CC_SCR = (this.ScrCur != "INR") ? Math.abs(this.ScrRateCC) * ExchRate : Math.abs(this.ScrRateCC);
        CC_MYC = (this.MycCur != "INR") ? Math.abs(this.MycRateCC) * ExchRate : Math.abs(this.MycRateCC);
        CC_CTG = (this.CityCode == "MUM") ? ((this.CtgCur != "INR") ? Math.abs(this.CtgRateCC) * ExchRate : Math.abs(this.CtgRateCC)) : 0;
        CC_THC = (this.CityCode == "DAC") ? ((this.ThcCur != "INR") ? Math.abs(this.ThcRateCC) * ExchRate : Math.abs(this.ThcRateCC)) : 0;
        CC_DDC = (this.DdcCur != "INR") ? Math.abs(this.DdcRateCC) * ExchRate : Math.abs(this.DdcRateCC);
        CC_HAWB = (this.HawbCur != "INR") ? Math.abs(this.HawbRateCC) * ExchRate : Math.abs(this.HawbRateCC);
        CC_PCA = (this.PcaCur != "INR") ? Math.abs(this.PcaRateCC) * ExchRate : Math.abs(this.PcaRateCC);
        CC_OTHER = (this.OtherRateCur != "INR") ? Math.abs(this.OtherRateCC) * ExchRate : Math.abs(this.OtherRateCC);
        CC_FOB=(this.fobCur != "INR") ? Math.abs(this.fobRateCC) * ExchRate : Math.abs(this.fobRateCC);

        CCCHRG = Math.abs(CCCHRG.toFixed(2))
        CC_SCHRG_FSC = Math.abs(CC_SCHRG_FSC.toFixed(2))
        CC_SCHRG_IRC = Math.abs(CC_SCHRG_IRC.toFixed(2))
        CC_SCHRG_XRAY = Math.abs(CC_SCHRG_XRAY.toFixed(2))
        CC_MC = Math.abs(CC_MC.toFixed(2))
        CC_THC = Math.abs(CC_THC.toFixed(2))
        CC_CTG = Math.abs(CC_CTG.toFixed(2))
        CC_DDC = Math.abs(CC_DDC.toFixed(2))

        CC_OTHER = Math.abs(CC_OTHER.toFixed(2))
        CC_DC = Math.abs(CC_DC.toFixed(2))
        CC_SCR = Math.abs(CC_SCR.toFixed(2))
        CC_MYC = Math.abs(CC_MYC.toFixed(2))

        CC_HAWB = Math.abs(CC_HAWB.toFixed(2))
        CC_PCA = Math.abs(CC_PCA.toFixed(2))
        CC_FOB = Math.abs(CC_FOB.toFixed(2))

        this.OtherRateInr = CC_OTHER.toFixed(2);

        var CCTOTCARR1 = Math.abs(CC_SCHRG_FSC) + Math.abs(CC_SCHRG_IRC) + Math.abs(CC_SCHRG_XRAY) + Math.abs(CC_MC) + Math.abs(CC_CTG) + Math.abs(CC_DC) + Math.abs(CC_SCR) + Math.abs(CC_MYC) + Math.abs(CC_THC) + Math.abs(CC_DDC)+  Math.abs(CC_FOB) ;
        CCTOTCARR = Math.abs(CCTOTCARR1).toFixed(2);

        var CCTOTAGT1 = Math.abs(CC_HAWB) + Math.abs(CC_PCA)
        CCTOTAGT = Math.abs(CCTOTAGT1).toFixed(2);

        var CCTOT1 = Math.abs(CCCHRG) + Math.abs(CCTOTAGT) + Math.abs(CCTOTCARR) + Math.abs(this.tot_rate_tar_cc_da) + + Math.abs(this.tot_rate_tar_cc_dc);
        CCTOT = Math.abs(CCTOT1).toFixed(2);

        this.Ccchrg_SellingInr = CCCHRG;
        this.CcFsc_SellingInr = CC_SCHRG_FSC;
        this.CcIrc_SellingInr = CC_SCHRG_IRC;
        this.CcXray_SellingInr = CC_SCHRG_XRAY;
        this.McCCInr = CC_MC;
        this.ThcCCInr = CC_THC;
        this.DdcCCInr = CC_DDC;
        this.CtgCCInr = CC_CTG;
        this.HawbCCInr = CC_HAWB;
        this.PcaCCInr = CC_PCA;
        this.DcCCInr = CC_DC;
        this.ScrCCInr = CC_SCR;
        this.MycCCInr = CC_MYC;
        this.fobCCInr = CC_FOB;

        this.Cctotagt_SellingInr = Math.abs(CCTOTAGT);
        this.Cctotcarr_SellingInr = Math.abs(CCTOTCARR);
        this.Cctot_Selling = Math.abs(CCTOT);

    }

    fn_ChangePayableOn(ChargeType) {
        if (ChargeType == 'FSC' || ChargeType == null) {
            this.RateFsc = "";
            this.PpFsc_Selling = "";
            this.CcFsc_Selling = "";
            this.CcFsc_SellingCur = "INR";
        }
        else if (ChargeType == 'IRC' || ChargeType == null) {
            this.RateIrc = "";
            this.PpIrc_Selling = "";
            this.CcIrc_Selling = "";
            this.CcIrc_SellingCur = "INR";
        }
        else if (ChargeType == 'XRAY' || ChargeType == null) {
            this.RateXray = "";
            this.PpXray_Selling = "";
            this.CcXray_Selling = "";
            this.CcXray_SellingCur = "INR";
        }
        this.fnCalPP_HAWBFreight();
        this.fnCalCC_HAWBFreight();
    }

    fn_ChangeRate_Surcharge(ChargeType) {
        if (ChargeType == 'FSC' || ChargeType == null) { this.fn_ChangeRate_Surcharge_Fsc(); }
        else if (ChargeType == 'IRC' || ChargeType == null) { this.fn_ChangeRate_Surcharge_Irc(); }
        else if (ChargeType == 'XRAY' || ChargeType == null) { this.fn_ChangeRate_Surcharge_Xray(); }
        this.fnCalPP_HAWBFreight();
        this.fnCalCC_HAWBFreight();
    }

    fn_ChangeRate_Surcharge_Fsc() {
        let Rate = this.RateFsc;
        if (Rate != "") {
            let FreightWtType = this.FreightRate;
            let PayableOn = this.RateFscPayOn;
            let ChargebleWt = this.UserWgt;
            let GrossWt = this.UserGrossWeight;
            let Weight = 0;
            if (PayableOn == "CW") {
                Weight = this.UserWgt;
            }
            else if (PayableOn == "GW") {
                Weight = this.UserGrossWeight;
            }
            else {
                alert("Please select Surcharge Payable on.");
                this.RateFsc = "";
                this.PpFsc_Selling = "";
                this.CcFsc_Selling = "";
                return false;
            }

            if (Math.abs(ChargebleWt) == 0) {
                alert("Please enter new Chargeable Weight.")
                this.clearCharges();
                return false;
            }
            else if (Math.abs(GrossWt) == 0) {
                alert("Please enter new Gross Weight.")
                this.clearCharges();
                return false;
            }

            if (FreightWtType == 'PP') {
                this.PpFsc_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
                this.CcFsc_Selling = "";
            }
            else if (FreightWtType == 'CC') {
                this.PpFsc_Selling = "";
                this.CcFsc_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
            }
            else if (FreightWtType == 'PC') {
                if (this.PrepaidPercent == null) {
                    alert("Please select Prepaid percentage.");
                    this.clearCharges();
                    return false;
                }
                let Total = 0;
                Total = (Math.abs(Rate) * Math.abs(Weight))
                this.PpFsc_Selling = ((Total * this.PrepaidPercent) / 100).toFixed(2);
                this.CcFsc_Selling = ((Total * this.CollectPer) / 100).toFixed(2);
            }
        }
        else {
            this.PpFsc_Selling = "";
            this.CcFsc_Selling = "";
        }
    }

    fn_ChangeRate_Surcharge_Irc() {
        let Rate = this.RateIrc;
        if (Rate != "") {
            let FreightWtType = this.FreightRate;
            let PayableOn = this.RateIrcPayOn;
            let ChargebleWt = this.UserWgt;
            let GrossWt = this.UserGrossWeight;
            let Weight = 0;
            if (PayableOn == "CW") {
                Weight = this.UserWgt;
            }
            else if (PayableOn == "GW") {
                Weight = this.UserGrossWeight;
            }
            else {
                alert("Please select Surcharge Payable on.");
                this.RateIrc = "";
                this.PpIrc_Selling = "";
                this.CcIrc_Selling = "";
                return false;
            }

            if (Math.abs(ChargebleWt) == 0) {
                alert("Please enter new Chargeable Weight.")
                this.clearCharges();
                return false;
            }
            else if (Math.abs(GrossWt) == 0) {
                alert("Please enter new Gross Weight.")
                this.clearCharges();
                return false;
            }

            if (FreightWtType == 'PP') {
                this.PpIrc_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
                this.CcIrc_Selling = "";
            }
            else if (FreightWtType == 'CC') {
                this.PpIrc_Selling = "";
                this.CcIrc_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
            }
            else if (FreightWtType == 'PC') {
                if (this.PrepaidPercent == null) {
                    alert("Please select Prepaid percentage.");
                    this.clearCharges();
                    return false;
                }
                let Total = 0;
                Total = (Math.abs(Rate) * Math.abs(Weight))
                this.PpIrc_Selling = ((Total * this.PrepaidPercent) / 100).toFixed(2);
                this.CcIrc_Selling = ((Total * this.CollectPer) / 100).toFixed(2);
            }
        }
        else {
            this.PpIrc_Selling = "";
            this.CcIrc_Selling = "";
        }
    }

    fn_ChangeRate_Surcharge_Xray() {
        let Rate = this.RateXray;
        if (Rate != "") {
            let FreightWtType = this.FreightRate;
            let PayableOn = this.RateXrayPayOn;
            let ChargebleWt = this.UserWgt;
            let GrossWt = this.UserGrossWeight;
            let Weight = 0;
            if (PayableOn == "CW") {
                Weight = this.UserWgt;
            }
            else if (PayableOn == "GW") {
                Weight = this.UserGrossWeight;
            }
            else {
                alert("Please select Surcharge Payable on.");
                this.RateXray = "";
                this.PpXray_Selling = "";
                this.CcXray_Selling = "";
                return false;
            }

            if (Math.abs(ChargebleWt) == 0) {
                alert("Please enter new Chargeable Weight.")
                this.clearCharges();
                return false;
            }
            else if (Math.abs(GrossWt) == 0) {
                alert("Please enter new Gross Weight.")
                this.clearCharges();
                return false;
            }

            if (FreightWtType == 'PP') {
                this.PpXray_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
                this.CcXray_Selling = "";
            }
            else if (FreightWtType == 'CC') {
                this.PpXray_Selling = "";
                this.CcXray_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
            }
            else if (FreightWtType == 'PC') {
                if (this.PrepaidPercent == null) {
                    alert("Please select Prepaid percentage.");
                    this.clearCharges();
                    return false;
                }
                let Total = 0;
                Total = (Math.abs(Rate) * Math.abs(Weight))
                this.PpXray_Selling = ((Total * this.PrepaidPercent) / 100).toFixed(2);
                this.CcXray_Selling = ((Total * this.CollectPer) / 100).toFixed(2);
            }
        }
        else {
            this.PpXray_Selling = "";
            this.CcXray_Selling = "";
        }
    }

    fn_ChangeRate_Basic() {
        let Rate = this.RateFreight;
        if (Rate != "") {
            let FreightWtType = this.FreightRate;
            let ChargebleWt = this.UserWgt;
            let GrossWt = this.UserGrossWeight;

            if (Math.abs(ChargebleWt) == 0) {
                alert("Please enter new Chargeble Weight.")
                this.clearCharges();
                return false;
            }
            else if (Math.abs(GrossWt) == 0) {
                alert("Please enter new Gross Weight.")
                this.clearCharges();
                return false;
            }

            if (FreightWtType == 'PP') {
                this.Ppchrg_Selling = (Math.abs(Rate) * Math.abs(ChargebleWt)).toFixed(2);
                this.Ccchrg_Selling = "";
            }
            else if (FreightWtType == 'CC') {
                this.Ccchrg_Selling = (Math.abs(Rate) * Math.abs(ChargebleWt)).toFixed(2);
                this.Ppchrg_Selling = "";
            }
            else if (FreightWtType == 'PC') {
                if (this.PrepaidPercent == null) {
                    alert("Please select Prepaid percentage.");
                    this.clearCharges();
                    return false;
                }
                let Total = (Math.abs(Rate) * Math.abs(ChargebleWt))
                this.Ppchrg_Selling = ((Total * this.PrepaidPercent) / 100).toFixed(2);
                this.Ccchrg_Selling = ((Total * this.CollectPer) / 100).toFixed(2);
            }
        }
        else {
            this.Ccchrg_Selling = "";
            this.Ppchrg_Selling = "";
        }
        this.fnCalPP_HAWBFreight();
        this.fnCalCC_HAWBFreight();
    }

    fnChkExchangeRate(srno, typ, val) {
        if (val != "INR") {
            if (Math.abs(this.TxtExchRate) == 0) {
                alert("Please enter Exch. Rate first.");
                if (typ == 'PP') {
                    this.setDefaultCurrencyPP(srno);
                } else { this.setDefaultCurrencyCC(srno); }
                return false;
            }
            if (Math.abs(this.InrRate) == 0) {
                alert("Please enter Exch. INR Rate first.");
                if (typ == 'PP') {
                    this.setDefaultCurrencyPP(srno);
                } else { this.setDefaultCurrencyCC(srno); }
                return false;
            }
        }
        this.fnCalCC_HAWBFreight();
        this.fnCalPP_HAWBFreight();
    }

    setDefaultCurrencyPP(typ) {
        if (typ == 1) { this.PPchrg_SellingCur = "INR"; }
        else if (typ == 2) { this.PpFsc_SellingCur = "INR"; }
        else if (typ == 3) { this.PpIrc_SellingCur = "INR"; }
        else if (typ == 4) { this.PpXray_SellingCur = "INR"; }
        else if (typ == 5) { this.McCurPP = "INR"; }
        else if (typ == 6) { this.CtgCurPP = "INR"; }
        else if (typ == 7) { this.ThcCurPP = "INR"; }
        else if (typ == 8) { this.DdcCurPP = "INR"; }
        else if (typ == 9) { this.DcCurPP = "INR"; }
        else if (typ == 10) { this.ScrCurPP = "INR"; }
        else if (typ == 11) { this.MycCurPP = "INR"; }
        else if (typ == 13) { this.HawbCurPP = "INR"; }
        else if (typ == 14) { this.PcaCurPP = "INR"; }
        else if (typ == 17) { this.OtherRateCurPP = "INR"; }
        else if (typ == 18) { this.fobCurPP = "INR"; }
    }

    setDefaultCurrencyCC(typ) {
        if (typ == 1) { this.Ccchrg_SellingCur = "INR"; }
        else if (typ == 2) { this.CcFsc_SellingCur = "INR"; }
        else if (typ == 3) { this.CcIrc_SellingCur = "INR"; }
        else if (typ == 4) { this.CcXray_SellingCur = "INR"; }
        else if (typ == 5) { this.McCur = "INR"; }
        else if (typ == 6) { this.CtgCur = "INR"; }
        else if (typ == 7) { this.ThcCur = "INR"; }
        else if (typ == 8) { this.DdcCur = "INR"; }
        else if (typ == 9) { this.DcCur = "INR"; }
        else if (typ == 10) { this.ScrCur = "INR"; }
        else if (typ == 11) { this.MycCur = "INR"; }
        else if (typ == 13) { this.HawbCur = "INR"; }
        else if (typ == 14) { this.PcaCur = "INR"; }
        else if (typ == 17) { this.OtherRateCur = "INR"; }
        else if (typ == 18) { this.fobCur = "INR"; }
    }

    fn_ChangeUserWeight() {
        if (Math.abs(this.UserWgt) == 0 || Math.abs(this.UserGrossWeight) == 0) {
            this.clearCharges();
        }
        if (this.RateFreight != "") {
            this.fn_ChangeRate_Basic();
        }
        if (this.RateFsc != "") {
            this.fn_ChangeRate_Surcharge('FSC');
        }
        if (this.RateIrc != "") {
            this.fn_ChangeRate_Surcharge('IRC');
        }
        if (this.RateXray != "") {
            this.fn_ChangeRate_Surcharge('XRAY');
        }
    }

    fn_ChangeRate_MC_CTG(CHRG_TYPE) {
        if (CHRG_TYPE == 'MC') { this.fn_ChangeRate_MC_CTG_Mc(); }
        else if (CHRG_TYPE == 'CTG') { this.fn_ChangeRate_MC_CTG_Ctg(); }
        else if (CHRG_TYPE == 'THC') { this.fn_ChangeRate_MC_CTG_Thc(); }
        else if (CHRG_TYPE == 'DDC') { this.fn_ChangeRate_MC_CTG_Ddc(); }
        else if (CHRG_TYPE == 'FOB') { this.fn_ChangeRate_MC_CTG_Fob(); }
    }

    fn_ChangeRate_MC_CTG_Mc() {
        if (this.McRate != "") {
            if (Math.abs(this.UserWgt) == 0) {
                alert("Please enter new Chargeble Weight.")
                this.clearCharges();
                return false;
            }
            else if (Math.abs(this.UserWgt) == 0) {
                alert("Please enter new Gross Weight.")
                this.clearCharges();
                return false;
            }
            let Weight = 0;
            if (this.McPayOn == "CW") {//this.McRateCC == "CW"
                Weight = this.UserWgt;
            }
            else if (this.McPayOn == "GW") { //this.McRateCC == "GW"
                Weight = this.UserGrossWeight;
            }
            else {
                alert("Please select Surcharge Payable on.");
                this.McRate = "";
                this.McRatePP = "";
                this.McRateCC = ""
                return false;
            }

            if (this.FreightRate == 'PP') {
                this.McRatePP = (Math.abs(this.McRate) * Math.abs(Weight)).toFixed(2);
                this.McRateCC = "";
            }
            else if (this.FreightRate == 'CC') {
                this.McRateCC = (Math.abs(this.McRate) * Math.abs(Weight)).toFixed(2);
                this.McRatePP = "";
            }
            else if (this.FreightRate == 'PC') {
                if (this.PrepaidPercent == null) {
                    alert("Please select Prepaid percentage.");
                    this.clearCharges();
                    return false;
                }
                var Total = (Math.abs(this.McRate) * Math.abs(Weight));
                this.McRatePP = ((Total * this.PrepaidPercent) / 100).toFixed(2);
                this.McRateCC = ((Total * this.CollectPer) / 100).toFixed(2);
            }
        }
        else {
            this.McRatePP = "";
            this.McRateCC = "";
        }
        this.fnCalPP_HAWBFreight();
        this.fnCalCC_HAWBFreight();
    }

    fn_ChangeRate_MC_CTG_Ctg() {
        if (this.CtgRate != "") {
            if (Math.abs(this.UserWgt) == 0) {
                alert("Please enter new Chargeble Weight.")
                this.clearCharges();
                return false;
            }
            else if (Math.abs(this.UserWgt) == 0) {
                alert("Please enter new Gross Weight.")
                this.clearCharges();
                return false;
            }
            let Weight = 0;
            if (this.CtgPayOn == "CW") {
                Weight = this.UserWgt;
            }
            else if (this.CtgPayOn == "GW") {
                Weight = this.UserGrossWeight;
            }
            else {
                alert("Please select Surcharge Payable on.");
                // this.McRate = "";
                // this.McRatePP = "";
                // this.McRateCC = "";
                this.CtgRate = "";
                this.CtgRatePP = "";
                this.CtgRateCC = "";
                return false;
            }

            if (this.FreightRate == 'PP') {
                this.CtgRatePP = (Math.abs(this.CtgRate) * Math.abs(Weight)).toFixed(2);
                this.CtgRateCC = "";
            }
            else if (this.FreightRate == 'CC') {
                this.CtgRateCC = (Math.abs(this.CtgRate) * Math.abs(Weight)).toFixed(2);
                this.McRatePP = "";
            }
            else if (this.FreightRate == 'PC') {
                if (this.PrepaidPercent == null) {
                    alert("Please select Prepaid percentage.");
                    this.clearCharges();
                    return false;
                }
                var Total = (Math.abs(this.CtgRate) * Math.abs(Weight));
                this.CtgRatePP = ((Total * this.PrepaidPercent) / 100).toFixed(2);
                this.CtgRateCC = ((Total * this.CollectPer) / 100).toFixed(2);
            }
        }
        else {
            this.CtgRatePP = "";
            this.CtgRateCC = "";
        }
        this.fnCalPP_HAWBFreight();
        this.fnCalCC_HAWBFreight();
    }

    fn_ChangeRate_MC_CTG_Thc() {
        if (this.ThcRate != "") {
            if (Math.abs(this.UserWgt) == 0) {
                alert("Please enter new Chargeble Weight.")
                this.clearCharges();
                return false;
            }
            else if (Math.abs(this.UserWgt) == 0) {
                alert("Please enter new Gross Weight.")
                this.clearCharges();
                return false;
            }
            let Weight = 0;
            if (this.CtgPayOn == "CW") {
                Weight = this.UserWgt;
            }
            else if (this.CtgPayOn == "GW") {
                Weight = this.UserGrossWeight;
            }
            else {
                alert("Please select Surcharge Payable on.");
                this.ThcRate = "";
                this.ThcRatePP = "";
                this.ThcRateCC = ""
                return false;
            }

            if (this.FreightRate == 'PP') {
                this.ThcRatePP = (Math.abs(this.ThcRate) * Math.abs(Weight)).toFixed(2);
                this.ThcRateCC = "";
            }
            else if (this.FreightRate == 'CC') {
                this.ThcRateCC = (Math.abs(this.ThcRate) * Math.abs(Weight)).toFixed(2);
                this.ThcRatePP = "";
            }
            else if (this.FreightRate == 'PC') {
                if (this.PrepaidPercent == null) {
                    alert("Please select Prepaid percentage.");
                    this.clearCharges();
                    return false;
                }
                var Total = (Math.abs(this.ThcRate) * Math.abs(Weight));
                this.ThcRatePP = ((Total * this.PrepaidPercent) / 100).toFixed(2);
                this.ThcRateCC = ((Total * this.CollectPer) / 100).toFixed(2);
            }
        }
        else {
            this.ThcRatePP = "";
            this.ThcRateCC = "";
        }
        this.fnCalPP_HAWBFreight();
        this.fnCalCC_HAWBFreight();
    }

    fn_ChangeRate_MC_CTG_Ddc() {
        if (this.DdcRate != "") {
            if (Math.abs(this.UserWgt) == 0) {
                alert("Please enter new Chargeble Weight.")
                this.clearCharges();
                return false;
            }
            else if (Math.abs(this.UserWgt) == 0) {
                alert("Please enter new Gross Weight.")
                this.clearCharges();
                return false;
            }
            let Weight = 0;
            if (this.DdcPayOn == "CW") {
                Weight = this.UserWgt;
            }
            else if (this.DdcPayOn == "GW") {
                Weight = this.UserGrossWeight;
            }
            else {
                alert("Please select Surcharge Payable on.");
                this.DdcRate = "";
                this.DdcRatePP = "";
                this.DdcRateCC = ""
                return false;
            }

            if (this.FreightRate == 'PP') {
                this.DdcRatePP = (Math.abs(this.DdcRate) * Math.abs(Weight)).toFixed(2);
                this.DdcRateCC = "";
            }
            else if (this.FreightRate == 'CC') {
                this.DdcRatePP = (Math.abs(this.DdcRate) * Math.abs(Weight)).toFixed(2);
                this.McRatePP = "";
            }
            else if (this.FreightRate == 'PC') {
                if (this.PrepaidPercent == null) {
                    alert("Please select Prepaid percentage.");
                    this.clearCharges();
                    return false;
                }
                var Total = (Math.abs(this.DdcRate) * Math.abs(Weight));
                this.DdcRatePP = ((Total * this.PrepaidPercent) / 100).toFixed(2);
                this.DdcRateCC = ((Total * this.CollectPer) / 100).toFixed(2);
            }
        }
        else {
            this.DdcRatePP = "";
            this.DdcRateCC = "";
        }
        this.fnCalPP_HAWBFreight();
        this.fnCalCC_HAWBFreight();
    }
    fn_ChangeRate_MC_CTG_Fob() {
        if (this.fobRate != "") {
            if (Math.abs(this.UserWgt) == 0) {
                alert("Please enter new Chargeble Weight.")
                this.clearCharges();
                return false;
            }
            else if (Math.abs(this.UserWgt) == 0) {
                alert("Please enter new Gross Weight.")
                this.clearCharges();
                return false;
            }
            let Weight = 0;
            if (this.fobPayOn == "CW") {//this.McRateCC == "CW"
                Weight = this.UserWgt;
            }
            else if (this.fobPayOn == "GW") { //this.McRateCC == "GW"
                Weight = this.UserGrossWeight;
            }
            else {
                alert("Please select Surcharge Payable on.");
                this.fobRate = "";
                this.fobRatePP = "";
                this.fobRateCC = ""
                return false;
            }

            if (this.FreightRate == 'PP') {
                this.fobRatePP = (Math.abs(this.fobRate) * Math.abs(Weight)).toFixed(2);
                this.fobRateCC = "";
            }
            else if (this.FreightRate == 'CC') {
                this.fobRateCC = (Math.abs(this.fobRate) * Math.abs(Weight)).toFixed(2);
                this.fobRatePP = "";
            }
            else if (this.FreightRate == 'PC') {
                if (this.PrepaidPercent == null) {
                    alert("Please select Prepaid percentage.");
                    this.clearCharges();
                    return false;
                }
                var Total = (Math.abs(this.fobRate) * Math.abs(Weight));
                this.fobRatePP = ((Total * this.PrepaidPercent) / 100).toFixed(2);
                this.fobRateCC = ((Total * this.CollectPer) / 100).toFixed(2);
            }
        }
        else {
            this.fobRatePP = "";
            this.fobRateCC = "";
        }
        this.fnCalPP_HAWBFreight();
        this.fnCalCC_HAWBFreight();
    }
    fn_FinalValidation() {
        if (this.TransportMode == null) {
            alert("Please select Transportation Mode !")
            return false;
        }
        if (Math.abs(this.UserWgt) == 0) {
            alert("Please enter new Chargeble Weight.")
            this.clearCharges();
            return false;
        }
        else if (Math.abs(this.UserGrossWeight) == 0) {
            alert("Please enter new Gross Weight.")
            this.clearCharges();
            return false;
        }
        if (Math.abs(this.RateFreight) == 0) {
            alert("Please enter Freight Basic Rate.");
            return false;
        }
        if(this.DrpExchRate !='INR' && this.DrpExchRate !=null )
        {
            if (this.TxtExchRate != "0") {
                if (Math.abs(this.TxtExchRate) == 0) {
                    alert("Please enter Exch. Rate first.")
                    return false;
                }
                if (Math.abs(this.InrRate) == 0) {
                    alert("Please enter Exch. INR Rate first.")
                    return false;
                }
            }
        }
        if(this.DrpExchRate !='INR' && this.DrpExchRate !=null )
        {
            if (Math.abs(this.TxtExchRate) > 0 || Math.abs(this.InrRate) > 0) {
                if (this.TxtExchRate == "0") {
                    alert("Please enter Exch. Currency.")
                    return false;
                }
                if (Math.abs(this.TxtExchRate) == 0) {
                    alert("Please enter Exch. Rate first.")
                    return false;
                }
                if (Math.abs(this.InrRate) == 0) {
                    alert("Please enter Exch. INR Rate first.")
                    return false;
                }
            }
         }
    }

    fnUpdate_HAWB_FREIGHT() {
        if (this.fn_FinalValidation() == false) { return false; }

        var answer = confirm("Are you sure you want to update HAWB charges ?")
        if (answer == false) { return false; }

        let HAWBNO = this._sharedconsig.exportEditData.HAWBNO;
        let IS_AGREED_RATED = '', TRANSPORT_MODE = '', CHARGEBLE_WT = '', GROSS_WT = '', FREIGHT_RATE_PER_KG = '', PREPAID_PER = '', COLLECT_PER = '',
            RATE_AGREED_BY = '', RATE_AGREED_ON = '', EXCH_RATE = '', EXCH_CUR = '', INR_RATE = '', FREIGHT_RATE_BASIC_PO = '', FREIGHT_RATE_BASIC = '';
        if (this.Type == 1) {
            IS_AGREED_RATED = 'A';
        } else if (this.Type == 2) {
            IS_AGREED_RATED = 'R';
        }

        TRANSPORT_MODE = (this.TransportMode != null) ? this.TransportMode : '';

        CHARGEBLE_WT = this.UserWgt;
        GROSS_WT = this.UserGrossWeight;

        FREIGHT_RATE_PER_KG = (this.FreightRate != null) ? this.FreightRate : '';
        PREPAID_PER = (this.PrepaidPercent != null) ? this.PrepaidPercent : '';
        COLLECT_PER = this.CollectPer;

        RATE_AGREED_BY = this.RateAgreedby;
        RATE_AGREED_ON = (this.RateAgreedOn == null) ? "" : this.RateAgreedOn.formatted;
        EXCH_RATE = this.TxtExchRate;
        EXCH_CUR = this.DrpExchRate;
        if (EXCH_CUR == '0') { EXCH_CUR = ''; }
        INR_RATE = this.InrRate;

        let PPCHRG_SELLING = 0, PPCHRG_SELLING_CUR = '', PPCHRG_SELLING_INR = '', CCCHRG_SELLING = 0, CCCHRG_SELLING_CUR = '', CCCHRG_SELLING_INR = '';

        FREIGHT_RATE_BASIC_PO = (this.RateFreightPayOn != null) ? this.RateFreightPayOn : '';
        FREIGHT_RATE_BASIC = this.RateFreight;
        PPCHRG_SELLING = Math.abs(this.Ppchrg_Selling);
        if (PPCHRG_SELLING > 0)
            PPCHRG_SELLING_CUR = this.PPchrg_SellingCur;
        PPCHRG_SELLING_INR = this.Ppchrg_SellingInr;
        CCCHRG_SELLING = Math.abs(this.Ccchrg_Selling);
        if (CCCHRG_SELLING > 0)
            CCCHRG_SELLING_CUR = this.Ccchrg_SellingCur;
        CCCHRG_SELLING_INR = this.Ccchrg_SellingInr;


        let FRT_RATE_SCHRG_FSC_PO = "",
            FRT_RATE_SCHRG_IRC_PO = "",
            FRT_RATE_SCHRG_XRAY_PO = "",
            FRT_RATE_SCHRG_FSC = "",
            FRT_RATE_SCHRG_IRC = "",
            FRT_RATE_SCHRG_XRAY = "",
            FREIGHT_CHARGABLE_AS = '';

        if (this.FreightChargeble == 1) {
            FREIGHT_CHARGABLE_AS = 'AI';

            //Added by sujit All In with X-ray after discussion with jolly sir on 24/04/2015
            FRT_RATE_SCHRG_XRAY = this.RateXray;
            if (FRT_RATE_SCHRG_XRAY != '')
                FRT_RATE_SCHRG_XRAY_PO = (this.RateXrayPayOn != null) ? this.RateXrayPayOn : '';
        }
        else if (this.FreightChargeble == 2) {
            FREIGHT_CHARGABLE_AS = 'FS';
            FRT_RATE_SCHRG_FSC = this.RateFsc;
            FRT_RATE_SCHRG_IRC = this.RateIrc;
            FRT_RATE_SCHRG_XRAY = this.RateXray;

            if (FRT_RATE_SCHRG_FSC != '')
                FRT_RATE_SCHRG_FSC_PO = (this.RateFscPayOn) ? this.RateFscPayOn : '';
            if (FRT_RATE_SCHRG_IRC != '')
                FRT_RATE_SCHRG_IRC_PO = (this.RateIrcPayOn) ? this.RateIrcPayOn : '';
            if (FRT_RATE_SCHRG_XRAY != '')
                FRT_RATE_SCHRG_XRAY_PO = (this.RateXrayPayOn) ? this.RateXrayPayOn : '';
        }

        let PP_SCHRG_FSC_SELL = 0, PP_SCHRG_FSC_SELL_CUR = '', PP_SCHRG_FSC_SELL_INR = 0, CC_SCHRG_FSC_SELL = 0, CC_SCHRG_FSC_SELL_CUR = '', CC_SCHRG_FSC_SELL_INR = 0;
        PP_SCHRG_FSC_SELL = Math.abs(this.PpFsc_Selling);
        if (PP_SCHRG_FSC_SELL > 0)
            PP_SCHRG_FSC_SELL_CUR = this.PpFsc_SellingCur;
        PP_SCHRG_FSC_SELL_INR = Math.abs(this.PpFsc_SellingInr);
        CC_SCHRG_FSC_SELL = Math.abs(this.CcFsc_Selling);
        if (CC_SCHRG_FSC_SELL > 0)
            CC_SCHRG_FSC_SELL_CUR = this.CcFsc_SellingCur;
        CC_SCHRG_FSC_SELL_INR = Math.abs(this.CcFsc_SellingInr);


        let PP_SCHRG_IRC_SELL = 0, PP_SCHRG_IRC_SELL_CUR = '', PP_SCHRG_IRC_SELL_INR = 0, CC_SCHRG_IRC_SELL = 0, CC_SCHRG_IRC_SELL_CUR = '', CC_SCHRG_IRC_SELL_INR = 0;
        PP_SCHRG_IRC_SELL = Math.abs(this.PpIrc_Selling);
        if (PP_SCHRG_IRC_SELL > 0)
            PP_SCHRG_IRC_SELL_CUR = this.PpIrc_SellingCur;
        PP_SCHRG_IRC_SELL_INR = Math.abs(this.PpIrc_SellingInr);
        CC_SCHRG_IRC_SELL = Math.abs(this.CcIrc_Selling);
        if (CC_SCHRG_IRC_SELL > 0)
            CC_SCHRG_IRC_SELL_CUR = this.CcIrc_SellingCur;
        CC_SCHRG_IRC_SELL_INR = Math.abs(this.CcIrc_SellingInr);

        let PP_SCHRG_XRAY_SELL = 0, PP_SCHRG_XRAY_SELL_CUR = '', PP_SCHRG_XRAY_SELL_INR = 0, CC_SCHRG_XRAY_SELL = 0, CC_SCHRG_XRAY_SELL_CUR = '', CC_SCHRG_XRAY_SELL_INR = 0;
        PP_SCHRG_XRAY_SELL = Math.abs(this.PpXray_Selling);
        if (PP_SCHRG_XRAY_SELL > 0)
            PP_SCHRG_XRAY_SELL_CUR = this.PpXray_SellingCur;
        PP_SCHRG_XRAY_SELL_INR = Math.abs(this.PpXray_SellingInr);
        CC_SCHRG_XRAY_SELL = Math.abs(this.CcXray_Selling);
        if (CC_SCHRG_XRAY_SELL > 0)
            CC_SCHRG_XRAY_SELL_CUR = this.CcXray_SellingCur;
        CC_SCHRG_XRAY_SELL_INR = Math.abs(this.CcXray_SellingInr);

        let FRT_RATE_MC = 0, FRT_RATE_MC_PO = '', PP_MC_SELL = 0, PP_MC_SELL_CUR = '', CC_MC_SELL = 0, CC_MC_SELL_CUR = 0, PP_MC_SELL_INR = 0, CC_MC_SELL_INR = 0;


        FRT_RATE_MC = Math.abs(this.McRate);
        if (FRT_RATE_MC > 0)
            FRT_RATE_MC_PO = this.McPayOn;
        PP_MC_SELL = Math.abs(this.McRatePP);
        PP_MC_SELL_CUR = '';
        if (PP_MC_SELL > 0)
            PP_MC_SELL_CUR = this.McCurPP;
        PP_MC_SELL_INR = Math.abs(this.McRatePPInr);
        CC_MC_SELL = Math.abs(this.McRateCC);
        if (CC_MC_SELL > 0)
            CC_MC_SELL_CUR = this.McCur;
        CC_MC_SELL_INR = Math.abs(this.McCCInr);



        /* Added by sujit for THC rate on CW for DHAKA only */

        let FRT_RATE_THC = Math.abs(this.ThcRate);
        let FRT_RATE_THC_PO = '';

        if (FRT_RATE_THC > 0)
            FRT_RATE_THC_PO = (this.ThcPayOn != null) ? this.ThcPayOn : '';

        let PP_THC_SELL = Math.abs(this.ThcRatePP);
        let PP_THC_SELL_CUR = '';

        if (PP_THC_SELL > 0)
            PP_THC_SELL_CUR = this.ThcCurPP;

        let PP_THC_SELL_INR = Math.abs(this.ThcRatePPInr);
        let CC_THC_SELL = Math.abs(this.ThcRateCC);
        let CC_THC_SELL_CUR = '';

        if (CC_THC_SELL > 0)
            CC_THC_SELL_CUR = this.ThcCur;

        let CC_THC_SELL_INR = Math.abs(this.ThcCCInr);

        //FRT_RATE_THC,   FRT_RATE_THC_PO,
        //PP_THC_SELL,    PP_THC_SELL_CUR,    PP_THC_SELL_INR,
        //CC_THC_SELL, CC_THC_SELL_CUR, CC_THC_SELL_INR

        //Added by sujit DDC

        let FRT_RATE_DDC = Math.abs(this.DdcRate);
        let FRT_RATE_DDC_PO = '';
        if (FRT_RATE_DDC > 0)
            FRT_RATE_DDC_PO = (this.DdcPayOn != null) ? this.DdcPayOn : '';

        let PP_DDC_SELL = Math.abs(this.DdcRatePP);
        let PP_DDC_SELL_CUR = '';
        if (PP_DDC_SELL > 0)
            PP_DDC_SELL_CUR = this.DdcCurPP;

        let PP_DDC_SELL_INR = Math.abs(this.DdcRatePPInr);
        let CC_DDC_SELL = Math.abs(this.DdcRateCC);
        let CC_DDC_SELL_CUR = '';
        if (CC_DDC_SELL > 0)
            CC_DDC_SELL_CUR = this.DdcCur;

        let CC_DDC_SELL_INR = Math.abs(this.DdcCCInr);

        //FRT_RATE_DDC, FRT_RATE_DDC_PO, PP_DDC_SELL, PP_DDC_SELL_CUR, PP_DDC_SELL_INR, CC_DDC_SELL, CC_DDC_SELL_CUR, CC_DDC_SELL_INR

        /* End */

        let FRT_RATE_CTG = Math.abs(this.CtgRate);
        let FRT_RATE_CTG_PO = '';
        if (FRT_RATE_CTG > 0)
            FRT_RATE_CTG_PO = (this.CtgPayOn != null) ? this.CtgPayOn : '';
        let PP_CTG_SELL = Math.abs(this.CtgRatePP);
        let PP_CTG_SELL_CUR = '';
        if (PP_CTG_SELL > 0)
            PP_CTG_SELL_CUR = this.CtgCurPP;
        let PP_CTG_SELL_INR = Math.abs(this.CtgRatePPInr);
        let CC_CTG_SELL = Math.abs(this.CtgRateCC);
        let CC_CTG_SELL_CUR = '';
        if (CC_CTG_SELL > 0)
            CC_CTG_SELL_CUR = this.CtgCur;
        let CC_CTG_SELL_INR = Math.abs(this.CtgCCInr);


        let PP_HAWB_SELL = Math.abs(this.HawbRatePP);
        let PP_HAWB_SELL_CUR = '';
        if (PP_HAWB_SELL > 0)
            PP_HAWB_SELL_CUR = this.HawbCurPP;
        let PP_HAWB_SELL_INR = Math.abs(this.HawbRatePPInr);
        let CC_HAWB_SELL = Math.abs(this.HawbRateCC);
        let CC_HAWB_SELL_CUR = '';
        if (CC_HAWB_SELL > 0)
            CC_HAWB_SELL_CUR = this.HawbCur;
        let CC_HAWB_SELL_INR = Math.abs(this.HawbCCInr);

        let PP_PCA_SELL = Math.abs(this.PcaRatePP);
        let PP_PCA_SELL_CUR = '';
        if (PP_PCA_SELL > 0)
            PP_PCA_SELL_CUR = this.PcaCurPP;
        let PP_PCA_SELL_INR = Math.abs(this.PcaRatePPInr);
        let CC_PCA_SELL = Math.abs(this.PcaRateCC);
        let CC_PCA_SELL_CUR = '';
        if (CC_PCA_SELL > 0)
            CC_PCA_SELL_CUR = this.PcaCur;
        let CC_PCA_SELL_INR = Math.abs(this.PcaCCInr);

        let PP_OTHER_SELL = Math.abs(this.OtherRatePP);
        let PP_OTHER_SELL_CUR = '';
        if (PP_OTHER_SELL > 0)
            PP_OTHER_SELL_CUR = this.OtherRateCurPP;
        let PP_OTHER_SELL_INR = Math.abs(this.OtherRatePPInr);
        let CC_OTHER_SELL = Math.abs(this.OtherRateCC);
        let CC_OTHER_SELL_CUR = '';
        if (CC_OTHER_SELL > 0)
            CC_OTHER_SELL_CUR = this.OtherRateCur;
        let CC_OTHER_SELL_INR = Math.abs(this.OtherRateInr);

        let PP_DC_SELL = Math.abs(this.DcRatePP);
        let PP_DC_SELL_CUR = '';
        if (PP_DC_SELL > 0)
            PP_DC_SELL_CUR = this.DcCurPP;
        let PP_DC_SELL_INR = Math.abs(this.DcRatePPInr);
        let CC_DC_SELL = Math.abs(this.DcRateCC);
        let CC_DC_SELL_CUR = '';
        if (CC_DC_SELL > 0)
            CC_DC_SELL_CUR = this.DcCur;
        let CC_DC_SELL_INR = Math.abs(this.DcCCInr);

        let PP_SCR_SELL = Math.abs(this.ScrRatePP);
        let PP_SCR_SELL_CUR = '';
        if (PP_SCR_SELL > 0)
            PP_SCR_SELL_CUR = this.ScrCurPP;
        let PP_SCR_SELL_INR = Math.abs(this.ScrRatePPInr);
        let CC_SCR_SELL = Math.abs(this.ScrRateCC);
        let CC_SCR_SELL_CUR = '';
        if (CC_SCR_SELL > 0)
            CC_SCR_SELL_CUR = this.ScrCur;
        let CC_SCR_SELL_INR = Math.abs(this.ScrCCInr);

        let PP_MYC_SELL = Math.abs(this.MycRatePP);
        let PP_MYC_SELL_CUR = '';
        if (PP_MYC_SELL > 0)
            PP_MYC_SELL_CUR = this.MycCurPP;
        let PP_MYC_SELL_INR = Math.abs(this.MycRatePPInr);
        let CC_MYC_SELL = Math.abs(this.MycRateCC);
        let CC_MYC_SELL_CUR = '';
        if (CC_MYC_SELL > 0)
            CC_MYC_SELL_CUR = this.MycCur;
        let CC_MYC_SELL_INR = Math.abs(this.MycCCInr);


        let PPTOTCARR_SELLING = Math.abs(this.Pptotcarr_Selling);
        let CCTOTCARR_SELLING_INR = Math.abs(this.Cctotcarr_SellingInr);

        let PPTOTAGT_SELLING = Math.abs(this.Pptotagt_Selling);
        let CCTOTAGT_SELLING_INR = Math.abs(this.Cctotagt_SellingInr);

        let PPTOT_SELLING = Math.abs(this.Pptot_Selling);
        let CCTOT_SELLING = Math.abs(this.Cctot_Selling);

        let REMARK = this.Remark;
        let Procurment = this.Procument;
        if (parseFloat(Procurment) > 20.00) {
            alert("Please Enter below 20 on Agent Charges! ");
            return false;
        }
        ///////////////////////////////////////////////////////////////////

       /*added by nisha FOB 12/06/2019 */
       let FRT_RATE_FOB = 0, FRT_RATE_FOB_PO = '', PP_FOB_SELL = 0, PP_FOB_SELL_CUR = '', CC_FOB_SELL = 0, CC_FOB_SELL_CUR = 0, PP_FOB_SELL_INR = 0, CC_FOB_SELL_INR = 0;

       FRT_RATE_FOB = Math.abs(this.fobRate);
       if (FRT_RATE_FOB> 0)
           FRT_RATE_FOB_PO = this.fobPayOn;
       PP_FOB_SELL = Math.abs(this.fobRatePP);
       PP_FOB_SELL_CUR = '';
       if (PP_FOB_SELL > 0)
           PP_FOB_SELL_CUR = this.fobCurPP;
       PP_FOB_SELL_INR = Math.abs(this.fobRatePPInr);
       CC_FOB_SELL = Math.abs(this.fobRateCC);
       if (CC_FOB_SELL > 0)
           CC_FOB_SELL_CUR = this.fobCur;
       CC_FOB_SELL_INR = Math.abs(this.fobCCInr);


        if (FREIGHT_RATE_BASIC == '') { FREIGHT_RATE_BASIC = '0'; }
        if (FRT_RATE_SCHRG_FSC == '') { FRT_RATE_SCHRG_FSC = '0'; }
        if (FRT_RATE_SCHRG_IRC == '') { FRT_RATE_SCHRG_IRC = '0'; }
        if (FRT_RATE_SCHRG_XRAY == '') { FRT_RATE_SCHRG_XRAY = '0'; }


        const _jsonData = {
            HAWBNO: HAWBNO,
            PPCHRG_SELLING: PPCHRG_SELLING,
            CCCHRG_SELLING: CCCHRG_SELLING,
            PPTOTAGT_SELLING: PPTOTAGT_SELLING,
            PPTOTCARR_SELLING: PPTOTCARR_SELLING,
            PPTOT_SELLING: PPTOT_SELLING,
            CCTOT_SELLING: CCTOT_SELLING,
            PP_SCHRG_FSC_SELL: PP_SCHRG_FSC_SELL,
            PP_SCHRG_IRC_SELL: PP_SCHRG_IRC_SELL,
            PP_SCHRG_XRAY_SELL: PP_SCHRG_XRAY_SELL,
            CC_SCHRG_FSC_SELL: CC_SCHRG_FSC_SELL,
            CC_SCHRG_IRC_SELL: CC_SCHRG_IRC_SELL,
            CC_SCHRG_XRAY_SELL: CC_SCHRG_XRAY_SELL,
            REMARK: REMARK,
            IS_AGREED_RATED: IS_AGREED_RATED,
            FREIGHT_RATE_PER_KG: FREIGHT_RATE_PER_KG,
            PREPAID_PER: PREPAID_PER,
            COLLECT_PER: COLLECT_PER,
            FREIGHT_CHARGABLE_AS: FREIGHT_CHARGABLE_AS,
            FRT_RATE_SCHRG_FSC_PO: FRT_RATE_SCHRG_FSC_PO,
            FRT_RATE_SCHRG_IRC_PO: FRT_RATE_SCHRG_IRC_PO,
            FRT_RATE_SCHRG_XRAY_PO: FRT_RATE_SCHRG_XRAY_PO,
            RATE_AGREED_BY: RATE_AGREED_BY,
            RATE_AGREED_ON: RATE_AGREED_ON,
            FREIGHT_RATE_BASIC: FREIGHT_RATE_BASIC,
            FRT_RATE_SCHRG_FSC: FRT_RATE_SCHRG_FSC,
            FRT_RATE_SCHRG_IRC: FRT_RATE_SCHRG_IRC,
            FRT_RATE_SCHRG_XRAY: FRT_RATE_SCHRG_XRAY,
            CHARGEBLE_WT: CHARGEBLE_WT,
            GROSS_WT: GROSS_WT,
            EXCH_RATE: EXCH_RATE,
            EXCH_CUR: EXCH_CUR,
            INR_RATE: INR_RATE,
            CCCHRG_SELLING_CUR: CCCHRG_SELLING_CUR,
            CC_SCHRG_FSC_SELL_CUR: CC_SCHRG_FSC_SELL_CUR,
            CC_SCHRG_IRC_SELL_CUR: CC_SCHRG_IRC_SELL_CUR,
            CC_SCHRG_XRAY_SELL_CUR: CC_SCHRG_XRAY_SELL_CUR,
            CCCHRG_SELLING_INR: CCCHRG_SELLING_INR,
            CC_SCHRG_FSC_SELL_INR: CC_SCHRG_FSC_SELL_INR,
            CC_SCHRG_IRC_SELL_INR: CC_SCHRG_IRC_SELL_INR,
            CC_SCHRG_XRAY_SELL_INR: CC_SCHRG_XRAY_SELL_INR,
            CCTOTAGT_SELLING_INR: CCTOTAGT_SELLING_INR,
            CCTOTCARR_SELLING_INR: CCTOTCARR_SELLING_INR,
            PPCHRG_SELLING_CUR: PPCHRG_SELLING_CUR,
            PPCHRG_SELLING_INR: PPCHRG_SELLING_INR,
            PP_SCHRG_FSC_SELL_CUR: PP_SCHRG_FSC_SELL_CUR,
            PP_SCHRG_FSC_SELL_INR: PP_SCHRG_FSC_SELL_INR,
            PP_SCHRG_IRC_SELL_CUR: PP_SCHRG_IRC_SELL_CUR,
            PP_SCHRG_IRC_SELL_INR: PP_SCHRG_IRC_SELL_INR,
            PP_SCHRG_XRAY_SELL_CUR: PP_SCHRG_XRAY_SELL_CUR,
            PP_SCHRG_XRAY_SELL_INR: PP_SCHRG_XRAY_SELL_INR,
            FREIGHT_RATE_BASIC_PO: FREIGHT_RATE_BASIC_PO,
            FRT_RATE_MC_PO: FRT_RATE_MC_PO,
            FRT_RATE_MC: FRT_RATE_MC,
            PP_MC_SELL: PP_MC_SELL,
            CC_MC_SELL: CC_MC_SELL,
            CC_MC_SELL_CUR: CC_MC_SELL_CUR,
            CC_MC_SELL_INR: CC_MC_SELL_INR,
            FRT_RATE_CTG_PO: FRT_RATE_CTG_PO,
            FRT_RATE_CTG: FRT_RATE_CTG,
            PP_CTG_SELL: PP_CTG_SELL,
            CC_CTG_SELL: CC_CTG_SELL,
            CC_CTG_SELL_CUR: CC_CTG_SELL_CUR,
            CC_CTG_SELL_INR: CC_CTG_SELL_INR,
            PP_HAWB_SELL: PP_HAWB_SELL,
            CC_HAWB_SELL: CC_HAWB_SELL,
            CC_HAWB_SELL_CUR: CC_HAWB_SELL_CUR,
            CC_HAWB_SELL_INR: CC_HAWB_SELL_INR,
            PP_PCA_SELL: PP_PCA_SELL,
            CC_PCA_SELL: CC_PCA_SELL,
            CC_PCA_SELL_CUR: CC_PCA_SELL_CUR,
            CC_PCA_SELL_INR: CC_PCA_SELL_INR,
            PP_OTHER_SELL: PP_OTHER_SELL,
            CC_OTHER_SELL: CC_OTHER_SELL,
            CC_OTHER_SELL_CUR: CC_OTHER_SELL_CUR,
            CC_OTHER_SELL_INR: CC_OTHER_SELL_INR,
            PP_MC_SELL_CUR: PP_MC_SELL_CUR,
            PP_MC_SELL_INR: PP_MC_SELL_INR,
            PP_CTG_SELL_CUR: PP_CTG_SELL_CUR,
            PP_CTG_SELL_INR: PP_CTG_SELL_INR,
            PP_HAWB_SELL_CUR: PP_HAWB_SELL_CUR,
            PP_HAWB_SELL_INR: PP_HAWB_SELL_INR,
            PP_PCA_SELL_CUR: PP_PCA_SELL_CUR,
            PP_PCA_SELL_INR: PP_PCA_SELL_INR,
            PP_OTHER_SELL_CUR: PP_OTHER_SELL_CUR,
            PP_OTHER_SELL_INR: PP_OTHER_SELL_INR,
            PP_DC_SELL: PP_DC_SELL,
            PP_DC_SELL_CUR: PP_DC_SELL_CUR,
            PP_DC_SELL_INR: PP_DC_SELL_INR,
            CC_DC_SELL: CC_DC_SELL,
            CC_DC_SELL_CUR: CC_DC_SELL_CUR,
            CC_DC_SELL_INR: CC_DC_SELL_INR,
            PP_SCR_SELL: PP_SCR_SELL,
            PP_SCR_SELL_CUR: PP_SCR_SELL_CUR,
            PP_SCR_SELL_INR: PP_SCR_SELL_INR,
            CC_SCR_SELL: CC_SCR_SELL,
            CC_SCR_SELL_CUR: CC_SCR_SELL_CUR,
            CC_SCR_SELL_INR: CC_SCR_SELL_INR,
            PP_MYC_SELL: PP_MYC_SELL,
            PP_MYC_SELL_CUR: PP_MYC_SELL_CUR,
            PP_MYC_SELL_INR: PP_MYC_SELL_INR,
            CC_MYC_SELL: CC_MYC_SELL,
            CC_MYC_SELL_CUR: CC_MYC_SELL_CUR,
            CC_MYC_SELL_INR: CC_MYC_SELL_INR,
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CmpId: this._loginService.getLogin()[0].CMPID,
            MakerIP: this._loginService.getLogin()[0].CMPID,
            TRANSPORT_MODE: TRANSPORT_MODE,
            Procument: Procurment,
            FRT_RATE_THC_PO: FRT_RATE_THC_PO,
            FRT_RATE_THC: FRT_RATE_THC,
            PP_THC_SELL: PP_THC_SELL,
            PP_THC_SELL_CUR: PP_THC_SELL_CUR,
            PP_THC_SELL_INR: PP_THC_SELL_INR,
            CC_THC_SELL: CC_THC_SELL,
            CC_THC_SELL_CUR: CC_THC_SELL_CUR,
            CC_THC_SELL_INR: CC_THC_SELL_INR,
            FRT_RATE_DDC_PO: FRT_RATE_DDC_PO,
            FRT_RATE_DDC: FRT_RATE_DDC,
            PP_DDC_SELL: PP_DDC_SELL,
            PP_DDC_SELL_CUR: PP_DDC_SELL_CUR,
            PP_DDC_SELL_INR: PP_DDC_SELL_INR,
            CC_DDC_SELL: CC_DDC_SELL,
            CC_DDC_SELL_CUR: CC_DDC_SELL_CUR,
            CC_DDC_SELL_INR: CC_DDC_SELL_INR,
            FRT_RATE_FOB_PO: FRT_RATE_FOB_PO,
            FRT_RATE_FOB: FRT_RATE_FOB,
            PP_FOB_SELL: PP_FOB_SELL,
            PP_FOB_SELL_CUR: PP_FOB_SELL_CUR,
            PP_FOB_SELL_INR: PP_FOB_SELL_INR,
            CC_FOB_SELL: CC_FOB_SELL,
            CC_FOB_SELL_CUR: CC_FOB_SELL_CUR,
            CC_FOB_SELL_INR: CC_FOB_SELL_INR,
            VGUID:this._loginService.getLogin()[0].GUID, ///ADDED BY NALINI FOR AIRLINECHARGES
        };

        this.disabledBtn.emit(true);
        this._loaderService.display(true);
        this._dataService.Common("Export/EXP_MST_EXPORT_HAWB_FRT_UPDATE", _jsonData)
            .subscribe((data: any) => {
                // if (data.Table[0].STATUS.split[0] == '100') {
                if (data.Table[0].STATUS.split('#')[0]== '100') {
                    this._loaderService.display(false);
                    this.disabledBtn.emit(false);
                    this.result.emit({ status: data.Table[0].STATUS.split('#')[0], message: "Hawb updated Successfully!." });
                }
                else {
                    this._toasterService.toast('error', 'error', data.Table[0].STATUSTEXT);
                    this._loaderService.display(false);
                }
            });
    }
    AddHAWBALCharges() ///ADDED BY NALINI FOR AIRLINECHARGES ADD in TMP
    {
        if(this.CHARGETYPE=='' || this.CHARGETYPE==undefined)
        {
            alert("Please select Charge Type.")
            return false;
        }
        if(this.CHARGENAME=='' || this.CHARGENAME==undefined)
        {
            alert("Please select Charge. ")
            return false;
        }
        if(this.RATE_TAR==null || this.RATE_TAR=='')
        {
            alert("Please enter Tariff Rate. ")
            return false;
        }
        if(this.RATE_TAR_FRT=='')
        {
            alert("Please enter Tariff Rate Freight. ")
            return false;
        }
        if(this.txtchild=="Add"){
        if (this.Chargeslist.length > "0") {
        let chrgnm: any = []
        chrgnm = this.Chargeslist.filter((code: any) => code.FK_CHARGEID === parseInt(this.CHARGENAME.split("|")[0]))
        if (chrgnm.length > "0") {
            this._toasterService.toast('warning', 'warning', 'Same Charge already Exists!');
            return false;
        }
        }
        }
        const jsonchild= {PK_ID:this.PK_ID,
        FKID:this.FK_ID,
        CHRGDETAILSID:this.CHRGDETAILSID,
        HAWBNO:this._sharedconsig.exportEditData.HAWBNO,
        FK_CHARGEID:this.CHARGENAME.split("|")[0] ,
        CHARGETYPE:this.CHARGETYPE,
        RATE_TAR:this.RATE_TAR,
        RATE_TAR_FRT:this.RATE_TAR_FRT,
        RATE_NET:this.RATE_NET,
        RATE_NET_FRT:this.RATE_NET_FRT,
        MAKERID:this._loginService.getLogin()[0].CMPID,
        VGUID:this._loginService.getLogin()[0].GUID,

        }
       this._dataService.Common("Export/EXPT_HAWB_PRINT_RATE_AIRLINE_CHARGES_TMPIU", jsonchild)
           .subscribe((data: any) => {
           if (data.Table[0].STATUS == "100") {
                   this.Chargeslist=data.Table1;
                   if(this.EDIT_CHARGETYPE != undefined){
                    this.fn_CalculateAlCharges_PPCCEDIT(data.Table6)
                   }
                   else
                   { this.fn_CalculateAlCharges_PPCCADD(data.Table6); }

                   this.tot_rate_tar_pp_da=data.Table2[0].RATE_TAR_TOTAL_PP_DA;
                   this.tot_rate_net_pp_da=data.Table2[0].RATE_NET_TOTAL_PP_DA;
                   this.tot_rate_tar_cc_da=data.Table3[0].RATE_TAR_TOTAL_CC_DA;
                   this.tot_rate_net_cc_da=data.Table3[0].RATE_NET_TOTAL_CC_DA;
                   this.tot_rate_tar_pp_dc=data.Table4[0].RATE_TAR_TOTAL_PP_DC;
                   this.tot_rate_net_pp_dc=data.Table4[0].RATE_NET_TOTAL_PP_DC;
                   this.tot_rate_tar_cc_dc=data.Table5[0].RATE_TAR_TOTAL_CC_DC;
                   this.tot_rate_net_cc_dc=data.Table5[0].RATE_NET_TOTAL_CC_DC;
                   this.ResetHAWBCharges();
                //    this.loaderService.display(false);
               }
           else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT);
                      // this.loaderService.display(false);
               }
           });
    }
    fn_CalculateAlCharges_PPCCADD(tbl6) ///ADDED BY NALINI FOR AIRLINECHARGES
    {
        // if(tbl6[0].CHARGETYPE!=this.EDIT_RATE_NET_FRT.c)
        if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='PP')
        {
         this.Pptotagt_Selling=Math.abs(this.Pptotagt_Selling)  + Math.abs(tbl6[0].RATE_NET);
         this.Pptot_Selling=Math.abs(this.Pptot_Selling) +  Math.abs(tbl6[0].RATE_NET);
        }

        if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='CC')
        {
         this.Cctotagt_SellingInr=Math.abs(this.Cctotagt_SellingInr) + Math.abs(tbl6[0].RATE_NET);
         this.Cctot_Selling=Math.abs(this.Cctot_Selling)  +  Math.abs(tbl6[0].RATE_NET);
        }

        if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='PP' )
        {
         this.Pptotcarr_Selling=Math.abs(this.Pptotcarr_Selling)  + Math.abs(tbl6[0].RATE_NET);
         this.Pptot_Selling=Math.abs(this.Pptot_Selling)  +  Math.abs(tbl6[0].RATE_NET);
        }
        if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='CC' )
        {
         this.Cctotcarr_SellingInr=Math.abs(this.Cctotcarr_SellingInr)  + Math.abs(tbl6[0].RATE_NET);
         this.Cctot_Selling=Math.abs(this.Cctot_Selling)  +  Math.abs(tbl6[0].RATE_NET);
        }

    }
    fn_CalculateAlCharges_PPCCEDIT(tbl6){
        // if(tbl6[0].CHARGETYPE!=this.EDIT_RATE_NET_FRT.c)

        if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DA' && this.EDIT_RATE_TAR_FRT=='CC')
        {

         this.Cctotagt_SellingInr=(Math.abs(this.Cctotagt_SellingInr) - Math.abs(this.EDIT_RATE_NET))  + Math.abs(tbl6[0].RATE_NET);
         this.Cctot_Selling=(Math.abs(this.Cctot_Selling) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(tbl6[0].RATE_NET);
        }
        if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DA' && this.EDIT_RATE_TAR_FRT=='PP')
        {
         this.Pptotagt_Selling=(Math.abs(this.Pptotagt_Selling)) - Math.abs(this.EDIT_RATE_NET);
         this.Pptot_Selling= (Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET) )
         this.Cctotagt_SellingInr=Math.abs(this.Cctotagt_SellingInr)   + Math.abs(tbl6[0].RATE_NET);
         this.Cctot_Selling=Math.abs(this.Cctot_Selling)  +  Math.abs(tbl6[0].RATE_NET);
        }

        /* DA CC DC CC */

        if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DC' && this.EDIT_RATE_TAR_FRT=='CC')
        {
         this.Cctotcarr_SellingInr=(Math.abs(this.Cctotcarr_SellingInr)) - Math.abs(this.EDIT_RATE_NET);
         this.Cctot_Selling=Math.abs(this.Cctot_Selling)  -  Math.abs(this.EDIT_RATE_NET);
         this.Cctotagt_SellingInr=Math.abs(this.Cctotagt_SellingInr)   + Math.abs(tbl6[0].RATE_NET);
         this.Cctot_Selling= (Math.abs(this.Cctot_Selling) + Math.abs(tbl6[0].RATE_NET));


        }

          /* DA CC DC PP */

          if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DC' && this.EDIT_RATE_TAR_FRT=='PP')
          {
           this.Pptotcarr_Selling=(Math.abs(this.Pptotcarr_Selling)) - Math.abs(this.EDIT_RATE_NET);
           this.Pptot_Selling=Math.abs(this.Pptot_Selling)  -  Math.abs(this.EDIT_RATE_NET);
           this.Cctotagt_SellingInr=Math.abs(this.Cctotagt_SellingInr)   + Math.abs(tbl6[0].RATE_NET);
           this.Cctot_Selling= (Math.abs(this.Cctot_Selling) + Math.abs(tbl6[0].RATE_NET));


          }
        if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='PP' && this.EDIT_CHARGETYPE=='DA' && this.EDIT_RATE_TAR_FRT=='PP')
        {


         this.Pptotagt_Selling=(Math.abs(this.Pptotagt_Selling) - Math.abs(this.EDIT_RATE_NET ))+  Math.abs(tbl6[0].RATE_NET);
         this.Pptot_Selling= (Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(tbl6[0].RATE_NET)
        }
        if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='PP' && this.EDIT_CHARGETYPE=='DA' && this.EDIT_RATE_TAR_FRT=='CC')
        {

         this.Cctotagt_SellingInr=Math.abs(this.Cctotagt_SellingInr) - Math.abs(this.EDIT_RATE_NET) ;
         this.Cctot_Selling=(Math.abs(this.Cctot_Selling) - Math.abs(this.EDIT_RATE_NET)) ;
         this.Pptotagt_Selling=(Math.abs(this.Pptotagt_Selling) + Math.abs(tbl6[0].RATE_NET));
         this.Pptot_Selling= (Math.abs(this.Pptot_Selling) + Math.abs(tbl6[0].RATE_NET))
        }
        /* DA PP DC PP*/
        if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='PP' && this.EDIT_CHARGETYPE=='DC' && this.EDIT_RATE_TAR_FRT=='PP')
        {

         this.Pptotcarr_Selling=Math.abs(this.Pptotcarr_Selling) - Math.abs(this.EDIT_RATE_NET) ;
         this.Pptot_Selling=(Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET)) ;
         this.Pptotagt_Selling=(Math.abs(this.Pptotagt_Selling)) + Math.abs(tbl6[0].RATE_NET);
         this.Pptot_Selling= (Math.abs(this.Pptot_Selling) + Math.abs(tbl6[0].RATE_NET) )
        }

         /* DA PP DC CC*/
         if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='PP' && this.EDIT_CHARGETYPE=='DC' && this.EDIT_RATE_TAR_FRT=='CC')
         {

          this.Cctotcarr_SellingInr=Math.abs(this.Cctotcarr_SellingInr) - Math.abs(this.EDIT_RATE_NET) ;
          this.Cctot_Selling=(Math.abs(this.Cctot_Selling) - Math.abs(this.EDIT_RATE_NET)) ;
          this.Pptotagt_Selling=(Math.abs(this.Pptotagt_Selling)) + Math.abs(tbl6[0].RATE_NET);
          this.Pptot_Selling= (Math.abs(this.Pptot_Selling) + Math.abs(tbl6[0].RATE_NET) )
         }


        if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DC' && this.EDIT_RATE_TAR_FRT=='CC' )
        {
         this.Cctotcarr_SellingInr=(Math.abs(this.Cctotcarr_SellingInr) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
         this.Cctot_Selling=(Math.abs(this.Cctot_Selling) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(tbl6[0].RATE_NET);
        }
        if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DC' && this.EDIT_RATE_TAR_FRT=='PP')
        {
         this.Pptotcarr_Selling=(Math.abs(this.Pptotcarr_Selling) -Math.abs(this.EDIT_RATE_NET)) ;
         this.Pptot_Selling=(Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET)) ;
         this.Cctotcarr_SellingInr=Math.abs(this.Cctotcarr_SellingInr) + Math.abs(tbl6[0].RATE_NET);
         this.Cctot_Selling=Math.abs(this.Cctot_Selling) + Math.abs(tbl6[0].RATE_NET);

        }
        if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DA' && this.EDIT_RATE_TAR_FRT=='PP')
        {
          this.Pptotagt_Selling=(Math.abs(this.Pptotagt_Selling)) - Math.abs(this.EDIT_RATE_NET);
          this.Pptot_Selling=(Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET)) ;
          this.Cctotcarr_SellingInr=Math.abs(this.Cctotcarr_SellingInr)  + Math.abs(tbl6[0].RATE_NET);
          this.Cctot_Selling=Math.abs(this.Cctot_Selling)  + Math.abs(tbl6[0].RATE_NET);
         }

         /* dc cc da cc */
        if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DA' && this.EDIT_RATE_TAR_FRT=='CC')
        {
          this.Cctotagt_SellingInr=Math.abs(this.Cctotagt_SellingInr) - Math.abs(this.EDIT_RATE_NET);
          this.Cctot_Selling=Math.abs(this.Cctot_Selling) - Math.abs(this.EDIT_RATE_NET);
          this.Cctotcarr_SellingInr=(Math.abs(this.Cctotcarr_SellingInr) + Math.abs(tbl6[0].RATE_NET)) ;
          this.Cctot_Selling=(Math.abs(this.Cctot_Selling)) + Math.abs(tbl6[0].RATE_NET);

        }

        if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='PP' && this.EDIT_CHARGETYPE=='DC' && this.EDIT_RATE_TAR_FRT=='PP')
        {
            if(this.Pptotcarr_Selling != '0'){
                this.Pptotcarr_Selling=(Math.abs(this.Pptotcarr_Selling) -Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
                this.Pptot_Selling=(Math.abs( this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(tbl6[0].RATE_NET);
            }
            else
            {
                this.Pptotcarr_Selling=(Math.abs(this.Pptotcarr_Selling)  + Math.abs(tbl6[0].RATE_NET));
                this.Pptot_Selling=(Math.abs( this.Pptot_Selling) +  Math.abs(tbl6[0].RATE_NET));
            }

        }
        if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='PP' && this.EDIT_CHARGETYPE=='DC' && this.EDIT_RATE_TAR_FRT=='CC')
        {
         this.Cctotcarr_SellingInr=Math.abs(this.Cctotcarr_SellingInr) - Math.abs(this.EDIT_RATE_NET);
         this.Cctot_Selling=Math.abs(this.Cctot_Selling) - Math.abs(tbl6[0].RATE_NET);
         this.Pptotcarr_Selling=(Math.abs(this.Pptotcarr_Selling)  + Math.abs(tbl6[0].RATE_NET));
         this.Pptot_Selling=(Math.abs( this.Pptot_Selling)  + Math.abs(tbl6[0].RATE_NET)) ;

        }
        if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='PP' && this.EDIT_CHARGETYPE=='DA' && this.EDIT_RATE_TAR_FRT=='PP')
        {
          this.Pptotcarr_Selling=Math.abs(this.Pptotcarr_Selling)  + Math.abs(tbl6[0].RATE_NET);
          this.Pptot_Selling=(Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET)) ;
          this.Pptotagt_Selling=(Math.abs(this.Pptotagt_Selling)) - Math.abs(this.EDIT_RATE_NET);

        // this.Pptot_Selling=(Math.abs(this.Pptot_Selling)- Math.abs(this.EDIT_RATE_NET)) ;
        // this.Cctot_Selling=Math.abs(this.Cctot_Selling) - Math.abs(tbl6[0].RATE_NET);
        }

        if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='PP' && this.EDIT_CHARGETYPE=='DA' && this.EDIT_RATE_TAR_FRT=='CC')
        {

            this.Pptotcarr_Selling=Math.abs(this.Pptotcarr_Selling)  + Math.abs(tbl6[0].RATE_NET);
            this.Pptot_Selling=Math.abs(this.Pptot_Selling)  +  Math.abs(tbl6[0].RATE_NET);
            this.Cctotagt_SellingInr=Math.abs(this.Cctotagt_SellingInr) - Math.abs(this.EDIT_RATE_NET);
            this.Cctot_Selling=Math.abs(this.Cctot_Selling)  - Math.abs(this.EDIT_RATE_NET);
        }
    }
    // fn_CalculateAlCharges_PPCC(tbl6){

    //     if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='PP' && this.EDIT_CHARGETYPE=='DA')
    //     {
    //      this.Pptotagt_Selling=(Math.abs(this.Pptotagt_Selling) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
    //      this.Pptot_Selling=(Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET) ) +  Math.abs(tbl6[0].RATE_NET);
    //     }
    //     if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='PP' && this.EDIT_CHARGETYPE=='DC')
    //     {
    //      this.Pptotagt_Selling=(Math.abs(this.Pptotagt_Selling)) + Math.abs(tbl6[0].RATE_NET);
    //      this.Pptotcarr_Selling=(Math.abs(this.Pptotcarr_Selling) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
    //      this.Pptot_Selling=(Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET));
    //     }
    //     if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DA')
    //     {
    //      this.Cctotagt_SellingInr=(Math.abs(this.Cctotagt_SellingInr) - Math.abs(this.EDIT_RATE_NET))  + Math.abs(tbl6[0].RATE_NET);
    //      this.Cctot_Selling=(Math.abs(this.Cctot_Selling) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(tbl6[0].RATE_NET);
    //     }
    //     if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DC')
    //     {

    //         this.Cctotagt_SellingInr=(Math.abs(this.Cctotagt_SellingInr)+  Math.abs(tbl6[0].RATE_NET)) ;
    //         this.Cctotcarr_SellingInr=Math.abs(this.Cctotcarr_SellingInr) - Math.abs(this.EDIT_RATE_NET) ;
    //         this.Cctot_Selling=Math.abs(this.Cctot_Selling) - Math.abs(tbl6[0].RATE_NET);
    //     }
    //     if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='PP' && this.EDIT_CHARGETYPE=='DC')
    //     {
    //      this.Pptotcarr_Selling=(Math.abs(this.Pptotcarr_Selling) -Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
    //      this.Pptot_Selling=(Math.abs(tbl6[0].Pptot_Selling) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(tbl6[0].RATE_NET);
    //     }
    //     if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DC')
    //     {
    //      this.Cctotcarr_SellingInr=(Math.abs(this.Cctotcarr_SellingInr) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
    //      this.Cctot_Selling=(Math.abs(this.Cctot_Selling) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(tbl6[0].RATE_NET);
    //     }
    //     if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DA')
    //     {
    //      this.Cctotcarr_SellingInr=Math.abs(this.Cctotcarr_SellingInr) + Math.abs(tbl6[0].RATE_NET);
    //      this.Cctotagt_SellingInr=(Math.abs(this.Cctotagt_SellingInr)- Math.abs(this.EDIT_RATE_NET)) ;
    //      this.Cctot_Selling=Math.abs(this.Cctot_Selling) - Math.abs(tbl6[0].RATE_NET);
    //     }
    // }
    ResetHAWBCharges()
    {
        this.CHARGETYPE=undefined;
        this.CHARGENAME="";
        this.RATE_TAR="";
        this.RATE_TAR_FRT="";
        this.RATE_NET="";
        this.RATE_NET_FRT="";
        this.txtchild="Add";
        this.CHRGDETAILSID="0";
        this.PK_ID="0"
        this.EDIT_CHARGETYPE=undefined;

    }
    Editchildrecd(id) {
        let filterData = this.Chargeslist.filter((filter) => filter.PK_ID == id)[0];
        //this.fk=filterData.ID;
        this.PK_ID=filterData.PK_ID,
        this.FK_ID=filterData.FK_ID,
        this.CHARGETYPE=filterData.CHARGETYPE;
        this.CHRGDETAILSID=filterData.FK_CHRGDETAILSID;
        this.AirLineCharges =this.AllAirLineChargeslist.filter((code: any) => code.DataValueField.split("|")[1] === this.CHARGETYPE);
        this.CHARGENAME=filterData.FK_CHARGEID + '|' + filterData.CHARGETYPE;
        this.RATE_TAR=filterData.RATE_TAR;
        this.RATE_TAR_FRT=filterData.RATE_TAR_FRT;
        this.RATE_NET=filterData.RATE_NET;
        this.RATE_NET_FRT=filterData.RATE_NET_FRT;
        this.EDIT_RATE_TAR=filterData.RATE_TAR;
        this.EDIT_RATE_NET=filterData.RATE_NET;
        this.EDIT_CHARGETYPE=filterData.CHARGETYPE;
        this.EDIT_RATE_TAR_FRT=filterData.RATE_TAR_FRT;
       // this.EDIT_RATE_NET_FRT=filterData.RATE_NET_FRT;
        this.txtchild="Update";
        }
        deletechildrecd(id,chrgdtlsid){

                if(confirm('Are you sure want to delete the record ?')) {
                    this._loaderService.display(true);
                    const jsondelete = { ID  : id,VGUID :this._loginService.getLogin()[0].GUID,FK_CHRGDTLSID:chrgdtlsid}
                    this._dataService.getData("Export/EXPT_HAWB_PRINT_RATE_AIRLINE_CHARGES_TMP_DEL", jsondelete)
                        .subscribe((data: any) => {

                        if (data.Table[0].STATUS== "100") {
                            this.Chargeslist=data.Table
                            this.DELCHARGETYPE=data.Table1[0].CHARGETYPE;
                            this.DEL_RATE_TAR=data.Table1[0].RATE_TAR;
                            this.DEL_RATE_TAR_FRT=data.Table1[0].RATE_TAR_FRT;
                            this.DEL_RATE_NET=data.Table1[0].RATE_NET;
                            this.DEL_RATE_NET_FRT=data.Table1[0].RATE_NET_FRT;
                            if(this.DELCHARGETYPE=='DA' && this.DEL_RATE_TAR_FRT=='PP')
                            {
                             this.Pptotagt_Selling=(Math.abs(this.Pptotagt_Selling) - Math.abs(this.DEL_RATE_TAR));
                             this.Pptot_Selling=(Math.abs(this.Pptot_Selling) - Math.abs(this.DEL_RATE_NET)) ;
                            }

                            if(this.DELCHARGETYPE=='DA' && this.DEL_RATE_TAR_FRT=='CC')
                            {
                                this.Cctotagt_SellingInr=(Math.abs(this.Cctotagt_SellingInr) - Math.abs(this.DEL_RATE_TAR));
                                this.Cctot_Selling=(Math.abs(this.Cctot_Selling) - Math.abs(this.DEL_RATE_NET));
                            }
                            if(this.DELCHARGETYPE=='DC' && this.DEL_RATE_TAR_FRT=='PP')
                            {
                                this.Pptotcarr_Selling=(Math.abs(this.Pptotcarr_Selling) -Math.abs(this.DEL_RATE_TAR));
                                this.Pptot_Selling=(Math.abs(this.Pptot_Selling) - Math.abs(this.DEL_RATE_NET));
                            }
                            if(this.DELCHARGETYPE=='DC' && this.DEL_RATE_TAR_FRT=='CC')
                            {
                                this.Cctotcarr_SellingInr=(Math.abs(this.Cctotcarr_SellingInr) - Math.abs(this.DEL_RATE_TAR));
                                this.Cctot_Selling=(Math.abs(this.Cctot_Selling) - Math.abs(this.DEL_RATE_NET));
                            }
                            this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT );
                            this._loaderService.display(false);
                            }
                            else {
                            this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT);
                            this._loaderService.display(false);
                            }
                        });
                }
                else{return false;
                    this._loaderService.display(false); }
            }

            changeNetRate(rate1) {
                this.RATE_NET=rate1;
               }
            changeNetFreight(frt1) {
                this.RATE_NET_FRT=frt1
               }

    GetChrges(chrgtype)
    {
        this.AirLineCharges =this.AllAirLineChargeslist.filter((code: any) => code.DataValueField.split("|")[1] === chrgtype);
    }
    validate() {   if(this.ISAUTO_FRT_INV=="1")
    {alert("HAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This HAWB !!");return false;}
    else{this.fnUpdate_HAWB_FREIGHT(); }
    }
}
// export class HAWBEditComponent {

//     @Input() exptno: any;
//     @Input() type: string;
//     @Output() result: EventEmitter<any> = new EventEmitter<any>();
//     @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

//     public myDatePickerOptions: IMyDpOptions = {
//         dateFormat: 'dd/mm/yyyy',
//         inline: false,
//         height: '16px',
//         width: '120px',
//         componentDisabled: false,
//         selectionTxtFontSize: '12px',
//         editableDateField: false,
//         sunHighlight: true,
//         satHighlight: true,
//         firstDayOfWeek: 'su',
//         openSelectorTopOfInput: false,
//         openSelectorOnInputClick: true,
//         selectorHeight: '180px',
//         selectorWidth: '200px'
//     };

//     rateList: any = [];
//     currencyList: any = [{ VALUEFIELD: 'INR', TEXTFIELD: 'INR' }, { VALUEFIELD: 'USD', TEXTFIELD: 'USD' }];

//     Type: any = '';
//     TransportMode: any = null;

//     NetRate: any = '';
//     CityCode: any = '';

//     dataMode: string = '';

//     Wgt: any = '';
//     UserWgt: any = '';
//     GrossWeight: any = '';
//     UserGrossWeight: any = '';
//     FreightRate: any = 'PP';
//     PrepaidPercent: any = null;
//     CollectPer: any = '';
//     Procument: any = '';

//     FreightChargeble: any = '';
//     FrtSell: any = 'FREIGHT(ALL INCLUSIVE)';
//     RateAgreedby: any = '';
//     RateAgreedOn: any = '';
//     TxtExchRate: any = '';
//     DrpExchRate: any = null;
//     InrRate: any = '';

//     RateFreightPayOn: any = 'CW';
//     RateFreight: any = '';
//     Ppchrg_Selling: any = '';
//     PPchrg_SellingCur: any = 'INR';
//     Ppchrg_SellingInr: any = '';
//     Ccchrg_Selling: any = '';
//     Ccchrg_SellingCur: any = 'INR';
//     Ccchrg_SellingInr: any = '';

//     RateFscPayOn: any = null;
//     RateFsc: any = '';
//     PpFsc_Selling: any = '';
//     PpFsc_SellingCur: any = 'INR';
//     PpFsc_SellingInr: any = '';
//     CcFsc_Selling: any = '';
//     CcFsc_SellingCur: any = 'INR';
//     CcFsc_SellingInr: any = '';

//     RateIrcPayOn: any = null;
//     RateIrc: any = '';
//     PpIrc_Selling: any = '';
//     PpIrc_SellingCur: any = 'INR';
//     PpIrc_SellingInr: any = '';
//     CcIrc_Selling: any = '';
//     CcIrc_SellingCur: any = 'INR';
//     CcIrc_SellingInr: any = '';

//     RateXrayPayOn: any = null;
//     RateXray: any = '';
//     PpXray_Selling: any = '';
//     PpXray_SellingCur: any = 'INR';
//     PpXray_SellingInr: any = '';
//     CcXray_Selling: any = '';
//     CcXray_SellingCur: any = 'INR';
//     CcXray_SellingInr: any = '';

//     McPayOn: any = 'CW';
//     McRate: any = '';
//     McRatePP: any = '';
//     McCurPP: any = 'INR';
//     McRatePPInr: any = '';
//     McRateCC: any = '';
//     McCur: any = 'INR';
//     McCCInr: any = '';

//     fobPayOn: any = 'CW';
//     fobRate: any = '';
//     fobRatePP: any = '';
//     fobCurPP: any = 'INR';
//     fobRatePPInr: any = '';
//     fobRateCC: any = '';
//     fobCur: any = 'INR';
//     fobCCInr: any = '';


//     CtgPayOn: any = 'GW';
//     CtgRate: any = '';
//     CtgRatePP: any = '';
//     CtgCurPP: any = 'INR';
//     CtgRatePPInr: any = '';
//     CtgRateCC: any = '';
//     CtgCur: any = 'INR';
//     CtgCCInr: any = '';

//     ThcPayOn: any = 'CW';
//     ThcRate: any = '';
//     ThcRatePP: any = '';
//     ThcCurPP: any = 'INR';
//     ThcRatePPInr: any = '';
//     ThcRateCC: any = '';
//     ThcCur: any = 'INR';
//     ThcCCInr: any = '';

//     DdcPayOn: any = 'CW';
//     DdcRate: any = '';
//     DdcRatePP: any = '';
//     DdcCurPP: any = 'INR';
//     DdcRatePPInr: any = '';
//     DdcRateCC: any = '';
//     DdcCur: any = 'INR';
//     DdcCCInr: any = '';

//     DcRatePP: any = '';
//     DcCurPP: any = 'INR';
//     DcRatePPInr: any = '';
//     DcRateCC: any = '';
//     DcCur: any = 'INR';
//     DcCCInr: any = '';

//     ScrRatePP: any = '';
//     ScrCurPP: any = 'INR';
//     ScrRatePPInr: any = '';
//     ScrRateCC: any = '';
//     ScrCur: any = 'INR';
//     ScrCCInr: any = '';

//     MycRatePP: any = '';
//     MycCurPP: any = 'INR';
//     MycRatePPInr: any = '';
//     MycRateCC: any = '';
//     MycCur: any = 'INR';
//     MycCCInr: any = '';

//     Pptotcarr_Selling: any = '';
//     Cctotcarr_SellingInr: any = '';

//     HawbRatePP: any = '';
//     HawbCurPP: any = 'INR';
//     HawbRatePPInr: any = '';
//     HawbRateCC: any = '';
//     HawbCur: any = 'INR';
//     HawbCCInr: any = '';

//     PcaRatePP: any = '';
//     PcaCurPP: any = 'INR';
//     PcaRatePPInr: any = '';
//     PcaRateCC: any = '';
//     PcaCur: any = 'INR';
//     PcaCCInr: any = '';

//     Pptotagt_Selling: any = '';
//     Cctotagt_SellingInr: any = '';

//     Pptot_Selling: any = '';
//     Cctot_Selling: any = '';

//     OtherRatePP: any = '';
//     OtherRateCurPP: any = 'INR';
//     OtherRatePPInr: any = '';
//     OtherRateCC: any = '';
//     OtherRateCur: any = 'INR';
//     OtherRateInr: any = '';

//     Remark: any = '';

//     CurrencyPopulated: any = '';

//     ISNUMERIC_CHRGWT: any = '';
//     ISNUMERIC_GRWT: any = '';
//     ISAUTO_FRT_INV: any = '';

//     ErrorMessage: any = null;
//     //AIRLINE CHARGES
//     dtAirLineCharges: Array<any> = [];
//     AirLineCharges: any = [];
//     AllAirLineChargeslist: any = [];
//     ChrgTypelist: any = [];
//     ChrgTypelistold: Array<any> = [];
//     CHARGETYPE: string;
//     DELCHARGETYPE: string;
//     CHARGENAME: string;
//     EDIT_RATE_TAR: any = null;
//     DEL_RATE_TAR: any = null;
//     RATE_TAR: any = null;
//     EDIT_RATE_TAR_FRT: string;
//     RATE_TAR_FRT: string = "";
//     DEL_RATE_TAR_FRT: string;
//     EDIT_CHARGETYPE: string;
//     RATE_NET: any = null;
//     EDIT_RATE_NET: any = null;
//     DEL_RATE_NET: any = null;
//     RATE_NET_FRT: string;
//     DEL_RATE_NET_FRT: string;
//     EDIT_RATE_NET_FRT: string;
//     childID: string = "0";
//     Chargeslist: any = [];
//     makerid: string;
//     guid: string = "";
//     txtchild: string = "Add"
//     CHRGDETAILSID: string = "0";
//     FK_ID: string = "0";
//     PK_ID: string = "0";
//     tot_rate_tar_pp_da: any = null;
//     tot_rate_tar_pp_dc: any = null;
//     tot_rate_tar_cc_da: any = null;
//     tot_rate_tar_cc_dc: any = null;
//     tot_rate_net_pp_da: any = null;
//     tot_rate_net_pp_dc: any = null;
//     tot_rate_net_cc_da: any = null;
//     tot_rate_net_cc_dc: any = null;

//     constructor(private _dataService: DataService,
//         private _loginService: LoginService,
//         private _toasterService: ToastCommonService,
//         private _sharedconsig: SharedDataSerice,
//         private _loaderService: LoaderService) {
//         this.exptno = this.exptno;
//     }


//     changefunHawb() {
//         var verifyData = null;

//         this._loginService.verifyRights(236, '')
//             .subscribe((data: any) => {
//                 this._loaderService.display(false);
//                 this._loginService.checkVerify('Modify', data);  //For verify user access
//                 verifyData = data.Table;
//                 this.ResetHAWBCharges();
//                 this.setDropDownData();
//                 this.setData(this._sharedconsig.exportEditData.HAWBNO, this._loginService.getLogin()[0].CMP_USERENCCODE, this._sharedconsig.exportEditData.EXPTNO);
//             });
//     }

//     checkType(num: number) {
//         this.Type = num;
//     }

//     setDropDownData() {
//         this._loaderService.display(true);
//         this._dataService.getData("Export/ConsignmentHAWBFill_DROPDOWN", null)
//             .subscribe((data: any) => {
//                 this._loaderService.display(false);
//                 this.rateList = data.Table;
//                 this.AllAirLineChargeslist = data.Table1
//                 this.ChrgTypelist = data.Table2;
//             },
//                 (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
//                 () => { });
//     }

//     setData(hawbno, code, exptno) {
//         const _jsonData = {
//             Type1: this._loginService.getLogin()[0].CMP_USERENCCODE,
//             Type2: hawbno,
//             Type3: exptno,
//             GUID: this._loginService.getLogin()[0].GUID
//         };
//         this._loaderService.display(true);
//         this._dataService.getData("Export/Consignment_HAWB_PP_CC_View", _jsonData)
//             .subscribe((data: any) => {

//                 this.CityCode = data.Table[0].CITYCODE;

//                 if (data.Table1[0].IS_AGREED_RATED == "A") {
//                     this.Type = 1;
//                 } else if (data.Table1[0].IS_AGREED_RATED == "R") {
//                     this.Type = 2;
//                 }
//                 this.Wgt = data.Table1[0].CHRGWT;
//                 this.GrossWeight = data.Table1[0].GROSSWT;
//                 this.UserWgt = data.Table1[0].CHARGEBLE_WT;
//                 this.UserGrossWeight = data.Table1[0].GROSS_WT;
//                 this.FreightRate = data.Table1[0].FREIGHT_RATE_PER_KG;
//                 this.PrepaidPercent = data.Table1[0].PREPAID_PER;
//                 this.CollectPer = data.Table1[0].COLLECT_PER;
//                 if (data.Table1[0].FREIGHT_CHARGABLE_AS == "AI") {
//                     this.FreightChargeble = 1;
//                 } else if (data.Table1[0].FREIGHT_CHARGABLE_AS == "FS") {
//                     this.FreightChargeble = 2;
//                 }
//                 this.RateAgreedby = data.Table1[0].RATE_AGREED_BY;
//                 this.RateAgreedOn = (data.Table1[0].RATE_AGREED_ON != "") ? this._dataService.stringdttoArry(data.Table1[0].RATE_AGREED_ON) : null;
//                 this.TxtExchRate = data.Table1[0].EXCH_RATE;
//                 if (data.Table1[0].EXCH_CUR != "") {
//                     this.DrpExchRate = data.Table1[0].EXCH_CUR;
//                     this.changeCurrencyList(data.Table1[0].EXCH_CUR);
//                 }
//                 this.InrRate = data.Table1[0].INR_RATE;
//                 if (data.Table1[0].EXCH_CUR == "") {
//                     this.CurrencyPopulated = "N";
//                 }
//                 this.RateFreight = data.Table1[0].FREIGHT_RATE_BASIC;
//                 this.Ppchrg_Selling = data.Table1[0].PPCHRG_SELLING;
//                 this.PPchrg_SellingCur = (data.Table1[0].PPCHRG_SELLING_CUR == "") ? "INR" : data.Table1[0].PPCHRG_SELLING_CUR;
//                 this.Ppchrg_SellingInr = data.Table1[0].PPCHRG_SELLING_INR;
//                 this.Ccchrg_Selling = data.Table1[0].CCCHRG_SELLING;
//                 this.Ccchrg_SellingCur = data.Table1[0].CCCHRG_SELLING_CUR;
//                 this.Ccchrg_SellingInr = data.Table1[0].CCCHRG_SELLING_INR;
//                 this.RateFreightPayOn = (data.Table1[0].FREIGHT_RATE_BASIC_PO == "") ? null : data.Table1[0].FREIGHT_RATE_BASIC_PO;
//                 this.RateFscPayOn = (data.Table1[0].FRT_RATE_SCHRG_FSC_PO == "") ? null : data.Table1[0].FRT_RATE_SCHRG_FSC_PO;
//                 this.RateIrcPayOn = (data.Table1[0].FRT_RATE_SCHRG_IRC_PO == "") ? null : data.Table1[0].FRT_RATE_SCHRG_IRC_PO;
//                 this.RateXrayPayOn = (data.Table1[0].FRT_RATE_SCHRG_XRAY_PO == "") ? null : data.Table1[0].FRT_RATE_SCHRG_XRAY_PO;

//                 this.RateFsc = data.Table1[0].FRT_RATE_SCHRG_FSC;
//                 this.PpFsc_Selling = data.Table1[0].PP_SCHRG_FSC_SELL;
//                 this.PpFsc_SellingInr = data.Table1[0].PP_SCHRG_FSC_SELL_INR;
//                 this.PpFsc_SellingCur = (data.Table1[0].PP_SCHRG_FSC_SELL_CUR == "") ? "INR" : data.Table1[0].PP_SCHRG_FSC_SELL_CUR;
//                 this.CcFsc_Selling = data.Table1[0].CC_SCHRG_FSC_SELL;
//                 this.CcFsc_SellingInr = data.Table1[0].CC_SCHRG_FSC_SELL_INR;
//                 this.CcFsc_SellingCur = (data.Table1[0].CC_SCHRG_FSC_SELL_CUR == "") ? "INR" : data.Table1[0].CC_SCHRG_FSC_SELL_CUR;
//                 this.RateIrc = data.Table1[0].FRT_RATE_SCHRG_IRC;
//                 this.PpIrc_Selling = data.Table1[0].PP_SCHRG_IRC_SELL;
//                 this.PpIrc_SellingInr = data.Table1[0].PP_SCHRG_IRC_SELL_INR;
//                 this.PpIrc_SellingCur = (data.Table1[0].PP_SCHRG_IRC_SELL_CUR == "") ? "INR" : data.Table1[0].PP_SCHRG_IRC_SELL_CUR;
//                 this.CcIrc_Selling = data.Table1[0].CC_SCHRG_IRC_SELL;
//                 this.CcIrc_SellingInr = data.Table1[0].CC_SCHRG_IRC_SELL_INR;
//                 this.CcIrc_SellingCur = (data.Table1[0].CC_SCHRG_IRC_SELL_CUR == "") ? "INR" : data.Table1[0].CC_SCHRG_IRC_SELL_CUR;


//                 this.RateXray = data.Table1[0].FRT_RATE_SCHRG_XRAY;
//                 this.PpXray_Selling = data.Table1[0].PP_SCHRG_XRAY_SELL;
//                 this.PpXray_SellingInr = data.Table1[0].PP_SCHRG_XRAY_SELL_INR;
//                 this.PpXray_SellingCur = (data.Table1[0].PP_SCHRG_XRAY_SELL_CUR == "") ? "INR" : data.Table1[0].PP_SCHRG_XRAY_SELL_CUR;
//                 this.CcXray_Selling = data.Table1[0].CC_SCHRG_XRAY_SELL;
//                 this.CcXray_SellingInr = data.Table1[0].CC_SCHRG_XRAY_SELL_INR;
//                 this.CcXray_SellingCur = (data.Table1[0].CC_SCHRG_XRAY_SELL_CUR == "") ? "INR" : data.Table1[0].CC_SCHRG_XRAY_SELL_CUR;

//                 this.McRate = data.Table1[0].FRT_RATE_MC;
//                 this.McRatePP = data.Table1[0].PP_MC_SELL;
//                 this.McRatePPInr = data.Table1[0].PP_MC_SELL_INR;
//                 this.McCurPP = (data.Table1[0].PP_MC_SELL_CUR == "") ? "INR" : data.Table1[0].PP_MC_SELL_CUR;
//                 this.McRateCC = data.Table1[0].CC_MC_SELL;
//                 this.McCCInr = data.Table1[0].CC_MC_SELL_INR;
//                 this.McCur = (data.Table1[0].CC_MC_SELL_CUR == "") ? "INR" : data.Table1[0].CC_MC_SELL_CUR;

//                 this.ThcRate = data.Table1[0].FRT_RATE_THC;
//                 this.ThcRatePP = data.Table1[0].PP_THC_SELL;
//                 this.ThcRatePPInr = data.Table1[0].PP_THC_SELL_INR;
//                 this.ThcCurPP = (data.Table1[0].PP_THC_SELL_CUR == "") ? "INR" : data.Table1[0].PP_THC_SELL_CUR;
//                 this.ThcRateCC = data.Table1[0].CC_THC_SELL;
//                 this.ThcCCInr = data.Table1[0].CC_THC_SELL_INR;
//                 this.ThcCur = (data.Table1[0].CC_THC_SELL_CUR == "") ? "INR" : data.Table1[0].CC_THC_SELL_CUR;

//                 this.CtgRate = data.Table1[0].FRT_RATE_CTG;
//                 this.CtgRatePP = data.Table1[0].PP_CTG_SELL;
//                 this.CtgRatePPInr = data.Table1[0].PP_CTG_SELL_INR;
//                 this.CtgCurPP = (data.Table1[0].PP_CTG_SELL_CUR == "") ? "INR" : data.Table1[0].PP_CTG_SELL_CUR;
//                 this.CtgRateCC = data.Table1[0].CC_CTG_SELL;
//                 this.CtgCCInr = data.Table1[0].CC_CTG_SELL_INR;
//                 this.CtgCur = (data.Table1[0].CC_CTG_SELL_CUR == "") ? "INR" : data.Table1[0].CC_CTG_SELL_CUR;

//                 this.DdcRate = data.Table1[0].FRT_RATE_DDC;
//                 this.DdcRatePP = data.Table1[0].PP_DDC_SELL;
//                 this.DdcRatePPInr = data.Table1[0].PP_DDC_SELL_INR;
//                 this.DdcCurPP = (data.Table1[0].PP_DDC_SELL_CUR == "") ? "INR" : data.Table1[0].PP_DDC_SELL_CUR;
//                 this.DdcRateCC = data.Table1[0].CC_DDC_SELL;
//                 this.DdcCCInr = data.Table1[0].CC_DDC_SELL_INR;
//                 this.DdcCur = (data.Table1[0].CC_DDC_SELL_CUR == "") ? "INR" : data.Table1[0].CC_DDC_SELL_CUR;

//                 this.DcRatePP = data.Table1[0].PP_DC_SELL;
//                 this.DcRatePPInr = data.Table1[0].PP_DC_SELL_INR;
//                 this.DcCurPP = (data.Table1[0].PP_DC_SELL_CUR == "") ? "INR" : data.Table1[0].PP_DC_SELL_CUR;
//                 this.DcRateCC = data.Table1[0].CC_DC_SELL;
//                 this.DcCCInr = data.Table1[0].CC_DC_SELL_INR;
//                 this.DcCur = (data.Table1[0].CC_DC_SELL_CUR == "") ? "INR" : data.Table1[0].CC_DC_SELL_CUR;

//                 this.ScrRatePP = data.Table1[0].PP_SCR_SELL;
//                 this.ScrRatePPInr = data.Table1[0].PP_SCR_SELL_INR;
//                 this.ScrCurPP = (data.Table1[0].PP_SCR_SELL_CUR == "") ? "INR" : data.Table1[0].PP_SCR_SELL_CUR;
//                 this.ScrRateCC = data.Table1[0].CC_SCR_SELL;
//                 this.ScrCCInr = data.Table1[0].CC_SCR_SELL_INR;
//                 this.ScrCur = (data.Table1[0].CC_SCR_SELL_CUR == "") ? "INR" : data.Table1[0].CC_SCR_SELL_CUR;

//                 this.MycRatePP = data.Table1[0].PP_MYC_SELL;
//                 this.MycRatePPInr = data.Table1[0].PP_MYC_SELL_INR;
//                 this.MycCurPP = (data.Table1[0].PP_MYC_SELL_CUR == "") ? "INR" : data.Table1[0].PP_MYC_SELL_CUR;
//                 this.MycRateCC = data.Table1[0].CC_MYC_SELL;
//                 this.MycCCInr = data.Table1[0].CC_MYC_SELL_INR;
//                 this.MycCur = (data.Table1[0].CC_MYC_SELL_CUR == "") ? "INR" : data.Table1[0].CC_MYC_SELL_CUR;

//                 this.Pptotcarr_Selling = data.Table1[0].PPTOTCARR_SELLING;
//                 this.Cctotcarr_SellingInr = data.Table1[0].CCTOTCARR_SELLING_INR;

//                 this.HawbRatePP = data.Table1[0].PP_HAWB_SELL;
//                 this.HawbRatePPInr = data.Table1[0].PP_HAWB_SELL_INR;
//                 this.HawbCurPP = (data.Table1[0].PP_HAWB_SELL_CUR == "") ? "INR" : data.Table1[0].PP_HAWB_SELL_CUR;
//                 this.HawbRateCC = data.Table1[0].CC_HAWB_SELL;
//                 this.HawbCCInr = data.Table1[0].CC_HAWB_SELL_INR;
//                 this.HawbCur = (data.Table1[0].CC_HAWB_SELL_CUR == "") ? "INR" : data.Table1[0].CC_HAWB_SELL_CUR;

//                 this.PcaRatePP = data.Table1[0].PP_PCA_SELL;
//                 this.PcaRatePPInr = data.Table1[0].PP_PCA_SELL_INR;
//                 this.PcaCurPP = (data.Table1[0].PP_PCA_SELL_CUR == "") ? "INR" : data.Table1[0].PP_PCA_SELL_CUR;
//                 this.PcaRateCC = data.Table1[0].CC_PCA_SELL;
//                 this.PcaCCInr = data.Table1[0].CC_PCA_SELL_INR;
//                 this.PcaCur = (data.Table1[0].CC_PCA_SELL_CUR == "") ? "INR" : data.Table1[0].CC_PCA_SELL_CUR;

//                 this.Pptotagt_Selling = data.Table1[0].PPTOTAGT_SELLING;
//                 this.Cctotagt_SellingInr = data.Table1[0].CCTOTAGT_SELLING_INR;
//                 this.Pptot_Selling = data.Table1[0].PPTOT_SELLING;
//                 this.Cctot_Selling = data.Table1[0].CCTOT_SELLING;

//                 this.OtherRatePP = data.Table1[0].PP_OTHER_SELL;
//                 this.OtherRatePPInr = data.Table1[0].PP_OTHER_SELL_INR;
//                 this.OtherRateCurPP = (data.Table1[0].PP_OTHER_SELL_CUR == "") ? "INR" : data.Table1[0].PP_OTHER_SELL_CUR;
//                 this.OtherRateCC = data.Table1[0].CC_OTHER_SELL;
//                 this.OtherRateInr = data.Table1[0].CC_OTHER_SELL_INR;
//                 this.OtherRateCur = (data.Table1[0].CC_OTHER_SELL_CUR == "") ? "INR" : data.Table1[0].CC_OTHER_SELL_CUR;

//                 this.TransportMode = (data.Table1[0].TRANS_MODE != "") ? data.Table1[0].TRANS_MODE : null;

//                 this.Remark = data.Table1[0].REMARK;
//                 this.Procument = data.Table1[0].BUSI_PROCUR_EXPENCES;

//                 this.ISNUMERIC_CHRGWT = data.Table1[0].ISNUMERIC_CHRGWT;
//                 this.ISNUMERIC_GRWT = data.Table1[0].ISNUMERIC_GRWT;
//                 this.ISAUTO_FRT_INV = data.Table1[0].FRTINV_FLG;

//                 this.fobRate = data.Table1[0].FRT_RATE_FOB;
//                 this.fobRatePP = data.Table1[0].PP_FOB_SELL;
//                 this.fobRatePPInr = data.Table1[0].PP_FOB_SELL_INR;
//                 this.fobCurPP = (data.Table1[0].PP_FOB_SELL_CUR == "") ? "INR" : data.Table1[0].PP_FOB_SELL_CUR;
//                 this.fobRateCC = data.Table1[0].CC_FOB_SELL;
//                 this.fobCCInr = data.Table1[0].CC_FOB_SELL_INR;
//                 this.fobCur = (data.Table1[0].CC_FOB_SELL_CUR == "") ? "INR" : data.Table1[0].CC_FOB_SELL_CUR;
//                 ///ADDED BY NALINI FOR AIRLINECHARGES
//                 this.Chargeslist = data.Table2
//                 this.tot_rate_tar_pp_da = data.Table3[0].RATE_TAR_TOTAL_PP_DA;
//                 this.tot_rate_net_pp_da = data.Table3[0].RATE_NET_TOTAL_PP_DA;
//                 this.tot_rate_tar_cc_da = data.Table4[0].RATE_TAR_TOTAL_CC_DA;
//                 this.tot_rate_net_cc_da = data.Table4[0].RATE_NET_TOTAL_CC_DA;
//                 this.tot_rate_tar_pp_dc = data.Table5[0].RATE_TAR_TOTAL_PP_DC;
//                 this.tot_rate_net_pp_dc = data.Table5[0].RATE_NET_TOTAL_PP_DC;
//                 this.tot_rate_tar_cc_dc = data.Table6[0].RATE_TAR_TOTAL_CC_DC;
//                 this.tot_rate_net_cc_dc = data.Table6[0].RATE_NET_TOTAL_CC_DC;


//                 if ((this.UserWgt == "0" || this.UserWgt == "0.00") && (this.UserGrossWeight == "0" || this.UserGrossWeight == "0.00")) {
//                     if (this.ISNUMERIC_CHRGWT == 0 && this.ISNUMERIC_GRWT == 0) {
//                         this.UserWgt = "0";
//                         this.UserGrossWeight = "0";
//                         this.ErrorMessage = "Invalid gross weigt and chargeble weight!";
//                     } else if (this.ISNUMERIC_CHRGWT == 0 && this.ISNUMERIC_GRWT == 1) {
//                         this.UserWgt = "0";
//                         this.UserGrossWeight = this.GrossWeight;
//                         this.ErrorMessage = "Invalid chargeble weight !";
//                     } else if (this.ISNUMERIC_CHRGWT == 1 && this.ISNUMERIC_GRWT == "0") {
//                         this.Wgt = "0";
//                         this.UserWgt = this.Wgt;
//                         this.UserGrossWeight = "0";
//                         this.ErrorMessage = "Invalid Gross weight !";
//                     } else if (this.ISNUMERIC_CHRGWT == 1 && this.ISNUMERIC_GRWT == 1) {
//                         this.UserWgt = this.Wgt;
//                         this.UserGrossWeight = this.GrossWeight;
//                     }

//                 }
//                 if (this.ISAUTO_FRT_INV == "1") {
//                     alert("HAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This HAWB !!");
//                     this._toasterService.toast('warning', 'warning', "HAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This HAWB !!");
//                 }
//                 this._loaderService.display(false);
//             },
//                 (error) => {
//                     this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
//                     this._loaderService.display(false);
//                 },
//                 () => { });
//     }

//     changeCurrencyList(val: string) {
//         if (val != "" && val != "EURO") {
//             this.currencyList = [{ VALUEFIELD: 'INR', TEXTFIELD: 'INR' }, { VALUEFIELD: val, TEXTFIELD: val }];
//             this.PPchrg_SellingCur = val;
//             this.Ccchrg_SellingCur = val;
//             this.PpFsc_SellingCur = val;
//             this.CcFsc_SellingCur = val;
//             this.PpIrc_SellingCur = val;
//             this.CcIrc_SellingCur = val;
//             this.PpXray_SellingCur = val;
//             this.CcXray_SellingCur = val;
//             this.McCurPP = val;
//             this.McCur = val;
//             this.fobCurPP = val;
//             this.fobCur = val;
//             this.CtgCurPP = val;
//             this.CtgCur = val;
//             this.DcCurPP = val;
//             this.DcCur = val;
//             this.ScrCurPP = val;
//             this.ScrCur = val;
//             this.MycCurPP = val;
//             this.MycCur = val;
//             this.HawbCurPP = val;
//             this.HawbCur = val;
//             this.PcaCurPP = val;
//             this.PcaCur = val;
//             this.OtherRateCurPP = val;
//             this.OtherRateCur = val;
//         }
//     }

//     changeFreight(fType: string) {   //fn_ChangeFreightRatePerKG  original function
//         this.PrepaidPercent = null;
//         this.CollectPer = "";
//         this.clearCharges();
//         this.fn_ChangeFreight_CC_PP_PC();
//     }

//     changePrepaidPercentage(ppType: number) {   //fn_ChangePrepaidPercentage  original function
//         if (this.PrepaidPercent != null) {
//             var Prepaid, Collect;
//             Prepaid = Math.abs(ppType);
//             Collect = 100 - Math.abs(Prepaid);
//             this.CollectPer = Collect;
//         }
//         else {
//             this.CollectPer = '';
//         }
//         this.clearCharges();
//     }

//     changeFreightChargebleAs(fcType: number) {   //fn_ChangeFreight_Chargeble_As  original function
//         this.FreightChargeble = fcType;
//         this.FrtSell = (fcType == 1) ? "FREIGHT (ALL INCLUSIVE)" : "FREIGHT (BASIC)";
//         if (fcType == 1) {
//             this.RateFsc = "";
//             this.PpFsc_Selling = "";
//             this.CcFsc_Selling = "";
//             this.PpFsc_SellingCur = "INR";
//             this.CcFsc_SellingCur = "INR";
//             this.RateFscPayOn = null;
//             this.RateIrc = "";
//             this.PpIrc_Selling = "";
//             this.PpIrc_SellingCur = "INR";
//             this.CcIrc_Selling = "";
//             this.CcIrc_SellingCur = "INR";
//             this.RateIrcPayOn = null;
//             this.RateXray = "";
//             this.PpXray_Selling = "";
//             this.PpXray_SellingCur = "INR";
//             this.CcXray_Selling = "";
//             this.CcXray_SellingCur = "INR";
//             this.RateXrayPayOn = null;
//         }
//         this.fn_ChangeFreight_CC_PP_PC();
//     }

//     checkExchangeRateDrp(CtrlName) {  //fnChkExchangeRateDrp  original function

//     }

//     checkExchRateCurDrp(erType: string) {    //fnCheck_ExchRate_CurDrp  original function
//         let ExchCur = erType;
//         let NEW_VALUE = (ExchCur != null) ? ExchCur : "";

//         this.changeCurrencyList(NEW_VALUE);
//         this.fnCalCC_HAWBFreight();
//         this.fnCalPP_HAWBFreight();
//     }

//     clearCharges() {     //fn_ClearCharges original function
//         this.RateFreight = '';
//         this.Ccchrg_Selling = "";
//         this.Ccchrg_SellingCur = "INR";
//         this.Ppchrg_Selling = "";

//         this.RateFsc = "";
//         this.PpFsc_Selling = "";
//         this.CcFsc_Selling = "";
//         this.CcFsc_SellingCur = "INR";
//         this.RateFscPayOn = "0";

//         this.RateIrc = "";
//         this.PpIrc_Selling = "";
//         this.CcIrc_Selling = "";
//         this.CcIrc_SellingCur = "INR";
//         this.RateIrcPayOn = "0";

//         this.RateXray = "";
//         this.PpXray_Selling = "";
//         this.CcXray_Selling = "";
//         this.CcXray_SellingCur = "INR";
//         this.RateXrayPayOn = "0";

//         this.McCur = "INR";
//         this.McRatePP = "";
//         this.McRateCC = "";
//         this.McCCInr = "";

//         this.ThcCur = "INR";
//         this.ThcRatePP = "";
//         this.ThcRateCC = "";
//         this.ThcCCInr = "";

//         this.CtgCur = "INR";
//         this.CtgRatePP = "";
//         this.CtgRateCC = "";
//         this.CtgCCInr = "";

//         this.DdcCur = "INR";
//         this.DdcRatePP = "";
//         this.DdcRateCC = "";
//         this.DdcCCInr = "";

//         this.fnCalPP_HAWBFreight();
//         this.fnCalCC_HAWBFreight();
//     }

//     fn_ChangeFreight_CC_PP_PC() {
//         if (this.FreightRate == "PP") {
//             this.Ccchrg_SellingCur = "INR";
//             this.CcFsc_SellingCur = "INR";
//             this.CcIrc_SellingCur = "INR";
//             this.CcXray_SellingCur = "INR";
//             this.McCur = "INR";

//             this.ThcCur = "INR";
//             this.DdcCur = "INR";

//             this.CtgCur = "INR";
//             this.DcCur = "INR";
//             this.ScrCur = "INR";
//             this.MycCur = "INR";
//             this.HawbCur = "INR";
//             this.PcaCur = "INR";
//             this.OtherRateCur = "INR";

//             this.HawbRateCC = "";
//             this.PcaRateCC = "";
//             this.DcRateCC = "";
//             this.ScrRateCC = "";
//             this.MycRateCC = "";
//             this.OtherRateCC = "";

//             this.HawbCCInr = "";
//             this.PcaCCInr = "";
//             this.OtherRateInr = "";
//             this.DcCCInr = "";
//             this.ScrCCInr = "";
//             this.MycCCInr = "";
//         }
//         else if (this.FreightRate == "CC") {
//             this.PPchrg_SellingCur = "INR";
//             this.PpFsc_SellingCur = "INR";
//             this.PpIrc_SellingCur = "INR";
//             this.PpXray_SellingCur = "INR";
//             this.McCurPP = "INR";
//             this.fobCurPP = "INR";

//             this.ThcCurPP = "INR";
//             this.DdcCurPP = "INR";

//             this.CtgCurPP = "INR";
//             this.DcCurPP = "INR";
//             this.ScrCurPP = "INR";
//             this.MycCurPP = "INR";
//             this.HawbCurPP = "INR";
//             this.PcaCurPP = "INR";
//             this.OtherRateCurPP = "INR";

//             this.HawbRatePP = '';
//             this.PcaRatePP = '';
//             this.ScrRatePP = '';
//             this.MycRatePP = '';
//             this.OtherRatePP = '';
//             this.OtherRatePP = '';

//         }
//         this.fnCalPP_HAWBFreight();
//         this.fnCalCC_HAWBFreight();
//     }

//     fnCalPP_HAWBFreight() {

//         var PPCHRG, PPTOTAGT, PPTOTCARR, PPTOT;
//         var PP_SCHRG_FSC, PP_SCHRG_IRC, PP_SCHRG_XRAY, PP_MC, PP_CTG, PP_THC, PP_DDC, PP_FOB;
//         var PP_DC, PP_SCR, PP_MYC;
//         var PP_HAWB, PP_PCA, PP_OTHER;
//         var airchrgppda, airchrgppdc, airchrgccda, airchrgccdc
//         PPCHRG = 0;
//         PPTOTAGT = 0;
//         PPTOTCARR = 0;
//         airchrgppda = this.tot_rate_tar_pp_da;
//         airchrgppdc = this.tot_rate_tar_pp_dc;
//         airchrgccda = this.tot_rate_tar_cc_da;
//         airchrgccdc = this.tot_rate_tar_cc_dc;
//         var InrRate = Math.abs(this.InrRate);
//         var UsdRate = Math.abs(this.TxtExchRate);
//         var ExchRate = InrRate / UsdRate;
//         ExchRate = (InrRate == 0 || UsdRate == 0) ? 0 : InrRate / UsdRate;
//         PPCHRG = (this.PPchrg_SellingCur != "INR") ? Math.abs(this.Ppchrg_Selling) * ExchRate : Math.abs(this.Ppchrg_Selling);
//         PP_SCHRG_FSC = (this.PpFsc_SellingCur != "INR") ? Math.abs(this.PpFsc_Selling) * ExchRate : Math.abs(this.PpFsc_Selling);
//         PP_SCHRG_IRC = (this.PpIrc_SellingCur != "INR") ? Math.abs(this.PpIrc_Selling) * ExchRate : Math.abs(this.PpIrc_Selling);
//         PP_SCHRG_XRAY = (this.PpXray_SellingCur != "INR") ? Math.abs(this.PpXray_Selling) * ExchRate : Math.abs(this.PpXray_Selling);
//         PP_MC = (this.McCurPP != "INR") ? Math.abs(this.McRatePP) * ExchRate : Math.abs(this.McRatePP);
//         PP_DC = (this.DcCurPP != "INR") ? Math.abs(this.DcRatePP) * ExchRate : Math.abs(this.DcRatePP);
//         PP_SCR = (this.ScrCurPP != "INR") ? Math.abs(this.ScrRatePP) * ExchRate : Math.abs(this.ScrRatePP);
//         PP_MYC = (this.MycCurPP != "INR") ? Math.abs(this.MycRatePP) * ExchRate : Math.abs(this.MycRatePP);
//         //PP_CTG = (this.CityCode == "MUM") ? ((this.CtgCurPP != "INR") ? Math.abs(this.CtgRatePP) * ExchRate : Math.abs(this.CtgRatePP)) : 0;
//         PP_CTG = (this.CityCode == "MUM") ? ((this.CtgCurPP != "INR") ? Math.abs(this.CtgRatePP) * ExchRate : Math.abs(this.CtgRatePP)) : 0;
//         PP_THC = (this.CityCode == "DAC") ? ((this.ThcCurPP != "INR") ? Math.abs(this.ThcRatePP) * ExchRate : Math.abs(this.ThcRatePP)) : 0;
//         PP_DDC = (this.DdcCurPP != "INR") ? Math.abs(this.DdcRatePP) * ExchRate : Math.abs(this.DdcRatePP);
//         PP_HAWB = (this.HawbCurPP != "INR") ? Math.abs(this.HawbRatePP) * ExchRate : Math.abs(this.HawbRatePP);
//         PP_PCA = (this.PcaCurPP != "INR") ? Math.abs(this.PcaRatePP) * ExchRate : Math.abs(this.PcaRatePP);
//         PP_OTHER = (this.OtherRateCurPP != "INR") ? Math.abs(this.OtherRatePP) * ExchRate : Math.abs(this.OtherRatePP);
//         PP_FOB = (this.fobCurPP != "INR") ? Math.abs(this.fobRatePP) * ExchRate : Math.abs(this.fobRatePP);

//         PPCHRG = Math.abs(PPCHRG.toFixed(2))
//         PP_SCHRG_FSC = Math.abs(PP_SCHRG_FSC.toFixed(2))
//         PP_SCHRG_IRC = Math.abs(PP_SCHRG_IRC.toFixed(2))
//         PP_SCHRG_XRAY = Math.abs(PP_SCHRG_XRAY.toFixed(2))
//         PP_MC = Math.abs(PP_MC.toFixed(2))
//         PP_CTG = Math.abs(PP_CTG.toFixed(2))
//         PP_THC = Math.abs(PP_THC.toFixed(2));
//         PP_DDC = Math.abs(PP_DDC.toFixed(2));
//         PP_OTHER = Math.abs(PP_OTHER.toFixed(2))
//         PP_DC = Math.abs(PP_DC.toFixed(2))
//         PP_SCR = Math.abs(PP_SCR.toFixed(2))
//         PP_MYC = Math.abs(PP_MYC.toFixed(2))
//         PP_FOB = Math.abs(PP_FOB.toFixed(2))


//         PP_HAWB = Math.abs(PP_HAWB.toFixed(2))
//         PP_PCA = Math.abs(PP_PCA.toFixed(2))

//         this.OtherRatePPInr = PP_OTHER.toFixed(2);

//         var PPTOTCARR1 = Math.abs(PP_SCHRG_FSC) + Math.abs(PP_SCHRG_IRC) + Math.abs(PP_SCHRG_XRAY) + Math.abs(PP_MC) + Math.abs(PP_CTG) + Math.abs(PP_DC) + Math.abs(PP_SCR) + Math.abs(PP_MYC) + Math.abs(PP_THC) + Math.abs(PP_DDC) + Math.abs(PP_FOB);
//         PPTOTCARR = Math.abs(PPTOTCARR1).toFixed(2);

//         var PPTOTAGT1 = Math.abs(PP_HAWB) + Math.abs(PP_PCA)
//         PPTOTAGT = Math.abs(PPTOTAGT1).toFixed(2);

//         var PPTOT1 = Math.abs(PPCHRG) + Math.abs(PPTOTAGT) + Math.abs(PPTOTCARR) + Math.abs(airchrgppda) + Math.abs(airchrgccda);
//         PPTOT = Math.abs(PPTOT1).toFixed(2);

//         this.Ppchrg_SellingInr = PPCHRG;
//         this.PpFsc_SellingInr = PP_SCHRG_FSC;
//         this.PpIrc_SellingInr = PP_SCHRG_IRC;
//         this.PpXray_SellingInr = PP_SCHRG_XRAY;
//         this.McRatePPInr = PP_MC;

//         this.ThcRatePPInr = PP_THC;
//         this.DdcRatePPInr = PP_DDC;

//         this.CtgRatePPInr = PP_CTG;
//         this.HawbRatePPInr = PP_HAWB;
//         this.PcaRatePPInr = PP_PCA;
//         this.DcRatePPInr = PP_DC;
//         this.ScrRatePPInr = PP_SCR;
//         this.MycRatePPInr = PP_MYC;

//         this.Pptotagt_Selling = Math.abs(PPTOTAGT) + Math.abs(airchrgppda);
//         this.Pptotcarr_Selling = Math.abs(PPTOTCARR) + Math.abs(airchrgppdc);
//         this.Pptot_Selling = Math.abs(PPTOT);
//     }

//     fnCalCC_HAWBFreight() {

//         var CCCHRG, CCTOTAGT, CCTOTCARR, CCTOT;
//         var CC_SCHRG_FSC, CC_SCHRG_IRC, CC_SCHRG_XRAY, CC_MC, CC_CTG, CC_THC, CC_DDC, CC_FOB;
//         var CC_DC, CC_SCR, CC_MYC;
//         var CC_HAWB, CC_PCA, CC_OTHER, airchrgppdc, airchrgccdc;

//         CCCHRG = 0;
//         CCTOTAGT = 0;
//         CCTOTCARR = 0;

//         airchrgppdc = this.tot_rate_tar_pp_dc;
//         airchrgccdc = this.tot_rate_tar_cc_dc;


//         var InrRate = Math.abs(this.InrRate)
//         var UsdRate = Math.abs(this.TxtExchRate)
//         var ExchRate = (InrRate == 0 || UsdRate == 0) ? 0 : InrRate / UsdRate;
//         CCCHRG = (this.Ccchrg_SellingCur != "INR") ? Math.abs(this.Ccchrg_Selling) * ExchRate : Math.abs(this.Ccchrg_Selling);
//         CC_SCHRG_FSC = (this.CcFsc_SellingCur != "INR") ? Math.abs(this.CcFsc_Selling) * ExchRate : Math.abs(this.CcFsc_Selling);
//         CC_SCHRG_IRC = (this.CcIrc_SellingCur != "INR") ? Math.abs(this.CcIrc_Selling) * ExchRate : Math.abs(this.CcIrc_Selling);
//         CC_SCHRG_XRAY = (this.CcXray_SellingCur != "INR") ? Math.abs(this.CcXray_Selling) * ExchRate : Math.abs(this.CcXray_Selling);
//         CC_MC = (this.McCur != "INR") ? Math.abs(this.McRateCC) * ExchRate : Math.abs(this.McRateCC);
//         CC_DC = (this.DcCur != "INR") ? Math.abs(this.DcRateCC) * ExchRate : Math.abs(this.DcRateCC);
//         CC_SCR = (this.ScrCur != "INR") ? Math.abs(this.ScrRateCC) * ExchRate : Math.abs(this.ScrRateCC);
//         CC_MYC = (this.MycCur != "INR") ? Math.abs(this.MycRateCC) * ExchRate : Math.abs(this.MycRateCC);
//         CC_CTG = (this.CityCode == "MUM") ? ((this.CtgCur != "INR") ? Math.abs(this.CtgRateCC) * ExchRate : Math.abs(this.CtgRateCC)) : 0;
//         CC_THC = (this.CityCode == "DAC") ? ((this.ThcCur != "INR") ? Math.abs(this.ThcRateCC) * ExchRate : Math.abs(this.ThcRateCC)) : 0;
//         CC_DDC = (this.DdcCur != "INR") ? Math.abs(this.DdcRateCC) * ExchRate : Math.abs(this.DdcRateCC);
//         CC_HAWB = (this.HawbCur != "INR") ? Math.abs(this.HawbRateCC) * ExchRate : Math.abs(this.HawbRateCC);
//         CC_PCA = (this.PcaCur != "INR") ? Math.abs(this.PcaRateCC) * ExchRate : Math.abs(this.PcaRateCC);
//         CC_OTHER = (this.OtherRateCur != "INR") ? Math.abs(this.OtherRateCC) * ExchRate : Math.abs(this.OtherRateCC);
//         CC_FOB = (this.fobCur != "INR") ? Math.abs(this.fobRateCC) * ExchRate : Math.abs(this.fobRateCC);

//         CCCHRG = Math.abs(CCCHRG.toFixed(2))
//         CC_SCHRG_FSC = Math.abs(CC_SCHRG_FSC.toFixed(2))
//         CC_SCHRG_IRC = Math.abs(CC_SCHRG_IRC.toFixed(2))
//         CC_SCHRG_XRAY = Math.abs(CC_SCHRG_XRAY.toFixed(2))
//         CC_MC = Math.abs(CC_MC.toFixed(2))
//         CC_THC = Math.abs(CC_THC.toFixed(2))
//         CC_CTG = Math.abs(CC_CTG.toFixed(2))
//         CC_DDC = Math.abs(CC_DDC.toFixed(2))

//         CC_OTHER = Math.abs(CC_OTHER.toFixed(2))
//         CC_DC = Math.abs(CC_DC.toFixed(2))
//         CC_SCR = Math.abs(CC_SCR.toFixed(2))
//         CC_MYC = Math.abs(CC_MYC.toFixed(2))

//         CC_HAWB = Math.abs(CC_HAWB.toFixed(2))
//         CC_PCA = Math.abs(CC_PCA.toFixed(2))
//         CC_FOB = Math.abs(CC_FOB.toFixed(2))

//         this.OtherRateInr = CC_OTHER.toFixed(2);

//         var CCTOTCARR1 = Math.abs(CC_SCHRG_FSC) + Math.abs(CC_SCHRG_IRC) + Math.abs(CC_SCHRG_XRAY) + Math.abs(CC_MC) + Math.abs(CC_CTG) + Math.abs(CC_DC) + Math.abs(CC_SCR) + Math.abs(CC_MYC) + Math.abs(CC_THC) + Math.abs(CC_DDC) + Math.abs(CC_FOB);
//         CCTOTCARR = Math.abs(CCTOTCARR1).toFixed(2);

//         var CCTOTAGT1 = Math.abs(CC_HAWB) + Math.abs(CC_PCA)
//         CCTOTAGT = Math.abs(CCTOTAGT1).toFixed(2);

//         var CCTOT1 = Math.abs(CCCHRG) + Math.abs(CCTOTAGT) + Math.abs(CCTOTCARR) + Math.abs(this.tot_rate_tar_cc_da) + + Math.abs(this.tot_rate_tar_cc_dc);
//         CCTOT = Math.abs(CCTOT1).toFixed(2);

//         this.Ccchrg_SellingInr = CCCHRG;
//         this.CcFsc_SellingInr = CC_SCHRG_FSC;
//         this.CcIrc_SellingInr = CC_SCHRG_IRC;
//         this.CcXray_SellingInr = CC_SCHRG_XRAY;
//         this.McCCInr = CC_MC;
//         this.ThcCCInr = CC_THC;
//         this.DdcCCInr = CC_DDC;
//         this.CtgCCInr = CC_CTG;
//         this.HawbCCInr = CC_HAWB;
//         this.PcaCCInr = CC_PCA;
//         this.DcCCInr = CC_DC;
//         this.ScrCCInr = CC_SCR;
//         this.MycCCInr = CC_MYC;
//         this.fobCCInr = CC_FOB;

//         this.Cctotagt_SellingInr = Math.abs(CCTOTAGT);
//         this.Cctotcarr_SellingInr = Math.abs(CCTOTCARR);
//         this.Cctot_Selling = Math.abs(CCTOT);

//     }

//     fn_ChangePayableOn(ChargeType) {
//         if (ChargeType == 'FSC' || ChargeType == null) {
//             this.RateFsc = "";
//             this.PpFsc_Selling = "";
//             this.CcFsc_Selling = "";
//             this.CcFsc_SellingCur = "INR";
//         }
//         else if (ChargeType == 'IRC' || ChargeType == null) {
//             this.RateIrc = "";
//             this.PpIrc_Selling = "";
//             this.CcIrc_Selling = "";
//             this.CcIrc_SellingCur = "INR";
//         }
//         else if (ChargeType == 'XRAY' || ChargeType == null) {
//             this.RateXray = "";
//             this.PpXray_Selling = "";
//             this.CcXray_Selling = "";
//             this.CcXray_SellingCur = "INR";
//         }
//         this.fnCalPP_HAWBFreight();
//         this.fnCalCC_HAWBFreight();
//     }

//     fn_ChangeRate_Surcharge(ChargeType) {
//         if (ChargeType == 'FSC' || ChargeType == null) { this.fn_ChangeRate_Surcharge_Fsc(); }
//         else if (ChargeType == 'IRC' || ChargeType == null) { this.fn_ChangeRate_Surcharge_Irc(); }
//         else if (ChargeType == 'XRAY' || ChargeType == null) { this.fn_ChangeRate_Surcharge_Xray(); }
//         this.fnCalPP_HAWBFreight();
//         this.fnCalCC_HAWBFreight();
//     }

//     fn_ChangeRate_Surcharge_Fsc() {
//         let Rate = this.RateFsc;
//         if (Rate != "") {
//             let FreightWtType = this.FreightRate;
//             let PayableOn = this.RateFscPayOn;
//             let ChargebleWt = this.UserWgt;
//             let GrossWt = this.UserGrossWeight;
//             let Weight = 0;
//             if (PayableOn == "CW") {
//                 Weight = this.UserWgt;
//             }
//             else if (PayableOn == "GW") {
//                 Weight = this.UserGrossWeight;
//             }
//             else {
//                 alert("Please select Surcharge Payable on.");
//                 this.RateFsc = "";
//                 this.PpFsc_Selling = "";
//                 this.CcFsc_Selling = "";
//                 return false;
//             }

//             if (Math.abs(ChargebleWt) == 0) {
//                 alert("Please enter new Chargeable Weight.")
//                 this.clearCharges();
//                 return false;
//             }
//             else if (Math.abs(GrossWt) == 0) {
//                 alert("Please enter new Gross Weight.")
//                 this.clearCharges();
//                 return false;
//             }

//             if (FreightWtType == 'PP') {
//                 this.PpFsc_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
//                 this.CcFsc_Selling = "";
//             }
//             else if (FreightWtType == 'CC') {
//                 this.PpFsc_Selling = "";
//                 this.CcFsc_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
//             }
//             else if (FreightWtType == 'PC') {
//                 if (this.PrepaidPercent == null) {
//                     alert("Please select Prepaid percentage.");
//                     this.clearCharges();
//                     return false;
//                 }
//                 let Total = 0;
//                 Total = (Math.abs(Rate) * Math.abs(Weight))
//                 this.PpFsc_Selling = ((Total * this.PrepaidPercent) / 100).toFixed(2);
//                 this.CcFsc_Selling = ((Total * this.CollectPer) / 100).toFixed(2);
//             }
//         }
//         else {
//             this.PpFsc_Selling = "";
//             this.CcFsc_Selling = "";
//         }
//     }

//     fn_ChangeRate_Surcharge_Irc() {
//         let Rate = this.RateIrc;
//         if (Rate != "") {
//             let FreightWtType = this.FreightRate;
//             let PayableOn = this.RateIrcPayOn;
//             let ChargebleWt = this.UserWgt;
//             let GrossWt = this.UserGrossWeight;
//             let Weight = 0;
//             if (PayableOn == "CW") {
//                 Weight = this.UserWgt;
//             }
//             else if (PayableOn == "GW") {
//                 Weight = this.UserGrossWeight;
//             }
//             else {
//                 alert("Please select Surcharge Payable on.");
//                 this.RateIrc = "";
//                 this.PpIrc_Selling = "";
//                 this.CcIrc_Selling = "";
//                 return false;
//             }

//             if (Math.abs(ChargebleWt) == 0) {
//                 alert("Please enter new Chargeable Weight.")
//                 this.clearCharges();
//                 return false;
//             }
//             else if (Math.abs(GrossWt) == 0) {
//                 alert("Please enter new Gross Weight.")
//                 this.clearCharges();
//                 return false;
//             }

//             if (FreightWtType == 'PP') {
//                 this.PpIrc_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
//                 this.CcIrc_Selling = "";
//             }
//             else if (FreightWtType == 'CC') {
//                 this.PpIrc_Selling = "";
//                 this.CcIrc_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
//             }
//             else if (FreightWtType == 'PC') {
//                 if (this.PrepaidPercent == null) {
//                     alert("Please select Prepaid percentage.");
//                     this.clearCharges();
//                     return false;
//                 }
//                 let Total = 0;
//                 Total = (Math.abs(Rate) * Math.abs(Weight))
//                 this.PpIrc_Selling = ((Total * this.PrepaidPercent) / 100).toFixed(2);
//                 this.CcIrc_Selling = ((Total * this.CollectPer) / 100).toFixed(2);
//             }
//         }
//         else {
//             this.PpIrc_Selling = "";
//             this.CcIrc_Selling = "";
//         }
//     }

//     fn_ChangeRate_Surcharge_Xray() {
//         let Rate = this.RateXray;
//         if (Rate != "") {
//             let FreightWtType = this.FreightRate;
//             let PayableOn = this.RateXrayPayOn;
//             let ChargebleWt = this.UserWgt;
//             let GrossWt = this.UserGrossWeight;
//             let Weight = 0;
//             if (PayableOn == "CW") {
//                 Weight = this.UserWgt;
//             }
//             else if (PayableOn == "GW") {
//                 Weight = this.UserGrossWeight;
//             }
//             else {
//                 alert("Please select Surcharge Payable on.");
//                 this.RateXray = "";
//                 this.PpXray_Selling = "";
//                 this.CcXray_Selling = "";
//                 return false;
//             }

//             if (Math.abs(ChargebleWt) == 0) {
//                 alert("Please enter new Chargeable Weight.")
//                 this.clearCharges();
//                 return false;
//             }
//             else if (Math.abs(GrossWt) == 0) {
//                 alert("Please enter new Gross Weight.")
//                 this.clearCharges();
//                 return false;
//             }

//             if (FreightWtType == 'PP') {
//                 this.PpXray_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
//                 this.CcXray_Selling = "";
//             }
//             else if (FreightWtType == 'CC') {
//                 this.PpXray_Selling = "";
//                 this.CcXray_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
//             }
//             else if (FreightWtType == 'PC') {
//                 if (this.PrepaidPercent == null) {
//                     alert("Please select Prepaid percentage.");
//                     this.clearCharges();
//                     return false;
//                 }
//                 let Total = 0;
//                 Total = (Math.abs(Rate) * Math.abs(Weight))
//                 this.PpXray_Selling = ((Total * this.PrepaidPercent) / 100).toFixed(2);
//                 this.CcXray_Selling = ((Total * this.CollectPer) / 100).toFixed(2);
//             }
//         }
//         else {
//             this.PpXray_Selling = "";
//             this.CcXray_Selling = "";
//         }
//     }

//     fn_ChangeRate_Basic() {
//         let Rate = this.RateFreight;
//         if (Rate != "") {
//             let FreightWtType = this.FreightRate;
//             let ChargebleWt = this.UserWgt;
//             let GrossWt = this.UserGrossWeight;

//             if (Math.abs(ChargebleWt) == 0) {
//                 alert("Please enter new Chargeble Weight.")
//                 this.clearCharges();
//                 return false;
//             }
//             else if (Math.abs(GrossWt) == 0) {
//                 alert("Please enter new Gross Weight.")
//                 this.clearCharges();
//                 return false;
//             }

//             if (FreightWtType == 'PP') {
//                 this.Ppchrg_Selling = (Math.abs(Rate) * Math.abs(ChargebleWt)).toFixed(2);
//                 this.Ccchrg_Selling = "";
//             }
//             else if (FreightWtType == 'CC') {
//                 this.Ccchrg_Selling = (Math.abs(Rate) * Math.abs(ChargebleWt)).toFixed(2);
//                 this.Ppchrg_Selling = "";
//             }
//             else if (FreightWtType == 'PC') {
//                 if (this.PrepaidPercent == null) {
//                     alert("Please select Prepaid percentage.");
//                     this.clearCharges();
//                     return false;
//                 }
//                 let Total = (Math.abs(Rate) * Math.abs(ChargebleWt))
//                 this.Ppchrg_Selling = ((Total * this.PrepaidPercent) / 100).toFixed(2);
//                 this.Ccchrg_Selling = ((Total * this.CollectPer) / 100).toFixed(2);
//             }
//         }
//         else {
//             this.Ccchrg_Selling = "";
//             this.Ppchrg_Selling = "";
//         }
//         this.fnCalPP_HAWBFreight();
//         this.fnCalCC_HAWBFreight();
//     }

//     fnChkExchangeRate(srno, typ, val) {
//         if (val != "INR") {
//             if (Math.abs(this.TxtExchRate) == 0) {
//                 alert("Please enter Exch. Rate first.");
//                 if (typ == 'PP') {
//                     this.setDefaultCurrencyPP(srno);
//                 } else { this.setDefaultCurrencyCC(srno); }
//                 return false;
//             }
//             if (Math.abs(this.InrRate) == 0) {
//                 alert("Please enter Exch. INR Rate first.");
//                 if (typ == 'PP') {
//                     this.setDefaultCurrencyPP(srno);
//                 } else { this.setDefaultCurrencyCC(srno); }
//                 return false;
//             }
//         }
//         this.fnCalCC_HAWBFreight();
//         this.fnCalPP_HAWBFreight();
//     }

//     setDefaultCurrencyPP(typ) {
//         if (typ == 1) { this.PPchrg_SellingCur = "INR"; }
//         else if (typ == 2) { this.PpFsc_SellingCur = "INR"; }
//         else if (typ == 3) { this.PpIrc_SellingCur = "INR"; }
//         else if (typ == 4) { this.PpXray_SellingCur = "INR"; }
//         else if (typ == 5) { this.McCurPP = "INR"; }
//         else if (typ == 6) { this.CtgCurPP = "INR"; }
//         else if (typ == 7) { this.ThcCurPP = "INR"; }
//         else if (typ == 8) { this.DdcCurPP = "INR"; }
//         else if (typ == 9) { this.DcCurPP = "INR"; }
//         else if (typ == 10) { this.ScrCurPP = "INR"; }
//         else if (typ == 11) { this.MycCurPP = "INR"; }
//         else if (typ == 13) { this.HawbCurPP = "INR"; }
//         else if (typ == 14) { this.PcaCurPP = "INR"; }
//         else if (typ == 17) { this.OtherRateCurPP = "INR"; }
//         else if (typ == 18) { this.fobCurPP = "INR"; }
//     }

//     setDefaultCurrencyCC(typ) {
//         if (typ == 1) { this.Ccchrg_SellingCur = "INR"; }
//         else if (typ == 2) { this.CcFsc_SellingCur = "INR"; }
//         else if (typ == 3) { this.CcIrc_SellingCur = "INR"; }
//         else if (typ == 4) { this.CcXray_SellingCur = "INR"; }
//         else if (typ == 5) { this.McCur = "INR"; }
//         else if (typ == 6) { this.CtgCur = "INR"; }
//         else if (typ == 7) { this.ThcCur = "INR"; }
//         else if (typ == 8) { this.DdcCur = "INR"; }
//         else if (typ == 9) { this.DcCur = "INR"; }
//         else if (typ == 10) { this.ScrCur = "INR"; }
//         else if (typ == 11) { this.MycCur = "INR"; }
//         else if (typ == 13) { this.HawbCur = "INR"; }
//         else if (typ == 14) { this.PcaCur = "INR"; }
//         else if (typ == 17) { this.OtherRateCur = "INR"; }
//         else if (typ == 18) { this.fobCur = "INR"; }
//     }

//     fn_ChangeUserWeight() {
//         if (Math.abs(this.UserWgt) == 0 || Math.abs(this.UserGrossWeight) == 0) {
//             this.clearCharges();
//         }
//         if (this.RateFreight != "") {
//             this.fn_ChangeRate_Basic();
//         }
//         if (this.RateFsc != "") {
//             this.fn_ChangeRate_Surcharge('FSC');
//         }
//         if (this.RateIrc != "") {
//             this.fn_ChangeRate_Surcharge('IRC');
//         }
//         if (this.RateXray != "") {
//             this.fn_ChangeRate_Surcharge('XRAY');
//         }
//     }

//     fn_ChangeRate_MC_CTG(CHRG_TYPE) {
//         if (CHRG_TYPE == 'MC') { this.fn_ChangeRate_MC_CTG_Mc(); }
//         else if (CHRG_TYPE == 'CTG') { this.fn_ChangeRate_MC_CTG_Ctg(); }
//         else if (CHRG_TYPE == 'THC') { this.fn_ChangeRate_MC_CTG_Thc(); }
//         else if (CHRG_TYPE == 'DDC') { this.fn_ChangeRate_MC_CTG_Ddc(); }
//         else if (CHRG_TYPE == 'FOB') { this.fn_ChangeRate_MC_CTG_Fob(); }
//     }

//     fn_ChangeRate_MC_CTG_Mc() {
//         if (this.McRate != "") {
//             if (Math.abs(this.UserWgt) == 0) {
//                 alert("Please enter new Chargeble Weight.")
//                 this.clearCharges();
//                 return false;
//             }
//             else if (Math.abs(this.UserWgt) == 0) {
//                 alert("Please enter new Gross Weight.")
//                 this.clearCharges();
//                 return false;
//             }
//             let Weight = 0;
//             if (this.McPayOn == "CW") {//this.McRateCC == "CW"
//                 Weight = this.UserWgt;
//             }
//             else if (this.McPayOn == "GW") { //this.McRateCC == "GW"
//                 Weight = this.UserGrossWeight;
//             }
//             else {
//                 alert("Please select Surcharge Payable on.");
//                 this.McRate = "";
//                 this.McRatePP = "";
//                 this.McRateCC = ""
//                 return false;
//             }

//             if (this.FreightRate == 'PP') {
//                 this.McRatePP = (Math.abs(this.McRate) * Math.abs(Weight)).toFixed(2);
//                 this.McRateCC = "";
//             }
//             else if (this.FreightRate == 'CC') {
//                 this.McRateCC = (Math.abs(this.McRate) * Math.abs(Weight)).toFixed(2);
//                 this.McRatePP = "";
//             }
//             else if (this.FreightRate == 'PC') {
//                 if (this.PrepaidPercent == null) {
//                     alert("Please select Prepaid percentage.");
//                     this.clearCharges();
//                     return false;
//                 }
//                 var Total = (Math.abs(this.McRate) * Math.abs(Weight));
//                 this.McRatePP = ((Total * this.PrepaidPercent) / 100).toFixed(2);
//                 this.McRateCC = ((Total * this.CollectPer) / 100).toFixed(2);
//             }
//         }
//         else {
//             this.McRatePP = "";
//             this.McRateCC = "";
//         }
//         this.fnCalPP_HAWBFreight();
//         this.fnCalCC_HAWBFreight();
//     }

//     fn_ChangeRate_MC_CTG_Ctg() {
//         if (this.CtgRate != "") {
//             if (Math.abs(this.UserWgt) == 0) {
//                 alert("Please enter new Chargeble Weight.")
//                 this.clearCharges();
//                 return false;
//             }
//             else if (Math.abs(this.UserWgt) == 0) {
//                 alert("Please enter new Gross Weight.")
//                 this.clearCharges();
//                 return false;
//             }
//             let Weight = 0;
//             if (this.CtgPayOn == "CW") {
//                 Weight = this.UserWgt;
//             }
//             else if (this.CtgPayOn == "GW") {
//                 Weight = this.UserGrossWeight;
//             }
//             else {
//                 alert("Please select Surcharge Payable on.");
//                 // this.McRate = "";
//                 // this.McRatePP = "";
//                 // this.McRateCC = "";
//                 this.CtgRate = "";
//                 this.CtgRatePP = "";
//                 this.CtgRateCC = "";
//                 return false;
//             }

//             if (this.FreightRate == 'PP') {
//                 this.CtgRatePP = (Math.abs(this.CtgRate) * Math.abs(Weight)).toFixed(2);
//                 this.CtgRateCC = "";
//             }
//             else if (this.FreightRate == 'CC') {
//                 this.CtgRateCC = (Math.abs(this.CtgRate) * Math.abs(Weight)).toFixed(2);
//                 this.McRatePP = "";
//             }
//             else if (this.FreightRate == 'PC') {
//                 if (this.PrepaidPercent == null) {
//                     alert("Please select Prepaid percentage.");
//                     this.clearCharges();
//                     return false;
//                 }
//                 var Total = (Math.abs(this.CtgRate) * Math.abs(Weight));
//                 this.CtgRatePP = ((Total * this.PrepaidPercent) / 100).toFixed(2);
//                 this.CtgRateCC = ((Total * this.CollectPer) / 100).toFixed(2);
//             }
//         }
//         else {
//             this.CtgRatePP = "";
//             this.CtgRateCC = "";
//         }
//         this.fnCalPP_HAWBFreight();
//         this.fnCalCC_HAWBFreight();
//     }

//     fn_ChangeRate_MC_CTG_Thc() {
//         if (this.ThcRate != "") {
//             if (Math.abs(this.UserWgt) == 0) {
//                 alert("Please enter new Chargeble Weight.")
//                 this.clearCharges();
//                 return false;
//             }
//             else if (Math.abs(this.UserWgt) == 0) {
//                 alert("Please enter new Gross Weight.")
//                 this.clearCharges();
//                 return false;
//             }
//             let Weight = 0;
//             if (this.CtgPayOn == "CW") {
//                 Weight = this.UserWgt;
//             }
//             else if (this.CtgPayOn == "GW") {
//                 Weight = this.UserGrossWeight;
//             }
//             else {
//                 alert("Please select Surcharge Payable on.");
//                 this.ThcRate = "";
//                 this.ThcRatePP = "";
//                 this.ThcRateCC = ""
//                 return false;
//             }

//             if (this.FreightRate == 'PP') {
//                 this.ThcRatePP = (Math.abs(this.ThcRate) * Math.abs(Weight)).toFixed(2);
//                 this.ThcRateCC = "";
//             }
//             else if (this.FreightRate == 'CC') {
//                 this.ThcRateCC = (Math.abs(this.ThcRate) * Math.abs(Weight)).toFixed(2);
//                 this.ThcRatePP = "";
//             }
//             else if (this.FreightRate == 'PC') {
//                 if (this.PrepaidPercent == null) {
//                     alert("Please select Prepaid percentage.");
//                     this.clearCharges();
//                     return false;
//                 }
//                 var Total = (Math.abs(this.ThcRate) * Math.abs(Weight));
//                 this.ThcRatePP = ((Total * this.PrepaidPercent) / 100).toFixed(2);
//                 this.ThcRateCC = ((Total * this.CollectPer) / 100).toFixed(2);
//             }
//         }
//         else {
//             this.ThcRatePP = "";
//             this.ThcRateCC = "";
//         }
//         this.fnCalPP_HAWBFreight();
//         this.fnCalCC_HAWBFreight();
//     }

//     fn_ChangeRate_MC_CTG_Ddc() {
//         if (this.DdcRate != "") {
//             if (Math.abs(this.UserWgt) == 0) {
//                 alert("Please enter new Chargeble Weight.")
//                 this.clearCharges();
//                 return false;
//             }
//             else if (Math.abs(this.UserWgt) == 0) {
//                 alert("Please enter new Gross Weight.")
//                 this.clearCharges();
//                 return false;
//             }
//             let Weight = 0;
//             if (this.DdcPayOn == "CW") {
//                 Weight = this.UserWgt;
//             }
//             else if (this.DdcPayOn == "GW") {
//                 Weight = this.UserGrossWeight;
//             }
//             else {
//                 alert("Please select Surcharge Payable on.");
//                 this.DdcRate = "";
//                 this.DdcRatePP = "";
//                 this.DdcRateCC = ""
//                 return false;
//             }

//             if (this.FreightRate == 'PP') {
//                 this.DdcRatePP = (Math.abs(this.DdcRate) * Math.abs(Weight)).toFixed(2);
//                 this.DdcRateCC = "";
//             }
//             else if (this.FreightRate == 'CC') {
//                 this.DdcRatePP = (Math.abs(this.DdcRate) * Math.abs(Weight)).toFixed(2);
//                 this.McRatePP = "";
//             }
//             else if (this.FreightRate == 'PC') {
//                 if (this.PrepaidPercent == null) {
//                     alert("Please select Prepaid percentage.");
//                     this.clearCharges();
//                     return false;
//                 }
//                 var Total = (Math.abs(this.DdcRate) * Math.abs(Weight));
//                 this.DdcRatePP = ((Total * this.PrepaidPercent) / 100).toFixed(2);
//                 this.DdcRateCC = ((Total * this.CollectPer) / 100).toFixed(2);
//             }
//         }
//         else {
//             this.DdcRatePP = "";
//             this.DdcRateCC = "";
//         }
//         this.fnCalPP_HAWBFreight();
//         this.fnCalCC_HAWBFreight();
//     }
//     fn_ChangeRate_MC_CTG_Fob() {
//         if (this.fobRate != "") {
//             if (Math.abs(this.UserWgt) == 0) {
//                 alert("Please enter new Chargeble Weight.")
//                 this.clearCharges();
//                 return false;
//             }
//             else if (Math.abs(this.UserWgt) == 0) {
//                 alert("Please enter new Gross Weight.")
//                 this.clearCharges();
//                 return false;
//             }
//             let Weight = 0;
//             if (this.fobPayOn == "CW") {//this.McRateCC == "CW"
//                 Weight = this.UserWgt;
//             }
//             else if (this.fobPayOn == "GW") { //this.McRateCC == "GW"
//                 Weight = this.UserGrossWeight;
//             }
//             else {
//                 alert("Please select Surcharge Payable on.");
//                 this.fobRate = "";
//                 this.fobRatePP = "";
//                 this.fobRateCC = ""
//                 return false;
//             }

//             if (this.FreightRate == 'PP') {
//                 this.fobRatePP = (Math.abs(this.fobRate) * Math.abs(Weight)).toFixed(2);
//                 this.fobRateCC = "";
//             }
//             else if (this.FreightRate == 'CC') {
//                 this.fobRateCC = (Math.abs(this.fobRate) * Math.abs(Weight)).toFixed(2);
//                 this.fobRatePP = "";
//             }
//             else if (this.FreightRate == 'PC') {
//                 if (this.PrepaidPercent == null) {
//                     alert("Please select Prepaid percentage.");
//                     this.clearCharges();
//                     return false;
//                 }
//                 var Total = (Math.abs(this.fobRate) * Math.abs(Weight));
//                 this.fobRatePP = ((Total * this.PrepaidPercent) / 100).toFixed(2);
//                 this.fobRateCC = ((Total * this.CollectPer) / 100).toFixed(2);
//             }
//         }
//         else {
//             this.fobRatePP = "";
//             this.fobRateCC = "";
//         }
//         this.fnCalPP_HAWBFreight();
//         this.fnCalCC_HAWBFreight();
//     }
//     fn_FinalValidation() {
//         if (this.TransportMode == null) {
//             alert("Please select Transportation Mode !")
//             return false;
//         }
//         if (Math.abs(this.UserWgt) == 0) {
//             alert("Please enter new Chargeble Weight.")
//             this.clearCharges();
//             return false;
//         }
//         else if (Math.abs(this.UserGrossWeight) == 0) {
//             alert("Please enter new Gross Weight.")
//             this.clearCharges();
//             return false;
//         }
//         if (Math.abs(this.RateFreight) == 0) {
//             alert("Please enter Freight Basic Rate.");
//             return false;
//         }
//         if (this.DrpExchRate != 'INR' && this.DrpExchRate != null) {
//             if (this.TxtExchRate != "0") {
//                 if (Math.abs(this.TxtExchRate) == 0) {
//                     alert("Please enter Exch. Rate first.")
//                     return false;
//                 }
//                 if (Math.abs(this.InrRate) == 0) {
//                     alert("Please enter Exch. INR Rate first.")
//                     return false;
//                 }
//             }
//         }
//         if (this.DrpExchRate != 'INR' && this.DrpExchRate != null) {
//             if (Math.abs(this.TxtExchRate) > 0 || Math.abs(this.InrRate) > 0) {
//                 if (this.TxtExchRate == "0") {
//                     alert("Please enter Exch. Currency.")
//                     return false;
//                 }
//                 if (Math.abs(this.TxtExchRate) == 0) {
//                     alert("Please enter Exch. Rate first.")
//                     return false;
//                 }
//                 if (Math.abs(this.InrRate) == 0) {
//                     alert("Please enter Exch. INR Rate first.")
//                     return false;
//                 }
//             }
//         }
//     }

//     fnUpdate_HAWB_FREIGHT() {
//         if (this.fn_FinalValidation() == false) { return false; }

//         var answer = confirm("Are you sure you want to update HAWB charges ?")
//         if (answer == false) { return false; }

//         let HAWBNO = this._sharedconsig.exportEditData.HAWBNO;
//         let IS_AGREED_RATED = '', TRANSPORT_MODE = '', CHARGEBLE_WT = '', GROSS_WT = '', FREIGHT_RATE_PER_KG = '', PREPAID_PER = '', COLLECT_PER = '',
//             RATE_AGREED_BY = '', RATE_AGREED_ON = '', EXCH_RATE = '', EXCH_CUR = '', INR_RATE = '', FREIGHT_RATE_BASIC_PO = '', FREIGHT_RATE_BASIC = '';
//         if (this.Type == 1) {
//             IS_AGREED_RATED = 'A';
//         } else if (this.Type == 2) {
//             IS_AGREED_RATED = 'R';
//         }

//         TRANSPORT_MODE = (this.TransportMode != null) ? this.TransportMode : '';

//         CHARGEBLE_WT = this.UserWgt;
//         GROSS_WT = this.UserGrossWeight;

//         FREIGHT_RATE_PER_KG = (this.FreightRate != null) ? this.FreightRate : '';
//         PREPAID_PER = (this.PrepaidPercent != null) ? this.PrepaidPercent : '';
//         COLLECT_PER = this.CollectPer;

//         RATE_AGREED_BY = this.RateAgreedby;
//         RATE_AGREED_ON = (this.RateAgreedOn == null) ? "" : this.RateAgreedOn.formatted;
//         EXCH_RATE = this.TxtExchRate;
//         EXCH_CUR = this.DrpExchRate;
//         if (EXCH_CUR == '0') { EXCH_CUR = ''; }
//         INR_RATE = this.InrRate;

//         let PPCHRG_SELLING = 0, PPCHRG_SELLING_CUR = '', PPCHRG_SELLING_INR = '', CCCHRG_SELLING = 0, CCCHRG_SELLING_CUR = '', CCCHRG_SELLING_INR = '';

//         FREIGHT_RATE_BASIC_PO = (this.RateFreightPayOn != null) ? this.RateFreightPayOn : '';
//         FREIGHT_RATE_BASIC = this.RateFreight;
//         PPCHRG_SELLING = Math.abs(this.Ppchrg_Selling);
//         if (PPCHRG_SELLING > 0)
//             PPCHRG_SELLING_CUR = this.PPchrg_SellingCur;
//         PPCHRG_SELLING_INR = this.Ppchrg_SellingInr;
//         CCCHRG_SELLING = Math.abs(this.Ccchrg_Selling);
//         if (CCCHRG_SELLING > 0)
//             CCCHRG_SELLING_CUR = this.Ccchrg_SellingCur;
//         CCCHRG_SELLING_INR = this.Ccchrg_SellingInr;


//         let FRT_RATE_SCHRG_FSC_PO = "",
//             FRT_RATE_SCHRG_IRC_PO = "",
//             FRT_RATE_SCHRG_XRAY_PO = "",
//             FRT_RATE_SCHRG_FSC = "",
//             FRT_RATE_SCHRG_IRC = "",
//             FRT_RATE_SCHRG_XRAY = "",
//             FREIGHT_CHARGABLE_AS = '';

//         if (this.FreightChargeble == 1) {
//             FREIGHT_CHARGABLE_AS = 'AI';

//             //Added by sujit All In with X-ray after discussion with jolly sir on 24/04/2015
//             FRT_RATE_SCHRG_XRAY = this.RateXray;
//             if (FRT_RATE_SCHRG_XRAY != '')
//                 FRT_RATE_SCHRG_XRAY_PO = (this.RateXrayPayOn != null) ? this.RateXrayPayOn : '';
//         }
//         else if (this.FreightChargeble == 2) {
//             FREIGHT_CHARGABLE_AS = 'FS';
//             FRT_RATE_SCHRG_FSC = this.RateFsc;
//             FRT_RATE_SCHRG_IRC = this.RateIrc;
//             FRT_RATE_SCHRG_XRAY = this.RateXray;

//             if (FRT_RATE_SCHRG_FSC != '')
//                 FRT_RATE_SCHRG_FSC_PO = (this.RateFscPayOn) ? this.RateFscPayOn : '';
//             if (FRT_RATE_SCHRG_IRC != '')
//                 FRT_RATE_SCHRG_IRC_PO = (this.RateIrcPayOn) ? this.RateIrcPayOn : '';
//             if (FRT_RATE_SCHRG_XRAY != '')
//                 FRT_RATE_SCHRG_XRAY_PO = (this.RateXrayPayOn) ? this.RateXrayPayOn : '';
//         }

//         let PP_SCHRG_FSC_SELL = 0, PP_SCHRG_FSC_SELL_CUR = '', PP_SCHRG_FSC_SELL_INR = 0, CC_SCHRG_FSC_SELL = 0, CC_SCHRG_FSC_SELL_CUR = '', CC_SCHRG_FSC_SELL_INR = 0;
//         PP_SCHRG_FSC_SELL = Math.abs(this.PpFsc_Selling);
//         if (PP_SCHRG_FSC_SELL > 0)
//             PP_SCHRG_FSC_SELL_CUR = this.PpFsc_SellingCur;
//         PP_SCHRG_FSC_SELL_INR = Math.abs(this.PpFsc_SellingInr);
//         CC_SCHRG_FSC_SELL = Math.abs(this.CcFsc_Selling);
//         if (CC_SCHRG_FSC_SELL > 0)
//             CC_SCHRG_FSC_SELL_CUR = this.CcFsc_SellingCur;
//         CC_SCHRG_FSC_SELL_INR = Math.abs(this.CcFsc_SellingInr);


//         let PP_SCHRG_IRC_SELL = 0, PP_SCHRG_IRC_SELL_CUR = '', PP_SCHRG_IRC_SELL_INR = 0, CC_SCHRG_IRC_SELL = 0, CC_SCHRG_IRC_SELL_CUR = '', CC_SCHRG_IRC_SELL_INR = 0;
//         PP_SCHRG_IRC_SELL = Math.abs(this.PpIrc_Selling);
//         if (PP_SCHRG_IRC_SELL > 0)
//             PP_SCHRG_IRC_SELL_CUR = this.PpIrc_SellingCur;
//         PP_SCHRG_IRC_SELL_INR = Math.abs(this.PpIrc_SellingInr);
//         CC_SCHRG_IRC_SELL = Math.abs(this.CcIrc_Selling);
//         if (CC_SCHRG_IRC_SELL > 0)
//             CC_SCHRG_IRC_SELL_CUR = this.CcIrc_SellingCur;
//         CC_SCHRG_IRC_SELL_INR = Math.abs(this.CcIrc_SellingInr);

//         let PP_SCHRG_XRAY_SELL = 0, PP_SCHRG_XRAY_SELL_CUR = '', PP_SCHRG_XRAY_SELL_INR = 0, CC_SCHRG_XRAY_SELL = 0, CC_SCHRG_XRAY_SELL_CUR = '', CC_SCHRG_XRAY_SELL_INR = 0;
//         PP_SCHRG_XRAY_SELL = Math.abs(this.PpXray_Selling);
//         if (PP_SCHRG_XRAY_SELL > 0)
//             PP_SCHRG_XRAY_SELL_CUR = this.PpXray_SellingCur;
//         PP_SCHRG_XRAY_SELL_INR = Math.abs(this.PpXray_SellingInr);
//         CC_SCHRG_XRAY_SELL = Math.abs(this.CcXray_Selling);
//         if (CC_SCHRG_XRAY_SELL > 0)
//             CC_SCHRG_XRAY_SELL_CUR = this.CcXray_SellingCur;
//         CC_SCHRG_XRAY_SELL_INR = Math.abs(this.CcXray_SellingInr);

//         let FRT_RATE_MC = 0, FRT_RATE_MC_PO = '', PP_MC_SELL = 0, PP_MC_SELL_CUR = '', CC_MC_SELL = 0, CC_MC_SELL_CUR = 0, PP_MC_SELL_INR = 0, CC_MC_SELL_INR = 0;


//         FRT_RATE_MC = Math.abs(this.McRate);
//         if (FRT_RATE_MC > 0)
//             FRT_RATE_MC_PO = this.McPayOn;
//         PP_MC_SELL = Math.abs(this.McRatePP);
//         PP_MC_SELL_CUR = '';
//         if (PP_MC_SELL > 0)
//             PP_MC_SELL_CUR = this.McCurPP;
//         PP_MC_SELL_INR = Math.abs(this.McRatePPInr);
//         CC_MC_SELL = Math.abs(this.McRateCC);
//         if (CC_MC_SELL > 0)
//             CC_MC_SELL_CUR = this.McCur;
//         CC_MC_SELL_INR = Math.abs(this.McCCInr);



//         /* Added by sujit for THC rate on CW for DHAKA only */

//         let FRT_RATE_THC = Math.abs(this.ThcRate);
//         let FRT_RATE_THC_PO = '';

//         if (FRT_RATE_THC > 0)
//             FRT_RATE_THC_PO = (this.ThcPayOn != null) ? this.ThcPayOn : '';

//         let PP_THC_SELL = Math.abs(this.ThcRatePP);
//         let PP_THC_SELL_CUR = '';

//         if (PP_THC_SELL > 0)
//             PP_THC_SELL_CUR = this.ThcCurPP;

//         let PP_THC_SELL_INR = Math.abs(this.ThcRatePPInr);
//         let CC_THC_SELL = Math.abs(this.ThcRateCC);
//         let CC_THC_SELL_CUR = '';

//         if (CC_THC_SELL > 0)
//             CC_THC_SELL_CUR = this.ThcCur;

//         let CC_THC_SELL_INR = Math.abs(this.ThcCCInr);

//         //FRT_RATE_THC,   FRT_RATE_THC_PO,
//         //PP_THC_SELL,    PP_THC_SELL_CUR,    PP_THC_SELL_INR,
//         //CC_THC_SELL, CC_THC_SELL_CUR, CC_THC_SELL_INR

//         //Added by sujit DDC

//         let FRT_RATE_DDC = Math.abs(this.DdcRate);
//         let FRT_RATE_DDC_PO = '';
//         if (FRT_RATE_DDC > 0)
//             FRT_RATE_DDC_PO = (this.DdcPayOn != null) ? this.DdcPayOn : '';

//         let PP_DDC_SELL = Math.abs(this.DdcRatePP);
//         let PP_DDC_SELL_CUR = '';
//         if (PP_DDC_SELL > 0)
//             PP_DDC_SELL_CUR = this.DdcCurPP;

//         let PP_DDC_SELL_INR = Math.abs(this.DdcRatePPInr);
//         let CC_DDC_SELL = Math.abs(this.DdcRateCC);
//         let CC_DDC_SELL_CUR = '';
//         if (CC_DDC_SELL > 0)
//             CC_DDC_SELL_CUR = this.DdcCur;

//         let CC_DDC_SELL_INR = Math.abs(this.DdcCCInr);

//         //FRT_RATE_DDC, FRT_RATE_DDC_PO, PP_DDC_SELL, PP_DDC_SELL_CUR, PP_DDC_SELL_INR, CC_DDC_SELL, CC_DDC_SELL_CUR, CC_DDC_SELL_INR

//         /* End */

//         let FRT_RATE_CTG = Math.abs(this.CtgRate);
//         let FRT_RATE_CTG_PO = '';
//         if (FRT_RATE_CTG > 0)
//             FRT_RATE_CTG_PO = (this.CtgPayOn != null) ? this.CtgPayOn : '';
//         let PP_CTG_SELL = Math.abs(this.CtgRatePP);
//         let PP_CTG_SELL_CUR = '';
//         if (PP_CTG_SELL > 0)
//             PP_CTG_SELL_CUR = this.CtgCurPP;
//         let PP_CTG_SELL_INR = Math.abs(this.CtgRatePPInr);
//         let CC_CTG_SELL = Math.abs(this.CtgRateCC);
//         let CC_CTG_SELL_CUR = '';
//         if (CC_CTG_SELL > 0)
//             CC_CTG_SELL_CUR = this.CtgCur;
//         let CC_CTG_SELL_INR = Math.abs(this.CtgCCInr);


//         let PP_HAWB_SELL = Math.abs(this.HawbRatePP);
//         let PP_HAWB_SELL_CUR = '';
//         if (PP_HAWB_SELL > 0)
//             PP_HAWB_SELL_CUR = this.HawbCurPP;
//         let PP_HAWB_SELL_INR = Math.abs(this.HawbRatePPInr);
//         let CC_HAWB_SELL = Math.abs(this.HawbRateCC);
//         let CC_HAWB_SELL_CUR = '';
//         if (CC_HAWB_SELL > 0)
//             CC_HAWB_SELL_CUR = this.HawbCur;
//         let CC_HAWB_SELL_INR = Math.abs(this.HawbCCInr);

//         let PP_PCA_SELL = Math.abs(this.PcaRatePP);
//         let PP_PCA_SELL_CUR = '';
//         if (PP_PCA_SELL > 0)
//             PP_PCA_SELL_CUR = this.PcaCurPP;
//         let PP_PCA_SELL_INR = Math.abs(this.PcaRatePPInr);
//         let CC_PCA_SELL = Math.abs(this.PcaRateCC);
//         let CC_PCA_SELL_CUR = '';
//         if (CC_PCA_SELL > 0)
//             CC_PCA_SELL_CUR = this.PcaCur;
//         let CC_PCA_SELL_INR = Math.abs(this.PcaCCInr);

//         let PP_OTHER_SELL = Math.abs(this.OtherRatePP);
//         let PP_OTHER_SELL_CUR = '';
//         if (PP_OTHER_SELL > 0)
//             PP_OTHER_SELL_CUR = this.OtherRateCurPP;
//         let PP_OTHER_SELL_INR = Math.abs(this.OtherRatePPInr);
//         let CC_OTHER_SELL = Math.abs(this.OtherRateCC);
//         let CC_OTHER_SELL_CUR = '';
//         if (CC_OTHER_SELL > 0)
//             CC_OTHER_SELL_CUR = this.OtherRateCur;
//         let CC_OTHER_SELL_INR = Math.abs(this.OtherRateInr);

//         let PP_DC_SELL = Math.abs(this.DcRatePP);
//         let PP_DC_SELL_CUR = '';
//         if (PP_DC_SELL > 0)
//             PP_DC_SELL_CUR = this.DcCurPP;
//         let PP_DC_SELL_INR = Math.abs(this.DcRatePPInr);
//         let CC_DC_SELL = Math.abs(this.DcRateCC);
//         let CC_DC_SELL_CUR = '';
//         if (CC_DC_SELL > 0)
//             CC_DC_SELL_CUR = this.DcCur;
//         let CC_DC_SELL_INR = Math.abs(this.DcCCInr);

//         let PP_SCR_SELL = Math.abs(this.ScrRatePP);
//         let PP_SCR_SELL_CUR = '';
//         if (PP_SCR_SELL > 0)
//             PP_SCR_SELL_CUR = this.ScrCurPP;
//         let PP_SCR_SELL_INR = Math.abs(this.ScrRatePPInr);
//         let CC_SCR_SELL = Math.abs(this.ScrRateCC);
//         let CC_SCR_SELL_CUR = '';
//         if (CC_SCR_SELL > 0)
//             CC_SCR_SELL_CUR = this.ScrCur;
//         let CC_SCR_SELL_INR = Math.abs(this.ScrCCInr);

//         let PP_MYC_SELL = Math.abs(this.MycRatePP);
//         let PP_MYC_SELL_CUR = '';
//         if (PP_MYC_SELL > 0)
//             PP_MYC_SELL_CUR = this.MycCurPP;
//         let PP_MYC_SELL_INR = Math.abs(this.MycRatePPInr);
//         let CC_MYC_SELL = Math.abs(this.MycRateCC);
//         let CC_MYC_SELL_CUR = '';
//         if (CC_MYC_SELL > 0)
//             CC_MYC_SELL_CUR = this.MycCur;
//         let CC_MYC_SELL_INR = Math.abs(this.MycCCInr);


//         let PPTOTCARR_SELLING = Math.abs(this.Pptotcarr_Selling);
//         let CCTOTCARR_SELLING_INR = Math.abs(this.Cctotcarr_SellingInr);

//         let PPTOTAGT_SELLING = Math.abs(this.Pptotagt_Selling);
//         let CCTOTAGT_SELLING_INR = Math.abs(this.Cctotagt_SellingInr);

//         let PPTOT_SELLING = Math.abs(this.Pptot_Selling);
//         let CCTOT_SELLING = Math.abs(this.Cctot_Selling);

//         let REMARK = this.Remark;
//         let Procurment = this.Procument;
//         if (parseFloat(Procurment) > 20.00) {
//             alert("Please Enter below 20 on Agent Charges! ");
//             return false;
//         }
//         ///////////////////////////////////////////////////////////////////

//         /*added by nisha FOB 12/06/2019 */
//         let FRT_RATE_FOB = 0, FRT_RATE_FOB_PO = '', PP_FOB_SELL = 0, PP_FOB_SELL_CUR = '', CC_FOB_SELL = 0, CC_FOB_SELL_CUR = 0, PP_FOB_SELL_INR = 0, CC_FOB_SELL_INR = 0;

//         FRT_RATE_FOB = Math.abs(this.fobRate);
//         if (FRT_RATE_FOB > 0)
//             FRT_RATE_FOB_PO = this.fobPayOn;
//         PP_FOB_SELL = Math.abs(this.fobRatePP);
//         PP_FOB_SELL_CUR = '';
//         if (PP_FOB_SELL > 0)
//             PP_FOB_SELL_CUR = this.fobCurPP;
//         PP_FOB_SELL_INR = Math.abs(this.fobRatePPInr);
//         CC_FOB_SELL = Math.abs(this.fobRateCC);
//         if (CC_FOB_SELL > 0)
//             CC_FOB_SELL_CUR = this.fobCur;
//         CC_FOB_SELL_INR = Math.abs(this.fobCCInr);


//         if (FREIGHT_RATE_BASIC == '') { FREIGHT_RATE_BASIC = '0'; }
//         if (FRT_RATE_SCHRG_FSC == '') { FRT_RATE_SCHRG_FSC = '0'; }
//         if (FRT_RATE_SCHRG_IRC == '') { FRT_RATE_SCHRG_IRC = '0'; }
//         if (FRT_RATE_SCHRG_XRAY == '') { FRT_RATE_SCHRG_XRAY = '0'; }


//         const _jsonData = {
//             HAWBNO: HAWBNO,
//             PPCHRG_SELLING: PPCHRG_SELLING,
//             CCCHRG_SELLING: CCCHRG_SELLING,
//             PPTOTAGT_SELLING: PPTOTAGT_SELLING,
//             PPTOTCARR_SELLING: PPTOTCARR_SELLING,
//             PPTOT_SELLING: PPTOT_SELLING,
//             CCTOT_SELLING: CCTOT_SELLING,
//             PP_SCHRG_FSC_SELL: PP_SCHRG_FSC_SELL,
//             PP_SCHRG_IRC_SELL: PP_SCHRG_IRC_SELL,
//             PP_SCHRG_XRAY_SELL: PP_SCHRG_XRAY_SELL,
//             CC_SCHRG_FSC_SELL: CC_SCHRG_FSC_SELL,
//             CC_SCHRG_IRC_SELL: CC_SCHRG_IRC_SELL,
//             CC_SCHRG_XRAY_SELL: CC_SCHRG_XRAY_SELL,
//             REMARK: REMARK,
//             IS_AGREED_RATED: IS_AGREED_RATED,
//             FREIGHT_RATE_PER_KG: FREIGHT_RATE_PER_KG,
//             PREPAID_PER: PREPAID_PER,
//             COLLECT_PER: COLLECT_PER,
//             FREIGHT_CHARGABLE_AS: FREIGHT_CHARGABLE_AS,
//             FRT_RATE_SCHRG_FSC_PO: FRT_RATE_SCHRG_FSC_PO,
//             FRT_RATE_SCHRG_IRC_PO: FRT_RATE_SCHRG_IRC_PO,
//             FRT_RATE_SCHRG_XRAY_PO: FRT_RATE_SCHRG_XRAY_PO,
//             RATE_AGREED_BY: RATE_AGREED_BY,
//             RATE_AGREED_ON: RATE_AGREED_ON,
//             FREIGHT_RATE_BASIC: FREIGHT_RATE_BASIC,
//             FRT_RATE_SCHRG_FSC: FRT_RATE_SCHRG_FSC,
//             FRT_RATE_SCHRG_IRC: FRT_RATE_SCHRG_IRC,
//             FRT_RATE_SCHRG_XRAY: FRT_RATE_SCHRG_XRAY,
//             CHARGEBLE_WT: CHARGEBLE_WT,
//             GROSS_WT: GROSS_WT,
//             EXCH_RATE: EXCH_RATE,
//             EXCH_CUR: EXCH_CUR,
//             INR_RATE: INR_RATE,
//             CCCHRG_SELLING_CUR: CCCHRG_SELLING_CUR,
//             CC_SCHRG_FSC_SELL_CUR: CC_SCHRG_FSC_SELL_CUR,
//             CC_SCHRG_IRC_SELL_CUR: CC_SCHRG_IRC_SELL_CUR,
//             CC_SCHRG_XRAY_SELL_CUR: CC_SCHRG_XRAY_SELL_CUR,
//             CCCHRG_SELLING_INR: CCCHRG_SELLING_INR,
//             CC_SCHRG_FSC_SELL_INR: CC_SCHRG_FSC_SELL_INR,
//             CC_SCHRG_IRC_SELL_INR: CC_SCHRG_IRC_SELL_INR,
//             CC_SCHRG_XRAY_SELL_INR: CC_SCHRG_XRAY_SELL_INR,
//             CCTOTAGT_SELLING_INR: CCTOTAGT_SELLING_INR,
//             CCTOTCARR_SELLING_INR: CCTOTCARR_SELLING_INR,
//             PPCHRG_SELLING_CUR: PPCHRG_SELLING_CUR,
//             PPCHRG_SELLING_INR: PPCHRG_SELLING_INR,
//             PP_SCHRG_FSC_SELL_CUR: PP_SCHRG_FSC_SELL_CUR,
//             PP_SCHRG_FSC_SELL_INR: PP_SCHRG_FSC_SELL_INR,
//             PP_SCHRG_IRC_SELL_CUR: PP_SCHRG_IRC_SELL_CUR,
//             PP_SCHRG_IRC_SELL_INR: PP_SCHRG_IRC_SELL_INR,
//             PP_SCHRG_XRAY_SELL_CUR: PP_SCHRG_XRAY_SELL_CUR,
//             PP_SCHRG_XRAY_SELL_INR: PP_SCHRG_XRAY_SELL_INR,
//             FREIGHT_RATE_BASIC_PO: FREIGHT_RATE_BASIC_PO,
//             FRT_RATE_MC_PO: FRT_RATE_MC_PO,
//             FRT_RATE_MC: FRT_RATE_MC,
//             PP_MC_SELL: PP_MC_SELL,
//             CC_MC_SELL: CC_MC_SELL,
//             CC_MC_SELL_CUR: CC_MC_SELL_CUR,
//             CC_MC_SELL_INR: CC_MC_SELL_INR,
//             FRT_RATE_CTG_PO: FRT_RATE_CTG_PO,
//             FRT_RATE_CTG: FRT_RATE_CTG,
//             PP_CTG_SELL: PP_CTG_SELL,
//             CC_CTG_SELL: CC_CTG_SELL,
//             CC_CTG_SELL_CUR: CC_CTG_SELL_CUR,
//             CC_CTG_SELL_INR: CC_CTG_SELL_INR,
//             PP_HAWB_SELL: PP_HAWB_SELL,
//             CC_HAWB_SELL: CC_HAWB_SELL,
//             CC_HAWB_SELL_CUR: CC_HAWB_SELL_CUR,
//             CC_HAWB_SELL_INR: CC_HAWB_SELL_INR,
//             PP_PCA_SELL: PP_PCA_SELL,
//             CC_PCA_SELL: CC_PCA_SELL,
//             CC_PCA_SELL_CUR: CC_PCA_SELL_CUR,
//             CC_PCA_SELL_INR: CC_PCA_SELL_INR,
//             PP_OTHER_SELL: PP_OTHER_SELL,
//             CC_OTHER_SELL: CC_OTHER_SELL,
//             CC_OTHER_SELL_CUR: CC_OTHER_SELL_CUR,
//             CC_OTHER_SELL_INR: CC_OTHER_SELL_INR,
//             PP_MC_SELL_CUR: PP_MC_SELL_CUR,
//             PP_MC_SELL_INR: PP_MC_SELL_INR,
//             PP_CTG_SELL_CUR: PP_CTG_SELL_CUR,
//             PP_CTG_SELL_INR: PP_CTG_SELL_INR,
//             PP_HAWB_SELL_CUR: PP_HAWB_SELL_CUR,
//             PP_HAWB_SELL_INR: PP_HAWB_SELL_INR,
//             PP_PCA_SELL_CUR: PP_PCA_SELL_CUR,
//             PP_PCA_SELL_INR: PP_PCA_SELL_INR,
//             PP_OTHER_SELL_CUR: PP_OTHER_SELL_CUR,
//             PP_OTHER_SELL_INR: PP_OTHER_SELL_INR,
//             PP_DC_SELL: PP_DC_SELL,
//             PP_DC_SELL_CUR: PP_DC_SELL_CUR,
//             PP_DC_SELL_INR: PP_DC_SELL_INR,
//             CC_DC_SELL: CC_DC_SELL,
//             CC_DC_SELL_CUR: CC_DC_SELL_CUR,
//             CC_DC_SELL_INR: CC_DC_SELL_INR,
//             PP_SCR_SELL: PP_SCR_SELL,
//             PP_SCR_SELL_CUR: PP_SCR_SELL_CUR,
//             PP_SCR_SELL_INR: PP_SCR_SELL_INR,
//             CC_SCR_SELL: CC_SCR_SELL,
//             CC_SCR_SELL_CUR: CC_SCR_SELL_CUR,
//             CC_SCR_SELL_INR: CC_SCR_SELL_INR,
//             PP_MYC_SELL: PP_MYC_SELL,
//             PP_MYC_SELL_CUR: PP_MYC_SELL_CUR,
//             PP_MYC_SELL_INR: PP_MYC_SELL_INR,
//             CC_MYC_SELL: CC_MYC_SELL,
//             CC_MYC_SELL_CUR: CC_MYC_SELL_CUR,
//             CC_MYC_SELL_INR: CC_MYC_SELL_INR,
//             CityCode: this._loginService.getLogin()[0].CITYCODE,
//             CmpCode: this._loginService.getLogin()[0].CMPCODE,
//             CmpId: this._loginService.getLogin()[0].CMPID,
//             MakerIP: this._loginService.getLogin()[0].CMPID,
//             TRANSPORT_MODE: TRANSPORT_MODE,
//             Procument: Procurment,
//             FRT_RATE_THC_PO: FRT_RATE_THC_PO,
//             FRT_RATE_THC: FRT_RATE_THC,
//             PP_THC_SELL: PP_THC_SELL,
//             PP_THC_SELL_CUR: PP_THC_SELL_CUR,
//             PP_THC_SELL_INR: PP_THC_SELL_INR,
//             CC_THC_SELL: CC_THC_SELL,
//             CC_THC_SELL_CUR: CC_THC_SELL_CUR,
//             CC_THC_SELL_INR: CC_THC_SELL_INR,
//             FRT_RATE_DDC_PO: FRT_RATE_DDC_PO,
//             FRT_RATE_DDC: FRT_RATE_DDC,
//             PP_DDC_SELL: PP_DDC_SELL,
//             PP_DDC_SELL_CUR: PP_DDC_SELL_CUR,
//             PP_DDC_SELL_INR: PP_DDC_SELL_INR,
//             CC_DDC_SELL: CC_DDC_SELL,
//             CC_DDC_SELL_CUR: CC_DDC_SELL_CUR,
//             CC_DDC_SELL_INR: CC_DDC_SELL_INR,
//             FRT_RATE_FOB_PO: FRT_RATE_FOB_PO,
//             FRT_RATE_FOB: FRT_RATE_FOB,
//             PP_FOB_SELL: PP_FOB_SELL,
//             PP_FOB_SELL_CUR: PP_FOB_SELL_CUR,
//             PP_FOB_SELL_INR: PP_FOB_SELL_INR,
//             CC_FOB_SELL: CC_FOB_SELL,
//             CC_FOB_SELL_CUR: CC_FOB_SELL_CUR,
//             CC_FOB_SELL_INR: CC_FOB_SELL_INR,
//             VGUID: this._loginService.getLogin()[0].GUID, ///ADDED BY NALINI FOR AIRLINECHARGES
//         };

//         this.disabledBtn.emit(true);
//         this._loaderService.display(true);
//         this._dataService.Common("Export/EXP_MST_EXPORT_HAWB_FRT_UPDATE", _jsonData)
//             .subscribe((data: any) => {
//                 // if (data.Table[0].STATUS.split[0] == '100') {
//                 if (data.Table[0].STATUS.split('#')[0] == '100') {
//                     this._loaderService.display(false);
//                     this.disabledBtn.emit(false);
//                     this.result.emit({ status: data.Table[0].STATUS.split('#')[0], message: "Hawb updated Successfully!." });
//                 }
//                 else {
//                     this._toasterService.toast('error', 'error', data.Table[0].STATUSTEXT);
//                     this._loaderService.display(false);
//                 }
//             });
//     }
//     AddHAWBALCharges() ///ADDED BY NALINI FOR AIRLINECHARGES ADD in TMP
//     {
//         if (this.CHARGETYPE == '' || this.CHARGETYPE == undefined) {
//             alert("Please select Charge Type.")
//             return false;
//         }
//         if (this.CHARGENAME == '' || this.CHARGENAME == undefined) {
//             alert("Please select Charge. ")
//             return false;
//         }
//         if (this.RATE_TAR == null || this.RATE_TAR == '') {
//             alert("Please enter Tariff Rate. ")
//             return false;
//         }
//         if (this.RATE_TAR_FRT == '') {
//             alert("Please enter Tariff Rate Freight. ")
//             return false;
//         }
//         if (this.txtchild == "Add") {
//             if (this.Chargeslist.length > "0") {
//                 let chrgnm: any = []
//                 chrgnm = this.Chargeslist.filter((code: any) => code.FK_CHARGEID === parseInt(this.CHARGENAME.split("|")[0]))
//                 if (chrgnm.length > "0") {
//                     this._toasterService.toast('warning', 'warning', 'Same Charge already Exists!');
//                     return false;
//                 }
//             }
//         }
//         const jsonchild = {
//             PK_ID: this.PK_ID,
//             FKID: this.FK_ID,
//             CHRGDETAILSID: this.CHRGDETAILSID,
//             HAWBNO: this._sharedconsig.exportEditData.HAWBNO,
//             FK_CHARGEID: this.CHARGENAME.split("|")[0],
//             CHARGETYPE: this.CHARGETYPE,
//             RATE_TAR: this.RATE_TAR,
//             RATE_TAR_FRT: this.RATE_TAR_FRT,
//             RATE_NET: this.RATE_NET,
//             RATE_NET_FRT: this.RATE_NET_FRT,
//             MAKERID: this._loginService.getLogin()[0].CMPID,
//             VGUID: this._loginService.getLogin()[0].GUID,

//         }
//         this._dataService.Common("Export/EXPT_HAWB_PRINT_RATE_AIRLINE_CHARGES_TMPIU", jsonchild)
//             .subscribe((data: any) => {
//                 if (data.Table[0].STATUS == "100") {
//                     this.Chargeslist = data.Table1;
//                     if (this.EDIT_CHARGETYPE != undefined) {
//                         this.fn_CalculateAlCharges_PPCCEDIT(data.Table6)
//                     }
//                     else { this.fn_CalculateAlCharges_PPCCADD(data.Table6); }

//                     this.tot_rate_tar_pp_da = data.Table2[0].RATE_TAR_TOTAL_PP_DA;
//                     this.tot_rate_net_pp_da = data.Table2[0].RATE_NET_TOTAL_PP_DA;
//                     this.tot_rate_tar_cc_da = data.Table3[0].RATE_TAR_TOTAL_CC_DA;
//                     this.tot_rate_net_cc_da = data.Table3[0].RATE_NET_TOTAL_CC_DA;
//                     this.tot_rate_tar_pp_dc = data.Table4[0].RATE_TAR_TOTAL_PP_DC;
//                     this.tot_rate_net_pp_dc = data.Table4[0].RATE_NET_TOTAL_PP_DC;
//                     this.tot_rate_tar_cc_dc = data.Table5[0].RATE_TAR_TOTAL_CC_DC;
//                     this.tot_rate_net_cc_dc = data.Table5[0].RATE_NET_TOTAL_CC_DC;
//                     this.ResetHAWBCharges();
//                     //    this.loaderService.display(false);
//                 }
//                 else {
//                     this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT);
//                     // this.loaderService.display(false);
//                 }
//             });
//     }
//     fn_CalculateAlCharges_PPCCADD(tbl6) ///ADDED BY NALINI FOR AIRLINECHARGES
//     {
//         // if(tbl6[0].CHARGETYPE!=this.EDIT_RATE_NET_FRT.c)
//         if (tbl6[0].CHARGETYPE == 'DA' && tbl6[0].RATE_TAR_FRT == 'PP') {
//             this.Pptotagt_Selling = Math.abs(this.Pptotagt_Selling) + Math.abs(tbl6[0].RATE_NET);
//             this.Pptot_Selling = Math.abs(this.Pptot_Selling) + Math.abs(tbl6[0].RATE_NET);
//         }

//         if (tbl6[0].CHARGETYPE == 'DA' && tbl6[0].RATE_TAR_FRT == 'CC') {
//             this.Cctotagt_SellingInr = Math.abs(this.Cctotagt_SellingInr) + Math.abs(tbl6[0].RATE_NET);
//             this.Cctot_Selling = Math.abs(this.Cctot_Selling) + Math.abs(tbl6[0].RATE_NET);
//         }

//         if (tbl6[0].CHARGETYPE == 'DC' && tbl6[0].RATE_TAR_FRT == 'PP') {
//             this.Pptotcarr_Selling = Math.abs(this.Pptotcarr_Selling) + Math.abs(tbl6[0].RATE_NET);
//             this.Pptot_Selling = Math.abs(this.Pptot_Selling) + Math.abs(tbl6[0].RATE_NET);
//         }
//         if (tbl6[0].CHARGETYPE == 'DC' && tbl6[0].RATE_TAR_FRT == 'CC') {
//             this.Cctotcarr_SellingInr = Math.abs(this.Cctotcarr_SellingInr) + Math.abs(tbl6[0].RATE_NET);
//             this.Cctot_Selling = Math.abs(this.Cctot_Selling) + Math.abs(tbl6[0].RATE_NET);
//         }

//     }
//     fn_CalculateAlCharges_PPCCEDIT(tbl6) {
//         // if(tbl6[0].CHARGETYPE!=this.EDIT_RATE_NET_FRT.c)


//         if (tbl6[0].CHARGETYPE == 'DA' && tbl6[0].RATE_TAR_FRT == 'CC' && this.EDIT_CHARGETYPE == 'DA' && this.EDIT_RATE_TAR_FRT == 'PP') {
//             this.Pptotagt_Selling = (Math.abs(this.Pptotagt_Selling)) - Math.abs(this.EDIT_RATE_NET);
//             this.Pptot_Selling = (Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET))
//             this.Cctotagt_SellingInr = Math.abs(this.Cctotagt_SellingInr) + Math.abs(tbl6[0].RATE_NET);
//             this.Cctot_Selling = Math.abs(this.Cctot_Selling) + Math.abs(tbl6[0].RATE_NET);
//         }
//         if (tbl6[0].CHARGETYPE == 'DA' && tbl6[0].RATE_TAR_FRT == 'CC' && this.EDIT_CHARGETYPE == 'DA' && this.EDIT_RATE_TAR_FRT == 'CC') {

//             this.Cctotagt_SellingInr = (Math.abs(this.Cctotagt_SellingInr) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
//             this.Cctot_Selling = (Math.abs(this.Cctot_Selling) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
//         }
//         if (tbl6[0].CHARGETYPE == 'DA' && tbl6[0].RATE_TAR_FRT == 'PP' && this.EDIT_CHARGETYPE == 'DA' && this.EDIT_RATE_TAR_FRT == 'CC') {

//             this.Cctotagt_SellingInr = Math.abs(this.Cctotagt_SellingInr) - Math.abs(this.EDIT_RATE_NET);
//             this.Cctot_Selling = (Math.abs(this.Cctot_Selling) - Math.abs(this.EDIT_RATE_NET));
//             this.Pptotagt_Selling = (Math.abs(this.Pptotagt_Selling)) + Math.abs(this.EDIT_RATE_NET);
//             this.Pptot_Selling = (Math.abs(this.Pptot_Selling) + Math.abs(this.EDIT_RATE_NET))
//         }

//         if (tbl6[0].CHARGETYPE == 'DA' && tbl6[0].RATE_TAR_FRT == 'PP' && this.EDIT_CHARGETYPE == 'DA' && this.EDIT_RATE_TAR_FRT == 'PP') {


//             this.Pptotagt_Selling = (Math.abs(this.Pptotagt_Selling) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
//             this.Pptot_Selling = (Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET)
//         }

//         if (tbl6[0].CHARGETYPE == 'DC' && tbl6[0].RATE_TAR_FRT == 'CC' && this.EDIT_CHARGETYPE == 'DC' && this.EDIT_RATE_TAR_FRT == 'CC') {
//             this.Cctotcarr_SellingInr = (Math.abs(this.Cctotcarr_SellingInr) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
//             this.Cctot_Selling = (Math.abs(this.Cctot_Selling) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
//         }
//         if (tbl6[0].CHARGETYPE == 'DC' && tbl6[0].RATE_TAR_FRT == 'CC' && this.EDIT_CHARGETYPE == 'DC' && this.EDIT_RATE_TAR_FRT == 'PP') {
//             this.Cctotcarr_SellingInr = Math.abs(this.Cctotcarr_SellingInr) + Math.abs(this.EDIT_RATE_NET);
//             this.Cctot_Selling = Math.abs(this.Cctot_Selling) + Math.abs(tbl6[0].RATE_NET);
//             this.Pptotcarr_Selling = (Math.abs(this.Pptotcarr_Selling) - Math.abs(this.EDIT_RATE_NET));
//             this.Pptot_Selling = (Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET));
//         }
//         if (tbl6[0].CHARGETYPE == 'DC' && tbl6[0].RATE_TAR_FRT == 'PP' && this.EDIT_CHARGETYPE == 'DC' && this.EDIT_RATE_TAR_FRT == 'PP') {
//             if (this.Pptotcarr_Selling != '0') {
//                 this.Pptotcarr_Selling = (Math.abs(this.Pptotcarr_Selling) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
//                 this.Pptot_Selling = (Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
//             }
//             else {
//                 this.Pptotcarr_Selling = (Math.abs(this.Pptotcarr_Selling) + Math.abs(tbl6[0].RATE_NET));
//                 this.Pptot_Selling = (Math.abs(this.Pptot_Selling) + Math.abs(tbl6[0].RATE_NET));
//             }

//         }
//         if (tbl6[0].CHARGETYPE == 'DC' && tbl6[0].RATE_TAR_FRT == 'PP' && this.EDIT_CHARGETYPE == 'DC' && this.EDIT_RATE_TAR_FRT == 'CC') {
//             this.Cctotcarr_SellingInr = Math.abs(this.Cctotcarr_SellingInr) - Math.abs(this.EDIT_RATE_NET);
//             this.Cctot_Selling = Math.abs(this.Cctot_Selling) - Math.abs(tbl6[0].RATE_NET);
//             this.Pptotcarr_Selling = (Math.abs(this.Pptotcarr_Selling) + Math.abs(tbl6[0].RATE_NET));
//             this.Pptot_Selling = (Math.abs(this.Pptot_Selling) + Math.abs(tbl6[0].RATE_NET));

//         }
//         if (tbl6[0].CHARGETYPE == 'DC' && tbl6[0].RATE_TAR_FRT == 'PP' && this.EDIT_CHARGETYPE == 'DA' && this.EDIT_RATE_TAR_FRT == 'PP') {
//             this.Pptotcarr_Selling = Math.abs(this.Pptotcarr_Selling) + Math.abs(tbl6[0].RATE_NET);
//             this.Pptot_Selling = (Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET));
//             this.Pptotagt_Selling = (Math.abs(this.Pptotagt_Selling)) - Math.abs(this.EDIT_RATE_NET);

//             // this.Pptot_Selling=(Math.abs(this.Pptot_Selling)- Math.abs(this.EDIT_RATE_NET)) ;
//             // this.Cctot_Selling=Math.abs(this.Cctot_Selling) - Math.abs(tbl6[0].RATE_NET);
//         }
//         if (tbl6[0].CHARGETYPE == 'DC' && tbl6[0].RATE_TAR_FRT == 'CC' && this.EDIT_CHARGETYPE == 'DA' && this.EDIT_RATE_TAR_FRT == 'CC') {
//             this.Pptotcarr_Selling = Math.abs(this.Pptotcarr_Selling) + Math.abs(tbl6[0].RATE_NET);
//             this.Pptot_Selling = (Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET));
//             this.Pptotagt_Selling = (Math.abs(this.Pptotagt_Selling)) - Math.abs(this.EDIT_RATE_NET);

//         }
//         if (tbl6[0].CHARGETYPE == 'DC' && tbl6[0].RATE_TAR_FRT == 'PP' && this.EDIT_CHARGETYPE == 'DA' && this.EDIT_RATE_TAR_FRT == 'CC') {

//             this.Pptotcarr_Selling = Math.abs(this.Pptotcarr_Selling) + Math.abs(tbl6[0].RATE_NET);
//             this.Pptot_Selling = Math.abs(this.Pptot_Selling) + Math.abs(tbl6[0].RATE_NET);
//             this.Cctotagt_SellingInr = Math.abs(this.Cctotagt_SellingInr) - Math.abs(this.EDIT_RATE_NET);
//             this.Cctot_Selling = Math.abs(this.Cctot_Selling) - Math.abs(this.EDIT_RATE_NET);
//         }
//     }
//     // fn_CalculateAlCharges_PPCC(tbl6){

//     //     if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='PP' && this.EDIT_CHARGETYPE=='DA')
//     //     {
//     //      this.Pptotagt_Selling=(Math.abs(this.Pptotagt_Selling) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
//     //      this.Pptot_Selling=(Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET) ) +  Math.abs(tbl6[0].RATE_NET);
//     //     }
//     //     if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='PP' && this.EDIT_CHARGETYPE=='DC')
//     //     {
//     //      this.Pptotagt_Selling=(Math.abs(this.Pptotagt_Selling)) + Math.abs(tbl6[0].RATE_NET);
//     //      this.Pptotcarr_Selling=(Math.abs(this.Pptotcarr_Selling) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
//     //      this.Pptot_Selling=(Math.abs(this.Pptot_Selling) - Math.abs(this.EDIT_RATE_NET));
//     //     }
//     //     if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DA')
//     //     {
//     //      this.Cctotagt_SellingInr=(Math.abs(this.Cctotagt_SellingInr) - Math.abs(this.EDIT_RATE_NET))  + Math.abs(tbl6[0].RATE_NET);
//     //      this.Cctot_Selling=(Math.abs(this.Cctot_Selling) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(tbl6[0].RATE_NET);
//     //     }
//     //     if(tbl6[0].CHARGETYPE=='DA' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DC')
//     //     {

//     //         this.Cctotagt_SellingInr=(Math.abs(this.Cctotagt_SellingInr)+  Math.abs(tbl6[0].RATE_NET)) ;
//     //         this.Cctotcarr_SellingInr=Math.abs(this.Cctotcarr_SellingInr) - Math.abs(this.EDIT_RATE_NET) ;
//     //         this.Cctot_Selling=Math.abs(this.Cctot_Selling) - Math.abs(tbl6[0].RATE_NET);
//     //     }
//     //     if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='PP' && this.EDIT_CHARGETYPE=='DC')
//     //     {
//     //      this.Pptotcarr_Selling=(Math.abs(this.Pptotcarr_Selling) -Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
//     //      this.Pptot_Selling=(Math.abs(tbl6[0].Pptot_Selling) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(tbl6[0].RATE_NET);
//     //     }
//     //     if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DC')
//     //     {
//     //      this.Cctotcarr_SellingInr=(Math.abs(this.Cctotcarr_SellingInr) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(tbl6[0].RATE_NET);
//     //      this.Cctot_Selling=(Math.abs(this.Cctot_Selling) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(tbl6[0].RATE_NET);
//     //     }
//     //     if(tbl6[0].CHARGETYPE=='DC' && tbl6[0].RATE_TAR_FRT=='CC' && this.EDIT_CHARGETYPE=='DA')
//     //     {
//     //      this.Cctotcarr_SellingInr=Math.abs(this.Cctotcarr_SellingInr) + Math.abs(tbl6[0].RATE_NET);
//     //      this.Cctotagt_SellingInr=(Math.abs(this.Cctotagt_SellingInr)- Math.abs(this.EDIT_RATE_NET)) ;
//     //      this.Cctot_Selling=Math.abs(this.Cctot_Selling) - Math.abs(tbl6[0].RATE_NET);
//     //     }
//     // }
//     ResetHAWBCharges() {
//         this.CHARGETYPE = undefined;
//         this.CHARGENAME = "";
//         this.RATE_TAR = "";
//         this.RATE_TAR_FRT = "";
//         this.RATE_NET = "";
//         this.RATE_NET_FRT = "";
//         this.txtchild = "Add";
//         this.CHRGDETAILSID = "0";
//         this.PK_ID = "0"
//         this.EDIT_CHARGETYPE = undefined;

//     }
//     Editchildrecd(id) {
//         let filterData = this.Chargeslist.filter((filter) => filter.PK_ID == id)[0];
//         //this.fk=filterData.ID;
//         this.PK_ID = filterData.PK_ID,
//             this.FK_ID = filterData.FK_ID,
//             this.CHARGETYPE = filterData.CHARGETYPE;
//         this.CHRGDETAILSID = filterData.FK_CHRGDETAILSID;
//         this.AirLineCharges = this.AllAirLineChargeslist.filter((code: any) => code.DataValueField.split("|")[1] === this.CHARGETYPE);
//         this.CHARGENAME = filterData.FK_CHARGEID + '|' + filterData.CHARGETYPE;
//         this.RATE_TAR = filterData.RATE_TAR;
//         this.RATE_TAR_FRT = filterData.RATE_TAR_FRT;
//         this.RATE_NET = filterData.RATE_NET;
//         this.RATE_NET_FRT = filterData.RATE_NET_FRT;
//         this.EDIT_RATE_TAR = filterData.RATE_TAR;
//         this.EDIT_RATE_NET = filterData.RATE_NET;
//         this.EDIT_CHARGETYPE = filterData.CHARGETYPE;
//         this.EDIT_RATE_TAR_FRT = filterData.RATE_TAR_FRT;
//         // this.EDIT_RATE_NET_FRT=filterData.RATE_NET_FRT;
//         this.txtchild = "Update";
//     }
//     deletechildrecd(id, chrgdtlsid) {

//         if (confirm('Are you sure want to delete the record ?')) {
//             this._loaderService.display(true);
//             const jsondelete = { ID: id, VGUID: this._loginService.getLogin()[0].GUID, FK_CHRGDTLSID: chrgdtlsid }
//             this._dataService.getData("Export/EXPT_HAWB_PRINT_RATE_AIRLINE_CHARGES_TMP_DEL", jsondelete)
//                 .subscribe((data: any) => {

//                     if (data.Table[0].STATUS == "100") {
//                         this.Chargeslist = data.Table
//                         this.DELCHARGETYPE = data.Table1[0].CHARGETYPE;
//                         this.DEL_RATE_TAR = data.Table1[0].RATE_TAR;
//                         this.DEL_RATE_TAR_FRT = data.Table1[0].RATE_TAR_FRT;
//                         this.DEL_RATE_NET = data.Table1[0].RATE_NET;
//                         this.DEL_RATE_NET_FRT = data.Table1[0].RATE_NET_FRT;
//                         if (this.DELCHARGETYPE == 'DA' && this.DEL_RATE_TAR_FRT == 'PP') {
//                             this.Pptotagt_Selling = (Math.abs(this.Pptotagt_Selling) - Math.abs(this.DEL_RATE_TAR));
//                             this.Pptot_Selling = (Math.abs(this.Pptot_Selling) - Math.abs(this.DEL_RATE_NET));
//                         }

//                         if (this.DELCHARGETYPE == 'DA' && this.DEL_RATE_TAR_FRT == 'CC') {
//                             this.Cctotagt_SellingInr = (Math.abs(this.Cctotagt_SellingInr) - Math.abs(this.DEL_RATE_TAR));
//                             this.Cctot_Selling = (Math.abs(this.Cctot_Selling) - Math.abs(this.DEL_RATE_NET));
//                         }
//                         if (this.DELCHARGETYPE == 'DC' && this.DEL_RATE_TAR_FRT == 'PP') {
//                             this.Pptotcarr_Selling = (Math.abs(this.Pptotcarr_Selling) - Math.abs(this.DEL_RATE_TAR));
//                             this.Pptot_Selling = (Math.abs(this.Pptot_Selling) - Math.abs(this.DEL_RATE_NET));
//                         }
//                         if (this.DELCHARGETYPE == 'DC' && this.DEL_RATE_TAR_FRT == 'CC') {
//                             this.Cctotcarr_SellingInr = (Math.abs(this.Cctotcarr_SellingInr) - Math.abs(this.DEL_RATE_TAR));
//                             this.Cctot_Selling = (Math.abs(this.Cctot_Selling) - Math.abs(this.DEL_RATE_NET));
//                         }
//                         this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT);
//                         this._loaderService.display(false);
//                     }
//                     else {
//                         this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT);
//                         this._loaderService.display(false);
//                     }
//                 });
//         }
//         else {
//             return false;
//             this._loaderService.display(false);
//         }
//     }

//     changeNetRate(rate1) {
//         this.RATE_NET = rate1;
//     }
//     changeNetFreight(frt1) {
//         this.RATE_NET_FRT = frt1
//     }

//     GetChrges(chrgtype) {
//         this.AirLineCharges = this.AllAirLineChargeslist.filter((code: any) => code.DataValueField.split("|")[1] === chrgtype);
//     }
//     validate() {
//         if (this.ISAUTO_FRT_INV == "1") { alert("HAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This HAWB !!"); return false; }
//         else { this.fnUpdate_HAWB_FREIGHT(); }
//     }
// }


@Component({
    selector: 'app-consignment-job-edit',
    templateUrl: 'consign_main_job_rating.component.html',
    // styleUrls: ['../../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'],
    // encapsulation: ViewEncapsulation.None
})
export class JobEditComponent implements OnChanges {

    @Input() exptno: any;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();

    rateList: any = [];
    currencyList: any = [{ VALUEFIELD: 'INR', TEXTFIELD: 'INR' }];

    Wgt: any = '';
    GrossWeight: any = '';
    FreightRate: any = 'PP';
    PrepaidPercent: any = null;
    CollectPer: any = '';

    FreightChargeble: any = '';
    FrtSell: any = 'FREIGHT(ALL INCLUSIVE)';
    RateAgreedby: any = '';
    RateAgreedOn: any = '';
    TxtExchRate: any = '';
    DrpExchRate: any = null;
    InrRate: any = '';

    RateFreightPayOn: any = 'CW';
    RateFreight: any = '';
    Ppchrg_Selling: any = '';
    Ccchrg_Selling: any = '';
    Ccchrg_SellingCur: any = 'INR';
    Ccchrg_SellingInr: any = '';

    RateFscPayOn: any = null;
    RateFsc: any = '';
    PpFsc_Selling: any = '';
    CcFsc_Selling: any = '';
    CcFsc_SellingCur: any = 'INR';
    CcFsc_SellingInr: any = '';

    RateIrcPayOn: any = null;
    RateIrc: any = '';
    PpIrc_Selling: any = '';
    CcIrc_Selling: any = '';
    CcIrc_SellingCur: any = 'INR';
    CcIrc_SellingInr: any = '';

    RateXrayPayOn: any = null;
    RateXray: any = '';
    PpXray_Selling: any = '';
    CcXray_Selling: any = '';
    CcXray_SellingCur: any = 'INR';
    CcXray_SellingInr: any = '';

    Pptotagt_Selling: any = '';
    Cctotagt_Selling: any = '';
    Cctotagt_SellingCur: any = 'INR';
    Cctotagt_SellingInr: any = '';

    Pptotcarr_Selling: any = '';
    Cctotcarr_Selling: any = '';
    Cctotcarr_SellingCur: any = 'INR';
    Cctotcarr_SellingInr: any = '';

    Pptot_Selling: any = '';
    Cctot_Selling: any = '';

    Othchrg_Selling: any = '';
    Remark: any = '';

    CurrencyPopulated: any = '';
    ErrorMessage: any = '';

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
        selectorHeight: '180px',
        selectorWidth: '200px'
    };

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) {
        this.exptno = this.exptno;
    }

    ngOnChanges() {




    }
    changeFunction() {

        console.log(this.type);
        this._loginService.verifyRights(246, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('Modify', data);
                this.setDropDownData();
                this.setData(this._sharedconsig.exportEditData.EXPTNO);
            });
    }

    setDropDownData() {
        this._loaderService.display(true);
        this._dataService.getData("Export/JOBFREIGHTRATE_FILL_DROPDOWN", '')
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.rateList = data.Table;
            });
    }

    setData(exptno) {
        const _jsonData = {
            Type1: this._loginService.getLogin()[0].CMP_USERENCCODE,
            Type2: exptno
        };
        this._loaderService.display(true);
        this._dataService.getData("Export/JobFreightRate_Populate_data", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.Wgt = data.Table1[0].CHRGWT;
                this.GrossWeight = data.Table1[0].GROSSWT;

                this.FreightRate = data.Table1[0].FREIGHT_RATE_PER_KG;
                this.PrepaidPercent = data.Table1[0].PREPAID_PER;
                this.CollectPer = data.Table1[0].COLLECT_PER;

                if (data.Table1[0].FREIGHT_CHARGABLE_AS == "AI") {
                    this.FreightChargeble = 1;
                }
                else if (data.Table1[0].FREIGHT_CHARGABLE_AS == "FS") {
                    this.FreightChargeble = 2;
                }

                this.RateAgreedby = data.Table1[0].RATE_AGREED_BY;
                this.RateAgreedOn = (data.Table1[0].RATE_AGREED_ON != "") ? this._dataService.stringdttoArry(data.Table1[0].RATE_AGREED_ON) : null;

                this.TxtExchRate = data.Table1[0].EXCH_RATE;
                if (data.Table1[0].EXCH_CUR != "" && data.Table1[0].EXCH_CUR != "0") {
                    this.DrpExchRate = data.Table1[0].EXCH_CUR;
                    this.changeCurrencyList(data.Table1[0].EXCH_CUR);
                }
                this.InrRate = data.Table1[0].INR_RATE;

                this.RateFreight = data.Table1[0].FREIGHT_RATE_BASIC;
                this.Ppchrg_Selling = data.Table1[0].PPCHRG_SELLING;
                this.Ccchrg_Selling = data.Table1[0].CCCHRG_SELLING;
                this.Ccchrg_SellingCur = data.Table1[0].CCCHRG_SELLING_CUR;
                this.Ccchrg_SellingInr = data.Table1[0].CCCHRG_SELLING_INR;

                this.RateFsc = data.Table1[0].FRT_RATE_SCHRG_FSC;
                this.PpFsc_Selling = data.Table1[0].PP_SCHRG_FSC_SELL;
                this.CcFsc_Selling = data.Table1[0].CC_SCHRG_FSC_SELL;
                this.CcFsc_SellingInr = data.Table1[0].CC_SCHRG_FSC_SELL_INR;

                this.CcFsc_SellingCur = (data.Table1[0].CC_SCHRG_FSC_SELL_CUR != '') ? data.Table1[0].CC_SCHRG_FSC_SELL_CUR : 'INR';
                this.RateFscPayOn = (data.Table1[0].FRT_RATE_SCHRG_FSC_PO != '') ? data.Table1[0].FRT_RATE_SCHRG_FSC_PO : null;

                this.RateIrc = data.Table1[0].FRT_RATE_SCHRG_IRC;
                this.PpIrc_Selling = data.Table1[0].PP_SCHRG_IRC_SELL;
                this.CcIrc_Selling = data.Table1[0].CC_SCHRG_IRC_SELL;
                this.CcIrc_SellingInr = data.Table1[0].CC_SCHRG_IRC_SELL_INR;

                this.CcIrc_SellingCur = (data.Table1[0].CC_SCHRG_IRC_SELL_CUR != '') ? data.Table1[0].CC_SCHRG_IRC_SELL_CUR : 'INR';
                this.RateIrcPayOn = (data.Table1[0].FRT_RATE_SCHRG_IRC_PO != '') ? data.Table1[0].FRT_RATE_SCHRG_IRC_PO : null;

                this.RateXray = data.Table1[0].FRT_RATE_SCHRG_XRAY;
                this.PpXray_Selling = data.Table1[0].PP_SCHRG_XRAY_SELL;
                this.CcXray_Selling = data.Table1[0].CC_SCHRG_XRAY_SELL;
                this.CcXray_SellingInr = data.Table1[0].CC_SCHRG_XRAY_SELL_INR;

                this.CcXray_SellingCur = (data.Table1[0].CC_SCHRG_XRAY_SELL_CUR != '') ? data.Table1[0].CC_SCHRG_XRAY_SELL_CUR : 'INR';
                this.RateXrayPayOn = (data.Table1[0].FRT_RATE_SCHRG_XRAY_PO != '') ? data.Table1[0].FRT_RATE_SCHRG_XRAY_PO : null;

                this.Pptotagt_Selling = data.Table1[0].PPTOTAGT_SELLING;
                this.Cctotagt_Selling = data.Table1[0].CCTOTAGT_SELLING;
                this.Cctotagt_SellingInr = data.Table1[0].CCTOTAGT_SELLING_INR;
                this.Cctotagt_SellingCur = data.Table1[0].CCTOTAGT_SELLING_CUR;

                this.Pptotcarr_Selling = data.Table1[0].PPTOTCARR_SELLING;
                this.Cctotcarr_Selling = data.Table1[0].CCTOTCARR_SELLING;
                this.Cctotcarr_SellingInr = data.Table1[0].CCTOTCARR_SELLING_INR;
                this.Cctotcarr_SellingCur = data.Table1[0].CCTOTCARR_SELLING_CUR;

                this.Pptot_Selling = data.Table1[0].PPTOT_SELLING;
                this.Cctot_Selling = data.Table1[0].CCTOT_SELLING;

                this.Othchrg_Selling = data.Table1[0].OTHCHRG_SELLING;
                this.Remark = data.Table1[0].REMARK;
            });
    }

    changeFreightChargebleAs(fcType: number) {
        this.FreightChargeble = fcType;
        this.FrtSell = (fcType == 1) ? "FREIGHT (ALL INCLUSIVE)" : "FREIGHT (BASIC)";
        if (fcType == 1) {
            this.RateFsc = "";
            this.PpFsc_Selling = "";
            this.CcFsc_Selling = "";
            this.CcFsc_SellingCur = "INR";
            this.RateFscPayOn = null;

            this.RateIrc = "";
            this.PpIrc_Selling = "";
            this.CcIrc_Selling = "";
            this.CcIrc_SellingCur = "INR";
            this.RateIrcPayOn = null;

            this.RateXray = "";
            this.PpXray_Selling = "";
            this.CcXray_Selling = "";
            this.CcXray_SellingCur = "INR";
            this.RateXrayPayOn = null;
            this.fn_ClearSurchargeRates();
        }
    }

    fn_ChangePayableOn(ChargeType) {
        if (ChargeType == 'FSC' || ChargeType == null) {
            this.RateFsc = "";
            this.PpFsc_Selling = "";
            this.CcFsc_Selling = "";
            this.CcFsc_SellingCur = "INR";
        }
        else if (ChargeType == 'IRC' || ChargeType == null) {
            this.RateIrc = "";
            this.PpIrc_Selling = "";
            this.CcIrc_Selling = "";
            this.CcIrc_SellingCur = "INR";
        }
        else if (ChargeType == 'XRAY' || ChargeType == null) {
            this.RateXray = "";
            this.PpXray_Selling = "";
            this.CcXray_Selling = "";
            this.CcXray_SellingCur = "INR";
        }
        this.fnCalPP_JOBFreight();
        this.fnCalCC_JOBFreight();
    }

    fnCalPP_JOBFreight() {
        var PPCHRG, PPCHRGSURCHRG, PPTOTAGT, PPTOTCARR, PPTOT;
        var PP_SCHRG_FSC, PP_SCHRG_IRC, PP_SCHRG_XRAY
        PPCHRG = 0;
        PPCHRGSURCHRG = 0;
        PPTOTAGT = 0;
        PPTOTCARR = 0;
        PPTOT = 0;

        PPCHRG = Math.abs(this.Ppchrg_Selling);

        PP_SCHRG_FSC = Math.abs(this.PpFsc_Selling);
        PP_SCHRG_IRC = Math.abs(this.PpIrc_Selling);
        PP_SCHRG_XRAY = Math.abs(this.PpXray_Selling);

        PPTOTAGT = Math.abs(this.Pptotagt_Selling);
        PPTOTCARR = Math.abs(this.Pptotcarr_Selling);

        PPTOT = (PPCHRG) + (PP_SCHRG_FSC) + (PP_SCHRG_IRC) + (PP_SCHRG_XRAY) + (PPTOTAGT) + (PPTOTCARR);
        PPTOT = PPTOT.toFixed(2);
        this.Pptot_Selling = Math.abs(PPTOT);
    }

    fnCalCC_JOBFreight() {

        var CCCHRG, CCTOTAGT, CCTOTCARR, CCTOT, ExchRate;
        var CC_SCHRG_FSC, CC_SCHRG_IRC, CC_SCHRG_XRAY
        CCCHRG = 0;
        CCTOTAGT = 0;
        CCTOTCARR = 0;
        //CCTOT = 0;
        ExchRate = (Math.abs(this.InrRate) == 0 || Math.abs(this.TxtExchRate) == 0) ? 0 : Math.abs(this.InrRate) / Math.abs(this.TxtExchRate);
        CCCHRG = (this.Ccchrg_SellingCur != "INR") ? Math.abs(this.Ccchrg_Selling) * ExchRate : Math.abs(this.Ccchrg_Selling);
        CC_SCHRG_FSC = (this.CcFsc_SellingCur != "INR") ? Math.abs(this.CcFsc_Selling) * ExchRate : Math.abs(this.CcFsc_Selling);
        CC_SCHRG_IRC = (this.CcIrc_SellingCur != "INR") ? Math.abs(this.CcIrc_Selling) * ExchRate : Math.abs(this.CcIrc_Selling);
        CC_SCHRG_XRAY = (this.CcXray_SellingCur != "INR") ? Math.abs(this.CcXray_Selling) * ExchRate : Math.abs(this.CcXray_Selling);
        CCTOTAGT = (this.Cctotagt_SellingCur != "INR") ? Math.abs(this.Cctotagt_Selling) * ExchRate : Math.abs(this.Cctotagt_Selling);
        CCTOTCARR = (this.Cctotcarr_SellingCur != "INR") ? Math.abs(this.Cctotcarr_Selling) * ExchRate : Math.abs(this.Cctotcarr_Selling);
        CCCHRG = (this.Ccchrg_SellingCur != "INR") ? Math.abs(this.Ccchrg_Selling) * ExchRate : Math.abs(this.Ccchrg_Selling);
        CCCHRG = (this.Ccchrg_SellingCur != "INR") ? Math.abs(this.Ccchrg_Selling) * ExchRate : Math.abs(this.Ccchrg_Selling);
        CCCHRG = (this.Ccchrg_SellingCur != "INR") ? Math.abs(this.Ccchrg_Selling) * ExchRate : Math.abs(this.Ccchrg_Selling);

        CCCHRG = Math.abs(CCCHRG.toFixed(2));
        CC_SCHRG_FSC = Math.abs(CC_SCHRG_FSC.toFixed(2));
        CC_SCHRG_IRC = Math.abs(CC_SCHRG_IRC.toFixed(2));
        CC_SCHRG_XRAY = Math.abs(CC_SCHRG_XRAY.toFixed(2));
        CCTOTAGT = Math.abs(CCTOTAGT.toFixed(2));
        CCTOTCARR = Math.abs(CCTOTCARR.toFixed(2));

        this.Ccchrg_SellingInr = CCCHRG;
        this.CcFsc_SellingInr = CC_SCHRG_FSC;
        this.CcIrc_SellingInr = CC_SCHRG_IRC;
        this.CcXray_SellingInr = CC_SCHRG_XRAY;
        this.Cctotagt_SellingInr = CCTOTAGT;
        this.Cctotcarr_SellingInr = CCTOTCARR;

        CCTOT = (CCCHRG) + (CC_SCHRG_FSC) + (CC_SCHRG_IRC) + (CC_SCHRG_XRAY) + (CCTOTAGT) + (CCTOTCARR)
        CCTOT = CCTOT.toFixed(2)
        this.Cctot_Selling = Math.abs(CCTOT);
    }

    changePrepaidPercentage(ppType: number) {   //fn_ChangePrepaidPercentage  original function
        if (this.PrepaidPercent != null) {
            var Prepaid, Collect;
            Prepaid = Math.abs(ppType);
            Collect = 100 - Math.abs(Prepaid);
            this.CollectPer = Collect;
        }
        else {
            this.CollectPer = '';
        }
        this.clearCharges();
    }

    changeFreight(fType: string) {
        if (this.FreightRate != "PC") {
            this.PrepaidPercent = null;
            this.CollectPer = "";
        }
        this.clearCharges();
    }

    clearCharges() {
        this.RateFreight = '';
        this.Ccchrg_Selling = '';
        this.Ccchrg_SellingCur = 'INR';
        this.Ppchrg_Selling = '';

        this.RateFsc = '';
        this.PpFsc_Selling = '';
        this.CcFsc_Selling = '';
        this.CcFsc_SellingCur = 'INR';
        this.RateFscPayOn = '0';

        this.RateIrc = '';
        this.PpIrc_Selling = '';
        this.CcIrc_Selling = '';
        this.CcIrc_SellingCur = 'INR';
        this.RateIrcPayOn = '0';

        this.RateXray = '';
        this.PpXray_Selling = '';
        this.CcXray_Selling = '';
        this.CcXray_SellingCur = 'INR';
        this.RateXrayPayOn = '0';

        this.fnCalPP_JOBFreight();
        this.fnCalCC_JOBFreight();
    }

    fn_ClearSurchargeRates() {
        this.RateFsc = '';
        this.PpFsc_Selling = '';
        this.CcFsc_Selling = '';
        this.CcFsc_SellingCur = 'INR';
        this.RateFscPayOn = '0';

        this.RateIrc = '';
        this.PpIrc_Selling = '';
        this.CcIrc_Selling = '';
        this.CcIrc_SellingCur = 'INR';
        this.RateIrcPayOn = '0';

        this.RateXray = '';
        this.PpXray_Selling = '';
        this.CcXray_Selling = '';
        this.CcXray_SellingCur = 'INR';
        this.RateXrayPayOn = '0';
        this.fnCalPP_JOBFreight();
        this.fnCalCC_JOBFreight();
    }

    fn_ChangeRate_Basic() {
        if (this.RateFreight != "") {
            if (this.FreightRate == 'PP') {
                this.Ppchrg_Selling = (Math.abs(this.RateFreight) * Math.abs(this.Wgt)).toFixed(2);
                this.Ccchrg_Selling = "";
            }
            else if (this.FreightRate == 'CC') {
                this.Ccchrg_Selling = (Math.abs(this.RateFreight) * Math.abs(this.Wgt)).toFixed(2);
                this.Ppchrg_Selling = "";
            }
            else if (this.FreightRate == 'PC') {
                if (this.PrepaidPercent == null) {
                    alert("Please select Prepaid percentage.");
                    this.clearCharges();
                    return false;
                }
                this.Ppchrg_Selling = (((Math.abs(this.RateFreight) * Math.abs(this.Wgt)) * this.PrepaidPercent) / 100).toFixed(2);
                this.Ccchrg_Selling = (((Math.abs(this.RateFreight) * Math.abs(this.Wgt)) * this.CollectPer) / 100).toFixed(2);
            }
        }
        else {
            this.Ccchrg_Selling = "";
            this.Ppchrg_Selling = "";
        }
        this.fnCalPP_JOBFreight();
        this.fnCalCC_JOBFreight();
    }

    fn_ChangeRate_Surcharge(ChargeType) {
        if (ChargeType == 'FSC' || ChargeType == null) { this.fn_ChangeRate_Surcharge_Fsc(); }
        else if (ChargeType == 'IRC' || ChargeType == null) { this.fn_ChangeRate_Surcharge_Irc(); }
        else if (ChargeType == 'XRAY' || ChargeType == null) { this.fn_ChangeRate_Surcharge_Xray(); }
        this.fnCalPP_JOBFreight();
        this.fnCalCC_JOBFreight();
    }

    fn_ChangeRate_Surcharge_Fsc() {
        let Rate = this.RateFsc;
        if (Rate != "") {
            let FreightWtType = this.FreightRate;
            let PayableOn = this.RateFscPayOn;
            let Weight = 0;
            if (PayableOn == "CW") {
                Weight = this.Wgt;
            }
            else if (PayableOn == "GW") {
                Weight = this.GrossWeight;
            }
            else {
                alert("Please select Payable on.");
                this.RateFsc = "";
                this.PpFsc_Selling = "";
                this.CcFsc_Selling = "";
                return false;
            }

            if (FreightWtType == 'PP') {
                this.PpFsc_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
                this.CcFsc_Selling = "";
            }
            else if (FreightWtType == 'CC') {
                this.PpFsc_Selling = "";
                this.CcFsc_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
            }
            else if (FreightWtType == 'PC') {
                if (this.PrepaidPercent == null) {
                    alert("Please select Prepaid percentage.");
                    this.clearCharges();
                    return false;
                }
                let Total = 0;
                Total = (Math.abs(Rate) * Math.abs(Weight))
                this.PpFsc_Selling = ((Total * this.PrepaidPercent) / 100).toFixed(2);
                this.CcFsc_Selling = ((Total * this.CollectPer) / 100).toFixed(2);
            }
        }
        else {
            this.PpFsc_Selling = "";
            this.CcFsc_Selling = "";
        }
    }

    fn_ChangeRate_Surcharge_Irc() {
        let Rate = this.RateIrc;
        if (Rate != "") {
            let FreightWtType = this.FreightRate;
            let PayableOn = this.RateIrcPayOn;
            let Weight = 0;
            if (PayableOn == "CW") {
                Weight = this.Wgt;
            }
            else if (PayableOn == "GW") {
                Weight = this.GrossWeight;
            }
            else {
                alert("Please select Surcharge Payable on.");
                this.RateIrc = "";
                this.PpIrc_Selling = "";
                this.CcIrc_Selling = "";
                return false;
            }

            if (FreightWtType == 'PP') {
                this.PpIrc_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
                this.CcIrc_Selling = "";
            }
            else if (FreightWtType == 'CC') {
                this.PpIrc_Selling = "";
                this.CcIrc_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
            }
            else if (FreightWtType == 'PC') {
                if (this.PrepaidPercent == null) {
                    alert("Please select Prepaid percentage.");
                    this.clearCharges();
                    return false;
                }
                let Total = 0;
                Total = (Math.abs(Rate) * Math.abs(Weight))
                this.PpIrc_Selling = ((Total * this.PrepaidPercent) / 100).toFixed(2);
                this.CcIrc_Selling = ((Total * this.CollectPer) / 100).toFixed(2);
            }
        }
        else {
            this.PpIrc_Selling = "";
            this.CcIrc_Selling = "";
        }
    }

    fn_ChangeRate_Surcharge_Xray() {
        let Rate = this.RateXray;
        if (Rate != "") {
            let FreightWtType = this.FreightRate;
            let PayableOn = this.RateXrayPayOn;
            let Weight = 0;
            if (PayableOn == "CW") {
                Weight = this.Wgt;
            }
            else if (PayableOn == "GW") {
                Weight = this.GrossWeight;
            }
            else {
                alert("Please select Payable on.");
                this.RateXray = "";
                this.PpXray_Selling = "";
                this.CcXray_Selling = "";
                return false;
            }

            if (FreightWtType == 'PP') {
                this.PpXray_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
                this.CcXray_Selling = "";
            }
            else if (FreightWtType == 'CC') {
                this.PpXray_Selling = "";
                this.CcXray_Selling = (Math.abs(Rate) * Math.abs(Weight)).toFixed(2);
            }
            else if (FreightWtType == 'PC') {
                if (this.PrepaidPercent == null) {
                    alert("Please select Prepaid percentage.");
                    this.clearCharges();
                    return false;
                }
                let Total = 0;
                Total = (Math.abs(Rate) * Math.abs(Weight))
                this.PpXray_Selling = ((Total * this.PrepaidPercent) / 100).toFixed(2);
                this.CcXray_Selling = ((Total * this.CollectPer) / 100).toFixed(2);
            }
        }
        else {
            this.PpXray_Selling = "";
            this.CcXray_Selling = "";
        }
    }

    fnChkExchangeRate(srno, typ, val) {
        if (val != "INR") {
            if (Math.abs(this.TxtExchRate) == 0) {
                alert("Please enter Exch. Rate first.");
                this.setDefaultCurrencyCC(typ);
                return false;
            }
            if (Math.abs(this.InrRate) == 0) {
                alert("Please enter Exch. INR Rate first.");
                this.setDefaultCurrencyCC(typ);
                return false;
            }
        }
        this.fnCalCC_JOBFreight();
    }

    setDefaultCurrencyCC(typ) {
        if (typ == 1) { this.Ccchrg_SellingCur = "INR"; }
        else if (typ == 2) { this.CcFsc_SellingCur = "INR"; }
        else if (typ == 3) { this.CcIrc_SellingCur = "INR"; }
        else if (typ == 4) { this.CcXray_SellingCur = "INR"; }
        else if (typ == 5) { this.Cctotagt_SellingCur = "INR"; }
        else if (typ == 6) { this.Cctotcarr_SellingCur = "INR"; }
    }

    fnChkExchangeRateDrp() {
        if (Math.abs(this.TxtExchRate) == 0) {
            this.Ccchrg_SellingCur = "INR";
            this.CcFsc_SellingCur = "INR";
            this.CcIrc_SellingCur = "INR";
            this.CcXray_SellingCur = "INR";
            this.Cctotagt_SellingCur = "INR";
            this.Cctotcarr_SellingCur = "INR";
        } else if (Math.abs(this.InrRate) == 0) {
            this.Ccchrg_SellingCur = "INR";
            this.CcFsc_SellingCur = "INR";
            this.CcIrc_SellingCur = "INR";
            this.CcXray_SellingCur = "INR";
            this.Cctotagt_SellingCur = "INR";
            this.Cctotcarr_SellingCur = "INR";
        }
        this.fnCalCC_JOBFreight();
    }

    checkExchRateCurDrp(erType: string) {
        let ExchCur = erType;
        let NEW_VALUE = (ExchCur != null) ? ExchCur : "";

        this.changeCurrencyList(NEW_VALUE);
        this.fnCalCC_JOBFreight();
    }

    changeCurrencyList(val: string) {
        if (val != "") {
            this.currencyList = [{ VALUEFIELD: 'INR', TEXTFIELD: 'INR' }, { VALUEFIELD: val, TEXTFIELD: val }];
            this.Ccchrg_SellingCur = val;
            this.CcFsc_SellingCur = val;
            this.CcIrc_SellingCur = val;
            this.CcXray_SellingCur = val;
            this.Cctotagt_SellingCur = val;
            this.Cctotcarr_SellingCur = val;
        }
    }

    fnUpdate_JOB_FREIGHT() {
        let EXCH_RATE = Math.abs(this.TxtExchRate);
        let EXCH_CUR = (this.DrpExchRate != null) ? this.DrpExchRate : '';
        let INR_RATE = Math.abs(this.InrRate);

        if (EXCH_CUR != "0") {
            if (Math.abs(EXCH_RATE) == 0) {
                alert("Please enter Exch Rate.")
                return false;
            }
            if (Math.abs(INR_RATE) == 0) {
                alert("Please enter Exch Inr Rate.")
                return false;
            }
        }
        var answer = confirm("Are you sure you want to update Job Freight charges ?")
        if (answer == false) { return false; }


        let EXPTNO = this.exptno;
        let PPCHRG_SELLING = Math.abs(this.Ppchrg_Selling);
        let CCCHRG_SELLING = Math.abs(this.Ccchrg_Selling);
        let PPTOTAGT_SELLING = Math.abs(this.Pptotagt_Selling);
        let CCTOTAGT_SELLING = Math.abs(this.Cctotagt_Selling);
        let PPTOTCARR_SELLING = Math.abs(this.Pptotcarr_Selling);
        let CCTOTCARR_SELLING = Math.abs(this.Cctotcarr_Selling);
        let PPTOT_SELLING = Math.abs(this.Pptot_Selling);
        let CCTOT_SELLING = Math.abs(this.Cctot_Selling);
        let OTHCHRG_SELLING = this.Othchrg_Selling;

        let REMARK = this.Remark;

        let PP_SCHRG_FSC_SELL = Math.abs(this.PpFsc_Selling);
        let CC_SCHRG_FSC_SELL = Math.abs(this.CcFsc_Selling);
        let PP_SCHRG_IRC_SELL = Math.abs(this.PpIrc_Selling);
        let CC_SCHRG_IRC_SELL = Math.abs(this.CcIrc_Selling);
        let PP_SCHRG_XRAY_SELL = Math.abs(this.PpXray_Selling);
        let CC_SCHRG_XRAY_SELL = Math.abs(this.CcXray_Selling);

        let FREIGHT_RATE_PER_KG = this.FreightRate;
        let PREPAID_PER = this.PrepaidPercent;
        let COLLECT_PER = this.CollectPer;

        let FRT_RATE_SCHRG_FSC_PO = "",
            FRT_RATE_SCHRG_IRC_PO = "",
            FRT_RATE_SCHRG_XRAY_PO = "",
            FRT_RATE_SCHRG_FSC = "",
            FRT_RATE_SCHRG_IRC = "",
            FRT_RATE_SCHRG_XRAY = "",
            FREIGHT_CHARGABLE_AS = "";
        if (this.FreightChargeble == 1) {
            FREIGHT_CHARGABLE_AS = 'AI';
        }
        else if (this.FreightChargeble == 1) {
            FRT_RATE_SCHRG_FSC = this.RateFsc;
            FRT_RATE_SCHRG_IRC = this.RateIrc;
            FRT_RATE_SCHRG_XRAY = this.RateXray;
            FREIGHT_CHARGABLE_AS = 'FS';

            if (FRT_RATE_SCHRG_FSC != '')
                FRT_RATE_SCHRG_FSC_PO = (this.RateFscPayOn != null) ? this.RateFscPayOn : '';
            if (FRT_RATE_SCHRG_IRC != '')
                FRT_RATE_SCHRG_IRC_PO = (this.RateIrcPayOn != null) ? this.RateIrcPayOn : '';
            if (FRT_RATE_SCHRG_XRAY != '')
                FRT_RATE_SCHRG_XRAY_PO = (this.RateXrayPayOn != null) ? this.RateXrayPayOn : '';
        }

        let RATE_AGREED_BY = this.RateAgreedby;
        let RATE_AGREED_ON = (this.RateAgreedOn != null) ? this.RateAgreedOn.formatted : '';

        let FREIGHT_RATE_BASIC = this.RateFreight;


        if (FREIGHT_RATE_BASIC == '') { FREIGHT_RATE_BASIC = 0; }
        if (FRT_RATE_SCHRG_FSC == '') { FRT_RATE_SCHRG_FSC = '0'; }
        if (FRT_RATE_SCHRG_IRC == '') { FRT_RATE_SCHRG_IRC = '0'; }
        if (FRT_RATE_SCHRG_XRAY == '') { FRT_RATE_SCHRG_XRAY = '0'; }

        if (EXCH_CUR == "0") { EXCH_CUR = '' }

        let CCCHRG_SELLING_CUR = (this.Ccchrg_SellingCur != null) ? this.Ccchrg_SellingCur : '';
        let CC_SCHRG_FSC_SELL_CUR = (this.CcFsc_SellingCur != null) ? this.CcFsc_SellingCur : '';
        let CC_SCHRG_IRC_SELL_CUR = (this.CcIrc_SellingCur != null) ? this.CcIrc_SellingCur : '';
        let CC_SCHRG_XRAY_SELL_CUR = (this.CcXray_SellingCur != null) ? this.CcXray_SellingCur : '';
        let CCTOTAGT_SELLING_CUR = (this.Cctotagt_SellingCur != null) ? this.Cctotagt_SellingCur : '';
        let CCTOTCARR_SELLING_CUR = (this.Cctotcarr_SellingCur != null) ? this.Cctotcarr_SellingCur : '';

        let CCCHRG_SELLING_INR = Math.abs(this.Ccchrg_SellingInr);
        let CC_SCHRG_FSC_SELL_INR = Math.abs(this.CcFsc_SellingInr);
        let CC_SCHRG_IRC_SELL_INR = Math.abs(this.CcIrc_SellingInr);
        let CC_SCHRG_XRAY_SELL_INR = Math.abs(this.CcXray_SellingInr);
        let CCTOTAGT_SELLING_INR = Math.abs(this.Cctotagt_SellingInr);
        let CCTOTCARR_SELLING_INR = Math.abs(this.Cctotcarr_SellingInr);

        const _jsonData = {
            EXPTNO: EXPTNO,
            PPCHRG_SELLING: PPCHRG_SELLING,
            CCCHRG_SELLING: CCCHRG_SELLING,
            PPTOTAGT_SELLING: PPTOTAGT_SELLING,
            CCTOTAGT_SELLING: CCTOTAGT_SELLING,
            PPTOTCARR_SELLING: PPTOTCARR_SELLING,
            CCTOTCARR_SELLING: CCTOTCARR_SELLING,
            PPTOT_SELLING: PPTOT_SELLING,
            CCTOT_SELLING: CCTOT_SELLING,
            OTHCHRG_SELLING: OTHCHRG_SELLING,
            PP_SCHRG_FSC_SELL: PP_SCHRG_FSC_SELL,
            PP_SCHRG_IRC_SELL: PP_SCHRG_IRC_SELL,
            PP_SCHRG_XRAY_SELL: PP_SCHRG_XRAY_SELL,
            CC_SCHRG_FSC_SELL: CC_SCHRG_FSC_SELL,
            CC_SCHRG_IRC_SELL: CC_SCHRG_IRC_SELL,
            CC_SCHRG_XRAY_SELL: CC_SCHRG_XRAY_SELL,
            REMARK: REMARK,
            FREIGHT_RATE_PER_KG: FREIGHT_RATE_PER_KG,
            PREPAID_PER: PREPAID_PER,
            COLLECT_PER: COLLECT_PER,
            FREIGHT_CHARGABLE_AS: FREIGHT_CHARGABLE_AS,
            FRT_RATE_SCHRG_FSC_PO: FRT_RATE_SCHRG_FSC_PO,
            FRT_RATE_SCHRG_IRC_PO: FRT_RATE_SCHRG_IRC_PO,
            FRT_RATE_SCHRG_XRAY_PO: FRT_RATE_SCHRG_XRAY_PO,
            RATE_AGREED_BY: RATE_AGREED_BY,
            RATE_AGREED_ON: RATE_AGREED_ON,
            FREIGHT_RATE_BASIC: FREIGHT_RATE_BASIC,
            FRT_RATE_SCHRG_FSC: FRT_RATE_SCHRG_FSC,
            FRT_RATE_SCHRG_IRC: FRT_RATE_SCHRG_IRC,
            FRT_RATE_SCHRG_XRAY: FRT_RATE_SCHRG_XRAY,
            EXCH_RATE: EXCH_RATE,
            EXCH_CUR: EXCH_CUR,
            INR_RATE: INR_RATE,
            CCCHRG_SELLING_CUR: CCCHRG_SELLING_CUR,
            CC_SCHRG_FSC_SELL_CUR: CC_SCHRG_FSC_SELL_CUR,
            CC_SCHRG_IRC_SELL_CUR: CC_SCHRG_IRC_SELL_CUR,
            CC_SCHRG_XRAY_SELL_CUR: CC_SCHRG_XRAY_SELL_CUR,
            CCTOTAGT_SELLING_CUR: CCTOTAGT_SELLING_CUR,
            CCTOTCARR_SELLING_CUR: CCTOTCARR_SELLING_CUR,
            CCCHRG_SELLING_INR: CCCHRG_SELLING_INR,
            CC_SCHRG_FSC_SELL_INR: CC_SCHRG_FSC_SELL_INR,
            CC_SCHRG_IRC_SELL_INR: CC_SCHRG_IRC_SELL_INR,
            CC_SCHRG_XRAY_SELL_INR: CC_SCHRG_XRAY_SELL_INR,
            CCTOTAGT_SELLING_INR: CCTOTAGT_SELLING_INR,
            CCTOTCARR_SELLING_INR: CCTOTCARR_SELLING_INR,
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CmpId: this._loginService.getLogin()[0].CMPID,
            MakerIP: this._loginService.getLogin()[0].MAKERIP  //Change Later by MakerIp
        };
        this.disabledBtn.emit(true);
        this._loaderService.display(true);
        this._dataService.Common("Export/EXP_MST_EXPORT_JOBFREIGHTRATE_UPDATE", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.disabledBtn.emit(false);
                this.result.emit({ status: data.Table[0].STATUS.split('#')[0], message: data.Table[0].STATUS.split('#')[1] });
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });

    }

    validate() {
        this.fnUpdate_JOB_FREIGHT();
    }
}

//Start Cancel shipment
@Component({
    selector: 'app-consignment-cancel-shipemnt',
    template: `

                    <table class="table table-bordered table-striped table-sm-new">
                        <tbody>
                        <table class="table table-bordered table-striped table-sm-new">
							   <tbody>
								  <tr>
									 <td class="col-form-span-heading" colspan="4">General Details </td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Export No.</span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.exptno_view}}</span></td>
									 <td class="width150"><span class="col-form-span-label">Doc recd date </span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.DOC_RECD_DATE}}</span></td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">Shipper Name </span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{consigneeData.SHIPPER_NAME}}</span></td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">Consignee </span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{consigneeData.CONSIGNEE}}</span></td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">Invoice No.</span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.INV_NO}}</span></td>
									 <td class="width150"><span class="col-form-span-label">Invoice date </span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.INV_DATE}}</span></td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">GRI No.</span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.GRI_NO}}</span></td>
									 <td class="width150"><span class="col-form-span-label">GRI date </span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.GRI_DATE}}</span></td>
								  </tr>
                                   <tr>
									 <td class="width150"><span class="col-form-span-label">Total No. of Packages </span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.TOTAL_NO_OF_PACKAGES}}</span></td>
									 <td class="width150"><span class="col-form-span-label">Total No. of Pieces </span> </td>
									 <td><span class="col-form-span-label">{{consigneeData.TOTAL_NO_OF_PIECES}}</span></td>
								  </tr>
                                  <tr>
                                  <td class="width150"><span class="col-form-span-label">Orderno </span> </td>
                                  <td colspan="3"><span class="col-form-span-label">{{consigneeData.ORDERNO}}</span></td>

                               </tr>
                               <tr>
                               <td  colspan="4"><span class="col-form-span-label"><b>THIS CONSIGNMENT IS CANCELLED BY {{consigneeData.cmpusername}} </b> </span> </td>

                            </tr>
						</tbody>
					</table>
                `
})
export class CancelShipmentComponent implements OnInit {

    @Input() exptno: any;
    @Input() type: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();



    consigneeData: any = {
        EXPORT_NO: null,
        EXPT_EXPORTER: null,
        EXPT_CONSIGNEE: null,
        TOTAL_NO_OF_PACKAGES: null,
        TOTAL_NO_OF_PIECES: null,
        EXPT_VESSEL: null,
        DOC_RECD_DATE: null,
        INV_NO: null,
        INV_DATE: null,
        GRI_NO: null,
        GRI_DATE: null,
        EXPT_SHIPBILLTYPE: null,
        EXPT_FOB: null,
        TYPE_OF_PACKAGES: null,
        TYPE_OF_PIECES: null,
        GR_WT: null,
        NET_WT: null,
        VOLUME: null,
        SHIPPER_NAME: null,
        CONSIGNEE: null,
        ORDERNO: null,
        cmpusername: null,
        exptcancel: null,
        exptno_view: null,
    };

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this.setConsigneeData(this._sharedconsig.exportEditData.EXPTNO);
    }

    setConsigneeData(exptno) {
        const _jsonData = {
            Type1: exptno
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsigneeView", _jsonData)
            .subscribe((data: any) => {

                this.consigneeData = {
                    EXPORT_NO: data.Table[0].EXPORT_NO,
                    EXPT_EXPORTER: data.Table[0].EXPT_EXPORTER,
                    EXPT_CONSIGNEE: data.Table[0].EXPT_CONSIGNEE,
                    TOTAL_NO_OF_PACKAGES: data.Table[0].TOTAL_NO_OF_PACKAGES,
                    TOTAL_NO_OF_PIECES: data.Table[0].TOTAL_NO_OF_PIECES,
                    EXPT_VESSEL: data.Table[0].EXPT_VESSEL,
                    DOC_RECD_DATE: data.Table[0].DOC_RECD_DATE,
                    INV_NO: data.Table[0].INV_NO,
                    INV_DATE: data.Table[0].INV_DATE,
                    GRI_NO: data.Table[0].GRI_NO,
                    GRI_DATE: data.Table[0].GRI_DATE,
                    EXPT_SHIPBILLTYPE: data.Table[0].EXPT_SHIPBILLTYPE,
                    EXPT_FOB: data.Table[0].EXPT_FOB,
                    TYPE_OF_PACKAGES: data.Table[0].TYPE_OF_PACKAGES,
                    TYPE_OF_PIECES: data.Table[0].TYPE_OF_PIECES,
                    GR_WT: data.Table[0].GR_WT,
                    NET_WT: data.Table[0].NET_WT,
                    VOLUME: data.Table[0].VOLUME,
                    SHIPPER_NAME: data.Table[0].SHIPPER_NAME,
                    CONSIGNEE: data.Table[0].CONSIGNEE,
                    ORDERNO: data.Table[0].ORDERNO,
                    exptcancel: data.Table[0].exptcancel,
                    cmpusername: this._loginService.getLogin()[0].CMP_USERNAME,
                    exptno_view: data.Table[0].exptno_view,
                };
            });
    }




    cancel_update() {

        const _jsonData = {
            Type1: this.exptno,
            Type2: this._loginService.getLogin()[0].CMPID,
            Type3: this._loginService.getLogin()[0].CITYCODE,
            RoleType: this._loginService.getLogin()[0].CMPCODE,

        };
        this.disabledBtn.emit(true);
        this._loaderService.display(true);
        this._dataService.Common("Export/UpdateCancelshipment", _jsonData)
            .subscribe((data: any) => {
                this.disabledBtn.emit(false);
                this._loaderService.display(false);

                this.result.emit({ status: data.Table[0].STATUS, message: "THIS CONSINMENT CANCELED!." });
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });

    }
}