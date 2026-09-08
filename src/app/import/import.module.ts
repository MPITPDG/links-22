import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ImportRoutingModule } from './import.routing';

import { ImportComponent } from './import.component';
@NgModule({
    imports: [ImportRoutingModule],
    declarations: [
        ImportComponent
    ],
    providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ImportModule { }