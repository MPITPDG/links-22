import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActMasterRoutingModule } from './actmaster.routing';
import { ActMasterComponent } from './actmaster.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';

@NgModule({
  declarations: [ActMasterComponent],
  imports: [
    CommonModule,
    ActMasterRoutingModule,
    FormsModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class ActMasterModule { }
