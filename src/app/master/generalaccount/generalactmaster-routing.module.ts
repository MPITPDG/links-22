import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import{generalactmasterIU} from './generalactmaster-IU.component';
import {generalactmastersearch} from './generalactmaster-search.component';
import {itemcodeIU} from './itemcode-IU.component';
const routes: Routes = [
  {
    path: '',
    data: {
        title: 'General-Account'
    },
    children: [
       { path: 'GeneralAccount/:ID', component: generalactmasterIU, data: { title: 'General account Creation' },pathMatch :'ful' },
       { path: 'GeneralAccountsearch', component: generalactmastersearch, data: { title: 'Search' },pathMatch :'ful' },
       { path: 'ItemCode', component: itemcodeIU, data: { title: 'Item Code Creation' },pathMatch :'ful' },
        
         
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GeneralAccountRoutingModule { }
