import { Component, OnDestroy, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ThemeService, ThemeScope } from '../../shared/theme/theme.service';
import { LoginService } from '../../shared/service/loginService';
import { Router } from '@angular/router';

/** /Profile/Theme - pick a palette. Clicking previews live; Apply persists; leaving reverts. */
@Component({
  selector: 'app-theme-settings',
  templateUrl: './theme-settings.component.html',
  styleUrls: ['./theme-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ThemeSettingsComponent implements OnDestroy {
  readonly theme = inject(ThemeService);
  private readonly _login = inject(LoginService);
  private readonly _router = inject(Router);

  /** Leave the page: the page the user came from when known, else the module chooser. */
  back(): void {
    const from = this.theme.returnUrl?.() || '';
    if (from && !from.startsWith('/Profile')) { this._router.navigateByUrl(from); return; }
    if (history.length > 1) { history.back(); return; }
    this._router.navigate(['/module']);
  }

  readonly palettes = this.theme.palettes();
  readonly selected = signal(this.theme.current());
  readonly scope = signal<ThemeScope>(this.theme.scope());
  readonly remember = signal(this.theme.remember());
  readonly appliedName = computed(() => this.theme.find(this.theme.current())?.name ?? 'Classic');
  readonly selectedName = computed(() => this.theme.find(this.selected())?.name ?? 'Classic');
  readonly bars = [{ n: 'CMA CGM', v: 42, w: 92 }, { n: 'MAERSK', v: 31, w: 68 }, { n: 'MSC', v: 22, w: 48 }, { n: 'HAPAG', v: 14, w: 30 }, { n: 'ONE', v: 8, w: 18 }];
  readonly userLabel: string;

  constructor() {
    let l: any = null;
    try { l = this._login.getLogin()?.[0]; } catch { /* ignore */ }
    this.userLabel = [l?.CMP_USERNAME, l?.CITYNAME].filter(Boolean).join(' · ');
  }

  pick(id: string): void { this.selected.set(id); this.theme.apply(id, this.scope()); }
  setScope(s: ThemeScope): void { this.scope.set(s); this.theme.apply(this.selected(), s); }
  setRemember(ev: Event): void { this.remember.set(!!(ev.target as HTMLInputElement)?.checked); }
  apply(): void { this.theme.save(this.selected(), this.scope(), this.remember()); }
  reset(): void { this.selected.set('classic'); this.theme.save('classic', this.scope(), this.remember()); }

  ngOnDestroy(): void { this.theme.revert(); }
}
