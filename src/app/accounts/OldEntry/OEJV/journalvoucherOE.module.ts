import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { JVOERoutingModule } from './journalvoucherOE.routing';
//import { SharedModule } from '../../../shared/shared.module';
import { JournalVoucherOEComponent } from './journalvoucher-IUOld.component';
import {SharedModule} from '../../../shared/shared.module';;
///import {BankReceiptModule} from '../BankRecpt/bankrecpt.module';
@NgModule({
    imports: [JVOERoutingModule,///BankReceiptModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule
    ],
    declarations: [ 
        JournalVoucherOEComponent
        
    ],
    providers: [
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class JVOEModule { }