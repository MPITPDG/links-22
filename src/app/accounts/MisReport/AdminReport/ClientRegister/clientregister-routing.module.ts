import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClientRegisterComponent } from './clntreg.component';

const routes: Routes = [
  {
      path: '',
      data: {
          title: 'ClientRegister'
      },
      children: [
          
           { path: ':Type', component: ClientRegisterComponent, data: { title: '' } },
           
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientRegisterRoutingModule { }
