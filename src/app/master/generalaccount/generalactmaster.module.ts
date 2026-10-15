import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import {NgSelectModule} from '@ng-select/ng-select';
import{generalactmasterIU} from './generalactmaster-IU.component';
import {generalactmastersearch} from './generalactmaster-search.component';
import {itemcodeIU} from './itemcode-IU.component';
import{ GeneralAccountRoutingModule } from './generalactmaster-routing.module'
import { NgxPaginationModule } from 'ngx-pagination';
import { UiButton } from '../../shared/ui/button';
@NgModule({
  declarations: [generalactmasterIU,generalactmastersearch,itemcodeIU],
  imports: [GeneralAccountRoutingModule,
    CommonModule,
     FormsModule,
    TabsModule,
    CommonModule,
    MyDatePickerModule,
    NgSelectModule,NgxPaginationModule,
    UiButton
  ] ,providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GeneralactmasterModule {
  
 }
