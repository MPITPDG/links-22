import { Component, OnInit, Input, Output, EventEmitter, ViewChild, OnChanges} from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router} from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService'; 
import { LoaderService } from '../../../shared/service/loader.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-fcr-printview',
    // templateUrl: 'exp_prt_fcr_printview.component.html'
    template: `
                    <table class="table table-bordered table-striped table-sm-new bgwhite">
							<tr>
								<td colspan="5">
									<input type="text" name="bookingno" style="FONT-SIZE: 12px;font-family: Courier New;margin-left: 620px;" size="12" maxlength="10"   >
									<input type="text" name="fcrno" style="FONT-SIZE: 12px;font-family: Courier New;" size="12" maxlength="15" [(ngModel)]="FCRNO"    readonly >
								</td>
							</tr>							
							<tr>
								<td colspan="3"> Shipper (Name & Full Address) <br>
									<textarea name="shipper" style="FONT-SIZE: 12px;font-family: Courier New;"  rows="4" cols="40" [(ngModel)]="SHIPPER" > </textarea> 
								</td>
								<td  colspan="2"  >
									 
								</td>
							</tr>
							<tr>
								<td colspan="3"> Consignee (Name & Full Address/Non-Negotiable)<br>
									<textarea name="consignee" style="FONT-SIZE: 12px;font-family: Courier New; " rows="4" cols="40" [(ngModel)]="CONSIGNEE"> </textarea> 
                                </td>
                                <td  colspan="2"  >
									 
								</td>
							</tr>
							<tr>
								<td colspan="3"> Notify Party/Intermediate Consignee (Name & Full Address/Non-Negotiable)<br>
									<textarea name="notify" style="FONT-SIZE: 12px;font-family: Courier New;" rows="4" cols="40" [(ngModel)]="NOTIFYPARTY" > </textarea> 
								</td>
								<td colspan="2"> 
									<textarea name="expno" style="FONT-SIZE: 12px;font-family: Courier New;" rows="2" cols="20" [(ngModel)]="EXPNO" > </textarea> 									
								</td>
							</tr>
							<tr>
								<td colspan="2"> Intial Carriage <br>
									<input type="text" name="carriage" style="FONT-SIZE: 12px;font-family: Courier New; width:250px" size="10" id="carriage" [(ngModel)]="CARRIER"  maxlength="15">
								</td>
								<td colspan="1">  Place of Receipt<br>
									<input type="text" name="receipt" style="FONT-SIZE: 12px;font-family: Courier New;width:250px " size="10" maxlength="50"  [(ngModel)]="RECPTPLACE" >
								</td>
								<td  colspan="2" rowspan="3">For Delivery Apply to<br>
									<textarea name="applyto" style="FONT-SIZE: 12px;font-family: Courier New;width:250px" rows="5" cols="40"  [(ngModel)]="APPLYTO" > </textarea> 
								</td>
							</tr>
							<tr>
								<td colspan="2">  Export Carrier (Vessel Voyage)<br>
									<input type="text" name="vessel" style="FONT-SIZE: 12px;font-family: Courier New;" size="10" maxlength="50" [(ngModel)]="VESSEL"   >
								</td>
								<td colspan="1">  Port Of Loading<br>
									<input type="text" name="pol" style="FONT-SIZE: 12px;font-family: Courier New;" size="10" maxlength="50" [(ngModel)]="POL"  >
								</td>								
							</tr>
							<tr>
								<td colspan="2">  Port Of Discharge<br>
									<input type="text" name="discharge" style="FONT-SIZE: 12px;font-family: Courier New;" size="10" maxlength="50" [(ngModel)]="POD" >
								</td>
								<td colspan="1">  Place Of Delivery<br>
									<input type="text" name="delivery" style="FONT-SIZE: 12px;font-family: Courier New;" size="10" maxlength="50" [(ngModel)]="PODEL"  >    
								</td>								
							</tr>
							<tr>
								<td colspan="5">
                                <table class="table table-bordered table-striped table-sm-new bgwhite">
										<tr>											
											<td>Marks & Numbers<br>Container No. 
											</td>
											<td>No.of Pkgs  
											</td>
											<td>Description pkgs and Goods
											</td>
											<td>Grows Weight Kg
											</td>
											<td>Measurment CMR
											</td>
										</tr>
										<tr>
											<td>
												<textarea name="marks" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="14" wrap="OFF" id="marks" [(ngModel)]="MARKSANDNOS" > </textarea>
											</td>
											<td> 
												<textarea name="pkgs" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="9" wrap="OFF" [(ngModel)]="NOOFPKGS" > </textarea> 
											</td>
											<td> 
												<textarea name="desc" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="40" wrap="OFF"[(ngModel)]="ITCDESC"  > </textarea>
											</td>
											<td> 
												<textarea name="grwt" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="9" wrap="OFF" [(ngModel)]="GRWT"  >  </textarea>  
											</td>
											<td> 												
												<textarea name="cbm" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="9" wrap="OFF" [(ngModel)]="VOL"  > </textarea>  
											</td>
										</tr>
										<tr>
											<td colspan="2">Freight Rate Charges Weights and/orMeasurements(Subject to corrrection) 
											</td>
											<td >Prepaid
											</td>
											<td colspan="2" > Collect </td>											
										</tr>										
										<tr>
											<td colspan="2"> 
												<textarea name="freight" style="FONT-SIZE: 12px;font-family: Courier New;" rows="10" cols="28" wrap="OFF" [(ngModel)]="MISC" ></textarea>
											</td>
											<td  >
												<textarea name="prepaid" style="FONT-SIZE: 12px;font-family: Courier New;" rows="10" cols="10" wrap="OFF" [(ngModel)]="PP" ></textarea> 
											</td>
											<td colspan="2"> 
												<textarea name="collect" style="FONT-SIZE: 12px;font-family: Courier New;" rows="10" cols="10" wrap="OFF" [(ngModel)]="CC" ></textarea> 
											</td>	
										</tr>
										<tr>
											<td colspan="2"> Total Prepaid
											</td>
											<td>  
												<input type="text" name="totpp" style="FONT-SIZE: 12px;font-family: Courier New;" size="12" maxlength="15" [(ngModel)]="TOTPP" >
											</td>
											<td></td>
											<td rowspan="3">  
												<input type="text" name="placedt" style="FONT-SIZE: 12px;font-family: Courier New;" size="28" maxlength="50"  [(ngModel)]="PLACEDATE"  >
												<br>
												Date & place Issued
											</td>											
											<tr>
												<tr>
													<td colspan="2"> Total Collect
													</td>
													<td>  
													</td>
													<td>  
														<input type="text" name="totcc" style="FONT-SIZE: 12px;font-family: Courier New;" size="12" maxlength="15" [(ngModel)]="TOTCC"   >
													</td>
													<tr>
													</table>
												</td>
											</tr>
										</table>	

             
        `
})

