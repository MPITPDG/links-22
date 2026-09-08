import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FinanceDashboardComponent } from './finance-dashboard.component';

const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Finance Dashboard'
    },
    children: [
      { path: 'dashboard', component: FinanceDashboardComponent, data: { title: 'Finance Dashboard' } }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanceDashboardRoutingModule { }
