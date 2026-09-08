import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CompChequeRoutingModule } from './CompCheque-routing.module';
import { CompChequeComponent } from './CompCheque.component';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../shared/shared.module';
@NgModule({
  declarations: [CompChequeComponent],
  imports: [
    CommonModule,
    CompChequeRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class CompChequeModule { }