export class printFCRPrintview implements OnInit {
    paramData: any = { FCRNO: null ,FcrType :null };
    private baseUrl: string = 'Export/Export_FCR_PRINTPREVIEW';
    //@Input() hbltype: string;
    hbltype : string;
    SHIPPER: any = "";
    CONSIGNEE: any = "";
    NOTIFYPARTY: any = "";
    FCRNO: any = "";
    FCRDT: any = "";
    APPLYTO: any = "";
    CARRIER: any = "";
    RECPTPLACE: any = "";
    VESSEL: any = "";
    POL: any = "";
    POD: any = false;
    PODEL: any = "";
    APPLYTO1: any = "";
    MARKSANDNOS: any = "";

    NOOFPKGS: any = "";
    ITCDESC: any = "";
    GRWT: any = "";
    VOL: any = "";
    MISC: any = "";
    PP: any = "";
    CC: any = "";
    TOTPP: any = "";
    TOTCC: any = "";
    PLACEDATE: any = "";
    EXPNO: any = false;

    Bltype: any = "";
    FCRDET: any;
    buttonStatus = false;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        //private _fcrsharedvataSerice: FcrSharedDataService,
        //private _fcrHbltypesharedvataSerice: FcrSharedDataService,
        private loaderService: LoaderService,
        private _route: ActivatedRoute,) {
    }
    ngOnInit()
    {
        this.loaderService.display(true);       
         //console.log("FCR NO. "+  params["exptno"]);

         this._route.params.subscribe(params => {
            this.paramData = {
                FCRNO: params["FCRNO"],
                FcrType: params["FcrType"]
            }
            })
          this.hbltype =this.paramData.FcrType;
        const jsonExport = { FCRNO: this.paramData.FCRNO };//'GOA103180016'
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {
                    this.FCRDET = data.Table;

                    this.SHIPPER = this.FCRDET[0].SHIPPER;
                    this.CONSIGNEE = this.FCRDET[0].CONSIGNEE;
                    this.NOTIFYPARTY = this.FCRDET[0].NOTIFYPARTY;
                    this.FCRNO = this.FCRDET[0].FCRNO;
                    this.FCRDT = this.FCRDET[0].FCRDT;
                    this.APPLYTO = this.FCRDET[0].APPLYTO;
                    this.CARRIER = this.FCRDET[0].CARRIER;
                    this.RECPTPLACE = this.FCRDET[0].RECPTPLACE;
                    this.VESSEL = this.FCRDET[0].VESSEL;
                    this.POL = this.FCRDET[0].POL;
                    this.POD = this.FCRDET[0].POD;
                    this.PODEL = this.FCRDET[0].PODEL;
                    this.APPLYTO1 = this.FCRDET[0].APPLYTO;
                    this.MARKSANDNOS = this.FCRDET[0].MARKSANDNOS;
                    this.NOOFPKGS = this.FCRDET[0].NOOFPKGS;
                    this.ITCDESC = this.FCRDET[0].ITCDESC;
                    this.GRWT = this.FCRDET[0].GRWT;
                    this.VOL = this.FCRDET[0].VOL;
                    this.MISC = this.FCRDET[0].MISC;
                    this.PP = this.FCRDET[0].PP;
                    this.CC = this.FCRDET[0].CC;
                    this.TOTPP = this.FCRDET[0].TOTPP;
                    this.TOTCC = this.FCRDET[0].TOTCC;
                    this.PLACEDATE = this.FCRDET[0].PLACEDATE;
                    this.EXPNO = this.FCRDET[0].EXPNO;
                    this._toasterService.toast('info', 'Complete', 'Data filled successfully');
                    this.loaderService.display(false);       
                } else {
                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                    this.loaderService.display(false);  
                }

            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.STATUSTEXT);
                this.loaderService.display(false);  
            },
            () => {
            });
    }
     

    printUpdate() {
        this.buttonStatus = true;
        this.loaderService.display(true); 
        this.baseUrl = 'Export/Export_FCR_PRINTUPDATE';
        const jsonExport = { SHIPPER: this.SHIPPER, CONSIGNEE: this.CONSIGNEE, NOTIFYPARTY: this.NOTIFYPARTY, CARRIER: this.CARRIER, APPLYTO: this.APPLYTO, VESSEL: this.VESSEL, POL: this.POL, POD: this.POD, PODEL: this.PODEL, MARKSANDNOS: this.MARKSANDNOS, NOOFPKGS: this.NOOFPKGS, ITCDESC: this.ITCDESC, GRWT: this.GRWT, VOL: this.VOL, MISC: this.MISC, PLACEDATE: this.PLACEDATE, PP: this.PP, CC: this.CC, TOTPP: this.TOTPP, TOTCC: this.TOTPP, RECPTPLACE: this.RECPTPLACE, EXPNO: this.EXPNO, FCRNo: this.FCRNO };
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {

                if (data.Table[0].STATUS == "100") {
                    this.FCRDET = data.Table1;

                    this.SHIPPER = this.FCRDET[0].SHIPPER;
                    this.CONSIGNEE = this.FCRDET[0].CONSIGNEE;
                    this.NOTIFYPARTY = this.FCRDET[0].NOTIFYPARTY;
                    this.FCRNO = this.FCRDET[0].FCRNO;
                    this.FCRDT = this.FCRDET[0].FCRDT;
                    this.APPLYTO = this.FCRDET[0].APPLYTO;
                    this.CARRIER = this.FCRDET[0].CARRIER;
                    this.RECPTPLACE = this.FCRDET[0].RECPTPLACE;
                    this.VESSEL = this.FCRDET[0].VESSEL;
                    this.POL = this.FCRDET[0].POL;
                    this.POD = this.FCRDET[0].POD;
                    this.PODEL = this.FCRDET[0].PODEL;
                    this.APPLYTO1 = this.FCRDET[0].APPLYTO;
                    this.MARKSANDNOS = this.FCRDET[0].MARKSANDNOS;
                    this.NOOFPKGS = this.FCRDET[0].NOOFPKGS;
                    this.ITCDESC = this.FCRDET[0].ITCDESC;
                    this.GRWT = this.FCRDET[0].GRWT;
                    this.VOL = this.FCRDET[0].VOL;
                    this.MISC = this.FCRDET[0].MISC;
                    this.PP = this.FCRDET[0].PP;
                    this.CC = this.FCRDET[0].CC;
                    this.TOTPP = this.FCRDET[0].TOTPP;
                    this.TOTCC = this.FCRDET[0].TOTCC;
                    this.PLACEDATE = this.FCRDET[0].PLACEDATE;
                    this.EXPNO = this.FCRDET[0].EXPNO

                    this._toasterService.toast('info', 'Complete', "Update successfully ");
                    this.loaderService.display(false); 

                } else {

                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                    this.loaderService.display(false); 
                }


            });
        this.buttonStatus = false;
    }
   /* Print() {
        this.buttonStatus = true;

        // this._fcrHbltypesharedvataSerice = this._fcrsharedvataSerice.fcrHbltypesharedData;
        // this._fcrsharedvataSerice.fcrsharedData = this._fcrsharedvataSerice.fcrsharedData;

        this._router.navigate(['/export/fcr/sea-bl-print']);
        this.buttonStatus = false;
    }*/


}

