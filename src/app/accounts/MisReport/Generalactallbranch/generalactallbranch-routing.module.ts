import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GenActStatementAllBranch } from './genactstmt.component';


const routes: Routes = [
  {
    path: '',
    data: {
        title: 'General A/C All '
    },
    children: [
         { path:'', component: GenActStatementAllBranch, data: { title: '' } },
        // { path:'act/CSList', component: ClientSupplierActWiseList, data: { title: 'ActwiseList' } }
     ],
     
     
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GeneralActAllBranchRoutingModule { }
