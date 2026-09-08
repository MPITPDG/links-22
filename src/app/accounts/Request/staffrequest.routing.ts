import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FinancialYearAuthGuard } from '../../shared/guard/finanacial-year-auth-guard.service';
 
const routes: Routes = [
    {
        path: '',
        data: {
            title: ' Request'
        },
        children: [
            {
                path: 'staff',
                loadChildren: './staff/staff-purchase.module#staffPurchaseModule',
                canActivate: [FinancialYearAuthGuard],
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RequestRoutingModule { }