@Component({
    selector: 'app-mto-printview',
    // templateUrl: 'exp_prt_fcr_printview.component.html'
    template: `

    <table class="table table-bordered table-striped table-sm-new bgwhite">
							<tr>
								<td colspan="5"> </td>
							</tr>
							<tr>
								<td colspan="3"> Shipper   <br>
									<textarea name="shipper" style="FONT-SIZE: 12px;font-family: Courier New;"  rows="4" cols="40" [(ngModel)]="SHIPPER" > </textarea> 
								</td>
								<td colspan="2" >BL/MTD 
									<input type="text" name="bookingno" style="FONT-SIZE: 12px;font-family: Courier New; margin-left: 54px;" size="12" maxlength="10"   >
									<input type="text" name="fcrno" style="FONT-SIZE: 12px;font-family: Courier New;" size="12" maxlength="15" [(ngModel)]="FCRNO"    readonly >
									<br>Shipment Ref No
									<textarea name="sexptno" style="FONT-SIZE: 12px;font-family: Courier New;" rows="2" cols="20" [(ngModel)]="EXPNO" > </textarea> 
								</td>
							</tr>  
							<tr>
								<td colspan="3"> Consignee <br>
									<textarea name="consignee" style="FONT-SIZE: 12px;font-family: Courier New; " rows="4" cols="40" [(ngModel)]="CONSIGNEE"> </textarea> 
								</td>
								<td  colspan="2"   >
									 
								</td>
							</tr>
							<tr>
								<td colspan="3"> Notify Address<br>
									<textarea name="notify" style="FONT-SIZE: 12px;font-family: Courier New;" rows="4" cols="40" [(ngModel)]="NOTIFYPARTY" > </textarea> 
                                </td>	
                                <td  colspan="2"   >
									 
								</td>							      
							</tr>
							<tr>
								<td colspan="3">Place of receipt <br>
									<input type="text" name="carriage" style="FONT-SIZE: 12px;font-family: Courier New;width:250px " size="10" id="carriage" [(ngModel)]="CARRIER"  maxlength="50">
								</td>
								<td colspan="2">Place of Loading<br>
									<input type="text" name="receipt" style="FONT-SIZE: 12px;font-family: Courier New; ;width:250px" size="10" maxlength="50"  [(ngModel)]="RECPTPLACE" >
								</td>								
							</tr>
							<tr>
								<td colspan="2" >Port of Discharge<br>
									<input type="text" name="discharge" style="FONT-SIZE: 12px;font-family: Courier New;width:250px" size="10" maxlength="50" [(ngModel)]="POD" >									
								</td>
								<td>Place of Delivery<br>
									<input type="text" name="delivery" style="FONT-SIZE: 12px;font-family: Courier New;width:250px" size="10" maxlength="50" [(ngModel)]="PODEL"  >    									
								</td>	
								<td>  Mode of Transport<br>
									<input type="text" name="vessel" style="FONT-SIZE: 12px;font-family: Courier New;width:250px" size="10" maxlength="50" [(ngModel)]="VESSEL"   >
								</td>
								// <td>  Route/Place of transhipment<br>
								// 	<input type="text" name="pol" style="FONT-SIZE: 12px;font-family: Courier New;width:250px" size="10" maxlength="50" [(ngModel)]="POL"  >
								// </td>
							</tr>  
							<tr>
								<td colspan="5">
                                <table class="table table-bordered table-striped table-sm-new bgwhite">
										<tr>											
											<td>Container No. 
											</td>
											<td>Marks & Numbers
											</td>
											<td>No of pkgs Kind of pkgs <br> general description of goods
											</td>
											<td>Grows Weight
											</td>
											<td>Measurement
											</td>
										</tr>
										<tr>
											<td>
												<textarea name="marks" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="14" wrap="OFF" id="marks" [(ngModel)]="MARKSANDNOS" > </textarea>
											</td>
											<td> 
												<textarea name="pkgs" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="9" wrap="OFF" [(ngModel)]="NOOFPKGS" > </textarea> 
											</td>
											<td> 
												<textarea name="desc" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="40" wrap="OFF"[(ngModel)]="ITCDESC"  > </textarea>
											</td>
											<td> 
												<textarea name="grwt" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="9" wrap="OFF" [(ngModel)]="GRWT"  >  </textarea>  
											</td>
											<td> 												
												<textarea name="cbm" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="9" wrap="OFF" [(ngModel)]="VOL"  > </textarea>  
											</td>
										</tr>
										<tr>
											<td  colspan="2" >Freight Amount
											</td>
											<td >Freight Payable at
											</td>
											<td>No of Original BL/MTD(s) </td>	
											<td>Place and date of Issue </td>	
										</tr>										
										<tr>
											<td colspan="2"> 
												<textarea name="freight" style="FONT-SIZE: 12px;font-family: Courier New;height: 50px;" rows="10" cols="28" wrap="OFF" [(ngModel)]="MISC" ></textarea>
											</td>
											<td  >
												<textarea name="prepaid" style="FONT-SIZE: 12px;font-family: Courier New;height: 50px;width: 230px;" rows="10" cols="10" wrap="OFF" [(ngModel)]="PP" ></textarea> 
											</td>
											<td  > 
												<textarea name="collect" style="FONT-SIZE: 12px;font-family: Courier New;height: 30px;" rows="10" cols="10" wrap="OFF" [(ngModel)]="CC" ></textarea> 
											</td>	
											<td  > 
												<input type="text" name="placedt" style="FONT-SIZE: 12px;font-family: Courier New;height: 30px;" size="28" maxlength="50" [(ngModel)]="PLACEDATE" >
											</td>	
										</tr>										
										<tr>
											<td colspan="3"> Other Picture(if any)<br>
												<textarea name="others" style="FONT-SIZE: 12px;font-family: Courier New;" rows="4" cols="40" [(ngModel)]="APPLYTO"  ></textarea>
											</td>
											<td colspan="2"> </td>
										</tr>
									</table> 									
								</td>
							</tr> 
						</table>  
            
        `
})
export class PrintMTOprintview implements OnInit  {
    paramData: any = { FCRNO: null ,FcrType :null };
    private baseUrl: string = 'Export/Export_FCR_PRINTPREVIEW';
    //@Input() hbltype: string;
    hbltype: string;
    SHIPPER: any = "";
    CONSIGNEE: any = "";
    NOTIFYPARTY: any = "";
    FCRNO: any = "";
    FCRDT: any = "";
    APPLYTO: any = "";
    CARRIER: any = "";
    RECPTPLACE: any = "";
    VESSEL: any = "";
    POL: any = "";
    POD: any = "";
    PODEL: any = "";
    APPLYTO1: any = "";
    MARKSANDNOS: any = "";

