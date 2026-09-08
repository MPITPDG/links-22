import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AirlineMasterImportComponent } from './airline.component';
import { EntryAirlineMasterComponent } from './data-entry.component';
import { SearchAirlineMasterComponent } from './search.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Airline'
        },
        children: [
            { path: '', component: AirlineMasterImportComponent, data: { title: 'Home' } },
            { path: 'data-entry', component: EntryAirlineMasterComponent, data: { title: 'Data Entry' } },
            { path: 'update-entry/:param', component: EntryAirlineMasterComponent, data: { title: 'Update Entry' } },
            { path: 'search', component: SearchAirlineMasterComponent, data: { title: 'Search' } },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AirlineImportRoutingModule { }
