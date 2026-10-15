import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ui-progress',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block w-full' },
  template: `
    <div class="w-full overflow-hidden rounded-full bg-gray-100"
         [style.height.px]="height"
         role="progressbar"
         [attr.aria-valuenow]="value" [attr.aria-valuemin]="0" [attr.aria-valuemax]="max">
      <div class="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300"
           [style.width.%]="pct"></div>
    </div>`,
})
export class UiProgress {
  @Input() value = 0;
  @Input() max = 100;
  @Input() height = 8;
  get pct() {
    if (!this.max) return 0;
    return Math.max(0, Math.min(100, (this.value / this.max) * 100));
  }
}
