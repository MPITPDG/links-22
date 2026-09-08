import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AnnexureComponent } from './annexure.component';
import { AnnexureSearchComponent } from './search-annexure.component';
import { EditMenuAnnexureComponent } from './edit-menu-annexure.component';
import { EditAnnexureComponent } from './edit-annexure.component';
import { ItemDetailAnnexureComponent } from './item-detail-annexure.component';
import { DrawbackAnnexureComponent } from './drawback-annexure.component';
import { DeecEpcgAnnexureComponent } from './deec-epcg-annexure.component';
import { DfrcAnnexureComponent } from './dfrc-annexure.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'annexure'
        },
        children: [
            { path: 'annexure', component: AnnexureComponent, data: { title: 'Print-Document / Annexure' } },  
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportAnnexureRoutingModule { }