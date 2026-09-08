import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import {NgSelectModule} from '@ng-select/ng-select';
import{financialYearIU} from './financialYear-IU.component';
import {financialYearsearch} from './financialYear-search.component';
// import {ClientOriginRateEntryComponent} from './client-origin-rate-entry.component';
// import{ClientOriginRateSearchComponent} from './client-origin-rate-search.component';
// import{QuotRateEntryComponent} from './quot-rate-master-entry.component';
import{ AdminAccountRoutingModule } from './adminaccount-routing.module'
import { NgxPaginationModule } from 'ngx-pagination';
import { DatePipe } from '@angular/common';
import {SharedModule} from '../../shared/shared.module';
//import { QuotationPrintComponent } from '../../windowpoppage/Account/Admin-Quotation-Print.component';
@NgModule({
  declarations: [financialYearIU,financialYearsearch],
  imports: [AdminAccountRoutingModule,
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
export class AdminAccountModule {
  
 }
