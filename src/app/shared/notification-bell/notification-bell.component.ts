import { Component, ElementRef, HostListener, OnDestroy, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationCenterService } from '../service/notificationCenterService';

/**
 * Header bell for the notification centre (ported from MPERPNG-20).
 *
 * Toasts still behave exactly as before - same sonner calls, same durations.
 * This only surfaces what was recorded alongside them, so a message the user
 * missed is still reachable.
 *
 * Read state is deliberately NOT cleared merely by opening the panel: the
 * whole point is that the user missed something, so the emphasis stays until
 * "Mark all read" is pressed (or the row is dismissed).
 *
 * Links: notification centre (toast history) ONLY. MP's bell also shows
 * export job-state alerts (JobStateService) and ticket events (TicketService),
 * each polled every 2 minutes. Links' API has neither endpoint yet, so that
 * polling would only 404; the services, the polling and both panel sections
 * are left out. When the endpoints exist, port them back from MPERPNG-20:
 *   - inject JobStateService / TicketService here,
 *   - add alertCount() + ticketUnread() to badgeCount(),
 *   - restore the interval(2 min) polls in the constructor and the
 *     load()/events() refresh in toggle(),
 *   - restore the "Job alerts" / "Tickets" sections in the template (marked).
 */
@Component({
    selector: 'app-notification-bell',
    templateUrl: './notification-bell.component.html',
    styleUrls: ['./notification-bell.component.css'],
    standalone: false
})
export class NotificationBellComponent implements OnDestroy {

    private readonly _centre = inject(NotificationCenterService);
    private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly _router = inject(Router);
    private readonly _routerSub: Subscription;

    public open = false;

    public readonly items = this._centre.items;
    public readonly unreadCount = this._centre.unreadCount;
    /** Toast history only for now; alerts/tickets add to this when ported. */
    public readonly badgeCount = this._centre.unreadCount;

    constructor() {
        // Close on navigation - the panel is anchored to the header, not the page.
        this._routerSub = this._router.events.subscribe(e => {
            if (e instanceof NavigationStart) { this.open = false; }
        });
    }

    ngOnDestroy(): void {
        this._routerSub.unsubscribe();
    }

    public triggerLabel(): string {
        const n = this.unreadCount();
        return n === 0 ? 'Notifications, none unread' : `Notifications, ${n} unread`;
    }

    public toggle(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        if (!this.open) {
            // Pick up the current user's stored list (login happens after the
            // service is first constructed).
            this._centre.sync();
        }
        this.open = !this.open;
    }

    public markAllRead(): void { this._centre.markAllRead(); }
    public clearAll(): void { this._centre.clearAll(); }
    public dismiss(id: string): void { this._centre.dismiss(id); }

    @HostListener('document:click', ['$event'])
    public onDocumentClick(event: MouseEvent): void {
        if (!this.open) { return; }
        const target = event.target as Node | null;
        if (target && this._host.nativeElement.contains(target)) { return; }
        this.open = false;
    }

    @HostListener('document:keydown.escape')
    public onEscape(): void {
        if (this.open) { this.open = false; }
    }

    /** Short uppercase word instead of a colour, so the list stays monochrome. */
    public mark(type: string): string {
        switch ((type ?? '').toLowerCase()) {
            case 'error':   return 'Error';
            case 'success': return 'Done';
            case 'warning':
            case 'alert':   return 'Warn';
            case 'info':    return 'Info';
            default:        return 'Note';
        }
    }

    /** "just now" / "2 min ago" / "Yesterday 14:05" / "12 Mar 14:05". */
    public when(at: Date): string {
        const d = at instanceof Date ? at : new Date(at);
        if (isNaN(d.getTime())) { return ''; }

        const now = new Date();
        const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
        if (diffSec < 45) { return 'just now'; }
        if (diffSec < 3600) {
            return Math.round(diffSec / 60) + ' min ago';
        }

        const hhmm = this.two(d.getHours()) + ':' + this.two(d.getMinutes());
        const sameDay = (a: Date, b: Date) =>
            a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

        if (sameDay(d, now)) {
            const h = Math.round(diffSec / 3600);
            return h <= 6 ? h + (h === 1 ? ' hour ago' : ' hours ago') : 'Today ' + hhmm;
        }

        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        if (sameDay(d, yesterday)) { return 'Yesterday ' + hhmm; }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return this.two(d.getDate()) + ' ' + months[d.getMonth()] + ' ' + hhmm;
    }

    private two(n: number): string { return n < 10 ? '0' + n : String(n); }
}
