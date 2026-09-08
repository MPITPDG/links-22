import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExportJobSearch } from './exportjob.component';



const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Export Job Search'
    },
    children: [
        { path:'ExJob', component: ExportJobSearch, data: { title: 'Export Job Search' } },
       
     ],
     
     
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExportJobSearchRoutingModule { }
