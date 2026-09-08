import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotOverRoutingModules } from './notover-routing.module';
import { NotOverReport} from './cashbooknotover-list.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';

@NgModule({
  declarations: [NotOverReport],
  imports: [
    CommonModule,
    NotOverRoutingModules,
    FormsModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class NotOverModule { }
