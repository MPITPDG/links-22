import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SundryExpenses } from './sundryexpense.component';



const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Sundry Expenses'
    },
    children: [
        { path:'', component: SundryExpenses, data: { title: '' } },
    ],
     
     
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SundryExpensesRoutingModule { }
