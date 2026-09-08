import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SeaImportComponent } from './sea.component';
import { EntrySeaImportComponent } from './entry-sea.component';
import { SeaSearchComponent } from './search.component';
import { SeaDocketPrintSearchComponent } from './docket-print-search.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Sea'
        },
        children: [
            { path: '', component: SeaImportComponent, data: { title: 'Home' } },
            { path: 'entry-data', component: EntrySeaImportComponent, data: { title: 'Add Import Sea' } },
            { path: 'update-data/:import-id', component: EntrySeaImportComponent, data: { title: 'Update Import Sea' } },
            { path: 'search', component: SeaSearchComponent, data: { title: 'Search' } },
            { path: 'docket-print-search', component: SeaDocketPrintSearchComponent, data: { title: 'Docket Print Search' } },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SeaImportRoutingModule { }
