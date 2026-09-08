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
            loadChildren: './userprofile/userprofile.module#UserprofileModule',
        },       
        {
            path: 'company',
            loadChildren: './companyIU/company-IU.module#CompanyIUModule',
        },       
        {
            path: 'financialyear',
            loadChildren: './adminaccount/adminaccount.module#AdminAccountModule',
        },   
        {
            path: 'Adminacct',
            loadChildren: './adminaccount/adminaccount.module#AdminAccountModule',
        }, 
    ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
