import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Commonsearch} from './Common-Search.component'
 import {bankConsigneemaster} from './Bank-Consignee.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Master/Common'
        },
        children: [
            // { path: '', component: RequestComponent, data: { title: 'Home' }} ,
            { path: 'Search', component: Commonsearch, data: { title: 'Common' },pathMatch :'ful' },
            { path: 'ConsigneeBank/:BnkCode', component: bankConsigneemaster, data: { title: 'Consignee Bank' },pathMatch :'ful' },
            
             
        ]
    }
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CommonRouting { }