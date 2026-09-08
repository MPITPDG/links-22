import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpClientModule } from '@angular/common/http';
import { Tds26asRoutingModule } from './tds26as.routing';
import { Tds26asReconcil } from './tds26as-reconcil.component';

@NgModule({
    imports: [Tds26asRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        NgSelectModule,
        HttpClientModule
    ],
    declarations: [Tds26asReconcil],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Tds26asModule { }
