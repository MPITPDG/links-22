import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AirlineImportRoutingModule } from './airline.routing';
import { SharedModule } from '../../../shared/shared.module';
import { AirlineMasterImportComponent } from './airline.component';
import { EntryAirlineMasterComponent } from './data-entry.component';
import { SearchAirlineMasterComponent } from './search.component';
@NgModule({
    imports: [AirlineImportRoutingModule,
        FormsModule,
        CommonModule,
        SharedModule],
    declarations: [
        AirlineMasterImportComponent,
        EntryAirlineMasterComponent,
        SearchAirlineMasterComponent
    ],
    providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AirlineMasterImportModule { }