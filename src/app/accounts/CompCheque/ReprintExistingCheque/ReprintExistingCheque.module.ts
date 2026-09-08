import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReprintExistingChequeRoutingModule } from './ReprintExistingCheque-routing.module';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { RePrintexistChequeComponent } from './RePrintexistCheque.component';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
  declarations: [ RePrintexistChequeComponent],
  imports: [
    CommonModule,
    ReprintExistingChequeRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule
  ]
})
export class ReprintExistingChequeModule { }
