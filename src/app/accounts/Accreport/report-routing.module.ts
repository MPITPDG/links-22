import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FinancialYearAuthGuard } from 'src/app/shared/guard/finanacial-year-auth-guard.service';
import { AccountReportComponent  } from './report.component';
import {ReportDownload} from './report-download.component';
const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Report'
    },
    children: [
        { path: '', component: AccountReportComponent, data: { title: 'Home' } },
        { path: 'ReportDownload/:LogID', component: ReportDownload, data: { title: 'download' } },
        //
        {
            path: 'register',
            loadChildren: () => import('./register/register.module').then(m => m.RegisterModule),
            canActivate: [FinancialYearAuthGuard],
        },
        {
          path: 'JobProfit',
          loadChildren: () => import('./jobprofit/jobprofit.module').then(m => m.JobprofitModules),
          canActivate: [FinancialYearAuthGuard],
        },      
        {
          path: 'accountstatement',
          loadChildren: () => import('./accountstatement/accountstatement.module').then(m => m.AccountStatementModule),
          canActivate: [FinancialYearAuthGuard],
        },      
       {
        path: 'itemstatement',
        loadChildren: () => import('./itemstatement/itemstatement.module').then(m => m.ItemStatementModules),
        canActivate: [FinancialYearAuthGuard],
       },
      {
        path: 'notoverreport',
        loadChildren: () => import('./notoverreport/notover.module').then(m => m.NotOverModule),
        canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'advancefromclient',
        loadChildren: () => import('./advfrmclient/advfrmclient.module').then(m => m.AdvanceFromClientModules),
        canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'specialreport',
        loadChildren: () => import('./specialreport/specialreport.module').then(m => m.SpecialReportModule),
        canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'Receivables',
        loadChildren: () => import('./Receivables/receivables.module').then(m => m.ReceivablesModule),
        canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'Trialbalance',
        loadChildren: () => import('./Trialbalance/trialbalance.module').then(m => m.TrialBalanceModules),
        canActivate: [FinancialYearAuthGuard],
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportRoutingModule { }
