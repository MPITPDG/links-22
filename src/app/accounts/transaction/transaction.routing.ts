import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TransactionComponent } from './transaction.component';
import { FinancialYearAuthGuard } from 'src/app/shared/guard/finanacial-year-auth-guard.service';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Transaction'
        },
        children: [
            { path: '', component: TransactionComponent, data: { title: 'Home' } },
            {
                path: 'invoice',
                loadChildren: './invoice/invoice.module#InvoiceModule',
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'creditnote',
                loadChildren: './CrtNote/credit-note.module#CreditNoteModule',
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'airfrtinvoice',
                loadChildren: './air-frt-inv/air-frt-inv.module#AirFrtInvModule',
                canActivate: [FinancialYearAuthGuard],
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TransactionRoutingModule { }
