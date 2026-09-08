import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportExportRoutingModule } from './report.routing';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import {  ExptRptEpCopySheet } from './ep-copy-coversheet-search.component';
import {  ExptRptEpCopyExl ,ExptDSRExl, ExptTonnage,Exptshipmentstatus,ExptRptCargoOnHand} from './exp-rpt.component';
import { ChrnologyReportComponent } from './chronology.component';
import { DeliveryStatusReportComponent } from './delivery-status.component';
import { ShipmentProgressReportComponent } from './shipment-progress.component';
import { AirCargoStatusReportComponent } from './air-cargo-status.component';
import { TrackingAirBookingReportComponent } from './tracking-air-booking.component';
import { TrackingAirShipmentReportComponent } from './tracking-air-shipment.component';
@NgModule({
    imports: [ReportExportRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        ModalModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [
        ExptRptEpCopySheet, ExptRptEpCopyExl, ExptDSRExl,
        ExptTonnage, Exptshipmentstatus, ExptRptCargoOnHand,
        ChrnologyReportComponent,
        DeliveryStatusReportComponent,
        ShipmentProgressReportComponent,
        AirCargoStatusReportComponent,
        TrackingAirBookingReportComponent,
        TrackingAirShipmentReportComponent
    ],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReportExportModule { }