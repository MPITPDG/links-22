import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { JobHandlerRoutingModule } from './jobhandler-routing.module';
import { JobHandlerRegisterComponent } from './jobhandler-register.component';

@NgModule({
    declarations: [JobHandlerRegisterComponent],
    imports: [
        CommonModule,
        FormsModule,
        MyDatePickerModule,
        NgSelectModule,
        SharedModule,
        JobHandlerRoutingModule
    ]
})
export class JobHandlerModule { }
