import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { MyDatePicker } from './mydatepicker.component';

@NgModule({
    declarations: [MyDatePicker],
    imports: [CommonModule, FormsModule, BsDatepickerModule],
    exports: [MyDatePicker]
})
export class MyDatePickerModule { }
