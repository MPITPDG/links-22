import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TicketsBoardComponent } from './tickets-board.component';

@NgModule({
    declarations: [TicketsBoardComponent],
    imports: [CommonModule, FormsModule,
        RouterModule.forChild([{ path: '', component: TicketsBoardComponent, data: { title: 'Tickets' } }])],
})
export class TicketsModule { }
