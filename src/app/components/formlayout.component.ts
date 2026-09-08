import { Component } from '@angular/core';

@Component({
  templateUrl: 'formlayout.component.html'
})
export class FormLayoutComponent {

    html: string = `<span class="btn btn-danger">Never trust not sanitized HTML!!!</span>`;

  constructor() { }

}
