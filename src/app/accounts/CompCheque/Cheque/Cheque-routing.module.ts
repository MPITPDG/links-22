import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ChequeStockIUComponent } from './Cheque-Stock-IU.component';
import { ChequeStockSearchComponent } from './Cheque-Stock-search.component';
 

const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Cheque-Stock'
    },
    children: [
        { path:'Add/:ChequeStockNo', component: ChequeStockIUComponent, data: { title: 'Home' } },
        { path:'search', component: ChequeStockSearchComponent, data: { title: 'Search' } },
      
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChequeRoutingModule { }
