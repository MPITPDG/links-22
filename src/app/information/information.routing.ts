import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InformationComponent } from './information.component';

const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Information'
        },
        children: [
            { path: '', component: InformationComponent, data: { title: 'Home' } },
            {
                path: 'import',
                loadChildren: () => import('./import/import-i.module').then(m => m.ImportInfoModule),
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class InformationRoutingModule { }
