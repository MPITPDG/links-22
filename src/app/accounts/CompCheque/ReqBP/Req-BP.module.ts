import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReqBpRoutingModule } from './Req-BP-routing.module';

import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';

import { NgxPaginationModule } from 'ngx-pagination';
import { ReqBPFilterPipe } from '../Cheque/chqstock-filter.pipe';

import { ReqBPAuthListComponent } from './req-bp-auth-list.component';
import { OrderModule } from 'ngx-order-pipe'; 
import { FilterPipeModule } from 'ngx-filter-pipe';
import { ReqBankpaymentComponent } from './req-bankpayment.component';
@NgModule({
  declarations: [ ReqBPAuthListComponent,ReqBPFilterPipe, ReqBankpaymentComponent],
  imports: [
    CommonModule,OrderModule,FilterPipeModule,
    ReqBpRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule
  ]
})
export class ReqBpModule { }
