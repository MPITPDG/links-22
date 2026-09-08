import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PurchaseOEComponent } from './purchase-IUOld.component';
 

const routes: Routes = [
    {
        path: '',
        data: {
            title: ' Old Purchase'
        },
        children: [
            
             { path: 'Add/:EntryNo', component: PurchaseOEComponent, data: { title: 'Add' } },
              
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PurchaseOERoutingModule { }
