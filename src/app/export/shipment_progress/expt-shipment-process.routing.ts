import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
 
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
    dimensionShipmentProgressComponent
} from './sp.component';
import { CartingSea } from './carting-sea.sp.component';
import { TransfervslCartingSea } from './carting-transfer-vessel.sp.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'shipment-process'
        },
        children: [
            { path: 'ship-bill-search', component: CommonSearchShipmentProgressComponent, data: { title: 'Shipment-Progress / Search' } },
            { path: 'receipt-cargo-with-job-no-search', component: CommonSearchShipmentProgressComponent, data: { title: 'Shipment-Progress / Search' } },
            { path: 'dimension-search', component: CommonSearchShipmentProgressComponent, data: { title: 'Shipment-Progress / Search' } },
            { path: 'approval-received-search', component: CommonSearchShipmentProgressComponent, data: { title: 'Shipment-Progress / Search' } },
            { path: 'carting-sea-search', component: CommonSearchShipmentProgressComponent, data: { title: 'Shipment-Progress / Search' } },
            { path: 'carting-air-search', component: CommonSearchShipmentProgressComponent, data: { title: 'Shipment-Progress / Search' } },
            { path: 'destination-document-search', component: CommonSearchShipmentProgressComponent, data: { title: 'Shipment-Progress / Search' } },
            { path: 'measurement-search', component: CommonSearchShipmentProgressComponent, data: { title: 'Shipment-Progress / Search' } },
            { path: 'out-of-charge-search', component: CommonSearchShipmentProgressComponent, data: { title: 'Shipment-Progress / Search' } },
            { path: 'prealert-sent-on-search', component: CommonSearchShipmentProgressComponent, data: { title: 'Shipment-Progress / Search' } },
            { path: 'bl-details-search', component: CommonSearchShipmentProgressComponent, data: { title: 'Shipment-Progress / Search' } },
            { path: 'bhel-details-search', component: CommonSearchShipmentProgressComponent, data: { title: 'Shipment-Progress / Search' } },
            { path: 'transfer-sea-to-air-search', component: CommonSearchShipmentProgressComponent, data: { title: 'Shipment-Progress / Search' } },
            { path: 'ship-bill/:exptno', component: ShippingBillShipmentProgressComponent, data: { title: 'Shipment-Progress / Shipping Bill Update' } },
            { path: 'reciept-of-cargo/:exptno', component: ReceiptCargoShipmentProgressComponent, data: { title: 'Shipment-Progress / Receipt Cargo Update' } },
            { path: 'approval-received/:exptno', component: ApprovalReceivedShipmentProgressComponent, data: { title: 'Shipment-Progress / Approval Received Update' } },
            { path: 'measurement/:exptno', component: MeasurementShipmentProgressComponent, data: { title: 'Shipment-Progress / Approval Received Update' } },
            { path: 'out-of-charge/:exptno', component: OutOfChargeShipmentProgressComponent, data: { title: 'Shipment-Progress / Out of Charge Update' } },
            { path: 'bl-details/:exptno', component: BlDetailsShipmentProgressComponent, data: { title: 'Shipment-Progress / BL Details Update' } },
            { path: 'carting-air/:exptno', component: CartingAirShipmentProgressComponent, data: { title: 'Shipment-Progress / Carting Air Update' } },
            { path: 'prealert-sent-on/:exptno', component: PrealertSentOnShipmentProgressComponent, data: { title: 'Shipment-Progress / Prealert Sent On Update' } },
            { path: 'destination-document/:exptno', component: DestinationDocumentShipmentProgressComponent, data: { title: 'Shipment-Progress / Destination Document' } },
            { path: 'transfer-sea-to-air/:exptno', component: SeaToAirShipmentProgressComponent, data: { title: 'Shipment-Progress / Transfer Sea To Air' } },
            { path: 'reciept-cargo-provision', component: ReceiptCargoProvisionShipmentProgressComponent, data: { title: 'Shipment-Progress / Receipt Cargo' } },
            { path: 'scan-doc-sent', component: ScanDocSentShipmentProgressComponent, data: { title: 'Shipment-Progress / Scan Docs Sent Date' } },
            { path: 'pending-shipment', component: PendingShipmentShipmentProgressComponent, data: { title: 'Shipment-Progress / Pending Shipment' } },
            { path: 'container-loading-confirmation', component: ContainerLoadingShipmentProgressComponent, data: { title: 'Shipment-Progress / Container Loading Confirmation' } },
            { path: 'carting-sea', component: CartingSea, data: { title: 'shipment-progress/carting-sea' } },
            { path: 'vesselTransfer', component: TransfervslCartingSea, data: { title: 'shipment-progress/vesselTransfer' } },
            { path: 'Prepaid-freight-apprvd-search', component: CommonSearchShipmentProgressComponent, data: { title: 'Shipment-Progress / Search' } },
            { path: 'Prepaid-freight-apprvd/:exptno', component: PrepaidfrtApprovShipmentProgressComponent, data: { title: 'Shipment-Progress / Prepaid Approved by Shipper' } },
            { path: 'Dimension/:exptno', component: dimensionShipmentProgressComponent, data: { title: 'Shipment-Progress / Calculate CBM' } },
          
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportshipmentprocessRoutingModule { }