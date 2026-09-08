import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ExptFCRGenerate } from './exp_prt_fcr_generate.component';
import { ExptFCRPrintview, ExptMTOprintview, ExptPrintview } from './exp_prt_fcr_printview.component';
import { ExptFCRPrint, ExptMTOprint, ExptPrint } from './exp_prt_print.component';
//import { ExptfcrpPreview } from './expt_fcrppreview.component';

 
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'FCR'
        },
        children: [
             { path: 'form', component: ExptFCRGenerate, data: { title: 'FCR / Generation' } },
            { path: 'sea-bl-print-view', component: ExptPrintview, data: { title: 'FCR / Preview' } },
            { path: 'sea-bl-print', component: ExptPrint, data: { title: 'FCR / Print' } },
           // { path: 'print-preview', component: ExptfcrpPreview, data: { title: 'FCR / Print' } },
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportprntfcrRoutingModule { }