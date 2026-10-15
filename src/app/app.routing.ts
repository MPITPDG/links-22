import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Layouts
import { FullLayoutComponent } from './layouts/full-layout.component';
import { SimpleLayoutComponent } from './layouts/simple-layout.component';
import { HeaderFooterLayoutComponent } from './layouts/header-footer-layout.component';

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
    //             loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
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
                loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
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
                loadChildren: () => import('./export/export.module').then(m => m.ExportModule)
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
                loadChildren: () => import('./login/login.module').then(m => m.LoginModule),
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
                loadChildren: () => import('./windowpoppage/window-pop-page.module').then(m => m.WindowPopPageModule),
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
                loadChildren: () => import('./newtabpage/new-tab-page.module').then(m => m.NewTabPageModule),
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
                loadChildren: () => import('./branch/branch.module').then(m => m.BranchModule),
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
                loadChildren: () => import('./company/company.module').then(m => m.CompanyModule),
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
                loadChildren: () => import('./module/module.module').then(m => m.ModulesModule),
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
                loadChildren: () => import('./accounts/accounts.module').then(m => m.AccountModule),
            }
        ]
    },
    {
        path: 'accounts',
        // Was FullLayoutComponent_acc, a copy of the full layout whose only
        // difference was the financial-year picker. The shared layout now shows
        // that picker itself on /accounts routes (same as MPERPNG-20).
        component: FullLayoutComponent,
        data: {
            title: ''
        },
        children: [
            {
                path: '',
                loadChildren: () => import('./accounts/accounts.module').then(m => m.AccountModule),
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
                loadChildren: () => import('./export/export.module').then(m => m.ExportModule),
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
                loadChildren: () => import('./import/import.module').then(m => m.ImportModule),
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
                loadChildren: () => import('./information/information.module').then(m => m.InformationModule),
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
                loadChildren: () => import('./error/error.module').then(m => m.ErrorModule),
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
                loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule),
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
                loadChildren: () => import('./export/export.module').then(m => m.ExportModule),
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
                loadChildren: () => import('./master/master-master.module').then(m => m.MastermasterModules),
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
                loadChildren: () => import('./admin/Adminuserprofile.module').then(m => m.AdminuserprofileModule),
            }
        ]
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
