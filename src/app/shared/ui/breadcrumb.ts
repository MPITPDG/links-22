import { Component, Directive, Input, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { cn } from './cn';

/**
 * Breadcrumb trail.
 *
 * Two ways in, both here on purpose:
 *
 *  - <ui-breadcrumbs [items]="..."> renders a whole trail from an array. This
 *    is what the pages use. The trail is the same four-or-so crumbs on every
 *    screen of a module, and hand-writing a nested <ol> on each of ~90 export
 *    templates is how they drift apart.
 *
 *  - The uiBreadcrumb* primitives below, for the odd screen that needs
 *    something the array can't express. They mirror the spartan/helm element
 *    names one for one, so their examples translate directly.
 *
 * The helm package itself is not a dependency: helm ships as copy-in styling
 * rather than a runtime library, and the kit already owns its own tokens.
 */

/** One crumb. A crumb with no link renders as plain text, not a dead anchor. */
export interface UiCrumb {
    label: string;
    /** routerLink for this crumb. Omit for a section that is not a page. */
    link?: string | any[];
}

@Directive({
    selector: 'nav[uiBreadcrumb]',
    standalone: true,
    host: { 'aria-label': 'Breadcrumb', class: 'block' },
})
export class UiBreadcrumbNav { }

@Directive({
    selector: 'ol[uiBreadcrumbList]',
    standalone: true,
    host: {
        class: 'flex flex-wrap items-center gap-1.5 text-xs text-[var(--muted-foreground)]',
    },
})
export class UiBreadcrumbList { }

@Directive({
    selector: 'li[uiBreadcrumbItem]',
    standalone: true,
    host: { class: 'inline-flex items-center gap-1.5' },
})
export class UiBreadcrumbItem { }

@Directive({
    selector: 'a[uiBreadcrumbLink]',
    standalone: true,
    host: {
        class: 'transition-colors hover:text-[var(--foreground)] hover:underline',
    },
})
export class UiBreadcrumbLink { }

/** The last crumb: where you are. Not a link, and announced as the current page. */
@Directive({
    selector: '[uiBreadcrumbPage]',
    standalone: true,
    host: {
        class: 'font-medium text-[var(--foreground)]',
        'aria-current': 'page',
        role: 'link',
        'aria-disabled': 'true',
    },
})
export class UiBreadcrumbPage { }

/**
 * The divider. aria-hidden because it carries no meaning to a screen reader -
 * the list structure already says these are separate crumbs.
 */
@Component({
    selector: 'li[uiBreadcrumbSeparator]',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    host: {
        class: 'inline-flex select-none items-center text-[var(--muted-foreground)] opacity-60',
        role: 'presentation',
        'aria-hidden': 'true',
    },
    template: `<span class="px-0.5">/</span>`,
})
export class UiBreadcrumbSeparator { }

@Component({
    selector: 'ui-breadcrumbs',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    host: { class: 'block' },
    imports: [
        RouterLink,
        UiBreadcrumbNav, UiBreadcrumbList, UiBreadcrumbItem,
        UiBreadcrumbLink, UiBreadcrumbPage, UiBreadcrumbSeparator,
    ],
    template: `
    <nav uiBreadcrumb [class]="cls">
      <ol uiBreadcrumbList>
        @for (crumb of items; track crumb.label; let last = $last) {
          <li uiBreadcrumbItem>
            @if (crumb.link && !last) {
              <a uiBreadcrumbLink [routerLink]="crumb.link">{{ crumb.label }}</a>
            } @else if (last) {
              <span uiBreadcrumbPage>{{ crumb.label }}</span>
            } @else {
              <span>{{ crumb.label }}</span>
            }
          </li>
          @if (!last) {
            <li uiBreadcrumbSeparator></li>
          }
        }
      </ol>
    </nav>`,
})
export class UiBreadcrumbs {
    @Input() items: UiCrumb[] = [];
    @Input() class = '';
    get cls() { return cn(this.class); }
}
