import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ChequeErrorPrintComponent } from './ChequeError-NotGenerateBPNo.component';


const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Cheque-ErrorPrint'
    },
    children: [
        { path:'search', component: ChequeErrorPrintComponent, data: { title: 'Search' } },
       
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChequeErrorPrintRoutingModule { }
