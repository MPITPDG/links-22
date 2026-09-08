import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MisReportRoutingModule } from './Misreport-routing.module';
import { MisReportComponent } from './Misreport.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';

@NgModule({
  declarations: [MisReportComponent],
  imports: [
    CommonModule,
    MisReportRoutingModule,
    FormsModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class AccountMisReportModule { }
