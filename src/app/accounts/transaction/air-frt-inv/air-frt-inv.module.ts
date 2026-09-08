import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AirFrtInvRoutingModule } from './air-frt-inv-routing.module';
import { InvoiceprintComponent } from './invoiceprint.component';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { FilterPipeModule } from 'ngx-filter-pipe';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { InvoiceprintTabsComponent } from './invoiceprint-tabs.component';
import { InvoicehistoryComponent } from './invoicehistory.component';
@NgModule({
  declarations: [InvoiceprintComponent, InvoiceprintTabsComponent, InvoicehistoryComponent],
  imports: [
    CommonModule,
    AirFrtInvRoutingModule,
    FilterPipeModule,Ng2SearchPipeModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule,FormsModule
  ]
})
export class AirFrtInvModule { }
