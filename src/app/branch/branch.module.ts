import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BranchComponent } from './branch.component';
import { BranchRoutingModule } from './branch-routing.module';
// Popover Component
import { PopoverModule } from 'ngx-bootstrap/popover';
@NgModule({
    imports: [CommonModule, BranchRoutingModule, PopoverModule.forRoot()],
    declarations: [
        BranchComponent
    ]
})
export class BranchModule { }
