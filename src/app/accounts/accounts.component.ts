import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    templateUrl: 'accounts.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AccountComponent implements OnInit  {

    constructor() { }
    ngOnInit(): void {

    }
}
