import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CashPaymentComponent } from './cashpayment-IU.component';
const routes: Routes = [
  {
    path: '',
    data: {
        title: ' CP'
    },
    children: [
        
         { path: 'Add/:Type/:EntryNo', component: CashPaymentComponent, data: { title: 'Add' } },
        
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CashPaymentRoutingModule { }
