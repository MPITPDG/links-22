import { NgModule } from '@angular/core';

import { ButtonsComponent } from './buttons.component';
import { CardsComponent } from './cards.component';

// Forms Component
import { FormsComponent } from './forms.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

import { SocialButtonsComponent } from './social-buttons.component';
import { SwitchesComponent } from './switches.component';
import { TablesComponent } from './tables.component';

// Modal Component
import { ModalModule } from 'ngx-bootstrap/modal';
import { ModalsComponent } from './modals.component';

// Tabs Component
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TabsComponent } from './tabs.component';

// Components Routing
import { ComponentsRoutingModule } from './components-routing.module';

//Form Layout
import { FormLayoutComponent } from './formlayout.component';

// Popover Component
import { PopoverModule } from 'ngx-bootstrap/popover';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

@NgModule({
    imports: [
        ComponentsRoutingModule,
        BsDropdownModule.forRoot(),
        ModalModule.forRoot(),
        TabsModule,
        PopoverModule.forRoot(),
        TooltipModule.forRoot(),
    ],
    declarations: [
        ButtonsComponent,
        CardsComponent,
        FormsComponent,
        ModalsComponent,
        SocialButtonsComponent,
        SwitchesComponent,
        TablesComponent,
        TabsComponent,
        FormLayoutComponent
    ]
})
export class ComponentsModule { }
