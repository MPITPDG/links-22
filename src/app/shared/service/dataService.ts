import 'rxjs/add/operator/map';
import { HttpClient, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
 
import 'rxjs/add/observable/forkJoin';

import { Configuration } from '../../app.constants';
import { promise } from 'protractor';
import { DatePipe } from '@angular/common';
@Injectable()
export class DataService {

    private actionUrl: string;
    rptdownloadurl:string;
    
    constructor(private http: HttpClient, private _configuration: Configuration) {
        this.actionUrl = _configuration.ServerWithApiUrl;
    }

    public getMenuList<T>(): Observable<T> {
        return this.http.get<T>(this.actionUrl + "Common/GetMenuList");//"http://localhost:50001/include/json/menulist.json"
    }

    public getAll<T>(apiname: string): Observable<T> {
        return this.http.get<T>(this.actionUrl + apiname);
    }

    public checkPermission<T>(): Observable<T> {
        return this.http.get<T>(this.actionUrl);
    }

    public getSingle<T>(id: number): Observable<T> {
        return this.http.get<T>(this.actionUrl + id);
    }

    //public add<T>(itemName: string): Observable<T> {
    //    const toAdd = JSON.stringify({ _userName: "PDG",_password: "Manilal1951Bom" });
    //    return this.http.post<T>(this.actionUrl, toAdd);
    //}

    public update<T>(id: number, itemToUpdate: any): Observable<T> {
        return this.http
            .put<T>(this.actionUrl + id, JSON.stringify(itemToUpdate));
    }

    public delete<T>(id: number): Observable<T> {
        return this.http.delete<T>(this.actionUrl + id);
    }

    public getData<T>(apiname: string, json: any): Observable<T> {
        return this.http.get<T>(this.actionUrl + apiname + this.jsonArrayToQueryStringParam(json));
    }

   

    public getDirectUrlData<T>(apiUrl: string): Observable<T> {
        return this.http.get<any>(apiUrl);
    }

    public Common<T>(apiname: string, json: any): Observable<T> {
        return this.http.post<T>(this.actionUrl + apiname, JSON.stringify(json));
    }

    public getUniqueValuesOfKey<T>(array: any, key: string): Observable<T> {
        return array.reduce(function (carry, item) {
            if (item[key] && !~carry.indexOf(item[key])) carry.push(item[key]);
            return carry;
        }, []);
    }

    public getDownload<T>(apiname: string, json: any, header: any): Observable<any> {
        return this.http.get<any>(this.actionUrl + apiname + this.jsonArrayToQueryStringParam(json), header);
    }

    downloadFileByUrl(data) {
        var blob = new Blob([data], { type: 'application/vnd.ms-excel' });
        var url = window.URL.createObjectURL(blob);

        //window.open(url);

        var a = document.createElement("a");
        a.href = url;
        a.download = "clp.xls";
        a.click();
        setTimeout(function () {
            window.URL.revokeObjectURL(url);
        }, 100);
    }

    common_downloadFileByUrl(data, filename) {
        var blob = new Blob([data], { type: 'application/vnd.ms-excel' });
        var url = window.URL.createObjectURL(blob);

        //window.open(url);

        var a = document.createElement("a");
        a.href = url;
        a.download = filename;//"clp.xls";
        a.click();
        setTimeout(function () {
            // document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }

    commonDownloadExcelFile(data, filenamewithextension) {
        var blob = new Blob([data], { type: 'application/vnd.ms-excel' });
        var url = window.URL.createObjectURL(blob);

        //window.open(url);

        var a = document.createElement("a");
        a.href = url;
        a.download = filenamewithextension;
        a.click();
        setTimeout(function () {
            window.URL.revokeObjectURL(url);
        }, 100);
    }

    html_downloadFileByUrl(data, filename) {
        var blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
        var url = window.URL.createObjectURL(blob);

        //window.open(url);

        var a = document.createElement("a");
        a.href = url;
        a.download = filename;
      //  console.log(a);
        a.click();
        // setTimeout(function () {
        //     // document.body.removeChild(a);
        //     window.URL.revokeObjectURL(url);
        // }, 100);
    }
    common_downloadDocFileByUrl(data, filename) {
        var link, blob, url;
        blob = new Blob(['\ufeff', data], {
            type: 'application/msword'
        });
        url = URL.createObjectURL(blob);
        link = document.createElement('A');
        link.href = url;
        link.download = filename;  // default name without extension 
        document.body.appendChild(link);
        if ((window.navigator as any).msSaveOrOpenBlob) (window.navigator as any).msSaveOrOpenBlob(blob, filename + '.doc'); // IE10-11
        else link.click();  // other browsers
        document.body.removeChild(link);
    };

    
  
    public getCurrentdate(): string {
        let today = new Date();
        let dd = today.getDate();
        let mm = today.getMonth() + 1;
        let yyyy = today.getFullYear();
        let newdd = (dd < 10) ? '0' + dd : dd;
        let newmm = (mm < 10) ? '0' + mm : mm;
        return newdd + '/' + newmm + '/' + yyyy;
    }

    public getFutureDate(numberofdays: number): string {
        let someDate = new Date();
        let numberOfDaysToAdd = numberofdays;
        someDate.setDate(someDate.getDate() + numberOfDaysToAdd);
        let dd = someDate.getDate();
        let mm = someDate.getMonth() + 1;
        let yyyy = someDate.getFullYear();
        let newdd = (dd < 10) ? '0' + dd : dd;
        let newmm = (mm < 10) ? '0' + mm : mm;
        return newdd + '/' + newmm + '/' + yyyy;
    }

    public stringdttoArry(date: string): any {
        var dt_dat = date.substring(0, 2);
        if (dt_dat.substring(0, 1) === "0") {
            dt_dat = dt_dat.substring(1, 2)
        }
        var dt_month = date.substring(3, 5);
        if (dt_month.substring(0, 1) === "0") {
            dt_month = dt_month.substring(1, 2)
        }
        return {
            date: { year: date.substring(6, 10), month: dt_month, day: dt_dat },
            formatted: date
        };
    }

    public returnMonthMMFromMMM(value): any {
        if (value) {
            var opt = value.substring(3, 6);
            switch (opt) {
                case "Jan": return value.replace(/-Jan-/gi, "/01/");
                case "Feb": return value.replace(/-Feb-/gi, "/02/");
                case "Mar": return value.replace(/-Mar-/gi, "/03/");
                case "Apr": return value.replace(/-Apr-/gi, "/04/");
                case "May": return value.replace(/-May-/gi, "/05/");
                case "Jun": return value.replace(/-Jun-/gi, "/06/");
                case "Jul": return value.replace(/-Jul-/gi, "/07/");
                case "Aug": return value.replace(/-Aug-/gi, "/08/");
                case "Sep": return value.replace(/-Sep-/gi, "/09/");
                case "Oct": return value.replace(/-Oct-/gi, "/10/");
                case "Nov": return value.replace(/-Nov-/gi, "/11/");
                case "Dec": return value.replace(/-Dec-/gi, "/12/");
            }
        } else {
            return value = null;
        }
    }

    public DateFromAndToComparision(FrmDt: string, Todt: string): boolean {//dd/mm/yyyy
        if (FrmDt != undefined && Todt != undefined) {
            const Fdt = FrmDt.substring(6, 10) + FrmDt.substring(3, 5) + FrmDt.substring(0, 2);
            const Tdt = Todt.substring(6, 10) + Todt.substring(3, 5) + Todt.substring(0, 2);
            if (Tdt <=  Fdt) { return false; }
            else { return true; }
        }
        
    }

    public DateFromAndToComparision_exp(FrmDt: string, Todt: string): boolean {//dd/mm/yyyy
        if (FrmDt != undefined && Todt != undefined) {
            let Fdt = FrmDt.substring(6, 10) + FrmDt.substring(3, 5) + FrmDt.substring(0, 2);
            let Tdt = Todt.substring(6, 10) + Todt.substring(3, 5) + Todt.substring(0, 2);           

            if (Tdt >=  Fdt) { return true; }
            else { return false; }

           
        }
        
    }

    public process(date) {
        var parts = date.split("/");
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    public dateTWoComparison(FrmDt: string, Todt: string): boolean {//01/01/2018
        if (FrmDt != undefined && Todt != undefined) {
            const Fdt = FrmDt.substring(6, 10) + FrmDt.substring(3, 5) + FrmDt.substring(0, 2);
            const Tdt = Todt.substring(6, 10) + Todt.substring(3, 5) + Todt.substring(0, 2);
            if (Tdt < Fdt) { return true; }
            else { return false; }
        }
    }
    public date2Comparison(FrmDt: string, Todt: string): boolean {//01/01/2018
        if (FrmDt != undefined && Todt != undefined) {
            const Fdt = FrmDt.substring(6, 10) + FrmDt.substring(3, 5) + FrmDt.substring(0, 2);
            const Tdt = Todt.substring(6, 10) + Todt.substring(3, 5) + Todt.substring(0, 2);
            if (Tdt < Fdt) { return false; }
            else { return true; }
        }
    }
    public date3Comparison(dt1: string, dt2: string, dt3: string): boolean {//01/01/2018
        if (dt1 != undefined && dt2 != undefined) {
            const date1 = dt1.substring(6, 10) + dt1.substring(3, 5) + dt1.substring(0, 2);
            const date2 = dt2.substring(6, 10) + dt2.substring(3, 5) + dt2.substring(0, 2);
            const date3 = dt3.substring(6, 10) + dt3.substring(3, 5) + dt3.substring(0, 2);
            if ((date1 > date2) || (date1 < date3)) { return false; }
            else { return true; }
        }
    }

    public jsonArrayToQueryStringParam(jData) {
        let queryString = '';
        if (jData === null || jData === undefined || jData === '') {
            queryString = '';
        } else {
            for (let key in jData) {
                queryString += key + '=' + jData[key] + '&';
            }
            queryString = '?' + queryString.substring(0, queryString.length - 1);
        }
        return queryString;
    }

    public convertFromdd_mm_yyyTodd_mmm_yyy(strDate) {
        const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let intMonth = strDate.substring(3, 5);
        return strDate.replace("/" + intMonth + "/", "-" + monthNames[Number(intMonth)] + "-");
    }


    public timeFormatAMPM() {
        let date = new Date();
        let hours = date.getHours();
        let minutes: any = date.getMinutes();
        let ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        let strTime = hours + '' + minutes + '' + ampm;
        return strTime;
    }

     public emailvalidation(newValue) {          
        const validEmailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (validEmailRegEx.test(newValue)) {
          //  this.validEmail = true;
            //this._toasterService.toast('warning', 'warning', 'Enter valid E-mail !');
            return true;            
        }else {
         // this.validEmail = false;
         // this._toasterService.toast('warning', 'warning', 'Enter Invalid E-mail !');
         return false;
        }
    
      }

      addDays(dt, days): string {
        var date = new Date(dt);
        var newdate = new Date(date);
       // console.log('adding ' + days + ' days');
         
        newdate.setDate(newdate.getDate() + parseInt(days));
        var dd = newdate.getDate();
        var mm = newdate.getMonth() + 1;
        var y = newdate.getFullYear();
        var dte,mon
        if (dd.toString().length==1)
        {  dte= dte='0'+ dd   }
        else {  dte=  dd.toString()}
        if (mm.toString().length==1)
        {  mon='0'+ mm    }                               
        else {  mon= mm.toString()}

        var someFormattedDate = dte + '/' + mon + '/' + y;
        console.log(someFormattedDate);
        return someFormattedDate;
      }
    
    convertNumberToWords(amount) {
     var value
     var words = new Array();
     words[0] = '';
     words[1] = 'One';
     words[2] = 'Two';
     words[3] = 'Three';
     words[4] = 'Four';
     words[5] = 'Five';
     words[6] = 'Six';
     words[7] = 'Seven';
     words[8] = 'Eight';
     words[9] = 'Nine';
     words[10] = 'Ten';
     words[11] = 'Eleven';
     words[12] = 'Twelve';
     words[13] = 'Thirteen';
     words[14] = 'Fourteen';
     words[15] = 'Fifteen';
     words[16] = 'Sixteen';
     words[17] = 'Seventeen';
     words[18] = 'Eighteen';
     words[19] = 'Nineteen';
     words[20] = 'Twenty';
     words[30] = 'Thirty';
     words[40] = 'Forty';
     words[50] = 'Fifty';
     words[60] = 'Sixty';
     words[70] = 'Seventy';
     words[80] = 'Eighty';
     words[90] = 'Ninety';
     amount = amount.toString();
     var atemp = amount.split(".");
     var number = atemp[0].split(",").join("");
     var n_length = number.length;
     var words_string = "";
     if (n_length <= 9) {
         var n_array = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0);
         var received_n_array = new Array();
         for (var i = 0; i < n_length; i++) {
             received_n_array[i] = number.substr(i, 1);
         }
         for (var i = 9 - n_length, j = 0; i < 9; i++, j++) {
             n_array[i] = received_n_array[j];
         }
         for (var i = 0, j = 1; i < 9; i++, j++) {
             if (i == 0 || i == 2 || i == 4 || i == 7) {
                 if (n_array[i] == 1) {
                     n_array[j] = 10 + (n_array[j]);
                     n_array[i] = 0;
                 }
             }
         }
         value = "";
         for (var i = 0; i < 9; i++) {
             if (i == 0 || i == 2 || i == 4 || i == 7) {
                 value = n_array[i] * 10;
             } else {
                 value = n_array[i];
             }
             if (value != 0) {
                 words_string += words[value] + " ";
             }
             if ((i == 1 && value != 0) || (i == 0 && value != 0 && n_array[i + 1] == 0)) {
                 words_string += "Crores ";
             }
             if ((i == 3 && value != 0) || (i == 2 && value != 0 && n_array[i + 1] == 0)) {
                 words_string += "Lakhs ";
             }
             if ((i == 5 && value != 0) || (i == 4 && value != 0 && n_array[i + 1] == 0)) {
                 words_string += "Thousand ";
             }
             if (i == 6 && value != 0 && (n_array[i + 1] != 0 && n_array[i + 2] != 0)) {
                 words_string += "Hundred and ";
             } else if (i == 6 && value != 0) {
                 words_string += "Hundred ";
             }
         }
         words_string = words_string.split("  ").join(" ")+"Only.";
        
     }
     return words_string;
 } 
 datechnge(value){
    var datePipe = new DatePipe("en-US");
    value = datePipe.transform(value, 'dd/MM/yyyy');
    return value;
}
datechnge1(value){
   // console.log(value);
    
    var datePipe = new DatePipe("en-US");
    value = datePipe.transform(value, 'dd-MMM-yyyy');
    return value;
}
 
toWords(s) {
    var th = ['','Thousand','Million', 'billion','trillion'];
var dg = ['zero','One','Two','Three','Four', 'Five','Six','Seven','Eight','Nine'];
 var tn = ['Ten','Eleven','Twelve','Thirteen', 'Fourteen','Fifteen','Sixteen', 'Seventeen','Eighteen','nineteen'];
 var tw = ['Twenty','Thirty','Fourty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
    s = s.toString();
    s = s.replace(/[\, ]/g,'');
    if (s != parseFloat(s)) return 'not a number';
    var x = s.indexOf('.');
    if (x == -1)
        x = s.length;
    if (x > 15)
        return 'too big';
    var n = s.split(''); 
    var str = '';
    var sk = 0;
    for (var i=0;   i < x;  i++) {
        if ((x-i)%3==2) { 
            if (n[i] == '1') {
                str += tn[Number(n[i+1])] + ' ';
                i++;
                sk=1;
            } else if (n[i]!=0) {
                str += tw[n[i]-2] + ' ';
                sk=1;
            }
        } else if (n[i]!=0) { // 0235
            str += dg[n[i]] +' ';
            if ((x-i)%3==0) str += 'Hundred ';
            sk=1;
        }
        if ((x-i)%3==1) {
            if (sk)
                str += th[(x-i-1)/3] + ' ';
            sk=0;
        }
    }
    
    if (x != s.length) {
        var y = s.length;
        str += 'point ';
        for (var j=x+1; j<y; j++)
            str += dg[n[j]] +' ';
    }
    return str.replace(/\s+/g,' ') + "Only.";
}

ConvertNumberToWordsNew(number) {
    var value
    var words = new Array();
    words[0] = '';
    words[1] = 'One';
    words[2] = 'Two';
    words[3] = 'Three';
    words[4] = 'Four';
    words[5] = 'Five';
    words[6] = 'Six';
    words[7] = 'Seven';
    words[8] = 'Eight';
    words[9] = 'Nine';
    words[10] = 'Ten';
    words[11] = 'Eleven';
    words[12] = 'Twelve';
    words[13] = 'Thirteen';
    words[14] = 'Fourteen';
    words[15] = 'Fifteen';
    words[16] = 'Sixteen';
    words[17] = 'Seventeen';
    words[18] = 'Eighteen';
    words[19] = 'Nineteen';
    words[20] = 'Twenty';
    // words[21] = 'Twenty One';
    // words[22] = 'Twenty Two';
    // words[23] = 'Twenty Three';
    // words[24] = 'Twenty Four';
    // words[25] = 'Twenty Five';
    // words[26] = 'Twenty Six';
    // words[27] = 'Twenty Seven';
    // words[28] = 'Twenty Eight';
    // words[29] = 'Twenty Nine';
    words[30] = 'Thirty';
    words[40] = 'Forty';
    words[50] = 'Fifty';
    words[60] = 'Sixty';
    words[70] = 'Seventy';
    words[80] = 'Eighty';
    words[90] = 'Ninety';
    number = number.toString();
    var atemp = number.split(".");
    var number = atemp[0].split(",").join("");
    var n_length = number.length;
    var words_string = "";
    var ten =10;
    if (n_length <= 9) {
        var n_array  = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0);
        var received_n_array  = new Array();
        for (var i = 0; i <n_length; i++) {
            received_n_array[i] = number.substr(i, 1);
        }
        for (var i =9 - n_length,j =0; i < 9; i++ , j++) {
            n_array[i] = received_n_array[j];
        }
        for (var i =0,j =1; i < 9; i++ , j++) {
            if (i == 0 || i == 2 || i == 4 || i == 7) {
                if (n_array[i] == 1) {
                    n_array[j] = Number(10) + Number((n_array[j]));
                    n_array[i] = 0;
                }
            }
        }
        value ="";
        for (var i =0; i < 9; i++) {
            if (i == 0 || i == 2 || i == 4  ||  i == 7) {
                value =n_array[i] * 10;
            } else {
                value =n_array[i];
            }
            if (value != 0) {
                words_string += words[value] + " ";
            }
            if ((i == 1 && value != 0) || (i == 0 && value != 0 && n_array[i + 1] == 0)) {
                words_string += "Crores ";
            }
            if ((i == 3 && value != 0) || (i == 2 && value != 0 && n_array[i + 1] == 0)) {
                words_string += "Lakhs ";
            }
            if ((i == 5 && value != 0) || (i == 4 && value != 0 && n_array[i + 1] == 0)) {
                words_string += "Thousand ";
            }
            if (i == 6 && value != 0 && (n_array[i + 1] != 0 && n_array[i + 2] != 0 )) {
                words_string += "Hundred and ";
            } else if (i == 6 && value != 0) {
                words_string += "Hundred ";
            }
            // else if (i == 6 && value != 0 && atemp[1] > 0) {
            //     words_string += "Hundred ";
            // }
        }
        // let paise =atemp[1];
        // if(Number(paise) > 0){
        //     words_string = words_string.split("  ").join(" ") + words[Number(paise)]  +" paise Only.";
        // }
        // else{
            words_string = words_string.split("  ").join(" ") + "Only.";
        //}
        
    }
    return words_string;
}
  url = 'http://localhost:58899/Api/Excel';  

  
  UploadExcel(formData: FormData) {  
    
    let headers = new HttpHeaders();  
  
    headers.append('Content-Type', 'multipart/form-data');  
    headers.append('Accept', 'application/json');  
  
    const httpOptions = { headers: headers };  
  
    return this.http.post(this.url + '/UploadExcel', formData, httpOptions)  
  }  
  postAndGetResponse(fileName,FileType) {
    this.rptdownloadurl =this._configuration.Server;
    const url = `${this.rptdownloadurl}/api/Accounts/DownloadAttachment?fileName=${fileName}&FileType=${FileType}`;
    //return this.http.get(this.rptdownloadurl + '/api/Accounts/DownloadAttachment?fileName=' + fileName  , { responseType: 'blob' as 'blob' });
    return this.http.get(url, { responseType: 'blob' as 'blob' });
  }
  postAndGetResponsezip(fileName) {
        this.rptdownloadurl =this._configuration.Server;
        const url = `${this.rptdownloadurl}/api/Accounts/DownloadZip?fileName=${fileName}`;
        //return this.http.get(this.rptdownloadurl + '/api/Accounts/DownloadAttachment?fileName=' + fileName  , { responseType: 'blob' as 'blob' });
        return this.http.get(url, { responseType: 'blob' as 'blob' });
      }

  postFileUpload(fileToUpload: File): Observable<boolean> {
    const endpoint = 'http://localhost:58899/api/Accounts';
    //const endpoint = 'http://localhost:53475/api/login/insert';
    //const endpoint = 'http://apiguruji.manansh.com/api/gallery/insert';
    let formData: FormData = new FormData();
    //const headers = new HttpHeaders();

    let headers = new HttpHeaders({
        "Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=UTF-8"
    });  

    // let config = {
    //     headers: {
    //         'Accept': 'application/json',
    //         "Content-Type":"multipart/form-data;charset=UTF-8"
    //     }
    // };

    //headers.append('Content-Type', 'multipart/form-data');  
    //headers.set('Content-Type', 'multipart/form-data;charset=UTF-8');  

    

    formData.append('file', fileToUpload);
    formData.append('key','fileup');
    return this.http
      .post(endpoint, formData,{headers})
      .map(() => { return true; });     
}
}




@Injectable()
export class CustomInterceptor implements HttpInterceptor {

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!req.headers.has('Content-Type')) {
            req = req.clone({ headers: req.headers.set('Content-Type', 'application/json') });
        }

        req = req.clone({ headers: req.headers.set('Accept', 'application/json') });
        //console.log(JSON.stringify(req.headers));
        return next.handle(req);
    }
}
