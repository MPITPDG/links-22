import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { BankPaymentOERoutingModule } from './bankpaymentOE.routing';
//import { SharedModule } from '../../../shared/shared.module';
import { BankPaymentOEComponent } from './bankpayment-IUOld.component';
import {SharedModule} from '../../../shared/shared.module';;
///import {BankReceiptModule} from '../BankRecpt/bankrecpt.module';
@NgModule({
    imports: [BankPaymentOERoutingModule,///BankReceiptModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule
    ],
    declarations: [ 
        BankPaymentOEComponent
        
    ],
    providers: [
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BankPaymentOEModule { }