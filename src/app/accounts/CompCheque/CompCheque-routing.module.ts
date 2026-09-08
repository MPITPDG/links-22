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
            loadChildren: './Cheque/Cheque.module#ChequeModule',
            canActivate: [FinancialYearAuthGuard],
        },
        {
          path: 'ReqBP',
          loadChildren: './ReqBP/Req-BP.module#ReqBpModule',
          canActivate: [FinancialYearAuthGuard],
      },
      {
        path: 'prntchque',
        loadChildren: './Chequeprint/print-cheque.module#printchequeModule',
        canActivate: [FinancialYearAuthGuard],
    },
    {
      path: 'ChequeRpt',
      loadChildren: './ChequeRpt/ChequeReport.module#ChequeReportModule',
      canActivate: [FinancialYearAuthGuard],
  },
    {
      path: 'ChequeErrorPrint',
      loadChildren: './ChequeErrorPrint/ChequeErrorPrint.module#ChequeErrorPrintModule',
      canActivate: [FinancialYearAuthGuard],
  },
  {
    path: 'ReprintExistingCheque',
    loadChildren: './ReprintExistingCheque/ReprintExistingCheque.module#ReprintExistingChequeModule',
    canActivate: [FinancialYearAuthGuard],
},
{
  path: 'RePrintCheque',
  loadChildren: './RePrintCheque/ReprintCheque.module#RePrintChequeModule',
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
