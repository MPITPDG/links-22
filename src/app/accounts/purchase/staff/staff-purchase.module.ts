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
@NgModule({
    imports: [staffPurchaseRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule
    ],
    declarations: [ 
        StaffPurchaseComponent,
        StaffPurchaseSearchComponent
    ],
    providers: [
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class staffPurchaseModule { }