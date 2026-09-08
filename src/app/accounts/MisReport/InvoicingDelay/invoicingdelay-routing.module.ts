import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InvDelay } from './invdelay.component';



const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Invoicing Delay'
    },
    children: [
        { path:'Delay', component: InvDelay, data: { title: 'Invoicing Delay' } },
       
     ],
     
     
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoicingDelayRoutingModule { }
