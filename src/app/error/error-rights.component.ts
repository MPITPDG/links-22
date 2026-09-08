import { Component, OnInit } from '@angular/core';
import {ErrorDataSerice} from './error-share-data.service'
import {Router} from '@angular/router';
import {Location} from '@angular/common';

@Component({
    templateUrl: 'error-rights.component.html'
})
export class UserRightsComponent implements OnInit {

    errData: any;
    constructor(private _router: Router,
        private _sharedError: ErrorDataSerice,
        private _location: Location
    ) { }

    ngOnInit() {
        if (this._sharedError.verifyData != undefined) {
            this.errData = this._sharedError.verifyData;
        }
    }

    back() {
        //this._location.back();
        this._router.navigate(['./module']);
    }
}
 