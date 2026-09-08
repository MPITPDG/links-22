import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { P404Component } from './404.component';
import { UserRightsComponent } from './error-rights.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Errors'
        },
        children: [
            {
                path: '404',
                component: P404Component,
                data: {
                    title: '404'
                }
            },
            {
                path: 'access-denied',
                component: UserRightsComponent,
                data: {
                    title: 'Access-Denied'
                }
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ErrorRoutingModule { }
