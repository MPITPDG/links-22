import { Component, OnInit, ViewChild, ElementRef, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { Static } from '../app.common';
import { DataService } from '../shared/service/dataService';
import { AuthService } from '../shared/service/authService';
import { Router } from '@angular/router';
import { ToastCommonService } from '../shared/service/toastService';
import { LoginService } from '../shared/service/loginService';
import { companyLogo, isOlspl } from '../shared/company-branding';
import { environment } from '../../environments/environment';

@Component({
    templateUrl: 'module.component.html',
    styleUrls: ['module.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ModuleComponent implements OnInit {
    @ViewChild('selector', {static: false}) selector: ElementRef;
    public moduleData = [];

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService) { }

    ngOnInit() {
        // if (this._loginService.getLogin()[0].CITYCODE != 'LIL' || this._loginService.getLogin()[0].CITYCODE != 'PAR' ||this._loginService.getLogin()[0].COUNTRY != 'INDIA') 
        // {   
        //     this.modules('3','/export')
        // }
        this.moduleData = this.getModuleDataList();
        // The radial menu's per-item rotate() styles (listyle / labelstyle) are
        // no longer used: the picker is MP's segmented donut + grouped list.
        this.segments = this.buildSegments();
        this.screens = this.buildScreens();
    }

    // ---- context ------------------------------------------------------------

    get cityName(): string { return this.login()?.CITYNAME ?? ''; }
    get companyName(): string { return this.login()?.CMPNAME ?? ''; }
    get olspl(): boolean { return isOlspl(this.login()?.CMPCODE); }
    get companyLogo(): string { return companyLogo(this.login()?.CMPCODE); }
    private login(): any { try { return this._loginService.getLogin()?.[0]; } catch { return null; } }

    isSoon(m: any): boolean { return m?.url == null; }
    isExternal(m: any): boolean { return m?.moduleid == 7; }
    /** Existing entries carry 'fa fa-x fa-2x'; the tile sizes the glyph itself. */
    iconClass(m: any): string { return (m?.icon ?? '').replace(/\s*fa-\dx/g, ''); }

    // ---- donut ---------------------------------------------------------------
    // One segment per module, ordered by group so each group reads as one arc.
    // Geometry is in the SVG's own 0-400 viewBox, so the donut scales with its box.

    readonly groups = [
        { key: 'ops', label: 'Operations', color: '#3B82F6' },
        { key: 'fin', label: 'Finance and records', color: '#10B981' },
        { key: 'sys', label: 'Documents and system', color: '#64748B' },
    ];

    /**
     * Group and one-line description per module id - Links' own picker list
     * (getModuleDataList below). Unknown ids fall into system. Note Links'
     * Admin tile is moduleid 12 (MP's is 2).
     */
    private readonly meta: { [id: number]: { g: string; d: string } } = {
        3: { g: 'ops', d: 'Consignments, shipping and documents' },
        4: { g: 'ops', d: 'Arrivals, clearance and delivery' },
        1: { g: 'fin', d: 'Invoices, ledgers and reports' },
        8: { g: 'fin', d: 'Parties, vessels and rates' },
        7: { g: 'sys', d: 'Document archive - opens in a new tab' },
        12: { g: 'sys', d: 'Users, rights and settings' },
        2: { g: 'sys', d: 'Users, rights and settings' },
        11: { g: 'sys', d: 'Report a problem to IT' },
    };

    segments: { m: any; d: string; color: string; group: string; desc: string; lx: number; ly: number; dx: number; dy: number }[] = [];
    hovered: any = null;

    private buildSegments() {
        const order = this.groups.map(g => g.key);
        const mods = [...this.moduleData].sort((a, b) =>
            order.indexOf((this.meta[a.moduleid] || { g: 'sys' }).g) - order.indexOf((this.meta[b.moduleid] || { g: 'sys' }).g));
        const cx = 200, cy = 200, R = 192, r = 112, gap = 0.018, n = mods.length || 1;
        const pt = (rad: number, a: number) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
        return mods.map((m, i) => {
            const meta = this.meta[m.moduleid] || { g: 'sys', d: '' };
            const grp = this.groups.find(g => g.key === meta.g)!;
            const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n + gap;
            const a1 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / n - gap;
            const mid = (a0 + a1) / 2;
            const [x0, y0] = pt(R, a0), [x1, y1] = pt(R, a1), [x2, y2] = pt(r, a1), [x3, y3] = pt(r, a0);
            const large = a1 - a0 > Math.PI ? 1 : 0;
            const [lx, ly] = pt((R + r) / 2, mid);
            return {
                m, color: grp.color, group: grp.label, desc: meta.d,
                d: `M${x0} ${y0}A${R} ${R} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${r} ${r} 0 ${large} 0 ${x3} ${y3}Z`,
                lx, ly,
                dx: Math.cos(mid) * 7, dy: Math.sin(mid) * 7,
            };
        });
    }

    modulesIn(groupKey: string) { return this.segments.filter(x => x.group === (this.groups.find(g => g.key === groupKey)?.label)); }

    /** Group colour for a module, for its icon tile in the palette and list. */
    colorOf(m: any): string {
        const g = (this.meta[m?.moduleid] || { g: 'sys' }).g;
        return (this.groups.find(x => x.key === g) || this.groups[2]).color;
    }

    get hoveredSeg() { return this.segments.find(x => x.m === this.hovered) || null; }

    // ---- command palette ------------------------------------------------------
    // Indexes every leaf screen in the sidebar menu tree (Static.menuList), for
    // the modules this branch offers only. Opening a result goes through
    // modules(moduleid, link) - the same gate the tiles use - so external
    // modules, unfinished ones and the moduleid-2 CMPID check behave exactly as
    // before.

    screens: { label: string; path: string; link: string; moduleid: number }[] = [];
    paletteOpen: boolean = false;
    paletteQuery: string = '';
    paletteIndex: number = 0;

    @ViewChild('paletteInput') paletteInput: ElementRef<HTMLInputElement>;

    private buildScreens() {
        const out: { label: string; path: string; link: string; moduleid: number }[] = [];
        for (const mod of this.moduleData) {
            if (mod.url == null || this.isExternal(mod)) { continue; }
            const base = (mod.url || '').split('/').filter(Boolean)[0] || '';
            const trees = (Static.menuList.menu as any[]).filter(t => Number(t.moduleid) === mod.moduleid);
            // Accounts has a plain and a FRANCE tree under one module id; the
            // tile's own url decides which one this branch uses.
            const tree = trees.find(t => (t.baseUrl || '').toLowerCase() === base.toLowerCase()) || trees[0];
            if (!tree) { continue; }
            const walk = (items: any[], trail: string[]) => {
                for (const item of items || []) {
                    const name = (item?.menuname ?? '').toString().trim();
                    const kids = item?.data ?? [];
                    if (kids.length) { walk(kids, [...trail, name]); }
                    else if (item?.routerlink) {
                        out.push({ label: name, path: [mod.name, ...trail].join(' › '), link: item.routerlink, moduleid: mod.moduleid });
                    }
                }
            };
            walk(tree.data, []);
        }
        return out;
    }

    get paletteItems(): { kind: 'module' | 'screen'; ref: any }[] {
        const q = this.paletteQuery.trim().toLowerCase();
        const mods = (q ? this.moduleData.filter(m => m.name.toLowerCase().includes(q)) : this.moduleData)
            .map(m => ({ kind: 'module' as const, ref: m }));
        if (!q) { return mods; }
        const words = q.split(/\s+/);
        const screens = this.screens
            .filter(x => { const hay = (x.label + ' ' + x.path).toLowerCase(); return words.every(w => hay.includes(w)); })
            .sort((a, b) => {
                const as = a.label.toLowerCase().startsWith(q) ? 0 : 1;
                const bs = b.label.toLowerCase().startsWith(q) ? 0 : 1;
                return as - bs || a.label.length - b.label.length;
            })
            .slice(0, 40)
            .map(x => ({ kind: 'screen' as const, ref: x }));
        return [...mods, ...screens];
    }

    openPalette(): void {
        this.paletteOpen = true;
        this.paletteQuery = '';
        this.paletteIndex = 0;
        setTimeout(() => this.paletteInput?.nativeElement.focus());
    }

    closePalette(): void { this.paletteOpen = false; }

    onPaletteInput(value: string): void { this.paletteQuery = value; this.paletteIndex = 0; }

    movePalette(step: number, event: Event): void {
        event.preventDefault();
        const n = this.paletteItems.length;
        if (!n) { return; }
        this.paletteIndex = (this.paletteIndex + step + n) % n;
        setTimeout(() => document.getElementById('mp-pal-' + this.paletteIndex)?.scrollIntoView({ block: 'nearest' }));
    }

    choosePalette(item?: { kind: 'module' | 'screen'; ref: any }): void {
        const it = item ?? this.paletteItems[this.paletteIndex];
        if (!it) { return; }
        this.paletteOpen = false;
        if (it.kind === 'module') { this.modules(it.ref.moduleid, it.ref.url); }
        else { this.modules(it.ref.moduleid, it.ref.link); }
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(e: KeyboardEvent): void {
        if ((e.ctrlKey || e.metaKey) && (e.key || '').toLowerCase() === 'k') {
            e.preventDefault();
            if (this.paletteOpen) { this.closePalette(); } else { this.openPalette(); }
        } else if (e.key === 'Escape' && this.paletteOpen) {
            this.closePalette();
        }
    }

    modules(moduleid, url) {
        if (url != null) {
            // if  (moduleid != 1) {                 
            //     this._loginService.getLogin()[0].FINANCIAL_YEAR[0]= null;   }
            if (moduleid == 7) {
                this.externalUrl(7);
            }       
            else if  (moduleid == 2) {
                    if (this._loginService.getLogin()[0].CMPID=="1" )
                    {
                        this._loginService.setModuleModify(moduleid);
                        this._router.navigate([url]);
                    }
                    else
                    {
                        this._toasterService.toast("warning", "Alert", "No Access");
                    }
                }
             else {
                this._loginService.setModuleModify(moduleid);
                this._router.navigate([url]);
            }
        } else {
            this._toasterService.toast("warning", "Alert", "Working Under Process");
        }
    }


    externalUrl(moduleid) {
        if (moduleid == 7) { 
            let url = environment.edocumentIp 
            + "eDocument-Links/View.html#/AutoLogin?huhpnk=" + this._loginService.getLogin()[0].CMP_USERENCCODE 
            + "&cityname=" + this._loginService.getLogin()[0].CITYNAME
            + "&cmpcode=" + this._loginService.getLogin()[0].CMPCODE 
            + "&citycode=" + this._loginService.getLogin()[0].CITYCODE 
            + "&RoleType=" + this._loginService.getLogin()[0].ROLETYPE 
            + "&citycode1=" + this._loginService.getLogin()[0].CITYCODE1 
            + "&level=" + this._loginService.getLogin()[0].RIGHTS_CODE 
            + "&CurLogInIP=" + environment.edocumentIp + "edocument";
            window.open(url, "_blank");
        }
    }

    getModuleDataList() {
        let tmpArray = [];
        // if (this._loginService.getLogin()[0].CITYCODE === 'LIL' || this._loginService.getLogin()[0].CITYCODE === 'PAR') {
        //     tmpArray = [
        //         { id: 1, moduleid: 1, name: 'Finance', listyle: null, labelstyle: null, icon: 'fa fa-inr fa-2x', url: '/accounts-fra' },
        //         { id: 2, moduleid: 8, name: 'Master', listyle: null, labelstyle: null, icon: 'fa fa-plus-square fa-2x', url: '/master' },
        //         { id: 3, moduleid: 3, name: 'Export', listyle: null, labelstyle: null, icon: 'fa fa-exchange fa-2x', url: '/export' },
        //         { id: 4, moduleid: 10, name: 'Order', listyle: null, labelstyle: null, icon: 'fa fa-shopping-cart fa-2x', url: null },
        //         //{ id: 5, moduleid: 12, name: 'ICS', listyle: null, labelstyle: null, icon: 'fa fa-sitemap fa-2x', url: null },
        //         //{ id: 6, moduleid: 6, name: 'BHEL', listyle: null, labelstyle: null, icon: 'fa fa-tachometer fa-2x', url: null },
        //         { id: 7, moduleid: 11, name: 'Raise Ticket', listyle: null, labelstyle: null, icon: 'fa fa-ticket fa-2x', url: null },
        //         //{ id: 8, moduleid: 12, name: 'Profile', listyle: null, labelstyle: null, icon: 'fa fa-user-circle-o fa-2x', url: null },
        //         { id: 9, moduleid: 5, name: 'EDI/XML', listyle: null, labelstyle: null, icon: 'fa fa-comments-o fa-2x', url: null },
        //         { id: 10, moduleid: 7, name: 'E-Doc', listyle: null, labelstyle: null, icon: 'fa fa-folder-open fa-2x', url: '7' },
        //         { id: 11, moduleid: 9, name: 'Import', listyle: null, labelstyle: null, icon: 'fa fa-cubes fa-2x', url: '/importfra' },
        //         { id: 12, moduleid: 2, name: 'Admin', listyle: null, labelstyle: null, icon: 'fa fa-cogs fa-2x', url: null }
        //     ];
        // } else 
        if (this._loginService.getLogin()[0].COUNTRY === 'INDIA') {
            tmpArray = [
                { id: 1, moduleid: 1, name: 'Finance', listyle: null, labelstyle: null, icon: 'fa fa-inr fa-2x', url: '/accounts' },
                { id: 2, moduleid: 8, name: 'Master', listyle: null, labelstyle: null, icon: 'fa fa-plus-square fa-2x', url: '/master' },
                { id: 3, moduleid: 3, name: 'Export', listyle: null, labelstyle: null, icon: 'fa fa-exchange fa-2x', url: '/dashboard' },
               // { id: 4, moduleid: 10, name: 'Order', listyle: null, labelstyle: null, icon: 'fa fa-shopping-cart fa-2x', url: null },
                //{ id: 5, moduleid: 12, name: 'ICS', listyle: null, labelstyle: null, icon: 'fa fa-sitemap fa-2x', url: null },
                //{ id: 6, moduleid: 6, name: 'BHEL', listyle: null, labelstyle: null, icon: 'fa fa-tachometer fa-2x', url: null },
                { id: 7, moduleid: 11, name: 'Raise Ticket', listyle: null, labelstyle: null, icon: 'fa fa-ticket fa-2x', url: '/tickets' },
                //{ id: 8, moduleid: 12, name: 'Profile', listyle: null, labelstyle: null, icon: 'fa fa-user-circle-o fa-2x', url: null },
                //{ id: 9, moduleid: 5, name: 'EDI/XML', listyle: null, labelstyle: null, icon: 'fa fa-comments-o fa-2x', url: null },
                { id: 10, moduleid: 7, name: 'E-Doc', listyle: null, labelstyle: null, icon: 'fa fa-folder-open fa-2x', url: '7' },
                { id: 11, moduleid: 4, name: 'Import', listyle: null, labelstyle: null, icon: 'fa fa-cubes fa-2x', url: '/import' },
                { id: 12, moduleid: 12, name: 'Admin', listyle: null, labelstyle: null, icon: 'fa fa-cogs fa-2x', url: '/admin' }
            ];
        }
        //  else {
        //     tmpArray = [
        //         { id: 2, moduleid: 8, name: 'Master', listyle: null, labelstyle: null, icon: 'fa fa-plus-square fa-2x', url: '/master' },
        //         { id: 3, moduleid: 3, name: 'Export', listyle: null, labelstyle: null, icon: 'fa fa-exchange fa-2x', url: '/export' },
        //         //{ id: 5, moduleid: 12, name: 'ICS', listyle: null, labelstyle: null, icon: 'fa fa-sitemap fa-2x', url: null },
        //         //{ id: 6, moduleid: 6, name: 'BHEL', listyle: null, labelstyle: null, icon: 'fa fa-tachometer fa-2x', url: null },
        //         { id: 7, moduleid: 11, name: 'Raise Ticket', listyle: null, labelstyle: null, icon: 'fa fa-ticket fa-2x', url: null },
        //         { id: 8, moduleid: 12, name: 'Profile', listyle: null, labelstyle: null, icon: 'fa fa-user-circle-o fa-2x', url: null },
        //         { id: 10, moduleid: 7, name: 'E-Doc', listyle: null, labelstyle: null, icon: 'fa fa-folder-open fa-2x', url: '7' }
        //     ];
        // }
        return tmpArray;
    }
}
