import { Component, OnInit } from '@angular/core';
import{ LoginService } from '../../shared/service/loginService'
@Component({
    templateUrl: 'transaction.component.html'
})
export class TransactionComponent implements OnInit {

    constructor(  private _loginService: LoginService) { 
    }
    ngOnInit(): void {
    //console.log(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE)
    }
}
 