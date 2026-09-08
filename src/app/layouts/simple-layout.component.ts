import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-blank-page',
  template: '<router-outlet></router-outlet>',
    standalone: false
})
export class SimpleLayoutComponent implements OnInit {

  constructor() { }

  ngOnInit(): void { }
}
