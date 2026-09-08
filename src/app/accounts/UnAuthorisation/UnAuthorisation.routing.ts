import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {invoiceUnAuth} from './Invoice-UnAuth.component';
 
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'UnAuthorisation'
        },
        children: [
            { path: 'InvoiceUnAuth', component: invoiceUnAuth, data: { title: 'Invoice' } },
             
            
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UnAuthorisationRoutingModule { }
