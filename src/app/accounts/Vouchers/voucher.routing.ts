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
                loadChildren: './JV/journalvoucher.module#JvModule',
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'BankRecpt',
                loadChildren: './BankRecpt/bankrecpt.module#BankReceiptModule',
                canActivate: [FinancialYearAuthGuard],
            },
          
            {
                path: 'BankPaymnt',
                loadChildren: './BankPayment/bankpayment.module#BankPaymentModule',
                canActivate: [FinancialYearAuthGuard],
            }, 
            
            {
                path: 'CashRecpt',
                loadChildren: './cashrecipt/cashrecipt.module#CashreciptModule',
                canActivate: [FinancialYearAuthGuard],
            },
            // {
            //     path: 'CashPaymnt',
            //     loadChildren: './BankRecpt/bankrecpt.module#BankReceiptModule',
            //     canActivate: [FinancialYearAuthGuard],
            // },
            {
                path: 'CashExpence',
                loadChildren: './CashExpense/cash-expense.module#CashExpenseModule',
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'CashPayment',
                loadChildren: './CashPayment/cashpayment.module#CashPaymentModule',
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
