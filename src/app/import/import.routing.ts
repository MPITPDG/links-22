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
                loadChildren: './sea/sea.module#SeaImportModule',
            },
            {
                path: 'air',
                loadChildren: './air/air.module#AirImportModule',
            },
            {
                path: 'master',
                loadChildren: './master/default-master.module#DefaultMasterImportModule',
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ImportRoutingModule { }
