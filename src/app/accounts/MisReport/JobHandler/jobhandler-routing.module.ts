import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { JobHandlerRegisterComponent } from './jobhandler-register.component';

const routes: Routes = [
    {
        path: '',
        data: { title: 'Job Handler Register' },
        children: [
            { path: 'register', component: JobHandlerRegisterComponent, data: { title: 'Job Handler / Sales Person Register' } }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class JobHandlerRoutingModule { }
