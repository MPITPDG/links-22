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
                loadChildren: () => import('./Master/actmaster.module').then(m => m.ActMasterModule),
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'uploadbankreconcil',
                loadChildren: () => import('./uploadbankreconcil/uploadbankreconcil.module').then(m => m.uploadbankreconcilModule),
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'tds26as',
                loadChildren: () => import('./tds26as/tds26as.module').then(m => m.Tds26asModule),
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'transaction',
                loadChildren: () => import('./transaction/transaction.module').then(m => m.TransactionModule),
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'purchase',
                loadChildren: () => import('./purchase/purchase.module').then(m => m.PurchaseInvModule),
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'Request',
                loadChildren: () => import('./Request/staffrequest.module').then(m => m.RequestModule),
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'Voucher',
                loadChildren: () => import('./Vouchers/vouchers.module').then(m => m.VouchersModule),
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'Authorisation',
                loadChildren: () => import('./Authorisation/Authorisation.module').then(m => m.AuthorisationModule),
                canActivate: [FinancialYearAuthGuard]
            }, 
            {
                path: 'UnAuthorisation',
                loadChildren: () => import('./UnAuthorisation/UnAuthorisation.module').then(m => m.UnAuthorisationModule),
                canActivate: [FinancialYearAuthGuard]
            }, 
            {
                path: 'CompCheque',
                loadChildren: () => import('./CompCheque/CompCheque.module').then(m => m.CompChequeModule),
                canActivate: [FinancialYearAuthGuard]
            }, 
            {
                path: 'report',
                loadChildren: () => import('./Accreport/report.module').then(m => m.AccountReportModules),
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'MisReport',
                loadChildren: () => import('./MisReport/Misreport.module').then(m => m.AccountMisReportModule),
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'OldEntry',
                loadChildren: () => import('./OldEntry/oldentry.module').then(m => m.OldEntryModule),
                canActivate: [FinancialYearAuthGuard]
            },
            {
                path: 'EInvoice',
                loadChildren: () => import('./EInvoice/einvoice.module').then(m => m.einvoicemodule),
                canActivate: [FinancialYearAuthGuard]
            },
                 {
                path: 'ClientEdi',
                loadChildren: () => import('./ClientEdi/clientedi.module').then(m => m.ClientEdiModule),
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
 