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


@NgModule({
    imports: [CommonModule, RouterModule],
    exports: [
        OnlyNumberDirective,
        OnlyAmountDirective,
        OnlyCharacterDirective,
        FilterPipe,
        SortByPipe],
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
