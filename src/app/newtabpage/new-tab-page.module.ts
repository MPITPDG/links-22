import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { NewTabPageRoutingModule } from './new-tab-page.routing';
import { DocketPrintComponent } from './export/printdocument/docket-print.component';
import { AnnexurePageOnePrintComponent } from './export/printdocument/annexure-page-one-print.component';
import { AnnexurePageTwoPrintComponent } from './export/printdocument/annexure-page-two-print.component';
import { AnnexurePageThreePrintComponent } from './export/printdocument/annexure-page-three-print.component';
import { AnnexurePageFourPrintComponent } from './export/printdocument/annexure-page-four-print.component';
import { AnnexureItemWisePrintComponent } from './export/printdocument/annexure-item-wise-print.component';
import { AnnexureDrawbackPrintComponent } from './export/printdocument/annexure-drawback-print.component';
import { AnnexureDeecEpcgPrintComponent } from './export/printdocument/annexure-deec-epcg-print.component';
import { AnnexureDfrcPrintComponent } from './export/printdocument/annexure-dfrc-print.component';
import { ImportAirDocketPrintComponent } from './import/docket-print-air.component';
import { ImportSeaDocketPrintComponent } from './import/docket-print-sea.component';
import { DossierMainViewConsolidationComponent } from './importfra/consolidation/dossier-main-view.component';
import { DossierJobViewConsolidationComponent } from './importfra/consolidation/dossier-job-view.component';
import { printFCRPrintview,PrintMTOprintview } from './export/printdocument/printdoc-sea-housebill-view.component';
@NgModule({
    imports: [CommonModule,
        FormsModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        NewTabPageRoutingModule],
    declarations: [
        DocketPrintComponent,
        AnnexurePageOnePrintComponent,
        AnnexurePageTwoPrintComponent,
        AnnexurePageThreePrintComponent,
        AnnexurePageFourPrintComponent,
        AnnexureItemWisePrintComponent,
        AnnexureDrawbackPrintComponent,
        AnnexureDeecEpcgPrintComponent,
        AnnexureDfrcPrintComponent,
        ImportAirDocketPrintComponent,
        ImportSeaDocketPrintComponent,
        DossierMainViewConsolidationComponent,
        DossierJobViewConsolidationComponent,
        printFCRPrintview,PrintMTOprintview
    ]
})
export class NewTabPageModule { }
