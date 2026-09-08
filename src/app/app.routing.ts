import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Layouts
import { FullLayoutComponent } from './layouts/full-layout.component';
import { SimpleLayoutComponent } from './layouts/simple-layout.component';
import { HeaderFooterLayoutComponent } from './layouts/header-footer-layout.component';
import { FullLayoutComponent_acc } from './layouts/full-layout.component_acct';

export const routes: Routes = [


    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    // {
    //     path: 'dashboard',
    //     component: FullLayoutComponent,
    //     data: {
    //         title: 'Dashboard'
    //     },
    //     children: [
    //         {
    //             path: '',
    //             loadChildren: './dashboard/dashboard.module#DashboardModule'
    //         }
    //     ]
    // },
    {
        path: 'dashboard',
        component: FullLayoutComponent,
        data: {
            title: 'Dashboard'
        },
        children: [
            {
                path: '',
                loadChildren: './dashboard/dashboard.module#DashboardModule'
            }
        ]
    },
    {
        path: 'export',
        component: FullLayoutComponent,
        data: {
            title: 'Export'
        },
        children: [
            {
                path: '',
                loadChildren: './export/export.module#ExportModule'
            }
        ]
    },
    {
        path: 'login',
        component: SimpleLayoutComponent,
        data: {
            title: 'login'
        },
        children: [
            {
                path: '',
                loadChildren: './login/login.module#LoginModule',
            }
        ]
    },
    {
        path: 'popup',
        component: SimpleLayoutComponent,
        data: {
            title: 'Popup'
        },
        children: [
            {
                path: '',
                loadChildren: './windowpoppage/window-pop-page.module#WindowPopPageModule',
            }
        ]
    },
    {
        path: 'new-tab',
        component: SimpleLayoutComponent,
        data: {
            title: 'New Tab'
        },
        children: [
            {
                path: '',
                loadChildren: './newtabpage/new-tab-page.module#NewTabPageModule',
            }
        ]
    },
    {
        path: 'branch',
        component: HeaderFooterLayoutComponent,
        data: {
            title: 'branch'
        },
        children: [
            {
                path: '',
                loadChildren: './branch/branch.module#BranchModule',
            }
        ]
    },
    {
        path: 'company',
        component: HeaderFooterLayoutComponent,
        data: {
            title: 'company'
        },
        children: [
            {
                path: '',
                loadChildren: './company/company.module#CompanyModule',
            }
        ]
    },
    {
        path: 'module',
        component: HeaderFooterLayoutComponent,
        data: {
            title: 'module'
        },
        children: [
            {
                path: '',
                loadChildren: './module/module.module#ModulesModule',
            }
        ]
    },
    {
        path: 'accounts-home',
        component: HeaderFooterLayoutComponent,
        data: {
            title: 'Account'
        },
        children: [
            {
                path: '',
                loadChildren: './accounts/accounts.module#AccountModule',
            }
        ]
    },
    {
        path: 'accounts',
        component: FullLayoutComponent_acc,
        data: {
            title: ''
        },
        children: [
            {
                path: '',
                loadChildren: './accounts/accounts.module#AccountModule',
            }
        ]
    },
    
    {
        path: 'export-home',
        component: HeaderFooterLayoutComponent,
        data: {
            title: ''
        },
        children: [
            {
                path: '',
                loadChildren: './export/export.module#ExportModule',
            }
        ]
    },
    {
        path: 'import',
        component: FullLayoutComponent,
        data: {
            title: ''
        },
        children: [
            {
                path: '',
                loadChildren: './import/import.module#ImportModule',
            }
        ]
    },
    {
        path: 'information',
        component: SimpleLayoutComponent,
        data: {
            title: ''
        },
        children: [
            {
                path: '',
                loadChildren: './information/information.module#InformationModule',
            }
        ]
    },
    {
        path: 'error',
        component: FullLayoutComponent,
        data: {
            title: 'Error'
        },
        children: [
            {
                path: '',
                loadChildren: './error/error.module#ErrorModule',
            }
        ]
    },
    
    {
        path: 'Profile',
        component: HeaderFooterLayoutComponent,
        data: {
            title: 'Profile'
        },
        children: [
            {
                path: '',
                loadChildren: './profile/profile.module#ProfileModule',
            }
        ]
    },
     
    {
        path: 'popupexport',
        component: SimpleLayoutComponent,
        data: {
            title: 'Popup'
        },
        children: [
            {
                path: '',
                loadChildren: './export/export.module#ExportModule',
            }
        ]
    } ,
    {
        path: 'master',
        component: FullLayoutComponent,
        data: {
            title: ''
        },
        children: [
            {
                path: '',
                loadChildren: './master/master-master.module#MastermasterModules',
            }
        ]
    },     
    {
        path: 'admin',
        component: FullLayoutComponent,
        data: {
            title: ''
        },
        children: [
            {
                path: '',
                loadChildren: './admin/Adminuserprofile.module#AdminuserprofileModule',
            }
        ]
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
