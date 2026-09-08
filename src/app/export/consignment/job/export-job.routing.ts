import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import{ JobComponent} from './job.component';
 
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Job'
        },
        children: [
            { path: 'job/:job-type', component: JobComponent, data: { title: 'Job' } },
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportJobRoutingModule { }