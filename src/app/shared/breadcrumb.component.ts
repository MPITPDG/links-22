import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-breadcrumbs',
  template: `
  @for (breadcrumb of breadcrumbs; track breadcrumb; let last = $last) {

    @if (breadcrumb.label.title&&breadcrumb.url.substring(breadcrumb.url.length-1) == '/'||breadcrumb.label.title&&last) {
<li class="breadcrumb-item"
       
        [ngClass]="{active: last}">
      @if (!last) {
<a [routerLink]="breadcrumb.url">{{breadcrumb.label.title}}</a>
}
      @if (last) {
<span [routerLink]="breadcrumb.url">{{breadcrumb.label.title}}</span>
}
    </li>
}
  
}`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BreadcrumbsComponent {
  breadcrumbs: Array<Object>;
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event) => {
      this.breadcrumbs = [];
      let currentRoute = this.route.root,
      url = '';
      do {
        const childrenRoutes = currentRoute.children;
        currentRoute = null;
        childrenRoutes.forEach(route => {
          if (route.outlet === 'primary') {
            const routeSnapshot = route.snapshot;
            url += '/' + routeSnapshot.url.map(segment => segment.path).join('/');
            this.breadcrumbs.push({
              label: route.snapshot.data,
              url:   url
            });
            currentRoute = route;
          }
        });
      } while (currentRoute);
    });
  }
}
