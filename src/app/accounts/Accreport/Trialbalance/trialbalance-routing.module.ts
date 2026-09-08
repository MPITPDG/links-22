import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TrialBalanceDatewise } from './trialbal-datewise.component';
import { TrialBalanceGroupwise } from './trialbal-groupwise.component';
const routes: Routes = [
  {
      path: '',
      data: {
          title: 'TrialBalance'
      },
      children: [
          
             { path: 'Date', component: TrialBalanceDatewise, data: { title: '' } },
             { path: 'Grp', component: TrialBalanceGroupwise, data: { title: '' } },
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrialBalanceRoutingModule { }
