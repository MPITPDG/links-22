import { Component, OnInit } from '@angular/core';
import {ErrorDataSerice} from './error-share-data.service'
import {Router} from '@angular/router';

@Component({
  templateUrl: '404.component.html'
})
export class P404Component implements OnInit {

    errData: any;
    constructor(private _router: Router,
        private _sharedError: ErrorDataSerice
    ) { }

    ngOnInit() {
       // console.log("404", this._sharedError.verifyData);
        if (this._sharedError.verifyData != undefined) {
            this.errData = this._sharedError.verifyData;
        }
    }
}
