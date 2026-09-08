import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import {NgSelectModule} from '@ng-select/ng-select';
import {Mst_citycomponent} from './Mst_city.component';
 
import {Mst_cityrouting} from './Mst_city.routing';

@NgModule ({
    imports: [
        Mst_cityrouting,
        FormsModule,
        TabsModule,
        CommonModule,
        MyDatePickerModule,
        NgSelectModule
    ],
    declarations:[Mst_citycomponent],
    providers:[],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
}
)
export class Mst_citymodule{}