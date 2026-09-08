import { NgModule ,CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
import { HttpClientModule } from '@angular/common/http';
import { ClientEdiDesignComponent } from './client-edi-design.component';
import { ClientedifilterpipePipe } from './client-edifilterpipe.pipe';
import { ClientEdiRoutingModule } from './clientedi.routing';
import { ClientEdiFileUploadComponent } from './client-fileupload.component';
@NgModule({
    
  imports: [ClientEdiRoutingModule,
      FormsModule,
      CommonModule,
        MyDatePickerModule,
      NgSelectModule,
      HttpClientModule
      //SharedModule
  ],
  declarations: [ClientEdiDesignComponent, ClientedifilterpipePipe,ClientEdiFileUploadComponent
  ],
  providers: [
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})

export class ClientEdiModule{ } 

