import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SundryExpensesRoutingModule } from './sundryexpenselateact-routing.module';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { SundryExpenses } from './sundryexpense.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { SundryExpensesjob } from './sundryexpjobno.component';

@NgModule({
  declarations: [SundryExpenses,SundryExpensesjob ],
  imports: [
    CommonModule,
    SundryExpensesRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule
  ]
})
export class SundryExpensesModule { }
