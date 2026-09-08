import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
 import { ReqBPAuthListComponent } from './req-bp-auth-list.component';
import { ReqBankpaymentComponent } from './req-bankpayment.component';

const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Request BP'
    },
    children: [ 
        { path:'Add_reqBP/:bankpayno', component: ReqBankpaymentComponent, data: { title: 'Add' } },
        { path:'AuthList', component: ReqBPAuthListComponent, data: { title: 'AuthList' } },
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReqBpRoutingModule { }
