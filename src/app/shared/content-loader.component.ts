import { Component, ElementRef, Input, NgZone, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoaderService } from './service/loader.service';

/**
 * Non-blocking loading indicator for a layout's content area.
 *
 * Replaces the old app.component overlay (a position:fixed, full-window,
 * pointer-capturing layer at z-index 1200) that covered the header and the
 * sidebar while LoaderService was on, so the user could not navigate away.
 *
 * Sits absolutely over the <main> region only, with pointer-events:none on
 * everything, so the sidebar, header and even the page itself stay clickable.
 *
 * What it shows while LoaderService is on (after a short delay, so quick
 * calls never flash):
 *  - always: a thin progress bar along the top of the content area;
 *  - additionally a shimmering skeleton, but ONLY while the routed page has
 *    not rendered anything yet (blank page during lazy-load / first paint).
 *    As soon as the page renders real content, or renders its own skeleton,
 *    the global skeleton steps aside and only the bar remains.
 */
@Component({
  selector: 'app-content-loader',
  standalone: true,
  host: { class: 'app-content-loader', 'aria-hidden': 'true' },
  template: `
    @if (bar()) {
      <div class="acl-bar"></div>
    }
    @if (skeleton()) {
      <div class="acl-skel" [style.top.px]="skeletonTop">
        <div class="acl-row acl-h" style="width: 32%"></div>
        <div class="acl-row" style="width: 55%; height: 10px"></div>
        <div class="acl-cards">
          <div class="acl-card"></div><div class="acl-card"></div>
          <div class="acl-card"></div><div class="acl-card"></div>
        </div>
        <div class="acl-table">
          <div class="acl-row acl-th"></div>
          @for (r of rows; track r) { <div class="acl-row acl-tr"></div> }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { position: absolute; inset: 0; z-index: 20; pointer-events: none; overflow: hidden; }
    :host * { pointer-events: none; }
    .acl-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; overflow: hidden; background: rgba(0,0,0,.06); }
    .acl-bar::after { content: ''; position: absolute; top: 0; bottom: 0; width: 35%; background: var(--mp-strong, #374151);
                      animation: acl-slide 1.1s ease-in-out infinite; }
    .acl-skel { position: absolute; left: 0; right: 0; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .acl-row, .acl-card { border-radius: 6px;
      background: linear-gradient(90deg, #eceef1 0%, #f6f7f8 40%, #eceef1 80%);
      background-size: 200% 100%; animation: acl-shimmer 1.3s linear infinite; }
    .acl-row { height: 14px; }
    .acl-h { height: 22px; }
    .acl-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-top: 6px; }
    .acl-card { height: 72px; border-radius: 8px; }
    .acl-table { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
    .acl-th { height: 28px; }
    .acl-tr { height: 18px; }
    @keyframes acl-slide { 0% { left: -35%; } 100% { left: 100%; } }
    @keyframes acl-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    @media (prefers-reduced-motion: reduce) { .acl-row, .acl-card, .acl-bar::after { animation: none; } }
  `],
})
export class ContentLoaderComponent implements OnInit, OnDestroy {
  /** The scrolling content element whose routed page is inspected. */
  @Input() scope: HTMLElement | null = null;
  /** Where the skeleton starts, below any fixed strip (e.g. breadcrumbs). */
  @Input() skeletonTop = 44;

  static readonly SHOW_DELAY_MS = 150;
  static readonly POLL_MS = 200;

  readonly bar = signal(false);
  readonly skeleton = signal(false);
  readonly rows = [1, 2, 3, 4, 5, 6];

  private readonly loader = inject(LoaderService);
  private readonly zone = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLElement>);
  private sub?: Subscription;
  private delayTimer: any = null;
  private pollTimer: any = null;

  ngOnInit(): void {
    this.loader.contentHosts++;
    this.sub = this.loader.status.subscribe(on => (on ? this.start() : this.stop()));
  }

  ngOnDestroy(): void {
    this.loader.contentHosts = Math.max(0, this.loader.contentHosts - 1);
    this.sub?.unsubscribe();
    this.stop();
  }

  private start(): void {
    if (this.delayTimer || this.bar()) return;
    this.zone.runOutsideAngular(() => {
      this.delayTimer = setTimeout(() => {
        this.delayTimer = null;
        this.zone.run(() => { this.bar.set(true); this.evaluate(); });
        this.pollTimer = setInterval(() => {
          const want = !this.pageHasContent();
          if (want !== this.skeleton()) this.zone.run(() => this.skeleton.set(want));
        }, ContentLoaderComponent.POLL_MS);
      }, ContentLoaderComponent.SHOW_DELAY_MS);
    });
  }

  private stop(): void {
    clearTimeout(this.delayTimer); this.delayTimer = null;
    clearInterval(this.pollTimer); this.pollTimer = null;
    if (this.bar()) this.bar.set(false);
    if (this.skeleton()) this.skeleton.set(false);
  }

  private evaluate(): void { this.skeleton.set(!this.pageHasContent()); }

  /**
   * True once the routed page shows something: its own skeleton, a form
   * control, a table, or a little text. Everything in the scope except this
   * host and the breadcrumb bar counts.
   */
  private pageHasContent(): boolean {
    const scope = this.scope;
    if (!scope) return true;
    const self = this.host.nativeElement;
    for (const child of Array.from(scope.children) as HTMLElement[]) {
      if (child === self || child.tagName === 'ROUTER-OUTLET' || child.hasAttribute('data-crumbs')) continue;
      if (child.querySelector('ui-skeleton, .animate-pulse, [class*="skeleton"], [class*="skel-"]')) return true;
      if (child.querySelector('input, select, textarea, table, canvas, svg, img')) return true;
      if ((child.textContent || '').trim().length > 20) return true;
    }
    return false;
  }
}
