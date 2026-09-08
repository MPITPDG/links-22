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
import { ToasterModule } from 'angular2-toaster';

import { NgChartsModule } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { SIDEBAR_TOGGLE_DIRECTIVES } from './shared/sidebar.directive';
import { AsideToggleDirective } from './shared/aside.directive';
import { BreadcrumbsComponent } from './shared/breadcrumb.component';

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
import { FullLayoutComponent_acc } from './layouts/full-layout.component_acct';

import { MenuComponent } from './shared/menu/menu.component';
import { FinancialYearComponent } from './shared/financial-year/financial-year.component';

import { ToastCommonService } from './shared/service/toastService';

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
        ToasterModule.forRoot(),
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
        FullLayoutComponent_acc,
        SimpleLayoutComponent,
        HeaderFooterLayoutComponent,
        NAV_DROPDOWN_DIRECTIVES,
        BreadcrumbsComponent,
        SIDEBAR_TOGGLE_DIRECTIVES,
        AsideToggleDirective,
        MenuComponent,
        PageLoadModalComponent,FinancialYearComponent,
    ],
    providers: [Configuration, ToastCommonService, ErrorDataSerice,  {
        provide: LocationStrategy,
        useClass: HashLocationStrategy
    }, LoaderService, ButtonService, provideHttpClient(withXhr(), withInterceptorsFromDi())],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    bootstrap: [AppComponent]
})
export class AppModule { }
