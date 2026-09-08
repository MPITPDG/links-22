import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SharedModule } from '../../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';

import {ExportprintodcairRoutingModule } from './printdoc-air.routing';

import {
    PrintDocumentMawbComponent,
    PrintDocumentMawbListComponent,PrintDocumentMawbUpdateComponents,PrintDocumentMawbSearchComponent} from './mawb.component';
import { PrintDocumentMawbUpdateComponent } from "./PrintDocumentMawbUpdateComponent";
import {
    PrintDocumentHawbComponent,
    PrintDocumentHawbUpdateComponent,
    PrintDocumentHawbSearchComponent,
    PrintDocumentHawbListComponent
} from './hawb.component';
import {PrintDocumentHawbprintupdateComponent} from './hawb-printupdate.component';
import { PrintDocumentMawbprintupdateComponent } from './mawb-printupdate.component';
import { PrintDocumentMawbfinalprint } from './mawb-final-print.component';
import {MAWBModelpopupcomponent,MAWBTarifratingcomponent} from './Mawb_Tarifrating.component';
@NgModule({
    imports: [ExportprintodcairRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        ModalModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [PrintDocumentMawbComponent, PrintDocumentMawbListComponent,PrintDocumentMawbUpdateComponent,
        PrintDocumentHawbComponent,PrintDocumentHawbUpdateComponent ,PrintDocumentHawbSearchComponent,PrintDocumentHawbListComponent,
        PrintDocumentHawbprintupdateComponent,PrintDocumentMawbprintupdateComponent,PrintDocumentMawbfinalprint,PrintDocumentMawbUpdateComponents,
        MAWBModelpopupcomponent,MAWBTarifratingcomponent,PrintDocumentMawbSearchComponent],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExportPrintdocaircontModule { }