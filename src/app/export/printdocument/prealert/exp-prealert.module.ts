import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SharedModule } from '../../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';

import {ExportPrealertRoutingModule } from './exp-prealert.routing'; 
import { PreAlertComponent,
    PreAlertPrepareComponent,
    PreAlertAutoComponent,
    PreAlertPrepareSendingThroughComponent
} from './prealert.component';
import { SendPrealertComponent } from './send-prealert.component';
@NgModule({
    imports: [ExportPrealertRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule,
        ModalModule,
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [PreAlertComponent,  PreAlertPrepareComponent, PreAlertAutoComponent, PreAlertPrepareSendingThroughComponent, SendPrealertComponent],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExportPrealertModule { }