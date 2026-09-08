import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { JobprofitreportComponent } from './jobprofitreport.component';
import { MawbContJobprofitComponent } from './mawb-cont-jobprofit.component';

const routes: Routes = [
  {
      path: '',
      data: {
          title: 'Job Profit'
      },
      children: [
          
           { path: 'JobProfitReport', component: JobprofitreportComponent, data: { title: 'JobProfitReport' } },
           { path: 'MawbJobProfit/:Type', component: MawbContJobprofitComponent, data: { title: 'MawbJobProfit' } },
          ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JobprofitRoutingModule { }
