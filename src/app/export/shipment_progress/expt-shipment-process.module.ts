import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';

import {ExportshipmentprocessRoutingModule } from './expt-shipment-process.routing'; 
import {
    ShipmentProgressComponent,
    CommonSearchShipmentProgressComponent,
    ShippingBillShipmentProgressComponent,
    ReceiptCargoShipmentProgressComponent,
    ApprovalReceivedShipmentProgressComponent,
    MeasurementShipmentProgressComponent,
    OutOfChargeShipmentProgressComponent,
    BlDetailsShipmentProgressComponent,
    CartingAirShipmentProgressComponent,
    PrealertSentOnShipmentProgressComponent,
    DestinationDocumentShipmentProgressComponent,
    SeaToAirShipmentProgressComponent,
    ReceiptCargoProvisionShipmentProgressComponent,
    ScanDocSentShipmentProgressComponent,
    PendingShipmentShipmentProgressComponent,
    ContainerLoadingShipmentProgressComponent,
    PrepaidfrtApprovShipmentProgressComponent,
    dimensionShipmentProgressComponent,PendingShipReportShipmentProgressComponent,
    UpdateContainerLoadingShipmentProgressComponent,
    ReportContainerLoadingShipmentProgressComponent,
    CommonViewShipmentProgressComponent,
    ViewContainerLoadingShipmentProgressComponent
} from './sp.component';
import { CartingSea,
         SearchCartingSea,
         ListCartingSea,
         manageCartingSea } from './carting-sea.sp.component';
import { TransfervslCartingSea } from './carting-transfer-vessel.sp.component';
import {ButtonService,FontChangerComponent} from './../../shared/common-font-changer.directive' 
@NgModule({
    imports: [ExportshipmentprocessRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        ModalModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [ShipmentProgressComponent,    CommonSearchShipmentProgressComponent,   ShippingBillShipmentProgressComponent,
        ReceiptCargoShipmentProgressComponent,   ApprovalReceivedShipmentProgressComponent,   MeasurementShipmentProgressComponent,
        OutOfChargeShipmentProgressComponent,  BlDetailsShipmentProgressComponent,  CartingAirShipmentProgressComponent,
        PrealertSentOnShipmentProgressComponent, DestinationDocumentShipmentProgressComponent,  SeaToAirShipmentProgressComponent,
        ReceiptCargoProvisionShipmentProgressComponent,  ScanDocSentShipmentProgressComponent,   PendingShipmentShipmentProgressComponent,
        ContainerLoadingShipmentProgressComponent, PrepaidfrtApprovShipmentProgressComponent,  dimensionShipmentProgressComponent ,
         SearchCartingSea,CartingSea,TransfervslCartingSea,ListCartingSea,manageCartingSea ,PendingShipReportShipmentProgressComponent ,
         UpdateContainerLoadingShipmentProgressComponent,ReportContainerLoadingShipmentProgressComponent,
         CommonViewShipmentProgressComponent,ViewContainerLoadingShipmentProgressComponent,FontChangerComponent],
    providers: [ButtonService],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExportshipmentprocessModule { }