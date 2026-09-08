import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StaffPurchaseComponent } from './staffpurchase_IU.component';
import { StaffPurchaseSearchComponent } from './staffpurchase_search.component';

const routes: Routes = [
    {
        path: '',
        data: {
            title: ' Staff'
        },
        children: [
            
            { path: 'StaffPurchase/:EntryNo', component: StaffPurchaseComponent, data: { title: 'Add' } },
             { path: 'Search', component: StaffPurchaseSearchComponent, data: { title: 'Search' } }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class staffPurchaseRoutingModule { }
