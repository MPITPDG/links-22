import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';

import {BookingExportRoutingModule} from './booking-routing'
import{ AddBookingComponent} from './add.booking.component';
import {NewBookingComponent} from './new.booking.component'
import {Bookingauthorisation} from './booking_orderNo_authorisation_component';
@NgModule({
    imports: [BookingExportRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        ModalModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [AddBookingComponent,NewBookingComponent,Bookingauthorisation ],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BookingExportModule { }