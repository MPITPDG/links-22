
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../shared/service/dataService';
import { Router } from '@angular/router';
import { LoginService } from '../shared/service/loginService';
@Component({
    selector: 'app-company',
    templateUrl: 'company.component.html',
    styleUrls: ['company.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompanyComponent implements OnInit {
    public companylist: Array<any> = [];
    public loader: boolean = true;
    public errorMessage: string = '';

    /** Branch picked on the previous page, shown above the cards. */
    public cityName: string = this._cityName();

    private _cityName(): string {
        try { return this._loginService?.getLogin()?.[0]?.CITYNAME ?? ''; } catch { return ''; }
    }

    /**
     * IS_HBLISSUE / IS_HAWISSUE arrive in whatever shape the procedure returns -
     * 'Y', '1', 1, true. Anything else reads as "does not issue".
     */
    issues(flag: any): boolean {
        if (flag === true || flag === 1) { return true; }
        const v = (flag ?? '').toString().trim().toUpperCase();
        return v === 'Y' || v === 'YES' || v === '1' || v === 'TRUE';
    }
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService) { }
    public disabled = false;
    public status: { isopen: boolean } = { isopen: false };
    public toggled(open: boolean): void {
        //console.log('Dropdown is now: ', open);
    }
    public toggleDropdown($event: MouseEvent): void {
        $event.preventDefault();
        $event.stopPropagation();
        this.status.isopen = !this.status.isopen;
    }
    ngOnInit(): void {
        const jsoncompany = {
            citycode: this._loginService.getLogin()[0].CITYCODE,
            cmpcode: "",
            comptype: "",
            cmpid: this._loginService.getLogin()[0].CMPID,
            logintype: (this._loginService.getBasePath()=="FRT")? 'FRT' : ""
        };
        this._dataService.Common('Branch/GetCompany', jsoncompany)
            .subscribe((data: any) => {
                this.loader = false;
                if (data.Table.length === 1) {
                    this.errorMessage = "";
                    this.setCompany(data.Table[0].CMP_CODE, data.Table[0].CMP_NAME, data.Table[0].IS_HBLISSUE, data.Table[0].IS_HAWISSUE);
                }else if (data.Table.length === 0) {
                    this.errorMessage = "Please Contact to administrator";
                }
                else {
                    this.companylist = data.Table;
                    this.errorMessage = "";
                }
            });
    }
    setCompany(companycode, companyname,hblissue,hawbissue) {
        this._loginService.setCompanyCodeModify(companycode, companyname,null, hblissue,hawbissue);
        this._router.navigate(['/module']);
    }
}