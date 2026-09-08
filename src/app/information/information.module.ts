import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { InformationRoutingModule } from './information.routing';

import { InformationComponent } from './information.component';
import { IncotermDetailsImportComponent } from './import/incoterm-details-i.component';
@NgModule({
    imports: [InformationRoutingModule],
    declarations: [
        InformationComponent,
        IncotermDetailsImportComponent
    ],
    providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InformationModule { }