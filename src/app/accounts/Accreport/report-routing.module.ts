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
            loadChildren: './register/register.module#RegisterModule',
            canActivate: [FinancialYearAuthGuard],
        },
        {
          path: 'JobProfit',
          loadChildren: './jobprofit/jobprofit.module#JobprofitModules',
          canActivate: [FinancialYearAuthGuard],
        },      
        {
          path: 'accountstatement',
          loadChildren: './accountstatement/accountstatement.module#AccountStatementModule',
          canActivate: [FinancialYearAuthGuard],
        },      
       {
        path: 'itemstatement',
        loadChildren: './itemstatement/itemstatement.module#ItemStatementModules',
        canActivate: [FinancialYearAuthGuard],
       },
      {
        path: 'notoverreport',
        loadChildren: './notoverreport/notover.module#NotOverModule',
        canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'advancefromclient',
        loadChildren: './advfrmclient/advfrmclient.module#AdvanceFromClientModules',
        canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'specialreport',
        loadChildren: './specialreport/specialreport.module#SpecialReportModule',
        canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'Receivables',
        loadChildren: './Receivables/receivables.module#ReceivablesModule',
        canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'Trialbalance',
        loadChildren: './Trialbalance/trialbalance.module#TrialBalanceModules',
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
