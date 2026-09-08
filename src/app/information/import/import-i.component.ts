import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    templateUrl: 'import-i.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ImportInfoComponent implements OnInit {

    constructor() { }
    ngOnInit(): void {

    }
}
 