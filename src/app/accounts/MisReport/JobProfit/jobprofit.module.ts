import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobProfitRoutingModule } from './jobprofit.routing';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { ClientJobprofitComponent } from './client_jobprofit.component';
import { AgentJobprofitComponent } from './agent_jobprofit.component';
import { NgxPaginationModule } from 'ngx-pagination';
import {ConsigneeJobprofitComponent} from './consignee_jobprofit.component'

@NgModule({
  declarations: [ ClientJobprofitComponent,AgentJobprofitComponent,ConsigneeJobprofitComponent],
  imports: [
    CommonModule,
    JobProfitRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule
  ]
})
export class JobProfitModule { }
