import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountStatementRoutingModule } from './accountstatement-routing.module';
import { ClientOutstandingAllCityComponent } from './clientoutstanding-allcity-search.component';
import { GenActStatementLocal } from './genact-localstmt.component';
import {ClientStatusFollowup} from './clntstatus-followup.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
@NgModule({
  declarations: [ClientOutstandingAllCityComponent,GenActStatementLocal,ClientStatusFollowup ],
  imports: [
    CommonModule,
    AccountStatementRoutingModule,
    FormsModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class AccountStatementModule { }
