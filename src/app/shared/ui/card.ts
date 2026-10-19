import { Component, Input, ViewEncapsulation } from '@angular/core';
import { cn } from './cn';

@Component({
  selector: 'ui-card',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  // host block: an unknown element defaults to display:inline, which made the
  // card shrink-wrap its contents and sit centred instead of filling the row.
  host: { class: 'block w-full' },
  template: `<div [class]="cls"><ng-content /></div>`,
})
export class UiCard {
  @Input() class = '';
  @Input() flush = false;
  get cls() {
    return cn(
      'rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm',
      this.flush ? '' : 'p-4',
      this.class,
    );
  }
}

@Component({
  selector: 'ui-card-header',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block' },
  template: `
    <div class="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
      <div class="min-w-0">
        <div class="text-sm font-semibold text-[var(--foreground)]">{{ title }}</div>
        @if (subtitle) {
          <div class="mt-0.5 text-xs text-[var(--muted-foreground)]">{{ subtitle }}</div>
        }
      </div>
      <div class="shrink-0"><ng-content /></div>
    </div>`,
})
export class UiCardHeader {
  @Input() title = '';
  @Input() subtitle = '';
}
