import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FinancialYearAuthGuard } from 'src/app/shared/guard/finanacial-year-auth-guard.service';
import { ClientEdiDesignComponent } from './client-edi-design.component';
import { ClientEdiFileUploadComponent } from './client-fileupload.component';
const routes: Routes = [
  {
    path: '',
    data: {
        title: ''
    },
    children: [
    { path:'ClientEdidesign', component: ClientEdiDesignComponent, data: { title: 'Client EDI' } },
    { path:'ClientFileUpload', component: ClientEdiFileUploadComponent, data: { title: 'Client File Upload' } }
      
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientEdiRoutingModule { }
