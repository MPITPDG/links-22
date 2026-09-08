import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { staffPurchaseRoutingModule } from './staff-purchase.routing';
//import { SharedModule } from '../../../shared/shared.module';
import { StaffPurchaseComponent } from './staffpurchase_IU.component';
import { StaffPurchaseSearchComponent } from './staffpurchase_search.component';
import {SharedModule} from '../../../shared/shared.module'
import { StaffPurchaseAuth } from './staffpurchase-Auth.component';
import {ReqSRPGenerateComponent} from './staffpur-GenCode.component';
import {staffpurchaseViewComponent} from './staffpurchase-view.component';
import { ModalModule } from 'ngx-bootstrap/modal';
@NgModule({
    imports: [staffPurchaseRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule,
        ModalModule
    ],
    declarations: [ 
        StaffPurchaseComponent,staffpurchaseViewComponent,
        StaffPurchaseSearchComponent,StaffPurchaseAuth,ReqSRPGenerateComponent
    ],
    providers: [
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class staffPurchaseModule { }