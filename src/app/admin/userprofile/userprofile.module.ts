import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import {NgSelectModule} from '@ng-select/ng-select';

import { UserprofileRoutingModule } from './userprofile-routing.module';
import { userprofilesearch} from './userprofile-search.component';
import {userprofilecreation} from './userprofile-creation.component';
import { NgxPaginationModule } from 'ngx-pagination';
import {UserfilerpipePipe} from '../userfilerpipe.pipe'
@NgModule({
  declarations: [userprofilesearch,userprofilecreation,UserfilerpipePipe],
  imports: [
    CommonModule,
    UserprofileRoutingModule,  FormsModule,
    TabsModule,
    CommonModule,
    MyDatePickerModule,
    NgSelectModule,NgxPaginationModule
  ] ,providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class UserprofileModule {
  
 }
