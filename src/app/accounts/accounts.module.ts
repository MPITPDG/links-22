import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountComponent } from './accounts.component';
import { AccountRoutingModule } from './accounts.routing';
import { FormsModule } from '@angular/forms';
import { FinancialYearAuthGuard } from '../shared/guard/finanacial-year-auth-guard.service';
import {SharedModule} from '../shared/shared.module';
import { DatePipe } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { AccountsHomeComponent } from './home/accounts-home.component';


@NgModule({
    imports: [AccountRoutingModule, FormsModule, CommonModule,SharedModule, NgChartsModule],
    declarations: [
        AccountComponent
    ,
        AccountsHomeComponent
    ],
    providers: [FinancialYearAuthGuard,DatePipe]
})
export class AccountModule { }
