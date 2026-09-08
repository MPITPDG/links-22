import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReceivableAnyOneClientAllBranch } from './rcbl-anyoneClnt-allbrnch.component';
import { ReceivableAnyOneClientAgeing } from './rcbl-anyoneClnt-ageing.component';
import { OutstandingOverseasClient } from './rcbl-overseasagent.component';
const routes: Routes = [
  {
      path: '',
      data: {
          title: 'Receivables'
      },
      children: [
          
            { path: 'rec', component: ReceivableAnyOneClientAllBranch, data: { title: '' } },
            { path: 'age', component: ReceivableAnyOneClientAgeing, data: { title: '' } },
            { path: 'overseas', component: OutstandingOverseasClient, data: { title: '' } },
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReceivablesRoutingModule { }
