import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import {NgSelectModule} from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';
import { CommonRouting } from './common.routing';
import { Commonsearch} from './Common-Search.component';
import  {bankConsigneemaster} from './Bank-Consignee.component'
@NgModule({
    imports: [ CommonRouting,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,NgxPaginationModule ],
    declarations: [Commonsearch,bankConsigneemaster
    ],
    providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CommonRoutingModules { }