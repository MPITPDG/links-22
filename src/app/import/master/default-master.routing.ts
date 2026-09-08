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
                loadChildren: './vessel/vessel.module#VesselMasterImportModule',
            },
            {
                path: 'exchange-rate',
                loadChildren: './exchangerate/exchange-rate.module#ExchangeRateMasterImportModule',
            },
            {
                path: 'airline',
                loadChildren: './airline/airline.module#AirlineMasterImportModule',
            },
            {
                path: 'misc-job',
                loadChildren: './miscjob/misc-job.module#MiscJobMasterImportModule',
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DefaultMasterImportRoutingModule { }
