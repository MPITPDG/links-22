import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RePrintexistChequeComponent } from './RePrintexistCheque.component';


const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Reprint Existing Cheque'
    },
    children: [
        { path:'search', component: RePrintexistChequeComponent, data: { title: 'Search' } },
       
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReprintExistingChequeRoutingModule { }
