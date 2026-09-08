import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClientOutstandingAllCityComponent } from './clientoutstanding-allcity-search.component';
import { GenActStatementLocal } from './genact-localstmt.component';
import {ClientStatusFollowup} from './clntstatus-followup.component';

const routes: Routes = [
  {
      path: '',
      data: {
          title: 'accountstatement'
      },
      children: [
          
           { path: 'Search/:PageType', component: ClientOutstandingAllCityComponent, data: { title: 'Search' } },
           { path: 'Genactstmt', component: GenActStatementLocal, data: { title: 'Gen Act Stmt' } },
           { path: 'clntstatusflp', component: ClientStatusFollowup, data: { title: 'Client status Followup' } },
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountStatementRoutingModule { }
