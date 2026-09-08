import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdvanceFromClient } from './advancefromclient.component';

const routes: Routes = [
  {
      path: '',
      data: {
          title: 'AdvanceFromClient'
      },
      children: [
          
           { path: '', component: AdvanceFromClient, data: { title: '' } },
           
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdvanceFromClientRoutingModule { }
