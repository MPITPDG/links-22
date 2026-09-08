import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import {NgSelectModule} from '@ng-select/ng-select';
import { RequestRouting } from './request.routing';
import {clientmaster} from './client.component';
import {RequestComponent} from './request.component';
import { HttpClientModule } from '@angular/common/http';
 import {consigneemaster} from './consignee.component';
 import{ ReqMastersearch} from './request-search.component';
//import { Http,   } from '@angular/http';
import { NgxPaginationModule } from 'ngx-pagination';
import {suppliermaster} from './supplier.component';
import {vesselAgentmaster} from './vessel_Agent.component';
import {Linermaster} from './liner.component';
@NgModule({
    imports: [RequestRouting,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,HttpClientModule,NgxPaginationModule ],
    declarations: [clientmaster,RequestComponent,
        consigneemaster,ReqMastersearch,suppliermaster,vesselAgentmaster,Linermaster
    ],
    providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RequestModules { }