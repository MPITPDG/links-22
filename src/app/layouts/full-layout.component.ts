import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../shared/service/loginService';
import { UiSidebarService } from '../shared/ui/sidebar.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './full-layout.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FullLayoutComponent implements OnInit {

    public disabled = false;
    public status: { isopen: boolean } = { isopen: false };
    public cmpname: string = '';
    public username: string = '';
    public displayName: string = '';
    public cityName: string = '';
    public imageSrc: string = '';
    public userimgepath : string ='';
    public showFinancialYear = false;
    /** Module name for the header. The company now sits in the header brand. */
    public moduleName = '';
    public toggled(open: boolean): void {

    }

    public toggleDropdown($event: MouseEvent): void {
        $event.preventDefault();
        $event.stopPropagation();
        this.status.isopen = !this.status.isopen;
    }

    constructor(
        private _router: Router,
        private _loginService: LoginService) {
    }

    ngOnInit() {
        if (this._loginService.getLogin() === null) {
            this._router.navigate(['']);
            return false;
        }
        // The accounts module carries a financial-year picker in the header.
        // This used to be the sole reason FullLayoutComponent_acc existed as a
        // near-identical copy of this component; the rest of that file was a
        // byte-for-byte duplicate. Detecting the route here lets /accounts
        // share this layout, and the duplicate has been deleted (as in MP).
        this.showFinancialYear = this._router.url.indexOf('/accounts') === 0;
        // if (this._loginService.getLogin()[0].CMPTYPE == 'FRT') {
        //     this.imageSrc = 'assets/img/freight_services.png';
        // } else {
        //     this.imageSrc = 'assets/img/title.png';
        // }

        // let curUrl = this._router.url;
        // if (curUrl.match('export') != null && this._loginService.getLogin()[0].MODULEID != 3 && this._loginService.getLogin()[0].TMPTYPE != null) {
        //     this._router.navigate(['/module']);
        // } else if (curUrl.match('accounts') != null && this._loginService.getLogin()[0].MODULEID != 1 && this._loginService.getLogin()[0].TMPTYPE != null) {
        //     this._router.navigate(['/module']);
        // } else if (curUrl.match('accounts-fra') != null && this._loginService.getLogin()[0].MODULEID !== 1 && this._loginService.getLogin()[0].TMPTYPE == null) {
        //     this._router.navigate(['/module']);
        // }
        this.cmpname = this._loginService.getLogin()[0].CMPNAME;
        this.moduleName = this.moduleFromUrl();
        this.username = this._loginService.getLogin()[0].CMP_USERNAME;
        this.displayName = this._loginService.getLogin()[0].GREETING + ' ' + this._loginService.getLogin()[0].FULLNAME;
        this.cityName = this._loginService.getLogin()[0].CITYNAME;
        if (this._loginService.getLogin()[0].IMAGE != '') { this.userimgepath = this._loginService.getLogin()[0].IMAGE; }
    }

    /** Header label, derived from the route rather than the login payload. */
    private moduleFromUrl(): string {
        const seg = (this._router.url.split('?')[0].split('/')[1] || '').toLowerCase();
        const names: Record<string, string> = {
            'dashboard': 'Dashboard',
            'export': 'Export Module',
            'import': 'Import Module',
            'accounts': 'Accounts Module',
            'master': 'Master',
            'admin': 'Admin',
        };
        return names[seg] ?? (seg ? seg.replace(/-/g, ' ') : 'Links');
    }

    goto(goType) {
        if (goType == 'CITY') { this._router.navigate(['/branch']); }
        else if (goType == 'HOME') { this._router.navigate(['/module']); }
    }

    logout() {
        this._loginService.removeLogin();
    }

    // ---- sidebar -----------------------------------------------------------
    // State lives in UiSidebarService, shared with the sidebar itself, so the
    // header trigger and the menu never disagree about whether it is collapsed.
    // Replaces the CoreUI appSidebarToggler / appMobileSidebarToggler
    // directives, which worked by adding classes to <body>.

    public readonly sidebar = inject(UiSidebarService);

    /**
     * Desktop collapses to icon width; mobile is a full-width overlay, so the
     * element keeps its natural width there and slides in instead.
     */
    get sidebarWidth(): string | null {
        if (this.sidebar.isMobile()) return null;
        return this.sidebar.state() === 'collapsed'
            ? 'var(--sidebar-width-icon)'
            : 'var(--sidebar-width)';
    }
}
