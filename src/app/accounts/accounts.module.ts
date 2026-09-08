import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountComponent } from './accounts.component';
import { AccountRoutingModule } from './accounts.routing';
import { FormsModule } from '@angular/forms';
import { FinancialYearAuthGuard } from '../shared/guard/finanacial-year-auth-guard.service';
import {SharedModule} from '../shared/shared.module';
import { DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
    imports: [AccountRoutingModule, FormsModule, CommonModule,SharedModule,HttpClientModule],
    declarations: [
        AccountComponent
    ],
    providers: [FinancialYearAuthGuard,DatePipe]
})
export class AccountModule { }
