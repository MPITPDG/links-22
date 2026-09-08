import { Component, OnInit,EventEmitter,Output,Input ,OnChanges,ViewChild} from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoaderService } from '../../../shared/service/loader.service';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
@Component({
  selector: 'app-staffpurchase-view',
  templateUrl: './staffpurchase-view.component.html',
  styles: []
})
export class staffpurchaseViewComponent implements OnInit, OnChanges  {
    display='none';
    @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() hideModal: EventEmitter<any> = new EventEmitter();
   /// @Output() OutSRIPNO: EventEmitter<any> = new EventEmitter<any>();
    @Input() purcode: string = '';
    @Input() flag: string = '';
    @Input() authstatus: string ='';
    @Input() authstatlist: string ='';
    PUR_CODE:string="";
    PUR_DATE:string="";
    REMARKS:string="";
    PUR_SUPPLIER:string;
    PUR_SUPPLIERNAME:string;
    PASSEDBY:string="";
    PASSEDAMOUNT:string="";
    SUPINVAMT:string="";
    VOUCHERNO:string="";
    datatabl_1=[];
    ID:string;
	AccountName:string;
	Amount:string;
	Deduction:string;
	actpassedamount:string;
    Item:string;
    ItemName:string;
	JobNo:string;ng
	ActNarration:string;
	txtchild:string ="Add";;
	ACCBANKDTLSID:string;
	ISNOTEDITABLE:string;
    ACCTNAME:string;  
    Allitemlist:any=[];
    Stafflist:any=[];
    codelistActt :any=[] ;
    PassedBylist:any=[];
    AccountNameList:any=[]; 
    NetAmount: string="0";
    Netdeduction: string="0";
    text: string="Verify";txtadd:string ="Add";
    NetAmt:string="0";
    VGUID:string=""
    IsPassed: boolean = false;
    passedby: string="";
    staff: string="";
    PASSEDBYPERSON: string="";
    FLAG: string="";
    AUTHSTATUS: string="";
    public disable_Accountname: boolean = false;
    public disable_Item: boolean = false;
    public disable_Amount: boolean = false;
    public disable_JobNo: boolean = false;
    public disable_IsPassed: boolean = false;
    constructor( public _dataService: DataService,
        private _toasterService:ToastCommonService, 	
        private _route: ActivatedRoute,public _loginService: LoginService,
        private loaderService: LoaderService) {}
  
    ngOnInit() {
       this._route.params.subscribe(params => {
       this.PUR_CODE= params["pur_code"];
        this.FLAG=  params["flag"];
        this.AUTHSTATUS=  params["authstatus"];
        //this.authstatlist= params["authstatlist"];
        });
        this.disable_Accountname=true;
        this.disable_Item=true;
        this.disable_Amount=true;
        this.disable_JobNo=true;
        this.staffpurchaseviewdata(this.PUR_CODE);
       }
      
    PageLoad()
    {
    const jsonparam= {  cmp_code:this._loginService.getLogin()[0].CMPCODE,
        citycode:this._loginService.getLogin()[0].CITYCODE,
        citycode1:this._loginService.getLogin()[0].CITYCODE1,
        PSTATUS:"SRPI" }
    this._dataService.getData("Accounts/ACC_PURCHASE_PAGELOAD",jsonparam)
    .subscribe((data: any) => {
        this.AccountNameList=data.Table;
        this.Stafflist=data.Table1;
        this.PassedBylist=data.Table2;
        this.Allitemlist=data.Table3
    });
    }
    ngOnChanges() {
         // console.log(this.purcode)
        // console.log(this.flag)
        // console.log(this.authstatus)
        this.PageLoad();
        this.staffpurchaseviewdata(this.purcode);
    
    }
     staffpurchaseviewdata(purinvno){
        this.loaderService.display(true)
        const jsonmaster = {
            cmp_code: this._loginService.getLogin()[0].CMPCODE,
            citycode: this._loginService.getLogin()[0].CITYCODE,
            ENTRYNO: purinvno,
            VGUID:this._loginService.getLogin()[0].GUID,
            STATUS:"SRPI",
            CMPID:this._loginService.getLogin()[0].CMPID
        }
             this._dataService.getData("Accounts/ACC_PURCHASE_VIEW", jsonmaster)
          .subscribe((data: any) => {
      
            this.PUR_CODE=data.Table[0].PUR_CODE
            this.PUR_DATE=data.Table[0].PUR_DATE
            this.REMARKS=data.Table[0].REMARKS
            this.PASSEDBYPERSON=data.Table[0].PASSEDBYPERSON
            this.IsPassed=data.Table[0].PASS
            this.PASSEDAMOUNT=data.Table[0].PASSEDAMOUNT
            this.SUPINVAMT=data.Table[0].SUPINVAMT
            this.VOUCHERNO=data.Table[0].VOUCHERNO
            this.PUR_SUPPLIER=data.Table[0].PUR_SUPPLIER
            this.PUR_SUPPLIERNAME=data.Table[0].PUR_SUPPLIERNAME
            this.datatabl_1=data.Table1
            this.NetAmt=data.Table2[0].NETTOTAL
            this.NetAmount=data.Table2[0].TOTAMOUNT
            this.Netdeduction=data.Table2[0].TOTDEDUCTION

        })
          
           this.loaderService.display(false)
           }

