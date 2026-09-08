import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UploadBankReconcil } from './bank-reconcil-uploadstatement.component';
import {UploadBankReconcilSearch} from './bank-reconcil-uploadsearch.component'
import { BankReconcilShowStatement } from './bank-reconcil-showstatement.component';
import { BankReconcilStatement } from './bank-reconcil-statement.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: ' Bank Reconcil'
        },
        children: [

                { path:'uploadStatement', component: UploadBankReconcil, data: { title: 'Upload Statement' } },
                { path:'uploadStatementsearch', component: UploadBankReconcilSearch, data: { title: 'Upload Statement Search' } },
                { path:'showStatement', component: BankReconcilShowStatement, data: { title: 'Show Statement' } },
                { path:'reconciliationStatement', component: BankReconcilStatement, data: { title: 'Reconciliation Statement' } },




        ]
    }
    ];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class uploadbankreconcilRoutingModule { }
