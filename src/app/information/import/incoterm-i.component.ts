import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    template: '<img src="assets/img/Incoterm.jpg" />',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class IncotermImportComponent implements OnInit {

    constructor() { }
    ngOnInit(): void {

    }
}
 