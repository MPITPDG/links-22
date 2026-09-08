
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { DomSanitizer } from '@angular/platform-browser';
import {Configuration}  from '../../app.constants'
@Component({
  selector: 'app-ReportDownload',
  templateUrl: './report-download.component.html',
  styles: []
})
export class ReportDownload implements OnInit {
    constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private _router: Router,
        private http: HttpClient,  
        private _activatedRoute: ActivatedRoute,
        private _loginService: LoginService,
        private sanitizer: DomSanitizer,
        private _config:Configuration
      ) { }

      fileUrl;
      PKID : string="";
      DTTablelog1 :any[];
      DTTablelog2 :any[];
      DTTablelog3 :any[];
      DTTabledown2 :any[];
      DTTableHistory:any[];
      Mode: string="";
      rptdownloadurl:string;

      ngOnInit() {

        this.rptdownloadurl=this._config.rpturl;


        this._activatedRoute.params.subscribe(params => {
            this.PKID = params["LogID"];
            this.Mode=  params["ReportMode"];          
        })
        if(this.PKID==" ")
        {
this.fn_ReportHistory(this.PKID)
        }
        else
        {
        this.fn_InProcess(this.PKID);
      }
      }
      fn_InProcess(Pklogid){
        const jsonview = {
            fkID:this.PKID,           
            CMPID   :this._loginService.getLogin()[0].CMPID              
          }
          this._dataService.getData("Accounts/REPORT_LOG_SCRIPT", jsonview)
            .subscribe((data: any) => {
             this.DTTablelog1=data.Table;
             this.DTTablelog2=data.Table1;
             this.DTTablelog3=data.Table2;
            
            });
      }
      fn_Download(pkid,mode){
        const jsonview = {
            fkID:this.PKID,   
            Mode:mode,       
            CMPID   :this._loginService.getLogin()[0].CMPID              
          }
          this._dataService.getData("Accounts/REPORT_LOG_DOWNLOAD", jsonview)
            .subscribe((data: any) => {
             this.DTTablelog1=data.Table;
             this.DTTablelog2=data.Table1;
            
            });
        // /// const data = 'some text';
        //  const blob = new Blob([url], { type: 'application/octet-stream' });
        //  this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(window.URL.createObjectURL(blob));
        //  (window.URL.createObjectURL(blob));
      }
      fn_ReportHistory(Pklogid){
        const jsonview = {
          CmpId:this._loginService.getLogin()[0].CMPID,
              FormId:"",           
              ReportMode:"HISTROY"           
          }
          this._dataService.getData("Accounts/REPORT_LOG_FILL", jsonview)
            .subscribe((data: any) => {
             this.DTTableHistory=data.Table2;
                        
            });
      }
}