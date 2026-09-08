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
            loadChildren: './ClientRegister/clientregister.module#ClientRegisterModule',
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
