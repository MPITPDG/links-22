
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, OnChanges} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router} from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { FcrSharedDataService } from '../export-share-data.service';
import { LoaderService } from '../../shared/service/loader.service';
import { environment } from   '../../../environments/environment'; 
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
								<td  colspan="2"   >
									 
								</td>
							</tr>
							<tr>
								<td colspan="3"> Consignee (Name & Full Address/Non-Negotiable)<br>
									<textarea name="consignee" style="FONT-SIZE: 12px;font-family: Courier New; " rows="4" cols="40" [(ngModel)]="CONSIGNEE"> </textarea> 
                                </td>
                                <td  colspan="2"   >
									 
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
									<input type="text" name="carriage" style="FONT-SIZE: 12px;font-family: Courier New; width:250px" size="10" id="carriage" [(ngModel)]="CARRIER"  maxlength="50">
								</td>
								<td colspan="1">  Place of Receipt<br>
									<input type="text" name="receipt" style="FONT-SIZE: 12px;font-family: Courier New; width:250px" size="10" maxlength="50"  [(ngModel)]="RECPTPLACE" >
								</td>
								<td  colspan="2" rowspan="3">For Delivery Apply to<br>
									<textarea name="applyto" style="FONT-SIZE: 12px;font-family: Courier New;" rows="5" cols="40"  [(ngModel)]="APPLYTO" > </textarea> 
								</td>
							</tr>
							<tr>
								<td colspan="2">  Export Carrier (Vessel Voyage)<br>
									<input type="text" name="vessel" style="FONT-SIZE: 12px;font-family: Courier New;width:250px" size="10" maxlength="50" [(ngModel)]="VESSEL"   >
								</td>
								<td colspan="1">  Port Of Loading<br>
									<input type="text" name="pol" style="FONT-SIZE: 12px;font-family: Courier New;width:250px" size="10" maxlength="50" [(ngModel)]="POL"  >
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
                                <table class="table table-bordered table-striped table-sm-new bgwhite"  >
                                <tr>											
                                    <td  >Marks & Numbers<br>Container No.  </td>
                                    <td  >No.of Pkgs   </td>
                                    <td  >Description pkgs and Goods </td>
                                    <td  >Grows Weight Kg </td>
                                    <td  >Measurment CMR </td>
                                </tr>
                                <tr>
                                    <td  >
                                        <textarea name="marks" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="14" wrap="OFF" id="marks" [(ngModel)]="MARKSANDNOS" > </textarea>
                                    </td>
                                    <td  > 
                                        <textarea name="pkgs" style="FONT-SIZE: 12px;font-family: Courier New; " rows="16" cols="9" wrap="OFF" [(ngModel)]="NOOFPKGS" > </textarea> 
                                    </td>
                                    <td  > 
                                        <textarea name="desc" style="FONT-SIZE: 12px;font-family: Courier New;width:400px;" rows="16" cols="40" wrap="OFF"[(ngModel)]="ITCDESC"  > </textarea>
                                    </td>
                                    <td  > 
                                        <textarea name="grwt" style="FONT-SIZE: 12px;font-family: Courier New; " rows="16" cols="9" wrap="OFF" [(ngModel)]="GRWT"  >  </textarea>  
                                    </td>
                                    <td  > 												
                                        <textarea name="cbm" style="FONT-SIZE: 12px;font-family: Courier New " rows="16" cols="9" wrap="OFF" [(ngModel)]="VOL"  > </textarea>  
                                    </td>
                                </tr>
										<tr>
											<td colspan="2">Freight Rate Charges Weights and/orMeasurements(Subject to correction) 
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

