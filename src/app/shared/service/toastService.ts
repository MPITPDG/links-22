import { Injectable, inject } from '@angular/core';
import { toast } from '@spartan-ng/brain/sonner';
import { NotificationCenterService } from './notificationCenterService';

/**
 * Application-wide toast facade.
 *
 * The signature is unchanged from the angular2-toaster version it replaces, so
 * every existing call site (~2,200 in Links) keeps working untouched:
 *
 *     this._toasterService.toast('error', 'Error', 'Please enter Container no');
 *
 * Only the rendering changed - toasts now go through @spartan-ng/brain's
 * sonner, drawn by <ui-toaster> at the app root, and pick up the theme tokens
 * instead of the old vendor stylesheet.
 *
 * Keeping the facade rather than migrating call sites is deliberate: it is one
 * file instead of thousands of edits, and it means the toast implementation
 * can be swapped again later without touching feature code.
 */
@Injectable()
export class ToastCommonService {

    /**
     * Notifications are also recorded so the header bell can show anything the
     * user missed while the toast was on screen. Optional injection: if the
     * centre is somehow not provided, toasts still work exactly as before.
     */
    private readonly _centre = inject(NotificationCenterService, { optional: true });

    /**
     * @param errortype  'error' | 'warning' | 'info' | 'success' | 'alert'
     *                   ('alert' appears at 2 call sites and is treated as a
     *                   warning; anything unrecognised falls back to a plain
     *                   toast rather than being dropped silently.)
     * @param errortitle Heading. Blank titles are tolerated - several callers
     *                   pass '' - in which case the message becomes the title.
     * @param errormessage Body text.
     */
    public toast(errortype: string, errortitle: string, errormessage: string): void {
        const title = (errortitle ?? '').toString().trim();
        const body = (errormessage ?? '').toString().trim();

        // Callers are inconsistent about which of the two carries the text.
        // Use whichever is present as the heading so a toast is never blank.
        const heading = title !== '' ? title : body;
        const description = title !== '' && body !== '' ? body : undefined;
        const opts = description ? { description } : undefined;

        switch ((errortype ?? '').toString().toLowerCase()) {
            case 'error':   toast.error(heading, opts); break;
            case 'success': toast.success(heading, opts); break;
            case 'info':    toast.info(heading, opts); break;
            case 'warning':
            case 'alert':   toast.warning(heading, opts); break;
            default:        toast(heading, opts); break;
        }

        // Rendering above is unchanged; this is purely additive. Guarded so a
        // fault in the notification store can never swallow a toast.
        try {
            this._centre?.add(errortype, heading, description ?? '');
        } catch { /* ignore */ }
    }
}
