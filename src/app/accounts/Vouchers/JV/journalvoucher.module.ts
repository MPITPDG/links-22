import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { JvRoutingModule } from './journalvoucher.routing'; 
import { JournalVoucherComponent } from './journalvoucher_IU.component';
import { JournalVoucherSearchComponent } from './journalvoucher_search.component';
import  { journalvoucherAuth } from './jv-auth.component';
import {SharedModule} from '../../../shared/shared.module'
@NgModule({
    imports: [JvRoutingModule,
        FormsModule,
        CommonModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule
    ],
    declarations: [ 
        JournalVoucherComponent,
        JournalVoucherSearchComponent,
        journalvoucherAuth
    ],
    providers: [
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class JvModule { }