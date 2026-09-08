import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {  DocketSearchComponent} from './docket.search.component'

const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Docket'
        },
        children: [
            { path: 'docket-search', component: DocketSearchComponent, data: { title: 'Docket Search' } },
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportDocketRoutingModule { }