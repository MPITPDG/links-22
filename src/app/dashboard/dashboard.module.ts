import { NgModule } from '@angular/core';
import { NgChartsModule } from 'ng2-charts';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';

@NgModule({
  imports: [
    DashboardRoutingModule,
    NgChartsModule,
    BsDropdownModule
  ],
  declarations: [ DashboardComponent ]
})
export class DashboardModule { }
