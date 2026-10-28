import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpBalTransferRoutingModule } from './opbaltransfer.routing';
import { OpBalTransfer } from './opbaltransfer.component';

@NgModule({
    imports: [OpBalTransferRoutingModule,
        FormsModule,
        CommonModule
    ],
    declarations: [OpBalTransfer],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OpBalTransferModule { }
