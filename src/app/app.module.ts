import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { ModalModule } from 'ngx-bootstrap/modal';
import { NAV_DROPDOWN_DIRECTIVES } from './shared/nav-dropdown.directive';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UiToaster } from './shared/ui/toaster';
import { UiButton } from './shared/ui/button';

import { NgChartsModule } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { SIDEBAR_TOGGLE_DIRECTIVES } from './shared/sidebar.directive';
import { AsideToggleDirective } from './shared/aside.directive';
import { BreadcrumbsComponent } from './shared/breadcrumb.component';
import { ContentLoaderComponent } from './shared/content-loader.component';

// Routing Module
import { AppRoutingModule } from './app.routing';
// Shared Module
import { SharedModule } from './shared/shared.module';
import { Configuration } from './app.constants';
//import { Static } from './app.common';
// Layouts
import { FullLayoutComponent } from './layouts/full-layout.component';
import { SimpleLayoutComponent } from './layouts/simple-layout.component';
import { HeaderFooterLayoutComponent } from './layouts/header-footer-layout.component';

import { MenuComponent } from './shared/menu/menu.component';
import { FinancialYearComponent } from './shared/financial-year/financial-year.component';
import { NotificationBellComponent } from './shared/notification-bell/notification-bell.component';

import { ToastCommonService } from './shared/service/toastService';
import { NotificationCenterService } from './shared/service/notificationCenterService';

// Popover Component
import { PopoverModule } from 'ngx-bootstrap/popover';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { MyDatePickerModule } from 'mydatepicker';

import {ErrorDataSerice} from './error/error-share-data.service';
import { PageLoadModalComponent } from './shared/common-modal.directive';
import { LoaderService } from './shared/service/loader.service';
import {ButtonService} from './shared/common-font-changer.directive';
import {NgxPaginationModule} from 'ngx-pagination';
import {NgSelectModule } from '@ng-select/ng-select';
//import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        // Spartan/sonner toaster drawn once at the app root (<ui-toaster /> in
        // app.component); replaces angular2-toaster's ToasterModule.forRoot().
        UiToaster,
        UiButton,
        ContentLoaderComponent,
        // Standalone since the route-driven ui-breadcrumbs port (MP 21b4428).
        BreadcrumbsComponent,
        BsDropdownModule,
        TabsModule,
        ModalModule,
        PopoverModule,
        TooltipModule,
        NgChartsModule,
        SharedModule,
        FormsModule,
        MyDatePickerModule,
        NgxPaginationModule,NgSelectModule
        //ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
    ],
    declarations: [
        AppComponent,
        FullLayoutComponent,
        SimpleLayoutComponent,
        HeaderFooterLayoutComponent,
        NAV_DROPDOWN_DIRECTIVES,
        SIDEBAR_TOGGLE_DIRECTIVES,
        AsideToggleDirective,
        MenuComponent,
        PageLoadModalComponent,FinancialYearComponent,
        NotificationBellComponent,
    ],
    providers: [Configuration, NotificationCenterService, ToastCommonService, ErrorDataSerice,  {
        provide: LocationStrategy,
        useClass: HashLocationStrategy
    }, LoaderService, ButtonService, provideHttpClient(withXhr(), withInterceptorsFromDi())],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    bootstrap: [AppComponent]
})
export class AppModule { }
