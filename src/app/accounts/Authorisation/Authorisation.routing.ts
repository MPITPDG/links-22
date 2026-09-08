import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { invoiceAuth } from './Invoice-Auth.component';
import { CNAuth } from './CN-Auth.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Authorisation'
        },
        children: [
            { path: 'InvoiceAuth', component: invoiceAuth, data: { title: '' } },
            { path: 'CNAuth', component: CNAuth, data: { title: 'Credit Note' } },
            
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AuthorisationRoutingModule { }
