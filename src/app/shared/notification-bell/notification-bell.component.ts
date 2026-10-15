import { Component, ElementRef, HostListener, OnDestroy, computed, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { TicketEvent, TicketService } from '../service/ticket.service';
import { NotificationCenterService } from '../service/notificationCenterService';
import { JobStateAlert, JobStateService } from '../service/jobstate.service';

/** Job-state alerts and ticket events are re-read every 2 minutes. */
const ALERT_POLL_MS = 2 * 60 * 1000;

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
 * Three sources, as MP: toast history (NotificationCenterService), export
 * job-state alerts (JobStateService, scope 'mine') and ticket events
 * (TicketService). The badge adds unread toasts + open WARN/CRIT alerts +
 * unread ticket events.
 *
 * Links: both polls fail soft and back off. The services return empty data on
 * any error and, after a few consecutive failures (endpoint not deployed yet),
 * stop calling the API for the session - so the 2-minute interval below then
 * costs nothing. The polls live in this component, which exists only inside the
 * logged-in layouts: logout navigates to /login (SimpleLayout), destroying it and
 * unsubscribing; with no login the services make no call at all.
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
    private readonly _jobState = inject(JobStateService);
    private readonly _pollSub: Subscription;
    private readonly _tickets = inject(TicketService);
    private readonly _ticketSub: Subscription;

    public open = false;

    public readonly items = this._centre.items;
    public readonly unreadCount = this._centre.unreadCount;

    /** Job alerts: badge counts open WARN + CRIT; the panel lists the 10 newest. */
    public readonly alertCount = this._jobState.urgentCount;
    public readonly recentAlerts = computed(() =>
        [...this._jobState.alerts()]
            .sort((a, b) => (Date.parse(b.last_seen || '') || 0) - (Date.parse(a.last_seen || '') || 0))
            .slice(0, 10));
    /** Ticket events: badge counts unread; the panel lists the 5 newest. */
    public readonly ticketUnread = this._tickets.unread;
    public readonly ticketEvents = computed(() => this._tickets.recentEvents().slice(0, 5));
    public readonly badgeCount = computed(() => this.unreadCount() + this.alertCount() + this.ticketUnread());

    constructor() {
        // Close on navigation - the panel is anchored to the header, not the page.
        this._routerSub = this._router.events.subscribe(e => {
            if (e instanceof NavigationStart) { this.open = false; }
        });
        // Links: the layout (and so this bell) is rebuilt on every navigation
        // (shouldReuseRoute = () => false). The first tick therefore reads the
        // services' 60-second cache instead of forcing a call on each page change;
        // the 2-minute ticks force a fresh read, as MP does.
        // Fail-soft poll: the service returns an empty list when the API is absent.
        this._pollSub = interval(ALERT_POLL_MS).pipe(
            startWith(-1),
            switchMap(i => this._jobState.load(i >= 0, 'mine')),
        ).subscribe();
        // Same 2-minute cadence for ticket events (bootstrap + newest events, fail-soft).
        this._ticketSub = interval(ALERT_POLL_MS).pipe(
            startWith(-1),
            switchMap(i => this._tickets.load(i >= 0)),
        ).subscribe();
    }

    ngOnDestroy(): void {
        this._routerSub.unsubscribe();
        this._pollSub.unsubscribe();
        this._ticketSub.unsubscribe();
    }

    public triggerLabel(): string {
        const n = this.unreadCount();
        const a = this.alertCount();
        const t = this.ticketUnread();
        let label = n === 0 ? 'Notifications, none unread' : `Notifications, ${n} unread`;
        if (a > 0) { label += `, ${a} job ${a === 1 ? 'alert' : 'alerts'}`; }
        if (t > 0) { label += `, ${t} ticket ${t === 1 ? 'update' : 'updates'}`; }
        return label;
    }

    public openJob(a: JobStateAlert): void {
        this.open = false;
        this._router.navigate(['export/Consignment/view', a.exptno]);
    }

    public openTicket(e: TicketEvent): void {
        this.open = false;
        this._router.navigate(['/tickets'], { queryParams: { open: e.ticket_id } });
    }

    /** RAISED->NEW, INPROGRESS->WIP, COMPLETED->DONE, DISCARDED->DROP, ASSIGN, COMMENT->NOTE. */
    public ticketMark(e: TicketEvent): string {
        switch ((e.event_type || '').toUpperCase()) {
            case 'RAISED': return 'NEW';
            case 'ASSIGN': return 'ASSIGN';
            case 'COMMENT': return 'NOTE';
            case 'STATUS':
                switch ((e.to_status || '').toUpperCase()) {
                    case 'INPROGRESS': return 'WIP';
                    case 'COMPLETED': return 'DONE';
                    case 'DISCARDED': return 'DROP';
                    case 'RAISED': return 'NEW';
                }
                return 'MOVE';
            default: return 'NOTE';
        }
    }

    public unseen(e: TicketEvent): boolean { return !Number(e.seen ?? 0); }

    public ticketLine(e: TicketEvent): string {
        const by = e.by_name || 'someone';
        const rem = e.remark ? ' · "' + e.remark + '"' : '';
        switch ((e.event_type || '').toUpperCase()) {
            case 'RAISED': return 'New ticket from ' + by + ' · assigned to you';
            case 'STATUS': return 'Moved to ' + TicketService.label(e.to_status) + ' by ' + by + rem;
            case 'ASSIGN': return 'Assigned by ' + by + rem;
            case 'COMMENT': return 'Comment by ' + by + rem;
            default: return (e.event_type || 'Update') + ' by ' + by + rem;
        }
    }

    /** Marks every ticket event seen (Tickets/EventsSeen ticketId 0). */
    public markTicketsSeen(): void { this._tickets.eventsSeen(0).subscribe(); }

    public acknowledge(a: JobStateAlert, event: MouseEvent): void {
        event.stopPropagation();
        this._jobState.acknowledge(a).subscribe();
    }

    public toggle(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        if (!this.open) {
            // Cached / backed-off reads: opening the bell never hammers a missing endpoint.
            this._jobState.load().subscribe();
            this._tickets.events(false, 5).subscribe();
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
