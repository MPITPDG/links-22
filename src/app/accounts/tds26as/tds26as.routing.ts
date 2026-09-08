import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Tds26asReconcil } from './tds26as-reconcil.component';

const routes: Routes = [
    {
        path: '',
        data: {
            title: '26AS TDS Reconciliation'
        },
        children: [
            { path: 'reconcile', component: Tds26asReconcil, data: { title: '26AS TDS Reconciliation' } },
            { path: '', redirectTo: 'reconcile', pathMatch: 'full' }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class Tds26asRoutingModule { }
