import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AIRFREIGHT } from './invpurchase.component';


const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Air Freight '
    },
    children: [
         { path:':Mode', component: AIRFREIGHT, data: { title: '' } },
        // { path:'act/CSList', component: ClientSupplierActWiseList, data: { title: 'ActwiseList' } }
     ],
     
     
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AirFreightRoutingModule { }
