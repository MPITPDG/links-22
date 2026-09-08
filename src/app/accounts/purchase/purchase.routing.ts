import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
//import { GeneralComponent } from './general/general.component';
import { PurchaseGeneralComponent } from './purchase-general.component';
import { PurchaseSearchComponent } from './purchase-search.component';
import {MulticontainerPurchaseComponent} from './multicontainer-purchase.component';
import {MAWBPurchaseComponent} from './mawb-purchase.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Purchase'
        },
        children: [//Status : PI/RPI ,Type :1- GENARAL PI,2-MAWB PI ,3 MUTICONTAINER PI
            { path: 'Purchase/:Status/:Type/:PurchaseNo', component: PurchaseGeneralComponent, data: { title: 'Add' } },
            { path: 'PurchaseSearch/:Status', component: PurchaseSearchComponent, data: { title: 'Search' } },
            { path: 'multicontainer/:Status/:Type/:PurchaseNo', component: MulticontainerPurchaseComponent, data: { title: 'Add' } },
            { path: 'mawb/:Status/:Type/:PurchaseNo', component: MAWBPurchaseComponent, data: { title: 'Add' } },
            // { path: 'Purchase/Status/Type/:PurchaseNo', component: PurchaseGeneralComponent, data: { title: 'Add' } },
           
            ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PurchaseRoutingModule { }
