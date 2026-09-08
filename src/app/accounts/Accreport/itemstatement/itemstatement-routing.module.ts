import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ItemwiseStatement } from './item-search.component';
import { ItemAccountStatement } from './itemaccount-search.component';
import { ItemStatement } from './item-stmt.component';
const routes: Routes = [
  {
      path: '',
      data: {
          title: 'itemstatement'
      },
      children: [
          
           { path: 'Item', component: ItemwiseStatement, data: { title: 'Search' } },
           { path: 'Account', component: ItemAccountStatement, data: { title: 'Account' } },
           { path: 'Itemstmt', component: ItemStatement, data: { title: 'Item Statement' } },
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ItemStatementRoutingModule { }
