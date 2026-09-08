import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Configuration } from '../../app.constants';
@Injectable({
  providedIn: 'root'
})
export class FileDownloadService {

  private apiUrl : string; // Replace with your API URL
  

  constructor(private http: HttpClient,
 private _configuration: Configuration

  ) {this.apiUrl = _configuration.ServerWithApiUrl; }

  // Download file by filename
  downloadFile(fileName: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/download/${fileName}`, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  // Download file by full path
  downloadFileByPath(filePath: string): Observable<Blob> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/download`, 
      { filePath: filePath }, 
      { 
        headers: headers,
        responseType: 'blob' 
      }
    );
  }
}