import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoicingDelayRoutingModule } from './invoicingdelay-routing.module';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { InvDelay } from './invdelay.component';

@NgModule({
  declarations: [ InvDelay],
  imports: [
    CommonModule,
    InvoicingDelayRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule
  ]
})
export class InvoicingDelayModule { }
