import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AccountComponent } from './accounts.component';
import { FinancialYearAuthGuard } from '../shared/guard/finanacial-year-auth-guard.service';
const routes: Routes = [
    {
        path: '', data: { title: 'Account' },
        canDeactivate: [FinancialYearAuthGuard],
        children: [
            { path: '', component: AccountComponent, data: { title: 'Home' } },
            {
                path: 'Master',
                loadChildren: './Master/actmaster.module#ActMasterModule',
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'uploadbankreconcil',
                loadChildren: './uploadbankreconcil/uploadbankreconcil.module#uploadbankreconcilModule',
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'tds26as',
                loadChildren: './tds26as/tds26as.module#Tds26asModule',
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'transaction',
                loadChildren: './transaction/transaction.module#TransactionModule',
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'purchase',
                loadChildren: './purchase/purchase.module#PurchaseInvModule',
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'Request',
                loadChildren: './Request/staffrequest.module#RequestModule',
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'Voucher',
                loadChildren: './Vouchers/vouchers.module#VouchersModule',
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'Authorisation',
                loadChildren: './Authorisation/Authorisation.module#AuthorisationModule',
                canActivate: [FinancialYearAuthGuard]
            }, 
            {
                path: 'UnAuthorisation',
                loadChildren: './UnAuthorisation/UnAuthorisation.module#UnAuthorisationModule',
                canActivate: [FinancialYearAuthGuard]
            }, 
            {
                path: 'CompCheque',
                loadChildren: './CompCheque/CompCheque.module#CompChequeModule',
                canActivate: [FinancialYearAuthGuard]
            }, 
            {
                path: 'report',
                loadChildren: './Accreport/report.module#AccountReportModules',
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'MisReport',
                loadChildren: './MisReport/Misreport.module#AccountMisReportModule',
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'OldEntry',
                loadChildren: './OldEntry/oldentry.module#OldEntryModule',
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'EInvoice',
                loadChildren: './EInvoice/einvoice.module#einvoicemodule',
                canActivate: [FinancialYearAuthGuard]
            },
                 {
                path: 'ClientEdi',
                loadChildren: './ClientEdi/clientedi.module#ClientEdiModule',
                canActivate: [FinancialYearAuthGuard]
            },
            
            
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AccountRoutingModule { }
 