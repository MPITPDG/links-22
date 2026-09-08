import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { BankReceiptRoutingModule } from './bankrecpt.routing';
//import { SharedModule } from '../../../shared/shared.module';
import { BankReceiptComponent } from './bankreceipt-IU.component';
import { BankReceiptSearchComponent } from './bankreceipt-search.component';
import {SharedModule} from '../../../shared/shared.module'
@NgModule({
    imports: [BankReceiptRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule
    ],
    declarations: [ 
        BankReceiptComponent,
        BankReceiptSearchComponent
    ],
    providers: [
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BankReceiptModule { }