    NOOFPKGS: any = "";
    ITCDESC: any = "";
    GRWT: any = "";
    VOL: any = "";
    MISC: any = "";
    PP: any = "";
    CC: any = "";
    TOTPP: any = "";
    TOTCC: any = "";
    PLACEDATE: any = "";
    EXPNO: any = "";

    Bltype: any = "";
    FCRDET: any;
    buttonStatus = false;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        // private _fcrsharedvataSerice: FcrSharedDataService,
        // private _fcrHbltypesharedvataSerice: FcrSharedDataService,
        private loaderService: LoaderService,
        private _route: ActivatedRoute,) {
    }
    ngOnInit()
    {
        this._route.params.subscribe(params => {
            this.paramData = {
                FCRNO: params["FCRNO"],
                FcrType: params["FcrType"]
            }
            })
          this.hbltype =this.paramData.FcrType;
        const jsonExport = { FCRNO: this.paramData.FCRNO };//'GOA106180004'
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {
                    this.FCRDET = data.Table;

                    this.SHIPPER = this.FCRDET[0].SHIPPER;
                    this.CONSIGNEE = this.FCRDET[0].CONSIGNEE;
                    this.NOTIFYPARTY = this.FCRDET[0].NOTIFYPARTY;
                    this.FCRNO = this.FCRDET[0].FCRNO;
                    this.FCRDT = this.FCRDET[0].FCRDT;
                    this.APPLYTO = this.FCRDET[0].APPLYTO;
                    this.CARRIER = this.FCRDET[0].CARRIER;
                    this.RECPTPLACE = this.FCRDET[0].RECPTPLACE;
                    this.VESSEL = this.FCRDET[0].VESSEL;
                    this.POL = this.FCRDET[0].POL;
                    this.POD = this.FCRDET[0].POD;
                    this.PODEL = this.FCRDET[0].PODEL;
                    this.APPLYTO1 = this.FCRDET[0].APPLYTO;
                    this.MARKSANDNOS = this.FCRDET[0].MARKSANDNOS;
                    this.NOOFPKGS = this.FCRDET[0].NOOFPKGS;
                    this.ITCDESC = this.FCRDET[0].ITCDESC;
                    this.GRWT = this.FCRDET[0].GRWT;
                    this.VOL = this.FCRDET[0].VOL;
                    this.MISC = this.FCRDET[0].MISC;
                    this.PP = this.FCRDET[0].PP;
                    this.CC = this.FCRDET[0].CC;
                    this.TOTPP = this.FCRDET[0].TOTPP;
                    this.TOTCC = this.FCRDET[0].TOTCC;
                    this.PLACEDATE = this.FCRDET[0].PLACEDATE;
                    this.EXPNO = this.FCRDET[0].EXPNO;

                    this._toasterService.toast('info', 'Complete', 'Data filled successfully');
                    this.loaderService.display(false); 
                } else {

                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                    this.loaderService.display(false); 
                }

            });
    }
    
    printUpdate() {
        this.buttonStatus = true;
        this.loaderService.display(true); 
        this.baseUrl = 'Export/Export_FCR_PRINTUPDATE';
        const jsonExport = { SHIPPER: this.SHIPPER, CONSIGNEE: this.CONSIGNEE, NOTIFYPARTY: this.NOTIFYPARTY, CARRIER: this.CARRIER, APPLYTO: this.APPLYTO, VESSEL: this.VESSEL, POL: this.POL, POD: this.POD, PODEL: this.PODEL, MARKSANDNOS: this.MARKSANDNOS, NOOFPKGS: this.NOOFPKGS, ITCDESC: this.ITCDESC, GRWT: this.GRWT, VOL: this.VOL, MISC: this.MISC, PLACEDATE: this.PLACEDATE, PP: this.PP, CC: this.CC, TOTPP: this.TOTPP, TOTCC: this.TOTPP, RECPTPLACE: this.RECPTPLACE, EXPNO: this.EXPNO, FCRNo: this.FCRNO };
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {

                if (data.Table[0].STATUS == "100") {
                    this.FCRDET = data.Table1;

                    this.SHIPPER = this.FCRDET[0].SHIPPER;
                    this.CONSIGNEE = this.FCRDET[0].CONSIGNEE;
                    this.NOTIFYPARTY = this.FCRDET[0].NOTIFYPARTY;
                    this.FCRNO = this.FCRDET[0].FCRNO;
                    this.FCRDT = this.FCRDET[0].FCRDT;
                    this.APPLYTO = this.FCRDET[0].APPLYTO;
                    this.CARRIER = this.FCRDET[0].CARRIER;
                    this.RECPTPLACE = this.FCRDET[0].RECPTPLACE;
                    this.VESSEL = this.FCRDET[0].VESSEL;
                    this.POL = this.FCRDET[0].POL;
                    this.POD = this.FCRDET[0].POD;
                    this.PODEL = this.FCRDET[0].PODEL;
                    this.APPLYTO1 = this.FCRDET[0].APPLYTO;
                    this.MARKSANDNOS = this.FCRDET[0].MARKSANDNOS;
                    this.NOOFPKGS = this.FCRDET[0].NOOFPKGS;
                    this.ITCDESC = this.FCRDET[0].ITCDESC;
                    this.GRWT = this.FCRDET[0].GRWT;
                    this.VOL = this.FCRDET[0].VOL;
                    this.MISC = this.FCRDET[0].MISC;
                    this.PP = this.FCRDET[0].PP;
                    this.CC = this.FCRDET[0].CC;
                    this.TOTPP = this.FCRDET[0].TOTPP;
                    this.TOTCC = this.FCRDET[0].TOTCC;
                    this.PLACEDATE = this.FCRDET[0].PLACEDATE;
                    this.EXPNO = this.FCRDET[0].EXPNO

                    this._toasterService.toast('info', 'Complete', "Update successfully ");
                    this.loaderService.display(false); 
                } else {

                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                    this.loaderService.display(false); 
                }
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                this.loaderService.display(false); 
            },
            () => {
            });
        this.buttonStatus = false;
    }
    // Print() {
    //     this.buttonStatus = true;

    //     this._fcrHbltypesharedvataSerice = this._fcrsharedvataSerice.fcrHbltypesharedData;
    //     this._fcrsharedvataSerice.fcrsharedData = this._fcrsharedvataSerice.fcrsharedData;

    //     this._router.navigate(['/export/fcr/sea-bl-print']);

    //     this.buttonStatus = false;
    // }
 

}


