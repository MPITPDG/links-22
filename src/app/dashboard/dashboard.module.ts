import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ExportDashboardService } from '../export/dashboard/export-dashboard.service';

/**
 * /dashboard: the Export module's landing page (ported from MPERPNG-20).
 *
 * This used to be a CoreUI demo page whose charts were filled with
 * Math.random() and which made no HTTP calls at all. It is now the export job
 * board, backed by Export/EXPT_EXPORT_DASHBOARD_Board and the branch vessel
 * list, and it replaces the V8 export home (export/home) that /export embedded.
 *
 * NgChartsModule and BsDropdownModule are gone with the demo markup that used
 * them; SharedModule brings the UI kit.
 */
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    DashboardRoutingModule,
    SharedModule,
  ],
  declarations: [DashboardComponent],
  providers: [ExportDashboardService],
})
export class DashboardModule { }
