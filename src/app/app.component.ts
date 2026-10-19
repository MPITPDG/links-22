import { Component, OnInit, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from './shared/service/dataService';
import { Router,
    Event as RouterEvent,
    NavigationStart,
    NavigationEnd,
    NavigationCancel,
    NavigationError } from '@angular/router';
import { LoginService } from './shared/service/loginService';
import { LoaderService } from './shared/service/loader.service';
import { ThemeService } from './shared/theme/theme.service';

@Component({
    // tslint:disable-next-line
    selector: 'body',
    template: `
                <ui-toaster />
                <router-outlet></router-outlet>
                @if (showLoader) {
                  <div class="app-topbar-loading" aria-hidden="true"></div>
                }
                `,
    styleUrls: ['./spinner.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent implements OnInit,OnChanges {
	showLoader: boolean=false;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        public _loaderService: LoaderService,
        private _theme: ThemeService) {
            // Paint the saved theme before the first render (no grey flash).
            this._theme.init();
            this._router.routeReuseStrategy.shouldReuseRoute = function(){
                return false;
            };
            
           
            
    }
    ngOnInit() {
        this._loaderService.status.subscribe((val: boolean) => { 
            // Only as a fallback where no layout content area hosts the
            // non-blocking <app-content-loader> (login, popups, simple layout).
            setTimeout(() => this.showLoader = val && this._loaderService.contentHosts === 0, 0)
         });
        this._router.events.subscribe((event: RouterEvent) => {
            this.navigationInterceptor(event);
            if (event instanceof NavigationEnd) { this._theme.noteNavigation(event.urlAfterRedirects); this._theme.syncFromServer(); }
        });
    }

    ngOnChanges() {
        this._router.events.subscribe((event: RouterEvent) => {
            if (event instanceof NavigationEnd) {
                window.scrollTo(0, 0);
                
            }
        });

        
        
    }
 
    navigationInterceptor(event: RouterEvent): void {
        // Navigation start/end/cancel/error is now tracked inside LoaderService
        // itself (separately from display() counts), so it cannot stick on.
    }
}
