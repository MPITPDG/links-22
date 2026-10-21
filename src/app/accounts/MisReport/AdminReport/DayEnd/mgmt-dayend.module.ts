import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../../shared/shared.module';
import { MgmtDayEndComponent } from './mgmt-dayend.component';

const routes: Routes = [
    {
        path: '',
        data: { title: 'Management Day-End' },
        children: [
            { path: 'dashboard', component: MgmtDayEndComponent, data: { title: 'Management Day-End' } }
        ]
    }
];

@NgModule({
    declarations: [MgmtDayEndComponent],
    imports: [
        CommonModule,
        FormsModule,
        NgSelectModule,
        SharedModule,
        RouterModule.forChild(routes)
    ]
})
export class MgmtDayEndModule { }
