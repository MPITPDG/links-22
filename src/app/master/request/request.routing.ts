import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {clientmaster} from './client.component';
import {RequestComponent} from './request.component';
import {consigneemaster} from './consignee.component';
import{ ReqMastersearch} from './request-search.component'
import {suppliermaster} from './supplier.component';
import {vesselAgentmaster} from './vessel_Agent.component';
import {Linermaster} from './liner.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Master/Request'
        },
        children: [
            { path: '', component: RequestComponent, data: { title: 'Home' }} ,
            { path: 'client/:ReqType/:ExpCode', component: clientmaster, data: { title: 'Client' },pathMatch: 'full' },
            { path: 'consignee/:ReqType/:ConCode', component: consigneemaster, data: { title: 'Consignee' },pathMatch: 'full' },
            { path: 'search/:ReqType', component: ReqMastersearch, data: { title: 'Search' },pathMatch: 'full' },
            { path: 'supplier/:ReqType/:SupCode', component: suppliermaster, data: { title: 'Supplier' },pathMatch: 'full' },
            { path: 'AgentVessel/:ReqType/:VslAgtC', component: vesselAgentmaster, data: { title: 'AGENT(VESSEL)' },pathMatch: 'full' },
            { path: 'Liner/:ReqType/:linerC', component: Linermaster, data: { title: 'Liner' },pathMatch: 'full' },
             
        ]
    }
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RequestRouting { }
