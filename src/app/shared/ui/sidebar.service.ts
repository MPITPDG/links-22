import { DOCUMENT, Injectable, computed, inject, signal, DestroyRef } from '@angular/core';

export type SidebarState = 'expanded' | 'collapsed';

/**
 * Sidebar state, persistence and responsive behaviour.
 *
 * Modelled on spartan's HlmSidebarService: the same public surface
 * (open / openMobile / isMobile / state / setOpen / setOpenMobile /
 * toggleSidebar), the same cookie persistence and the same Ctrl/Cmd+B
 * shortcut. Written against our own kit rather than pulled in through
 * @spartan-ng/helm, which would drag in helm/{tooltip,button,input,separator,
 * sheet,skeleton,utils}, @ng-icons and class-variance-authority for behaviour
 * that is a few signals and two event listeners.
 *
 * Cookie rather than localStorage, matching spartan: it survives a hard reload
 * before hydration, and a blocked cookie jar degrades to the default rather
 * than throwing.
 */
@Injectable({ providedIn: 'root' })
export class UiSidebarService {
  private readonly _document = inject(DOCUMENT);
  private readonly _window = this._document.defaultView;

  // Links: namespaced (MP: 'mp_sidebar_state'). The cookie is path=/ and the
  // two ERPs can share an origin, so an un-prefixed name would be shared.
  static readonly COOKIE = 'links_sidebar_state';
  static readonly COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
  static readonly STORAGE_KEY = 'links_sidebar_state';
  /**
   * Below this the sidebar becomes an off-canvas overlay (closed by default).
   * Was 1024px (Tailwind lg). That was the main reason the sidebar "kept
   * closing": at 1024px and below - a laptop at 125%+ zoom, a split/narrow
   * browser window, the devtools pane opening - isMobile flipped true, the
   * docked sidebar was replaced by the mobile overlay, and that overlay starts
   * (and on every breakpoint crossing resets to) closed. Now only genuinely
   * small screens (< 768px, Tailwind md; matches max-md: in full-layout) do it.
   */
  static readonly MOBILE_QUERY = '(max-width: 767.98px)';
  static readonly SHORTCUT = 'b';

  private readonly _open = signal(true);
  private readonly _openMobile = signal(false);
  private readonly _isMobile = signal(false);

  readonly open = this._open.asReadonly();
  readonly openMobile = this._openMobile.asReadonly();
  readonly isMobile = this._isMobile.asReadonly();
  readonly state = computed<SidebarState>(() => (this._open() ? 'expanded' : 'collapsed'));

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.restoreFromCookie();

    if (!this._window || typeof this._window.matchMedia !== 'function') return;

    const mq = this._window.matchMedia(UiSidebarService.MOBILE_QUERY);
    this._isMobile.set(mq.matches);

    const onMedia = (e: MediaQueryListEvent) => {
      this._isMobile.set(e.matches);
      if (!e.matches) this._openMobile.set(false);   // leaving mobile closes the overlay
    };
    mq.addEventListener('change', onMedia);

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key?.toLowerCase() === UiSidebarService.SHORTCUT && (e.ctrlKey || e.metaKey)
          && !e.shiftKey && !e.altKey && !UiSidebarService.isEditable(e.target)) {
        e.preventDefault();
        this.toggleSidebar();
      }
    };
    this._window.addEventListener('keydown', onKeydown);

    destroyRef.onDestroy(() => {
      mq.removeEventListener('change', onMedia);
      this._window?.removeEventListener('keydown', onKeydown);
    });
  }

  /**
   * Ctrl+B typed while in a form field (a common reflex in text inputs) used
   * to collapse the sidebar as a side effect. Only honour it outside fields.
   */
  private static isEditable(t: EventTarget | null): boolean {
    const el = t as HTMLElement | null;
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!el.isContentEditable;
  }

  setOpen(open: boolean): void {
    this._open.set(open);
    try {
      this._window?.localStorage?.setItem(UiSidebarService.STORAGE_KEY, String(open));
    } catch { /* storage blocked - cookie below still carries it */ }
    try {
      this._document.cookie =
        `${UiSidebarService.COOKIE}=${open}; path=/; max-age=${UiSidebarService.COOKIE_MAX_AGE}`;
    } catch { /* blocked cookies should not break a click */ }
  }

  setOpenMobile(open: boolean): void { this._openMobile.set(open); }

  /** Toggles whichever sidebar is actually on screen. */
  toggleSidebar(): void {
    if (this._isMobile()) this._openMobile.update(v => !v);
    else this.setOpen(!this._open());
  }

  // ---- expanded menu branches ---------------------------------------------
  // Lives here rather than on MenuComponent on purpose. app.component sets
  //   routeReuseStrategy.shouldReuseRoute = () => false
  // so every navigation destroys and rebuilds the layout, and with it the
  // sidebar. Holding expansion on the component meant an open branch snapped
  // shut the moment you clicked anything inside it - the behaviour the old
  // application had and that we are deliberately removing here.
  //
  // Root-provided, so it survives that teardown and the menu stays exactly as
  // the user left it.

  private readonly _expanded = signal<ReadonlySet<string>>(new Set());
  readonly expanded = this._expanded.asReadonly();

  isExpanded(key: string): boolean { return this._expanded().has(key); }

  toggleExpanded(key: string): void {
    const next = new Set(this._expanded());
    if (!next.delete(key)) next.add(key);
    this._expanded.set(next);
  }

  /** Open a branch without closing anything - used when auto-revealing the active route. */
  expand(key: string): void {
    if (this._expanded().has(key)) return;
    const next = new Set(this._expanded());
    next.add(key);
    this._expanded.set(next);
  }

  // ---- nav scroll position -------------------------------------------------
  // Same reason as the expanded set above: the rebuild on every navigation
  // gives the <nav> a brand-new DOM node, whose scrollTop starts at 0. Click
  // an item near the bottom of a long menu and the list jumped back to the
  // top. Stored here so it survives the teardown and is put back on the way in.

  private _navScrollTop = 0;

  get navScrollTop(): number { return this._navScrollTop; }
  set navScrollTop(v: number) { this._navScrollTop = v; }

  /**
   * localStorage first (no expiry; survives reloads and module switches),
   * cookie as fallback. The cookie alone expired 7 days after the last toggle,
   * silently reverting to the default. MP's loginService calls localStorage.clear()
   * on login/logout, so the cookie is what carries the choice across a
   * re-login.
   */
  private restoreFromCookie(): void {
    try {
      const v = this._window?.localStorage?.getItem(UiSidebarService.STORAGE_KEY);
      if (v === 'true' || v === 'false') { this._open.set(v === 'true'); return; }
    } catch { /* fall through to the cookie */ }
    try {
      const prefix = `${UiSidebarService.COOKIE}=`;
      const hit = (this._document.cookie ?? '')
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith(prefix));
      if (hit) this._open.set(hit.slice(prefix.length) === 'true');
    } catch { /* fall back to the default */ }
  }
}
