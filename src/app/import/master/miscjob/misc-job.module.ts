import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { MiscJobImportRoutingModule } from './misc-job.routing';

import { MiscJobMasterImportComponent } from './misc-job.component';
import { EntryMiscJobMasterComponent } from './data-entry.component';
import { SearchMiscJobMasterComponent } from './search.component';
@NgModule({
    imports: [MiscJobImportRoutingModule,
        FormsModule,
        CommonModule,
        SharedModule],
    declarations: [
        MiscJobMasterImportComponent,
        EntryMiscJobMasterComponent,
        SearchMiscJobMasterComponent
    ],
    providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MiscJobMasterImportModule { }