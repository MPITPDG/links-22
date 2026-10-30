import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { DESC_FIT_LINES, printLines } from './mtd-description-format';
import {
    MTD_SHEET_CSS, MTD_TERMS, MtdLetterhead, mtdLetterhead, mtdLogoUrl, MtdSheetData, MtdStamp, sheetText
} from './mtd-sheet';

/**
 * The MTO / Multimodal B/L print sheet (see mtd-sheet.ts). One renderer for both uses:
 *  - the live preview beside the MTO form (live = true: boxes clickable, `hot` box outlined, overflow marker);
 *  - the hidden copy bound to the saved values that openMtdPrintWindow() copies into the print window.
 * data-f on a box = the id of the form field that fills it.
 */
@Component({
    selector: 'app-mtd-sheet',
    template: `
<div class="mtd-sheet" [class.live]="live" (click)="onPick($event)">
@if (show !== 'rider') {
<div class="mtd-page">
 <div class="mtd-doc">
  <div class="mtd-title">MULTIMODAL TRANSPORT DOCUMENT</div>
  <div class="mtd-top">
   <div class="mtd-left">
    <div class="mtd-box mtd-h0"></div>
    <div class="mtd-box mtd-h1" data-f="shipper" [class.hot]="hot === 'shipper'"><span class="mtd-cap">Shipper / Consignor</span><div class="mtd-val">{{ t(d?.SHIPPER) }}</div></div>
    <div class="mtd-box mtd-h2" data-f="consignee" [class.hot]="hot === 'consignee'"><span class="mtd-cap">Consignee (or order)</span><div class="mtd-val">{{ t(d?.CONSIGNEE) }}</div></div>
    <div class="mtd-box mtd-h3" data-f="notify" [class.hot]="hot === 'notify'"><span class="mtd-cap">Notify Address</span><div class="mtd-val">{{ t(d?.NOTIFYPARTY) }}</div></div>
    <div class="mtd-pair">
     <div class="mtd-box mtd-p1 mtd-br" data-f="carriage" [class.hot]="hot === 'carriage'"><span class="mtd-cap">Place of Receipt</span><div class="mtd-val">{{ t(d?.CARRIER) }}</div></div>
     <div class="mtd-box mtd-p2" data-f="receipt" [class.hot]="hot === 'receipt'"><span class="mtd-cap mtd-c">Port of Loading</span><div class="mtd-val">{{ t(d?.RECPTPLACE) }}</div></div>
    </div>
   </div>
   <div class="mtd-right">
    <div class="mtd-refs">
     <div class="mtd-k">MTD Number</div>
     <div class="mtd-v" data-f="fcrno" [class.hot]="hot === 'fcrno'">{{ t(d?.FCRNO) }}</div>
     <div class="mtd-k">Shipment reference</div>
     <div class="mtd-v mtd-v2" data-f="sexptno" [class.hot]="hot === 'sexptno'">{{ t(d?.EXPNO) }}</div>
    </div>
    <div class="mtd-lh">
     <img class="mtd-logo" [src]="logoUrl" alt="">
     <div class="mtd-co">{{ lh.name }}</div>
     @for (line of lh.address; track $index) {<div class="mtd-ad">{{ line }}</div>}
     @for (line of lh.regd; track $index) {<div class="mtd-rg">{{ line }}</div>}
    </div>
    <div class="mtd-terms"><p>{{ terms[0] }}</p><p>{{ terms[1] }}</p></div>
   </div>
  </div>
  <div class="mtd-route">
   <div class="mtd-box mtd-r1 mtd-br" data-f="discharge" [class.hot]="hot === 'discharge'"><span class="mtd-cap">Port Of Discharge</span><div class="mtd-val">{{ t(d?.POD) }}</div></div>
   <div class="mtd-box mtd-r2 mtd-br" data-f="delivery" [class.hot]="hot === 'delivery'"><span class="mtd-cap mtd-c">Place of Delivery</span><div class="mtd-val">{{ t(d?.PODEL) }}</div></div>
   <div class="mtd-box mtd-r3" data-f="vessel" [class.hot]="hot === 'vessel'"><span class="mtd-cap">Vessel /Voyage No.</span><div class="mtd-val">{{ t(d?.VESSEL) }}</div></div>
   <div class="mtd-box mtd-r4"><span class="mtd-cap mtd-c">Route/Place of transhipment(if any)</span><div class="mtd-val mtd-c">SEA</div></div>
  </div>
  <div class="mtd-cargo">
   @if (watermark) {<img class="mtd-wm" [src]="logoUrl" alt="">}
   <div class="mtd-cols mtd-ch">
    <div>Container No.(s)</div>
    <div>Marks &amp; Numbers</div>
    <div class="mtd-c">Number of packages,kinds of packages<br>general description of goods (Said to Contain.)</div>
    <div>Gross weight</div>
    <div>Measurement</div>
   </div>
   <div class="mtd-cols mtd-cb">
    <div data-f="marks" [class.hot]="hot === 'marks'">{{ t(d?.MARKSANDNOS) }}</div>
    <div data-f="pkgs" [class.hot]="hot === 'pkgs'">{{ t(d?.NOOFPKGS) }}</div>
    <div class="mtd-d" data-f="desc" [class.hot]="hot === 'desc'">{{ desc.text }}</div>
    <div data-f="grwt" [class.hot]="hot === 'grwt'">{{ t(d?.GRWT) }}</div>
    <div data-f="cbm" [class.hot]="hot === 'cbm'">{{ t(d?.VOL) }}</div>
   </div>
   @if (live && desc.over > 0) {<div class="mtd-limit"><span>{{ desc.over }} {{ desc.over === 1 ? 'line' : 'lines' }} past the printed column</span></div>}
   @if (stamp) {<div class="mtd-stamp">{{ stamp }}</div>}
   @if (onBoard) {<div class="mtd-board">SHIPPED ON BOARD<br>DATE: {{ onBoard }}</div>}
  </div>
  <div class="mtd-frt">
   <div class="mtd-box mtd-f1 mtd-br" data-f="freight" [class.hot]="hot === 'freight'"><span class="mtd-cap">Freight amount</span><div class="mtd-val">{{ t(d?.MISC) }}</div></div>
   <div class="mtd-box mtd-f2 mtd-br" data-f="prepaid" [class.hot]="hot === 'prepaid'"><span class="mtd-cap">Freight Payable at</span><div class="mtd-val">{{ t(d?.PP) }}</div></div>
   <div class="mtd-box mtd-f3 mtd-br" data-f="collect" [class.hot]="hot === 'collect'"><span class="mtd-cap">Number of original MTD</span><div class="mtd-val">{{ t(d?.CC) }}</div></div>
   <div class="mtd-box mtd-f4" data-f="placedt" [class.hot]="hot === 'placedt'"><span class="mtd-cap">Place and date of issue</span><div class="mtd-val">{{ t(d?.PLACEDATE) }}</div></div>
  </div>
  <div class="mtd-bot">
   <div class="mtd-box mtd-b1 mtd-br" data-f="others" [class.hot]="hot === 'others'">
    <span class="mtd-cap">Other Particulars (if any)</span>
    <span class="mtd-agent">Agent Address</span>
    <div class="mtd-val">{{ t(d?.APPLYTO) }}</div>
    <div class="mtd-foot">weight and measurment of container not to be included<br>(TERMS CONTINUED ON BACK HEREOF)</div>
   </div>
   <div class="mtd-box mtd-b2">
    <span class="mtd-cap">For {{ lh.name }}</span>
    <div class="mtd-agents">AS AGENTS FOR THE CARRIER</div>
   </div>
  </div>
 </div>
</div>
}
@if (show !== 'main' && hasRider) {
<div class="mtd-page mtd-rider">
 <div class="mtd-doc">
  <div class="mtd-rhead"><span class="mtd-rt">RIDER / ATTACHED SHEET</span><span class="mtd-k">MTD Number<span class="mtd-v">{{ t(d?.FCRNO) }}</span></span></div>
  <div class="mtd-rbody" data-f="rider" [class.hot]="hot === 'rider'"><div class="mtd-val">{{ t(d?.Rider) }}</div></div>
 </div>
 @if (stamp) {<div class="mtd-stamp">{{ stamp }}</div>}
</div>
}
</div>
`,
    styles: [MTD_SHEET_CSS, ':host{display:block;width:794px}'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MtdSheetComponent {
    /** the values to print (the MTO component itself for the preview, its saved snapshot for the print) */
    @Input() d: MtdSheetData | null = null;
    @Input() cmpCode: any = '';
    @Input() stamp: MtdStamp = '';
    /** dd/mm/yyyy for SHIPPED ON BOARD, '' = not printed */
    @Input() onBoard = '';
    @Input() watermark = false;
    /** id of the focused form field: its box is outlined */
    @Input() hot = '';
    /** which page(s) to render; the rider page only exists when Rider has text */
    @Input() show: 'all' | 'main' | 'rider' = 'all';
    /** preview mode: clickable boxes, highlight and overflow marker */
    @Input() live = false;
    /** a box was clicked: the id of its form field */
    @Output() pick = new EventEmitter<string>();

    readonly terms = MTD_TERMS;
    readonly t = sheetText;

    private lhFor: any = null;
    private lhCache: MtdLetterhead = mtdLetterhead('');
    private logoFor: any = null;
    private logoCache = '';
    private descFor: string | null = null;
    private descCache = { text: '', lines: 0, over: 0 };

    constructor(private host: ElementRef<HTMLElement>) { }

    /** the rendered .mtd-sheet element (what the print window copies) */
    get root(): HTMLElement | null {
        return this.host.nativeElement.querySelector('.mtd-sheet');
    }

    get lh(): MtdLetterhead {
        if (this.lhFor !== this.cmpCode) {
            this.lhFor = this.cmpCode;
            this.lhCache = mtdLetterhead(this.cmpCode);
        }
        return this.lhCache;
    }

    get logoUrl(): string {
        if (this.logoFor !== this.cmpCode || !this.logoCache) {
            this.logoFor = this.cmpCode;
            this.logoCache = mtdLogoUrl(this.cmpCode);
        }
        return this.logoCache;
    }

    /** the description as it prints: lines wider than the column wrapped at word boundaries (as the fit meter counts) */
    get desc(): { text: string; lines: number; over: number } {
        const src = sheetText(this.d ? this.d.ITCDESC : '');
        if (src !== this.descFor) {
            const lines = printLines(src);
            this.descFor = src;
            this.descCache = { text: lines.join('\n'), lines: lines.length, over: Math.max(0, lines.length - DESC_FIT_LINES) };
        }
        return this.descCache;
    }

    get hasRider(): boolean {
        return sheetText(this.d ? this.d.Rider : '').trim() !== '';
    }

    onPick(ev: Event): void {
        if (!this.live) {
            return;
        }
        const t = ev.target as HTMLElement;
        const box = t && t.closest ? t.closest('[data-f]') as HTMLElement : null;
        if (box) {
            this.pick.emit(box.getAttribute('data-f') || '');
        }
    }
}
