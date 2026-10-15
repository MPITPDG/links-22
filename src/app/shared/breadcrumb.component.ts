import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UiBreadcrumbs, UiCrumb } from './ui/breadcrumb';

/**
 * The route-driven breadcrumb shown on every page by the layout.
 *
 * Two things were wrong with the version this replaces, both visible on
 * Export > Master > Vessel > Search, which rendered as
 * "Export / Export / Vessel / Vessel / Search":
 *
 *  - It emitted one crumb per route level and did not compare them, so a
 *    parent and child that carry the same data.title (the module route and
 *    its empty-path child, or the vessel route and its form child) produced
 *    the same word twice in a row.
 *
 *  - Several route titles are themselves slash-delimited ('Vessel / Search'),
 *    which the old template rendered whole inside one crumb, so the separators
 *    were a mix of real crumbs and text that only looked like crumbs.
 *
 * Splitting the titles first and then dropping consecutive repeats fixes both,
 * and needs no change to the route definitions - there are several hundred of
 * them across the modules.
 */
@Component({
    selector: 'app-breadcrumbs',
    standalone: true,
    imports: [UiBreadcrumbs],
    template: `<ui-breadcrumbs [items]="crumbs" />`,
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class BreadcrumbsComponent {
    crumbs: UiCrumb[] = [];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
    ) {
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => {
                this.crumbs = this.build();
                this.cdr.markForCheck();
            });
    }

    private build(): UiCrumb[] {
        const out: UiCrumb[] = [];
        let currentRoute: ActivatedRoute | null = this.route.root;
        let url = '';

        while (currentRoute) {
            const next: ActivatedRoute | null =
                currentRoute.children.find(c => c.outlet === 'primary') ?? null;
            if (!next) break;

            const snapshot = next.snapshot;
            const segment = snapshot.url.map(s => s.path).join('/');
            if (segment) url += '/' + segment;

            // A title may hold several crumbs, e.g. 'Vessel / Search'. Only the
            // last part of a composite title is the route itself; the parts in
            // front of it are labels, so they get no link.
            const parts = String(snapshot.data?.['title'] ?? '')
                .split('/')
                .map(p => p.trim())
                .filter(Boolean);

            parts.forEach((label, i) => {
                const previous = out[out.length - 1];
                // Consecutive repeats are the same place named twice.
                if (previous && previous.label.toLowerCase() === label.toLowerCase()) return;
                const isRouteItself = i === parts.length - 1;
                out.push(isRouteItself && url ? { label, link: url } : { label });
            });

            currentRoute = next;
        }

        // The last crumb is where you are, so it renders as text either way.
        return out;
    }
}
