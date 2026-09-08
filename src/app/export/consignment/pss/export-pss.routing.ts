import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import{ PSSComponent} from './pss.component';
 
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Pss'
        },
        children: [
            { path: 'pss', component: PSSComponent, data: { title: 'PSS' } },
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportPssRoutingModule { }