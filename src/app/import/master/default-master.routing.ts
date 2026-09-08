import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MasterImportComponent } from './default-master.component';

const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Master'
        },
        children: [
            { path: '', component: MasterImportComponent, data: { title: 'Home' } },
            {
                path: 'vessel',
                loadChildren: () => import('./vessel/vessel.module').then(m => m.VesselMasterImportModule),
            },
            {
                path: 'exchange-rate',
                loadChildren: () => import('./exchangerate/exchange-rate.module').then(m => m.ExchangeRateMasterImportModule),
            },
            {
                path: 'airline',
                loadChildren: () => import('./airline/airline.module').then(m => m.AirlineMasterImportModule),
            },
            {
                path: 'misc-job',
                loadChildren: () => import('./miscjob/misc-job.module').then(m => m.MiscJobMasterImportModule),
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DefaultMasterImportRoutingModule { }
