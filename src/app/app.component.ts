import { Component, OnInit, OnChanges } from '@angular/core';
import { DataService } from './shared/service/dataService';
import { Router,
    Event as RouterEvent,
    NavigationStart,
    NavigationEnd,
    NavigationCancel,
    NavigationError } from '@angular/router';
import { LoginService } from './shared/service/loginService';
import { ToasterConfig } from 'angular2-toaster';
import { LoaderService } from './shared/service/loader.service';

@Component({
    // tslint:disable-next-line
    selector: 'body',
    template: ` 
                <toaster-container [toasterconfig]="config1"></toaster-container>
                <router-outlet></router-outlet>
				<div *ngIf="showLoader==true" class="loading" > </div>
            `,
	styleUrls: ['./spinner.scss']
})
export class AppComponent implements OnInit,OnChanges {
	showLoader: boolean=false;

    public config1: ToasterConfig = new ToasterConfig({
        positionClass: 'toast-bottom-right',
        tapToDismiss: true,
        timeout: 5000
    });

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService) {
            this._router.routeReuseStrategy.shouldReuseRoute = function(){
                return false;
            };
            
           
            
    }
    ngOnInit() {
        this._loaderService.status.subscribe((val: boolean) => { 
            setTimeout(() => this.showLoader = val, 0)
         });
        this._router.events.subscribe((event: RouterEvent) => {
            this.navigationInterceptor(event);
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
        if (event instanceof NavigationStart) {
            this._loaderService.display(true);
        }
        if (event instanceof NavigationEnd) {
            this._loaderService.display(false);
        }
        if (event instanceof NavigationCancel) {
            this._loaderService.display(false);
        }
        if (event instanceof NavigationError) {
            this._loaderService.display(false);
        }
    }
}
