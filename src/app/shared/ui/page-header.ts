import { Component, Input, ViewEncapsulation } from '@angular/core';

/**
 * Page title block.
 *
 * Two modes. The default is a proper heading with the subtitle underneath and
 * room below it - right for dashboards and lists. `compact` puts title and
 * subtitle on one line at body size with a 2-unit margin, for data-entry
 * screens where the form is the point and every row of height above it is a
 * row the operator has to scroll past. The consignment screens all use compact.
 *
 * Either way, projected content goes in the right-hand action slot.
 */
@Component({
  selector: 'ui-page-header',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block w-full' },
  template: `
    @if (compact) {
      <div class="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div class="flex min-w-0 flex-wrap items-baseline gap-x-3">
          <h1 class="text-base font-semibold leading-tight text-[var(--foreground)]">{{ title }}</h1>
          @if (subtitle) {
            <p class="text-sm text-[var(--muted-foreground)]">{{ subtitle }}</p>
          }
        </div>
        <div class="flex shrink-0 items-center gap-2"><ng-content /></div>
      </div>
    } @else {
      <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h1 class="text-xl font-semibold leading-tight text-[var(--foreground)]">{{ title }}</h1>
          @if (subtitle) {
            <p class="mt-1 text-sm text-[var(--muted-foreground)]">{{ subtitle }}</p>
          }
        </div>
        <div class="flex shrink-0 items-center gap-2"><ng-content /></div>
      </div>
    }`,
})
export class UiPageHeader {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() compact = false;
}
