import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReprintChequeCancelChequeNoComponent } from './ReprintCheque-Cancel-ChequeNo.component';
import { RePrintChequeAssignChequeNoComponent} from './ReprintCheque-Assign-ChequeNo.component';

const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Cancel-Cheque'
    },
    children: [
        { path:'Cancel', component: ReprintChequeCancelChequeNoComponent, data: { title: 'Cancel' } },
        { path:'Reprint', component: RePrintChequeAssignChequeNoComponent, data: { title: 'Reprint' } },
       
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RePrintChequeRoutingModule { }
