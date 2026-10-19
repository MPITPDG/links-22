import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule, Pipe } from '@angular/core';
import { RouterModule } from '@angular/router';

import { CustomInterceptor, DataService } from './service/dataService';
import { AuthService } from './service/authService';
import { CryptoService } from './service/cryptService';
import { LoginService } from './service/loginService';
import { OnlyNumberDirective, OnlyAmountDirective, OnlyCharacterDirective } from './onlynumber.directive';
import { FilterPipe, SortByPipe } from './pipes';
import { UI_KIT } from './ui';


@NgModule({
    // UI_KIT is re-exported here rather than imported into each feature module.
    // Most feature modules already import SharedModule, so this makes the kit
    // available app-wide in one place - and means a new kit component does not
    // require touching a dozen module files. (Same arrangement as MPERPNG-20.)
    imports: [CommonModule, RouterModule, ...UI_KIT],
    exports: [
        OnlyNumberDirective,
        OnlyAmountDirective,
        OnlyCharacterDirective,
        FilterPipe,
        SortByPipe,
        ...UI_KIT,],
    declarations: [
        OnlyNumberDirective,
        OnlyAmountDirective,
        OnlyCharacterDirective,
        FilterPipe,
        SortByPipe],
    providers: [DataService, AuthService, CryptoService, LoginService,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: CustomInterceptor,
            multi: true,
        }],
})

export class SharedModule { }
