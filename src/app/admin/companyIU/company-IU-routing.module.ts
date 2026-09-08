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
        { path: 'Company/:Id', component: companyIU, data: { title: 'Company Creation' },pathMatch :'ful' },
        { path: 'Companysearch', component: companySearch, data: { title: 'Search' },pathMatch :'ful' },
         
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class companyIURoutingModule { }
