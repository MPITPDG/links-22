import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';
import { ChartsModule } from 'ng2-charts';
import { SharedModule } from '../../../shared/shared.module';
import { FinanceDashboardRoutingModule } from './financedashboard.routing';
import { FinanceDashboardComponent } from './finance-dashboard.component';

@NgModule({
  declarations: [FinanceDashboardComponent],
  imports: [
    CommonModule,
    FinanceDashboardRoutingModule,
    FormsModule,
    TabsModule.forRoot(),
    MyDatePickerModule,
    NgxPaginationModule,
    NgSelectModule,
    /* ChartsModule is imported here on purpose: it is declared in app.module.ts but a
       lazy-loaded module does not inherit it, so baseChart would not resolve. */
    ChartsModule,
    SharedModule
  ]
})
export class FinanceDashboardModule { }
