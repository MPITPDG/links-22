import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {  ExptRptEpCopySheet } from './ep-copy-coversheet-search.component';
import {  ExptRptEpCopyExl ,ExptDSRExl, ExptTonnage,Exptshipmentstatus,ExptRptCargoOnHand} from './exp-rpt.component';
import { ChrnologyReportComponent } from './chronology.component';
import { DeliveryStatusReportComponent } from './delivery-status.component';
import { ShipmentProgressReportComponent } from './shipment-progress.component';
import { AirCargoStatusReportComponent } from './air-cargo-status.component';
import { TrackingAirBookingReportComponent } from './tracking-air-booking.component';
import { TrackingAirShipmentReportComponent } from './tracking-air-shipment.component';

const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Report'
        },
        children: [
            { path: 'epcopyprint', component: ExptRptEpCopySheet,  data: { title: 'epcopyprint' } },
            { path: 'ep-copy-excel', component: ExptRptEpCopyExl,  data: { title: 'Ep-Copy Excel' } },
            { path: 'dsr', component: ExptDSRExl,  data: { title: ' Dsr' } },
            { path: 'Tonnage', component: ExptTonnage,  data: { title: ' Tonnage' } },
            { path: 'shipment-status', component: Exptshipmentstatus,  data: { title: ' Shipment-Status' } },
            { path: 'chronology', component: ChrnologyReportComponent, data: { title: ' Chronology' } },
            { path: 'cargo-on-hand', component: ExptRptCargoOnHand,  data: { title: ' Cargo-OnHand' } },
            { path: 'delivery-status', component: DeliveryStatusReportComponent, data: { title: ' Delivery - Status' } },
            { path: 'shipment-progress', component: ShipmentProgressReportComponent, data: { title: 'Shipment Progress' } },
            { path: 'air-cargo-status', component: AirCargoStatusReportComponent, data: { title: 'Air Cargo Status' } },
            { path: 'tracking-air-booking', component: TrackingAirBookingReportComponent, data: { title: 'Tracking Air Booking' } },
            { path: 'tracking-air-shipment', component: TrackingAirShipmentReportComponent, data: { title: 'Tracking Air Shipment' } },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ReportExportRoutingModule { }