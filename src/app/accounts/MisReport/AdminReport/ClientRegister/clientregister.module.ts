import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientRegisterRoutingModule } from './clientregister-routing.module';
import { ClientRegisterComponent} from './clntreg.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
@NgModule({
  declarations: [ClientRegisterComponent],
  imports: [
    CommonModule,
    ClientRegisterRoutingModule,
    FormsModule,
    MyDatePickerModule,
    NgSelectModule,
    SharedModule
  ]
})
export class ClientRegisterModule { }
