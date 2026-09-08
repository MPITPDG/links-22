import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { listcontainer} from './export-list-container.component'

const routes: Routes = [
    {
        path: '',
        data: {
            title: 'View-Container'
        },
        children: [
            { path: 'container', component: listcontainer, data: { title: 'list-container / container' } },
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportViewcontRoutingModule { }