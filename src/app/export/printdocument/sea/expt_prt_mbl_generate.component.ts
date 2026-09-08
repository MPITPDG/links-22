
import { Component, OnInit} from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router} from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { mblsharedservice } from '../../export-share-data.service';

@Component({
    selector: 'app-mbl-iu',
    templateUrl: 'expt_prt_mbl_generate.component.html' 
  
})

export class ExptMBLGenerate  implements OnInit  {

    exJobno: any = "";
    shippername: any = "";
    VSL_NAME: any = "";
    VOYNO: any = "";
    
    frttype: any = "";
    currency: any = "";
    mbldate: any = null;
    delivetTo: any = "";
    selJob: any = "";
    pod: any = "";
    frtAmt: any="";
    jobnos: any = "";
    mblno: any = "";
    BLTYPE:any="";
    exptdt: any = [];
    JOBSELE:boolean=false;
     
    listCurreny: any = [];
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService,
        private _mblsharedservice:mblsharedservice
        
         ) {
    }

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

    ngOnInit(): void {
        this._loginService.verifyRights(402, '')
        .subscribe((data: any) => { this._loginService.checkVerify('View', data); });
    }
    jobserch() {
        if (this.exJobno == ""  || this.exJobno == null) {
            this._toasterService.toast('warning', 'warning', "Please Enter export job no");             
            return false;
        }
        this.loaderService.display(true);
        const jsonExport = { CITY_CODE: this._loginService.getLogin()[0].CITYCODE, JOBNO: this.exJobno };
        this._dataService.Common('Export/exp_printdoc_mbl_listview', jsonExport)
            .subscribe((data: any) => {               
                if (data.Table[0].STATUS == 100) {
                    if(data.Table[0].JOBSELE =="0")
                    {
                        this.JOBSELE=false;
                    }
                    else
                    {
                        this.JOBSELE=true;                        
                    }
                    this.exptdt = data.Table1;
                   // console.log("MBL PGELOAD",this.exptdt);
                     
                    this.VSL_NAME = this.exptdt[0].VSL_NAME;
                    this.VOYNO = this.exptdt[0].VOYNO;                     
                    this.listCurreny = data.Table2;     
                    this.BLTYPE = (this.exptdt[0].BLTYPE == "") ? "-1": this.exptdt[0].BLTYPE;//this.exptdt[0].FRTYPE;
                    this.frttype = (this.exptdt[0].FRTTYPE == "") ? "-1": this.exptdt[0].FRTTYPE;//this.exptdt[0].FRTYPE;
                    this.currency = (this.exptdt[0].FRTCUR == "") ? "-1": this.exptdt[0].FRTCUR;//this.exptdt[0].FRTCURR;
                    this.mblno = (this.exptdt[0].MBLNO == "") ? "": this.exptdt[0].MBLNO;//this.exptdt[0].EXPT_HBLNO;
                    this.frtAmt = (this.exptdt[0].FRTAMT == "") ? "": this.exptdt[0].FRTAMT;//this.exptdt[0].FRTAMT;
                    this.mbldate = (this.exptdt[0].MBLDT != "") ? this._dataService.stringdttoArry(this.exptdt[0].MBLDT) : ""; 
                    this.loaderService.display(false);
                    this._toasterService.toast('info', 'Complete', 'Data filled successfully');
                } else {
                    this.loaderService.display(false);
                    this._toasterService.toast('error', 'Error', data.Table[0].statusText);
                }
            });
             
        }  
    ResetAll()
    {
        this.exJobno="";
        this.exptdt = [];

    }

    AddMbl()
    {
        this._loginService.verifyRights(402, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });
        if (this.mblno == null || this.mblno =="" ) {
            this._toasterService.toast('error', 'Error', "Please enter MBl NO");
             
            return false;
        }

        if (this.frttype == ""  || this.frttype == "-1") {
            this._toasterService.toast('error', 'Error', "Please Enter Freight Type");
            
            return false;
        }
        if (this.BLTYPE == "" || this.BLTYPE == "-1") {
            this._toasterService.toast('error', 'Error', "Please Enter Bl Type");
           
            return false;
        }
       // this.jobnos =this.exJobno +',';
        for (let obj of this.exptdt)
        {
            if (obj.SELETJOB == "null" || obj.SELETJOB == true )
                {
                this.jobnos = this.jobnos + obj.EXPTNO + ',';           
                }
        }
        if(this.jobnos ==''){this.jobnos =this.exJobno +','}
        if  (this.jobnos=="")
        {
            this._toasterService.toast('warning', 'warning', "Please select atleast one export job no");             
            return false;
        }
        var mbldt;
        if (this.mbldate == null) { mbldt = "" } else { mbldt = this.mbldate.formatted; }
        if (mbldt == "" || mbldt == null) {
            this._toasterService.toast('error', 'Error', "Please select MBL date");
           
            return false;
        }
        this.loaderService.display(true);
        const jsonExport = {JOBNO: this.exJobno,MBLNO:this.mblno,MBLDT:mbldt,FRTYPE: this.frttype, FRTCURR: this.currency, FRTAMT: this.frtAmt, MAKERID: this._loginService.getLogin()[0].CMPID,BLTYPE: this.BLTYPE,  JOBSTR: this.jobnos ,  CITY_CODE: this._loginService.getLogin()[0].CITYCODE };
        this._dataService.Common('Export/exp_printdoc_mbl_iu', jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {     
                    this._mblsharedservice.jobnoshared=this.exJobno;
                    this._mblsharedservice.mblnoshared=this.mblno;
                    this.loaderService.display(false);
                    this._toasterService.toast('alert', 'Alert', data.Table[0].statusText);
                    this._router.navigate(['export/print-document/sea/mbl/print']);
                     
                }
                else {
                    this.loaderService.display(false);
                    this._toasterService.toast('error', 'Error', data.Table[0].statusText);
                     
                }
            })
    }   

    onprint()
    {
        this._mblsharedservice.jobnoshared=this.exJobno;
        this._mblsharedservice.mblnoshared=this.mblno;
        this._router.navigate(['export/print-document/sea/mbl/print']);
    }
}
    