import { Component, OnInit,EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
@Component({
    selector: 'app-consignment-calcbm-view',
    template: `
                <table class="table table-bordered table-sm-new" >
                <tr class="trheader">
                        <th colspan="2">
                                <span class="col-form-span-label">
                                        CALCULATE CBM 
                                </span>
                        </th>
                </tr>
                <tr>
                        <td>
                            <table class="table table-bordered table-sm-new" >
                                <tr>
                                        <td><span class="col-form-span-label"> INCH </span></td>
                                        <td><span class="col-form-span-label"> CM </span></td>
                                        <td><span class="col-form-span-label"> LENGTH</span></td>
                                        <td><span class="col-form-span-label"> WIDTH</span></td>
                                        <td><span class="col-form-span-label"> HEIGHT</span></td>
                                        <td><span class="col-form-span-label"> PKGS.</span></td>
                                        <td><span class="col-form-span-label"> TOTAL CBM</span></td>
                                </tr>
                                <tr>
                                        <td class="col-form-span-label"  >
                                                <input type="radio" name="radiogroupS" value='1' [(ngModel)]="chkcbm" >
                                        </td>
                                        <td class="col-form-span-label"  >
                                                <input type="radio" name="radiogroupS" value='2' [(ngModel)]="chkcbm" >
                                        </td>
                                        <td>
                                                <input type="text" [(ngModel)]="length" class="form-control width80" />
                                        </td>
                                        <td>
                                                <input type="text" [(ngModel)]="width" class="form-control width80" />
                                        </td>
                                        <td>
                                                <input type="text" [(ngModel)]="height" class="form-control width80" />
                                        </td>
                                        <td>
                                                <input type="text" [(ngModel)]="pkgs" class="form-control width80" />
                                        </td>
                                        <td>
                                                <input type="text" [(ngModel)]="cbm" class="form-control width80" />
                                        </td>
                                    
                                </tr>	
                            </table>

                        </td>
                </tr>
                
                <tr class="trbg centerlabel">
                        <td colspan="2">
                                <button type="button" name="submitButton" class="btn btn-sm btn-primary" (click)="fn_CalCBM();">
                                  <span class="col-form-span-label">
                                    <i class="fa fa-save"></i>CalculateCBM</span>
                          
                                </button>&nbsp;
                                <button type="button" name="cancelAddedCustomClr" class="btn btn-sm btn-warning" (click)="fun_clear();" >
                                        <span class="col-form-span-label">
                                                <i class="fa fa-undo"></i>&nbsp;Clear</span>
                                </button>&nbsp;
                                 
                        </td>
                </tr>
            </table>
        `
})
export class CalCbmViewComponent implements OnInit {
     //Calculate CBM 
    exptno: string;
     chkcbm : any="";
     length : any="";
     width : any="";
     height : any="";
     pkgs : any="";
     calcbm : any="";
     cm_val:any="";
     inch_val:any="";
     tot_val : any="";
     m_tot_val : any ="";
     tot_cbm_val : any ="";
     cbm : any = "";

     
        constructor(private _route: ActivatedRoute,
                private _dataService: DataService,
        private _loginService: LoginService,
        ) { }
        
    ngOnInit() {
        this._route.params.subscribe(params => {
            this.exptno = params["exptno"];
			
        });
	}
    
     fn_CalCBM(){
        if (Math.abs(this.length) == 0) {
                alert("Please enter length !");
                
                return false;
        }
        if (Math.abs(this.width) == 0) {
                alert("Please enter Width !");
               
                return false;
        }
        if (Math.abs(this.height) == 0) {
                alert("Please enter height");
                
                return false;
        }
        if (Math.abs(this.pkgs) == 0) {
                alert("Please enter Pkgs.");
                return false;
        }
        //INCH = 1 AND CM = 2

        if (this.chkcbm=="1"){
                //INCH = 1
                this.cm_val = this.cm_val + (2.54*this.length) * (2.54*this.width) * (2.54*this.height) * (2.54*this.pkgs)
        }
        else if(this.chkcbm=="2") {
                //CM = 1
                this.inch_val = this.inch_val + (this.length * this.width * this.height * this.pkgs)
        }           
        
        this.tot_val = this.cm_val + this.inch_val;
        this.tot_val = this.tot_val/1000000;
        this.m_tot_val = this.m_tot_val + this.tot_val;
        this.cbm = Math.round(this.m_tot_val*10000)/10000 ;
        return this.cbm;                      

     }   

     fun_clear()
     {
        this.length="";
        this.width="";
        this.height="";
        this.pkgs="";
        this.cbm =""


     }

 
        
}