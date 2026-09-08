import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SpecialLedger } from './specialledger.component';

const routes: Routes = [
  {
      path: '',
      data: {
          title: 'SpecialReport'
      },
      children: [
          
           { path: '', component: SpecialLedger, data: { title: '' } },
           
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SpecialReportRoutingModule { }
