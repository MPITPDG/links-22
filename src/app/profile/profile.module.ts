import { NgModule,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { profileComponent } from './profile.component';
import { ProfileRoutingModule } from './profile.routing';
import {updatePassword} from './update-password.component'

@NgModule({
    imports: [CommonModule ,ProfileRoutingModule,FormsModule],
  declarations: [updatePassword,profileComponent] , 
   providers: [updatePassword],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileModule { }
