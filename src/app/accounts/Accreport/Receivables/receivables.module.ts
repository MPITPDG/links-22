import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReceivablesRoutingModule } from './receivables-routing.module';
import { ReceivableAnyOneClientAllBranch } from './rcbl-anyoneClnt-allbrnch.component';
import { ReceivableAnyOneClientAgeing } from './rcbl-anyoneClnt-ageing.component';
import { OutstandingOverseasClient } from './rcbl-overseasagent.component';
import { ReceivablesComponent } from './receivables.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
@NgModule({
  declarations: [ReceivableAnyOneClientAllBranch,ReceivableAnyOneClientAgeing,ReceivablesComponent,OutstandingOverseasClient],
  imports: [
    CommonModule,
    ReceivablesRoutingModule,
    FormsModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class ReceivablesModule { }
