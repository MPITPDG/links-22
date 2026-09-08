import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
 import {companyIU} from './company-IU.compnent'
 import {companySearch} from './company-search.componet'
const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Company'
    },
    children: [
        { path: 'Company/:Id', component: companyIU, data: { title: 'Company Creation' },pathMatch: 'full' },
        { path: 'Companysearch', component: companySearch, data: { title: 'Search' },pathMatch: 'full' },
         
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class companyIURoutingModule { }
