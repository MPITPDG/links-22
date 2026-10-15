import { Injectable, Injector, computed, signal } from '@angular/core';
import { LoginService } from './loginService';

/**
 * One recorded notification. Mirrors the ToastCommonService signature so a
 * toast can be stored without the call site knowing anything about this.
 */
export interface AppNotification {
    id: string;
    /** 'error' | 'warning' | 'info' | 'success' | 'alert' | 'default' */
    type: string;
    title: string;
    body: string;
    /** When it was raised. Serialised as an ISO string in localStorage. */
    at: Date;
    read: boolean;
}

/** Newest-first cap. Enough to cover a long working day, small enough to store. */
const MAX_ITEMS = 200;
// Links: namespaced (MP uses 'mp_erp_notifications_') - the two ERPs can share
// an origin and therefore localStorage. Same reason as '_linksuser'.
const KEY_PREFIX = 'links_erp_notifications_';

/**
 * Notification centre.
 *
 * Toasts vanish after a few seconds, so anything raised while the user was
 * looking elsewhere was simply lost. This keeps the last {@link MAX_ITEMS} of
 * them, newest first, behind the bell in the header.
 *
 * Provided once in AppModule (next to ToastCommonService) so it is a single
 * root-injector instance - a lazily loaded feature module must not get its own
 * copy or the bell would show a different list per module.
 *
 * LoginService is resolved lazily through the Injector rather than taken as a
 * constructor dependency: ToastCommonService depends on this service and is
 * constructed very early, and the logged-in user is not known until after the
 * login screen, so the storage key has to be re-evaluated rather than fixed at
 * construction time.
 */
@Injectable()
export class NotificationCenterService {

    private readonly _items = signal<AppNotification[]>([]);

    /** Newest first. */
    public readonly items = this._items.asReadonly();
    public readonly unreadCount = computed(() => this._items().filter(n => !n.read).length);

    /** Storage key currently loaded, so a change of user reloads the list. */
    private _key = '';

    constructor(private _injector: Injector) {
        this.sync();
    }

    /**
     * Record a notification. Called by ToastCommonService for every toast; the
     * ~3,000 existing toast call sites are untouched.
     */
    public add(type: string, title: string, body: string): void {
        this.sync();
        const item: AppNotification = {
            id: this.newId(),
            type: ((type ?? '').toString().toLowerCase()) || 'default',
            title: (title ?? '').toString(),
            body: (body ?? '').toString(),
            at: new Date(),
            read: false
        };
        this._items.update(list => [item, ...list].slice(0, MAX_ITEMS));
        this.persist();
    }

    public dismiss(id: string): void {
        this._items.update(list => list.filter(n => n.id !== id));
        this.persist();
    }

    public clearAll(): void {
        this._items.set([]);
        this.persist();
    }

    public markAllRead(): void {
        if (this.unreadCount() === 0) { return; }
        this._items.update(list => list.map(n => n.read ? n : { ...n, read: true }));
        this.persist();
    }

    /**
     * Re-point at the current user's list. Cheap; called on every add and by
     * the bell when its panel opens, which is what makes "log in, then see
     * your own notifications" work without an explicit login hook.
     */
    public sync(): void {
        const key = this.currentKey();
        if (key === this._key) { return; }
        this._key = key;
        this.restore();
    }

    // ---- persistence -------------------------------------------------------
    // Every storage touch is wrapped: private mode, a full quota and corrupt
    // JSON must never be able to take the application down over a toast.
    //
    // There is no explicit logout hook. In Links, LoginService.removeLogin()
    // does NOT clear localStorage (MP's does), so a user's list survives a
    // logout; the key is per user, so the next login still sees only its own
    // list, and the next sync() after a user change reloads it.

    /** Per-user key, so two accounts on one machine do not share a list. */
    private currentKey(): string {
        let who = 'anon';
        try {
            const login = this._injector.get(LoginService, null, { optional: true });
            const row = login ? login.getLogin() : null;
            if (row && row[0]) {
                who = [row[0].CMPCODE, row[0].CMP_USERNAME].filter(Boolean).join('_') || 'anon';
            }
        } catch { /* not logged in yet, or LoginService unavailable */ }
        return KEY_PREFIX + who;
    }

    private serialise(list: AppNotification[]): string {
        return JSON.stringify(list.map(n => ({
            id: n.id, type: n.type, title: n.title, body: n.body,
            at: n.at instanceof Date ? n.at.toISOString() : String(n.at),
            read: n.read
        })));
    }

    private persist(): void {
        const list = this._items().slice(0, MAX_ITEMS);
        try {
            localStorage.setItem(this._key, this.serialise(list));
        } catch {
            // Quota exceeded or storage blocked. Drop the oldest half once and
            // retry; if that still fails the list simply stays in memory.
            try {
                localStorage.setItem(this._key, this.serialise(list.slice(0, Math.floor(MAX_ITEMS / 2))));
            } catch { /* give up quietly */ }
        }
    }

    private restore(): void {
        try {
            const raw = localStorage.getItem(this._key);
            if (!raw) { this._items.set([]); return; }
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) { this._items.set([]); return; }
            const list: AppNotification[] = parsed
                .filter((n: any) => n && typeof n === 'object')
                .slice(0, MAX_ITEMS)
                .map((n: any) => ({
                    id: String(n.id ?? this.newId()),
                    type: String(n.type ?? 'default'),
                    title: String(n.title ?? ''),
                    body: String(n.body ?? ''),
                    at: n.at ? new Date(n.at) : new Date(),
                    read: !!n.read
                }));
            this._items.set(list);
        } catch {
            // Unreadable or corrupt - start empty rather than throwing.
            try { this._items.set([]); } catch { /* unreachable */ }
        }
    }

    private newId(): string {
        return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
    }
}
