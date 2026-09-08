import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientOutstandingRoutingModule } from './clientoutstandingageing-routing.module';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { ClientOutstanding } from './clntoutstanding.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { Clntoutageingfilterpipe } from './clntoutageingfilterpipe.pipe';
import { FilterPipeModule } from 'ngx-filter-pipe';
@NgModule({
  declarations: [ ClientOutstanding,Clntoutageingfilterpipe],
  imports: [
    CommonModule,
    ClientOutstandingRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule,FilterPipeModule
  ]
})
export class ClientOutstandingModule { }
