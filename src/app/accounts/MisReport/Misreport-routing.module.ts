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
                loadChildren: './FinanceDashboard/financedashboard.module#FinanceDashboardModule',
                canActivate: [FinancialYearAuthGuard],
            },
            {
                path: 'AdminReport',
                loadChildren: './AdminReport/Adminreport.module#AccountAdminReportModule',
                canActivate: [FinancialYearAuthGuard],
            },
        {
            path: 'ActFinalization',
            loadChildren: './ActFinalization/actfinalization.module#ActFinalizationModule',
            canActivate: [FinancialYearAuthGuard],
        },
        {
          path: 'InvoicingDelay',
          loadChildren: './InvoicingDelay/invoicingdelay.module#InvoicingDelayModule',
          canActivate: [FinancialYearAuthGuard],
      },
     
      {
        path: 'MawbNetFrt',
        loadChildren: './MawbNetFrt/mawbnetfrt.module#MAWBFRTModule',
        canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'AirFreight',
        loadChildren: './AirFreight/airfreight.module#AirFreightModule',
        canActivate: [FinancialYearAuthGuard],
     },
      {
        path: 'SundryExpense',
        loadChildren: './SundryExpenselateact/sundryexpenselateact.module#SundryExpensesModule',
        canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'Clientoutstandingageing',
        loadChildren: './Clientoutstandingageing/clientoutstandingageing.module#ClientOutstandingModule',
        canActivate: [FinancialYearAuthGuard],
      }  ,
  
      {
        path: 'ExJobSearch',
        loadChildren: './ExJobSearch/exjobsearch.module#ExJobSearchModule',
        canActivate: [FinancialYearAuthGuard],
      }   ,
        {
        path: 'JobProfit',
        loadChildren: './JobProfit/jobprofit.module#JobProfitModule',
        canActivate: [FinancialYearAuthGuard],
      } 
// {
// path: 'Generalactallbranch',
// loadChildren: './Generalactallbranch/generalactallbranch.module#GeneralActAllBranchModule',
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
