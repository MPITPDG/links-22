import { Component, ViewEncapsulation } from '@angular/core';
import { BrnSonnerToaster } from '@spartan-ng/brain/sonner';

/**
 * Application toast container. Drop one of these at the app root; every
 * ToastCommonService.toast(...) call in the app renders through it.
 *
 * Wraps @spartan-ng/brain's sonner toaster and supplies the theme tokens it
 * reads, so toasts match the rest of the UI rather than carrying their own
 * palette. Written directly against brain rather than generated as a helm
 * component - brain is a real npm package and is all the behaviour we need.
 */
@Component({
  selector: 'ui-toaster',
  standalone: true,
  imports: [BrnSonnerToaster],
  encapsulation: ViewEncapsulation.None,
  template: `
    <brn-sonner-toaster
      class="theme-gray"
      position="bottom-right"
      [duration]="5000"
      [visibleToasts]="4"
      [closeButton]="true"
      [expand]="false"
      [style]="style" />
  `,
})
export class UiToaster {
  /**
   * Sonner reads its surface colours from these custom properties. Pointing
   * them at the theme tokens keeps toasts consistent with cards and popovers.
   */
  readonly style: Record<string, string> = {
    '--normal-bg': 'var(--popover)',
    '--normal-text': 'var(--popover-foreground)',
    '--normal-border': 'var(--border)',
    '--border-radius': 'var(--radius)',
  };
}
