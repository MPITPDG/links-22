import { Component, ChangeDetectionStrategy } from '@angular/core';

/*  Shell for the Export module home route. The page itself is ExportHomeComponent
    (./home), which replaced the old vessel accordion that used to live here.       */
@Component({
    selector: 'app-EXP-Dashboard',
    templateUrl: 'export.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ExportComponent { }
