import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import{ BranchJobTransferComponent} from './branch-job-transfer.component';
 
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Branchjobtransfer'
        },
        children: [
            { path: 'branch-job-transfer', component: BranchJobTransferComponent, data: { title: 'Branch Job Transfer' } },
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BranchJobTrasExportRoutingModule { }