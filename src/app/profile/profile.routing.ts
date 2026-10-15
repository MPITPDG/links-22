import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { profileComponent } from './profile.component';
import { updatePassword} from './update-password.component'
import { ThemeSettingsComponent } from './theme/theme-settings.component';
const routes: Routes = [
  {
    path: '',
    data: {
      title: ''
    },
    children: [
      { path: '', redirectTo: 'Theme', pathMatch: 'full' },
      { path: 'Theme', component: ThemeSettingsComponent, data: { title: 'Theme' } },
      { path: 'ChangePassword', component: updatePassword, data: { title: 'Change Password' },pathMatch: 'full' },
      
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule {}
