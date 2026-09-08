import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DefaultMasterImportRoutingModule } from './default-master.routing';

import { MasterImportComponent } from './default-master.component';
@NgModule({
    imports: [DefaultMasterImportRoutingModule],
    declarations: [
        MasterImportComponent
    ],
    providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DefaultMasterImportModule { }