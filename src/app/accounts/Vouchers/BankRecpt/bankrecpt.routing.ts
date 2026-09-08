import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BankReceiptComponent } from './bankreceipt-IU.component';
import { BankReceiptSearchComponent } from './bankreceipt-search.component';

const routes: Routes = [
    {
        path: '',
        data: {
            title: ' BR'
        },
        children: [
            
             { path: 'Add/:EntryNo', component: BankReceiptComponent, data: { title: 'Add' } },
              { path: 'Search/:Type', component: BankReceiptSearchComponent, data: { title: 'Search' } }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BankReceiptRoutingModule { }
