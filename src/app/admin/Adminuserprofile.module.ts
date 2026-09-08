import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import {NgSelectModule} from '@ng-select/ng-select';

//import { Http,   } from '@angular/http';

import { AdminRoutingModule } from './admin-routing.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AdminRoutingModule,  FormsModule,
    CommonModule,
    TabsModule.forRoot(),
    MyDatePickerModule,
    NgSelectModule
    
  ],
  providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminuserprofileModule { }
