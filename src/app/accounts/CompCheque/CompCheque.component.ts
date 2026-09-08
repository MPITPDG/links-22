import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-comp-cheque',
  templateUrl: './CompCheque.component.html',
  styles: [],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CompChequeComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