// @Component({
//     selector: 'app-printview',
//     templateUrl: 'exp_prt_fcr_printview.component.html'

// })
// export class ExptPrintview implements OnInit {
//     Type: any = "";
// 	buttonStatus = false;
//     @ViewChild(ExptFCRPrintview, {static: false}) public viewFCR: ExptFCRPrintview;
//     @ViewChild(ExptMTOprintview, {static: false}) public viewMTO: ExptMTOprintview;

//     constructor(
//         private _router: Router,
//         private _dataService: DataService,
//         private _auth: AuthService,
//         private _toasterService: ToastCommonService,
//         private _loginService: LoginService,
//         private _fcrsharedvataSerice: FcrSharedDataService,
//         private _fcrHbltypesharedvataSerice: FcrSharedDataService) {
//     }
//     ngOnInit(): void {
//         this.Type = this._fcrsharedvataSerice.fcrHbltypesharedData;//'M';
//     }

    

//     printUpdate() {
//         if (this.Type == "F") {
//             this.viewFCR.printUpdate();
//         }
//         else {
//             this.viewMTO.printUpdate();
//         }
//     }
//     Print() {
//         if (this.Type == "F") {
//             this.viewFCR.Print();
//         }
//         else {
//             this.viewMTO.Print();
//         }
//     }

// }