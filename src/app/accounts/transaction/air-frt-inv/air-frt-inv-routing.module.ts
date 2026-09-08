import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InvoiceprintComponent } from './invoiceprint.component';
import { InvoiceprintTabsComponent } from './invoiceprint-tabs.component';
import { InvoicehistoryComponent } from './invoicehistory.component';

const routes: Routes = [
  {
      path: '',
      data: {
          title: 'Air Freight Invoice'
      },
      children: [
          { path: 'airfrtinvoiceList', component: InvoiceprintComponent, data: { title: 'Air Freight Invoice' } ,pathMatch: 'full'},
          { path: 'airfrtinvoice-detailstab/:ID', component: InvoiceprintTabsComponent, data: { title: 'Air Freight Invoice TABs' } ,pathMatch: 'full'},
          { path: 'airfrtInvoiceHistory', component: InvoicehistoryComponent, data: { title: 'Air Freight Invoice History' } ,pathMatch: 'full'},

        ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AirFrtInvRoutingModule { }
