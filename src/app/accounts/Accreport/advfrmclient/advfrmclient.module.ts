import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvanceFromClientRoutingModule } from './advfrmclient-routing.module';
import { AdvanceFromClient} from './advancefromclient.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
@NgModule({
  declarations: [AdvanceFromClient],
  imports: [
    CommonModule,
    AdvanceFromClientRoutingModule,
    FormsModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class AdvanceFromClientModules { }
