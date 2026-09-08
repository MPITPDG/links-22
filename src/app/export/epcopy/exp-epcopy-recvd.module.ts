import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';

import {ExportEpcopyrecvdRoutingModule} from './exp-epcopy-recvd.routing'; 
import{ExptEpcopyRecvddt,ExptEpcopyRecvddtSearch  } from './exp_epcopy_recvddt_search.component';

@NgModule({
    imports: [ExportEpcopyrecvdRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        ModalModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [ExptEpcopyRecvddt,ExptEpcopyRecvddtSearch ],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExportEpcopyrecvdModule { }