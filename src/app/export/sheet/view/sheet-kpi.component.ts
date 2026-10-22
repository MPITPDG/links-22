import { Component, ChangeDetectionStrategy, Input, OnChanges, inject } from '@angular/core';
import { SheetService } from '../sheet.service';

/**
 * Sheet view › KPI Summary tab. The workbook's KPI Summary sheet as live figures from the
 * "Sri Lanka parts and frames" tab (USP_EXPT_SHEET_KPI): parts and frames must not share a vessel.
 * Status per vessel = the workbook's formula: both > 0 -> violation, both 0 -> no parts / frames, else OK.
 */
interface KpiVessel { name: string; parts: number; frames: number; status: 'bad' | 'none' | 'ok'; }

@Component({
    selector: 'app-sheet-kpi',
    templateUrl: './sheet-kpi.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SheetKpiComponent implements OnChanges {
    private _api = inject(SheetService);
    @Input() monthId = 0;

    loading = false;
    error = '';
    vessels: KpiVessel[] = [];
    today: KpiVessel[] = [];
    latestStuffing = '';
    todayWos = 0;
    todayContainers = 0;
    todayFrames = 0;

    get violations(): KpiVessel[] { return this.vessels.filter(v => v.status === 'bad'); }
    get totalParts(): number { return this.vessels.reduce((t, v) => t + v.parts, 0); }
    get totalFrames(): number { return this.vessels.reduce((t, v) => t + v.frames, 0); }
    get violationNames(): string { return this.violations.map(v => v.name).join(', '); }

    ngOnChanges() { if (this.monthId) { this.load(); } }

    load() {
        this.loading = true; this.error = '';
        this._api.kpi(this.monthId).subscribe(r => {
            this.loading = false;
            if (!r.ok) { this.error = 'The KPI could not be worked out: ' + (r.text || 'the server did not answer') + '.'; return; }
            this.vessels = this._api.rows(r.ds, 'Table').map(x => this.vessel(x));
            const tot = this._api.rows(r.ds, 'Table1')[0] || {};
            this.latestStuffing = String(tot.LATEST_STUFFING_DT ?? tot.LATEST_STUFFING ?? '').trim();
            this.todayWos = +(tot.TODAY_WOS ?? 0) || 0;
            this.todayContainers = +(tot.TODAY_CONTAINERS ?? 0) || 0;
            this.todayFrames = +(tot.TODAY_FRAMES_WOS ?? tot.TODAY_FRAMES ?? 0) || 0;
            this.today = this._api.rows(r.ds, 'Table2').map(x => this.vessel(x));
        });
    }

    private vessel(x: any): KpiVessel {
        const parts = +(x.PARTS ?? x.PARTS_COUNT ?? 0) || 0, frames = +(x.FRAMES ?? x.FRAMES_COUNT ?? 0) || 0;
        return { name: String(x.VESSEL ?? x.VSL_NAME ?? '').trim(), parts, frames,
                 status: parts > 0 && frames > 0 ? 'bad' : (parts === 0 && frames === 0 ? 'none' : 'ok') };
    }
}
