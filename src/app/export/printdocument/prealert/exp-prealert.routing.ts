import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PreAlertComponent     } from './prealert.component';

const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Prealert'
        },
        children: [
               { path: 'prealert/prepare', component: PreAlertComponent, data: { title: 'Print-Document / Prealert / Prepare' } },
            { path: 'prealert/auto', component: PreAlertComponent, data: { title: 'Print-Document / Prealert / Auto' } },
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportPrealertRoutingModule { }