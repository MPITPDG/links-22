import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
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
const routes: Routes = [
  {
    path: '',
    data: {
      title: 'New Tab Popup'
    },
    children: [
      { path: 'docket-print/:exptno', component: DocketPrintComponent, data: { title: 'Docket Print' } },
      { path: 'annexure-page-one-print/:exptno/:citycode', component: AnnexurePageOnePrintComponent, data: { title: 'Annexure Print Page One' } },
      { path: 'annexure-page-two-print/:exptno/:citycode', component: AnnexurePageTwoPrintComponent, data: { title: 'Annexure Print Page Two' } },
      { path: 'annexure-page-three-print/:exptno/:citycode', component: AnnexurePageThreePrintComponent, data: { title: 'Annexure Print Page Three' } },
      { path: 'annexure-page-four-print/:exptno/:citycode', component: AnnexurePageFourPrintComponent, data: { title: 'Annexure Print Page Four' } },
      { path: 'annexure-item-wise-print/:exptno/:citycode', component: AnnexureItemWisePrintComponent, data: { title: 'Annexure Item Wise Four' } },
      { path: 'annexure-drawback-print/:exptno/:citycode', component: AnnexureDrawbackPrintComponent, data: { title: 'Annexure Drawback Four' } },
      { path: 'annexure-dfrc-print/:exptno/:citycode', component: AnnexureDfrcPrintComponent, data: { title: 'Annexure Dfrc Four' } },
      { path: 'annexure-deec-epcg-print/:exptno/:citycode', component: AnnexureDeecEpcgPrintComponent, data: { title: 'Annexure Deec Epcg Four' } },
      { path: 'import-air-docket-print/:importcode', component: ImportAirDocketPrintComponent, data: { title: 'Import Air Docket Print' } },
      { path: 'import-sea-docket-print/:importcode', component: ImportSeaDocketPrintComponent, data: { title: 'Import Sea Docket Print' } },
      { path: 'importfra-dossier-print/:param', component: DossierMainViewConsolidationComponent, data: { title: 'Import Dossier Main Print' } },
      { path: 'importfra-dossier-job-print/:param', component: DossierJobViewConsolidationComponent, data: { title: 'Import Dossier Job Print' } },
      { path: 'FCRpreview/:FCRNO/:FcrType', component: printFCRPrintview, data: { title: 'FCR Preview' } },
     { path: 'MTOpreview/:FCRNO/:FcrType', component: PrintMTOprintview, data: { title: ' MTO Preview' } },
 
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NewTabPageRoutingModule {}
