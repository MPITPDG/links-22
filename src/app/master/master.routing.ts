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
                loadChildren: () => import('./request/request.module').then(m => m.RequestModules),
            },
           
            {
                path: 'city',
                loadChildren: () => import('./Mst_city/Mst_city.module').then(m => m.Mst_citymodule),
            },

            {
                path: 'common',
                loadChildren: () => import('./common/commonRoute.module').then(m => m.CommonRoutingModules),
            },
            {
                path: 'generalaccount',
                loadChildren: () => import('./generalaccount/generalactmaster.module').then(m => m.GeneralactmasterModule),
               // path: 'MasterAccount',
               // loadChildren: () => import('./MasterAccount/MasterAccount.module').then(m => m.GeneralactmasterModule),
              
           },
           {
            path: 'quotation',
            loadChildren: () => import('./quotation/quotation.module').then(m => m.QuotationModule),
         
              },
        ]
    }
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MasterRoutingModule { }
