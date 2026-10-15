import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { cn } from './cn';

export interface UiStep {
  key: string;
  label: string;
  /** Omit to derive: the step whose key equals `current` is 'current', the rest 'pending'. */
  state?: 'done' | 'current' | 'pending' | 'error';
  /** Small secondary line under the label. */
  hint?: string;
}

/**
 * Step rail.
 *
 *   <ui-steps [steps]="steps" [(current)]="stage" />
 *   <ui-steps [steps]="steps" [(current)]="stage" orientation="horizontal" />
 *
 * A pure kit component - no brain primitive, because there is no behaviour
 * here beyond "click a row, emit its key"; a plain <ol> of buttons is both
 * smaller and keyboard reachable for free.
 *
 * Deliberately compact: rows are ~44px tall so an eight step workflow fits in
 * roughly 500px of sidebar without scrolling. Icons are inline SVG paths -
 * the app ships font-awesome but the kit avoids it so kit components stay
 * self-contained (same call as the other kit files).
 */
@Component({
  selector: 'ui-steps',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block w-full' },
  template: `
    <ol [class]="listCls">
      @for (step of steps; track step.key; let i = $index; let last = $last) {
        <li [class]="itemCls">
          <!-- connector -->
          @if (!last) {
            <span aria-hidden="true" [class]="connectorCls(step)"></span>
          }

          <button
            type="button"
            [attr.aria-current]="stateOf(step) === 'current' ? 'step' : null"
            [class]="buttonCls"
            (click)="select(step)">
            <span [class]="dotCls(step)">
              @switch (stateOf(step)) {
                @case ('done') {
                  <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                }
                @case ('error') {
                  <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 7v6" />
                    <path d="M12 17h.01" />
                  </svg>
                }
                @default { {{ i + 1 }} }
              }
            </span>

            <span class="min-w-0 flex-1 text-left">
              <span [class]="labelCls(step)">{{ step.label }}</span>
              @if (step.hint) {
                <span class="block truncate text-[11px] leading-tight text-[var(--muted-foreground)]">{{ step.hint }}</span>
              }
            </span>
          </button>
        </li>
      }
    </ol>
  `,
})
export class UiSteps {
  @Input() steps: UiStep[] = [];
  /** Key of the active step. Two-way: `[(current)]`. */
  @Input() current = '';
  @Output() currentChange = new EventEmitter<string>();
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';
  @Input() class = '';

  get vertical() { return this.orientation !== 'horizontal'; }

  stateOf(step: UiStep): 'done' | 'current' | 'pending' | 'error' {
    return step.state ?? (step.key === this.current ? 'current' : 'pending');
  }

  select(step: UiStep) {
    if (step.key === this.current) return;
    this.current = step.key;
    this.currentChange.emit(step.key);
  }

  get listCls() {
    return cn(
      'flex',
      this.vertical ? 'flex-col' : 'flex-row flex-wrap items-start gap-x-1',
      this.class,
    );
  }

  get itemCls() {
    return cn('relative', this.vertical ? 'w-full' : 'min-w-0 flex-1');
  }

  connectorCls(step: UiStep) {
    const done = this.stateOf(step) === 'done';
    const tone = done ? 'bg-[var(--primary)]/40' : 'bg-[var(--border)]';
    return cn(
      'absolute',
      this.vertical
        // runs from below the dot down to the next row's dot
        ? 'left-[15px] top-[30px] h-[calc(100%-18px)] w-px'
        : 'left-[calc(50%+18px)] top-[15px] h-px w-[calc(100%-36px)]',
      tone,
    );
  }

  get buttonCls() {
    return cn(
      'relative z-10 flex w-full items-center gap-2.5 rounded-md py-1.5 text-left outline-none',
      'transition-colors hover:bg-[var(--accent)]',
      'focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
      this.vertical ? 'min-h-[44px] px-1.5' : 'flex-col items-center gap-1 px-1.5 text-center',
    );
  }

  dotCls(step: UiStep) {
    const state = this.stateOf(step);
    const tone =
      state === 'current'
        ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
        : state === 'done'
          ? 'border-[var(--primary)]/40 bg-[var(--background)] text-[var(--primary)]'
          : state === 'error'
            ? 'border-[var(--destructive)] bg-[var(--destructive)] text-white'
            : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]';
    return cn(
      'flex size-[22px] shrink-0 items-center justify-center rounded-full border',
      'text-[11px] font-semibold tabular-nums leading-none',
      tone,
    );
  }

  labelCls(step: UiStep) {
    const state = this.stateOf(step);
    const tone =
      state === 'current'
        ? 'text-[var(--primary)] font-semibold'
        : state === 'error'
          ? 'text-[var(--destructive)] font-medium'
          : state === 'done'
            ? 'text-[var(--muted-foreground)]'
            : 'text-[var(--muted-foreground)]';
    return cn('block truncate text-xs leading-tight', tone);
  }
}
