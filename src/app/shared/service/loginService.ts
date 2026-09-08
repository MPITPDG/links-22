import { Injectable } from '@angular/core';
import { CryptoService } from './cryptService';
import { DataService } from './dataService';
import { ErrorDataSerice } from '../../error/error-share-data.service';
import { Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { HttpClient, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import {RequestOptions,Headers } from '@angular/http';
@Injectable()
export class LoginService {
    headers: Headers;
    options: RequestOptions;
    constructor(
        private _router: Router,
        private _crypt: CryptoService,
        private _dataService: DataService,
        private _sharedError: ErrorDataSerice,
        private platformLocation: PlatformLocation,
        private http: HttpClient ) {
            this.headers = new Headers({ 'Content-Type': 'application/json', 
                                       'Accept': 'q=0.8;application/json;q=0.9' });
          this.options = new RequestOptions({headers: this.headers });
         }

    public removeLogin() {
        localStorage.removeItem('_user');
        this._router.navigate(['login']);
        // if (this.getBasePath() == 'FRT') {
        //     localStorage.removeItem('_frtUser');
        //     this._router.navigate(['login']);
        // } else {
        //     localStorage.removeItem('_user');
        //     this._router.navigate(['login']);
        // }
        return true;
    }

    getBasePath(): string {
        return "DEFAULT";
        // if (this.platformLocation.pathname == '/erp-mpfs/') { return "FRT"; }
        // else  if (this.platformLocation.pathname == '/erp-mpfrt/') { return "FRT"; }
        // else { return "DEFAULT"; }
    }

    public setLogin(data: any) {
        let tmpdata = this._crypt.encrypt(JSON.stringify(data));
        // let check = localStorage.getItem('_user');
        let check = localStorage.getItem('_linksuser');
        if (typeof check !== 'undefined' && check !== null) {
            // localStorage.removeItem('_user');
            localStorage.removeItem('_linksuser');
        }
       // localStorage.setItem('_user', tmpdata);
       localStorage.setItem('_linksuser', tmpdata);
        // if (this.getBasePath() == 'FRT') {
        //     let check = localStorage.getItem('_frtUser');
        //     if (typeof check !== 'undefined' && check !== null) {
        //         localStorage.removeItem('_frtUser');
        //     }
        //     localStorage.setItem('_frtUser', tmpdata);
        // }
        // else {
        //     let check = localStorage.getItem('_user');
        //     if (typeof check !== 'undefined' && check !== null) {
        //         localStorage.removeItem('_user');
        //     }
        //     localStorage.setItem('_user', tmpdata);
        // }
        return true;
    }

    public getsubPathName()
    { return 'erp-links' ;//return  (this.getBasePath() == "FRT")?'erp-mpfs' :'erp-ng';
    }

    public getLogin() {
        let decryptData = "";
        // let check = localStorage.getItem('_user');
        let check = localStorage.getItem('_linksuser');
        if (typeof check !== 'undefined' && check !== null) {
            // decryptData = this._crypt.decrypt(localStorage.getItem('_user'));
            decryptData = this._crypt.decrypt(localStorage.getItem('_linksuser'));
            return JSON.parse(decryptData);
        } else {
            return null;
        }
        // if (this.getBasePath() == 'FRT') {
        //     let check = localStorage.getItem('_frtUser');
        //     if (typeof check !== 'undefined' && check !== null) {
        //         decryptData = this._crypt.decrypt(localStorage.getItem('_frtUser'));
        //         return JSON.parse(decryptData);
        //     } else {
        //         return null;
        //     }
        // }
        // else {
        //     let check = localStorage.getItem('_user');
        //     if (typeof check !== 'undefined' && check !== null) {
        //         decryptData = this._crypt.decrypt(localStorage.getItem('_user'));
        //         return JSON.parse(decryptData);
        //     } else {
        //         return null;
        //     }
        // }
    }

    public setCityModify(data: any) {
        let tmpdata = this.getLogin();
        tmpdata[0].CITYCODE = data[0].CITYCODE;
        tmpdata[0].CITYCODE1 = data[0].CITYCODE1;
        tmpdata[0].RIGHTS_CODE = data[0].RIGHTS_CODE;
        tmpdata[0].CITYNAME = data[0].CITYNAME;
        tmpdata[0].ISADMIN = data[0].ISADMIN;
        tmpdata[0].STATE_CODE = data[0].STATE_CODE;
        tmpdata[0].COUNTRY = data[0].COUNTRY;
        this.setLogin(tmpdata);
        return true;
    }

    public setModuleModify(moduleid: any) {
        let tmpdata = this.getLogin();
        tmpdata[0].MODULEID = moduleid;
        if (tmpdata[0].CITYCODE === 'LIL' || tmpdata[0].CITYCODE === 'PAR') { tmpdata[0].TMPTYPE = "FRANCE"; }
        else { tmpdata[0].TMPTYPE = null; }
        this.setLogin(tmpdata);
        return true;
    }

    public setCompanyCodeModify(compcode: any, compname: any, comptype: any,Ishblissue:any,Ishawbissue: any) {
        var tmpdata = this.getLogin();
        tmpdata[0].CMPCODE = compcode;
        tmpdata[0].CMPTYPE = comptype;
        tmpdata[0].CMPNAME = compname;
        tmpdata[0].ISHBL = Ishblissue;
        tmpdata[0].ISHAWB = Ishawbissue;
        this.setLogin(tmpdata);
       // console.log(tmpdata);
        return true;
    }
    public setFinancialYearModify(data: any) {
        let tmpdata = this.getLogin();
        tmpdata[0]["FINANCIAL_YEAR"] = data;
        this.setLogin(tmpdata);
        return true;
    }

    verifyRights(formid, entrydt) {
        let verifyData = null;
        const _jsonData = {
            CmpId: this.getLogin()[0].CMPID,
            FormId: formid,
            CodeCity: this.getLogin()[0].CMPCODE + '' + this.getLogin()[0].CITYCODE1,
            EntryDt: entrydt
        };
        return this._dataService.Common("Common/getVerifyRight", _jsonData)
    }


    
    // getServiceWithMultipleQueryTerm(url: string, param: any): Promise<any> {

    //     let params: URLSearchParams = new URLSearchParams();
    //     for (var key in param) {
    //         if (param.hasOwnProperty(key)) {
    //             let val = param[key];
    //             params.set(key, val);
    //         }
    //     }

    //     return this.http
    //         .get(url + "/?" + params )
    //         .toPromise()
    //         .then(this.extractData);
    //         //.catch(this.handleError);
    //     }

    //     private extractData(res: Response) {
    //         let body = res.json();
    //         return this.checkVerify('View',body) || {};
    //     }

    // checkVerify(mode, vdata): boolean {
    //     let error = {
    //         FormName: null,
    //         ErrorMessage: null
    //     };
    //     if (this.getLogin()[0].ROLETYPE != 'SA') {
    //         if (vdata.Table != undefined) {
    //             if (vdata.Table.length > 0) {
    //                 if ((vdata.Table[0].viewForm == 0 || vdata.Table[0].viewForm == false) && mode == 'View') {
    //                     error = {
    //                         FormName: vdata.Table[0].DisplayName,
    //                         ErrorMessage: 'You do not have rights to view this web page. Please contact your administrator for access rights.'
    //                     };
    //                     this._sharedError.verifyData = error;
    //                     this._router.navigate(['error/access-denied']);
    //                     return false;
    //                 }
    //                 else if ((vdata.Table[0].AddForm == 0 || vdata.Table[0].AddForm == false) && mode == 'Add') {
    //                     error = {
    //                         FormName: vdata.Table[0].DisplayName,
    //                         ErrorMessage: 'You do not have rights to Add this web page. Please contact your administrator for access rights.'
    //                     };
    //                     this._sharedError.verifyData = error;
    //                     this._router.navigate(['error/access-denied']);
    //                     return false;
    //                 }
    //                 else if ((vdata.Table[0].modifyForm == 0 || vdata.Table[0].modifyForm == false) && mode == 'Modify') {
    //                     error = {
    //                         FormName: vdata.Table[0].DisplayName,
    //                         ErrorMessage: 'You do not have rights to Update this web page. Please contact your administrator for access rights.'
    //                     };
    //                     this._sharedError.verifyData = error;
    //                     this._router.navigate(['error/access-denied']);
    //                     return false;
    //                 }
    //             }
    //             else if (vdata.Table1.length > 0) {
    //                 error = {
    //                     FormName: vdata.Table[0].DisplayName,
    //                     ErrorMessage: 'You have rights from ' + vdata.Table1[0].FromDt + '  to ' + vdata.Table1[0].ToDt + ' . Please contact your administrator for access rights.'
    //                 };
    //                 this._sharedError.verifyData = error;
    //                 this._router.navigate(['error/access-denied']);
    //                 return false;
    //             }
    //             else {
    //                 error = {
    //                     FormName: "",
    //                     ErrorMessage: 'You do not have rights. Please contact your administrator for access rights.'
    //                 };
    //                 this._sharedError.verifyData = error;
    //                 this._router.navigate(['error/access-denied']);
    //                 return false;
    //             }
    //         } else {
    //             error = {
    //                 FormName: "",
    //                 ErrorMessage: 'You do not have rights. Please contact your administrator for access rights.'
    //             };
    //             this._sharedError.verifyData = error;
    //             this._router.navigate(['error/access-denied']);
    //             return false;
    //         }
    //         return true;
    //     } else {
    //         return true;
    //     }
    // }
    checkVerify(mode, vdata): boolean {
        let error = {
            FormName: null,
            ErrorMessage: null
        };

        if (this.getLogin()[0].ROLETYPE != 'SA') {
            if (vdata.Table != undefined) {
                if (vdata.Table.length > 0) {
                    if (vdata.Table[0].STATUS == '100') {
                        if ((vdata.Table[0].viewForm == 0 || vdata.Table[0].viewForm == false) && mode == 'View') {
                            error = {
                                FormName: vdata.Table[0].DisplayName,
                                ErrorMessage: 'You do not have rights to view this web page. Please contact your administrator for access rights.'
                            };
                            this._sharedError.verifyData = error;
                            this._router.navigate(['error/access-denied']);
                            return false;
                        } else if ((vdata.Table[0].AddForm == 0 || vdata.Table[0].AddForm == false) && mode == 'Add') {
                            error = {
                                FormName: vdata.Table[0].DisplayName,
                                ErrorMessage: 'You do not have rights to Add this web page. Please contact your administrator for access rights.'
                            };
                            this._sharedError.verifyData = error;
                            this._router.navigate(['error/access-denied']);
                            return false;
                        } else if ((vdata.Table[0].modifyForm == 0 || vdata.Table[0].modifyForm == false) && mode == 'Modify') {
                            error = {
                                FormName: vdata.Table[0].DisplayName,
                                ErrorMessage: 'You do not have rights to Update this web page. Please contact your administrator for access rights.'
                            };
                            this._sharedError.verifyData = error;
                            this._router.navigate(['error/access-denied']);
                            return false;
                        }
                    } else if (vdata.Table[0].STATUS == '104') {
                        error = {
                            FormName: "",
                            ErrorMessage: 'You do not have rights. Please contact your administrator for access rights.'
                        };
                        this._sharedError.verifyData = error;
                        this._router.navigate(['error/access-denied']);
                        return false;
                    }
                } else if (vdata.Table1.length > 0) {
                    error = {
                        FormName: vdata.Table1[0].DisplayName,
                        ErrorMessage: 'You have rights from ' + vdata.Table1[0].FromDt + '  to ' + vdata.Table1[0].ToDt + ' . Please contact your administrator for access rights.'
                    };
                    this._sharedError.verifyData = error;
                    this._router.navigate(['error/access-denied']);
                    return false;
                } else {
                    error = {
                        FormName: "",
                        ErrorMessage: 'You do not have rights. Please contact your administrator for access rights.'
                    };
                    this._sharedError.verifyData = error;
                    this._router.navigate(['error/access-denied']);
                    return false;
                }
            } else {
                error = {
                    FormName: "",
                    ErrorMessage: 'You do not have rights. Please contact your administrator for access rights.'
                };
                this._sharedError.verifyData = error;
                this._router.navigate(['error/access-denied']);
                return false;
            }
            return true;
        }
    }

    checkVerifyWithMessage(mode, vdata) {
        let error = {
            Status: null,
            FormName: null,
            ErrorMessage: null
        };
        if (this.getLogin()[0].ROLETYPE != 'SA') {
            if (vdata.Table != undefined) {
                if (vdata.Table.length > 0) {
                    if ((vdata.Table[0].viewForm == 0 || vdata.Table[0].viewForm == false) && mode == 'View') {
                        error = {
                            Status: false,
                            FormName: vdata.Table[0].DisplayName,
                            ErrorMessage: 'You do not have rights to view this web page. Please contact your administrator for access rights.'
                        };
                    }
                    else if ((vdata.Table[0].AddForm == 0 || vdata.Table[0].AddForm == false) && mode == 'Add') {
                        error = {
                            Status: false,
                            FormName: vdata.Table[0].DisplayName,
                            ErrorMessage: 'You do not have rights to Add this web page. Please contact your administrator for access rights.'
                        };
                    }
                    else if ((vdata.Table[0].modifyForm == 0 || vdata.Table[0].modifyForm == false) && mode == 'Modify') {
                        error = {
                            Status: false,
                            FormName: vdata.Table[0].DisplayName,
                            ErrorMessage: 'You do not have rights to Update this web page. Please contact your administrator for access rights.'
                        };
                    }
                    else {
                        error = {
                            Status: true,
                            FormName: '',
                            ErrorMessage: ''
                        };
                    }
                }
                else if (vdata.Table1.length > 0) {
                    error = {
                        Status: false,
                        FormName: vdata.Table[0].DisplayName,
                        ErrorMessage: 'You have rights from ' + vdata.Table1[0].FromDt + '  to ' + vdata.Table1[0].ToDt + ' . Please contact your administrator for access rights.'
                    };
                }
                else {
                    error = {
                        Status: false,
                        FormName: "",
                        ErrorMessage: 'You do not have rights. Please contact your administrator for access rights.'
                    };
                }
            } else {
                error = {
                    Status: false,
                    FormName: "",
                    ErrorMessage: 'You do not have rights. Please contact your administrator for access rights.'
                };
            }
        } else if (this.getLogin()[0].ROLETYPE == 'SA') {
            error = {
                Status: true,
                FormName: '',
                ErrorMessage: ''
            };
        } else {
            error = {
                Status: false,
                FormName: '',
                ErrorMessage: ''
            };
        }
        return error;
    }

    public returnRights(mode, rData, role) {
        let returnBool = false;
        if (role != 'SA') {
            if (rData.Table != undefined) {
                if (rData.Table.length > 0) {
                    if ((rData.Table[0].viewForm == 0 || rData.Table[0].viewForm == false) && mode == 'View') {
                        returnBool = false;
                    }
                    else if ((rData.Table[0].AddForm == 0 || rData.Table[0].AddForm == false) && mode == 'Add') {
                        returnBool = false;
                    }
                    else if ((rData.Table[0].modifyForm == 0 || rData.Table[0].modifyForm == false) && mode == 'Modify') {
                        returnBool = false;
                    } else {
                        returnBool = true;
                    }
                }
                else { returnBool = false; }
            }
            else { returnBool = false; }
        } else { returnBool = true; }
        return returnBool;
    }
}