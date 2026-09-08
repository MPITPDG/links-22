import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { ExchangeRateImportRoutingModule } from './exchange-rate.routing';

import { ExchangeRateMasterImportComponent } from './exchange-rate.component';
import { EntryExchangeRateMasterComponent } from './data-entry.component';
import { SearchExchangeRateMasterComponent } from './search.component';
@NgModule({
    imports: [ExchangeRateImportRoutingModule,
        FormsModule,
        CommonModule,
        SharedModule,
        MyDatePickerModule,
        NgSelectModule],
    declarations: [
        ExchangeRateMasterImportComponent,
        EntryExchangeRateMasterComponent,
        SearchExchangeRateMasterComponent
    ],
    providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExchangeRateMasterImportModule { }