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
                loadChildren: () => import('./invoice/invoice.module').then(m => m.InvoiceModule),
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'creditnote',
                loadChildren: () => import('./CrtNote/credit-note.module').then(m => m.CreditNoteModule),
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'airfrtinvoice',
                loadChildren: () => import('./air-frt-inv/air-frt-inv.module').then(m => m.AirFrtInvModule),
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
