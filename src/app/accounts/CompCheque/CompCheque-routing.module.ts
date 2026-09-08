import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CompChequeComponent } from './CompCheque.component';
import { FinancialYearAuthGuard } from '../../shared/guard/finanacial-year-auth-guard.service';

const routes: Routes = [
  {
    path: '',
    data: {
        title: 'CompCheque'
    },
    children: [
        { path: '', component: CompChequeComponent, data: { title: 'Home' } },
        {
            path: 'Cheque',
            loadChildren: () => import('./Cheque/Cheque.module').then(m => m.ChequeModule),
            canActivate: [FinancialYearAuthGuard],
        },
        {
          path: 'ReqBP',
          loadChildren: () => import('./ReqBP/Req-BP.module').then(m => m.ReqBpModule),
          canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'prntchque',
        loadChildren: () => import('./Chequeprint/print-cheque.module').then(m => m.printchequeModule),
        canActivate: [FinancialYearAuthGuard],
    },
    {
      path: 'ChequeRpt',
      loadChildren: () => import('./ChequeRpt/ChequeReport.module').then(m => m.ChequeReportModule),
      canActivate: [FinancialYearAuthGuard],
  },
    {
      path: 'ChequeErrorPrint',
      loadChildren: () => import('./ChequeErrorPrint/ChequeErrorPrint.module').then(m => m.ChequeErrorPrintModule),
      canActivate: [FinancialYearAuthGuard],
  },
  {
    path: 'ReprintExistingCheque',
    loadChildren: () => import('./ReprintExistingCheque/ReprintExistingCheque.module').then(m => m.ReprintExistingChequeModule),
    canActivate: [FinancialYearAuthGuard],
},
{
  path: 'RePrintCheque',
  loadChildren: () => import('./RePrintCheque/ReprintCheque.module').then(m => m.RePrintChequeModule),
  canActivate: [FinancialYearAuthGuard],
},
]
  }
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompChequeRoutingModule { }
