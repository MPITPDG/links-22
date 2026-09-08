import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FinancialYearAuthGuard } from '../../shared/guard/finanacial-year-auth-guard.service';
 
const routes: Routes = [
    {
        path: '',
        data: {
            title: ' Master'
        },
        children: [
            
            {
                path: 'Reconcil',
                loadChildren: './BankReconcil/BankReconcil.module#BankReconcilModule',
                canActivate: [FinancialYearAuthGuard],
            },
                

        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ActMasterRoutingModule { }
