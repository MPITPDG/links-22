import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { Configuration } from '../../app.constants';
import { environment } from '../../../environments/environment';

/** tbl_mst_form id of the KYC VERIFICATION right - must match @KycFormId in _DB_FIX/KYC_01_SETUP_20261029.sql */
export const KYC_FORM_ID = 465;
/** eDocument application folder under environment.edocumentIp (KYC files open from its data/ folder) */
export const KYC_EDOC_APP = 'edocument-Links/';

/**
 * KYC of new clients (E) and suppliers (S): API Master/KYC_*. Files go to eDocument through the API
 * (Master/KYC_Upload forwards them), filed under the request code until the request is authorised.
 */
@Injectable()
export class KycService {
    /** bypasses CustomInterceptor, which forces Content-Type: application/json and breaks multipart */
    private rawHttp: HttpClient;
    private apiBase: string;

    constructor(private _dataService: DataService, private _loginService: LoginService,
                _configuration: Configuration, handler: HttpBackend) {
        this.rawHttp = new HttpClient(handler);
        this.apiBase = _configuration.ServerWithApiUrl;
    }

    private login(): any { return this._loginService.getLogin()[0]; }

    /** company + city code of the login, as the rights tables store it */
    codeCity(): string { return this.login().CMPCODE + '' + this.login().CITYCODE1; }

    requestList(partyType: string, status: string): Observable<any> {
        return this._dataService.getData('Master/KYC_Request_List', { partyType: partyType, status: status });
    }

    status(partyType: string, code: string): Observable<any> {
        return this._dataService.getData('Master/KYC_Status', {
            partyType: partyType, code: (code || '').trim(), cmpid: this.login().CMPID, codecity: this.codeCity()
        });
    }

    upload(partyType: string, code: string, documentId: string, remark: string, file: File): Observable<any> {
        const fd = new FormData();
        fd.append('file', file, file.name);
        fd.append('party', partyType);
        fd.append('code', (code || '').trim());
        fd.append('documentid', documentId);
        fd.append('remark', remark || '');
        fd.append('cmpid', this.login().CMPID);
        fd.append('makerip', this.login().MAKERIP || '');
        return this.rawHttp.post(this.apiBase + 'Master/KYC_Upload', fd);
    }

    removeFile(partyType: string, code: string, pkUploadId: string): Observable<any> {
        return this._dataService.Common('Master/KYC_File_Remove', {
            PARTY_TYPE: partyType, CODE: (code || '').trim(), PK_UPLOADID: String(pkUploadId),
            CMPID: this.login().CMPID, MAKERIP: this.login().MAKERIP
        });
    }

    /** action V = verify, R = return to Ops (remark required) */
    verify(partyType: string, code: string, action: string, remark: string): Observable<any> {
        return this._dataService.Common('Master/KYC_Verify', {
            PARTY_TYPE: partyType, CODE: (code || '').trim(), ACTION: action, REMARK: remark || '',
            CMPID: this.login().CMPID, CODECITY: this.codeCity(), MAKERIP: this.login().MAKERIP
        });
    }

    ruleList(partyType: string): Observable<any> {
        return this._dataService.getData('Master/KYC_DocRule_List', {
            partyType: partyType, cmpid: this.login().CMPID, codecity: this.codeCity()
        });
    }

    ruleSave(partyType: string, documentId: string, isMandatory: string, region: string): Observable<any> {
        return this._dataService.Common('Master/KYC_DocRule_IU', {
            PARTY_TYPE: partyType, DOCUMENTID: String(documentId), IS_MANDATORY: isMandatory, REGION: region,
            CMPID: this.login().CMPID, CODECITY: this.codeCity()
        });
    }

    /** new eDocument document title for the party type (the title travels in REMARK) */
    titleAdd(partyType: string, title: string): Observable<any> {
        return this._dataService.Common('Master/KYC_DocTitle_Add', {
            PARTY_TYPE: partyType, REMARK: title, CMPID: this.login().CMPID, CODECITY: this.codeCity()
        });
    }

    /** link to a file stored by eDocument (FILEPATH is relative to its data/ folder) */
    fileUrl(filePath: string): string {
        return environment.edocumentIp + KYC_EDOC_APP + 'data/' + (filePath || '');
    }
}
