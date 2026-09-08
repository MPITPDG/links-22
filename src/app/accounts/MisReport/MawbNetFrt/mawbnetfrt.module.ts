import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAWBFRTRoutingModule } from './mawbnetfrt-routing.module';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { MAWBFRT } from './netfrt.component';


@NgModule({
  declarations: [ MAWBFRT],
  imports: [
    CommonModule,
    MAWBFRTRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule
  ]
})
export class MAWBFRTModule { }
