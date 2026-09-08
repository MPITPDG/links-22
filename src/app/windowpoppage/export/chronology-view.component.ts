import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { ActivatedRoute } from '@angular/router';
@Component({
	selector: 'app-consignment-chronology-view',
	template: `
            				<table class="table table-bordered table-sm-new bgwhite">
							   <tbody>
								  <tr>
									 <td class="col-form-span-heading centerlabel" colspan="6">CONSIGNMENT DETAILS (CHRONOLOGY)</td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">EXPORT NO </span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{exptno}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label">Doc Recd. Date </span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.EXPT_DOCRECD}}</span></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Approval Received on</span> </td>
									 <td><span class="col-form-span-label">{{chronData?.EXPTAPPDT}}</span></td>
									 <td class="width150"><span class="col-form-span-label">Approved by </span> </td>
									 <td><span class="col-form-span-label">{{chronData?.EXPTAPPWM}}</span></td>
								  </tr>
								   <tr>
									 <td colspan="4"><span class="col-form-span-label">CARGO RECEIPT DETAILS: </span> </td>
								  </tr>
								   <tr>
									 <td colspan="4">
                                        <table class="table table-bordered table-striped table-sm-new">
							                <tbody>
								                <tr>
                                                    <th><span class="col-form-span-label">No of Pkgs</span> </th>
									                <th><span class="col-form-span-label">Recd Date</span></th>
									                <th><span class="col-form-span-label">Recd Where</span></th>
									                <th><span class="col-form-span-label">Recd Locally</span></th>
                                                </tr>
								                <tr *ngFor="let obj of cargoRecdData">
									                <td><span class="col-form-span-label">{{obj.NOOFPKGS}}</span> </td>
									                <td><span class="col-form-span-label">{{obj.RECDDATE}}</span></td>
									                <td><span class="col-form-span-label">{{obj.RECDWHERE}}</span> </td>
									                <td><span class="col-form-span-label">{{obj.RECDLOCAL}}</span></td>
								                </tr>
								            </tbody>
							            </table>
                                    </td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Shipping Bill No. </span> </td>
									 <td><span class="col-form-span-label">{{chronData?.EXPT_SHIPBILLNO}}</span></td>
									 <td class="width150"><span class="col-form-span-label">Shipping Bill Date </span></td>
									 <td><span class="col-form-span-label">{{chronData?.EXPT_SHIPBILLDT}}</span></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Custom Cleared On </span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.EXPT_SHIPCUSTOM}}</span></td>
								  </tr>
								   <tr *ngIf="chronData?.EXPT_MODE != 'SEA'">
									 <td class="width150"><span class="col-form-span-label">Carted Date</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.CARTEDDT}}</span></td>
								  </tr>
								</tbody>
							</table>
                            <table class="table table-bordered table-sm-new bgwhite" *ngIf="chronData?.EXPT_MODE == 'SEA'">
							   <tbody>
								   <tr>
									 <th  class="col-form-span-heading" colspan="4"><span class="col-form-span-label">Carting Details</span></th>
								  </tr>
								   <tr>
									 <td colspan="4">
                                        <table class="table table-bordered table-sm-new">
							                <tbody>
								                <tr class="col-form-span-heading">
                                                    <th><span class="col-form-span-label">Carting Date</span> </th>
									                <th><span class="col-form-span-label">No.of Packages</span></th>
									                <th><span class="col-form-span-label">Remark</span></th>
                                                </tr>
								                <tr *ngFor="let obj of cartingData">
									                <td><span class="col-form-span-label">{{obj.CARTEDON}}</span> </td>
									                <td><span class="col-form-span-label">{{obj.NOOFPKG}}</span></td>
									                <td><span class="col-form-span-label">{{obj.REMARK}}</span> </td>
								                </tr>
								            </tbody>
							            </table>
                                     </td>
								  </tr>
								</tbody>
							</table>
                            <table class="table table-bordered table-sm-new  bgwhite">
							   <tbody>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Out - Of - Charge date</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.OUTCHARGEDT}}</span></td>
								  </tr>
								</tbody>
							</table>
                            <table class="table table-bordered table-sm-new bgwhite" *ngIf="chronData?.EXPT_MODE == 'SEA'">
							   <tbody>
								   <tr>
									 <td colspan="3"><span class="col-form-span-label">Container Loading at Origin Confirmation Date</span> </td>
									 <td class="width150"><span class="col-form-span-label">{{loadTrans?.EXPT_LOAD_DATE}}</span></td>
								  </tr>
								</tbody>
							</table>
                            <table class="table table-bordered table-sm-new bgwhite" *ngIf="chronData?.EXPT_MODE == 'SEA'">
							   <tbody>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">E.T.D. (SCHEDULED)</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.VSL_ETD}}</span></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">SAILED ON (ACTUAL)</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.VSL_ETD1}}</span></td>
								  </tr>
								</tbody>
							</table>
                            <table class="table table-bordered table-sm-new bgwhite" *ngIf="chronData?.EXPT_MODE == 'SEA'">
							   <tbody>
								   <tr *ngIf="loadTrans?.EXPT_TRANSPORT1 != ''">
									 <td  colspan="3"><span class="col-form-span-label">Container Loading at Transhipment Port1 Confirmation Date</span> </td>
									 <td class="width150"><span class="col-form-span-label">{{loadTrans?.EXPT_LOAD1_DATE}}</span></td>
								  </tr>
								   <tr *ngIf="loadTrans?.EXPT_TRANSPORT2 != ''">
									 <td colspan="3"><span class="col-form-span-label">Container Loading at Transhipment Port2 Confirmation Date</span> </td>
									 <td class="width150"><span class="col-form-span-label">{{loadTrans?.EXPT_LOAD2_DATE}}</span></td>
								  </tr>
								</tbody>
							</table>
                            <table class="table table-bordered table-sm-new bgwhite">
							   <tbody>
								   <tr *ngIf="chronData?.EXPT_MODE != 'SEA'">
									 <td class="width150"><span class="col-form-span-label">Flight Date</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.FLIGHTDT}}</span></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">EP Copy Recd Date</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.EPCOPYDT}}</span></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">EP Copy Sent to Client Date</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.EPCOPYSENTDT}}</span></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Prealert sent on</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.txtPrealertDate}}</span></td>
								  </tr>
								</tbody>
							</table>
                            <table class="table table-bordered table-sm-new bgwhite" *ngIf="destDocData.length > 0">
							   <tbody>
								   <tr>
									 <th colspan="4"><span class="col-form-span-label">DESTINATION DOCUMENTS RECEIVED :</span></th>
								  </tr>
								   <tr>
									 <td colspan="4">
                                        <table class="table table-bordered table-sm-new bgwhite">
							                <tbody>
								                <tr class="col-form-span-heading">
                                                    <th><span class="col-form-span-label"></span> </th>
									                <th><span class="col-form-span-label">List Of Documents</span></th>
									                <th><span class="col-form-span-label">Recd. Date</span></th>
                                                </tr>
								                <tr *ngFor="let obj of destDocData">
									                <td><span class="col-form-span-label">{{obj.ID}}</span> </td>
									                <td><span class="col-form-span-label">{{obj.DOCUMENT}}</span></td>
									                <td><span class="col-form-span-label">{{obj.RECDDT}}</span> </td>
								                </tr>
								            </tbody>
							            </table>
                                     </td>
								  </tr>
								</tbody>
							</table>
                            <table class="table table-bordered table-sm-new bgwhite">
							   <tbody>
								   <tr *ngIf="destDocData.length > 0">
									 <th colspan="4"><span class="col-form-span-label">DOCUMENT SENT TO CONSIGNEE :</span></th>
								  </tr>
								   <tr *ngIf="destDocData.length > 0">
									 <td class="width150"><span class="col-form-span-label">Date.</span> </td>
									 <td><span class="col-form-span-label">{{chronData?.DOCSENTDT}}</span></td>
									 <td class="width150"><span class="col-form-span-label">Courier No.</span></td>
									 <td><span class="col-form-span-label">{{chronData?.COURIERNO}}</span></td>
								  </tr>
								   <tr *ngIf="destDocData.length > 0">
									 <td class="width150"><span class="col-form-span-label">Remark</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.DESTDOCRMK}}</span></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Actual Arrival date</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.EXPT_ACT_ARRIVAL_DATE}}</span></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Delivery given date</span> </td>
									 <td colspan="3"><span class="col-form-span-label" *ngFor="let obj of deliveryData">{{chronData?.ACTUALDT}}</span></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">CC No.</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.EXPT_SHIPCCNO}}</span></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Marks & Numbers</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.MARKS_NUMBERS}}</span></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Quota validate date</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.EXPT_QUOTAVALIDDT}}</span></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Quota obtain date</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.EXPT_QUOTAOBTAINDT}}</span></td>
								  </tr>
								   <tr>
									 <td class="width150"><span class="col-form-span-label">Quota expiry date</span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{chronData?.EXPT_QUOTAEXPIRYDT}}</span></td>
								  </tr>
								</tbody>
							</table>

        `
})
export class ChronologyViewComponent implements OnInit {
	exptno: string;
	deliveryData: any;
	loadTrans: any;

