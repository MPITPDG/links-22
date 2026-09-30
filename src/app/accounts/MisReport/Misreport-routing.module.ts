import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FinancialYearAuthGuard } from 'src/app/shared/guard/finanacial-year-auth-guard.service';
import { MisReportComponent } from './Misreport.component';
const routes: Routes = [
  {
    path: '',
    data: {
        title: 'MisReport'
    },
    children: [
        { path: '', component: MisReportComponent, data: { title: 'Home' } },
      
            {
                path: 'FinanceDashboard',
                loadChildren: () => import('./FinanceDashboard/financedashboard.module').then(m => m.FinanceDashboardModule),
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'AdminReport',
                loadChildren: () => import('./AdminReport/Adminreport.module').then(m => m.AccountAdminReportModule),
                canActivate: [FinancialYearAuthGuard],
            },
        {
            path: 'ActFinalization',
            loadChildren: () => import('./ActFinalization/actfinalization.module').then(m => m.ActFinalizationModule),
            canActivate: [FinancialYearAuthGuard],
        },
        {
          path: 'InvoicingDelay',
          loadChildren: () => import('./InvoicingDelay/invoicingdelay.module').then(m => m.InvoicingDelayModule),
          canActivate: [FinancialYearAuthGuard],
      },
     
      {
        path: 'MawbNetFrt',
        loadChildren: () => import('./MawbNetFrt/mawbnetfrt.module').then(m => m.MAWBFRTModule),
        canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'AirFreight',
        loadChildren: () => import('./AirFreight/airfreight.module').then(m => m.AirFreightModule),
        canActivate: [FinancialYearAuthGuard],
     },
      {
        path: 'SundryExpense',
        loadChildren: () => import('./SundryExpenselateact/sundryexpenselateact.module').then(m => m.SundryExpensesModule),
        canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'Clientoutstandingageing',
        loadChildren: () => import('./Clientoutstandingageing/clientoutstandingageing.module').then(m => m.ClientOutstandingModule),
        canActivate: [FinancialYearAuthGuard],
      }  ,
  
      {
        path: 'JobHandler',
        loadChildren: () => import('./JobHandler/jobhandler.module').then(m => m.JobHandlerModule),
        canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'ExJobSearch',
        loadChildren: () => import('./ExJobSearch/exjobsearch.module').then(m => m.ExJobSearchModule),
        canActivate: [FinancialYearAuthGuard],
      }   ,
        {
        path: 'JobProfit',
        loadChildren: () => import('./JobProfit/jobprofit.module').then(m => m.JobProfitModule),
        canActivate: [FinancialYearAuthGuard],
      } 
// {
// path: 'Generalactallbranch',
// loadChildren: () => import('./Generalactallbranch/generalactallbranch.module').then(m => m.GeneralActAllBranchModule),
// canActivate: [FinancialYearAuthGuard],
// }    

        
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MisReportRoutingModule { }
