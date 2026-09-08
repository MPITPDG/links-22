import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styles: [],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AccountReportComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
