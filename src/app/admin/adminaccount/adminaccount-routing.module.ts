import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import{financialYearIU} from './financialYear-IU.component';
import {financialYearsearch} from './financialYear-search.component';
import { UserRightsAdvanceComponent } from './userrights-advance.component';
// import {ClientOriginRateEntryComponent} from './client-origin-rate-entry.component';
// import{ClientOriginRateSearchComponent} from './client-origin-rate-search.component';
// import{QuotRateEntryComponent} from './quot-rate-master-entry.component';
const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Admin-Account'
    },
    children: [
       { path: 'Financialyear/:YearId', component: financialYearIU, data: { title: 'Financial year Creation' },pathMatch: 'full' },
       { path: 'FinancialYearsearch', component: financialYearsearch, data: { title: 'Search' },pathMatch: 'full' },
       { path: 'UserRightsAdvance', component: UserRightsAdvanceComponent, data: { title: 'User Rights (Advance)' },pathMatch: 'full' },
      //  { path: 'QuotRate', component: QuotRateEntryComponent, data: { title: 'Quot Rate Master Entry' },pathMatch: 'full' }, 
      //  { path: 'ClientRate/:pkqutid', component: ClientOriginRateEntryComponent, data: { title: 'Client Origin Rate' },pathMatch: 'full' },
      //  { path: 'ClientRateSearch', component: ClientOriginRateSearchComponent, data: { title: 'Client Origin Rate Search' },pathMatch: 'full' },
      
        
         
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminAccountRoutingModule { }
