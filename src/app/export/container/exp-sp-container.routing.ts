import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import{ ExptSpVesselSearch} from './exp_sp_vessel_search.component';
import { ExptSpContVslvw} from './exp_sp_container_vessel_vw.component';
import {ExptSpContainerIU} from './exp_sp_container_IU.component';
import { ExptSpContainerIUFS } from './exp_sp_factoryStuff_ContainerIU_CLP';
import { ExptSpContainerIUFSNEW } from './exp_sp_factoryStuff_ContainerIU_CLP_New';
import {DeleteContainer} from './delete_container.component'
import { FSmulticontainerIU } from './exp_fs_multicontainer_iu.component';
import { FSmulticontainerEdit } from './exp_fs_multicontainer_edit.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'container'
        },
        children: [
            { path: 'vessel-view', component: ExptSpVesselSearch, data: { title: 'Container / Vessel / Search' } },
            { path: 'container-vessel-view', component: ExptSpContVslvw, data: { title: 'Container / Vessel / Search' } },
            { path: 'form', component: ExptSpContainerIU, data: { title: 'Container / form' } },
            { path: 'clp', component: ExptSpContainerIU, data: { title: 'Container / CLP' } },
             { path: 'containerFS', component: ExptSpContainerIUFS, data: { title: 'Container / CLP' } },
            //{ path: 'containerFS', component: ExptSpContainerIUFSNEW, data: { title: 'Container / CLP' } },
            { path: 'delete', component: DeleteContainer, data: { title: 'Delete Container' } },
             { path: 'containerFSauto', component: FSmulticontainerIU, data: { title: 'Factory Stuff CLP' } },
             { path: 'multicontainerFSedit', component: FSmulticontainerEdit, data: { title: 'Factory Stuffing CLP EDIT' } },
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportcontainerRoutingModule { }