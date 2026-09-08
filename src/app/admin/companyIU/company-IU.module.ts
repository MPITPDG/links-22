import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import {NgSelectModule} from '@ng-select/ng-select';
import {companyIU} from './company-IU.compnent'
import {companySearch} from './company-search.componet'
 import{companyIURoutingModule} from './company-IU-routing.module'
import { NgxPaginationModule } from 'ngx-pagination';
@NgModule({
  declarations: [companyIU ,companySearch],
  imports: [companyIURoutingModule,
    CommonModule,
     FormsModule,
    TabsModule,
    CommonModule,
    MyDatePickerModule,
    NgSelectModule,NgxPaginationModule
  ] ,providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CompanyIUModule {
  
 }
