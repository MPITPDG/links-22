import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block w-full' },
  template: `<div class="animate-pulse rounded bg-gray-200" [style.width]="w" [style.height.px]="h"></div>`,
})
export class UiSkeleton {
  @Input() w = '100%';
  @Input() h = 14;
}
