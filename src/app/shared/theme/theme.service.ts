import { Injectable, inject, signal } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DataService } from '../service/dataService';
import { LoginService } from '../service/loginService';
import { CLASSIC_ID, PALETTES, ThemePalette } from './palettes';

export type ThemeScope = 'app' | 'chrome';
export interface ThemePref { id: string; scope: ThemeScope; remember?: boolean; }

// Links: namespaced (MP uses 'mp_erp_theme'). Both ERPs can be served from the
// same origin and so share localStorage, the same reason the login lives under
// '_linksuser' rather than MP's '_user'.
const LS_KEY = 'links_erp_theme';
const PREF_KEY = 'theme';

/**
 * App-wide colour theme. Tokens are written as `--mp-*` inline on <html>;
 * global CSS in tailwind.css maps them onto the .theme-gray chrome tokens and
 * the scoped stylesheets read them with Classic fallbacks.
 * localStorage = device default (read synchronously at boot, survives logout);
 * Common/UserPref = per-login value (fails soft).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _data = inject(DataService);
  private readonly _login = inject(LoginService);

  /** Persisted (applied) palette id and scope. */
  public readonly current = signal<string>(CLASSIC_ID);
  public readonly scope = signal<ThemeScope>('app');
  public readonly remember = signal<boolean>(true);
  /** Last URL outside /Profile, so the theme page can send the user back. */
  public readonly returnUrl = signal<string>('');
  public noteNavigation(url: string): void {
    const u = (url || '').split('?')[0];
    if (u && !u.startsWith('/Profile') && u !== '/login' && u !== '/') { this.returnUrl.set(url); }
  }

  private _syncedUser = '';

  public palettes(): ThemePalette[] { return PALETTES; }
  public find(id: string): ThemePalette | undefined { return PALETTES.find(p => p.id === id); }

  /** Synchronous boot read of the device default. */
  public init(): void {
    const p = this._readLocal();
    if (p) {
      this.current.set(p.id);
      this.scope.set(p.scope);
      if (p.remember === false) this.remember.set(false);
    }
    this.apply(this.current(), this.scope());
  }

  /** Paint only (no persistence). Used for live preview and for persisted state. */
  public apply(id: string, scope: ThemeScope): void {
    const root = document.documentElement;
    const pal = this.find(id);
    for (const p of PALETTES) for (const k of Object.keys(p.t)) root.style.removeProperty('--mp-' + k);
    for (let i = 1; i <= 5; i++) root.style.removeProperty('--mp-chart-' + i);
    if (!pal || pal.id === CLASSIC_ID) {
      root.removeAttribute('data-theme');
      root.removeAttribute('data-theme-scope');
      return;
    }
    for (const [k, v] of Object.entries(pal.t)) root.style.setProperty('--mp-' + k, v);
    pal.chart.forEach((c, i) => root.style.setProperty('--mp-chart-' + (i + 1), c));
    root.setAttribute('data-theme', pal.id);
    root.setAttribute('data-theme-scope', scope);
  }

  /** Re-paint the persisted state (e.g. leaving the theme page without Apply). */
  public revert(): void { this.apply(this.current(), this.scope()); }

  /** Apply and persist: localStorage now, API when logged in and remember is on. */
  public save(id: string, scope: ThemeScope, remember: boolean): void {
    const pal = this.find(id) ? id : CLASSIC_ID;
    this.current.set(pal);
    this.scope.set(scope);
    this.remember.set(remember);
    this.apply(pal, scope);
    try { localStorage.setItem(LS_KEY, JSON.stringify({ id: pal, scope, remember })); } catch { /* ignore */ }
    const userId = this._userId();
    if (remember && userId) {
      this._data.Common<any>('Common/UserPref/Set', { userId, key: PREF_KEY, value: JSON.stringify({ id: pal, scope }) })
        .pipe(catchError(() => of(null))).subscribe();
    }
  }

  /** Once per logged-in user: pull the login's saved theme and re-apply if different. */
  public syncFromServer(): void {
    const userId = this._userId();
    if (!userId || userId === this._syncedUser) return;
    this._syncedUser = userId;
    if (!this.remember()) return;
    this._data.Common<any>('Common/UserPref/Get', { userId, key: PREF_KEY })
      .pipe(catchError(() => of(null)))
      .subscribe((ds: any) => {
        const raw = (Array.isArray(ds?.Table) ? ds.Table : []).find((r: any) => r && r.PREF_KEY === PREF_KEY)?.PREF_VALUE;
        if (!raw) return;
        const p = this._parse(raw);
        if (!p || (p.id === this.current() && p.scope === this.scope())) return;
        this.current.set(p.id);
        this.scope.set(p.scope);
        this.apply(p.id, p.scope);
        try { localStorage.setItem(LS_KEY, JSON.stringify({ id: p.id, scope: p.scope, remember: true })); } catch { /* ignore */ }
      });
  }

  private _userId(): string {
    try { return String(this._login.getLogin()?.[0]?.CMPID ?? '').trim(); } catch { return ''; }
  }

  private _readLocal(): ThemePref | null {
    try { const v = localStorage.getItem(LS_KEY); return v ? this._parse(v) : null; } catch { return null; }
  }

  private _parse(v: string): ThemePref | null {
    try {
      const o = JSON.parse(v);
      if (!o || !this.find(o.id)) return null;
      return { id: o.id, scope: o.scope === 'chrome' ? 'chrome' : 'app', remember: o.remember };
    } catch { return null; }
  }
}
