import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActFinalizationRoutingModule } from './actfinalization-routing.module';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { ClientwiseIncomeComponent } from './clientwiseincome.component';
import { ClientSupplierActWiseList } from './clientsuppactwiseList.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { GenActStatementAllBranch } from './genactstmt.component';
import { ProfitandLossStmtComponent } from './profitandlossstmt.component';
import { BalSheetStmtComponent } from './balsheetstmt.component';
@NgModule({
  declarations: [ ClientwiseIncomeComponent,ClientSupplierActWiseList,GenActStatementAllBranch,ProfitandLossStmtComponent,BalSheetStmtComponent],
  imports: [
    CommonModule,
    ActFinalizationRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule
  ]
})
export class ActFinalizationModule { }
