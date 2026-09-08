import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { userprofilesearch} from './userprofile-search.component';
import {userprofilecreation} from './userprofile-creation.component';
const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Admin/UserProfile'
    },
    children: [
        { path: 'userprofile/:userid', component: userprofilecreation, data: { title: 'Profile' },pathMatch :'ful' },
        { path: 'ProfileSearch', component: userprofilesearch, data: { title: 'Search' },pathMatch :'ful' },
         
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserprofileRoutingModule { }
