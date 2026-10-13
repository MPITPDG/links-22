import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import {MawbStockRoutingModule } from './mawb-stk-routing';
import { MawbStockMasterComponent } from './stockmaster.component';
import { MawbStockSearchComponent } from './stockmaster-search.component';


@NgModule({
    imports: [MawbStockRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule,
        ModalModule,
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [MawbStockMasterComponent, MawbStockSearchComponent],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MawbStockModule { }