import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { BrnSheet, BrnSheetContent, BrnSheetOverlay } from '@spartan-ng/brain/sheet';
import { UiButton } from './button';
import { cn } from './cn';

/**
 * Slide-over panel.
 *
 *   <ui-sheet [(open)]="editing" title="Edit consignment" width="720px">
 *     ...body...
 *     <div uiSheetFooter>
 *       <button uiBtn variant="outline" (click)="editing = false">Cancel</button>
 *       <button uiBtn (click)="save()">Save</button>
 *     </div>
 *   </ui-sheet>
 *
 * Built on @spartan-ng/brain/sheet, which supplies the CDK overlay, the focus
 * trap, the backdrop and the escape/outside-click dismissal:
 *   - BrnSheet (`<brn-sheet>`)          - the overlay host. Driven purely from
 *     its `state` input ('open' | 'closed') and its `stateChanged` output, so
 *     no trigger directive is exposed and the panel is controlled entirely by
 *     the `open` input. `side` picks the edge it slides in from.
 *   - BrnSheetOverlay (`<brn-sheet-overlay>`) - the backdrop element.
 *   - BrnSheetContent (`*brnSheetContent`)    - the lazily rendered panel body.
 * Brain only, no helm - helm is not installed here and everything below the
 * behaviour is a class string anyway (same call as toaster.ts).
 *
 * The panel is wrapped in `.theme-gray` because brain renders the overlay in a
 * CDK container at the end of <body>, outside the shell's `.theme-gray` root,
 * so the `var(--card)` / `var(--border)` tokens would otherwise resolve to
 * nothing and the panel would come out unstyled.
 */
@Component({
  selector: 'ui-sheet',
  standalone: true,
  imports: [BrnSheet, BrnSheetContent, BrnSheetOverlay, UiButton],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <brn-sheet
      [side]="side"
      [state]="open ? 'open' : 'closed'"
      (stateChanged)="onStateChanged($event)">
      <!--
        BrnSheetOverlay is a directive: it copies its class input onto the CDK
        backdrop. But Angular also writes that class attribute onto this host
        element, which lives in normal DOM - so without display:none the host
        itself is a fixed, full-screen, z-50 layer over the page, open or not.
        The inline style is not part of the class string, so the real backdrop
        keeps fixed/inset-0/bg-black-50 and only this stub is hidden.
      -->
      <div brnSheetOverlay class="fixed inset-0 z-50 bg-black/50" style="display:none"></div>

      <ng-template brnSheetContent class="z-50">
        <div [class]="panelCls" [style.--ui-sheet-w]="width">
          <header
            class="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
            <div class="min-w-0">
              @if (title) {
                <h2 class="truncate text-sm font-semibold text-[var(--foreground)]">{{ title }}</h2>
              }
              @if (description) {
                <p class="mt-0.5 text-xs leading-snug text-[var(--muted-foreground)]">{{ description }}</p>
              }
            </div>
            <button uiBtn variant="ghost" size="icon" type="button" aria-label="Close" (click)="close()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <ng-content />
          </div>

          <div
            class="sticky bottom-0 flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--card)] px-4 py-3 empty:hidden">
            <ng-content select="[uiSheetFooter]" />
          </div>
        </div>
      </ng-template>
    </brn-sheet>
  `,
})
export class UiSheet {
  /** Whether the panel is showing. Two-way: `[(open)]`. */
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  /** Edge the panel slides in from. */
  @Input() side: 'right' | 'left' = 'right';
  @Input() title = '';
  @Input() description = '';
  /** Any CSS width. The panel is full-viewport-width below the sm breakpoint. */
  @Input() width = '640px';
  @Input() class = '';

  get panelCls() {
    return cn(
      'theme-gray flex h-full w-screen max-w-[100vw] flex-col overflow-hidden',
      'sm:w-[var(--ui-sheet-w)]',
      'border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-lg',
      this.side === 'right' ? 'border-l' : 'border-r',
      this.class,
    );
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.openChange.emit(false);
  }

  /** Brain closes itself on backdrop click / escape; mirror that back out. */
  protected onStateChanged(state: 'open' | 'closed') {
    const next = state === 'open';
    if (next === this.open) return;
    this.open = next;
    this.openChange.emit(next);
  }
}
