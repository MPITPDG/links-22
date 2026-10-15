import { NgModule,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { profileComponent } from './profile.component';
import { ProfileRoutingModule } from './profile.routing';
import {updatePassword} from './update-password.component'
import { ThemeSettingsComponent } from './theme/theme-settings.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
    imports: [CommonModule ,ProfileRoutingModule,FormsModule,SharedModule],
  declarations: [updatePassword,profileComponent,ThemeSettingsComponent] , 
   providers: [updatePassword],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileModule { }
