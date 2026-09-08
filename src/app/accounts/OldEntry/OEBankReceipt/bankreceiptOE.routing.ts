import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BankReceiptOEComponent } from './bankreceipt-IUOld.component';
 

const routes: Routes = [
    {
        path: '',
        data: {
            title: ' BP'
        },
        children: [
            
             { path: 'Add/:EntryNo', component: BankReceiptOEComponent, data: { title: 'Add' } },
              
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BankReceiptOERoutingModule { }
