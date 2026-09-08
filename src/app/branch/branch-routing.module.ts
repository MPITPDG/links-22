import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BranchComponent } from './branch.component';

const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Branch'
    },
    children: [
      {
        path: '',
        component: BranchComponent,
        data: {
          title: 'Branch'
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BranchRoutingModule {}
