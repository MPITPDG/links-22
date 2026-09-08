import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ImportInfoComponent } from './import-i.component';
import { IncotermImportComponent } from './incoterm-i.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Import'
        },
        children: [
            { path: '', component: ImportInfoComponent, data: { title: 'Home' } },
            { path: 'incoterm-information', component: IncotermImportComponent, data: { title: 'Home' } },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ImportInfoRoutingModule { }
