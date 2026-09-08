import { NgModule } from '@angular/core';
import { P404Component } from './404.component';
import { ErrorRoutingModule } from './error-routing.module';
import { UserRightsComponent } from './error-rights.component';

@NgModule({
    imports: [ErrorRoutingModule ],
  declarations: [
      P404Component,
      UserRightsComponent
    ]
})
export class ErrorModule { }
