import { Component,  OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-clp-view',
    template: `
            				<table class="table table-bordered table-striped table-sm-new bgwhite">
							   <tbody>
								  <tr>
									 <td class="col-form-span-heading centerlabel" colspan="4">CONSIGNMENT DETAILS (CLP) </td>
								  </tr>
								  <tr>
									 <td class="width150" rowspan="3"><span class="col-form-span-label"><strong>Origin Vessel Details</strong> </span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.VSL_NAME}}</span></td>
								  </tr>
								  <tr>
									 <td colspan="3">
                                        <span class="col-form-span-label"><strong>Voyage: </strong> {{setData?.VSL_VOYNO}} </span>&nbsp;&nbsp;
                                        <span class="col-form-span-label"><strong>ETD: </strong>{{setData?.VSL_ETD}} </span>
                                    </td>
								  </tr>
								  <tr>
									 <td colspan="3">
                                        <span class="col-form-span-label"><strong>Loading Port: </strong>{{setData?.LOADING_PORT}} </span>&nbsp;&nbsp;
                                        <span class="col-form-span-label"><strong>Origin City: </strong> {{setData?.ORIGIN_CITY}}</span>
                                    </td>
                                  </tr>
								  <tr>
									 <td colspan="4"><span class="col-form-span-label"><strong>Container Loading at Origin Conformation Date :</strong> {{setData?.LOADDT}}</span></td>
								  </tr>
								  <tr *ngIf="setData?.IS_VSLDELAY == 'Y'">
									 <td colspan="4"><span class="col-form-span-label red">VESSEL DELAYED</span></td>
								  </tr>
								  <tr>
									 <td class="width150"></td>
									 <td colspan="3">
                                        <span class="col-form-span-label" *ngIf="setData?.DIRECTVSL == 'YES'"><strong>Direct Vessel</strong></span>
                                        <span class="col-form-span-label" *ngIf="setData?.DIRECTVSL != 'YES'"><strong>Transhipment Vessel</strong></span>
                                    </td>
								  </tr>
								  <tr>
									 <td colspan="4" class="col-form-span-label"><strong>TRANSHIPMENT DETAILS</strong></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>Name of The Port #1 </strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.TRAN_PORT1}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150" rowspan="3"><span class="col-form-span-label"><strong>Vessel #1 Details</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.TRAN1_VSL_NAME}}&nbsp;</span></td>
								  </tr>
								  <tr>
									 <td colspan="3">
                                        <span class="col-form-span-label"><strong>Voyage:</strong> {{setData?.VSL_VOYNO1}}</span>&nbsp;&nbsp;
                                        <span class="col-form-span-label"><strong>ETD: </strong>{{setData?.ETD1}}</span>
                                    </td>
								  </tr>
								  <tr>
									 <td colspan="3">
                                        <span class="col-form-span-label"><strong>ETA: </strong>{{setData?.ETA1}}</span>&nbsp;&nbsp;
                                    </td>
                                  </tr>
								  <tr>
									 <td colspan="4" class="col-form-span-label"><strong>Container Loading at Port #1 Conformation Date :</strong> {{setData?.LOADDT1}} </td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>Name of The Port #2</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.TRAN_PORT2}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150" rowspan="3"><span class="col-form-span-label"><strong>Vessel #2 Details</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.TRAN2_VSL_NAME}}&nbsp;</span></td>
								  </tr>
								  <tr>
									 <td colspan="3">
                                        <span class="col-form-span-label"><strong>Voyage: </strong>{{setData?.VSL_VOYNO2}}</span>&nbsp;&nbsp;
                                        <span class="col-form-span-label"><strong>ETD:</strong> {{setData?.ETD2}} </span>
                                    </td>
								  </tr>
								  <tr>
									 <td colspan="3">
                                        <span class="col-form-span-label"><strong>ETA: </strong>{{setData?.ETA2}}</span>&nbsp;&nbsp;
                                    </td>
                                  </tr>
								  <tr>
									 <td colspan="4" class="col-form-span-label"><strong>Container Loading at Port #2 Conformation Date : </strong>{{setData?.LOADDT2}}</td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>Shipping Line</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.LINER_NAME}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>Vessel Agent</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.AGENT_NAME}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>Container No.</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.CONTAINERNO}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>Container Size</strong></span></td>
									 <td><span class="col-form-span-label">{{setData?.CONTAINER_SIZE}}</span></td>
									 <td class="width150"><span class="col-form-span-label"><strong>Status of Container</strong></span></td>
									 <td><span class="col-form-span-label">{{setData?.CONTAINERSTATUS}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>Destination Port</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.DESTPORT}}</span></td>
								  </tr>
								  <tr *ngIf="destPortData.length > 0">
									 <td class="width150"></td>
									 <td colspan="3"><span class="col-form-span-label" *ngFor="let obj of destPortData">{{obj.DESTPORT1}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>Steamer Agent Seal no.</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.AGTSEALNO}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150">
                                        <span class="col-form-span-label" *ngIf="setData?.HSTUFFED != 'YES'"><strong>Stuffed At</strong></span>
                                        <span class="col-form-span-label" *ngIf="setData?.HSTUFFED == 'YES'"><strong>H. Stuffed At</strong></span>
                                     </td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.STUFF_WHERE}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>Custom Seal no.</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.CUSTSEALNO}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>Freight Type</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.FREIGHT}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>Freight</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.FREIGHT_CUR}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>BAF</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.BAF_CUR}}</span></td>
								  </tr>
								  <tr>
									 <td><span class="col-form-span-label">{{setData?.THCNAME}}</span></td>
									 <td><span class="col-form-span-label">{{setData?.THC_CUR}}</span></td>
									 <td><span class="col-form-span-label">{{setData?.OTHERNAME}}</span></td>
									 <td><span class="col-form-span-label">{{setData?.OTHERCUR}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>Remark</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.REMARK}}</span></td>
								  </tr>
								</tbody>
							</table>
                            <div class="row xscroll">
                                <table class="table table-bordered table-striped table-sm-new">
									<thead>
										<tr class="col-form-span-heading">
											<th class="width130 centerlabel"><span class="col-form-span-label"></span></th>
											<th class="centerlabel"><span class="col-form-span-label">CURRENCY</span></th>
											<th class="width75 centerlabel"><span class="col-form-span-label">VALUE</span></th>
											<th class="centerlabel"><span class="col-form-span-label">CURRENCY</span></th>
											<th class="width10 centerlabel"><span class="col-form-span-label"></span></th>
											<th class="width75 centerlabel"><span class="col-form-span-label">VALUE</span></th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td class="width130"><span class="col-form-span-label"><strong>ORIGIN PORT</strong></span></td>
											<td><span class="col-form-span-label">{{setData?.OCUR1}}</span></td>
											<td class="width75"><span class="col-form-span-OCURRATE1">{{setData?.OCURRATE1}}</span></td>
											<td><span class="col-form-span-label">{{setData?.OCUR2}}</span></td>
											<td class="width10 centerlabel"><span class="col-form-span-label">=</span></td>
											<td class="width75"><span class="col-form-span-label">{{setData?.OCURRATE2}}</span></td>
										</tr>
										<tr>
											<td class="width130"><span class="col-form-span-label"><strong>DEST. PORT</strong></span></td>
											<td><span class="col-form-span-label">{{setData?.DCUR1}}</span></td>
											<td class="width75"><span class="col-form-span-label">{{setData?.DCURRATE1}}</span></td>
											<td><span class="col-form-span-label">{{setData?.DCUR2}}</span></td>
											<td class="width10 centerlabel"><span class="col-form-span-label">=</span></td>
											<td class="width75"><span class="col-form-span-label">{{setData?.DCURRATE2}}</span></td>
										</tr>
									<tbody>
								</table>
                              </div>
                                <table class="table table-bordered table-sm-new" *ngIf="detailsData.length > 0">
								    <thead>
								        <tr>
									        <td class="width150 col-form-span-heading centerlabel" colspan="10">Consignment Details.</td>
								        </tr>
									    <tr class="col-form-span-heading">
										    <th class="centerlabel"><span class="col-form-span-label">Export No.</span></th>
										    <th class="centerlabel"><span class="col-form-span-label">Shipper</span></th>
										    <th class="centerlabel"><span class="col-form-span-label">Consignee</span></th>
										    <th class="centerlabel"><span class="col-form-span-label">No.Of Pcs</span></th>
										    <th class="centerlabel"><span class="col-form-span-label">No.Of Pkgs</span></th>
										    <th class="centerlabel"><span class="col-form-span-label">Gr. Wt.</span></th>
										    <th class="centerlabel"><span class="col-form-span-label">Net Wt.</span></th>
										    <th class="centerlabel"><span class="col-form-span-label">CBM</span></th>
										    <th class="centerlabel"><span class="col-form-span-label">Order No</span></th>
										    <th class="centerlabel"><span class="col-form-span-label">CLP Seq.</span></th>
									    </tr>
								    </thead>
							        <tbody>
                                        <ng-container *ngFor="let obj of detailsData">
								            <tr [ngClass]="(obj.IS_SAME_JOB=='Y')?'bghighlightblue':'default'">
									            <td rowspan="3"><span class="col-form-span-label">{{obj.EXPTNO}}</span></td>
											    <td><span class="col-form-span-label">{{obj.EXPORTER}}</span></td>
											    <td><span class="col-form-span-label">{{obj.CONSIGNEE}}</span></td>
											    <td><span class="col-form-span-label">{{obj.PCS}}</span></td>
											    <td><span class="col-form-span-label">{{obj.NOOFPKGS}}</span></td>
											    <td><span class="col-form-span-label">{{obj.GRWT}}</span></td>
											    <td><span class="col-form-span-label">{{obj.NETWT}}</span></td>
											    <td><span class="col-form-span-label">{{obj.CBM}}</span></td>
											    <td><span class="col-form-span-label">{{obj.ORDERNO}}</span></td>
											    <td><span class="col-form-span-label">{{obj.CLPSEQUENCE}}</span></td>
								            </tr>
								            <tr [ngClass]="(obj.IS_SAME_JOB=='Y')?'bghighlightblue':'default'">
											    <td><span class="col-form-span-label"><strong>Description</strong></span></td>
											    <td colspan="8"><div class="col-form-span-label" [innerHTML]="obj.ITC_DESC"></div></td>
								            </tr>
								            <tr [ngClass]="(obj.IS_SAME_JOB=='Y')?'bghighlightblue':'default'">
											    <td><span class="col-form-span-label"><strong>FCR No.</strong></span></td>
											    <td><span class="col-form-span-label">{{obj.FCR_NO}}</span></td>
											    <td><span class="col-form-span-label"><strong>FCR Date.</strong></span></td>
											    <td colspan="8"><span class="col-form-span-label">{{obj.FCR_DATE}}</span></td>
								            </tr>
                                        </ng-container>
                                    <tbody>
							    </table>
                                <table class="table table-bordered table-striped table-sm-new">
							       <tbody>
								      <tr>
									     <td class="col-form-span-label centerlabel red" colspan="4">
                                            <strong *ngIf="setData?.VERIFIED == 'Y'">VERIFIED</strong>
                                            <strong *ngIf="setData?.VERIFIED != 'Y'">NOT VERIFIED</strong>
                                        </td>
								      </tr>
								      <tr *ngIf="setData?.VERIFIED == 'Y'">
									     <td class="col-form-span-label centerlabel red" colspan="4">   
                                            <strong *ngIf="setData?.LOADDT != 'Y'">LOADING CONFIRMATION DONE</strong>  
                                            <strong *ngIf="setData?.LOADDT == 'Y'">LOADING CONFIRMATION NOT DONE</strong>
                                        </td>
								      </tr>
								      <tr>
									     <td class="col-form-span-label centerlabel" colspan="4"></td>
								      </tr>
								    </tbody>
							    </table>
        `
})
export class CLPViewComponent implements OnInit {

    setData: any = [];
    destPortData: any = [];
    detailsData: any = [];

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
		private _route: ActivatedRoute,
		private _loaderService: LoaderService) {
    }

    ngOnInit() {
        this._route.params.subscribe(params => {
            this.setCLPData(params["containerno"],params["vessel"],params["exptno"]);
        });
    }

    setCLPData(containerno, vessel, exptno) {
        const _jsonData = {
            Type1: containerno,
            Type2: vessel,
            Type3: exptno,
            Type4: this._loginService.getLogin()[0].CMPCODE,
            Type5: this._loginService.getLogin()[0].CITYCODE
		};
		this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentCLPView", _jsonData)
            .subscribe((data: any) => {
                this.setData = data.Table[0];
                this.destPortData = data.Table1;
				this.detailsData = data.Table2;
				this._loaderService.display(false);
            },
				(error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); 
				this._loaderService.display(false);},
                () => { });
    }
}