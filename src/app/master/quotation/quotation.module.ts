import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
//import { NgxMyDatePickerModule } from 'ngx-mydatepicker';
import { MyDatePickerModule } from 'mydatepicker';

import {NgSelectModule} from '@ng-select/ng-select';
import {QuotationEntryComponent} from './quotation.component';
import{QuotationSearchComponent} from './quotation.search.component';
import{QuotRateEntryComponent} from './quot-rate-master-entry.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { DatePipe } from '@angular/common';
import {SharedModule} from '../../shared/shared.module';
import{ QuotationRoutingModule } from './quotation.routing'
import { EnquiryPageComponent } from './enquiry.component';
import { ReactiveFormsModule } from '@angular/forms';
import { EnquirySearchComponent } from './enquiry.search.component';
// import {QuotationDesignComponent} from './quotation.design.component';
@NgModule({
    declarations: [EnquirySearchComponent,QuotationEntryComponent,QuotationSearchComponent,QuotRateEntryComponent, EnquiryPageComponent],
    imports: [QuotationRoutingModule,ReactiveFormsModule,
      CommonModule,
       FormsModule,
      TabsModule,
      CommonModule,SharedModule,
      MyDatePickerModule,
      NgSelectModule,NgxPaginationModule
    ] ,providers: [DatePipe
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
  })
  export class QuotationModule {
    
   }
  