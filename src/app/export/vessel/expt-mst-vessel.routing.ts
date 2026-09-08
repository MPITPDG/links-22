import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VesselMstComponent } from './exp_mst_vessel_iu.component';
import { VesselSearchComponent } from './exp_mst_vessel_search.component';

const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Vessel'
        },
        children: [
             { path: 'form', component: VesselMstComponent, data: { title: 'Vessel' } },
             { path: 'search', component: VesselSearchComponent, data: { title: 'Vessel / Search' } },
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportmstvesselRoutingModule { }