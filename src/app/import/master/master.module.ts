import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MasterImportRoutingModule } from './master.routing';

import { MasterImportComponent } from './master.component';
@NgModule({
    imports: [MasterImportRoutingModule],
    declarations: [
        MasterImportComponent
    ],
    providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MasterImportModule { }