export class ExptFCRPrintview implements OnChanges {
    private baseUrl: string = 'Export/Export_FCR_PRINTPREVIEW';
    @Input() hbltype: string;
    HBLTYPE_ACT: string="";
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
    ISPRINT:string="";
    DRAFTPRINT : string='';
    Rider :string="";
    SAILING_DT:string="";
    expressbill:boolean=false;
    printmsg:string="";
     expressbillval:string=""
     WaterMarkoption:boolean=false;
     watermarkval:string="0";
    public draftvisible  =true;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _fcrsharedvataSerice: FcrSharedDataService,
        private _fcrHbltypesharedvataSerice: FcrSharedDataService,
        private _fcrhblprinttype : FcrSharedDataService,
        private _fcrdraftvisible :FcrSharedDataService,
        private loaderService: LoaderService,) {
    }
    ngOnChanges()
    {
        this.loaderService.display(true);       
        console.log("FCR NO. "+this._fcrsharedvataSerice.fcrsharedData);
        const jsonExport = { FCRNO: this._fcrsharedvataSerice.fcrsharedData };//'GOA103180016'
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
                    this.ISPRINT=this.FCRDET[0].ISPRINT;
                    this.HBLTYPE_ACT=this.FCRDET[0].HBLTYPE;
                    this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
                    this.SAILING_DT=data.Table[0].SAILING;
                    if (this._loginService.getLogin()[0].CMPCODE=='01' || this._loginService.getLogin()[0].CMPCODE=='02') {
                        if(this.DRAFTPRINT =='3')
                        {  this.draftvisible= false ; }
                        else if ( this.ISPRINT=='1')
                        { this.draftvisible= false ; }
                        else  
                        { this.draftvisible= true ; }
                    }
                    else{
                        {  this.draftvisible= false ; }
                    }
                    this._fcrdraftvisible.fcrsharedData=this.draftvisible
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
    checkValue(event: any){
        console.log(event);
        if(event.target.checked)
        {
        this.expressbill=true
          }
        else
        {
            this.expressbill=false
        }
     }
     getwatermarkvalue(event: any){

        if(event.target.checked)
        {
        this.WaterMarkoption=true
        this.watermarkval="1"
          }
        else
        {
            this.WaterMarkoption=false
            this.watermarkval="0"
        }
     }
    printUpdate() {
        
        if  (this.ISPRINT=="1")
        {
            this._toasterService.toast('warning', 'warning', "You can`t update ,Print already taken ");            
        }
        else if  (this.DRAFTPRINT=="10")
        {
            this._toasterService.toast('warning', 'warning', "You can`t update ,Draft already taken 10 times");            
        }
        else
        {
        this.buttonStatus = true;
        this.loaderService.display(true); 
        this.baseUrl = 'Export/Export_FCR_PRINTUPDATE';
        const jsonExport = { SHIPPER: this.SHIPPER, CONSIGNEE: this.CONSIGNEE, NOTIFYPARTY: this.NOTIFYPARTY, CARRIER: this.CARRIER, APPLYTO: this.APPLYTO, VESSEL: this.VESSEL, POL: this.POL, POD: this.POD, PODEL: this.PODEL, MARKSANDNOS: this.MARKSANDNOS, NOOFPKGS: this.NOOFPKGS, ITCDESC: this.ITCDESC, GRWT: this.GRWT, VOL: this.VOL, MISC: this.MISC, PLACEDATE: this.PLACEDATE, PP: this.PP, CC: this.CC, TOTPP: this.TOTPP, TOTCC: this.TOTPP, RECPTPLACE: this.RECPTPLACE, EXPNO: this.EXPNO, FCRNo: this.FCRNO  ,UERNAME:this._loginService.getLogin()[0].CMPID, CITYCODE :this._loginService.getLogin()[0].CITYCODE,rider:this.Rider};
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
                    this.HBLTYPE_ACT=this.FCRDET[0].HBLTYPE;
                    this._toasterService.toast('info', 'Complete', "Update successfully ");
                    this.loaderService.display(false);

                } else {

                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                    this.loaderService.display(false); 
                }


            });
        this.buttonStatus = false;
        }
    }
    printDraft()
    {
        if(this.expressbill==true){
            alert('Please uncheck the express bill as you are taking draft print');
            return false;

        }
        if  (this.DRAFTPRINT=="10")
        {
            this._toasterService.toast('warning', 'warning', "You cannot take more than 10 draft ");
            
        }
        else
        {
            this.buttonStatus = true;
            // if (this.DRAFTPRINT=="0"){ 
            //     if (confirm(" Are you sure want to take the Draft, You have  3 draft is pending,  After No modification allowed " )) {
            //         const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'D'};
            //         this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
            //             .subscribe((data: any) => {
            //                 this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
            //                 this.ISPRINT=data.Table[0].ISPRINT;
            //                 });
            //             }
            //             else
            //             {return false}
            //     }
            // else if (this.DRAFTPRINT=="1"){ 
            //     if (confirm(" Are you sure want to take the Draft, You have  2 draft is pending,  After No modification allowed " )) {
            //         const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'D'};
            //         this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
            //             .subscribe((data: any) => {
            //                 this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
            //                 this.ISPRINT=data.Table[0].ISPRINT;
            //                 });
            //             }
            //             else
            //             {return false}
            // }
            // else 
            if (parseInt(this.DRAFTPRINT)<=9){  
                let printfraft ;
                printfraft= 10 -parseInt(this.DRAFTPRINT) 
            if (confirm(" Are you sure want to take the Draft, You have  "+printfraft+" draft is pending,  After No modification allowed" )) {
                const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'D'};
                this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
                    .subscribe((data: any) => {
                        this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
                        this.ISPRINT=data.Table[0].ISPRINT;
                        });
                    }
                    else
                    {return false}
            }           
      
        //let URL = "http://manilal.com/erp/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
        let URL = "http://180.179.207.163/linkserp-ac/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
                "huhpnk=" + this._loginService.getLogin()[0].GUID
                + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
                + "&Userid=" + this._loginService.getLogin()[0].CMPID
                + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
                + "&FCR=" +   this.FCRNO   
                + "&HBLType="+ this.HBLTYPE_ACT
                + "&CurLogInIP=" + environment.edocumentIp
                + "&Iswatermark=" + this.watermarkval
                window.open(URL, "_blank");
              }
              this.buttonStatus = false;
    }
    Print() {
        this.buttonStatus = true;
        this._fcrHbltypesharedvataSerice = this._fcrsharedvataSerice.fcrHbltypesharedData;
        this._fcrsharedvataSerice.fcrsharedData = this._fcrsharedvataSerice.fcrsharedData;
        this._fcrhblprinttype.fcrhblprinttype=this.ISPRINT;

        // this._router.navigate(['/export/fcr/sea-bl-print']);
        // this.buttonStatus = false;
        if(this.SAILING_DT ==""){
            this._toasterService.toast('warning', 'warning', "You cannot take  final print, Vessel sailing date not entered ! ");
            return false;
        }
        
        if (this.ISPRINT=="")
        {
          if (confirm("Are you sure want to take print out ,Once take print you cannot do any modification  " )) {
          const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'P'};
          this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
              .subscribe((data: any) => {
                  this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
                  this.ISPRINT=data.Table[0].ISPRINT;
                  }); 
              }
              else
              {return false}
         }         
        
            //   if (this._loginService.getLogin()[0].CMPCODE=='01' || this._loginService.getLogin()[0].CMPCODE=='02') 
            //   {
                  //let URL = "http://manilal.com/erp/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
                  let URL = "http://180.179.207.163/linkserp-ac/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
                  "huhpnk=" + this._loginService.getLogin()[0].GUID
                  + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
                  + "&Userid=" + this._loginService.getLogin()[0].CMPID
                  + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
                  + "&FCR=" +   this.FCRNO   
                  + "&HBLType="+ this.HBLTYPE_ACT
                  + "&CurLogInIP=" + environment.edocumentIp
                  + "&Iswatermark=" + this.watermarkval
                  window.open(URL, "_blank");
                  this.buttonStatus = false;
              //}
            //   else{
  
            //       this._router.navigate(['/export/fcr/sea-bl-print']);
            //       this.buttonStatus = false;
            //       }            
          
      }
    
} 

