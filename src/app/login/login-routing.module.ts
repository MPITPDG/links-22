import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Pages'
        },
        children: [
            {
                path: '',
                component: LoginComponent,
                data: {
                    title: 'Login'
                }
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class LoginRoutingModule { }
