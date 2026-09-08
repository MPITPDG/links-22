import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ChequeReportSearchComponent } from './PrintCheque-Chequereport-search.component';


const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Cheque-Report'
    },
    children: [
        { path:'search', component: ChequeReportSearchComponent, data: { title: 'Search' } },
       
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChequeReportRoutingModule { }
