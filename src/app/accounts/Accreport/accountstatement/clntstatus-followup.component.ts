import { Component, OnInit ,OnChanges,Input} from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import {DataService} from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service'; 
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
    templateUrl: './clntstatus-followup.component.html',
})
export class ClientStatusFollowup implements OnInit  {
    @Input() AssignedDate: string = '';
    clntflpList:any=[];
    codelistActt :any=[] ;
    Narration: string="";
    ClientName: string;
    ClientNameList:any=[];
    ClStatus:string;
    AssignedTo:string;
    text: string="Submit";txtchild : string ="Add";txtadd:string ="Add";
    Header: string="CLIENT STATUS FOLLOWUP";
    AssignDate ;
 
    formData: any = {
        ASSIGNDT: { main: null, hour: '', minute: '', text: '', newdata: '' }
    }
public myDatePickerOptions: IMyDpOptions = {
    dateFormat: 'dd/mm/yyyy',
    inline: false,
    height: '16px',
    width: '150px',
    componentDisabled: false,
    selectionTxtFontSize: '12px',
    editableDateField: false,
    sunHighlight: true,
    satHighlight: true,
    firstDayOfWeek: 'su',
    openSelectorTopOfInput: false,
    openSelectorOnInputClick: true,
    selectorHeight: '180px',
    selectorWidth: '200px'
};

constructor( 
    private _dataService: DataService, 
    private _toasterService:ToastCommonService, 
    private loaderService: LoaderService, 
    private _router: Router,
    private datePipe: DatePipe,
    private http: HttpClient, 
    private _activatedRoute: ActivatedRoute,
    private _loginService:LoginService,   ) { }
ngOnInit() { 
        // this.AssignDate=new Date();
        // this.AssignDate=this._dataService.datechnge(this.AssignDate)
        // this.formData["ASSIGNDT"].main = this.AssignDate
        this.FillClient();
       /// this.AssignedDate=this.datePipe.transform(this.AssignedDate, 'dd/mm/yyyy') ////+ this.datePipe.transform(this.AssignedDate, 'hh:mm:ss')
    }

    FillClient()
    { 
    const jsonparam= {  
        citycode:this._loginService.getLogin()[0].CITYCODE,
       }
        this._dataService.getData("Accounts/ACC_EXP_MST_EXPORT_MISC_JOB_FILL_CLIENT",jsonparam)
        .subscribe((data: any) => {
        this.ClientNameList=data.Table;
        });
    }
    Addrcrd()  {
        if(this.ClientName=="" || this.ClientName==undefined)   {
            this._toasterService.toast('warning', 'warning', 'Please select Client  !');
            return false;
         }
         if(this.AssignedTo=="" || this.AssignedTo==undefined)   {
            this._toasterService.toast('warning', 'warning', 'Please Enter Assigned To  !');
            return false;
         }
         if(this.ClStatus=="" || this.ClStatus==undefined)   {
            this._toasterService.toast('warning', 'warning', 'Please Enter Client Status  !');
            return false;
         }
         for (let key in this.formData) {
            let main = this.formData[key]["main"];
            let hour = this.formData[key]["hour"];
            let minute = this.formData[key]["minute"];
            let text =  this.formData[key]["text"];
                if (main == null || main == undefined) {
                alert("Please select Date");
                return false;
                    }   
                if (hour == '' || minute == '') {
                    alert("Please enter " + this.formData[key]["text"] + " hours[00 to 24] and minutes[00 to 60].");
                    return false;
                } else {
                    this.formData[key]["newdata"] = String(main.formatted) + ' ' + hour + ':' + minute + ':' + '00';
                }
          
          
        }

         const jsondata= {CmpId:this._loginService.getLogin()[0].CMPID,
         Exp_Code:this.ClientName,
         AssignTo:this.AssignedTo,
         Client_Status:this.ClStatus,
         AssignOn:this.formData["ASSIGNDT"]["newdata"],
          }
          this._dataService.getData("Accounts/ACC_TRA_CLIENT_STATUS_FOLLOWUP_IU", jsondata)
          .subscribe((data: any) => {    
            if (data.Table[0].STATUS == "100") {
                this.GetFollowupdtls(this.ClientName);
                this.Resetrcrd();
            }
            else
            {   this._toasterService.toast("warning","warning" ,"");
            this.loaderService.display(false);
            }
        });

        }
        GetFollowupdtls(code){ 
            const jsondata= {
                EXP_CODE:code,
                   }
                 this._dataService.getData("Accounts/ACC_TRA_CLIENT_STATUS_FOLLOWUP_GETDTLS", jsondata)
                 .subscribe((data: any) => {    
                   if (data.Table[0].STATUS == "100") {
                       this.clntflpList=data.Table1;
                   }
                   else
                   {   this._toasterService.toast("warning","warning" ,"");
                   this.loaderService.display(false);
                   }
               });
        }
        Resetrcrd()
        { 
            this.ClientName=undefined;
            this.AssignedTo="";
            this.ClStatus="";
            this.clntflpList= [];
            this.formData["ASSIGNDT"].main="";
            this.formData["ASSIGNDT"].hour="";
            this.formData["ASSIGNDT"].minute="";
        }
        setTime(type, key) {
            // console.log(this.formData[type][key]);
             if (this.formData[type][key]) {
                 this.setNumber(type, 'hh');
                 this.setNumber(type, 'mm');
             } else {
                 this.formData[type]["hour"] = '';
                 this.formData[type]["minute"] = '';
             }
         }
         setNumber(type, typeone) {
            let date = new Date();
            if (typeone == 'hh') {
                this.formData[type]["hour"] = (date.getHours() < 10 ? '0' : '') + date.getHours();
            } else if (typeone == 'mm') {
                this.formData[type]["minute"] = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
            }
        }
        restrictMinute00to60number(type) {
            if (this.formData[type]["minute"]) {
                if (Number(this.formData[type]["hour"]) > 60) {
                    this.formData[type]["hour"] = '';
                } else {
                    this.setNumber(type, 'mm');
                }
            }
        }
        restrictHour01to24number(type) {
            if (this.formData[type]["hour"]) {
                if (Number(this.formData[type]["hour"]) > 24) {
                    this.formData[type]["hour"] = '';
                } else {
                    this.setNumber(type, 'hh');
                }
            }
        }
        }    

 