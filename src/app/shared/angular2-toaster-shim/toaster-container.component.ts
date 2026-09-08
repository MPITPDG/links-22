import { Component, Input, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToasterService, Toast } from './toaster.service';
import { ToasterConfig } from './toaster-config';

function typeClass(type: string): string {
    const t = (type || '').toLowerCase();
    if (t === 'success') { return 'alert-success'; }
    if (t === 'error' || t === 'alert') { return 'alert-danger'; }
    if (t === 'warning') { return 'alert-warning'; }
    return 'alert-info';
}

@Component({
    selector: 'toaster-container',
    template: `
        <div class="toaster-shim-container" [ngClass]="positionClass">
          @for (t of toasts; track t) {
            <div
              class="alert toaster-shim-toast"
              [ngClass]="typeClass(t.type)"
              (click)="dismiss(t)">
              @if (t.title) {
                <strong>{{ t.title }}</strong>
              }
              @if (t.body) {
                <span>{{ t.body }}</span>
              }
            </div>
          }
        </div>
        `,
    styles: [`
        .toaster-shim-container {
            position: fixed;
            z-index: 2000;
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-width: 350px;
        }
        .toast-top-right { top: 12px; right: 12px; }
        .toast-top-left { top: 12px; left: 12px; }
        .toast-bottom-right { bottom: 12px; right: 12px; }
        .toast-bottom-left { bottom: 12px; left: 12px; }
        .toast-top-center { top: 12px; left: 50%; transform: translateX(-50%); }
        .toast-bottom-center { bottom: 12px; left: 50%; transform: translateX(-50%); }
        .toaster-shim-toast {
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,.2);
            margin: 0;
        }
    `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ToasterContainerComponent implements OnInit, OnDestroy {
    @Input() toasterconfig: ToasterConfig = new ToasterConfig();

    toasts: Toast[] = [];
    private sub: Subscription;

    constructor(private toasterService: ToasterService) { }

    get positionClass(): string {
        return this.toasterconfig && this.toasterconfig.positionClass || 'toast-top-right';
    }

    typeClass(type: string): string {
        return typeClass(type);
    }

    ngOnInit(): void {
        this.sub = this.toasterService.toasts$.subscribe(t => {
            this.toasts.push(t);
            const timeout = this.toasterconfig ? this.toasterconfig.timeout : 5000;
            if (timeout && timeout > 0) {
                setTimeout(() => this.dismiss(t), timeout);
            }
        });
    }

    dismiss(toast: Toast): void {
        if (!this.toasterconfig || this.toasterconfig.tapToDismiss !== false) {
            this.toasts = this.toasts.filter(t => t.id !== toast.id);
        }
    }

    ngOnDestroy(): void {
        if (this.sub) { this.sub.unsubscribe(); }
    }
}
