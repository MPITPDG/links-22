import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select'; 
import { SharedModule } from '../../shared/shared.module';
import { UnAuthorisationRoutingModule} from './UnAuthorisation.routing';
import {invoiceUnAuth} from './Invoice-UnAuth.component';
import { OrderModule } from 'ngx-order-pipe'; 
import { FilterPipeModule } from 'ngx-filter-pipe';
import { NgxPaginationModule } from 'ngx-pagination';
import { ModalModule } from 'ngx-bootstrap'
import { AccountpipefilterPipe } from './unauth.pipe'

@NgModule({
    imports: [UnAuthorisationRoutingModule,ModalModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,OrderModule,FilterPipeModule,NgxPaginationModule,
        SharedModule],
    declarations: [invoiceUnAuth,AccountpipefilterPipe],
    providers: [
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class UnAuthorisationModule { }