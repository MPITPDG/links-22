import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FinancialYearAuthGuard } from '../../shared/guard/finanacial-year-auth-guard.service';
 
const routes: Routes = [
    {
        path: '',
        data: {
            title: ' OldEntry'
        },
        children: [
            {
                path: 'OEBankPaymnt',
                loadChildren: './OEBankPayment/bankpaymentOE.module#BankPaymentOEModule',
                canActivate: [FinancialYearAuthGuard],
            }, 
         
             {
                 path: 'OEBankRecpt',
                  loadChildren: './OEBankReceipt/bankreceiptOE.module#BankReceiptOEModule',
                 canActivate: [FinancialYearAuthGuard],
             },
             {
                path: 'OEJV',
                 loadChildren: './OEJV/journalvoucherOE.module#JVOEModule',
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'OEPurchase',
                 loadChildren: './OEPurchase/purchaseOE.module#PurchaseOEModule',
                canActivate: [FinancialYearAuthGuard],
            },
            // {
            //     path: 'OECreditNote',
            //      loadChildren: './OECreditNote/creditnoteOE.module#CreditNoteOEModule',
            //     canActivate: [FinancialYearAuthGuard],
            // },
         
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OldEntryRoutingModule { }
