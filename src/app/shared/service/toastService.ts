import { Injectable } from '@angular/core';
import { ToasterService } from 'angular2-toaster';
@Injectable()
export class ToastCommonService {
    constructor(private _toasterService: ToasterService) {}
    public toast(errortype: string, errortitle: string, errormessage: string): void {
        this._toasterService.pop(errortype, errortitle, errormessage);
    }
}