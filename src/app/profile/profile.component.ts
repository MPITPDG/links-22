import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    templateUrl: 'profile.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class profileComponent implements OnInit {

    constructor() { }
    ngOnInit(): void {

    }
}
 