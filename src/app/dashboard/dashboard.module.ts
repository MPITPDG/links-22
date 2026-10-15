import { NgModule } from '@angular/core';
import { NgChartsModule } from 'ng2-charts';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    DashboardRoutingModule,
    NgChartsModule,
    BsDropdownModule,
    SharedModule
  ],
  declarations: [ DashboardComponent ]
})
export class DashboardModule { }
