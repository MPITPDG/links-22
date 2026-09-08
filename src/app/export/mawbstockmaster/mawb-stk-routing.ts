import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MawbStockMasterComponent } from './stockmaster.component';


const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Mawb Stock'
        },
        children: [
             { path: 'Add', component: MawbStockMasterComponent, data: { title: 'Add' } },
            // { path: 'Search', component: VesselSearchComponent, data: { title: 'Mawb Stock / Search' } },
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MawbStockRoutingModule { }