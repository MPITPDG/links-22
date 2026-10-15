import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrderBookingListComponent } from './order-booking-list.component';
import { ExportMasterSearchComponent } from './expt-master-search.component';
import { ExportMasterEditComponent } from './consig_main_edit.component';
import { ConsigneeMainViewComponent } from './cong-main-view.component';
import { EditActualFlightDateComponent } from './expt-master-edit-actual-flight-date';
import { ConsgWorkspaceComponent } from './consg-workspace.component';
import { EditCo2Component } from './expt-master-edit-co2';
import {CreateJobComponent} from './consign_create.component';
import {CreateAutoJobComponent} from './consign_create_new.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Consignment'
        },
        children: [
            // The master is no longer a page of its own (MPERPNG-20 workspace): it is the
            // lower half of the workspace, which `start` renders. Old links land there.
            { path: 'main', redirectTo: 'start', pathMatch: 'full' },
            { path: 'edit', component: ExportMasterEditComponent, data: { title: 'Consignment-Edit' } },
            { path: 'view/:expt_no', component: ConsigneeMainViewComponent, data: { title: 'Consignment-View' } },
            { path: 'search', component: ExportMasterSearchComponent, data: { title: 'Export Master Search' } },
            { path: 'start', component: ConsgWorkspaceComponent, data: { title: 'Consignment' } },
            { path: 'order-booking-list', component: OrderBookingListComponent, data: { title: 'Order Booking List' } },
            { path: 'edit-actual-flight-date/:exptno', component: EditActualFlightDateComponent, data: { title: 'ETA Edit' } },
            { path: 'edit-co2/:exptno', component: EditCo2Component, data: { title: 'Co2 Edit' } },
             { path: 'AutoJob', component: CreateJobComponent, data: { title: 'Auto Job Creation' } },
             { path: 'AutoJobnew', component: CreateAutoJobComponent, data: { title: 'Auto Job Creation' } },
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExportConsignemntRoutingModule { }
