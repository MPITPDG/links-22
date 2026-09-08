import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpecialReportRoutingModule } from './specialreport-routing.module';
import { SpecialLedger} from './specialledger.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
@NgModule({
  declarations: [SpecialLedger],
  imports: [
    CommonModule,
    SpecialReportRoutingModule,
    FormsModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class SpecialReportModule { }
