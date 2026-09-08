import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MAWBFRT } from './netfrt.component';
const routes: Routes = [
  {
    path: '',
    data: {
        title: 'MAWB FRT RATE'
    },
    children: [
        { path:'MAWB', component: MAWBFRT, data: { title: 'MAWB FRT RATE' } },
       
     ],
        
}
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MAWBFRTRoutingModule { }
