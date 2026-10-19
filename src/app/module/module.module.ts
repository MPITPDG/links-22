import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HubStepsComponent } from '../shared/hub-steps.component';
import { ModuleComponent } from './module.component';
import { ModulesRoutingModule } from './module-routing.module';

@NgModule({
    imports: [HubStepsComponent, ModulesRoutingModule, CommonModule],
  declarations: [
    ModuleComponent
  ]
})
export class ModulesModule { }
