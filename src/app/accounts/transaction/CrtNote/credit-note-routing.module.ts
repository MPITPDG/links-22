import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreditNoteComponent} from './credit-note.component'
import { CreditNoteSearchComponent } from './credit-note-search.component';

const routes: Routes = [
  {
      path: '',
      data: {
          title: 'Credit-Note'
      },
      children: [
          { path: 'general/:crtno', component: CreditNoteComponent, data: { title: 'Home' } },
          { path: 'creditnotesearch', component: CreditNoteSearchComponent, data: { title: 'Search' },pathMatch :'ful' },

      ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CreditNoteRoutingModule { }
