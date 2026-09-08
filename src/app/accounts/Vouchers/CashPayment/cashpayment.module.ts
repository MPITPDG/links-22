import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashPaymentRoutingModule } from './cashpayment.routing';
import { CashPaymentComponent } from './cashpayment-IU.component';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import {SharedModule} from '../../../shared/shared.module';


@NgModule({
  declarations: [CashPaymentComponent],
  imports: [
    CommonModule,
    CashPaymentRoutingModule, FormsModule,
    CommonModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class CashPaymentModule { }
