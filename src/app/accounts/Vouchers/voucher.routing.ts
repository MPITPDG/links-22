import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FinancialYearAuthGuard } from '../../shared/guard/finanacial-year-auth-guard.service';
 
const routes: Routes = [
    {
        path: '',
        data: {
            title: ' Voucher'
        },
        children: [
            
            {
                path: 'JV',
                loadChildren: () => import('./JV/journalvoucher.module').then(m => m.JvModule),
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'BankRecpt',
                loadChildren: () => import('./BankRecpt/bankrecpt.module').then(m => m.BankReceiptModule),
                canActivate: [FinancialYearAuthGuard],
            },
          
            {
                path: 'BankPaymnt',
                loadChildren: () => import('./BankPayment/bankpayment.module').then(m => m.BankPaymentModule),
                canActivate: [FinancialYearAuthGuard],
            }, 
            
            {
                path: 'CashRecpt',
                loadChildren: () => import('./cashrecipt/cashrecipt.module').then(m => m.CashreciptModule),
                canActivate: [FinancialYearAuthGuard],
            },
            // {
            //     path: 'CashPaymnt',
            //     loadChildren: () => import('./BankRecpt/bankrecpt.module').then(m => m.BankReceiptModule),
            //     canActivate: [FinancialYearAuthGuard],
            // },
            {
                path: 'CashExpence',
                loadChildren: () => import('./CashExpense/cash-expense.module').then(m => m.CashExpenseModule),
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'CashPayment',
                loadChildren: () => import('./CashPayment/cashpayment.module').then(m => m.CashPaymentModule),
                canActivate: [FinancialYearAuthGuard],
            },

        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class VouchersRoutingModule { }
