import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AirFreightRoutingModule } from './airfreight-routing.module';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { AIRFREIGHT } from './invpurchase.component';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
  declarations: [ AIRFREIGHT],
  imports: [
    CommonModule,
    AirFreightRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule
  ]
})
export class AirFreightModule { }
