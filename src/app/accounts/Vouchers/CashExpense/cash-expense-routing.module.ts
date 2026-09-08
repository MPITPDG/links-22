import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CashexpenseComponent } from './cashexpense.component';
import { GenCashReceiptComponent } from './Gen-Cash-Receipt.component';
import { StatementComponent } from './statement.component';

const routes: Routes = [
  {
    path: '',
    data: {
        title: ' CE'
    },
    children: [
        
         { path: 'Add/:Type/:EntryNo', component: CashexpenseComponent, data: { title: 'Add' } },
         { path: 'GencashRecpt', component: GenCashReceiptComponent, data: { title: 'Add' } },
         { path: 'Statement', component: StatementComponent, data: { title: 'List' } },
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CashExpenseRoutingModule { }
