import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ImportInfoRoutingModule } from './import-i.routing';

import { ImportInfoComponent } from './import-i.component';
import { IncotermImportComponent } from './incoterm-i.component';
@NgModule({
    imports: [ImportInfoRoutingModule],
    declarations: [
        ImportInfoComponent,
        IncotermImportComponent
    ],
    providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ImportInfoModule { }