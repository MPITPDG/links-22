import { Directive, Input, computed, signal } from '@angular/core';
import { cn } from './cn';

/**
 * Text input, select and textarea styling.
 *
 *   <input uiInput [(ngModel)]="vesselName" />
 *   <select uiInput [(ngModel)]="port"></select>
 *   <textarea uiInput rows="4"></textarea>
 *
 * Mirrors spartan's hlmInput. An attribute directive so it can be applied to
 * the existing inputs across the app without changing their markup or their
 * ngModel wiring - which matters, since these forms are template-driven and
 * the bindings must not move.
 */
@Directive({
  selector: 'input[uiInput], select[uiInput], textarea[uiInput]',
  standalone: true,
  host: { '[class]': 'cls()' },
})
export class UiInput {
  private readonly _extra = signal('');
  private readonly _error = signal(false);

  @Input('class') set klass(v: string) { this._extra.set(v || ''); }
  /** Red ring, for a field that has failed validation. */
  @Input() set invalid(v: boolean | string) { this._error.set(v === '' || v === true || v === 'true'); }

  readonly cls = computed(() =>
    cn(
      'flex h-9 w-full min-w-0 rounded-md border bg-[var(--background)] px-3 py-1',
      'text-sm text-[var(--foreground)] shadow-xs transition-colors outline-none',
      'placeholder:text-[var(--muted-foreground)]',
      'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[var(--muted)]',
      'read-only:bg-[var(--muted)]',
      this._error()
        ? 'border-[var(--destructive)] focus-visible:ring-2 focus-visible:ring-[var(--destructive)]/30'
        : 'border-[var(--border)] focus-visible:border-[var(--ring)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]/25',
      this._extra(),
    ),
  );
}

/** Field label. Pairs with UiInput; keeps existing `for` attributes working. */
@Directive({
  selector: 'label[uiLabel]',
  standalone: true,
  host: { '[class]': 'cls()' },
})
export class UiLabel {
  private readonly _extra = signal('');
  @Input('class') set klass(v: string) { this._extra.set(v || ''); }
  readonly cls = computed(() =>
    cn('text-xs font-medium leading-none text-[var(--foreground)]', this._extra()),
  );
}

/** One label-plus-control unit. Stacks on small screens, sits inline above md. */
@Directive({
  selector: '[uiField]',
  standalone: true,
  host: { '[class]': 'cls()' },
})
export class UiField {
  private readonly _extra = signal('');
  @Input('class') set klass(v: string) { this._extra.set(v || ''); }
  readonly cls = computed(() => cn('flex flex-col gap-1.5', this._extra()));
}
