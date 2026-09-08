import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {ExportConsignmentOrderSizeDetailComponent} from './export/order-size-detail.component';
import { InvoiceDetailsComponent } from './export/invoice-details.component';
import { CLPViewComponent } from './export/clp-view.component';
import { ChronologyViewComponent } from './export/chronology-view.component';
import { RemarkViewComponent } from './export/remark-view.component';
import { ContainerjobviewComponent } from './importfra/container-jobview.component';
import {CalCbmViewComponent } from './export/calculatecbm-view.component';
import { InvoicePrintComponent } from './Account/invoice-print.component';
import { InvoiceViewComponent } from './Account/invoice-view.component';
import { CreditnoteViewComponent } from './Account/creditnote-view.component';
import { CreditnotePrintComponent } from './Account/creditnote-print.component';
import { PurchasePrintComponent } from './Account/purchase-print.component';
import { CashBookBRPrintComponent } from './Account/CashBook-BR-print.component';
import { ReqbpViewComponent } from './Account/reqbp-view.component';
import { ReqbpBillListComponent } from './Account/reqbp-bill-list.component';
import { SinglejobnoReportComponent } from './Account/singlejobno-report.component';
import { InvoicehistoryPurchaseprintComponent } from './Account/invoicehistory-purchaseprint.component';
import { JVPrintComponent } from './Account/JV-print.component';
import { AdvanceFromClientPopUp } from './Account/advancefromclientPopUp.component';
import {ActstatAdvancePrintComponent} from './Account/actstatement-advance-Print.component';
import { JVViewComponent } from './Account/jv-view.component';
import {PurchaseViewComponent} from './Account/purchase-view.component';
import {srpiViewComponent} from './Account/srpi-view.component'; 
import {ConsigneeViewComponent} from './Account/consign-view.component';
import {QuotationPrintComponent } from './Account/Admin-Quotation-Print.component';
import { ProformaInvoicePrintComponent } from './Account/proformainvoice-print.component';
import {QuoteSeaPrintComponent} from './Quotation/quote-sea-print.component';
import {SalesQuotationPrintComponent} from './Quotation/quotation-print.component';
import {QuoteAirPrintComponent} from './Quotation/quote-air-print.component';
const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Window Popup'
    },
    children: [
      // { path: 'order-size-detail/:exptno/:orderno/:styleno/:concode', component: ExportConsignmentOrderSizeDetailComponent, data: { title: 'Order Size Detail' } },
      // { path: 'consignment-exporter-invoice-detail/:exptno', component: InvoiceDetailsComponent, data: { title: 'Exporter Invoice Detail' } },
      // { path: 'consignment-clp-view/:exptno/:containerno/:vessel', component: CLPViewComponent, data: { title: 'Clp View' } },
      // { path: 'consignment-chronology-view/:exptno', component: ChronologyViewComponent, data: { title: 'Chronology View' } },
      // { path: 'consignment-remark-view/:exptno', component: RemarkViewComponent, data: { title: 'Remark View' } },
      // { path: 'console-containerjob-view/:containerno/:consoleno', component: ContainerjobviewComponent, data: { title: 'Container Job View' } },
      // { path: 'consignment-calcbm-view/:exptno', component: CalCbmViewComponent, data: { title: 'Calculate CBM View' } },
      { path: 'order-size-detail/:exptno/:orderno/:styleno/:concode', component: ExportConsignmentOrderSizeDetailComponent, data: { title: 'Order Size Detail' } },
      { path: 'consignment-exporter-invoice-detail/:exptno', component: InvoiceDetailsComponent, data: { title: 'Exporter Invoice Detail' } },
      { path: 'consignment-clp-view/:exptno/:containerno/:vessel', component: CLPViewComponent, data: { title: 'Clp View' } },
      { path: 'consignment-chronology-view/:exptno', component: ChronologyViewComponent, data: { title: 'Chronology View' } },
      { path: 'consignment-remark-view/:exptno', component: RemarkViewComponent, data: { title: 'Remark View' } },
      { path: 'console-containerjob-view/:containerno/:consoleno', component: ContainerjobviewComponent, data: { title: 'Container Job View' } },
      { path: 'consignment-calcbm-view/:exptno', component: CalCbmViewComponent, data: { title: 'Calculate CBM View' } },
      { path: 'Account-Invoice-print/:InvNo', component: InvoicePrintComponent, data: { title: 'Invoice Print' } },
      { path: 'Account-Invoice-View/:InvNo', component: InvoiceViewComponent, data: { title: 'Invoice View' } },
      { path: 'Account-CreditNote-View/:CrtNo', component: CreditnoteViewComponent, data: { title: 'CreditNote View' } },
      { path: 'Account-CreditNote-print/:CrtNo', component: CreditnotePrintComponent, data: { title: 'CreditNote Print' } },
      { path: 'Account-Purchase-print/:SuppNo/:Status', component: PurchasePrintComponent, data: { title: 'Purchase Print' } },
      { path: 'Account-CashBook-BankReceipt-print/:Type/:BrNo', component: CashBookBRPrintComponent, data: { title: 'CashBook-Bank Receipt' } },
      { path: 'Account-Request-Bank-Payment-print/:EntryNo', component: ReqbpViewComponent, data: { title: 'View Request Bank Payment' } },
      { path: 'Account-Request-BP-Bill-List/:BillNo', component: ReqbpBillListComponent, data: { title: 'Bank Payment- Bill List' } },
      { path: 'Account-Job-Profit-Report/:jobno', component: SinglejobnoReportComponent, data: { title: 'Job Profit Report' } },
      { path: 'Account-PurchasePrint-InvoiceHistory/:entryno', component: InvoicehistoryPurchaseprintComponent, data: { title: 'Invoice History-Purchase Print' } },
      { path: 'Account-JV-Print/:entryno/:Type', component: JVPrintComponent, data: { title: 'Journal Voucher  Print' } },
      { path: 'Account-AdvRecfrmClient/:ADVJOBNO', component: AdvanceFromClientPopUp, data: { title: 'ADVANCE FROM CLIENTS' } },
      { path: 'Account-actstatement-AdvancePrint/:clientcd/:clientnm/:fromdate/:todate/:status', component: ActstatAdvancePrintComponent, data: { title: ' Advance Print' } },
      { path: 'Account-JV-View/:entryno', component: JVViewComponent, data: { title: 'Journal Voucher  View' } },
      { path: 'Account-Purchase-View/:PurchaseNo/:Status', component: PurchaseViewComponent, data: { title: 'Purchase View' } },
      { path: 'Account-SRPI-View/:pur_code/:flag/:authstatus', component: srpiViewComponent, data: { title: ' SRPI View' } },
      { path: 'Export-Consignment-view/:expt_no', component: ConsigneeViewComponent, data: { title: 'Consignment View' } },
      { path: 'Admin-Quotation-Print/:QuotNo', component: QuotationPrintComponent, data: { title: 'Quotation Print' } },
      { path: 'Account-ProformaInvoice-Print/:InvNo', component: ProformaInvoicePrintComponent, data: { title: 'Proforma Invoice Print' } },
        { path: 'Sea-Quotationprint/:quotno', component: QuoteSeaPrintComponent, data: { title: 'Sea Quotation Print' } },
      { path: 'Wisor-Quotationprint/:quotno', component: SalesQuotationPrintComponent, data: { title: 'Wisor Quotation Print' } },
      { path: 'Air-Quotationprint/:quotno', component: QuoteAirPrintComponent, data: { title: 'Air Quotation Print' } },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WindowPopPageRoutingModule {}
