import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { OkModalComponent } from '../../../shared/common-modal.directive';
import { SharedDataSerice } from '../../export-share-data.service';
import { ConsignmentEditModalComponent } from './consig_main_edit_modal.component';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoginService } from '../../../shared/service/loginService';
@Component({
    selector: 'app-consignment-edit-option',
    templateUrl: 'consig_main_edit.component.html'
})
export class ExportMasterEditComponent implements OnInit {
    @ViewChild('okModal', {static: false}) okModal: OkModalComponent;
    @ViewChild('ConsignmentEditModal', {static: false}) public editModal: ConsignmentEditModalComponent;
    editList: any = {};
    exportHeader: string;
    dataObject: any;
    jobno : any;
    mode : any;
    arrivaldt :any;
    ISDIFFAIR :any;
    jobtype:any;
    constructor(
        private _router: Router,
        private _sharedconsig: SharedDataSerice,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService) { }

    ngOnInit() {
       // console.log("this._sharedconsig.exportEditData", this._sharedconsig.exportEditData);
        this._loginService.verifyRights('214', '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('View', data);
            });

     

        if (this._sharedconsig.exportEditData == undefined) {
            this._router.navigate(['export/Consignment/search']);
            return false;
        }
        this.editList = this._sharedconsig.exportEditData;   
         this.jobtype=this._sharedconsig.jobcreationtype;    
         console.log(this.jobtype)     
        this.ISDIFFAIR= this.editList.ISDIFFAIR;
    if(this._loginService.getLogin()[0].CITYCODE=='LIL')
        { 
             this.exportHeader = "EXPORT NO. : " + this.editList.EXPTNO.substring(4,14);
    }
    else {
        this.exportHeader = "EXPORT NO. : " + this.editList.EXPTNO;
    }

      
        this.jobno=this.editList.JOBNO;
        this.mode=this.editList.EXPT_MODE;
        this.arrivaldt=this.editList.ARRIVALDT;
        //this.exptno = this.editList.EXPTNO;
    }

    edit(etype) {
        if (etype == "MAWB") {
            if (this._sharedconsig.exportEditData["MAWBNO"] == '') { this._toasterService.toast('warning', 'Alert', "First generate MAWB Number"); }
            else { this.editModal.show(etype); }
        }
        else if (etype == "HAWB") {
            if (this._sharedconsig.exportEditData["HAWBNO"] == '') { this._toasterService.toast('warning', 'Alert', "First generate HAWB Number"); }
            else { this.editModal.show(etype); }
        }
        else if (etype=="Airshipment"){      
        if (this.arrivaldt !='')
        { 
            this._toasterService.toast('warning', 'Alert', "ACTUAL ARRIVAL DATE ALREADY ENTERED YOU CANNOT MODIFY");
            return false; 
        }      
          else {  this._router.navigate(["export/Consignment/edit-actual-flight-date/"+ this.editList.EXPTNO]);}
        this._router.navigate(["export/Consignment/edit-actual-flight-date/"+ this.editList.EXPTNO]);
        

        }
        else { this.editModal.show(etype); }
    }

    redirectTo(rtype) {
        // if (rtype == 'N') { this._router.navigate(['export/Consignment/start']); }
        // else if (rtype == 'S') { this._router.navigate(['export/Consignment/search']); }
         if (rtype == 'N') { this._router.navigate(['export/Consignment/start']); }
        else if (rtype == 'S')
            if(this.jobtype=='M'){
                 this._router.navigate(['export/Consignment/search']); 
            }
            else{
                this._router.navigate(['export/Consignment/AutoJob']); 
            }
    }
}