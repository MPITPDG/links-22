import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProformaInvoiceRoutingModule } from './proformainvoice.routing';
import { SharedModule } from '../../../shared/shared.module';
import { FilterPipeModule } from 'ngx-filter-pipe';
import { ProformaInvoiceComponent } from './proforma-invoice.component';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { ProformaInvoiceSearchComponent } from './proforma-invoice-search.component';
import { ProformaConvertComponent } from './proforma-convert.component';
import { OrderModule } from 'ngx-order-pipe';
import { NgxPaginationModule } from 'ngx-pagination';
/*  The Tax Invoice view is declared once in InvoiceViewModule and exported, so the
    proforma search can show the very same screen in its drawer.                  */
import { InvoiceViewModule } from '../invoice/invoice-view.module';
@NgModule({
    imports: [ProformaInvoiceRoutingModule,
        FormsModule,
        CommonModule, FilterPipeModule, Ng2SearchPipeModule, OrderModule, NgxPaginationModule,
        TabsModule,
        MyDatePickerModule,
        NgSelectModule,
        SharedModule,
        InvoiceViewModule],
    declarations: [
        ProformaInvoiceComponent,
        ProformaInvoiceSearchComponent,
        ProformaConvertComponent
    ],
    providers: [
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProformaInvoiceModule { }
