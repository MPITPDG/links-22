import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
@Component({
    templateUrl: 'docket.search.component.html'
})
export class DocketSearchComponent implements OnInit {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    ExptNo: any = ''
    constructor(private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService) { }
    ngOnInit() {
        this._loginService.verifyRights('259', '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('View', data);  //For verify user access
            });
    }
    searchData() {
        if (this.ExptNo == '') {
            alert('Please Enter Export NO.');
            return false;
        } 
        if (this._loginService.getLogin()[0].CITYCODE =='LIL')
        {
            if (this.ExptNo.length != 10) {
                alert('Export NO. should be 10 digit');
                return false;
            }
            else {
                window.open('./#/new-tab/docket-print/' + this.ExptNo, '_blank');
            } 
             
        }
        else if (this._loginService.getLogin()[0].CITYCODE !='LIL')
        {  if (this.ExptNo.length < 15) {
                    alert('Export NO. should be 15 digit');
                return false;             
            }   
            else {
                window.open('./#/new-tab/docket-print/' + this.ExptNo, '_blank');
            }                   
        }
        else  if (this._loginService.getLogin()[0].CITYCODE  !='LIL') {
            if (this.ExptNo.substring(0,2)!=this._loginService.getLogin()[0].CMPCODE || this.ExptNo.substring(2,5) !=this._loginService.getLogin()[0].CITYCODE1 )
            {
                alert('Please Enter correct Export NO.');
                return false;
            }
        }
        else {
            window.open('./#/new-tab/docket-print/' + this.ExptNo, '_blank');
        } 
    }
}