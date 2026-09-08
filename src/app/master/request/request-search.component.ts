import{Component,OnInit,ViewChild} from '@angular/core';
import{ActivatedRoute,Router} from '@angular/router';
import{DataService} from '../../shared/service/dataService';
import{AuthService} from '../../shared/service/authService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service'; 
 

 
@Component({
    selector: 'app-mastersearch',
    templateUrl: 'request-search.component.html'

})


export class ReqMastersearch  implements OnInit  { 
    searchwith :string="begin";
    Reqlist:any=[];
    queryParamsReqType: string = "";
    Srchname: string="";
    Reqexp_code :any=[];
    Header :string="";
    Request :string="";
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

    ) {      }
    ngOnInit()
    {
        this._activatedRoute.params.subscribe(params => {
            this.queryParamsReqType = params["ReqType"];           
        })
        if(this.queryParamsReqType=="Exporter"){
            this.Header='EXPORTER SEARCH';    
            this._loginService.verifyRights(104, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });        
        }
        else if(this.queryParamsReqType=="RequestExporter"){
            this.Header='EXPORTER REQUEST SEARCH';
            this. onload();
            this.Request='Request';
             
        }
        else if(this.queryParamsReqType=="Supplier"){
            this.Header='SUPPLIER SEARCH';
            this._loginService.verifyRights(105, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });    
        }
        else if(this.queryParamsReqType=="RequestSupplier"){
            this.Header='SUPPLIER REQUEST SEARCH';
            this. onload();
           // this.Request='Request';
             
        }
        else if(this.queryParamsReqType=="consignee"){
            this.Header='CONSIGNEE SEARCH';
            this._loginService.verifyRights(106, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });    
        }
        else if(this.queryParamsReqType=="RequestConsignee"){
            this.Header='CONSIGNEE REQUEST SEARCH';
            this. onload();
            //this.Request='Request';
              
        }
        else if(this.queryParamsReqType=="isExporter"){
            this.Header='CONSIGNEE ADD AS AN EXPORTER';
            this._loginService.verifyRights(123, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });    
        }
        else if(this.queryParamsReqType=="AgentVessel"){
            this.Header='AGENT VESSEL SEARCH';
            this._loginService.verifyRights(107, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });    
        }
        else if(this.queryParamsReqType=="RequestAgentVessel"){
            this.Header='AGENT VESSEL REQUEST SEARCH';
            this. onload();
           // this.Request='Request';
          
        }
        else if(this.queryParamsReqType=="Liner"){
            this.Header='SHIPPING LINER SEARCH';
            this._loginService.verifyRights(108, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });    
        }
        else if(this.queryParamsReqType=="RequestLiner"){
            this.Header='SHIPPING LINER REQUEST SEARCH';
            this. onload();
           // this.Request='Request';
             
        }
        else if(this.queryParamsReqType=="ConsigneeBank"){
            this.Header='CONSIGNEE BANK SEARCH';
            this._loginService.verifyRights(109, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });    
        }
      
    }
    onload()
    {
        let strSearchTxt;
        if (this.searchwith=='anywhere'){
            strSearchTxt='%'+this.Srchname.replace(' ','%') +'%'
        }
        else{
            strSearchTxt= this.Srchname.replace(' ','%') +'%'
        }
        const jsonmaster = {  rqPage:this.queryParamsReqType ,strSearchTxt:strSearchTxt }
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
    chkonchange(chk,code)
    {
    if (chk==true){
        this.Reqexp_code=this.Reqexp_code + ','+code +',' ;
        this.Reqexp_code=   this.Reqexp_code.replace(',,',',')
        }
        else{
            this.Reqexp_code=   this.Reqexp_code.replace(code,'')
            this.Reqexp_code=   this.Reqexp_code.replace(',,',',')
        }
    }
    delete()
    {
      
        const jsonmaster = {strSearchTxt: this.Reqexp_code,makerid:this._loginService.getLogin()[0].CMPID ,makerip:this._loginService.getLogin()[0].MAKERIP }
        
        this.loaderService.display(true);
        let url;
        if(this.queryParamsReqType=="RequestExporter"){
            url="Master/Master_REQLIST_DELETE";
        }
        else  if(this.queryParamsReqType=="RequestConsignee"){
            url="Master/Master_REQLIST_DELETE_consignee";
        }
        if(this.queryParamsReqType=="RequestAgentVessel"){
            url="Master/Master_REQLIST_DELETE_Supplier";
        }
        if(this.queryParamsReqType=="AgentVessel"){
            url="Master/Master_REQLIST_DELETE_Agent";
        }
        if(this.queryParamsReqType=="RequestLiner"){
            url="Master/Master_REQLIST_DELETE_Liner";
        }
         
        this._dataService.getData(url,jsonmaster)
         

        .subscribe((data: any) => {
           //  this.Reqlist=data.Table;
            // this.loaderService.display(false);
             this._toasterService.toast('success', 'success', 'Requset delete successfully !');
             
        });
        this.onload();
        this.loaderService.display(false);
    }


    Search()
    {
        this.onload();
    }
    Cancel()
    {
        this.Reqlist=[]; 
        this.Srchname="";
    }
    ListOnclick(code)
    {
        if(this.queryParamsReqType=="Exporter"){
            this._router.navigate(['/master/request/client/ /'+code]);
        }
        else if(this.queryParamsReqType=="RequestExporter"){
            this._router.navigate(['/master/request/client/TEMP/'+code]);
        }
        else if(this.queryParamsReqType=="consignee"){
            this._router.navigate(['/master/request/consignee/ /'+code]);
        }
        else if(this.queryParamsReqType=="RequestConsignee"){
            this._router.navigate(['/master/request/consignee/TEMP/'+code]);
        }
        // add as exporter
        else if(this.queryParamsReqType=="isExporter"){
            this._router.navigate(['/master/request/client/isExporter/'+code]);
        }
        else if(this.queryParamsReqType=="supplier"){
            this._router.navigate(['/master/request/supplier/ /'+code]);
        }
        else if(this.queryParamsReqType=="RequestSupplier"){
            this._router.navigate(['/master/request/supplier/TEMP/'+code]);
        }
        else if(this.queryParamsReqType=="RequestAgentVessel"){
            this._router.navigate(['/master/request/AgentVessel/TEMP/'+code]);
        }
        else if(this.queryParamsReqType=="AgentVessel"){
            this._router.navigate(['/master/request/AgentVessel/ /'+code]);
        }
        else if(this.queryParamsReqType=="RequestLiner"){
            this._router.navigate(['/master/request/Liner/TEMP/'+code]);
        }
        else if(this.queryParamsReqType=="Liner"){
            this._router.navigate(['/master/request/Liner/ /'+code]);
        }
        else if(this.queryParamsReqType=="ConsigneeBank"){
            this._router.navigate(['/master/common/ConsigneeBank/'+code]);
        }
       
    }
}