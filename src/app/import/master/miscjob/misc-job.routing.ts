import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MiscJobMasterImportComponent } from './misc-job.component';
import { EntryMiscJobMasterComponent } from './data-entry.component';
import { SearchMiscJobMasterComponent } from './search.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Vessel'
        },
        children: [
            { path: '', component: MiscJobMasterImportComponent, data: { title: 'Home' } },
            { path: 'data-entry', component: EntryMiscJobMasterComponent, data: { title: 'Data Entry' } },
            { path: 'update-entry/:param', component: EntryMiscJobMasterComponent, data: { title: 'Update Entry' } },
            { path: 'search', component: SearchMiscJobMasterComponent, data: { title: 'Search' } },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MiscJobImportRoutingModule { }
