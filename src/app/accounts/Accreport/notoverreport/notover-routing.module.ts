import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NotOverReport } from './cashbooknotover-list.component';

const routes: Routes = [
  {
      path: '',
      data: {
          title: 'NotOverReport'
      },
      children: [
          
           { path: '', component: NotOverReport, data: { title: '' } },
           
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotOverRoutingModules { }
