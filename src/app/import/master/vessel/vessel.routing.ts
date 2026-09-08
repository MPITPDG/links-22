import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VesselMasterImportComponent } from './vessel.component';
import { EntryVesselMasterComponent } from './data-entry.component';
import { SearchVesselMasterComponent } from './search.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Vessel'
        },
        children: [
            { path: '', component: VesselMasterImportComponent, data: { title: 'Home' } },
            { path: 'data-entry', component: EntryVesselMasterComponent, data: { title: 'Data Entry' } },
            { path: 'update-entry/:param', component: EntryVesselMasterComponent, data: { title: 'Update Entry' } },
            { path: 'search', component: SearchVesselMasterComponent, data: { title: 'Search' } },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class VesselImportRoutingModule { }
