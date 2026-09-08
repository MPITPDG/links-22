import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { PurchaseRoutingModule } from './purchase.routing';
import { SharedModule } from './../../shared/shared.module';
import { PurchaseGeneralComponent } from './purchase-general.component';
import { PurchaseSearchComponent } from './purchase-search.component';
import {MulticontainerPurchaseComponent} from './multicontainer-purchase.component';
import {MAWBPurchaseComponent} from './mawb-purchase.component';
@NgModule({
    imports: [PurchaseRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule
    ],
    declarations: [
        MAWBPurchaseComponent,
        MulticontainerPurchaseComponent,
         PurchaseGeneralComponent,
         PurchaseSearchComponent
    ],
    providers: [
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PurchaseInvModule { }