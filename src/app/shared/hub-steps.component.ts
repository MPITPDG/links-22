import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from './service/loginService';

type HubStep = 'branch' | 'company' | 'module';

/**
 * Step indicator shared by the three hub pages - Branch, Company, Module - so
 * login through module reads as one flow.
 *
 * The company step only exists when the login has no CMPTYPE: a freight (FRT)
 * login goes branch -> module, exactly as BranchComponent.setCity routes it,
 * so the indicator shows two steps there instead of three.
 *
 * Completed steps show what was chosen and link back to that page.
 *
 * The component sets its own row height and top offset, and every hub page
 * places it as the first child of a flex-column page root, so it lands in
 * exactly the same place on all three pages and does not jump between them.
 */
@Component({
    selector: 'app-hub-steps',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <nav class="hs" aria-label="Setup steps">
      @for (s of steps; track s.key; let i = $index; let last = $last) {
        @if (s.state === 'done') {
          <button type="button" class="hs-step is-done" (click)="go(s.key)" [attr.aria-label]="'Change ' + s.label">
            <span class="hs-dot"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg></span>
            <span class="hs-label">{{ s.label }}</span>
            @if (s.value) { <span class="hs-value">{{ s.value }}</span> }
          </button>
        } @else {
          <span class="hs-step" [class.is-current]="s.state === 'current'" [attr.aria-current]="s.state === 'current' ? 'step' : null">
            <span class="hs-dot">{{ i + 1 }}</span>
            <span class="hs-label">{{ s.label }}</span>
          </span>
        }
        @if (!last) { <span class="hs-line" [class.is-done]="s.state === 'done'" aria-hidden="true"></span> }
      }
    </nav>`,
    styles: [`
    :host { display: flex; justify-content: center; height: 64px; padding-top: 22px; flex-shrink: 0; }
    .hs { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; white-space: nowrap;
          font-family: Inter, -apple-system, "Segoe UI", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    .hs-step { display: inline-flex; align-items: center; gap: 7px; height: 28px; padding: 0 10px 0 4px;
               border-radius: 999px; font-size: 12.5px; font-weight: 500; color: var(--mp-soft, #9CA3AF);
               background: none; border: 0; font-family: inherit; line-height: 1; }
    .hs-dot { width: 20px; height: 20px; border-radius: 999px; display: grid; place-items: center;
              font-size: 11px; font-weight: 600; color: var(--mp-soft, #9CA3AF); background: var(--mp-surface, #FFFFFF); box-shadow: inset 0 0 0 1px #E5E7EB; }
    .hs-step.is-current { color: var(--mp-ink, #0F172A); background: var(--mp-surface, #FFFFFF); box-shadow: 0 1px 2px rgba(16,24,40,.06), 0 0 0 1px #E5E7EB; }
    .hs-step.is-current .hs-dot { color: #FFFFFF; background: #3B82F6; box-shadow: none; }
    .hs-step.is-done { color: var(--mp-soft, #374151); cursor: pointer; transition: background .12s; }
    .hs-step.is-done:hover { background: var(--mp-surface, #FFFFFF); box-shadow: 0 0 0 1px #E5E7EB; }
    .hs-step.is-done:focus-visible { outline: none; box-shadow: 0 0 0 2px #3B82F6; }
    .hs-step.is-done .hs-dot { color: #FFFFFF; background: #10B981; box-shadow: none; }
    .hs-value { color: var(--mp-soft, #6B7280); font-weight: 400; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .hs-line { width: 24px; height: 1px; background: var(--mp-band, #E5E7EB); }
    .hs-line.is-done { background: #A7F3D0; }
    `],
})
export class HubStepsComponent {
    @Input() current: HubStep = 'branch';

    constructor(private _router: Router, private _loginService: LoginService) { }

    private login(): any {
        try { return this._loginService.getLogin()?.[0] ?? null; } catch { return null; }
    }

    private titleCase(v: any): string {
        const t = (v ?? '').toString().trim().toLowerCase();
        return t.replace(/\b\w/g, c => c.toUpperCase());
    }

    get steps(): { key: HubStep; label: string; value: string; state: 'done' | 'current' | 'todo' }[] {
        const l = this.login();
        const hasCompany = !l?.CMPTYPE;
        const order: HubStep[] = hasCompany ? ['branch', 'company', 'module'] : ['branch', 'module'];
        const at = order.indexOf(this.current);
        const labels: Record<HubStep, string> = { branch: 'Branch', company: 'Company', module: 'Module' };
        const values: Record<HubStep, string> = {
            branch: this.titleCase(l?.CITYNAME),
            company: this.titleCase(l?.CMPNAME),
            module: '',
        };
        return order.map((key, i) => ({
            key, label: labels[key], value: i < at ? values[key] : '',
            state: i < at ? 'done' : i === at ? 'current' : 'todo',
        }));
    }

    go(key: HubStep): void {
        if (key === 'branch') { this._router.navigate(['/branch']); }
        else if (key === 'company') { this._router.navigate(['/company']); }
    }
}
