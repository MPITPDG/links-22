import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import {NgSelectModule} from '@ng-select/ng-select';
import { SharedModule } from '../../shared/shared.module';
import { AirImportRoutingModule } from './air.routing';

import { AirImportComponent } from './air.component';
import { EntryAirImportComponent } from './entry-air.component';
import { AirSearchComponent } from './search.component';
import { AirDocketPrintSearchComponent } from './docket-print-search.component';
@NgModule({
    imports: [AirImportRoutingModule,
        FormsModule,
        CommonModule,
        SharedModule, 
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule],
    declarations: [
        AirImportComponent,
        EntryAirImportComponent,
        AirSearchComponent,
        AirDocketPrintSearchComponent
    ],
    providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AirImportModule { }