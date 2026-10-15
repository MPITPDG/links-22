import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  templateUrl: 'formlayout.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FormLayoutComponent {

    html: string = `<span class="btn btn-danger">Never trust not sanitized HTML!!!</span>`;

  constructor() { }

}
