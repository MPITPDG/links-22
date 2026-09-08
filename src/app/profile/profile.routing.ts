import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { profileComponent } from './profile.component';
import { updatePassword} from './update-password.component'
const routes: Routes = [
  {
    path: '',
    data: {
      title: ''
    },
    children: [
      {path: '', component: profileComponent, data: { title: 'Home' }},
      { path: 'ChangePassword', component: updatePassword, data: { title: 'Change Password' },pathMatch :'ful' },
      
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule {}
