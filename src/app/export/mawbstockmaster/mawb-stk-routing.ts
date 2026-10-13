import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MawbStockMasterComponent } from './stockmaster.component';
import { MawbStockSearchComponent } from './stockmaster-search.component';


const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Mawb Stock'
        },
        children: [
             { path: 'Add', component: MawbStockMasterComponent, data: { title: 'Add' } },
            { path: 'Search', component: MawbStockSearchComponent, data: { title: 'Search' } },
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MawbStockRoutingModule { }