import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BankReceiptSearchComponent } from '../BankRecpt/bankreceipt-search.component';
import { CashreciptIUComponent } from './cashrecipt-IU.component';

const routes: Routes = [
  {
      path: '',
      data: {
          title: 'Cash Payment'
      },
      children: [
          { path:'cashpayment/:cashno', component: CashreciptIUComponent, data: { title: 'Home' } },
          { path: 'Search/:Type', component: BankReceiptSearchComponent, data: { title: 'Search' } }
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CashreciptRoutingModule { }
