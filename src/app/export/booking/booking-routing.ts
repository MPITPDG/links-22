import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import{ AddBookingComponent} from './add.booking.component';
import {NewBookingComponent} from './new.booking.component'
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Booking'
        },
        children: [
            { path: 'add', component: AddBookingComponent, data: { title: 'Booking / Add' } },
            { path: 'new-order-booking', component: NewBookingComponent, data: { title: 'Booking / Order / New' } },
            { path: 'new-order-booking/:edi_id/:order_no/:sr_mode', component: NewBookingComponent, data: { title: 'Booking / Order / New' } },
             
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BookingExportRoutingModule { }