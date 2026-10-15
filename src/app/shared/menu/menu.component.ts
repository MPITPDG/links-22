import { Component, OnInit, ChangeDetectionStrategy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Static } from '../../app.common';
import { LoginService } from '../service/loginService';
import { Router, ActivatedRoute } from '@angular/router';
import { inject } from '@angular/core';
import { UiSidebarService } from '../ui/sidebar.service';
import { ThemeService } from '../theme/theme.service';
import { CLASSIC_ID } from '../theme/palettes';

/**
 * Sidebar menu - ported from MPERPNG-20's shell. The menu DATA is Links' own
 * (Static.menuList.menu in app.common.ts); only the mechanics and the
 * presentation come from MP.
 */
@Component({
    selector: 'app-menu-sidebar',
    templateUrl: 'menu.component.html',
    providers: [LoginService],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MenuComponent implements OnInit, AfterViewInit {
    public menuList: any = [];
    public menuModuleName: string = '';

    private readonly _sidebar = inject(UiSidebarService);
    private readonly _theme = inject(ThemeService);
    /** True when any palette other than Classic is active. */
    themeActive(): boolean { return this._theme.current() !== CLASSIC_ID; }
    resetTheme(): void {
        this.userMenuOpen = false;
        this._theme.save(CLASSIC_ID, this._theme.scope(), this._theme.remember());
    }

    /**
     * Icon-only when the desktop sidebar is collapsed. On mobile the sidebar
     * is an overlay at full width, so it is never collapsed there.
     */
    get collapsed(): boolean {
        return !this._sidebar.isMobile() && this._sidebar.state() === 'collapsed';
    }

    /**
     * The rail identifies the module; the header carries the company, which
     * needs the width - at 16rem it truncated.
     */
    public companyName = '';

    get moduleLabel(): string {
        return (this.menuModuleName || 'Menu').toUpperCase();
    }

    /** Rough icon per module, with a generic fallback. */
    get moduleIcon(): string {
        const n = (this.menuModuleName || '').toLowerCase();
        if (n.indexOf('export') >= 0) return 'fa fa-ship';
        if (n.indexOf('import') >= 0) return 'fa fa-anchor';
        if (n.indexOf('account') >= 0) return 'fa fa-calculator';
        if (n.indexOf('master') >= 0) return 'fa fa-database';
        if (n.indexOf('admin') >= 0) return 'fa fa-cog';
        return 'fa fa-th-large';
    }

    // ---- user footer --------------------------------------------------------
    // Replaces the version string that used to sit in the footer. Identity
    // belongs at the bottom of the rail, which frees the header to carry only
    // the company and the branch.

    public userName = '';
    public userRole = '';
    public userImage = '';
    public userMenuOpen = false;

    private bindUser(): void {
        const l = this._loginService.getLogin()?.[0];
        if (!l) return;
        // FULLNAME is the display name; GREETING is the 'Welcome' prefix the old
        // header rendered, which we drop - the name alone is enough.
        this.userName = (l.FULLNAME ?? l.CMP_USERNAME ?? '').toString().trim();
        this.userRole = (l.CITYNAME ?? l.CITYCODE ?? '').toString().trim();
        this.userImage = (l.IMAGE ?? '').toString().trim();
        this.companyName = (l.CMPNAME ?? '').toString().trim();
    }

    /** Initials, used when the user has no photo on file. */
    get userInitials(): string {
        const parts = this.userName.split(/\s+/).filter(Boolean);
        if (!parts.length) return '?';
        return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
    }

    toggleUserMenu(event?: Event): void {
        if (event) { event.preventDefault(); event.stopPropagation(); }
        this.userMenuOpen = !this.userMenuOpen;
    }

    closeUserMenu(): void { this.userMenuOpen = false; }

    /** Links' existing logout: LoginService.removeLogin() (unchanged). */
    logout(): void {
        this.userMenuOpen = false;
        this._loginService.removeLogin();
    }

    goTheme(): void {
        this.userMenuOpen = false;
        this._router.navigate(['/Profile/Theme']);
    }

    /** Links' existing change-password route (profile.routing.ts). */
    goProfile(): void {
        this.userMenuOpen = false;
        this._router.navigate(['/Profile/ChangePassword']);
    }

    constructor(private _loginService: LoginService, private _activatedRoute: ActivatedRoute, private _router: Router) { }

    @ViewChild('navScroll') navScroll: ElementRef<HTMLElement>;

    /** Put the menu back where the user had it scrolled to before the rebuild. */
    ngAfterViewInit(): void {
        const el = this.navScroll?.nativeElement;
        if (el) el.scrollTop = this._sidebar.navScrollTop;
    }

    /** Remember the scroll offset; the next navigation destroys this element. */
    onNavScroll(event: Event): void {
        this._sidebar.navScrollTop = (event.target as HTMLElement).scrollTop;
    }

    ngOnInit(): void {
        if (this._loginService.getLogin() !== null) {
            // The menu binds from the route first, then the stored MODULEID (MP
            // d7f7921). The previous Links version compared the layout's own
            // routeConfig.path with the MODULEID's baseUrl and bounced to
            // /module on a mismatch, so a deep link into another module (or
            // /dashboard right after login) either redirected or left the rail
            // empty. Resolving from the URL makes that redirect unnecessary.
            this.bindMenu();
            this.bindUser();
            this.revealActive();
        }
    }

    /**
     * MODULEID is only written by the module picker (setModuleModify). Land on
     * a deep URL without going through the picker - a bookmark, a shared link,
     * or a fresh login followed by a direct navigation - and MODULEID still
     * holds whatever was last picked, so the sidebar bound the wrong menu or
     * none at all.
     *
     * Every registered module already declares its own baseUrl, so the top-level
     * route segment identifies the module without a second mapping to keep in
     * sync. Matching on baseUrl also settles the Accounts split for free:
     * 'accounts' and 'accounts-fra' are separate entries, so no CITYCODE test is
     * needed when the URL is what decides.
     */
    private moduleFromUrl(): any | null {
        const seg = (this._router.url.split('?')[0].split('/')[1] || '').toLowerCase();
        if (!seg) return null;
        return Static.menuList.menu.find(
            (m: any) => (m.baseUrl ?? '').toLowerCase() === seg) ?? null;
    }

    /** The stored MODULEID, used whenever the route doesn't name a module. */
    private moduleFromLogin(): any | null {
        const login = this._loginService.getLogin()[0];
        const moduleId = login.MODULEID;
        const isFrance = moduleId == '1' && (login.CITYCODE === 'LIL' || login.CITYCODE === 'PAR');
        // Guarded lookup -- a login whose MODULEID doesn't match any registered
        // module (e.g. null/blank) used to throw reading .modulename/.data off
        // undefined. Now it just leaves the sidebar empty instead of crashing.
        return (isFrance
            ? Static.menuList.menu.find((m: any) => m.moduleid == moduleId && m.type === 'FRANCE')
            : Static.menuList.menu.find((m: any) => m.moduleid == moduleId && m.type == null)) ?? null;
    }

    bindMenu() {
        // Route first, so a deep link shows the menu for the page you are on.
        const found = this.moduleFromUrl() ?? this.moduleFromLogin();
        this.menuModuleName = found ? found.modulename : '';
        this.menuBaseUrl = found ? (found.baseUrl ?? '') : '';
        this.menuList = found ? this.filterByCity(found.data ?? []) : [];
    }

    /** Items may carry an optional `citycodes` list; hide them for any other login branch. */
    private filterByCity(items: any[]): any[] {
        const city = (this._loginService.getLogin()?.[0]?.CITYCODE ?? '').toString().trim().toUpperCase();
        const walk = (list: any[]): any[] => (list ?? [])
            .filter(i => !Array.isArray(i?.citycodes) || i.citycodes.indexOf(city) >= 0)
            .map(i => (i?.data?.length ? { ...i, data: walk(i.data) } : i));
        return walk(items);
    }

    // ---- expand / collapse -------------------------------------------------
    // Previously handled by the CoreUI appNavDropdown / appNavDropdownToggle
    // directives, which toggled a class on the <li> and relied on the vendor
    // stylesheet to show or hide the child <ul>.
    //
    // The open branches are held in UiSidebarService, not here. app.component
    // sets routeReuseStrategy.shouldReuseRoute = () => false, so navigating
    // rebuilds this component; keeping the set locally meant an open menu
    // closed itself the moment you clicked an item inside it.

    /** baseUrl of the module whose menu is bound; drives the Dashboard link. */
    menuBaseUrl: string = '';

    /** Admin has no landing page in Links, so it gets no Dashboard entry (MP 2e54651). */
    get hasDashboard(): boolean {
        return !['admin', 'edixml'].includes((this.menuBaseUrl || '').toLowerCase());
    }

    /** Export job-state alerts page, listed next to Dashboard in the Export menu (as MP). */
    get hasToday(): boolean {
        return (this.menuBaseUrl || '').toLowerCase() === 'export';
    }

    /**
     * The Dashboard entry opens the landing page of the module you are in - the
     * same url the module picker enters it with. Export lands on the Export
     * Dashboard at '/dashboard' (as MP; '/export' only redirects there), and so
     * does an unbound menu; every other module at '/<baseUrl>' (Accounts ->
     * '/accounts', Import -> '/import').
     */
    get dashboardLink(): string {
        const b = (this.menuBaseUrl || '').toLowerCase();
        if (!b || b === 'export') { return '/dashboard'; }
        return '/' + this.menuBaseUrl;
    }

    /** Stable key for a node, since the menu tree carries no ids at every level. */
    nodeKey(parentKey: string, item: any, index: number): string {
        return parentKey + '/' + (item?.menuname ?? index);
    }

    isExpanded(key: string): boolean { return this._sidebar.isExpanded(key); }

    toggle(key: string, event?: Event): void {
        if (event) { event.preventDefault(); event.stopPropagation(); }
        this._sidebar.toggleExpanded(key);
    }

    /**
     * Open the branches leading to the current URL, so landing deep in a module
     * reveals where you are instead of showing a collapsed list. Only ever
     * opens - never closes what the user opened themselves.
     */
    private revealActive(): void {
        const url = this._router.url;
        const walk = (items: any[], parentKey: string) => {
            (items ?? []).forEach((item, i) => {
                const key = this.nodeKey(parentKey, item, i);
                const children = item?.data ?? [];
                const link = (item?.routerlink ?? '').toString();
                if (link && link !== '/' && url.indexOf(link) === 0) {
                    // open every ancestor of the matched leaf
                    let k = parentKey;
                    if (k) this._sidebar.expand(k);
                }
                if (children.length) {
                    const before = url;
                    walk(children, key);
                    // if any descendant matches, this branch has to be open too
                    if (this.subtreeMatches(children, before)) this._sidebar.expand(key);
                }
            });
        };
        walk(this.menuList, '');
    }

    private subtreeMatches(items: any[], url: string): boolean {
        return (items ?? []).some(item => {
            const link = (item?.routerlink ?? '').toString();
            if (link && link !== '/' && url.indexOf(link) === 0) return true;
            return this.subtreeMatches(item?.data ?? [], url);
        });
    }

    /** A node is a branch when it is flagged as a parent or actually has children. */
    hasChildren(item: any): boolean {
        return item?.ischild === 'y' || (item?.data?.length ?? 0) > 0;
    }

    // ---- row classes --------------------------------------------------------
    // Built here rather than with [class.x] bindings in the template: Tailwind
    // arbitrary values contain brackets and parentheses - bg-[var(--sidebar-accent)]
    // - which are not safe inside an Angular class-binding name.

    private readonly ROW_BASE =
        'flex w-full items-center gap-2.5 rounded-lg text-left transition-colors ' +
        'hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]';

    /** A branch row. Highlighted while open so the tree reads clearly. */
    branchCls(key: string, depth: number): string {
        const open = !this.collapsed && this.isExpanded(key);
        return [
            this.ROW_BASE,
            depth === 0 ? 'h-9 text-sm' : 'h-8 text-[13px]',
            this.collapsed ? 'justify-center px-0' : 'px-2.5',
            open
                ? 'bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]'
                : 'text-[var(--sidebar-foreground)]',
        ].join(' ');
    }

    /** A leaf row. routerLinkActive supplies the active state on top of this. */
    leafCls(depth: number): string {
        return [
            this.ROW_BASE,
            depth === 0 ? 'h-9 text-sm' : 'h-8 text-[13px]',
            this.collapsed ? 'justify-center px-0' : 'px-2.5',
            'text-[var(--sidebar-foreground)]',
        ].join(' ');
    }

    trackNode = (index: number, item: any) => item?.menuname ?? index;
}
