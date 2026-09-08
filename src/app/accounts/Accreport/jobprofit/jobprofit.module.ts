import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JobprofitRoutingModule } from './jobprofit-routing.module';
import { JobprofitComponent } from './jobprofit.component';
import { JobprofitreportComponent } from './jobprofitreport.component';
import { MawbContJobprofitComponent } from './mawb-cont-jobprofit.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
@NgModule({
  declarations: [JobprofitComponent, JobprofitreportComponent, MawbContJobprofitComponent],
  imports: [
    CommonModule,
    JobprofitRoutingModule,
    FormsModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class JobprofitModules { }
