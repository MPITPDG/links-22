import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BankPaymentOEComponent } from './bankpayment-IUOld.component';
 

const routes: Routes = [
    {
        path: '',
        data: {
            title: ' BP'
        },
        children: [
            
             { path: 'Add/:EntryNo', component: BankPaymentOEComponent, data: { title: 'Add' } },
              
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BankPaymentOERoutingModule { }