           Editchildrecd(id)
           {
              let filterData = this.datatabl_1.filter((filter) => filter.ID == id)[0];
              this.ID=filterData.ID;
              this.AccountName=filterData.CLIENT + '|' + filterData.ISJOBREPORT;
              this.Amount=filterData.AMOUNT;
              this.Deduction=filterData.DEDUCTION;
              if(filterData.SRPIPASSAMOUNT>0)
              {
                this.actpassedamount=filterData.SRPIPASSAMOUNT;
                 } 
                 else  if(filterData.SRPIPASSAMOUNT==0)
                {
                this.actpassedamount=filterData.AMOUNT;
                }   
              ///this.actpassedamount=filterData.AMOUNT;
              this.Item=filterData.ITEM_DATAVALUE;
              this.JobNo=filterData.JOBNO;
              this.ActNarration=filterData.NARRATION;
              this.txtchild="Update";
              this.ACCBANKDTLSID=filterData.ACC_PURCHASEDTLS_ID;
              this.ISNOTEDITABLE=filterData.IS_NOT_EDIT_ABLE;
              this.ACCTNAME=filterData.ACCOUNT_NAME;
              this.VGUID=this._loginService.getLogin()[0].GUID;
              this.ItemName=filterData.ITEM;
           }
            Addchildrcrd()
            {
                this.loaderService.display(true)
                 const jsonchild= {ID:this.ID,ENTRYNO:this.PUR_CODE,CLIENT:this.AccountName.split("|")[0],
                 JOBNO:this.JobNo,DEDUCTION:this.Deduction,AMOUNT:this.Amount,USERNAME:this._loginService.getLogin()[0].CMP_USERNAME,
                 NARRATION:this.ActNarration,IS_NOT_EDIT_ABLE:this.ISNOTEDITABLE,
                 ITEMCODE:this.Item.split("|")[0],
                 VGUID:this._loginService.getLogin()[0].GUID,
                 ACCOUNT_NAME:this.ACCTNAME,
                 ITEM:this.Item.split("|")[2],
                 ACC_PURCHASEDTLS_ID:this.ACCBANKDTLSID,
                 STATUS:"SRPI",
                 IsJobReport:this.AccountName.split("|")[1],
                 ITEM_DATAVALUE:this.Item,
                 SRPIPASSAMOUNT:this.actpassedamount,
                 ISOLDENTRY:"0",
                 CMPID:this._loginService.getLogin()[0].CMPID
                 }
             
                   this._dataService.Common("Accounts/ACC_PURCHASE_TMP_IU", jsonchild)
                  .subscribe((data: any) => {
        
                      if (data.Table1[0].STATUS.split("#")[0] == "100") {
                             
                             this.datatabl_1=data.Table
                             this.NetAmount=data.Table1[0].TOTAMOUNT;
                             this.Netdeduction=data.Table1[0].TOTDEDUCTION;
                             this.NetAmt=data.Table1[0].NETTOTAL;
                             this.Resetchildrcrd();
                             this.loaderService.display(false);
                           
                       }
                       else{   this._toasterService.toast("warning","warning" ,data.Table1[0].STATUSTEXT);
                                this.loaderService.display(false);
                       }
                    });
          
                    this.loaderService.display(false)
            }  

            Resetchildrcrd(){
                this.ID ="0";
                this.AccountName=undefined;
                this.JobNo="";
                this.Deduction="";
                this.Amount="";
                this.ActNarration="";
                this.Item=undefined;
                this.actpassedamount="";
                this.txtchild="Add";
             
             }


             Add_Main()

