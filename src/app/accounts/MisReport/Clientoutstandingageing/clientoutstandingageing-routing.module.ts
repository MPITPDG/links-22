import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClientOutstanding } from './clntoutstanding.component';
const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Client Outstanding '
    },
    children: [
         { path:'clntAgeing', component: ClientOutstanding, data: { title: '' } },
        // { path:'act/CSList', component: ClientSupplierActWiseList, data: { title: 'ActwiseList' } }
     ],
   
     
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientOutstandingRoutingModule { }
