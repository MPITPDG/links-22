import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SharedModule } from '../../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import {ExportPrtMblRoutingModule } from './expt-prt-mbl.routing'; 
 
import { ExptMBLGenerate } from './expt_prt_mbl_generate.component';
import { Exptmblprintview } from './expt_prt_mbl_printprintview.component';
import { Exptmblprint } from './expt_prt_mbl_printprint.component';
@NgModule({
    imports: [ExportPrtMblRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        ModalModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [ExptMBLGenerate,Exptmblprintview ,Exptmblprint ],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExportPrtMblModule { }