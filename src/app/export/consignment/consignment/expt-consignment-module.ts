import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SharedModule } from '../../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';

import {ExportConsignemntRoutingModule} from './expt-consignment-routing'
import { ConsgMainComponent } from './consg_main.component';
import { OrderBookingListComponent } from './order-booking-list.component';
import { ExportMasterSearchComponent } from './expt-master-search.component';
import { ConsgStartComponent } from './consg-start.component';
import { ExportMasterEditComponent } from './consig_main_edit.component';
import { MainCalCbmAddComponent } from './consg_main_calccbm.component';
import {
    ConsignmentEditModalComponent,
    ConsigneeViewPageComponent,
    ShipmentClearanceEditComponent,
    MainEditComponent,
    PortEditComponent,
    InvoiceEditComponent,
    OrderNoEditComponent,
    OrderNoQualityCheckingComponent,
    ITCCodeEditComponent,
    MarksNumberEditComponent,
    QuotaEditComponent,
    PackageEditComponent,
    DocumentEditComponent,
    ConsigneeRemarkEditComponent,
    ConsigneeViewComponent,
    MAWBEditComponent,
    HAWBEditComponent,
    JobEditComponent,
    CancelShipmentComponent
    
} from './consig_main_edit_modal.component';
import { ConsigneeMainViewComponent } from './cong-main-view.component';

import { EditActualFlightDateComponent } from './expt-master-edit-actual-flight-date';
import {CreateJobComponent} from './consign_create.component';
import {CreateAutoJobComponent} from './consign_create_new.component';
@NgModule({
    imports: [ExportConsignemntRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        ModalModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [ConsgMainComponent,OrderBookingListComponent,ExportMasterSearchComponent, 
            ExportMasterEditComponent,ConsigneeMainViewComponent,EditActualFlightDateComponent,ConsgStartComponent,
            ConsignmentEditModalComponent, ConsigneeViewPageComponent, ShipmentClearanceEditComponent,
            MainEditComponent,PortEditComponent,InvoiceEditComponent,OrderNoEditComponent,OrderNoQualityCheckingComponent,
            ITCCodeEditComponent, MarksNumberEditComponent,QuotaEditComponent,PackageEditComponent,DocumentEditComponent,
            ConsigneeRemarkEditComponent, ConsigneeViewComponent,MAWBEditComponent, HAWBEditComponent,JobEditComponent,
            CancelShipmentComponent,MainCalCbmAddComponent,CreateJobComponent,CreateAutoJobComponent],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExportConsignmentModule { }