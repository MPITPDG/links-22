import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataService } from '../../shared/service/dataService';

/*
  Booking authorisation (Export > Booking > Approval) - data access.
  Ported from MPERPNG-20 (booking-authorisation.service.ts). MP called the API
  with its own HttpClient; Links keeps its existing calls through DataService
  (same base URL and interceptor as every other screen):
    GET  Export/Exp_Booking_OrderNo_Authorisation   (cmpid, cmp_code, RoleType)
    POST Export/Exp_Booking_OrderNo_Authorisation_SaveUpdate
         (cmp_code, citycode, OrdStylestr, CHKAuthorityFlag '1', cmpid)
  Provided by BookingExportModule, because DataService is provided per module
  through SharedModule.
*/

export interface BookingRow {
  ID:              number;
  ORDERNO:         string;
  STYLENO:         string;
  CITY:            string;
  MODE:            string;
  CONSGN:          string;
  BOOKINGON:       string;
  DOCSEXPECT:      string;
  APPROVALEXPECT:  string;
  CARGOEXPECT:     string;
  ETD_ORIGIN:      string;
  TRANS_ETA:       string;
  TRANS_ETD:       string;
  ETA_DEST:        string;
  CREATEDBY:       string;
  CREATEDON:       string;
  AUTHORISED_FLAG?: string;  // '1' = already authorised, when the procedure returns it
  // UI-only flags
  checked?:        boolean;
  authorised?:     boolean;
}

export interface AuthoriseResponse {
  STATUS:    string;
  STATUSMSG: string;
}

@Injectable()
export class BookingAuthorisationService {

  constructor(private _dataService: DataService) { }

  /**
   * The booking list. Answers null when the reply carries no Table at all, so the
   * screen can tell a failed load from a genuinely empty list; never throws.
   */
  getUnauthorisedBookings(cmpId: any, cmpCode: any, roleType: any): Observable<BookingRow[] | null> {
    const json = { cmpid: cmpId, cmp_code: cmpCode, RoleType: roleType };
    return this._dataService.getData<any>('Export/Exp_Booking_OrderNo_Authorisation', json)
      .pipe(map(res => (res && Array.isArray(res.Table)) ? res.Table as BookingRow[] : null));
  }

  /** Authorises the given OrderNo+StyleNo string ("A1S1,B2S2,"). */
  authoriseBookings(cmpCode: any, cityCode: any, ordStyleStr: string, makerId: any): Observable<AuthoriseResponse> {
    const json = {
      cmp_code:         cmpCode,
      citycode:         cityCode,
      OrdStylestr:      ordStyleStr,
      CHKAuthorityFlag: '1',
      cmpid:            makerId
    };
    return this._dataService.Common<any>('Export/Exp_Booking_OrderNo_Authorisation_SaveUpdate', json)
      .pipe(
        map(res => {
          // { Table: [ { STATUS, STATUSMSG } ] } - the DataSet as the API serialises it
          if (res && Array.isArray(res.Table) && res.Table.length > 0) {
            return res.Table[0] as AuthoriseResponse;
          }
          // { STATUS, STATUSMSG } - a direct object
          if (res && res.STATUS) {
            return res as AuthoriseResponse;
          }
          // [ { STATUS, STATUSMSG } ] - an array
          if (Array.isArray(res) && res.length > 0 && res[0].STATUS) {
            return res[0] as AuthoriseResponse;
          }
          return { STATUS: '', STATUSMSG: 'Unexpected response from the server.' } as AuthoriseResponse;
        })
      );
  }
}