@Component({
    selector: 'app-mto-printview',
    // templateUrl: 'exp_prt_fcr_printview.component.html'
    template: `

    <table class="table table-bordered table-striped table-sm-new bgwhite">
    <tr>
    </tr>
							<tr>
								<td colspan="5"> </td>
                            </tr>
                            
                                <tr >
                             
                              
                                <td  colspan="3" class="centerlabel"><span class="col-form-span-label" >{{IsSwitchtext}}
                                    <a href="javascript:void(0);"   (click)="fcrrout(SwitchFCR);" ><b>{{SwitchFCR}}</b> </a>
                                    </span>
                                </td>
                                <td colspan="2" ></td>                              
                                
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
								<td  colspan="2"  >
									 
								</td>
							</tr>
							<tr>
								<td colspan="3"> Notify Address<br>
									<textarea name="notify" style="FONT-SIZE: 12px;font-family: Courier New;" rows="4" cols="40" [(ngModel)]="NOTIFYPARTY" > </textarea> 
                                </td>	
                                <td  colspan="2"  >
									 
								</td>							      
							</tr>
							<tr>
								<td colspan="2"> Place of receipt  <br>
									<input type="text" name="carriage" style="FONT-SIZE: 12px;font-family: Courier New; width: 250px;" size="10" id="carriage" [(ngModel)]="CARRIER"  maxlength="50">
                                </td>
                                <td colspan="2"> Place of loading <br>
									<input type="text" name="receipt" style="FONT-SIZE: 12px;font-family: Courier New;  width: 250px;" size="10" id="receipt" [(ngModel)]="RECPTPLACE"  maxlength="50">
								</td>
															
							</tr>
							<tr>
								<td colspan="2" >Port of Delivery<br>
									<input type="text" name="discharge" style="FONT-SIZE: 12px;font-family: Courier New; width: 250px;" size="10" id="discharge" maxlength="50" [(ngModel)]="POD" >									
								</td>
								<td>Place of Delivery<br>
									<input type="text" name="delivery" style="FONT-SIZE: 12px;font-family: Courier New;width:250px" size="10" maxlength="50" [(ngModel)]="PODEL"  >    									
								</td>
								<td>  Mode of Transport<br>
									<input type="text" name="vessel" style="FONT-SIZE: 12px;font-family: Courier New; width: 250px;" size="10" maxlength="50" [(ngModel)]="VESSEL"   >
								</td>
								<td>  </td>
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
												<textarea name="marks" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="14" wrap="OFF" id="marks" [(ngModel)]="MARKSANDNOS"> </textarea>
											</td>
											<td> 
												<textarea name="pkgs" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="9" wrap="OFF" [(ngModel)]="NOOFPKGS"> </textarea> 
											</td>
											<td> 
												<textarea name="desc" style="FONT-SIZE: 12px;font-family: Courier New;width:400px" rows="16" cols="40" wrap="OFF"[(ngModel)]="ITCDESC"> </textarea>
											</td>
											<td> 
												<textarea name="grwt" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="9"   id="grwt" [(ngModel)]="GRWT">  </textarea>  
											</td>
											<td> 												
												<textarea name="cbm" style="FONT-SIZE: 12px;font-family: Courier New;" rows="16" cols="9"   id="cbm" [(ngModel)]="VOL"> </textarea>  
											</td>
                                        </tr>
                                        <tr>
                                            <td colspan="2"> Goods Description (Rider)
                                            </td>
                                            <td colspan="3">
                                                <textarea name="rider" style="FONT-SIZE: 12px;font-family: Courier New;width:650px;" rows="4" cols="40" [(ngModel)]="Rider"  ></textarea>
                                            </td>
                                        </tr>
										<tr>
											<td  colspan="2" >Freight Amount </td>
											<td >Freight Payable at </td>
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
												<textarea name="collect" style="FONT-SIZE: 12px;font-family: Courier New;height: 30px;" rows="10" cols="10"  id="collect"  [(ngModel)]="CC" ></textarea> 
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
                            <tr>
                         
						</table>  
            
        `
})
export class ExptMTOprintview implements OnChanges {
   // private baseUrl: string = 'Export/Export_FCR_PRINTPREVIEW';
    @Input() hbltype: string;

