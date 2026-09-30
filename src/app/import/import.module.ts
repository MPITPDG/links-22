import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ImportRoutingModule } from './import.routing';

import { ImportComponent } from './import.component';
import { ImportHomeComponent } from './home/import-home.component';
@NgModule({
    imports: [ImportRoutingModule, CommonModule, FormsModule, NgChartsModule],
    declarations: [
        ImportComponent,
        ImportHomeComponent
    ],
    providers: [
	],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ImportModule { }
