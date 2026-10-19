import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HubStepsComponent } from '../shared/hub-steps.component';
import { BranchComponent } from './branch.component';
import { BranchRoutingModule } from './branch-routing.module';
// Popover Component
import { PopoverModule } from 'ngx-bootstrap/popover';
@NgModule({
    imports: [HubStepsComponent, CommonModule, BranchRoutingModule, PopoverModule],
    declarations: [
        BranchComponent
    ]
})
export class BranchModule { }
