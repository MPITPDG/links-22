import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ExportTodayComponent } from './export-today.component';

@NgModule({
    declarations: [ExportTodayComponent],
    imports: [CommonModule, FormsModule,
        RouterModule.forChild([{ path: '', component: ExportTodayComponent, data: { title: 'Today' } }])],
})
export class ExportTodayModule { }
