import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FinancialYearAuthGuard } from 'src/app/shared/guard/finanacial-year-auth-guard.service';
import { EInvoiceList } from './einvoice-list.component';
import { UploadIRN  } from './einvoice-uploadirn.component';
import { ResetJson  } from './einvoice-resetjson.component'; 
import { GenerateJson } from './einvoice-generatejson.component';
import {EcreditNoteGenerateJson} from './ecreditnote-generatejson.component';
import { CreditNoteResetJson  } from './ecreditnote-resetjson.component'; 
// import { ClientEdiDesignComponent } from './client-edi-design.component';
const routes: Routes = [
  {
    path: '',
    data: {
        title: 'Report'
    },
    children: [
      { path:'GenerateJson', component: GenerateJson, data: { title: 'Generate Json' } },
      { path:'UploadIRN', component: UploadIRN, data: { title: 'Upload IRN' } },
      { path:'ResetJson', component: ResetJson, data: { title: 'Reset Invoice Json' } },
      { path:'GeneratecnJson', component: EcreditNoteGenerateJson, data: { title: 'Generate Json' } },
      { path:'ResetcnJson', component: CreditNoteResetJson, data: { title: 'Reset CreditNote Json' } },
        //  { path:'ClientEdidesign', component: ClientEdiDesignComponent, data: { title: 'Client EDI' } },
      
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class einvoiceRoutingModule { }
