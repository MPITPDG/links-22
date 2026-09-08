import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BankReconcilComponent } from './bank-reconcil.component';
import {BankReconcilStatementComponent  } from './bank-reconcil-rpt.component';
import { BankReconcilCashbookStatementComponent } from './bank-reconcil-cashbook-statement.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: ' Bank Reconcillation'
        },
        children: [

            { path: 'Add', component: BankReconcilComponent, data: { title: '' } },
            { path: 'Statement', component: BankReconcilStatementComponent, data: { title: '' } },
            { path: 'StatementNew', component: BankReconcilCashbookStatementComponent, data: { title: '' } },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BankReconcilRoutingModule { }
