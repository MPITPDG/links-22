import 'rxjs/add/operator/map';

import { HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Configuration } from '../../app.constants';

@Injectable()
export class AuthService {
    private actionUrl: string;

    constructor(
        private _http: HttpClient,
        private _configuration: Configuration) {
        this.actionUrl = _configuration.ServerWithApiUrl + 'Login/VerifyLogin';
    }

    public login<T>(username: string, password: string): Observable<T> {
        const login = JSON.stringify({ _userName: username, _password: password });
        return this._http.post<T>(this.actionUrl, login);
    }

    logout(): void {
        // clear token remove user from local storage to log user out
        localStorage.removeItem('currentUser');
    }
}
