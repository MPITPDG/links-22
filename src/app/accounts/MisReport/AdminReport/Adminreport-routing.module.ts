import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FinancialYearAuthGuard } from 'src/app/shared/guard/finanacial-year-auth-guard.service';
import { AdminReportComponent } from './Adminreport.component';
import { FyDrCrDiffAuditComponent } from './fydrcrdiffaudit.component';
const routes: Routes = [
  {
    path: '',
    data: {
        title: 'AdminReport'
    },
    children: [
        { path: '', component: AdminReportComponent, data: { title: 'Home' } },
        {
            path: 'ClientRegister',
            loadChildren: () => import('./ClientRegister/clientregister.module').then(m => m.ClientRegisterModule),
            canActivate: [FinancialYearAuthGuard],
        },
        {
            path: 'DayEnd',
            loadChildren: () => import('./DayEnd/mgmt-dayend.module').then(m => m.MgmtDayEndModule),
            canActivate: [FinancialYearAuthGuard],
        },
        { path: 'DrCrDiffAudit', component: FyDrCrDiffAuditComponent, data: { title: 'FY Debit/Credit Difference Audit' } },



    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminReportRoutingModule { }
