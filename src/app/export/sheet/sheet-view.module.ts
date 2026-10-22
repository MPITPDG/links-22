import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SheetGridModule } from './sheet-grid/sheet-grid.module';
import { SheetViewComponent } from './view/sheet-view.component';
import { SheetKpiComponent } from './view/sheet-kpi.component';
import { SheetSettingsComponent } from './view/sheet-settings.component';

/*  Export › Sheet view (/export/sheet, lazy from export-routing.module.ts): the page, its KPI Summary tab and its
    settings (Colour CODE / Column Access tabs, aliases panel) on top of the generic <app-sheet-grid>.            */
@NgModule({
    declarations: [SheetViewComponent, SheetKpiComponent, SheetSettingsComponent],
    imports: [CommonModule, FormsModule, SheetGridModule,
        RouterModule.forChild([{ path: '', component: SheetViewComponent, data: { title: 'Sheet view' } }])],
})
export class SheetViewModule { }
