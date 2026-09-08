import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClientJobprofitComponent } from './client_jobprofit.component'
import { AgentJobprofitComponent } from './agent_jobprofit.component';
import {ConsigneeJobprofitComponent} from './consignee_jobprofit.component'
const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Air Freight '
    },
    children: [
         { path:'cljbprofit', component: ClientJobprofitComponent, data: { title: '' } },
         { path:'agtjobprofit', component: AgentJobprofitComponent, data: { title: '' } },
         { path:'consigneejobprofit', component: ConsigneeJobprofitComponent, data: { title: '' } },
      
     ],
   
     
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JobProfitRoutingModule { }
