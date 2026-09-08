import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { JournalVoucherOEComponent } from './journalvoucher-IUOld.component';
 

const routes: Routes = [
    {
        path: '',
        data: {
            title: ' Old JV'
        },
        children: [
            
             { path: 'Add/:EntryNo', component: JournalVoucherOEComponent, data: { title: 'Add' } },
              
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class JVOERoutingModule { }
