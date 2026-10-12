import { Injectable } from '@angular/core';

@Injectable()
export class Configuration {
    public Server = 'http://localhost:58812//';   
   //public Server = 'http://180.179.207.163/Links-api/';
  
    //public Server = 'http://180.179.207.163/Links-api/';    
    public ApiUrl = 'api/';
    public rpturl = 'http://180.179.207.163/Lnkrptdownload/'; 
    public ServerWithApiUrl = this.Server + this.ApiUrl;
    public CryptKey = '6Le0DgMTAAAAANokdEEial';
    public CrtyptIv = 'mHGFxENnZLbienLyANoi.e';
}

