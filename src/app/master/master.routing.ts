import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MasterComponent } from './master.component';
 
 
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Master'
        },
        children: [
            {
                path: '',component: MasterComponent,data: { title: 'Home'}
            },
            {
                path: 'request',
                loadChildren: './request/request.module#RequestModules',
            },
           
            {
                path: 'city',
                loadChildren: './Mst_city/Mst_city.module#Mst_citymodule',
            },

            {
                path: 'common',
                loadChildren: './common/commonRoute.module#CommonRoutingModules',
            },
            {
                path: 'generalaccount',
                loadChildren: './generalaccount/generalactmaster.module#GeneralactmasterModule',
               // path: 'MasterAccount',
               // loadChildren: './MasterAccount/MasterAccount.module#GeneralactmasterModule',
              
           },
           {
            path: 'quotation',
            loadChildren: './quotation/quotation.module#QuotationModule',
         
              },
        ]
    }
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MasterRoutingModule { }
