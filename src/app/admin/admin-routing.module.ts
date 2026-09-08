import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Admin'
    },
    children: [
       
        {
            path: 'admin',
            loadChildren: () => import('./userprofile/userprofile.module').then(m => m.UserprofileModule),
        },       
        {
            path: 'company',
            loadChildren: () => import('./companyIU/company-IU.module').then(m => m.CompanyIUModule),
        },       
        {
            path: 'financialyear',
            loadChildren: () => import('./adminaccount/adminaccount.module').then(m => m.AdminAccountModule),
        },   
        {
            path: 'Adminacct',
            loadChildren: () => import('./adminaccount/adminaccount.module').then(m => m.AdminAccountModule),
        }, 
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
