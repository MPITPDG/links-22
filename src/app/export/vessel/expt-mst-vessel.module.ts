import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';

import {ExportmstvesselRoutingModule } from './expt-mst-vessel.routing'; 
import { VesselMstComponent } from './exp_mst_vessel_iu.component';
import { VesselSearchComponent } from './exp_mst_vessel_search.component';

@NgModule({
    imports: [ExportmstvesselRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        ModalModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [VesselMstComponent,  VesselSearchComponent ],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExportmstvesselModule { }