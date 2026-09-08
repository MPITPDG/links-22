import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../shared/shared.module';
import { SeaImportRoutingModule } from './sea.routing';

import { SeaImportComponent } from './sea.component';
import { EntrySeaImportComponent } from './entry-sea.component';
import { SeaSearchComponent } from './search.component';
import { SeaDocketPrintSearchComponent } from './docket-print-search.component';
@NgModule({
    imports: [SeaImportRoutingModule,
        FormsModule,
        CommonModule,
        SharedModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule],
    declarations: [
        SeaImportComponent,
        EntrySeaImportComponent,
        SeaSearchComponent,
        SeaDocketPrintSearchComponent
    ],
    providers: [
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SeaImportModule { }