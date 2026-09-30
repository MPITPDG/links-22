import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProformaInvoiceComponent } from './proforma-invoice.component';
import { ProformaInvoiceSearchComponent } from './proforma-invoice-search.component';
import { ProformaConvertComponent } from './proforma-convert.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Proforma Invoice'
        },
        children: [
            { path: 'general/:profno', component: ProformaInvoiceComponent, data: { title: 'Home' } },
            { path: 'proformasearch', component: ProformaInvoiceSearchComponent, data: { title: 'Search' }, pathMatch: 'full' },
            { path: 'convert/:profno', component: ProformaConvertComponent, data: { title: 'Convert to Tax Invoice' } },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ProformaInvoiceRoutingModule { }
