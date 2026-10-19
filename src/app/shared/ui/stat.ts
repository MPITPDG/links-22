import { Component, Input, ViewEncapsulation } from '@angular/core';
import { UiSkeleton } from './skeleton';
import { cn } from './cn';
import type { UiTone } from './badge';

const ACCENT: Record<string, string> = {
  neutral: 'text-[var(--muted-foreground)]',
  info:    'text-blue-600',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger:  'text-red-600',
};

@Component({
  selector: 'ui-stat',
  standalone: true,
  imports: [UiSkeleton],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block w-full' },
  template: `
    <div [class]="cls">
      <div class="flex items-start justify-between gap-2">
        <span class="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">{{ label }}</span>
      </div>
      <div class="mt-2 text-3xl font-semibold tabular-nums leading-none text-[var(--foreground)]">
        @if (loading) { <ui-skeleton w="60%" [h]="28" /> } @else { {{ value }} }
      </div>
      @if (caption) {
        <div class="mt-2 text-xs leading-snug" [class]="accentCls">{{ caption }}</div>
      }
    </div>`,
})
export class UiStat {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() caption = '';
  @Input() tone: UiTone = 'neutral';
  @Input() loading = false;
  @Input() class = '';
  get cls() {
    return cn('rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm', this.class);
  }
  get accentCls() { return ACCENT[this.tone] ?? ACCENT['neutral']; }
}
