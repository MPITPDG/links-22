import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';

import { WindowPopPageRoutingModule } from './window-pop-page.routing';
import { ExportConsignmentOrderSizeDetailComponent } from './export/order-size-detail.component';
import { InvoiceDetailsComponent } from './export/invoice-details.component';
import { CLPViewComponent } from './export/clp-view.component';
import { ChronologyViewComponent } from './export/chronology-view.component';
import { RemarkViewComponent } from './export/remark-view.component';
import { ContainerjobviewComponent } from './importfra/container-jobview.component'
import {CalCbmViewComponent } from './export/calculatecbm-view.component';
import {InvoicePrintComponent} from './Account/invoice-print.component';
import {CreditnotePrintComponent} from './Account/creditnote-print.component';
import {CreditnoteViewComponent} from './Account/creditnote-view.component';
import {InvoiceViewComponent} from './Account/invoice-view.component';
import {PurchasePrintComponent} from './Account/purchase-print.component';
import { ReqbpBillListComponent} from './Account/reqbp-bill-list.component';
import { ReqbpViewComponent } from './Account/reqbp-view.component';
import {CashBookBRPrintComponent } from './Account/CashBook-BR-print.component';
import {InvoicehistoryPurchaseprintComponent} from './Account/invoicehistory-purchaseprint.component';
import {SinglejobnoReportComponent} from './Account/singlejobno-report.component';
import { JVPrintComponent } from './Account/JV-print.component';
import { AdvanceFromClientPopUp } from './Account/advancefromclientPopUp.component';
import {ActstatAdvancePrintComponent} from './Account/actstatement-advance-Print.component';
import { JVViewComponent } from './Account/jv-view.component';
import {PurchaseViewComponent} from './Account/purchase-view.component'; 
import {srpiViewComponent} from './Account/srpi-view.component'; 
import {ConsigneeViewComponent} from './Account/consign-view.component';
import {QuotationPrintComponent } from './Account/Admin-Quotation-Print.component';
import {ProformaInvoicePrintComponent} from './Account/proformainvoice-print.component';
import {QuoteSeaPrintComponent} from './Quotation/quote-sea-print.component';
import {SalesQuotationPrintComponent} from './Quotation/quotation-print.component';
import {QuoteAirPrintComponent} from './Quotation/quote-air-print.component';
// import { ExportConsignmentOrderSizeDetailComponent } from './export/order-size-detail.component';
// import { InvoiceDetailsComponent } from './export/invoice-details.component';
// import { CLPViewComponent } from './export/clp-view.component';
// import { ChronologyViewComponent } from './export/chronology-view.component';
// import { RemarkViewComponent } from './export/remark-view.component';
// import { ContainerjobviewComponent } from './importfra/container-jobview.component'
// import {CalCbmViewComponent } from './export/calculatecbm-view.component';
@NgModule({
    imports: [CommonModule,
        FormsModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        WindowPopPageRoutingModule],
    declarations: [
        ExportConsignmentOrderSizeDetailComponent,
        InvoiceDetailsComponent,
        CLPViewComponent,
        ChronologyViewComponent,
        RemarkViewComponent,
        ContainerjobviewComponent,
        CalCbmViewComponent,
        InvoicePrintComponent,
        CreditnotePrintComponent,
        CreditnoteViewComponent,InvoiceViewComponent,PurchasePrintComponent,
        ReqbpBillListComponent,ReqbpViewComponent,
        CashBookBRPrintComponent, InvoicehistoryPurchaseprintComponent,
        SinglejobnoReportComponent,JVPrintComponent,
        AdvanceFromClientPopUp,ActstatAdvancePrintComponent,JVViewComponent,
        PurchaseViewComponent,srpiViewComponent,ConsigneeViewComponent,QuotationPrintComponent,
        ProformaInvoicePrintComponent,QuoteSeaPrintComponent,SalesQuotationPrintComponent,QuoteAirPrintComponent
    ]
})
export class WindowPopPageModule { }