	chronData: any;
	cartingData: any = [];
	cargoRecdData: any = [];
	destDocData: any = [];
	constructor(private _dataService: DataService,
		private _loginService: LoginService,
		private _toasterService: ToastCommonService,
		private _route: ActivatedRoute) {
	}

	ngOnInit() {
		this._route.params.subscribe(params => {
			this.exptno=params["exptno"];
			this.setChronologyData(params["exptno"]);

		});
	}

	setChronologyData(exptno) {
		const _jsonData = {
			Type1: exptno,
			Type2: this._loginService.getLogin()[0].CMPCODE,
			Type3: this._loginService.getLogin()[0].CITYCODE
		};
		this._dataService.Common("Export/ConsignmentChronologyView", _jsonData)
			.subscribe((data: any) => {
				//console.log(data);
				this.chronData = (data.Table[0] != undefined) ? data.Table[0] : null;
				this.cartingData = data.Table1;
				this.cargoRecdData = data.Table2;
				this.destDocData = (data.Table3 != undefined) ? data.Table3 : [];
			},
				(error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
				() => { });

		const _jsonData1 = {
			Type1: exptno,
			Type2: this._loginService.getLogin()[0].CMPID
		};
		this._dataService.Common("Export/ConsignmentView", _jsonData1)
			.subscribe((data: any) => {
				this.deliveryData = data.Table3;
				this.loadTrans = {
					EXPT_LOAD_DATE: data.Table2[0].LOADDT,
					EXPT_LOAD1_DATE: data.Table2[0].PORT1LOADDT,
					EXPT_LOAD2_DATE: data.Table2[0].PORT2LOADDT,
					EXPT_TRANSPORT1: data.Table2[0].TRANSPORT1,
					EXPT_TRANSPORT2: data.Table2[0].TRANSPORT2
				};
			},
				(error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
				() => { });
	}
}