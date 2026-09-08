import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChequeRoutingModule } from './Cheque-routing.module';
import { ChequeStockIUComponent } from './Cheque-Stock-IU.component';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { ChequeStockSearchComponent } from './Cheque-Stock-search.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { ChqstockFilterPipe } from './chqstock-filter.pipe';


 
import { OrderModule } from 'ngx-order-pipe'; 
import { FilterPipeModule } from 'ngx-filter-pipe';
 
@NgModule({
  declarations: [ChequeStockIUComponent, ChequeStockSearchComponent, ChqstockFilterPipe ],
  imports: [
    CommonModule,OrderModule,FilterPipeModule,
    ChequeRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule
  ]
})
export class ChequeModule { }
