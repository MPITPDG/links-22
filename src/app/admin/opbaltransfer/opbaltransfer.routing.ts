import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OpBalTransfer } from './opbaltransfer.component';

const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Opening Balance Carry Forward'
        },
        children: [
            { path: 'transfer', component: OpBalTransfer, data: { title: 'Opening Balance Carry Forward' } },
            { path: '', redirectTo: 'transfer', pathMatch: 'full' }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OpBalTransferRoutingModule { }
