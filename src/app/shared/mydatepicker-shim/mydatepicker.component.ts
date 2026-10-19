import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IMyOptions, IMyDateModel, IMyDate } from './my-date.interfaces';
import { formatMyDate, parseMyDate, toMomentFormat } from './date-format.util';

let nextId = 0;

function toMyDateModel(date: Date, format: string): IMyDateModel {
    const myDate: IMyDate = { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
    return {
        date: myDate,
        jsdate: date,
        formatted: formatMyDate(date, format),
        epoc: Math.floor(date.getTime() / 1000)
    };
}

// Drop-in replacement for the abandoned 'mydatepicker' package (last released
// for Angular 9, incompatible with Angular 16+'s Ivy compiler). Preserves the
// same selector and IMyDpOptions/IMyDateModel/[(ngModel)]/(dateChanged) contract
// so existing templates and components across the app don't need to change.
@Component({
    selector: 'my-date-picker',
    // The bare bsDatepicker input had no placeholder and no trigger icon, so an
    // empty field rendered as a blank box that didn't read as a date control
    // (readonly fields -- editableDateField:false -- show nothing at all when
    // empty). Restore the original mydatepicker affordance: the date format as
    // placeholder text plus a calendar button that opens the picker.
    // The wrapper/input/button also carry the original mydatepicker class names
    // (mydp, selectiongroup, selection, btnpicker) so the per-screen stylesheets
    // written against the old markup keep applying to the shim.
    template: `
        <div class="mydp">
        <span class="mydp-shim selectiongroup">
            <input type="text"
                   class="form-control mydp-shim-input selection"
                   autocomplete="off"
                   [name]="name"
                   [placeholder]="placeholder"
                   [disabled]="isDisabled"
                   [readonly]="options?.editableDateField === false"
                   bsDatepicker
                   #dp="bsDatepicker"
                   container="body"
                   [bsConfig]="bsConfig"
                   [(bsValue)]="internalDate"
                   [isDisabled]="isDisabled"
                   (bsValueChange)="onDateSelected($event)"
                   (blur)="onTouched()" />
            <button type="button" class="mydp-shim-btn btnpicker" tabindex="-1"
                    [disabled]="isDisabled" (click)="dp.toggle()">
                <i class="fa fa-calendar"></i>
            </button>
        </span>
        </div>
    `,
    styles: [`
        :host { display: inline-block; }
        .mydp { display: inline-block; }
        /* The wrapper draws the border, like the original .selectiongroup, so
           screen stylesheets that strip the inner input's border still get a
           framed control. */
        .mydp-shim {
            display: inline-flex;
            align-items: stretch;
            vertical-align: middle;
            border: 1px solid var(--mp-line, #ced4da);
            border-radius: 4px;
            background: var(--mp-surface, #fff);
            overflow: hidden;
        }
        .mydp-shim-input {
            border: 0;
            border-radius: 0;
            box-shadow: none;
            min-width: 0;
            flex: 1 1 auto;
        }
        .mydp-shim-input:focus { box-shadow: none; }
        .mydp-shim-btn {
            border: 0;
            border-left: 1px solid var(--mp-line, #ced4da);
            border-radius: 0;
            background: var(--mp-band, #f0f0f0);
            cursor: pointer;
            padding: 0 8px;
            display: inline-flex;
            align-items: center;
            flex: 0 0 auto;
        }
        .mydp-shim-btn[disabled] { cursor: not-allowed; opacity: .5; }
    `],
    providers: [{
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MyDatePicker),
            multi: true
        }],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MyDatePicker implements ControlValueAccessor, OnChanges {
    @Input() options: IMyOptions;
    @Input() selDate: string;
    @Input() disabled = false;
    @Input() name = 'mydp' + (nextId++);
    @Output() dateChanged = new EventEmitter<IMyDateModel>();

    internalDate: Date | null = null;
    isDisabled = false;
    bsConfig: any = { dateInputFormat: 'DD/MM/YYYY', containerClass: 'theme-default', adaptivePosition: true };

    // Tells a real user selection apart from a programmatic write.
    //
    // ngx-bootstrap's `bsValue` setter emits `bsValueChange` on *every*
    // assignment, including the ones our own writeValue() makes, so the event
    // alone means nothing. Hosts that react to ngModelChange (the dossier
    // screens stamp the current clock into their separate hh/mm inputs) would
    // otherwise have saved data overwritten by a mere page load.
    //
    // The distinction is purely about timing, and that we can rely on: a
    // programmatic write and the bsValueChange echo it provokes both run inside
    // the same synchronous change-detection tick, while a real user click is
    // always a separate, later macrotask. So we raise this flag in writeValue()
    // and lower it on the next macrotask (setTimeout 0) -- the echo is seen
    // while it's up and ignored; any genuine pick arrives after it's down.
    // Deliberately no value comparison: re-picking the date already shown is a
    // legitimate action hosts rely on to (re)fill dependent fields.
    private ignoreEcho = false;
    private ignoreEchoTimer: any = null;

    private onChangeCb: (value: any) => void = () => { };
    onTouched: () => void = () => { };

    // Placeholder shown when the field is empty -- the date format itself, the
    // way the original mydatepicker did (e.g. 'dd/mm/yyyy').
    get placeholder(): string {
        return (this.options && this.options.dateFormat) || 'dd/mm/yyyy';
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['options']) {
            this.bsConfig = { ...this.bsConfig, dateInputFormat: toMomentFormat(this.options && this.options.dateFormat) };
        }
        if (changes['selDate']) {
            if (this.selDate) {
                const parsed = parseMyDate(this.selDate, this.options && this.options.dateFormat);
                if (parsed) {
                    this.internalDate = parsed;
                }
            }
            // Arm the echo guard on every selDate change, not just when it
            // parses to a real date. Hosts that bind [selDate] without
            // [(ngModel)] never call writeValue() (the other place this
            // guard gets armed), so ngx-bootstrap's own init-time
            // bsValueChange firing -- which happens even with a null/
            // undefined initial value -- would otherwise reach
            // onDateSelected() and emit a bogus dateChanged(null) before
            // the user has touched the field.
            this.suppressEcho();
        }
        if (changes['disabled']) {
            this.isDisabled = !!this.disabled;
        }
    }

    onDateSelected(date: Date | null): void {
        // Echo of a programmatic write, not a user selection. Swallow it
        // (see ignoreEcho above).
        if (this.ignoreEcho) { return; }

        if (!date) {
            // Cleared. Host code guards on truthiness of the model (`if (main)`)
            // and its own "no date" value is null, so mirror that.
            this.onChangeCb(null);
            this.dateChanged.emit(null);
            return;
        }
        const model = toMyDateModel(date, this.options && this.options.dateFormat);
        this.onChangeCb(model);
        this.dateChanged.emit(model);
    }

    writeValue(value: any): void {
        this.internalDate = this.coerceToDate(value);
        this.suppressEcho();
    }

    // Ignore the bsValueChange that a programmatic internalDate change fires
    // during this tick; re-arm before the next possible user interaction.
    private suppressEcho(): void {
        this.ignoreEcho = true;
        clearTimeout(this.ignoreEchoTimer);
        this.ignoreEchoTimer = setTimeout(() => { this.ignoreEcho = false; }, 0);
    }

    private coerceToDate(value: any): Date | null {
        if (!value) { return null; }
        if (value instanceof Date) { return value; }
        if (typeof value === 'string') {
            return parseMyDate(value, this.options && this.options.dateFormat);
        }
        if (value.jsdate instanceof Date) { return value.jsdate; }
        // The app's own date model, produced by DataService.stringdttoArry():
        // { date: { year, month, day }, formatted: 'dd/mm/yyyy' } -- note the
        // parts are strings and month is 1-based. Used by 58 components, so this
        // is the shape the shim sees most often on load.
        const parts = value.date;
        if (parts && parts.year && parts.month && parts.day) {
            const d = new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
            return isNaN(d.getTime()) ? null : d;
        }
        if (value.formatted) {
            return parseMyDate(value.formatted, this.options && this.options.dateFormat);
        }
        return null;
    }

    registerOnChange(fn: any): void {
        this.onChangeCb = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }
}
