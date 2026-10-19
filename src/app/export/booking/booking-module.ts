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
import { BookingAuthorisationComponent } from './booking-authorisation.component';
import { BookingAuthorisationService } from './booking-authorisation.service';
@NgModule({
    imports: [BookingExportRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule,
        ModalModule,
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [AddBookingComponent,NewBookingComponent,BookingAuthorisationComponent ],
    providers: [BookingAuthorisationService],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BookingExportModule { }