import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExportComponent } from './export.component';
 
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Export'
        },
        children: [
            { path: '', component: ExportComponent, data: { title: 'Home' } },
            {
                // Export > Today: job-state alerts (ported from MPERPNG-20).
                path: 'today',
                loadChildren: () => import('./today/export-today.module').then(m => m.ExportTodayModule),
            },
              {
                path: 'Consignment',
                loadChildren: () => import('./consignment/consignment/expt-consignment-module').then(m => m.ExportConsignmentModule),
            },            
            {
                path: 'print-document',
                loadChildren: () => import('./printdocument/air/printdoc-air.module').then(m => m.ExportPrintdocaircontModule),
            },
            {
                path: 'print-documents',
                loadChildren: () => import('./printdocument/prealert/exp-prealert.module').then(m => m.ExportPrealertModule),
            },             
            {
                path: 'shipment-progress',
                loadChildren: () => import('./shipment_progress/expt-shipment-process.module').then(m => m.ExportshipmentprocessModule),
            },
            {
                path: 'shipment-progress',
                loadChildren: () => import('./epcopy/exp-epcopy-recvd.module').then(m => m.ExportEpcopyrecvdModule),
            },           
            {
                path: 'vessel',
                loadChildren: () => import('./vessel/expt-mst-vessel.module').then(m => m.ExportmstvesselModule),
            },  
            {
                path: 'mawbstock',
                loadChildren: () => import('./mawbstockmaster/mawb-stk-module').then(m => m.MawbStockModule),
            },         
            {
                path: 'fcr',
                loadChildren: () => import('./fcr/exp-prnt-fcr.module').then(m => m.ExportprntfcrModule),
            },            
            {
                path: 'container',
                loadChildren: () => import('./container/exp-sp-container.module').then(m => m.ExportContainerModule),
            },             
            {
                path: 'list-container',
                loadChildren: () => import('./listcontainer/container-view.module').then(m => m.ExportViewcontModule),
            },             
            {
                path: 'print-document',
                loadChildren: () => import('./printdocument/sea/expt-prt-mbl.module').then(m => m.ExportPrtMblModule),
            },
            {
                path: 'Booking',
                loadChildren: () => import('./booking/booking-module').then(m => m.BookingExportModule),
            },
            {
                path: 'Pss',
                loadChildren: () => import('./consignment/pss/export-pss.module').then(m => m.ExportPssModule),
            },
            {
                path: 'Job',
                loadChildren: () => import('./consignment/job/export-job.module').then(m => m.ExportJobModule),
            },
            {
                path: 'branch-job-transfer',
                loadChildren: () => import('./consignment/branchjobtransfer/branch-job-transfer.module').then(m => m.BranchJobTrasExportModule),
            },
            {
                path: 'print-document',
                loadChildren: () => import('./printdocument/docket/exp-docket.module').then(m => m.ExportdocketModule),
            },            
            {
                path: 'print-document',
                loadChildren: () => import('./printdocument/annexure/exp-annexure.module').then(m => m.ExportAnnexureModule),
            },
            {
                path: 'report',
                loadChildren: () => import('./report/report.module').then(m => m.ReportExportModule),
            },
            {
                path: 'hblupload',
                loadChildren: () => import('./hblupload/hblupload.module').then(m => m.HblUploadModule),
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportRoutingModule { }
