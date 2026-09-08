import { NgModule , CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditNoteComponent} from './credit-note.component'
import { CreditNoteRoutingModule } from './credit-note-routing.module';
import { CreditNoteSearchComponent } from './credit-note-search.component';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyDatePickerModule } from 'mydatepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { FilterPipeModule } from 'ngx-filter-pipe';
import { Ng2SearchPipeModule } from 'ng2-search-filter';

@NgModule({
  declarations: [CreditNoteComponent, CreditNoteSearchComponent],
  imports: [
    CommonModule,
    CreditNoteRoutingModule,
    FormsModule,
        CommonModule,FilterPipeModule,Ng2SearchPipeModule,
        TabsModule.forRoot(),
        MyDatePickerModule,
        NgSelectModule,
        SharedModule
  ],
  providers: [
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreditNoteModule { }
