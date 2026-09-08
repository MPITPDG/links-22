import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {QuotationEntryComponent} from './quotation.component';
import{QuotationSearchComponent} from './quotation.search.component';
import{QuotRateEntryComponent} from './quot-rate-master-entry.component';
import { EnquiryPageComponent } from './enquiry.component';
import { EnquirySearchComponent } from './enquiry.search.component';
// import {QuotationDesignComponent} from './quotation.design.component';
const routes: Routes = [
    {
      path: '',
      data: {
          title: 'Master-Quotation'
      },
      children: [
        
         { path: 'QuotRate', component: QuotRateEntryComponent, data: { title: 'Quot Rate Master Entry' },pathMatch :'ful' }, 
         { path: 'Quotation/:quotationno', component: QuotationEntryComponent, data: { title: 'Quotation' },pathMatch :'ful' },
         { path: 'QuotationSearch', component: QuotationSearchComponent, data: { title: 'Quotation Search' },pathMatch :'ful' },
         { path: 'enquiry/:enquiryno', component: EnquiryPageComponent, data: { title: 'Enquiry Page' },pathMatch :'ful' },
         { path: 'enquirysearch', component: EnquirySearchComponent, data: { title: 'Enquiry Search Page' },pathMatch :'ful' },
        //  { path: 'QuotationDesign', component: QuotationDesignComponent, data: { title: 'Quotation Design' },pathMatch :'ful' },
          
           
      ]
  }
  ];
  
  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
  export class QuotationRoutingModule { }