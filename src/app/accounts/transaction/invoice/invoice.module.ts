import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { InvoiceRoutingModule } from './invoice.routing';
import { SharedModule } from '../../../shared/shared.module';
import { FilterPipeModule } from 'ngx-filter-pipe';
import { InvoiceComponent } from './general-invoice.component';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { GeneralInvoiceSearchComponent } from './general-invoice-search.component';
import { ProformaInvoicePrintList } from './proforma-invoice-list.component';
import { OrderModule } from 'ngx-order-pipe'; 
import { NgxPaginationModule } from 'ngx-pagination';
import{ProformaInvfilterpipe} from './proformainvfilterpipe.pipe';
//import { GeneralComponent } from './general/general.component';
@NgModule({
    imports: [InvoiceRoutingModule,
        FormsModule,
        CommonModule,FilterPipeModule,Ng2SearchPipeModule,OrderModule,NgxPaginationModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [
        InvoiceComponent,
        GeneralInvoiceSearchComponent,
        ProformaInvoicePrintList,
        ProformaInvfilterpipe
        //GeneralComponent
    ],
    providers: [
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InvoiceModule { }