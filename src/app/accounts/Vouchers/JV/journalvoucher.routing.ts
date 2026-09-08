import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { JournalVoucherComponent } from './journalvoucher_IU.component';
import { JournalVoucherSearchComponent } from './journalvoucher_search.component';
import  { journalvoucherAuth } from './jv-auth.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: ' Journal Voucher'
        },
        children: [
            
            { path: 'Add/:Status/:EntryNo', component: JournalVoucherComponent, data: { title: 'Add' } },
            { path: 'Search/:Status', component: JournalVoucherSearchComponent, data: { title: 'Search' } },
            { path: 'Auth/:Status', component: journalvoucherAuth, data: { title: 'Search' } }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class JvRoutingModule { }
