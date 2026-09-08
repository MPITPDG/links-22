import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {Mst_citycomponent} from './Mst_city.component';
 
const routes : Routes = [
    {
        path: '',
        data: {
            title: 'Master/City'
        },
        children: [
            
            { path: 'add', component: Mst_citycomponent, data: { title: 'Add' },pathMatch: 'full'} ,
           
            //{ path: 'client/:ReqType', component: clientmaster, data: { title: 'Client' },pathMatch: 'full' },
             
        ]
        
    }
];



@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class Mst_cityrouting { }