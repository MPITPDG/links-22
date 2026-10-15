import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  templateUrl: 'cards.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CardsComponent {

  constructor() { }

}
