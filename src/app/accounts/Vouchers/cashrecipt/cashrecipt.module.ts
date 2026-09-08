import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CashreciptRoutingModule } from './cashrecipt-routing.module';
import { CashreciptIUComponent } from './cashrecipt-IU.component';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { FilterPipeModule } from 'ngx-filter-pipe';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import {BankReceiptModule} from '../BankRecpt/bankrecpt.module';
@NgModule({
  declarations: [CashreciptIUComponent],
  imports: [
    CommonModule,
    CashreciptRoutingModule,   FormsModule,
    CommonModule,FilterPipeModule,Ng2SearchPipeModule,
    TabsModule.forRoot(),
    MyDatePickerModule,
    NgSelectModule,
    SharedModule,BankReceiptModule
  ]
})
export class CashreciptModule { }
