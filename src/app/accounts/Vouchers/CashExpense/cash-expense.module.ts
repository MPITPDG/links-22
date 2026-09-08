import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashExpenseRoutingModule } from './cash-expense-routing.module';
import { CashexpenseComponent } from './cashexpense.component';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import {SharedModule} from '../../../shared/shared.module';
import { GenCashReceiptComponent } from './Gen-Cash-Receipt.component';
import { StatementComponent } from './statement.component';

@NgModule({
  declarations: [CashexpenseComponent,GenCashReceiptComponent, StatementComponent],
  imports: [
    CommonModule,
    CashExpenseRoutingModule, FormsModule,
    CommonModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class CashExpenseModule { }
