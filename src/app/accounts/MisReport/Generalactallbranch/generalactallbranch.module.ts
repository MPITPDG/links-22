import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { GeneralActAllBranchRoutingModule } from './generalactallbranch-routing.module';
import { GenActStatementAllBranch } from './genactstmt.component';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
  declarations: [ GenActStatementAllBranch],
  imports: [
    CommonModule,
    GeneralActAllBranchRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule
  ]
})
export class GeneralActAllBranchModule { }
