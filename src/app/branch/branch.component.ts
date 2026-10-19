import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../shared/service/dataService';
import { AuthService } from '../shared/service/authService';
import { Router } from '@angular/router';
import { LoginService } from '../shared/service/loginService';
import { ToastCommonService } from '../shared/service/toastService';

@Component({
    selector: 'app-branch',
    templateUrl: 'branch.component.html',
    styleUrls: ['branch.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BranchComponent implements OnInit {
    countries: any = [];
    cities: any;
    countrieslist: any;
    private baseUrl: string = 'Branch/GetBranch';

    /** Search box text. Filters the rows already loaded - no extra request. */
    query: string = '';

    private label(row: any): string {
        const c = (row?.COUNTRY ?? '').toString().trim();
        return c ? c.replace(/\w\S*/g, (w: string) => w[0].toUpperCase() + w.slice(1).toLowerCase()) : 'Other';
    }

    /** Rows matching the search, grouped by COUNTRY in first-seen order. */
    get groups(): { country: string; rows: any[] }[] {
        const q = this.query.trim().toLowerCase();
        const out: { country: string; rows: any[] }[] = [];
        for (const row of this.countries) {
            const country = this.label(row);
            if (q && ![row.CITYNAME, row.CITYCODE, country].some(v => (v ?? '').toString().toLowerCase().includes(q))) { continue; }
            let g = out.find(x => x.country === country);
            if (!g) { g = { country, rows: [] }; out.push(g); }
            g.rows.push(row);
        }
        return out;
    }

    get firstMatch(): any { return this.groups[0]?.rows[0] ?? null; }

    get countryNames(): string[] {
        return Array.from(new Set<string>(this.countries.map((r: any) => this.label(r))));
    }

    // ---- map -------------------------------------------------------------------
    // Branch rows carry no coordinates, so city positions come from this table.
    // A branch whose city is not listed still appears in the list, just not on
    // the map. Keys are lower-case city names with any "-i" suffix removed, so
    // "Dhaka-i" shares Dhaka's position.

    private static readonly COORDS: { [city: string]: [number, number] } = {
        'mumbai': [72.88, 19.08], 'new delhi': [77.21, 28.61], 'delhi': [77.21, 28.61],
        'chennai': [80.27, 13.08], 'bangalore': [77.59, 12.97], 'bengaluru': [77.59, 12.97],
        'ahmedabad': [72.57, 23.02], 'cochin': [76.27, 9.93], 'kochi': [76.27, 9.93],
        'kolkata': [88.36, 22.57], 'tuticorin': [78.13, 8.76], 'tirupur': [77.34, 11.11],
        'lille lesquin': [3.10, 50.57], 'lille': [3.06, 50.63], 'paris': [2.35, 48.86],
        'shanghai': [121.47, 31.23], 'qingdao': [120.38, 36.07], 'xiamen': [118.09, 24.48],
        'beijing': [116.41, 39.90], 'dhaka': [90.41, 23.81], 'karachi': [67.01, 24.86],
        'lahore': [74.36, 31.55], 'hong kong': [114.17, 22.32], 'taipei': [121.56, 25.03],
        'phnom penh': [104.93, 11.56], 'hochiminh': [106.63, 10.82], 'ho chi minh': [106.63, 10.82],
        'hanoi': [105.85, 21.03], 'colombo': [79.86, 6.93], 'bangkok': [100.50, 13.75],
        // Links: further Indian cities, so Links branches outside MP's network
        // still get a pin. Unlisted cities stay in the list, just not on the map.
        'pune': [73.86, 18.52], 'hyderabad': [78.49, 17.39], 'surat': [72.83, 21.17],
        'vadodara': [73.18, 22.31], 'baroda': [73.18, 22.31], 'jaipur': [75.79, 26.91],
        'ludhiana': [75.86, 30.90], 'coimbatore': [76.96, 11.02], 'visakhapatnam': [83.22, 17.69],
        'vizag': [83.22, 17.69], 'goa': [73.83, 15.49], 'nhava sheva': [72.95, 18.95],
        'gurgaon': [77.03, 28.46], 'gurugram': [77.03, 28.46], 'noida': [77.39, 28.54],
        'gandhidham': [70.13, 23.08], 'kandla': [70.22, 23.03], 'mundra': [69.72, 22.84],
        'indore': [75.86, 22.72], 'nagpur': [79.09, 21.15], 'calcutta': [88.36, 22.57],
        'madras': [80.27, 13.08], 'bombay': [72.88, 19.08],
    };

    /** Branch currently highlighted in both the list and the map. */
    hovered: any = null;

    private _pinsFor: any[] | null = null;
    private _pins: { row: any; x: number; y: number; country: string }[] = [];

    /** Equirectangular projection of lon -5..130, lat 56..4 into the 640x340 viewBox. */
    private project(lon: number, lat: number): [number, number] {
        return [30 + ((lon + 5) / 135) * 580, 20 + ((56 - lat) / 52) * 300];
    }

    get pins(): { row: any; x: number; y: number; country: string }[] {
        if (this._pinsFor === this.countries) { return this._pins; }
        const out: { row: any; x: number; y: number; country: string }[] = [];
        for (const row of this.countries) {
            const key = (row?.CITYNAME ?? '').toString().trim().toLowerCase().replace(/-i$/, '').trim();
            const c = BranchComponent.COORDS[key];
            if (!c) { continue; }
            let [x, y] = this.project(c[0], c[1]);
            // Two branches in one city (Karachi and Karachi-i) would sit on top of
            // each other; step later ones sideways so both stay clickable.
            let guard = 0;
            while (out.some(p => Math.hypot(p.x - x, p.y - y) < 7) && guard++ < 6) { x += 9; }
            out.push({ row, x, y, country: this.label(row) });
        }
        this._pinsFor = this.countries;
        this._pins = out;
        return out;
    }

    /** Pins for the branches the search currently shows. */
    get visiblePins() {
        const shown = new Set<any>(); for (const g of this.groups) { for (const r of g.rows) { shown.add(r); } }
        return this.pins.filter(p => shown.has(p.row));
    }

    /** The hovered branch, or the search's top match when nothing is hovered. */
    get focusPin() {
        const row = this.hovered ?? (this.query ? this.firstMatch : null);
        return row ? this.pins.find(p => p.row === row) ?? null : null;
    }

    /** One faint label per country, centred under its pins. */
    get countryLabels(): { name: string; x: number; y: number }[] {
        const by: { [c: string]: { xs: number[]; ys: number[] } } = {};
        for (const p of this.pins) { if (!by[p.country]) { by[p.country] = { xs: [], ys: [] }; } by[p.country].xs.push(p.x); by[p.country].ys.push(p.y); }
        return Object.keys(by).map(name => {
            const xs = by[name].xs, ys = by[name].ys;
            return { name, x: xs.reduce((a, b) => a + b, 0) / xs.length, y: Math.max(...ys) + 24 };
        });
    }

    /** A gentle arc between two pins, bowed away from the straight line. */
    arc(a: { x: number; y: number }, b: { x: number; y: number }): string {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        const bow = Math.min(60, len * 0.22);
        const cx = mx - (dy / len) * bow, cy = my + (dx / len) * bow * -1;
        return `M${a.x} ${a.y}Q${cx} ${cy} ${b.x} ${b.y}`;
    }

    /** Enter in the search box opens the top match. */
    pickFirst(): void {
        const row = this.firstMatch;
        if (row) { this.setCity(row.CITYCODE); }
    }
    html: string;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService) {
    }

    ngOnInit(): void {
        let type = (this._loginService.getLogin()[0].CMPTYPE) ? this._loginService.getLogin()[0].CMPTYPE : "";
        const jsonBranch = { cmpid: this._loginService.getLogin()[0].CMPID, comptype: type };
        this._dataService.Common(this.baseUrl, jsonBranch)
            .subscribe((data: any) => {
                if (data.Table.length == 1) {
                    this.countries = data.Table;
                    this.setCity(data.Table[0].CITYCODE);
                } else {
                    this.countries = data.Table;
                }
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                },
                () => {
                });
    }

    setCity(citycode) {
        this.cities = this.countries.filter((countrylist: any) => countrylist.CITYCODE === citycode);
        this._loginService.setCityModify(this.cities);
        //this._router.navigate(['/module']);
        if (this._loginService.getLogin()[0].CMPTYPE == null) {
            this._router.navigate(['/company']);
        } else {
            this._router.navigate(['/module']);
        }
    }
}
