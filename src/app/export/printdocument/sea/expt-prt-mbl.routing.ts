import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
 
import { ExptMBLGenerate } from './expt_prt_mbl_generate.component';
import { Exptmblprintview } from './expt_prt_mbl_printprintview.component';
import { Exptmblprint } from './expt_prt_mbl_printprint.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'MBL'
        },
        children: [
            { path: 'sea/mbl/number', component: ExptMBLGenerate, data: { title: 'print-document / sea / mbl / number' } },
            { path: 'sea/mbl/print', component: Exptmblprintview, data: { title: 'print-document /sea / mbl/ print' } },
            { path: 'sea/mbl/finalprint', component: Exptmblprint, data: { title: 'print-document /sea /mbl / finalprint' } },
            
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportPrtMblRoutingModule { }