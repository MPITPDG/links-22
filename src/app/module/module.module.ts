import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleComponent } from './module.component';
import { ModulesRoutingModule } from './module-routing.module';

@NgModule({
    imports: [ModulesRoutingModule, CommonModule ],
  declarations: [
    ModuleComponent
  ]
})
export class ModulesModule { }
