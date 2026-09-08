import{Component,OnInit,ViewChild} from '@angular/core';
import{ActivatedRoute,Router} from '@angular/router';
import{DataService} from '../../shared/service/dataService';
import{AuthService} from '../../shared/service/authService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service'; 
import {Item} from './Cls-common.item';
import {ITEMS,REQITEMS} from './Cls-common.item';

 
@Component({
    selector: 'app-commonsearch',
    templateUrl: 'Common-Search.component.html'

})


export class Commonsearch     { 
    itemsList: Item[] = ITEMS;
    ReqitemsList: Item[] = REQITEMS;
    Reqlist:any=[];
    radioSel:any;
    radioSelected:string= "Exporter";
    radioSelectedString:string;

    ReqradioSel:any;
    ReqradioSelected:string;
    ReqradioSelectedString:string;

    searchwith :string="begin";
    Srchname: string="";

    config: any;
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService,   
        
        //private http1: Http   

    ) {   this.itemsList = ITEMS;   
         this.ReqitemsList = REQITEMS;   
      console.log(this.itemsList);
    }

     // Get row item from array  
     getSelecteditem(){
        this.radioSel = ITEMS.find(Item => Item.value === this.radioSelected);
        this.radioSelectedString = JSON.stringify(this.radioSel);
        console.log(this.radioSelectedString);
      }
      // Radio Change Event
      onItemChange(item){
        this.getSelecteditem();
      }

      ReqgetSelecteditem(){
        this.ReqradioSel = REQITEMS.find(ReqItem => ReqItem.value === this.ReqradioSelected);
        this.ReqradioSelectedString = JSON.stringify(this.ReqradioSel);
      }
      // Radio Change Event
      ReqonItemChange(Reqitem){
        this.ReqgetSelecteditem();
      }
      Search()
      {
        let strSearchTxt;
        if (this.searchwith=='anywhere'){
            strSearchTxt='%'+this.Srchname.replace(' ','%') +'%'
        }
        else{
            strSearchTxt= this.Srchname.replace(' ','%') +'%'
        }
        const jsonmaster = {  rqPage:this.radioSelected ,strSearchTxt:strSearchTxt }
        this.loaderService.display(true);
        this._dataService.getData("Master/Master_Search_common",jsonmaster)
        .subscribe((data: any) => {
             this.Reqlist=data.Table;
             this.loaderService.display(false);
        });
        this.config = {
            itemsPerPage: 25,
            currentPage: 1,
            totalItems: this.Reqlist.count
          };  
    }
    pageChanged(event){
        this.config.currentPage = event;
      }
      ListOnclick(code)
        {
        if(this.radioSelected=="Exporter"){
            this._router.navigate(['/master/request/client/ /'+code]);
        }
        else if(this.radioSelected=="RequestExporter"){
            this._router.navigate(['/master/request/client/TEMP/'+code]);
        }
        else if(this.radioSelected=="Consignee"){
            this._router.navigate(['/master/request/consignee/ /'+code]);
        }
        else if(this.radioSelected=="RequestConsignee"){
            this._router.navigate(['/master/request/consignee/TEMP/'+code]);
        }
        // add as exporter
        else if(this.radioSelected=="isExporter"){
            this._router.navigate(['/master/request/client/isExporter/'+code]);
        }
        else if(this.radioSelected=="Supplier"){
            this._router.navigate(['/master/request/supplier/ /'+code]);
        }
        else if(this.radioSelected=="RequestSupplier"){
            this._router.navigate(['/master/request/supplier/TEMP/'+code]);
        }
        else if(this.radioSelected=="RequestAgentVessel"){
            this._router.navigate(['/master/request/AgentVessel/TEMP/'+code]);
        }
        else if(this.radioSelected=="AgentVessel"){
            this._router.navigate(['/master/request/AgentVessel/ /'+code]);
        }
        else if(this.radioSelected=="RequestLiner"){
            this._router.navigate(['/master/request/Liner/TEMP/'+code]);
        }
        else if(this.radioSelected=="Liner"){
            this._router.navigate(['/master/request/Liner/ /'+code]);
        }
        // else if(this.radioSelected=="ConsigneeBank"){
        //     this._router.navigate(['/master/common/ConsigneeBank/ /'+code]);
        // }
        else if(this.radioSelected=="ConsigneeBank"){
            this._router.navigate(['/master/common/ConsigneeBank/'+code]);
        }
        }
        Cancel()
        {
            this.Reqlist=[]; 
            this.Srchname="";
        }
}