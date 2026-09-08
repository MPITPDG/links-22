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
                loadChildren: () => import('./OEBankPayment/bankpaymentOE.module').then(m => m.BankPaymentOEModule),
                canActivate: [FinancialYearAuthGuard],
            }, 
         
             {
                 path: 'OEBankRecpt',
                  loadChildren: () => import('./OEBankReceipt/bankreceiptOE.module').then(m => m.BankReceiptOEModule),
                 canActivate: [FinancialYearAuthGuard],
             },
             {
                path: 'OEJV',
                 loadChildren: () => import('./OEJV/journalvoucherOE.module').then(m => m.JVOEModule),
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'OEPurchase',
                 loadChildren: () => import('./OEPurchase/purchaseOE.module').then(m => m.PurchaseOEModule),
                canActivate: [FinancialYearAuthGuard],
            },
            // {
            //     path: 'OECreditNote',
            //      loadChildren: () => import('./OECreditNote/creditnoteOE.module').then(m => m.CreditNoteOEModule),
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
