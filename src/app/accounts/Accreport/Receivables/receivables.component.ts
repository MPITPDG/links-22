import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-receivables',
  templateUrl: './receivables.component.html',
  styles: [],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ReceivablesComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
