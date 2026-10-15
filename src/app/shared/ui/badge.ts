import { Component, Input, ViewEncapsulation } from '@angular/core';
import { cn } from './cn';

export type UiTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONE: Record<UiTone, string> = {
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  info:    'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger:  'bg-red-50 text-red-700 border-red-200',
};

@Component({
  selector: 'ui-badge',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  template: `<span [class]="cls"><ng-content /></span>`,
})
export class UiBadge {
  @Input() tone: UiTone = 'neutral';
  @Input() class = '';
  get cls() {
    return cn(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap',
      TONE[this.tone] ?? TONE.neutral,
      this.class,
    );
  }
}
