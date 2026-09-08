import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ImportComponent } from './import.component';

const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Import'
        },
        children: [
            { path: '', component: ImportComponent, data: { title: 'Home' } },
            {
                path: 'sea',
                loadChildren: () => import('./sea/sea.module').then(m => m.SeaImportModule),
            },
            {
                path: 'air',
                loadChildren: () => import('./air/air.module').then(m => m.AirImportModule),
            },
            {
                path: 'master',
                loadChildren: () => import('./master/default-master.module').then(m => m.DefaultMasterImportModule),
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ImportRoutingModule { }
