import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import {NgSelectModule} from '@ng-select/ng-select';
import { RequestRouting } from './request.routing';
import {clientmaster} from './client.component';
import {RequestComponent} from './request.component';
 import {consigneemaster} from './consignee.component';
 import{ ReqMastersearch} from './request-search.component';
//import { Http,   } from '@angular/http';
import { NgxPaginationModule } from 'ngx-pagination';
import { UiButton } from '../../shared/ui/button';
import {suppliermaster} from './supplier.component';
import {vesselAgentmaster} from './vessel_Agent.component';
import {Linermaster} from './liner.component';
import { KycService } from './kyc.service';
import { KycPanelComponent } from './kyc-panel.component';
import { KycRequestsComponent } from './kyc-requests.component';
import { KycRulesComponent } from './kyc-rules.component';
@NgModule({
    imports: [RequestRouting,
        FormsModule,
        CommonModule,
        TabsModule,
        MyDatePickerModule,
        NgSelectModule,NgxPaginationModule, UiButton ],
    declarations: [clientmaster,RequestComponent,
        consigneemaster,ReqMastersearch,suppliermaster,vesselAgentmaster,Linermaster,
        KycPanelComponent, KycRequestsComponent, KycRulesComponent
    ],
    providers: [KycService
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RequestModules { }