import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select'; 
import { SharedModule } from '../../shared/shared.module';
import { AuthorisationRoutingModule} from './Authorisation.routing';
import {invoiceAuth} from './Invoice-Auth.component';
import { OrderModule } from 'ngx-order-pipe'; 
import { FilterPipeModule } from 'ngx-filter-pipe';
import { NgxPaginationModule } from 'ngx-pagination';
import { ModalModule } from 'ngx-bootstrap';
import { CNAuth } from './CN-Auth.component';
import { AuthfilterpipePipe } from './authfilterpipe.pipe';

@NgModule({
    imports: [AuthorisationRoutingModule,ModalModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,OrderModule,FilterPipeModule,NgxPaginationModule,
        SharedModule],
    declarations: [invoiceAuth,CNAuth, AuthfilterpipePipe
    ],
    providers: [
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AuthorisationModule { }