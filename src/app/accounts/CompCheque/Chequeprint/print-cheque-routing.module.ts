import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router'; 
import { PrintChequeComponent } from './print-cheque.component';
import { ChequeReviewComponent } from './cheque-review.component';
import { ChequePreviewComponent } from './cheque-preview.component';
const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Request BP'
    },
    children: [ 
        { path:'listprintCheque', component: PrintChequeComponent, data: { title: 'List' } },
        { path:'chqreview/:entryno/:printcount/:strchequeno/:ourbank/:strvalue', component: ChequePreviewComponent, data: { title: 'Preview' } },
       // { path:'AuthList', component: ReqBPAuthListComponent, data: { title: 'AuthList' } },
    ]
}//24710170796
//SCBL0036070 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrintChequeRoutingModule { }
