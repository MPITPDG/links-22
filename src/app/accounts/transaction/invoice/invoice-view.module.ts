import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceViewPageComponent } from './invoice-view-page.component';

/*  The invoice detail view, packaged so more than one lazy module can use it.

    It is opened from Invoice Search and from Authorisation, which live in different lazy
    modules - and a component may only be declared once. Declaring it here and exporting it
    lets both import the module rather than duplicate the component.                       */
@NgModule({
    imports: [CommonModule],
    declarations: [InvoiceViewPageComponent],
    exports: [InvoiceViewPageComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InvoiceViewModule { }
