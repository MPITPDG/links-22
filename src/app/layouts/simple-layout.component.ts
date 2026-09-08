import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-blank-page',
  template: '<router-outlet></router-outlet>',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SimpleLayoutComponent implements OnInit {

  constructor() { }

  ngOnInit(): void { }
}
