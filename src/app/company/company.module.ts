import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HubStepsComponent } from '../shared/hub-steps.component';
import { CompanyComponent } from './company.component';
import { CompanyRoutingModule } from './company-routing.module';
 

@NgModule({
    imports: [HubStepsComponent, CommonModule, CompanyRoutingModule
    ],
    declarations: [
       CompanyComponent
       
    ]
})
export class CompanyModule { } 