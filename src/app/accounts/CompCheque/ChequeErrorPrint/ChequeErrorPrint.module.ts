import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChequeErrorPrintRoutingModule } from './ChequeErrorPrint-routing.module';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { ChequeErrorPrintComponent } from './ChequeError-NotGenerateBPNo.component';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
  declarations: [ ChequeErrorPrintComponent],
  imports: [
    CommonModule,
    ChequeErrorPrintRoutingModule, FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,NgxPaginationModule,
    NgSelectModule,
    SharedModule
  ]
})
export class ChequeErrorPrintModule { }
