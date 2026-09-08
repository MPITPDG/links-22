import { NgModule,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportRoutingModule } from './report-routing.module';
import { AccountReportComponent } from './report.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
import {ReportDownload} from './report-download.component';

@NgModule({
 
  imports: [
    CommonModule,
    ReportRoutingModule,
    FormsModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule,
  ],
  declarations: [
    AccountReportComponent,ReportDownload
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AccountReportModules { }