             {
             const jsonmaster = {
                CMPID: this._loginService.getLogin()[0].CMPID,
                CMPCODE:this._loginService.getLogin()[0].CMPCODE,
                CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,  
                CITYCODE:this._loginService.getLogin()[0].CITYCODE,
                USERNAME:this._loginService.getLogin()[0].CMP_USERNAME,
                ENTRYNO:this.PUR_CODE,
                ENTRYDT:this.PUR_DATE ,
                STATUS:"SRPI",
                SUP_CODE:this.staff,
                SUP_NAME:"",
                SUP_INVNO:"",
                SUP_INVDT:"",
                SUP_BILLRECEIVEDDT:"",
                SUP_DUEDT:"",
                PASSFLAG:(this.IsPassed==true)?"Y" :"",
                PASSEDBY:(this.PASSEDBY=="")?"0" :this.PASSEDBY,
                PASSEDAMT:(this.PASSEDAMOUNT=="")?"0" :this.PASSEDAMOUNT,
                INVAMT:(this.SUPINVAMT=="")?"0" :this.SUPINVAMT,
                VOUCHERNO:(this.VOUCHERNO=="")?"0" :this.VOUCHERNO,
                MAWBN0:"",
                FREIGHTG100235:"0",
                SURCHARGEG101468:"0",
                AIRFRTCOMMG100153:"0",
                FRTREBATEG100186:"0",
                NARRATION:this.REMARKS,
                ACTUALAMOUNT:this.NetAmt,
                VGUID:this._loginService.getLogin()[0].GUID,
                MAKER_ID:this._loginService.getLogin()[0].CMPID,
                MAKER_IP:this._loginService.getLogin()[0].MAKERIP,
                ACTION:(this.PUR_CODE==' ')?"INSERT" :"UPDATE",
                DOCUMENTG100179:"0",
                FK_SUP_ADDR_ID:"0",
                AMSENSEXP_G102024:"0",
                MISCEXP_G102025:"0"
            }
        let url ="";
        if(this.PUR_CODE==" ")  {   url="Accounts/ACC_PURCHASE_INSERT";  }
        else{  url="Accounts/ACC_PURCHASE_UPDATE";}
        this._dataService.Common(url, jsonmaster)
        .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100#") {        
                //this._toasterService.toast('success', 'success', data.Table[0].STATUSTEXT );
                this.Verify();
                this.loaderService.display(false);
                
            }
            else{
                this._toasterService.toast("success","success" ,data.Table[0].STATUSTEXT  );
                this.Verify();
                this.loaderService.display(false);
            }
        });
        }
      
        Verify()
        {
            const jsonverify= { CMPCODE :this._loginService.getLogin()[0].CMPCODE,
                CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
                CITYCODE:this._loginService.getLogin()[0].CITYCODE,
                STATUS:"SRPI",
                JVREQNO:this.PUR_CODE,
                AUTHORISATIONDT:"",
                CMPID:this._loginService.getLogin()[0].CMPID,
                AUTHORISATIONSTATUS:this.AUTHSTATUS
                }
        this._dataService.getData("Accounts/Acc_CPJVPI_REQUEST_Authorisation_Update", jsonverify)
         .subscribe((data: any) => {
            if(data.Table2[0].STATUS.split("#")[0]  == "100") { 
                this._toasterService.toast('info', 'Complete', data.Table2[0].STATUS.split("#")[1]);
                ///this.OutSRIPNO.emit({ VeriSRPNO: this.PUR_CODE });
                { this.hideModal.emit(this.purcode);
                    this.hideModal.emit(this.authstatus);     }
               
             }  
           
            else if(data.Table2[0].STATUS.split("#")[0]  == "105") { 
                this._toasterService.toast('warning', 'warning', data.Table2[0].STATUS.split("#")[1]);
             }  
             this.loaderService.display(false);
        });   
        }
        
        SaveVerify() 
        { 
        var answer = confirm("Are you sure you want to authorise the Request Staff Purchase no." + this.PUR_CODE + " ?")
        if(answer==false) 
        {
            return false;
        }
        else
        {
            this.Add_Main();
        }
       }

       abortModal() {
           
        this.hideModal.emit(this.authstatlist);
        
    }
    jobprofitreport(jobno) {
        if (jobno == '' || jobno == undefined || jobno.length < 15) {
          alert("Enter 15 digit Job No !")
          return false
        }
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/Account-Job-Profit-Report/' + jobno + '/', "Job Profit Report", toolbar);
       
    
      }
}    
              
    