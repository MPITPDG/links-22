import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';

import {ExportprntfcrRoutingModule} from './exp-prnt-fcr.routing'; 
import { ExptFCRGenerate } from './exp_prt_fcr_generate.component';
import { ExptFCRPrintview, ExptMTOprintview, ExptPrintview } from './exp_prt_fcr_printview.component';
import { ExptFCRPrint, ExptMTOprint, ExptPrint } from './exp_prt_print.component';
//import { ExptfcrpPreview } from './expt_fcrppreview.component';

@NgModule({
    imports: [ExportprntfcrRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        ModalModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [ExptFCRGenerate, ExptFCRPrintview, ExptMTOprintview, ExptPrintview,
        ExptFCRPrint, ExptMTOprint, ExptPrint],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExportprntfcrModule { }