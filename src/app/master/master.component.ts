import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    templateUrl: 'master.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MasterComponent implements OnInit {

    constructor() { }
    ngOnInit(): void {

    }
}
 