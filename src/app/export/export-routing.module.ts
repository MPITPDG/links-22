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
                path: 'Consignment',
                loadChildren: './consignment/consignment/expt-consignment-module#ExportConsignmentModule',
            },            
            {
                path: 'print-document',
                loadChildren: './printdocument/air/printdoc-air.module#ExportPrintdocaircontModule',
            },
            {
                path: 'print-documents',
                loadChildren: './printdocument/prealert/exp-prealert.module#ExportPrealertModule',
            },             
            {
                path: 'shipment-progress',
                loadChildren: './shipment_progress/expt-shipment-process.module#ExportshipmentprocessModule',
            },
            {
                path: 'shipment-progress',
                loadChildren: './epcopy/exp-epcopy-recvd.module#ExportEpcopyrecvdModule',
            },           
            {
                path: 'vessel',
                loadChildren: './vessel/expt-mst-vessel.module#ExportmstvesselModule',
            },  
            {
                path: 'mawbstock',
                loadChildren: './mawbstockmaster/mawb-stk-module#MawbStockModule',
            },         
            {
                path: 'fcr',
                loadChildren: './fcr/exp-prnt-fcr.module#ExportprntfcrModule',
            },            
            {
                path: 'container',
                loadChildren: './container/exp-sp-container.module#ExportContainerModule',
            },             
            {
                path: 'list-container',
                loadChildren: './listcontainer/container-view.module#ExportViewcontModule',
            },             
            {
                path: 'print-document',
                loadChildren: './printdocument/sea/expt-prt-mbl.module#ExportPrtMblModule',
            },
            {
                path: 'Booking',
                loadChildren: './booking/booking-module#BookingExportModule',
            },
            {
                path: 'Pss',
                loadChildren: './consignment/pss/export-pss.module#ExportPssModule',
            },
            {
                path: 'Job',
                loadChildren: './consignment/job/export-job.module#ExportJobModule',
            },
            {
                path: 'branch-job-transfer',
                loadChildren: './consignment/branchjobtransfer/branch-job-transfer.module#BranchJobTrasExportModule',
            },
            {
                path: 'print-document',
                loadChildren: './printdocument/docket/exp-docket.module#ExportdocketModule',
            },            
            {
                path: 'print-document',
                loadChildren: './printdocument/annexure/exp-annexure.module#ExportAnnexureModule',
            },
            {
                path: 'report',
                loadChildren: './report/report.module#ReportExportModule',
            },
            {
                path: 'hblupload',
                loadChildren: './hblupload/hblupload.module#HblUploadModule',
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportRoutingModule { }
