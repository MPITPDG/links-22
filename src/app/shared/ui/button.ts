import { Directive, Input, ViewEncapsulation, computed, signal } from '@angular/core';
import { cn } from './cn';

export type UiBtnVariant =
  | 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link'
  // Beyond spartan's set. This app's Bootstrap buttons carry semantics that
  // would be lost collapsing them into default/destructive: btn-success is
  // Save, btn-warning is a caution action, btn-info is usually Print or View.
  // Keeping them distinct makes the migration 1:1 and reversible.
  | 'success' | 'warning' | 'info';
export type UiBtnSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';

const VARIANT: Record<UiBtnVariant, string> = {
  default:
    'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs hover:bg-[var(--primary)]/90',
  outline:
    'border border-[var(--border)] bg-[var(--background)] shadow-xs ' +
    'hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
  ghost:
    'hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
  secondary:
    'bg-[var(--secondary)] text-[var(--secondary-foreground)] shadow-xs hover:bg-[var(--secondary)]/80',
  destructive:
    'bg-[var(--destructive)] text-white shadow-xs hover:bg-[var(--destructive)]/90',
  link:
    'text-[var(--primary)] underline-offset-4 hover:underline',
  success:
    'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700',
  warning:
    'bg-amber-500 text-white shadow-xs hover:bg-amber-600',
  info:
    'bg-sky-600 text-white shadow-xs hover:bg-sky-700',
};

const SIZE: Record<UiBtnSize, string> = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-10 rounded-md px-6',
  icon: 'h-9 w-9',
  'icon-sm': 'h-8 w-8',
};

/**
 * Button, matching spartan's hlmBtn surface.
 *
 *   <button uiBtn variant="outline">Button</button>
 *   <button uiBtn size="icon" variant="outline"><svg .../></button>
 *
 * Same variant and size names as hlmBtn so markup reads the same and could be
 * swapped for the real thing later. Written here rather than pulled from
 * @spartan-ng/helm/button, which needs helm/utils, class-variance-authority
 * and @ng-icons for what is a class string.
 *
 * An attribute directive rather than a component so it can be applied to
 * existing <button> and <a> elements without changing their markup.
 */
@Directive({
  selector: '[uiBtn]',
  standalone: true,
  host: { '[class]': 'cls()' },
})
export class UiButton {
  private readonly _variant = signal<UiBtnVariant>('default');
  private readonly _size = signal<UiBtnSize>('default');
  private readonly _extra = signal<string>('');

  @Input() set variant(v: UiBtnVariant) { this._variant.set(v || 'default'); }
  @Input() set size(v: UiBtnSize) { this._size.set(v || 'default'); }
  /** Extra classes, merged so later utilities win conflicts. */
  @Input('class') set klass(v: string) { this._extra.set(v || ''); }

  readonly cls = computed(() =>
    cn(
      'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md',
      'text-sm font-medium transition-colors outline-none',
      'focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1',
      'disabled:pointer-events-none disabled:opacity-50',
      "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      VARIANT[this._variant()],
      SIZE[this._size()],
      this._extra(),
    ),
  );
}
