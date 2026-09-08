import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BankPaymentComponent } from './bankpayment-IU.component';
 

const routes: Routes = [
    {
        path: '',
        data: {
            title: ' BP'
        },
        children: [
            
             { path: 'Add/:EntryNo', component: BankPaymentComponent, data: { title: 'Add' } },
              
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BankPaymentRoutingModule { }
