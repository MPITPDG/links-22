import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';

import {ExportcontainerRoutingModule} from './exp-sp-container.routing';
import{ ExptSpVesselSearch,} from './exp_sp_vessel_search.component';
import { ExptSpContVslvw} from './exp_sp_container_vessel_vw.component';
import {ExptSpContainerIU} from './exp_sp_container_IU.component';
import { ExptSpContainerIUFS } from './exp_sp_factoryStuff_ContainerIU_CLP';
import { ExptSpContainerIUFSNEW } from './exp_sp_factoryStuff_ContainerIU_CLP_New';
import {DeleteContainer} from './delete_container.component'
import { FSmulticontainerIU } from './exp_fs_multicontainer_iu.component';
import { FSmulticontainerEdit } from './exp_fs_multicontainer_edit.component';
@NgModule({
    imports: [ExportcontainerRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        ModalModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule],
    declarations: [FSmulticontainerIU,FSmulticontainerEdit,ExptSpVesselSearch,ExptSpContVslvw ,ExptSpContainerIU,ExptSpContainerIUFS,ExptSpContainerIUFSNEW,DeleteContainer],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExportContainerModule { }