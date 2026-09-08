import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { BankReconcilRoutingModule } from './BankReconcil.routing'; 
import { BankReconcilComponent } from './bank-reconcil.component';
import {BankReconcilStatementComponent  } from './bank-reconcil-rpt.component';
import { BankReconcilCashbookStatementComponent } from './bank-reconcil-cashbook-statement.component';
import {SharedModule} from '../../../shared/shared.module'
@NgModule({
    imports: [BankReconcilRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule
    ],
    declarations: [
        BankReconcilComponent,BankReconcilStatementComponent,BankReconcilCashbookStatementComponent

    ],
    providers: [
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BankReconcilModule { }