import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChequeReportRoutingModule } from './ChequeReport-routing.module';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { ChequeReportSearchComponent } from './PrintCheque-Chequereport-search.component';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
  declarations: [ ChequeReportSearchComponent],
  imports: [
    CommonModule,
    ChequeReportRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule
  ]
})
export class ChequeReportModule { }
