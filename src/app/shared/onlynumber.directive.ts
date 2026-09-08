import { Directive, HostListener, ElementRef, Input } from '@angular/core';

@Directive({
    selector: '[OnlyNumber]'
})
export class OnlyNumberDirective {
    regexStr = '^[0-9]*$';
    constructor(private el: ElementRef) { }

    @Input() OnlyNumber: any;
    @HostListener('keydown', ['$event']) onKeyDown(event) {
        let e = <KeyboardEvent>event;
        if (this.OnlyNumber) {
            if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                // Allow: Ctrl+A
                (e.keyCode == 65 && e.ctrlKey === true) ||
                // Allow: Ctrl+C
                (e.keyCode == 67 && e.ctrlKey === true) ||
                // Allow: Ctrl+V
                (e.keyCode == 86 && e.ctrlKey === true) ||
                // Allow: Ctrl+Z
                (e.keyCode == 122 && e.ctrlKey === true) ||
                // Allow: Ctrl+X
                (e.keyCode == 88 && e.ctrlKey === true) ||
                // Allow: home, end, left, right
                (e.keyCode >= 35 && e.keyCode <= 39)) {
                // let it happen, don't do anything
                return;
            }
            // Ensure that it is a number and stop the keypress
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        }
    }
}

@Directive({
    selector: '[OnlyAmount]'
})
export class OnlyAmountDirective {
    constructor(private el: ElementRef) { }

    @Input() OnlyAmount: any;

    @HostListener('keydown', ['$event']) onKeyDown(event) {
        let e = <KeyboardEvent>event;
        let newVal = this.OnlyAmount + e.key;
        if (newVal.split('.').length > 2 ||
            newVal.substring(0, 2) == '00' ||
            newVal.substring(0, 2) == '01' ||
            newVal.substring(0, 2) == '02' ||
            newVal.substring(0, 2) == '03' ||
            newVal.substring(0, 2) == '04' ||
            newVal.substring(0, 2) == '05' ||
            newVal.substring(0, 2) == '06' ||
            newVal.substring(0, 2) == '07' ||
            newVal.substring(0, 2) == '08' ||
            newVal.substring(0, 2) == '09') {
            e.preventDefault();
        }
        if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
            // Allow: Ctrl+A
            (e.keyCode == 65 && e.ctrlKey === true) ||
            // Allow: Ctrl+C
            (e.keyCode == 67 && e.ctrlKey === true) ||
            // Allow: Ctrl+V
            (e.keyCode == 86 && e.ctrlKey === true) ||
            // Allow: Ctrl+Z
            (e.keyCode == 122 && e.ctrlKey === true) ||
            // Allow: Ctrl+X
            (e.keyCode == 88 && e.ctrlKey === true) ||
            // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            // let it happen, don't do anything
            return;
        }
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    }
}

@Directive({
    selector: '[OnlyCharacter]'
})
export class OnlyCharacterDirective {

    constructor(private el: ElementRef) { }

    @Input() OnlyCharacter: any;

    @HostListener('keydown', ['$event']) onKeyDown(event) {
        let e = <KeyboardEvent>event;
        if (this.OnlyCharacter) {
            if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                // Allow: Ctrl+A
                (e.keyCode == 65 && e.ctrlKey === true) ||
                // Allow: Ctrl+C
                (e.keyCode == 67 && e.ctrlKey === true) ||
                // Allow: Ctrl+X
                (e.keyCode == 88 && e.ctrlKey === true) ||
                // Allow: home, end, left, right
                (e.keyCode >= 35 && e.keyCode <= 39)) {
                // let it happen, don't do anything
                return;
            }
            if (e.keyCode == 222) {
                e.preventDefault();
            }
        }
    }
}
