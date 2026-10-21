import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import{DataService} from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Configuration } from '../../../app.constants';

@Component({
    templateUrl: 'staffpurchase_IU.component.html',
    styleUrls: ['../../purchase/purchase-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StaffPurchaseComponent implements OnInit {
    Allitemlist:any=[];
    Stafflist:any=[];
    codelistActt :any=[] ;
    PassedBylist:any=[];
    staff: string;
    passedby: string="";
    IsPassed: boolean = false;
    PurchaseNo: string="";
    PurchaseDate;
    Narration: string="";
    PassedAmount: string="";
    InvoiceAmount: string="";
    VoucherNo: string="";
    AccountName: string;
    AccountNameList:any=[];
    Item: string;
    ItemList:any=[];
    Amount: string="";
    Deduction: string="";
    JobNo: string="";
    actpassedamount: string="";
    ActNarration: string="";
    NetAmount: string="0";
    Netdeduction: string="0";
    text: string="Submit";txtchild : string ="Add";txtadd:string ="Add";
    ID:string="0";
    ENTRYNO:  string="";
    CLIENT:string="";
    ISNOTEDITABLE:string="0";
    ACCTNAME:string="";
    ACCBANKDTLSID:string="0";
    STATUS:string="SRPI";
    Accountlist:any=[];
    NetAmt:string="0";
    PurchaseDone :  string="";
    // V4 locks the purchase date and staff once a request is saved, and the passing details once passed
    IsEdit: boolean = false;
    PassLocked: boolean = false;
    public togglevno: boolean = true;
    public togglepassedby: boolean = true;
    public togglepamount: boolean = true;
    public toggleinvamount: boolean = true;
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
        private _loginService:LoginService,
        private _configuration: Configuration ) { }
    ngOnInit() {
        this.loaderService.display(true);
        this._activatedRoute.params.subscribe(params => {
            this.PurchaseNo = params["EntryNo"];

        })
        this.IsEdit = (this.PurchaseNo || '').trim() != '';
        this.PurchaseDate = new Date();
        this.PurchaseDate =  this._dataService.datechnge(this.PurchaseDate)
        if(this.IsEdit) { this.verifyPermission('412','Modify')}
        else { this.verifyPermission('412','Add')}

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
        // the temp detail table must be cleared before VIEW refills it, otherwise the reset can wipe the loaded lines
        const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
        this._dataService.getData("Accounts/ACC_PURCHASE_RESET", jsonreset)
        .subscribe((data: any) => {
            if(this.IsEdit)
            {
                this.editpopulate()
                this.text='Update';
            }
            else { this.loaderService.display(false); }
            }, () => { this.loaderService.display(false); });
    }
    verifyPermission(formId, userMode) {

        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
               this._loginService.checkVerify(userMode, data);
            });
    }
    PurchaseDateChanged(ev) {
        this.PurchaseDate = ev.formatted;
    }
    // V4 keeps the requester's pass amount disabled: 0 on a new line, the line amount when a line is re-saved
    get passAmtPreview(): string {
        return (this.ID != "0") ? (this.Amount || "0") : "0";
    }
    Addchildrcrd()
    {
        if(this.AccountName=="" || this.AccountName==undefined){
            this._toasterService.toast('warning', 'warning', 'Please select Account  !');
            return false;
         }
        if (this.staff && this.AccountName.split("|")[0] == this.staff) {
            this._toasterService.toast('warning', 'warning', 'Staff and Account Name should be different !');
            return false;
        }
        if (this.ItemList.length > 0) {
            if(this.Item=="" || this.Item==undefined){
                this._toasterService.toast('warning', 'warning', 'Please select Item  !');
                return false;
             }
        }

        let amount = parseFloat(String(this.Amount));
        let deduction = parseFloat(String(this.Deduction));
        if (isNaN(amount)) { amount = 0 }
        if (isNaN(deduction)) { deduction = 0 }
        if (amount < 0) {
            this._toasterService.toast("warning","warning",'Invalid Amount - Please Check');
            return false;
        }
        if (deduction < 0) {
            this._toasterService.toast("warning","warning",'Invalid Deduction - Please Check');
            return false;
        }
        if (amount > 0 && deduction > 0) {
            this._toasterService.toast("warning","warning",'Invalid Amount/Deduction - Please Check');
            return false;
        }
        if (amount == 0 && deduction == 0) {
            this._toasterService.toast("warning","warning",'Please enter Amount or Deduction !');
            return false;
        }
        amount = Math.round(amount * 100) / 100;
        deduction = Math.round(deduction * 100) / 100;

        // job no is mandatory only for accounts flagged for the job report, as in V4
        const jobno = String(this.JobNo || '').trim();
        if (this.AccountName.split("|")[1] == 'Y' && jobno.length == 0) {
            this._toasterService.toast('warning', 'warning', 'Please enter the Job No. !');
            return false;
        }
        if (jobno.length > 0 && jobno.length != 15) {
            this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
            return false;
        }
        if (jobno.length > 0 && jobno.substr(0, 2) != this._loginService.getLogin()[0].CMPCODE) {
            this._toasterService.toast("warning","warning",'Entered Job No. is different company !');
            return false;
        }

        let ITEMCODEvl; let ITEMvl; let ITEMDT
        ITEMCODEvl= (this.Item == null)? "" : this.Item.split("|")[0];
        ITEMvl= (this.Item == null)? "" : this.Item.split("|")[2];
        ITEMDT =(this.Item == null)? "" : this.Item;

        this.loaderService.display(true);
         const jsonchild= {ID:this.ID,ENTRYNO:(this.PurchaseNo || '').trim(),CLIENT:this.AccountName.split("|")[0],
         JOBNO:jobno,DEDUCTION:String(deduction),AMOUNT:String(amount),USERNAME:this._loginService.getLogin()[0].CMP_USERNAME,
         NARRATION:this.ActNarration,IS_NOT_EDIT_ABLE:this.ISNOTEDITABLE,
         ITEMCODE:ITEMCODEvl,//this.Item.split("|")[0],
         VGUID:this._loginService.getLogin()[0].GUID,
         ACCOUNT_NAME:this.ACCTNAME,
         ITEM:ITEMvl,//this.Item.split("|")[2],
         ACC_PURCHASEDTLS_ID:this.ACCBANKDTLSID,
         STATUS:this.STATUS,
         IsJobReport:this.AccountName.split("|")[1],
         ITEM_DATAVALUE:ITEMDT,//this.Item,
         SRPIPASSAMOUNT:(this.ID != "0") ? String(amount) : "0",
         ISOLDENTRY:"0",
         cmpid:this._loginService.getLogin()[0].CMPID
         }
         this._dataService.Common("Accounts/ACC_PURCHASE_TMP_IU", jsonchild)
          .subscribe((data: any) => {
            if(data.Table.length >0){
              if (data.Table[0].STATUS == "100") {
                    this.Accountlist=data.Table;
                    this.NetAmount=data.Table1[0].TOTAMOUNT;
                    this.Netdeduction=data.Table1[0].TOTDEDUCTION;
                    this.NetAmt=data.Table1[0].NETTOTAL;
                    this.Resetchildrcrd();
                    this.loaderService.display(false);
                }
                else if (data.Table[0].STATUS == "103") {
                    this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
                    this.Accountlist = data.Table;
                    this.NetAmount = data.Table1[0].TOTAMOUNT;
                    this.Netdeduction = data.Table1[0].TOTDEDUCTION;
                    this.NetAmt = data.Table1[0].NETTOTAL;
                    this.Resetchildrcrd();
                    this.loaderService.display(false);
                  }
                  else {
                    this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT)
                    this.loaderService.display(false);
                  }
                }
                else if (data.Table.length==0){
                    this._toasterService.toast("warning", "warning", data.Table1[0].STATUS.split("#")[1]);
                    this.loaderService.display(false);
                  }
            });
    }

    Resetchildrcrd(){
        this.ID ="0";
        //this.AccountName=undefined;
        //this.JobNo="";
        this.Deduction="";
        this.Amount="";
        this.ActNarration="";
       // this.Item=undefined;
        this.actpassedamount="";
        this.txtchild="Add";
        this.ACCBANKDTLSID="0";
        this.ISNOTEDITABLE="0";
        // this.ItemList=[];
        // this.AccountNameList=[];
     }

     Editchildrecd(id)
     {
        let filterData = this.Accountlist.filter((filter) => filter.ID == id)[0];
        if (String(filterData.IS_NOT_EDIT_ABLE) == "1") {
            this._toasterService.toast("warning","warning","You cannot Edit this record!");
            return false;
        }
        this.ID=filterData.ID;
        this.AccountName=filterData.CLIENT + '|' + filterData.ISJOBREPORT;
        this.ItemList = this.Allitemlist.filter((code: any) => code.ACCTCODE === filterData.CLIENT);
       // this.Item=filterData.ITEM_DATAVALUE
       this.Item = (filterData.ITEM_DATAVALUE== "") ?null:filterData.ITEM_DATAVALUE;
        this.Amount=filterData.AMOUNT;
        this.Deduction=filterData.DEDUCTION;
        this.actpassedamount=filterData.SRPIPASSAMOUNT;
        this.JobNo=filterData.JOBNO;
        this.ActNarration=filterData.NARRATION;
        this.txtchild="Update";
        this.ACCBANKDTLSID=filterData.ACC_PURCHASEDTLS_ID;
        this.ISNOTEDITABLE=filterData.IS_NOT_EDIT_ABLE;
        this.ACCTNAME=filterData.ACCOUNT_NAME
     }

     deletechildrecd(id,pdtlsid,noteditable){

        if(String(noteditable)=="1")
        {
            this._toasterService.toast("warning","warning","You cannot delete this reocrd!")
        }
        else
        {
        if(confirm('Are you sure want to delete the record ?'))
        {   this.loaderService.display(true);
       const jsondelete = { ID  : id,VGUID :this._loginService.getLogin()[0].GUID,ACC_PURCHASEDTLS_ID:pdtlsid}
       this._dataService.getData("Accounts/ACC_PURCHASE_TMP_DEL", jsondelete)
        .subscribe((data: any) => {
            if(data.Table.length > 0){
                if (data.Table[0].STATUS == "100") {
                    this._toasterService.toast('success', 'success', data.Table[0].STATUSTEXT );
                    this.Accountlist=data.Table;
                    if (data.Table1 && data.Table1[0]) {
                        this.NetAmount=data.Table1[0].TOTAMOUNT;
                        this.Netdeduction=data.Table1[0].TOTDEDUCTION;
                        this.NetAmt=data.Table1[0].NETTOTAL;
                    }
                    this.loaderService.display(false);
                }
                 else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT);
                 this.loaderService.display(false);
                      }
                     }
                     else if (data.Table.length==0){
                       this.Accountlist = data.Table;
                       this.NetAmount=data.Table1[0].TOTAMOUNT;
                       this.Netdeduction=data.Table1[0].TOTDEDUCTION;
                       this.NetAmt=data.Table1[0].NETTOTAL;
                       this._toasterService.toast("success", "success", data.Table1[0].STATUS.split("#")[1]);
                       this.loaderService.display(false);
                     }
        });

    }
       else{return false;}
    }
        }


    Add_Main()
    {
        if (this.PurchaseDone == '1') {
            this._toasterService.toast('warning', 'warning', 'You can not Update this Staff Purchase Request because Purchase is already Generated for this Staff Purchase Request !');
            return false;
           }
        if(this.PurchaseDate=="" || this.PurchaseDate==undefined){
            this._toasterService.toast('warning', 'warning', 'Please Enter Purchase Date !');
            return false;
            }
        if(this.staff=="" || this.staff==undefined){
            this._toasterService.toast('warning', 'warning', 'Please select Staff !');
            return false;
            }
        if(this.IsPassed==true)   {
            if(this.passedby=="" || this.passedby==undefined)  {
            this._toasterService.toast('warning', 'warning', 'Please select Passed by !');
            return false;
             }

            if(this.PassedAmount=="" || this.PassedAmount=="0")    {
            this._toasterService.toast('warning', 'warning', 'Passed Amount cannot be blank  !');
            return false;
             }
            if(this.InvoiceAmount=="" || this.InvoiceAmount=="0")    {
            this._toasterService.toast('warning', 'warning', 'Invoice Amount cannot be blank  !');
            return false;
             }
            if (parseFloat(this.PassedAmount) > parseFloat(this.InvoiceAmount)) {
            this._toasterService.toast('warning', 'warning', 'Passed Amount cannot Greater Than Invoice Amount  !');
            return false;
            }
            // V4 checks the voucher no when it is typed; already-passed (locked) requests are re-saved as loaded
            if (!this.PassLocked && (this.VoucherNo || '') != '' && String(this.VoucherNo).length != 15) {
            this._toasterService.toast('warning', 'warning', 'Invalid Voucher No. - Please Check !');
            return false;
            }
        }
        if(this.Accountlist.length==0)  {
        this._toasterService.toast('warning', 'warning', 'Please enter the details Data !');
        return false;
        }
        if ((parseFloat(this.NetAmount) + parseFloat(this.Netdeduction)) < 0.01) {
            this._toasterService.toast('warning', 'warning', 'Sum of Total Amount and Deduction cannot be Less Than 0.01');
            return false;
        }

        this.loaderService.display(true);
        const jsonmaster = {
                CMPID: this._loginService.getLogin()[0].CMPID,
                CMPCODE:this._loginService.getLogin()[0].CMPCODE,
                CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
                CITYCODE:this._loginService.getLogin()[0].CITYCODE,
                USERNAME:this._loginService.getLogin()[0].CMP_USERNAME,
                ENTRYNO:(this.PurchaseNo || '').trim(),
                ENTRYDT:this.PurchaseDate,
                STATUS:this.STATUS,
                SUP_CODE:this.staff,
                SUP_NAME:"",
                SUP_INVNO:"",
                SUP_INVDT:"",
                SUP_BILLRECEIVEDDT:"",
                SUP_DUEDT:"",
                PASSFLAG:(this.IsPassed==true)?"Y" :"",
                PASSEDBY:(this.IsPassed==true && this.passedby)? String(this.passedby) :"",
                PASSEDAMT:(this.IsPassed==true && this.PassedAmount)? String(this.PassedAmount) :"0",
                INVAMT:(this.IsPassed==true && this.InvoiceAmount)? String(this.InvoiceAmount) :"0",
                VOUCHERNO:(this.IsPassed==true && this.VoucherNo)? String(this.VoucherNo) :"",
                MAWBN0:"",
                FREIGHTG100235:"0",
                SURCHARGEG101468:"0",
                AIRFRTCOMMG100153:"0",
                FRTREBATEG100186:"0",
                NARRATION:this.Narration || "",
                ACTUALAMOUNT:this.NetAmt,
                VGUID:this._loginService.getLogin()[0].GUID,
                MAKER_ID:this._loginService.getLogin()[0].CMPID,
                MAKER_IP:this._loginService.getLogin()[0].MAKERIP,
                ACTION:(this.IsEdit)?"UPDATE" :"INSERT",
                DOCUMENTG100179:"0",
                FK_SUP_ADDR_ID:"0",
                AMSENSEXP_G102024:"0",
                MISCEXP_G102025:"0"
            }
        // V4 (BLL ACC_PURCHASE_IU): blank entry no -> INSERT proc, otherwise UPDATE proc
        let url = (this.IsEdit) ? "Accounts/ACC_PURCHASE_UPDATE" : "Accounts/ACC_PURCHASE_INSERT";
        this._dataService.Common(url, jsonmaster)
        .subscribe((data: any) => {
            const res = this.saveResult(data);
            this.loaderService.display(false);
            if (res.ok) {
                this._toasterService.toast('success', 'success', res.msg );
                if (res.entryno) { this.Print(res.entryno); }
                this.ResetMain();
            }
            else{
                this._toasterService.toast("warning","warning" ,res.msg);
            }
        });
        }

        // the purchase save procs report success either as Table[0].STATUS='100' or Table1[0].STATUS='100#message'
        saveResult(data: any): { ok: boolean, msg: string, entryno: string } {
            const rows = [data && data.Table && data.Table[0], data && data.Table1 && data.Table1[0]].filter(r => r && r.STATUS != undefined);
            for (const r of rows) {
                const parts = String(r.STATUS).split("#");
                if (parts[0] == "100") {
                    const withNo = rows.filter(x => x.ENTRYNO)[0];
                    return { ok: true, msg: r.STATUSTEXT || parts[1] || 'Saved Successfully', entryno: withNo ? withNo.ENTRYNO : '' };
                }
            }
            const first = rows[0];
            return { ok: false, msg: first ? (first.STATUSTEXT || String(first.STATUS).split("#")[1] || 'Error! Please contact System Administrator.') : 'Error! Please contact System Administrator.', entryno: '' };
        }

        Print(no) {
            let theTop = (screen.height / 2) - (483 / 2);
            let theLeft = (screen.width / 2) - (780 / 2);
            let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
            window.open('./#/popup/Account-Purchase-print/' + no + '/' + 'SRPI' + '/', "Staff Purchase Print", toolbar);
        }

        GetActName(Acctcode)
        {
            this.ItemList=[];
            this.Item=undefined;
            if (!Acctcode) { return; }
            let codeacct
          // this.ACCTNAME=event.target.options[event.target.options.selectedIndex].text;
          this.codelistActt = this.AccountNameList.filter((code: any) => code.ACCTCODENAME === Acctcode);
             this.ACCTNAME=this.codelistActt[0].ACCTNAME;
            codeacct=this.codelistActt[0].ACCTCODENAME;
            this.ItemList = this.Allitemlist.filter((code: any) => code.ACCTCODE === Acctcode.split("|")[0]);

        }
    changeEvent (event)
    {
        if(event.target.checked) {
            this.togglevno = false;
            this.VoucherNo="";
            this.togglepassedby= false;
            this.passedby="";
            this.togglepamount = false;
            this.PassedAmount="";
            this.toggleinvamount = false;
            this.InvoiceAmount="";
        }
        else  {
            this.togglevno = true;
            this.togglepassedby= true;
            this.togglepamount = true;
            this.toggleinvamount = true;
            this.VoucherNo="";
            this.passedby="";
            this.PassedAmount="";
            this.InvoiceAmount="";
        }
    }

    editpopulate() {
    const jsonview = {
        cmp_code:this._loginService.getLogin()[0].CMPCODE,
        citycode:this._loginService.getLogin()[0].CITYCODE,
        EntryNo  : this.PurchaseNo.trim(),
        VGUID:this._loginService.getLogin()[0].GUID,
        STATUS:this.STATUS,
        CMPID:this._loginService.getLogin()[0].CMPID,
        }
    this._dataService.getData("Accounts/ACC_PURCHASE_VIEW", jsonview)
        .subscribe((data: any) => {
            if (!data.Table || data.Table.length == 0) {
                this._toasterService.toast('warning', 'warning', 'No records Found');
                this.loaderService.display(false);
                return;
            }
            this.PurchaseNo  = data.Table[0].PUR_CODE    ;
            this.PurchaseDate=(data.Table[0].PUR_DATE != "") ? (data.Table[0].PUR_DATE) : "";
            this.staff= data.Table[0].PUR_SUPPLIER;
            this.Narration=data.Table[0].REMARKS;
            this.passedby=data.Table[0].PASSEDBY;
            this.VoucherNo=data.Table[0].VOUCHERNO;
            this.PassedAmount=data.Table[0].PASSEDAMOUNT;
            this.InvoiceAmount=data.Table[0].SUPINVAMT;
            this.IsPassed =(data.Table[0].PASS=='Y')?true:false;
            this.PassLocked = this.IsPassed;
            this.Accountlist=data.Table1;
            this.NetAmount=data.Table2[0].TOTAMOUNT;
            this.Netdeduction=data.Table2[0].TOTDEDUCTION;
            this.NetAmt=data.Table2[0].NETTOTAL;
            this.PurchaseDone=String(data.Table[0].ISPURGENERATE);
            this.loaderService.display(false);
            if (this.PurchaseDone == '1') {
                this._toasterService.toast('warning', 'warning','You can not Update this Staff Purchase Request because Purchase is already Generated for this Staff Purchase Request !');
            }
        })
    }

    ResetMain()
    {
        this.Resetchildrcrd();
        this.PurchaseNo ='';
        this.PurchaseDate = this._dataService.datechnge(new Date());
        this.passedby ='';
        this.PassedAmount  ='';
        this.togglepamount=true;
        this.togglepassedby=true;
        this.InvoiceAmount  ='';
        this.toggleinvamount=true;
        this.staff=undefined;
        this.VoucherNo ='';
        this.togglevno=true;
        this.IsPassed=false;
        this.PassLocked=false;
        this.IsEdit=false;
        this.PurchaseDone='';
        this.Narration ='';
        this.NetAmount ='0';
        this.Netdeduction ='0';
        this.NetAmt  ='0';
        this.text="Submit";
        this.Accountlist=[];
        this.AccountName=undefined;
        this.Item=undefined;
        this.ItemList=[];
        this.JobNo="";
        const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
        this._dataService.getData("Accounts/ACC_PURCHASE_RESET", jsonreset).subscribe(() => {});
        this._router.navigate(['/accounts/Request/staff/StaffPurchaseReq/ ']);

    }
    Reset()
    {
        this.Resetchildrcrd();
        this.PurchaseNo ='';
        this.PurchaseDate = this._dataService.datechnge(new Date());
        this.passedby ='';
        this.PassedAmount  ='';
        this.InvoiceAmount  ='';
        this.staff=undefined;
        this.VoucherNo ='';
        this.IsPassed=false;
        this.PassLocked=false;
        this.IsEdit=false;
        this.PurchaseDone='';
        this.togglevno=true;
        this.togglepassedby=true;
        this.togglepamount=true;
        this.toggleinvamount=true;
        this.Narration ='';
        this.NetAmount ='0';
        this.Netdeduction ='0';
        this.NetAmt  ='0';
        this.text="Submit";
        this.Accountlist=[];
        const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
        this._dataService.getData("Accounts/ACC_PURCHASE_RESET", jsonreset)
         .subscribe((data: any) => {
            if(data.Table1 && data.Table1[0] && data.Table1[0].STATUS == "100") {
                this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT );
             }
            this.loaderService.display(false);
        });
        this._router.navigate(['/accounts/Request/staff/StaffPurchaseReq/ ']);
    }

}
