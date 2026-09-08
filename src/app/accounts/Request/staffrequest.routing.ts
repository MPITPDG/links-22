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
                loadChildren: () => import('./staff/staff-purchase.module').then(m => m.staffPurchaseModule),
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
