import { Component, OnInit } from '@angular/core';
import { LoginService } from '../service/loginService';
import { DataService } from '../service/dataService';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs';
@Component({
    selector: 'app-financial-year',
    templateUrl: 'financial-year.component.html'
})
export class FinancialYearComponent {
    newSubject: Subject<string> = new Subject();
    financialYearText: string;
    financialYearList: Array<any> = [];
    constructor(private _loginService: LoginService,
        private _dataService: DataService) {
        this.getFinancialYear();
        this.newSubject.subscribe((val) => {
            this.financialYearText = val;
        });
    }

    getFinancialYear() {
        const jsonData = {
            citycode1: this._loginService.getLogin()[0].CITYCODE1,
            cmpcode: this._loginService.getLogin()[0].CMPCODE
        };
        this._dataService.getData('Common/GetFinancialYear', jsonData)
            .subscribe((data: any) => {
                // console.log("Financial Yaer", data.Table);
                this.financialYearList = data.Table;
                const financialYear = this._loginService.getLogin()[0].FINANCIAL_YEAR;
                
                if (financialYear) {
                    this.selectYear(financialYear);
                } else {
                    let currentDate = this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this._dataService.getCurrentdate());
                    let selectLatest: Array<any> = this.financialYearList
                        .filter((key) => this.parseDate(currentDate) >= this.parseDate(key.STARTDATE) && this.parseDate(currentDate) <= this.parseDate(key.ENDDATE));
                    if (selectLatest.length > 0) {
                        this.selectYear(selectLatest[0]);
                    } else if (data.Table.length > 0) {
                        this.selectYear(this.financialYearList[this.financialYearList.length - 1]);
                    } else {
                        this.newSubject.next('');
                    }
                }
            });
    }

    selectYear(obj) {
        let financialYear = {
            STARTDATE: obj.STARTDATE,
            ENDDATE: obj.ENDDATE,
            YEARID: obj.PK_YEARID,
            YEARCODE: obj.YEARCODE
        }
        this._loginService.setFinancialYearModify(financialYear);
        this.newSubject.next(`ACCOUNT YEAR : ${financialYear.STARTDATE} To ${financialYear.ENDDATE}`);
    }

    parseDate(s) {
        var months = {
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
        };
        var p = s.split('-');
        return new Date(p[2], months[p[1].toLowerCase()], p[0]);
    }
    Check_FinancialYear(selected: Date) {
        var errorArr = [];
        if (selected > new Date()) {
            errorArr[0] = "3";
            errorArr[1] = "Invalid Date -- Selected Date is Greater than Current Date";

        }
        else if ((selected >= this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE && selected <= this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE) == false) {
            errorArr[0] = "1"
            errorArr[1] = "Selected Date should be in between Financial Year.";
        }
        else {
            errorArr[0] = "0"
            errorArr[1] = ""

        }
        return errorArr
    }

    // ngOnDestroy() {
        
    // }
}
