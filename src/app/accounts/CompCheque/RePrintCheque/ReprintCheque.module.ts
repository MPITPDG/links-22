import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RePrintChequeRoutingModule } from './ReprintCheque-routing.module';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { ReprintChequeCancelChequeNoComponent } from './ReprintCheque-Cancel-ChequeNo.component';
import { RePrintChequeAssignChequeNoComponent } from './ReprintCheque-Assign-ChequeNo.component';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
  declarations: [ ReprintChequeCancelChequeNoComponent,RePrintChequeAssignChequeNoComponent],
  imports: [
    CommonModule,
    RePrintChequeRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule
  ]
})
export class RePrintChequeModule { }
