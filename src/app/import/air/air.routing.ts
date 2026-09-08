import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AirImportComponent } from './air.component';
import { EntryAirImportComponent } from './entry-air.component';
import { AirSearchComponent } from './search.component';
import { AirDocketPrintSearchComponent } from './docket-print-search.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Import'
        },
        children: [
            { path: '', component: AirImportComponent, data: { title: 'Home' } },
            { path: 'entry-data', component: EntryAirImportComponent, data: { title: 'Add Import Air' } },
            { path: 'update-data/:import-id', component: EntryAirImportComponent, data: { title: 'Update Import Air' } },
            { path: 'search', component: AirSearchComponent, data: { title: 'Search' } },
            { path: 'docket-print-search', component: AirDocketPrintSearchComponent, data: { title: 'Docket Print Search' } },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AirImportRoutingModule { }
