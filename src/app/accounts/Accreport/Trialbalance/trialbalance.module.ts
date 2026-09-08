import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrialBalanceRoutingModule } from './trialbalance-routing.module';
import { TrialBalanceDatewise } from './trialbal-datewise.component';
import { TrialBalanceGroupwise } from './trialbal-groupwise.component';
import { TrialBalanceComponent } from './trialbalance.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
@NgModule({
  declarations: [TrialBalanceComponent,TrialBalanceDatewise,TrialBalanceGroupwise],
  imports: [
    CommonModule,
    TrialBalanceRoutingModule,
    FormsModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class TrialBalanceModules { }
