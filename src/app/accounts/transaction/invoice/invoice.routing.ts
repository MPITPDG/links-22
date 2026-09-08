import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InvoiceComponent } from './general-invoice.component';
//import { GeneralComponent } from './general/general.component';
import { GeneralInvoiceSearchComponent } from './general-invoice-search.component';
import { ProformaInvoicePrintList } from './proforma-invoice-list.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Invoice'
        },
        children: [
            { path: 'general/:invoiceno', component: InvoiceComponent, data: { title: 'Home' } },
            { path: 'invoicesearch', component: GeneralInvoiceSearchComponent, data: { title: 'Search' },pathMatch :'ful' },
            { path: 'proformainvoice', component: ProformaInvoicePrintList, data: { title: 'Search' },pathMatch :'ful' },
           // { path: 'general', component: GeneralComponent, data: { title: 'General' } },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class InvoiceRoutingModule { }
