import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
import { SharedModule } from '../../../shared/shared.module';
import { VesselImportRoutingModule } from './vessel.routing';

import { VesselMasterImportComponent } from './vessel.component';
import { EntryVesselMasterComponent } from './data-entry.component';
import { SearchVesselMasterComponent } from './search.component';
@NgModule({
    imports: [VesselImportRoutingModule,
        FormsModule,
        CommonModule,
        SharedModule,
        MyDatePickerModule],
    declarations: [
        VesselMasterImportComponent,
        EntryVesselMasterComponent,
        SearchVesselMasterComponent
    ],
    providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VesselMasterImportModule { }