import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PrintChequeRoutingModule } from './print-cheque-routing.module';

import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';

import { NgxPaginationModule } from 'ngx-pagination';
//import { ReqBPFilterPipe } from '../Cheque/chqstock-filter.pipe';


import { OrderModule } from 'ngx-order-pipe'; 
import { FilterPipeModule } from 'ngx-filter-pipe';
import { PrintChequeComponent } from './print-cheque.component';
import { ChequeReviewComponent } from './cheque-review.component';
import { ChequePreviewComponent } from './cheque-preview.component';
@NgModule({
  declarations: [ PrintChequeComponent, ChequeReviewComponent,ChequePreviewComponent],
  imports: [
    CommonModule,OrderModule,FilterPipeModule,
    PrintChequeRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule
  ]
})
export class printchequeModule { }
