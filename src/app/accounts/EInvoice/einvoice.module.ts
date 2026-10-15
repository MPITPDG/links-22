import { NgModule ,CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenerateJson } from './einvoice-generatejson.component';
import { UploadIRN  } from './einvoice-uploadirn.component'; 
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker';
import { ResetJson  } from './einvoice-resetjson.component'; 
import {EcreditNoteGenerateJson} from './ecreditnote-generatejson.component';
import { CreditNoteResetJson  } from './ecreditnote-resetjson.component'; 
import { einvoiceRoutingModule } from './einvoice.routing';
import { EInvoiceList } from './einvoice-list.component';
import { UiButton } from '../../shared/ui/button';
// import { ClientEdiDesignComponent } from './client-edi-design.component';
// import { ClientedifilterpipePipe } from './client-edifilterpipe.pipe';
@NgModule({
    
  imports: [einvoiceRoutingModule,
      FormsModule,
      CommonModule,
      
      MyDatePickerModule,
      NgSelectModule,
      UiButton
      //SharedModule
  ],
  declarations: [GenerateJson,UploadIRN,ResetJson,EcreditNoteGenerateJson,CreditNoteResetJson,
      EInvoiceList
  ],
  providers: [
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})

export class einvoicemodule{ } 

