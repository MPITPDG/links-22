import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StaffPurchaseComponent } from './staffpurchase_IU.component';
import { StaffPurchaseSearchComponent } from './staffpurchase_search.component';
import { StaffPurchaseAuth } from './staffpurchase-Auth.component';
import {ReqSRPGenerateComponent} from './staffpur-GenCode.component';
import {staffpurchaseViewComponent} from './staffpurchase-view.component';

const routes: Routes = [
    {
        path: '',
        data: {
            title: ' Staff'
        },
        children: [
            
            { path: 'StaffPurchaseReq/:EntryNo', component: StaffPurchaseComponent, data: { title: 'Add' } },
             { path: 'Search', component: StaffPurchaseSearchComponent, data: { title: 'Search' } },
             { path: 'auth/:Status', component: StaffPurchaseAuth, data: { title: 'Auth' } },
             { path: 'Generate/:Status', component: ReqSRPGenerateComponent, data: { title: 'Generate' } },
            { path: 'SRPIView/:pur_code/:flag/:authstatus', component: staffpurchaseViewComponent, data: { title: ' Staff Purchase View' } }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class staffPurchaseRoutingModule { }
