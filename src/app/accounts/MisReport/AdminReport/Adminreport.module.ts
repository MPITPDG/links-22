import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminReportRoutingModule } from './Adminreport-routing.module';
import { AdminReportComponent } from './Adminreport.component';
import { FyDrCrDiffAuditComponent } from './fydrcrdiffaudit.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';

@NgModule({
  declarations: [AdminReportComponent, FyDrCrDiffAuditComponent],
  imports: [
    CommonModule,
    AdminReportRoutingModule,
    FormsModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class AccountAdminReportModule { }
