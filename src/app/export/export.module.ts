import { NgModule, CUSTOM_ELEMENTS_SCHEMA,NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportRoutingModule } from './export-routing.module';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SharedModule } from '../shared/shared.module';
import { ExportComponent } from './export.component';
import {
    VesselSharedDataSerice,
    FcrSharedDataService,
    VesselSearchSharedDataService,
    ContainerIUSharedDataService,
    cartingVslAgnt,prealertshareservice
} from './export-share-data.service';
import { SharedDataSerice } from './export-share-data.service';
import { NgSelectModule } from '@ng-select/ng-select';
import {
    CommonModalComponent,
    DeleteModalComponent,
    OkModalComponent,
    RedirectPage,
    ConfirmModalComponent
} from '../shared/common-modal.directive';
import { mblsharedservice } from './export-share-data.service';
import { AccordionModule } from 'ngx-bootstrap';
@NgModule({ 
    imports: [ExportRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        ModalModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule,
        AccordionModule.forRoot(),],
    declarations: [
        ExportComponent,
       
        DeleteModalComponent,
        CommonModalComponent,
        OkModalComponent,
        ConfirmModalComponent,
         
    ],
    providers: [
        SharedDataSerice,
        RedirectPage,
        VesselSharedDataSerice,
        FcrSharedDataService,
        VesselSearchSharedDataService,
        ContainerIUSharedDataService,
        cartingVslAgnt,
        mblsharedservice,
        prealertshareservice 
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA,NO_ERRORS_SCHEMA],
    
})
export class ExportModule { }
