import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {
    PrintDocumentMawbComponent,
    PrintDocumentMawbListComponent,PrintDocumentMawbSearchComponent} from './mawb.component';
import { PrintDocumentMawbUpdateComponent } from "./PrintDocumentMawbUpdateComponent";
import {
    PrintDocumentHawbComponent,
    PrintDocumentHawbUpdateComponent,
    PrintDocumentHawbSearchComponent,
    PrintDocumentHawbListComponent
} from './hawb.component';

import {PrintDocumentHawbprintupdateComponent} from './hawb-printupdate.component';
import { PrintDocumentMawbprintupdateComponent } from './mawb-printupdate.component';
import { PrintDocumentMawbfinalprint } from './mawb-final-print.component';

//import {MAWBTarifratingcomponent} from './Mawb_Tarifrating.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Print-doc-air'
        },
        children: [
            { path: 'air/mawb', component: PrintDocumentMawbComponent, data: { title: 'Print-Document / air / mawb' } },
            { path: 'air/hawb/number', component: PrintDocumentHawbComponent, data: { title: 'Print-Document / air / hawb / list' } },
            { path: 'air/hawb/search', component: PrintDocumentHawbComponent, data: { title: 'Print-Document / air / hawb / search or print' } },
            { path: 'air/air-print-update/:param',component: PrintDocumentHawbprintupdateComponent, data: { title:'print-document /air /hawb / printupdate '}},
            { path: 'air/air-Mawbprint-update/:param',component: PrintDocumentMawbprintupdateComponent, data: { title:'print-document /air /mawb / printupdate '}},
            { path: 'air/air-Mawbprint/:param',component: PrintDocumentMawbfinalprint, data: { title:'print-document /air /mawb / print '}},
            { path: 'air/mawb/search', component: PrintDocumentMawbComponent, data: { title: 'Print-Document / air / mawb / search or print' } },
            { path: 'air/mawb/number', component: PrintDocumentMawbComponent, data: { title: 'Print-Document / air / mawb / Generate' } },
            //{ path: 'air/air-Mawbprint/TarifRate/:exptno',component: MAWBTarifratingcomponent, data: { title:'print-document /air /mawb /  '}},


        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportprintodcairRoutingModule { }