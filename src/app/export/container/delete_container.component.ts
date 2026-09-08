import { Component, OnInit} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { Router } from '@angular/router';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoginService } from '../../shared/service/loginService';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    templateUrl: 'delete_container.component.html',
    styles: [`
    table, tr, td, th{
         border: none;

         }
    `],
})
export class DeleteContainer implements OnInit {
    containerno;
    containerlist:any=[];
    msg:string="";
    public disabledeletebtn:boolean=true;
        constructor(private _router: Router,
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _route: ActivatedRoute,
        private _loaderService: LoaderService) { }

    ngOnInit() {
         this._loginService.verifyRights(430, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });
        }
        search(){
          const jsondata = {
            CONTAINERNO: this.containerno,
            MODE: 'SEARCH',
              }
         this._dataService.getData("Export/EXP_CONTAINER_UPDATE_EXISTCONTAINER", jsondata)
             .subscribe((data: any) => {
                 //console.log(data);
                 if(data.Table[0].STATUS == "100"){
                    this.msg=data.Table[0].STATUSTXT;
                    this.containerlist=data.Table1;
                    this.disabledeletebtn=false;
                   }
                   else if(data.Table[0].STATUS == "103"){
                    alert(data.Table[0].STATUSTXT)
                   }
                })  
        }
        DeleteContainer(){
             
             if(confirm('Are you sure you want to delete container ' + this.containerno + ' ?')){
            this._loaderService.display(true);
            const jsondata = {
            CONTAINERNO: this.containerno,
            MODE: 'DELETE',
              }
         this._dataService.getData("Export/EXP_CONTAINER_UPDATE_EXISTCONTAINER", jsondata)
             .subscribe((data: any) => {
                 //console.log(data);
                 if(data.Table[0].STATUS == "100"){
                    alert('container deleted successfully');
                    this.containerlist=[];
                    this.containerno='';
                    this.msg='';
                    this._loaderService.display(false);
                    return false;
                   }
                })   
       
                 }
                 else {
                    this._loaderService.display(false);
                    return false;
                } 
        }
    }