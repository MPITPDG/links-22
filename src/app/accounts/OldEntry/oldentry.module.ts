import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { OldEntryRoutingModule } from './oldentry.routing';
 


@NgModule({
    imports: [OldEntryRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        //SharedModule
    ],
    declarations: [],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OldEntryModule { }