import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    templateUrl: 'import.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ImportComponent implements OnInit {

    constructor() { }
    ngOnInit(): void {

    }
}
 