import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import{ExptEpcopyRecvddt,ExptEpcopyRecvddtSearch  } from './exp_epcopy_recvddt_search.component';
 
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Epcopy'
        },
        children: [
            { path: 'epcopy', component: ExptEpcopyRecvddtSearch, data: { title: 'shipment-progress/ep-copy' } },
            { path: 'epcopy-recvddt/:exptno', component: ExptEpcopyRecvddt, data: { title: 'shipment-progress / EP-Copy' } },
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportEpcopyrecvdRoutingModule { }