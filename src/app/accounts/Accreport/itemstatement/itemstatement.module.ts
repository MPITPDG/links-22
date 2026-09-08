import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemStatementRoutingModule } from './itemstatement-routing.module';
import { ItemwiseStatement } from './item-search.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
import { ItemAccountStatement } from './itemaccount-search.component';
import { ItemStatement } from './item-stmt.component';
@NgModule({
  declarations: [ItemwiseStatement,ItemAccountStatement,ItemStatement],
  imports: [
    CommonModule,
    ItemStatementRoutingModule,
    FormsModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class ItemStatementModules { }
