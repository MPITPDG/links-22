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
									 <td class="width150"><span class="col-form-span-label"><strong>Container No.</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label"><b>{{setData?.CONTAINERNO}}</b></span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>Container Size</strong></span></td>
									 <td><span class="col-form-span-label">{{setData?.CONTAINERSIZE}}</span></td>
									 <td class="width150"><span class="col-form-span-label"><strong>Status of Container</strong></span></td>
									 <td><span class="col-form-span-label">{{setData?.CONTAINERSTATUS}}</span></td>
                                  </tr>
                                  
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><strong>Destination Port</strong></span></td>
									 <td colspan="3"><span class="col-form-span-label">{{setData?.DESTPORT}}</span></td>
                                  </tr>
                                  <tr>
                                    <td class="width150"><span class="col-form-span-label"><strong>Steamer Agent Seal no.</strong></span></td>
                                    <td  ><span class="col-form-span-label">{{setData?.AGTSEALNO}}</span></td>
                                    <td class="width150"><span class="col-form-span-label"><strong>Custom Seal no.</strong></span></td>
                                    <td  ><span class="col-form-span-label">{{setData?.CUSTSEALNO}}</span></td>
                                  </tr>
                                  
                                  <tr>
                                    <td class="width150"><span class="col-form-span-label"><strong>Freight</strong></span></td>
                                    <td  ><span class="col-form-span-label">{{setData?.FREIGHTUSD}}</span></td>
                                    <td class="width150"><span class="col-form-span-label"><strong>BAF</strong></span></td>
                                    <td  ><span class="col-form-span-label">{{setData?.BAFCUR}}</span></td>
                                  </tr>
                                  
                                  <tr>
                                    <td class="width150"><span class="col-form-span-label"><strong>Remark</strong></span></td>
                                    <td colspan="3"><span class="col-form-span-label">{{setData?.REMARK}}</span></td>
                                  </tr>   
                                  <tr>
                                    <td  colspan="4"><span class="col-form-span-label"><strong>OHRER CHARGES</strong></span></td>
                                  </tr>
                                  <tr>
                                    <td ></td>
                                    <td colspan="4"><span class="col-form-span-label">{{setData?.OTHERAMT1}}</span></td>                                        
                                  </tr>
                                  <tr>
                                    <td></td>
                                    <td colspan="4"><span class="col-form-span-label">{{setData?.OTHERAMT1}}</span></td>
                                  </tr> 
                                  <tr>                                        
                                    <td colspan="4"><span class="col-form-span-label  centerlabel" *ngIf="DIRECTVSL=='DIRECT'"  ><b>{{setData?.DIRECTVSL}}</b></span></td>
                                  </tr>
                                  <ng-container  *ngIf="DIRECTVSL=='TRANSHIPMENT'" >
                                  <table class="table table-bordered table-striped table-sm-new">
                                    <tbody>
                                        <tr>                                        
                                            <td colspan="4"><span class="col-form-span-label centerlabel "  ><b>{{setData?.DIRECTVSL}}</b></span></td>
                                        </tr>
                                        <tr>
                                            <td class="width150"><span class="col-form-span-label"><strong>	Transhipment Port1</strong></span></td>
                                            <td><span class="col-form-span-label">{{setData?.TRANSHIPMENTPORT1}}</span></td>
                                            <td class="width150"><span class="col-form-span-label"><strong>Connecting Vessel1</strong></span></td>
                                            <td><span class="col-form-span-label">{{setData?.CONVESSEL1}}</span></td>
                                       </tr>
                                       <tr>
                                            <td class="width150"><span class="col-form-span-label"><strong>	Voyage No </strong></span></td>
                                            <td><span class="col-form-span-label">{{setData?.CONVESSEL1VOY1}}</span></td>
                                            <td class="width150"><span class="col-form-span-label"><strong> ETD(at transhipment port1)1</strong></span></td>
                                            <td><span class="col-form-span-label">{{setData?.ETDPORT1}}</span></td>
                                        </tr>
                                        <tr>
                                            <td class="width150"><span class="col-form-span-label"><strong>ETA</strong></span></td>
                                            <td colspan="3"><span class="col-form-span-label">{{setData?.ETA1}}</span></td>
                                        </tr>  
                                        <tr>
                                        <td class="width150"><span class="col-form-span-label"><strong>	Transhipment Port2</strong></span></td>
                                        <td><span class="col-form-span-label">{{setData?.TRANSHIPMENTPORT2}}</span></td>
                                        <td class="width150"><span class="col-form-span-label"><strong>Connecting Vessel2</strong></span></td>
                                        <td><span class="col-form-span-label">{{setData?.CONVESSEL2}}</span></td>
                                   </tr>
                                   <tr>
                                        <td class="width150"><span class="col-form-span-label"><strong>	Voyage No </strong></span></td>
                                        <td><span class="col-form-span-label">{{setData?.CONVESSEL1VOY2}}</span></td>
                                        <td class="width150"><span class="col-form-span-label"><strong> ETD(at transhipment port2)2</strong></span></td>
                                        <td><span class="col-form-span-label">{{setData?.ETDPORT2}}</span></td>
                                    </tr>
                                    <tr>
                                        <td class="width150"><span class="col-form-span-label"><strong>ETA</strong></span></td>
                                        <td colspan="3"><span class="col-form-span-label">{{setData?.ETA2}}</span></td>
                                    </tr>  
                                  </tbody>
                                   </table>
                                  </ng-container> 	
                                  <tr>
                                    <td class="width150"><span class="col-form-span-label"><strong>ETA</strong></span></td>
                                    <td colspan="3"><span class="col-form-span-label">{{setData?.ETA}}</span></td>
                                  </tr>							 
                                  <tr>                                        
                                  <td colspan="4"><span class="col-form-span-label" style="text-align: center;"><b> EXCHANGE RATES</b></span></td>
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
											<td><span class="col-form-span-label">{{setData?.OGN_CURR_NAME1}}</span></td>
											<td class="width75"><span class="col-form-span-OCURRATE1">{{setData?.OCURRATE1}}</span></td>
											<td><span class="col-form-span-label">{{setData?.OGN_CURR_NAME2}}</span></td>
											<td class="width10 centerlabel"><span class="col-form-span-label">=</span></td>
											<td class="width75"><span class="col-form-span-label">{{setData?.OCURRATE2}}</span></td>
										</tr>
										<tr>
											<td class="width130"><span class="col-form-span-label"><strong>DEST. PORT</strong></span></td>
											<td><span class="col-form-span-label">{{setData?.DEST_CURR_NAME1}}</span></td>
											<td class="width75"><span class="col-form-span-label">{{setData?.DCURRATE1}}</span></td>
											<td><span class="col-form-span-label">{{setData?.DEST_CURR_NAME2}}</span></td>
											<td class="width10 centerlabel"><span class="col-form-span-label">=</span></td>
											<td class="width75"><span class="col-form-span-label">{{setData?.DCURRATE2}}</span></td>
										</tr>
									<tbody>
								</table>
                              </div>
                                <table class="table table-bordered table-sm-new" *ngIf="jobdtls.length > 0">
								    <thead>
								        <tr>
									        <td class="width150 col-form-span-heading centerlabel" colspan="10">Consignment Details.</td>
								        </tr>
									    <tr class="col-form-span-heading">
										    <th class="centerlabel"><span class="col-form-span-label">Job No.</span></th>
										    <th class="centerlabel"><span class="col-form-span-label">NoofPkgs</span></th>										 
										    <th class="centerlabel"><span class="col-form-span-label">CBM</span></th>										 
										    <th class="centerlabel"><span class="col-form-span-label">CLP Seq.</span></th>
									    </tr>
								    </thead>
							        <tbody>
                                       
								            <tr *ngFor ="let obj of jobdtls">
									            <td  ><span class="col-form-span-label">{{obj.JOBNO}}</span></td>											
                                                <td><span class="col-form-span-label">{{obj.NOOFPKGS}}</span></td>	
                                                <td><span class="col-form-span-label">{{obj.CBM}}</span></td>											
											    <td><span class="col-form-span-label">{{obj.CLPSEQUENCE}}</span></td>
								            </tr>	
                                         
                                    </tbody>
							    </table>
                                
        `
})
export class ContainerjobviewComponent implements OnInit {

    setData: any = [];
    jobdtls: any = [];
    DIRECTVSL: any="";

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
		private _route: ActivatedRoute,
		private _loaderService: LoaderService) {
    }

    ngOnInit() {
        this._route.params.subscribe(params => {
            this.setCLPData(params["containerno"],params["consoleno"]);
        });
    }

    setCLPData(containerno, consoleno) {
        const _jsonData = {
            containerno: containerno,
            consoleno: consoleno            
		};
		this._loaderService.display(true);
        this._dataService.getData("Importfra/GetContainerjobview", _jsonData)
            .subscribe((data: any) => {
                this.setData = data.Table1[0];
                this.DIRECTVSL=data.Table1[0].DIRECTVSL;
                this.jobdtls = data.Table2;
				 
				this._loaderService.display(false);
            },
				(error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); 
				this._loaderService.display(false);},
                () => { });
    }
}