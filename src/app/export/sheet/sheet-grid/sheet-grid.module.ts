import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SheetGridComponent } from './sheet-grid.component';

/*  Generic spreadsheet grid (<app-sheet-grid>). No Links / API knowledge: import this module
    in the page that owns the data (Export > Sheet view, the dev demo).                      */
@NgModule({
    declarations: [SheetGridComponent],
    imports: [CommonModule, FormsModule, ScrollingModule],
    exports: [SheetGridComponent]
})
export class SheetGridModule { }

export * from './sheet-grid.types';
