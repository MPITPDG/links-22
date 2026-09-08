import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-ExJobSearch',
    templateUrl: './exportJob.component.html',
    styles: []
  })
  export class ExportJobSearch implements OnInit {

   
    ContainerData:any = [];
    ContainerDataList:any = [];
    OtherDataList = [];
     ExportNo:string;
     Header:string="MIS - Export Job Search";
     DataHeader= [];
     lblexportNo :string="Export No";
     todtlbl :string="Sailing Date To";
     rdbtype:string="EXPORTNO";
     PageType:string="MIS - Export Job Search";
    constructor(private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private http: HttpClient, private datePipe: DatePipe,
        private _activatedRoute: ActivatedRoute,private _router:Router,
        private _loginService: LoginService,
        private exportser: ExportexcelService,
      ) { }
      ngOnInit() { 
        
        }
        SearchData()
        { 
          if(this.rdbtype=="EXPORTNO")
          { 
            if(this.ExportNo.length<15)
            { 
              this._toasterService.toast("warning","warning","Ex-Job no should be 15 digit!")
              return false;
            }
          }
          if(this.rdbtype=="FCR_NO")
          { 
            if(this.ExportNo=="" || this.ExportNo==undefined)
            { 
              this._toasterService.toast("warning","warning","Please Enter FCR No. ")
              return false;
            }
          }
          if(this.rdbtype=="HAWB_NO")
          { 
            if(this.ExportNo=="" || this.ExportNo==undefined)
            { 
              this._toasterService.toast("warning","warning","Please Enter HAWB No. ")
              return false;
            }
          }
          if(this.rdbtype=="MAWB_NO")
          { 
            if(this.ExportNo=="" || this.ExportNo==undefined)
            { 
              this._toasterService.toast("warning","warning","Please Enter MAWB No. ")
              return false;
            }
          }
          if(this.rdbtype=="containerno")
          { 
            if(this.ExportNo=="" || this.ExportNo==undefined)
            { 
              this._toasterService.toast("warning","warning","Please Enter Container No. ")
              return false;
            }
          }
          const jsonData = {
            searchtype:this.rdbtype,
            searchval: this.ExportNo,
            cmp_code: this._loginService.getLogin()[0].CMPCODE,
            CityCode:this._loginService.getLogin()[0].CITYCODE,
             }
            this._dataService.getData("Accounts/Export_Search_List_acct", jsonData)
            .subscribe((data: any) => {
              
              if(data.Table.length>1)
              {
                this.ContainerData=data.Table;
                if(this.rdbtype=='containerno') {
                this.FillContainer();
              }
              else{
                this.FillOtherdtls();
              }
              }
              else
              {
                let exptno;
                exptno=data.Table[0].EXPTNO
                let theTop = (screen.height / 2) - (483 / 2);
          let theLeft = (screen.width / 2) - (780 / 2);
          let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
          window.open('./#/popup/Export-Consignment-view/' +  exptno + '/', "CONSIGNMENT VIEW", toolbar);
              }
              
             })
             this.ContainerDataList=[];
             this.OtherDataList=[];
             this.ContainerData=[];    
            // let first2 = this.ContainerData[0];
        }
        FillContainer() {
        for (var i = 1; i <= 1; i++) {
          let obj = {
            CONTAINERNO: this.ContainerData[i].CONTAINERNO,
            expt_vessel:this.ContainerData[i].expt_vessel,
            verified:this.ContainerData[i].verified ,
            loaddt:this.ContainerData[i].loaddt
        }
          this.ContainerDataList.push(obj);
        }
      }
      FillOtherdtls() {
        for (var i = 1; i <= 1; i++) {
          let obj = {
            MAWBNO: this.ContainerData[i].MAWBNO,
            MAWBDEST:this.ContainerData[i].MAWBDEST,
            P_PKGS:this.ContainerData[i].P_PKGS ,
            P_GRWT:this.ContainerData[i].P_GRWT,
            P_CHBLWT:this.ContainerData[i].P_CHBLWT,
            FLIGHTDTLS:this.ContainerData[i].FLIGHTDTLS,
            ACTFLIGHTDTLS:this.ContainerData[i].ACTFLIGHTDTLS,
            ETAPORT1:this.ContainerData[i].ETAPORT1
        }
          this.OtherDataList.push(obj);
        }
      }
        lblchange(val){
          this.ContainerDataList=[];
          this.OtherDataList=[];
          this.ContainerData=[];
          if(val.target.value=="EXPORTNO"){
         this.lblexportNo="Export Code"  }
         else if(val.target.value=="FCR_NO"){
          this.lblexportNo="FCR No"
           }
         else if(val.target.value=="HAWB_NO"){
          this.lblexportNo="HAWB No."
               }
         else if(val.target.value=="MAWB_NO"){
          this.lblexportNo="MAWB No"
                }
                else if(val.target.value=="containerno"){
                  this.lblexportNo="Container No"
                        }
        this.ExportNo="";        
        }
        ViewConsignment(ExportNo)
        { 
          let theTop = (screen.height / 2) - (483 / 2);
          let theLeft = (screen.width / 2) - (780 / 2);
          let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
          window.open('./#/popup/Export-Consignment-view/' +  ExportNo + '/', "CONSIGNMENT VIEW", toolbar);
          
      }
      Reset() { 
        this.rdbtype="EXPORTNO";
        this.ExportNo="";
        this.lblexportNo="Export Code";
      }
    }