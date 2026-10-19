/**
 * Polyfills loaded before the app.
 *
 * The build targets ES2022 evergreen browsers, so the old core-js (IE9-11)
 * imports were dropped in the Angular 22 upgrade. Only Zone.js remains: the
 * app still bootstraps with provideZoneChangeDetection().
 */
import 'zone.js';
