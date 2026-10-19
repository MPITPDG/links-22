import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { LoginService } from '../service/loginService';
import { DataService } from '../service/dataService';
import { BehaviorSubject } from 'rxjs';
import { Subject } from 'rxjs';
@Component({
    selector: 'app-financial-year',
    templateUrl: 'financial-year.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
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

    // ---- dropdown -----------------------------------------------------------
    // Open state lives here rather than coming from ngx-bootstrap's
    // dropdownToggle / *dropdownMenu, which need an enclosing [dropdown]
    // container. Dropped into the new header there was none, so the menu could
    // never open - the picker looked absent in the accounts module.

    open = false;

    toggle(event?: Event): void {
        if (event) { event.preventDefault(); event.stopPropagation(); }
        this.open = !this.open;
    }

    close(): void { this.open = false; }

    pick(obj: any): void {
        this.selectYear(obj);
        this.open = false;
    }

    /**
     * Built here, not with [class.x] in the template: Tailwind arbitrary values
     * contain brackets and parens - bg-[var(--sidebar-accent)] - which are not
     * safe inside an Angular class-binding name.
     */
    itemCls(obj: any): string {
        // Monochrome: the row's own tick mark (see the template) shows which
        // year is selected, so this only needs a neutral hover/active shade.
        // justify-start with a reserved tick slot, not justify-between: with
        // space-between and a conditionally rendered tick, unselected rows had
        // nothing to push right and the panel showed dead space.
        return 'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm '
            + 'whitespace-nowrap tabular-nums transition-colors '
            + 'hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-foreground)] '
            + (this.isSelected(obj)
                ? 'bg-[var(--sidebar-accent)] text-[var(--sidebar-foreground)] font-semibold'
                : 'text-[var(--sidebar-muted)]');
    }

    isSelected(obj: any): boolean {
        const fy = this._loginService.getLogin()?.[0]?.FINANCIAL_YEAR;
        if (!fy) return false;
        return String(fy.YEARID ?? fy.PK_YEARID) === String(obj.PK_YEARID);
    }

    /**
     * Compact label for the header button. The full text is
     * "ACCOUNT YEAR : 01-Apr-2026 To 31-Mar-2027", which is too long for a
     * toolbar; this renders "2026-27" and keeps the full range in the menu.
     */
    /** Full range on the trigger - operators read the dates, not a shorthand. */
    get shortLabel(): string {
        const fy = this._loginService.getLogin()?.[0]?.FINANCIAL_YEAR;
        const start = fy?.STARTDATE, end = fy?.ENDDATE;
        if (!start || !end) return 'Select year';
        return `${start} To ${end}`;
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