    HBLTYPE_ACT: string="";
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
    ISPRINT:string="";
    DRAFTPRINT :string="";
    Rider: string="";
    SwitchFCR :string="";
    public draftvisible  =false;
    IsSwitch :string="";
    IsSwitchtext:string="";
    SAILING_DT: string="";
    expressbill:boolean=false;
    printmsg:string="";
   expressbillval:string=""
   WaterMarkoption:boolean=false;
   watermarkval:string="0";
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _fcrsharedvataSerice: FcrSharedDataService,
        private _fcrHbltypesharedvataSerice: FcrSharedDataService,
        private _fcrhblprinttype: FcrSharedDataService,
        private _fcrdraftvisible :FcrSharedDataService,
        private loaderService: LoaderService,) {
    }
    fcrrout(FCRNo){
        if( confirm("Are you sure you want move to "+this.IsSwitchtext +" ?") )  {   
        this._fcrsharedvataSerice.fcrsharedData = FCRNo;     
        this.ngOnChanges();  
        }
        else {return false}  
      //  this._router.navigate(['/export/fcr/sea-bl-print-view']);  
    }
    checkValue(event: any){
        console.log(event);
        if(event.target.checked)
        {
        this.expressbill=true
          }
        else
        {
            this.expressbill=false
        }
     }
     getwatermarkvalue(event: any){

        if(event.target.checked)
        {
        this.WaterMarkoption=true
        this.watermarkval="1"
          }
        else
        {
            this.WaterMarkoption=false
            this.watermarkval="0"
        }
     }
    ngOnChanges()
    {
        this.loaderService.display(true); 
     //   console.log("MTO NO. "+this._fcrsharedvataSerice.fcrsharedData); 
        const jsonExport = { FCRNO: this._fcrsharedvataSerice.fcrsharedData };//'GOA106180004'
        this._dataService.Common("Export/Export_FCR_PRINTPREVIEW", jsonExport)
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
                    this.ISPRINT=this.FCRDET[0].ISPRINT;
                    this.HBLTYPE_ACT=this.FCRDET[0].HBLTYPE;
                    this.DRAFTPRINT=this.FCRDET[0].DRAFTPRINT;
                    this.Rider=this.FCRDET[0].Rider;
                    this.SwitchFCR=this.FCRDET[0].SWITCHBL;
                    this.IsSwitch=this.FCRDET[0].ISSWITCHBL;
                    this.SAILING_DT=this.FCRDET[0].SAILING;
                    if(this.IsSwitch=='1'){
                        this.IsSwitchtext="Switch BL MTO NO.: ";
                    }
                    else{ this.IsSwitchtext="Original MTO No.: " ;               }
                    
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
        
        if  (this.ISPRINT=="1")
        {
            this._toasterService.toast('warning', 'warning', "You can`t update ,Print already taken ");
            
        }
        else if  (this.DRAFTPRINT=="10")
        {
            this._toasterService.toast('warning', 'warning', "You can`t update ,Draft already taken 10 times");
            
        }
        else
        {
        this.loaderService.display(true); 
    
        const jsonExportUP = { SHIPPER: this.SHIPPER, CONSIGNEE: this.CONSIGNEE, NOTIFYPARTY: this.NOTIFYPARTY, CARRIER: this.CARRIER, APPLYTO: this.APPLYTO, VESSEL: this.VESSEL, POL: this.POL, POD: this.POD, PODEL: this.PODEL, MARKSANDNOS: this.MARKSANDNOS, NOOFPKGS: this.NOOFPKGS, ITCDESC: this.ITCDESC, GRWT: this.GRWT, VOL: this.VOL, MISC: this.MISC, PLACEDATE: this.PLACEDATE, PP: this.PP, CC: this.CC, TOTPP: this.TOTPP, TOTCC: this.TOTPP, RECPTPLACE: this.RECPTPLACE, EXPNO: this.EXPNO, FCRNo: this.FCRNO ,UERNAME:this._loginService.getLogin()[0].CMPID, CITYCODE :this._loginService.getLogin()[0].CITYCODE,rider:this.Rider };
        this._dataService.Common("Export/Export_FCR_PRINTUPDATE", jsonExportUP)
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
                    this.HBLTYPE_ACT=this.FCRDET[0].HBLTYPE;
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
    }
    printDraft()
    {
        if(this.expressbill==true){
            alert('Please uncheck the express bill as you are taking draft print');
            return false;

        }
        if  (this.DRAFTPRINT=="10")
        {
            this._toasterService.toast('warning', 'warning', "You cannot take more than 10 draft ");
            
        }
        else
        {
            this.buttonStatus = true;
        if (this.DRAFTPRINT=="0" ){ 
            if (confirm(" Are you sure want to take the Draft, You have  10 draft is pending,  After No modification allowed " )) {
                const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'D'};
                this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
                    .subscribe((data: any) => {
                        this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
                        this.ISPRINT=data.Table[0].ISPRINT;
                        });
                    }
                    else
                    {return false}
            }
            // else if (this.DRAFTPRINT=="1"){ 
            // if (confirm(" Are you sure want to take the Draft, You have  2 draft is pending,  After No modification allowed" )) {
            //     const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'D'};
            //     this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
            //         .subscribe((data: any) => {
            //             this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
            //             this.ISPRINT=data.Table[0].ISPRINT;
            //             });
            //         }
            //         else
            //         {return false}
            // }
            // else  
            if (parseInt(this.DRAFTPRINT)<=9){  
                let printfraft ;
                printfraft= 10 -parseInt(this.DRAFTPRINT) 
            if (confirm("Are you sure want to take Draft  ,You have " +printfraft+" draft is pending , modification allowed " )) {
            const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'D'};
            this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
                .subscribe((data: any) => {
                    this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
                    this.ISPRINT=data.Table[0].ISPRINT;
                    });
                }
                else
                {return false}
        }
       // let URL = "http://manilal.com/erp/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
        
        let URL = "http://180.179.207.163/linkserp-ac/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
                "huhpnk=" + this._loginService.getLogin()[0].GUID
                + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
                + "&Userid=" + this._loginService.getLogin()[0].CMPID
                + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
                + "&FCR=" +   this.FCRNO   
                + "&HBLType="+ this.HBLTYPE_ACT
                + "&CurLogInIP=" + environment.edocumentIp
                + "&Iswatermark=" + this.watermarkval
                window.open(URL, "_blank");
                
    }
    this.buttonStatus = false;
    }
    Print() {
        this.buttonStatus = true;
        this._fcrHbltypesharedvataSerice = this._fcrsharedvataSerice.fcrHbltypesharedData;
        this._fcrsharedvataSerice.fcrsharedData = this._fcrsharedvataSerice.fcrsharedData;
        this._fcrhblprinttype.fcrhblprinttype=this.ISPRINT;

        // this._router.navigate(['/export/fcr/sea-bl-print']);
        // this.buttonStatus = false;
        if(this.SAILING_DT ==""){
            this._toasterService.toast('warning', 'warning', "You cannot take  final print, Vessel sailing date not entered ! ");
            return false;
        }

        if (this.ISPRINT=="" || this.ISPRINT=="1" || this.ISPRINT=="2")
        {
          //if (confirm("Are you sure want to take print out ,Once take print you cannot do any modification  " )) {
            if(this.expressbill==false)
            {this.printmsg="Are u sure want to take the original print,Once take print you cannot do any modification "}
            if(this.expressbill==true)
            {this.printmsg="Are u sure want to take the nonnegotiable print,Once take print you cannot do any modification "}
           if (confirm(this.printmsg))
           {
          const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,
            Type: (this.expressbill==false ?'P':'N')};
          this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
              .subscribe((data: any) => {
                  this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
                  this.ISPRINT=data.Table[0].ISPRINT;
                  });
                }
                else
                {return false}
            }
                // else
                // {return false}
                //             }


                  let URL = "http://180.179.207.163//linkserp-ac/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
                  "huhpnk=" + this._loginService.getLogin()[0].GUID
                  + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
                  + "&Userid=" + this._loginService.getLogin()[0].CMPID
                  + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
                  + "&FCR=" +   this.FCRNO
                  + "&HBLType="+ this.HBLTYPE_ACT
                  + "&CurLogInIP=" + environment.edocumentIp
                  + "&Iswatermark=" + this.watermarkval
                  window.open(URL, "_blank");
                  this.buttonStatus = false;
      }
    // Print() {
    //         this.buttonStatus = true;

    //         this._fcrHbltypesharedvataSerice = this._fcrsharedvataSerice.fcrHbltypesharedData;
    //         this._fcrsharedvataSerice.fcrsharedData = this._fcrsharedvataSerice.fcrsharedData;
    //         if(this.SAILING_DT ==""){
    //             this._toasterService.toast('warning', 'warning', "You cannot take  final print, Vessel sailing date not entered ! ");
    //             return false;
    //         }

    //         if (this.ISPRINT=="")
    //         {
    //           if (confirm("Are you sure want to take print out ,Once take print you cannot do any modification  " )) {
    //           const jsonExport = { fcr:  this.FCRNO  ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID,Type: 'P'};
    //           this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
    //               .subscribe((data: any) => {
    //                   this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
    //                   this.ISPRINT=data.Table[0].ISPRINT;
    //                   }); 
    //               }
    //          }         
            
             
    //                   let URL = "http://180.179.207.163/linkserp-ac/UI/Export/frm_Exp_Print_Document_Sea_FCR_PRINT.aspx?" +
    //                   "huhpnk=" + this._loginService.getLogin()[0].GUID
    //                   + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
    //                   + "&Userid=" + this._loginService.getLogin()[0].CMPID
    //                   + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
    //                   + "&FCR=" +   this.FCRNO   
    //                   + "&HBLType="+ this.HBLTYPE_ACT
    //                   + "&CurLogInIP=" + environment.edocumentIp
    //                   window.open(URL, "_blank");
    //                   this.buttonStatus = false;
              
    //       }
      
  

}


