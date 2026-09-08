import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
///import{DataService} from '../../..authServiceshared/service/dataService';
import{DataService} from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service'; 
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { iif } from 'rxjs';
@Component({
    templateUrl: 'journalvoucher_IU.component.html'
})
export class JournalVoucherComponent implements OnInit {

    Allitemlist:any=[];
    codelistActt :any=[] ;
    VoucherNo: string="";
    VoucherDate;
    Narration: string="";
    AccountName: string;
    AccountNameList:any=[];
    Item: string;
    Type:string;
    ItemList:any=[];
    EntryType:string;
    EntryTypeList:any=[];
    Department:string;
    Departmentlist:any=[];
    DepartmentName:string;
    BillNo: string="";
    JobNo: string="";
    Debit: string="";
    Credit: string="";
    ShortNarration: string="";
    TotalCredit: string="0";
    TotalDebit: string="0";
    text: string="Submit";txtchild : string ="Add";txtadd:string ="Add";
    ID:string="0";
    ENTRYNO:  string=""; 
    CLIENT:string=""; 
    ACCTNAME:string="";
    JV_DTLS_ID:string="0";
    STATUS:string="JV";
    Accountlist:any=[];
    jv_trn:string="";
    ISNOTEDITABLE:string="0";
    ISJVGENERATE:string="0";
    public toggledebit: boolean = false;
    public togglevdate: boolean = false;
    public toggleupdatebtn: boolean = false;
    public toggleupdatechldbtn: boolean = false;
    Header: string="JOURNAL VOUCHER";
public myDatePickerOptions: IMyDpOptions = {
    dateFormat: 'dd/mm/yyyy',
    inline: false,
    height: '16px',
    width: '120px',
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
    private http: HttpClient, 
    private _activatedRoute: ActivatedRoute,
    private _loginService:LoginService,   ) { }
ngOnInit() { 
    this._activatedRoute.params.subscribe(params => {
        this.VoucherNo = params["EntryNo"];                 
        this.STATUS = params["Status"];
        })
        this.VoucherDate = new Date();
        this.VoucherDate =  this._dataService.datechnge(this.VoucherDate)
        
    const jsonparam= {  cmp_code:this._loginService.getLogin()[0].CMPCODE,
        citycode:this._loginService.getLogin()[0].CITYCODE,
        citycode1:this._loginService.getLogin()[0].CITYCODE1,
        PSTATUS:this.STATUS }

    this._dataService.getData("Accounts/ACC_JV_PAGELOAD",jsonparam)
    .subscribe((data: any) => {
        this.AccountNameList=data.Table;
        this.Departmentlist=data.Table1;
        this.Allitemlist=data.Table2;
    });

    const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
    this._dataService.getData("Accounts/ACC_JV_RESET", jsonreset)
     .subscribe((data: any) => {
     });

    if (this.VoucherNo !=' ' && this.STATUS=="JV")
        {
            this.verifyPermission('9','Modify');
            this.Header='JOURNAL VOUCHER - UPDATE ';
            this.editpopulate();
        }
        if (this.VoucherNo !=' ' && this.STATUS=="JVREQ")
        {
            this.verifyPermission('192','Modify');
            this.Header='REQUEST JOURNAL VOUCHER - UPDATE ';
            this.editpopulate();
        }    
        if (this.VoucherNo ==' ' && this.STATUS=="JV" )
        {
            this.verifyPermission('9','Add');
            this.Header= 'JOURNAL VOUCHER  - ADD';
        }
        if (this.VoucherNo ==' ' && this.STATUS=="JVREQ" )
        {
           this.verifyPermission('192','Add');
           this.Header= 'REQUEST JOURNAL VOUCHER  - ADD';
        }      
        if(this.VoucherNo !=' ')   {
        // this.editpopulate()
            this.text='Update';
        }
    }
    verifyPermission(formId, userMode) {
        this.loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {          
               this._loginService.checkVerify(userMode, data);
               this.loaderService.display(false);
                });
             }
    GetActName(Acctcode)  {
         let codeacct
      // this.ACCTNAME=event.target.options[event.target.options.selectedIndex].text;
        this.codelistActt = this.AccountNameList.filter((code: any) => code.ACCTCODENAME === Acctcode);
        this.ACCTNAME=this.codelistActt[0].ACCTNAME;
        codeacct=this.codelistActt[0].ACCTCODENAME;
        this.ItemList = this.Allitemlist.filter((code: any) => code.ACCTCODE === Acctcode.split("|")[0]);
        }
        VoucherDateChanged(ev){
            this.VoucherDate=ev.formatted
          }
    GetDepartmentName(event)  {
          this.DepartmentName=event.target.options[event.target.options.selectedIndex].text///.split("|")[1];
        }
        GetEntryType(entrytypeval)  {
        if(entrytypeval=="AD")    
            {
                this.toggledebit=true;
                this.Debit="";
            } 
            else
            {
                this.toggledebit=false;
                this.Debit="";
            }
        }
        Addchildrcrd()  {
            if(this.AccountName=="" || this.AccountName==undefined)   {
            this._toasterService.toast('warning', 'warning', 'Please select Account  !');
            return false;
            }
            if(this.ItemList.length>1)  {
                if(this.Item=="" || this.Item==undefined)   {
            this._toasterService.toast('warning', 'warning', 'Please select Item  !');
                return false;
            }
            }
            if(this.EntryType=="AO" || this.EntryType=="AB") {
                if(this.BillNo=="")  {
                    this._toasterService.toast('warning', 'warning', 'Please Enter BillNo. !');
                    return false;
                }
                if(this.BillNo.length < 15)   {
                    this._toasterService.toast('warning', 'warning', 'Invalid BillNo - Please Check !');
                    return false;
                }
            }
            if (this.EntryType=="AD")   {
                if(this.JobNo=="")  {      
                    this._toasterService.toast('warning', 'warning', 'Please Enter Job No. !');
                    return false;
                }
            }           
            if(this.JobNo.length > 0 && this.JobNo.length < 15)   {
                    this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
                    return false;
                }
            if(this.JobNo.length > 0 && this.JobNo.length == 15) {
                    if (this.JobNo.substr(0, 2) != this._loginService.getLogin()[0].CMPCODE)   {
                        this._toasterService.toast("warning","warning",'You have entered Job No of different Company !');
                        return false;
                    }
                    // if (this.JobNo.substr(2, 3) != this._loginService.getLogin()[0].CITYCODE1)   {
                    //     this._toasterService.toast("warning","warning",'You have entered Job No of different City !');
                    //     return false;
                    // }
                }
            if(this.JobNo=="" && this.BillNo=="")  {
                    if(this.Department=="" || this.Department==undefined)  {
                        this._toasterService.toast('warning', 'warning', 'Please Select Department !');
                        return false;
                    }
                }
            if((this.Debit=="" || this.Debit=="0") && (this.Credit=="" || this.Credit=="0") )       {
                    this._toasterService.toast('warning', 'warning', 'Both Debit & Credit Amount cannot be Left Blank !');
                    return false;   
                } 
            if(parseFloat(this.Debit) > 0 && parseFloat(this.Credit) > 0)   {
                    this._toasterService.toast('warning', 'warning', 'Either Debit or Credit Amount Should Be Entered !');
                    return false;   
                } 
            if(this.Debit.length> 0 && parseFloat(this.Debit) > 0)     {
                    if(this.Debit.slice(0, 1) == ".")   {
                        this._toasterService.toast('warning', 'warning', 'Debit Amount Entered not Valid !');
                        return false;   
                    } 
            
                    if(parseFloat(this.Debit) < 0)  {
                        this._toasterService.toast('warning', 'warning', 'Debit Amount Entered not Valid !');
                        return false;   
                        } 
            }   
            if(this.Credit.length> 0 && parseFloat(this.Credit) > 0)     {
                    if(this.Credit.slice(0, 1) == ".")    {
                        this._toasterService.toast('warning', 'warning', 'Credit Amount Entered not Valid !');
                        return false;   
                    } 
                    if(parseFloat(this.Credit) < 0)  {
                        this._toasterService.toast('warning', 'warning', 'Credit Amount Entered not Valid !');
                        return false;   
                    } 
                }    
            let clientcodeval=this.AccountName.split("|")[1];
            if(clientcodeval=='Y')   {
                    if(this.JobNo.length==0)  {
                        this._toasterService.toast('warning', 'warning', 'Please Enter JobNo !');
                        return false;   
                    } 
                }    
                if(this.Debit>this.Credit) {
                    this.jv_trn="D" ;
                    this.Credit="";    
                }
                else  {
                        this.jv_trn="C" ;
                        this.Debit="";  
                }
             const jsonchild= {ID:this.ID,ENTRYNO:this.VoucherNo,
             CLIENT:this.AccountName.split("|")[0],
             JOBNO:this.JobNo,BILLNO:this.BillNo,
             JV_TRN:this.jv_trn,DEBIT:this.Debit,CREDIT:this.Credit,
             ENTRYTYPE:(this.EntryType==undefined)?"" :this.EntryType,
             NARRATION:this.ShortNarration,ITEMCODE:(this.Item==undefined)?"" :this.Item.split("|")[0],
             DEPTID:this.Department,VGUID:this._loginService.getLogin()[0].GUID,
             ACCOUNT_NAME:this.ACCTNAME,
             ITEM: (this.Item==undefined || this.Item=="" )?"" :this.Item.split("|")[2],
             DEPARTMENT:(this.DepartmentName==undefined)?"" :this.DepartmentName,
             JV_DTLS_ID:this.JV_DTLS_ID,
             STATUS:this.STATUS,
             ISJOBREPORT:this.AccountName.split("|")[1],
             ITEM_DATAVALUE: (this.Item==undefined)?"" :this.Item,
             ISOLDENTRY:"0"
             }
            this._dataService.Common("Accounts/ACC_JV_TMP_IU", jsonchild)
              .subscribe((data: any) => {    
             if (data.Table1[0].STATUS.split("#")[0] == "100") {
                this.Accountlist=data.Table;
                this.TotalDebit=data.Table1[0].TOTDEBIT;
                this.TotalCredit=data.Table1[0].TOTCREDIT;
                this.Resetchildrcrd();
                this.loaderService.display(false);                       
                }
               else if (data.Table1[0].STATUS.split("#")[0] == "103") {
                this._toasterService.toast("warning","warning" ,data.Table1[0].STATUS.split("#")[1]);
                this.loaderService.display(false);                   
                    }
                else{ 
                     this._toasterService.toast("warning","warning" ,data.Table1[0].STATUSTEXT);
                     this.loaderService.display(false);
                 }
                  });
        }  
        Resetchildrcrd()
        {
            this.ID ="0";
           // this.AccountName=undefined;
            this.JobNo="";
            this.Debit="";
            this.Credit="";
            this.ShortNarration="";
            this.Item=undefined;
          //  this.Department="";
          //  this.EntryType="";
            this.txtchild="Add";
            this.BillNo="";
            this.toggledebit=false;
            this.JV_DTLS_ID="0";
            // this.ItemList=[];
            // this.AccountNameList=[];
         }

         Editchildrecd(id)
         {
            let filterData = this.Accountlist.filter((filter) => filter.ID == id)[0];
            this.ID=filterData.ID;
            this.AccountName=filterData.CLIENT + '|' + filterData.ISJOBREPORT;
            this.GetActName(filterData.CLIENT+ '|' + filterData.ISJOBREPORT);
            this.Item=filterData.ITEM_DATAVALUE;
            this.Debit=filterData.DEBIT;
            this.Credit=filterData.CREDIT;
            this.EntryType=filterData.ENTRYTYPE;
            this.BillNo=filterData.BILLNO;
            this.JobNo=filterData.JOBNO;
            this.ShortNarration=filterData.NARRATION;
            this.txtchild="Update";
            this.JV_DTLS_ID=filterData.JV_dtls_ID;
            this.ACCTNAME=filterData.ACCOUNT_NAME;
            this.DepartmentName=filterData.DEPARTMENT;
            this.Department=filterData.DEPTID;
            this.jv_trn=filterData.JV_TRANS;
            }

         deletechildrecd(id,jvdtlsid){
            if(this.ISNOTEDITABLE=="1") {
                this._toasterService.toast("warning","warning","You cannot delete this reocrd!")
            } 
            else {  
             if(confirm('Are you sure want to delete the record ?'))  { 
                this.loaderService.display(true);      
                const jsondelete = { ID  : id,VGUID :this._loginService.getLogin()[0].GUID,JV_DTLS_ID:jvdtlsid}
                this._dataService.getData("Accounts/ACC_JV_TMP_DEL", jsondelete)
                    .subscribe((data: any) => {
                    if (data.Table1[0].STATUS.split("#")[0] == "100")
                        {
                        this._toasterService.toast('info', 'Complete', data.Table1[0].STATUSTEXT );
                        this.Accountlist=data.Table;
                        this.TotalDebit=data.Table1[0].TOTDEBIT;
                        this.TotalCredit=data.Table1[0].TOTCREDIT;
                        this.loaderService.display(false);
                        }
                        else
                        { 
                        this._toasterService.toast("warning","warning" ,data.Table1[0].STATUSTEXT);
                        this.loaderService.display(false);
                        }
                    });
           
                } 
            else{return false;  this.loaderService.display(false);}
            }
        }
        fnIU_JV(){

            if(this.VoucherDate=="") {
                this._toasterService.toast('warning', 'warning', 'Please Enter Voucher Date !');
                return false;
               }  
           if(parseFloat(this.TotalDebit) != parseFloat(this.TotalCredit) ){
               this._toasterService.toast('warning', 'warning', 'The Debit And Credit Total Not Matching Please Check !');
               return false;
               }  
           if(parseFloat(this.TotalDebit) == 0  || parseFloat(this.TotalCredit) ==0 ) {
              this._toasterService.toast('warning', 'warning', 'The Debit or Credit Total Cannot Be Zero !');
              return false;
               }

             const jsonmaster = {
                   CMPID: this._loginService.getLogin()[0].CMPID,
                   CMPCODE:this._loginService.getLogin()[0].CMPCODE,
                   CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,  
                   CITYCODE:this._loginService.getLogin()[0].CITYCODE,
                   USERNAME:this._loginService.getLogin()[0].CMP_USERNAME,
                   ENTRYNO:this.VoucherNo,
                   ENTRYDT:this.VoucherDate,
                   STATUS:this.STATUS,
                   NARRATION:this.Narration,
                   VGUID:this._loginService.getLogin()[0].GUID,
                   MAKER_ID:this._loginService.getLogin()[0].CMPID,
                   MAKER_IP:this._loginService.getLogin()[0].MAKERIP,
                   ACTION:(this.VoucherNo==" ")?"INSERT" :"UPDATE",
               }
                this._dataService.Common("Accounts/ACC_JV_IU", jsonmaster)
                   .subscribe((data: any) => {
                       if (data.Table1[0].STATUS.split("#")[0] == "100") {
                       this._toasterService.toast('info', 'Complete', data.Table1[0].STATUS.split("#")[1] );
                       this.Print(data.Table1[0].ENTRYNO);
                       this.loaderService.display(false);
                       this.ResetMain();
                     
                       }              
                       else{ 
                           this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
                           this.loaderService.display(false);
                       }
                   });
        }
        //  Add_Main()  {
        //     if(this.ISJVGENERATE=='1') {
        //        alert("You can not Update this JV Request because JV is already Generated for this Request !" );
        //        return false;
        //     }  
        //      if(this.VoucherDate=="") {
        //          this._toasterService.toast('warning', 'warning', 'Please Enter Voucher Date !');
        //          return false;
        //         }  
        //     if(parseFloat(this.TotalDebit) != parseFloat(this.TotalCredit) ){
        //         this._toasterService.toast('warning', 'warning', 'The Debit And Credit Total Not Matching Please Check !');
        //         return false;
        //         }  
        //     if(parseFloat(this.TotalDebit) == 0  || parseFloat(this.TotalCredit) ==0 ) {
        //        this._toasterService.toast('warning', 'warning', 'The Debit or Credit Total Cannot Be Zero !');
        //        return false;
        //         }  
        //       const jsonmaster = {
        //             CMPID: this._loginService.getLogin()[0].CMPID,
        //             CMPCODE:this._loginService.getLogin()[0].CMPCODE,
        //             CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,  
        //             CITYCODE:this._loginService.getLogin()[0].CITYCODE,
        //             USERNAME:this._loginService.getLogin()[0].CMP_USERNAME,
        //             ENTRYNO:this.VoucherNo,
        //             ENTRYDT:this.VoucherDate,
        //             STATUS:this.STATUS,
        //             NARRATION:this.Narration,
        //             VGUID:this._loginService.getLogin()[0].GUID,
        //             MAKER_ID:this._loginService.getLogin()[0].CMPID,
        //             MAKER_IP:this._loginService.getLogin()[0].MAKERIP,
        //             ACTION:(this.VoucherNo==" ")?"INSERT" :"UPDATE",
        //         }
        //          this._dataService.Common("Accounts/ACC_JV_IU", jsonmaster)
        //             .subscribe((data: any) => {
        //                 if (data.Table1[0].STATUS.split("#")[0] == "100") {
        //                 this._toasterService.toast('info', 'Complete', data.Table1[0].STATUS.split("#")[1] );
        //                 this.Print(data.Table1[0].ENTRYNO);
        //                 this.loaderService.display(false);
        //                 this.ResetMain();
                      
        //                 }              
        //                 else{ 
        //                     this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
        //                     this.loaderService.display(false);
        //                 }
        //             });
        //    }
        Add_Main()  {
            if(this.STATUS=='JV'){ //JVREQ
                //cal JV IU
                this.fnIU_JV()
                return false;
            }else{
                if(this.ISJVGENERATE=='1') {
                    alert("You can not Update this JV Request because JV is already Generated for this Request !" );
                    return false;
                 }else{
                    //cal JV IU
                    this.fnIU_JV();
                    return false;
                 } 
            }
            
             
           }
        Print(jvno){ 
            let theTop = (screen.height / 2) - (483 / 2);
            let theLeft = (screen.width / 2) - (780 / 2);
            let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
            window.open('./#/popup/Account-JV-Print/' +  jvno + '/' +  this.STATUS  + '/', "Journal Voucher Print", toolbar);
        }
        ResetMain()   {
            this.Resetchildrcrd();
            this.VoucherNo =" ";
            this.VoucherDate ='';
            this.TotalCredit ='';
            this.TotalDebit ='';
            this.text="Submit";
            this.Accountlist="";
            this.Narration='';
            if(this.STATUS=="JVREQ")
            {
            this._router.navigate(["/accounts/Voucher/JV/Add/JVREQ/ "]);
            }
            else
            {
                this._router.navigate(["/accounts/Voucher/JV/Add/JV/ "]);
                }
        }
        editpopulate() {
            const jsonview = { EntryNo  : this.VoucherNo,
                CMPCODE:this._loginService.getLogin()[0].CMPCODE,
                CITYCODE:this._loginService.getLogin()[0].CITYCODE,
                VGUID:this._loginService.getLogin()[0].GUID,
                STATUS:this.STATUS
            }
            this._dataService.getData("Accounts/ACC_JV_View", jsonview)
            .subscribe((data: any) => {
                // if (data.Table[0].STATUS == "100") {
            
                    this.VoucherNo  = data.Table[0].JVCODE    ;
                    this.VoucherDate=(data.Table[0].JV_DATE != "") ? (data.Table[0].JV_DATE) : "";
                    this.Narration=data.Table[0].NARRATION;
                    this.ISJVGENERATE=data.Table[0].ISJVGENERATE;
                    this.Accountlist=data.Table1;
                    this.TotalCredit=data.Table2[0].TOTCREDIT;
                    this.TotalDebit=data.Table2[0].TOTDEBIT;
                if(this.STATUS=="JV" ) {
                    if(this.ISJVGENERATE=="1")  {
                        this.togglevdate=true;
                     } 
                    else  {  this.togglevdate=false;  } 

                }  
                if( this.STATUS=="JVREQ")
                {
                    if(this.ISJVGENERATE=='1') {
                    this._toasterService.toast("warning","warning" ,"You can not Update this JV Request because JV is already Generated for this Request !" );
                    //this.toggleupdatebtn=true;
                    this.toggleupdatechldbtn=true;
                    this.togglevdate=true
                    this.loaderService.display(false);
                      } 
                } 
                    this.loaderService.display(false);                 
            })      
        }  
        Reset()
        {
            if(confirm('Are you sure you want to reset all data?'))     {
                this.Resetchildrcrd();
                this.VoucherNo = " ";
                //this.VoucherDate ='';
                this.Narration ='';
                this.TotalCredit ='';
                this.TotalDebit ='';
                this.text="Submit";
                this.Accountlist=[];
                this.EntryType=''
                this.AccountName=undefined;
                this.Department='';
                 const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
                 this._dataService.getData("Accounts/ACC_JV_RESET", jsonreset)
                .subscribe((data: any) => {
                   this._toasterService.toast('info', 'success', "Clear all data");
                    this.loaderService.display(false);
                    if(this.STATUS=="JVREQ")
                    {
                    this._router.navigate(["/accounts/Voucher/JV/Add/JVREQ/ "]);
                    }
                    else
                    {
                        this._router.navigate(["/accounts/Voucher/JV/Add/JV/ "]);
                        }
                });
        
            }  
            else   {  
                this.loaderService.display(false);
                return false;
               
            }
            
    }

        ValidateJobNo(jbno) {
        if (this.EntryType=="JB" && this.JobNo.length > 0 )  {   
              if(this.JobNo.length > 0 && this.JobNo.length < 15)  {
                    this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
                    return false;
                }
              if(this.JobNo.length > 0 && this.JobNo.length == 15)  {
                    if (this.JobNo.substr(0, 2) != this._loginService.getLogin()[0].CMPCODE) {
                        this._toasterService.toast("warning","warning",'You have entered Job No of different Company !');
                        return false;
                    }
                    if (this.JobNo.substr(2, 3) != this._loginService.getLogin()[0].CITYCODE1) {
                        this._toasterService.toast("warning","warning",'You have entered Job No of different City !');
                        return false;
                    }
                }
                const jsonvalidate = { JVJOBNO :jbno,JVACCOUNT:this.AccountName.split("|")[0]}
                this._dataService.getData("Accounts/ACC_JV_JOBNO_VALIDATE", jsonvalidate)
                .subscribe((data: any) => {
                if(data.Table[0].STATUS.split("#")[0] == "100") { 
                    }
                    else   if(data.Table[0].STATUS.split("#")[0] == "103") {
                if(confirm(data.Table[0].STATUSTEXT + 'Are you sure you want to add this JOBNO ?'))      {
                            return true; 
                        }   
                        else {
                            this.JobNo="";
                            return false;
                        }   
                    }
                    this.loaderService.display(false);
                });
            }
             else  { return false;  }
            }
            TextareaValueChange(ev) {
                this.Narration = ev.target.value;
        } 
            }