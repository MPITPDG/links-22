import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { countPrintedLines, DESC_COLUMN_CHARS, DESC_FIT_LINES, formatDescription } from './mtd-description-format';

/** per-browser options of the description tools */
const PREFS_KEY = 'links_desc_autoformat';

/**
 * Wraps the "description of goods" textarea (projected, keeps its id / name / [(ngModel)]) and adds:
 *  - auto-format on paste (when "Auto-format when pasting" is on): the default paste is replaced by the raw text
 *    and then the formatted text, both through execCommand('insertText'), so ngModel sees an input event and
 *    Ctrl+Z goes back to the text as pasted (a second Ctrl+Z removes the paste);
 *  - an Auto-format button for the whole field (one undo step);
 *  - an UPPERCASE toggle and the fit meter "N of 24 lines" of the printed description column;
 *  - optionally (MTO) "Move extra lines to Rider" when it does not fit.
 * The two toggles are remembered per browser in localStorage (default on).
 */
@Component({
    selector: 'app-desc-field',
    template: `
<ng-content></ng-content>
<div class="dt">
  <button type="button" class="btn g dt-b" (click)="formatAll()"
          title="Tidy the whole description: one space between words, lines from the left edge, wrapped at {{ width }} characters">Auto-format</button>
  <label class="dt-t" title="Tidy text pasted into this field (Ctrl+Z puts back what was pasted)">
    <input type="checkbox" [checked]="auto" (change)="setAuto($any($event.target).checked)">Auto-format when pasting
  </label>
  <label class="dt-t"><input type="checkbox" [checked]="upper" (change)="setUpper($any($event.target).checked)">UPPERCASE</label>
  <span class="dt-sp"></span>
  <span class="dt-fit" [class.over]="over > 0" title="Lines of the printed description column ({{ width }} characters wide)">
    <i aria-hidden="true"></i>{{ lines }} of {{ fitLines }} lines
  </span>
  @if (over > 0 && riderMove) {
    <button type="button" class="btn g dt-b" (click)="moveToRider.emit()">Move extra lines to Rider</button>
  }
</div>
@if (over > 0) {
  <div class="dt-msg" role="status">{{ over }} {{ over === 1 ? 'line does' : 'lines do' }} not fit in the printed description column.</div>
}
`,
    styles: [`
:host{display:block;min-width:0}
.dt{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin-top:6px;font-size:12px;color:var(--soft,#6B6B6B)}
.dt .btn.dt-b{height:28px;padding:0 10px;font-size:12px}
.dt-t{display:inline-flex;align-items:center;gap:6px;margin:0;font-weight:600;color:var(--ink,#0A0A0A);cursor:pointer;white-space:nowrap}
.dt-t input{width:15px;height:15px;margin:0;accent-color:var(--mp-primary,#0A0A0A)}
.dt-sp{flex:1 1 auto}
.dt-fit{display:inline-flex;align-items:center;gap:6px;font-weight:600;color:var(--ink,#0A0A0A);white-space:nowrap}
.dt-fit i{width:8px;height:8px;border-radius:50%;background:currentColor}
.dt-fit.over{color:var(--mp-danger,#C62828)}
.dt-msg{margin-top:4px;font-size:12px;color:var(--mp-danger,#C62828)}
`],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DescFieldComponent {
    /** the bound description text (for the fit meter) */
    @Input() text: any = '';
    /** show "Move extra lines to Rider" when the text does not fit (MTO only) */
    @Input() riderMove = false;
    @Input() fitLines = DESC_FIT_LINES;
    @Output() moveToRider = new EventEmitter<void>();

    readonly width = DESC_COLUMN_CHARS;
    auto = true;
    upper = true;

    private countFor: any = null;
    private countCache = 0;

    constructor(private host: ElementRef<HTMLElement>) {
        try {
            const raw = localStorage.getItem(PREFS_KEY);
            if (raw) {
                const p = JSON.parse(raw);
                if (typeof p.auto === 'boolean') { this.auto = p.auto; }
                if (typeof p.upper === 'boolean') { this.upper = p.upper; }
            }
        } catch (e) { /* storage blocked or corrupt: defaults */ }
    }

    get lines(): number {
        if (this.text !== this.countFor) {
            this.countFor = this.text;
            this.countCache = countPrintedLines(this.text);
        }
        return this.countCache;
    }

    get over(): number {
        return Math.max(0, this.lines - this.fitLines);
    }

    setAuto(on: boolean): void {
        this.auto = !!on;
        this.savePrefs();
    }

    setUpper(on: boolean): void {
        this.upper = !!on;
        this.savePrefs();
    }

    @HostListener('paste', ['$event'])
    onPaste(ev: ClipboardEvent): void {
        const ta = ev.target as HTMLTextAreaElement;
        if (!this.auto || !ta || ta.tagName !== 'TEXTAREA' || ta.readOnly || ta.disabled) {
            return;
        }
        const raw = ev.clipboardData ? ev.clipboardData.getData('text/plain') : '';
        if (!raw) {
            return;
        }
        const formatted = formatDescription(raw, { uppercase: this.upper });
        if (formatted === '') {
            return;  // whitespace only: leave it to the browser
        }
        ev.preventDefault();
        const rawText = raw.replace(/\r\n?/g, '\n');
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        // the formatter drops leading / trailing line breaks; keep them where the paste lands mid-line,
        // so it does not run on into the text around it (one break, or a blank line if the paste had one)
        const before = ta.value.slice(0, start);
        const after = ta.value.slice(end);
        const leadNl = (rawText.match(/^[ \t]*\n(?:[ \t]*\n)?/) || [''])[0].replace(/[ \t]/g, '');
        const tailNl = (rawText.match(/\n[ \t]*$/) ? '\n' : '');
        const lead = before !== '' && !before.endsWith('\n') ? leadNl : '';
        const tail = after !== '' && !after.startsWith('\n') ? tailNl : '';
        // 1st step: the paste as it was (what Ctrl+Z comes back to), then select it
        if (rawText !== formatted) {
            insertText(ta, rawText);
            ta.setSelectionRange(start, start + rawText.length);
        }
        // 2nd step: replace it with the formatted text
        insertText(ta, lead + formatted + tail);
    }

    /** formats the whole field in one undoable step */
    formatAll(): void {
        const ta = this.host.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
        if (!ta || ta.readOnly || ta.disabled) {
            return;
        }
        const formatted = formatDescription(ta.value, { uppercase: this.upper });
        if (formatted === ta.value.replace(/\r\n?/g, '\n')) {
            ta.focus();
            return;
        }
        ta.focus();
        ta.select();
        insertText(ta, formatted);
    }

    private savePrefs(): void {
        try {
            localStorage.setItem(PREFS_KEY, JSON.stringify({ auto: this.auto, upper: this.upper }));
        } catch (e) { /* storage blocked: keep for this page only */ }
    }
}

/**
 * Replaces the textarea's selection with `text` as if typed: execCommand('insertText') keeps the browser's undo
 * stack and fires the input event ngModel listens to. Falls back to setRangeText + a synthetic input event.
 */
function insertText(ta: HTMLTextAreaElement, text: string): boolean {
    if (document.activeElement !== ta) {
        ta.focus();
    }
    let ok = false;
    try {
        ok = document.execCommand('insertText', false, text);
    } catch (e) {
        ok = false;
    }
    if (!ok) {
        ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return ok;
}