@Component({
    selector: 'app-printview',
    templateUrl: 'exp_prt_fcr_printview.component.html'

})
export class ExptPrintview implements OnInit {
    Type: any = "";
    buttonStatus = false;
    ISPRINT :string="";
    WaterMarkoption:boolean=false;
    watermarkval:string="0";
    @ViewChild(ExptFCRPrintview, {static: false}) public viewFCR: ExptFCRPrintview;
    @ViewChild(ExptMTOprintview, {static: false}) public viewMTO: ExptMTOprintview;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _fcrsharedvataSerice: FcrSharedDataService,
        private _fcrhblprinttype: FcrSharedDataService,
        private _fcrHbltypesharedvataSerice: FcrSharedDataService) {
    }
    ngOnInit(): void {
        this.Type = this._fcrsharedvataSerice.fcrHbltypesharedData;//'M';
        this.ISPRINT= this._fcrhblprinttype.fcrhblprinttype;
    }

    checkValue(event: any){

        if (this.Type == "F") {
            this.viewFCR.checkValue(event)}
        else if (this.Type == "H") {
            this.viewFCR.checkValue(event)
        }
        else {
            this.viewMTO.checkValue(event)
        }
     }

    printUpdate() {
        if (this.Type == "F") {
            this.viewFCR.printUpdate();
        }
        else if (this.Type == "H") {
            this.viewFCR.printUpdate();
        }
        else {
            this.viewMTO.printUpdate();
        }
    }
    getwatermarkvalue(event: any){
        if (this.Type == "F") {
            this.viewFCR.getwatermarkvalue(event)}
        else if (this.Type == "H") {
            this.viewFCR.getwatermarkvalue(event)
        }
        else {
            this.viewMTO.getwatermarkvalue(event)
        }        // console.log(event);
    }
    Print() {
        if (this.Type == "F") {
           // this.viewFCR.WaterMarkoption=this.WaterMarkoption
            this.viewFCR.Print();
        }
        else if (this.Type == "H") {
            //this.viewFCR.WaterMarkoption=this.WaterMarkoption
            this.viewFCR.Print();
        }
        else {
           // this.viewMTO.WaterMarkoption=this.WaterMarkoption
            this.viewMTO.Print();
        }
    }

    Printdraft()
    {
        if (this.Type == "F") {
            this.viewFCR.printDraft();
        }
        else if (this.Type == "H") {
            this.viewFCR.printDraft();
        }
        else {
            this.viewMTO.printDraft();
        }
    }
  }

        
    
