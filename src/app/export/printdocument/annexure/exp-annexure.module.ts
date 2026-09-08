import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SharedModule } from '../../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';

import {ExportAnnexureRoutingModule } from './exp-annexure.routing'; 
  
import { AnnexureComponent } from './annexure.component';
import { AnnexureSearchComponent } from './search-annexure.component';
import { EditMenuAnnexureComponent } from './edit-menu-annexure.component';
import { EditAnnexureComponent } from './edit-annexure.component';
import { ItemDetailAnnexureComponent } from './item-detail-annexure.component';
import { DrawbackAnnexureComponent } from './drawback-annexure.component';
import { DeecEpcgAnnexureComponent } from './deec-epcg-annexure.component';
import { DfrcAnnexureComponent } from './dfrc-annexure.component';

@NgModule({
    imports: [ExportAnnexureRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        ModalModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [  AnnexureComponent,AnnexureSearchComponent, EditMenuAnnexureComponent, EditAnnexureComponent,
        ItemDetailAnnexureComponent, DrawbackAnnexureComponent,DeecEpcgAnnexureComponent,  DfrcAnnexureComponent,  ],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExportAnnexureModule { }