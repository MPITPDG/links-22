import { Component, OnInit } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { ToastCommonService } from '../../../shared/service/toastService';
import { FilterPipe } from 'ngx-filter-pipe';
import { LoaderService } from '../../../shared/service/loader.service';

@Component({
    selector: 'app-credit-note',
    templateUrl: './credit-note.component.html',
    styles: [`
a:hover,a:focus{
    text-decoration: none;
    outline: none;
}
.tab .nav-tabs {
    border-bottom:0 none;
}
.tab .nav-tabs li{
    margin-right: 10px;
}
.tab .nav-tabs li a{
    position: relative;
    padding: 4px;
    color: #fff;
    font-size: 11px;
    z-index: 1;
    font-family:verdana;
    font-weight:bold
}
.tab .nav-tabs li a:hover{
    background:transparent;
    border:1px solid transparent;
    color: #444;
}
 .tab .nav-tabs li a:before{
    content: "";
    width:100%;
    height:100%;
    position:absolute;
    bottom: 5px;
    left:-1px;
    font-size:11px;

    background-color: #379b50;
    border: 1px solid #d3d3d3;
    border-bottom: 0px none;
    border-radius: 10px 10px 0 0;
    transform-origin: left center 0;
    transform: perspective(3px) rotateX(5deg);
    z-index:-1;
}
.tab .nav-tabs li a.active:before{
    background: #fff;
}
.tab .nav-tabs li a.active,
.tab .nav-tabs li a.active:focus,
.tab .nav-tabs li a.active:hover{
    border:1px solid transparent;
    background:transparent;
    color: #212529;
    z-index: 2;
}
#autoresizing {
    display: block;
    overflow: hidden;
    resize: none;
}
`],
})
export class CreditNoteComponent implements OnInit {
    Header: string = "Credit Note ";
    TotalAmount = 0;
    checkno
    table4_billtype: []; table5_mode: []; table1_billaddress; table6_pkgs: []; table7_pieces: []; table8_charge: [];
    table9_account: []; table3_curreny: []; table_client: []; table2_document: []; updated_billaddress; table13_currencytype: []

    billtype: string = ""; billaddress: string; pkgs: string = ""; pieces: string = ""; currency: string = ""; service_tax: string = ""
    client: string; document: string; rupeestext: string = ""; Adv_rec: string = ""; volume: string = ""; weight: string = ""; client_ref: string = "";
    carrier: string = ""; goods: string = ""; master: string = ""; masterdate; currencyname: string = ""
    narration: string = ""; no_pkgs: string = ""; no_pieces: string = ""; crt_currate: string = ""; crt_currate1: string = "1"

    crt_id: string = "0"; crt_no: string = "0"; queryParamsUserId: string = ""; Mainaddtext = "Submit"; crtdate;

    pk_jobid: string = "0"; pk_job_detail_id: string = "0"; packages: string = ""; propweight: string = "";
    invdate: string = ""; mode: string = ""; jobno: string = ""; selected_data; jobdatalist: any = [];

    pk_chrgeid: string = "0"; pk_charge_detail_id = "0"; chargetext = "Add"; tax: string = ""; chargetable: any = [];
    charge: string; account: string; desc: string = ""; desc1: string = ""; desc2: string = ""
    qty: any = ""; rateperqty: any = ""; excrate: any = "1.00"; currencytype: string = "";
    pk_Despid: string = "0"; pk_Desp_detail_id: string = "0"; despatchtext = "Add"; despach_invoiceno: string = ""; despach_amount;
    pk_inv_Despdetailid: string = "0"; despach_table: any = []
    fromright_dt: any=null;
    public Checked: boolean = false; public show_pkg_piece: boolean = false; public jobno_disable: boolean = false
    public modecondition: boolean = false; public addjob: boolean = true; public jobupdate: boolean = false
    INV_Amt_INR ;  taxamount_G_Inr ;disableaccount: boolean = false;invtotamt;adjustedamt;Curamount;Totalinvamt=0;editdespach_amount;
    public disableexrate:boolean=true;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService, private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _loaderService: LoaderService, private filterPipe: FilterPipe
    ) { }
    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '20px',
        width: '180px',
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
    public myDatePickerOptionsInv: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '20px',
        width: '180px',
        componentDisabled: false,
        selectionTxtFontSize: '12px',
        editableDateField: false,
        sunHighlight: true,
        satHighlight: true,
        firstDayOfWeek: 'su',
        openSelectorTopOfInput: false,
        openSelectorOnInputClick: true,
        selectorHeight: '180px',
        selectorWidth: '200px' ,
        disableUntil: {year: 0, month: 0, day: 0},
        disableSince: {year: 0, month: 0, day: 0}
    };
    ngOnInit() {
        this._loaderService.display(true)
        this.crtdate = new Date();
        this.crtdate =  this._dataService.datechnge(this.crtdate)

        this._activatedRoute.params.subscribe(params => {
            this.queryParamsUserId = params["crtno"];
            this.crt_no = (this.queryParamsUserId == " " ? "0" : this.queryParamsUserId);
        })
        if (this.queryParamsUserId != ' ') {
            this.verifyPermission('424','Modify')
        }else{
            this.verifyPermission('424','Add')
        }

        const jsoncmp = {
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
            CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
            cmpid: this._loginService.getLogin()[0].CMPID,
            INVNO: "",
            type: "CN"
        }
        this._dataService.getData("Accounts/ACC_INVOICE_PAGE_LOAD", jsoncmp)
            .subscribe((data: any) => {
             //   console.log(data)
                this.table_client = data.Table
                this.table1_billaddress = data.Table1
                this.table2_document = data.Table2
                this.table3_curreny = data.Table3
                this.table4_billtype = data.Table4
                this.table5_mode = data.Table5
                this.table6_pkgs = data.Table6
                this.table7_pieces = data.Table7
                this.table8_charge = data.Table8
                this.table9_account = data.Table9
                this.table13_currencytype = data.Table13
                this.currencytype = "CR115"
                if (this.queryParamsUserId != ' ') {
                    this.MainCreditEdit_populate()
                    this.Mainaddtext = "Update"
                }
                this._loaderService.display(false)

            })
    }
    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                if (this._loginService.getLogin()[0].ROLETYPE!='SA'){
              this.fromright_dt= data.Table[0].rightsfrmdt;
               this.onDisableRange();
                }
               this._loginService.checkVerify(userMode, data);
               this._loaderService.display(false);

            });
    }
    onDisableRange() {
        var date = new Date(this.fromright_dt);
        var newdate = new Date(date);
        let bdate = new Date();
        bdate=newdate
        let copy = this.getCopyOfOptions();
        bdate.setDate(bdate.getDate());
        copy.disableUntil={year: bdate.getFullYear(), month: bdate.getMonth() + 1, day: bdate.getDate()} ;
        this.myDatePickerOptionsInv = copy;

        let d = new Date();
        d.setDate(d.getDate() + 1);
        let copy1 = this.getCopyOfOptions();
        copy1.disableSince = {year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate()};
        this.myDatePickerOptionsInv = copy1;
    }
    getCopyOfOptions(): IMyDpOptions {
        return JSON.parse(JSON.stringify(this.myDatePickerOptionsInv));
    }
    CreditnoteDateChanged(ev){
        this.crtdate=ev.formatted
    }
     getexchangerate(ev)
    {
          if(ev=="CR115"){
            this.disableexrate=true;
              this.excrate="1.00"

          }
          else
          {
            this.disableexrate=false;
              this.excrate=""

          }
          if(this.currency.split("|")[0]==this.currencytype){
             this.excrate=this.crt_currate
             this.disableexrate=true;
          }
    }
    populatejob() {
        if (this.jobdatalist.length > "0") {
            let data2: any = []
            data2 = this.jobdatalist.filter((code: any) => code.CRT_JOBNO == this.jobno)
            if (data2.length > "0") {
                this._toasterService.toast('warning', 'warning', 'Job Number already Exists!');
                return false;
            }
        }
        if ( this.jobno==""){
            this._toasterService.toast('warning', 'warning', 'Enter Jobno first!');
            return false;
        }
        const jsoncmp2 = {
            JOBSTR: this.jobno,
            TYPE: this.mode,
            CMPID: this._loginService.getLogin()[0].CMPID,
            GUID: this._loginService.getLogin()[0].GUID,
            INVNO: null,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE
        }
        this._dataService.getData("Accounts/ACC_CRTNOTE_JOB_POPULATE", jsoncmp2)
            .subscribe((data: any) => {
             //   console.log(data)
                if (data.Table[0].STATUS == "100") {
                    this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
                    this.jobdatalist = data.Table
                    this.modecondition = true
                    this.Adv_rec = data.Table1[0].ADV_AMT
                    this.carrier = data.Table1[0].CARRIER
                    this.client_ref = data.Table1[0].CLIENT_REF
                    this.goods = data.Table1[0].GOODS
                    this.weight = data.Table1[0].WEIGHTKILO
                    this.no_pieces = data.Table1[0].NOOFPCS
                    this.no_pkgs = data.Table1[0].NOOFPKG
                    this.master = data.Table1[0].MAWBNO
                    this.masterdate = data.Table1[0].MAWBDT
                    this.volume = data.Table1[0].CBM.toFixed(3)
                    this.narration = data.Table1[0].CONTAINER
                    if (data.Table1[0].TYPEOFPCS != "") { this.pieces = data.Table1[0].TYPEOFPCS }
                    if (data.Table1[0].TYPEOFPKG != "") { this.pkgs = data.Table1[0].TYPEOFPKG }
                    let dataclient: any = []
                    if (data.Table1[0].EXPORTER != "") {
                        dataclient = this.table_client.filter((code: any) => code.EXP_CODE.split("|")[0] === data.Table1[0].EXPORTER)[0];
                        this.client = dataclient.EXP_CODE
                        this.fillAddress(dataclient.EXP_CODE)
                    }
                    this._loaderService.display(false)
                } else {
                    this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT)
                    this._loaderService.display(false)

                }
            })
    }
    Editjob(data) {
       // console.log(data)
        this.addjob = false
        this.jobupdate = true
        this.show_pkg_piece = true
        this.selected_data = data
        this.jobno_disable = true
        this.crt_no = data.INV_NO
        this.invdate = ""
        this.jobno = data.CRT_JOBNO
        this.packages = data.CRT_PKGS
        this.propweight = data.CRT_GRWT
    }

    updatejob() {
        this._loaderService.display(true)
        const jsonmaster = {
            ID: this.selected_data.ID,
            INV_NO: this.crt_no,
            INV_JOBNO: this.jobno,
            INV_PKGS: this.packages,
            INV_GRWT: this.propweight,
            VGUID: this.selected_data.VGUID,
            ACC_JOBDTLS_ID: this.selected_data.ACC_JOBDTLS_ID,
            CMPID: this._loginService.getLogin()[0].CMPID,
        }
     //   console.log(jsonmaster)
        this._dataService.Common("Accounts/ACC_CRTNOTE_JOB_TMP", jsonmaster)
            .subscribe((data: any) => {
              //  console.log(data)
                if (data.Table[0].STATUS == '100') {
                    this.jobdatalist = data.Table
                    this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
                    this.resetjob()
                    this._loaderService.display(false)
                }
                else {
                    this._loaderService.display(false)
                    this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT)
                }
            })
    }
    deletejob(deljob) {
        this._loaderService.display(true)
        const jsonmaster = {
            ID: deljob.ID,
            GUID: deljob.VGUID,
            ACC_JOBDTLS_ID: deljob.ACC_JOBDTLS_ID,
            MAKERID: this._loginService.getLogin()[0].CMPID,
        }
    //    console.log(jsonmaster)

        this._dataService.getData("Accounts/ACC_CRTNOTE_JOB_DELETE", jsonmaster)
            .subscribe((data: any) => {
             //   console.log(data)
                this._loaderService.display(false)
                if (data.Table2[0].STATUS == "100") {
                    this._toasterService.toast("success", "success", data.Table2[0].STATUSTEXT)
                    this.jobdatalist = data.Table
                    this.Adv_rec = data.Table1[0].ADV_AMT
                    this.carrier = data.Table1[0].CARRIER
                    this.client_ref = data.Table1[0].CLIENT_REF
                    this.goods = data.Table1[0].GOODS
                    this.weight = data.Table1[0].WEIGHTKILO
                    this.no_pieces = data.Table1[0].NOOFPCS
                    this.no_pkgs = data.Table1[0].NOOFPKG
                    this.master = data.Table1[0].MAWBNO
                    this.masterdate = data.Table1[0].MAWBDT
                    this.volume = data.Table1[0].CBM
                    if (data.Table1[0].TYPEOFPCS != "") { this.pieces = data.Table1[0].TYPEOFPCS }
                    if (data.Table1[0].TYPEOFPKG != "") { this.pkgs = data.Table1[0].TYPEOFPKG }
                    this._loaderService.display(false)
                } else {
                    this._toasterService.toast("error", "error", data.Table2[0].STATUSTEXT)
                    this._loaderService.display(false)
                }
            })
    }
    resetjob() {
        this.modecondition = false
        this.show_pkg_piece = false
        this.addjob = true
        this.jobupdate = false
        this.jobno_disable = false
        this.packages = ""
        this.propweight = ""
        this.jobno = ""
        this.invdate = ""

    }
    // get amount() {
    //     var data = this.qty * this.rateperqty
    //     var exchage =1;
    //     if (this.currencytype=="CR115") {
    //        exchage = data* 1  }
    //     else{exchage = data* this.excrate}

    //      var final1 = exchage.toFixed(3)
    //      this.INV_Amt_INR=final1;

    //     return data;
    // }
    get amount() {
        var data = this.qty * this.rateperqty
        this.Curamount=data;
        var exchage =1;
        if (this.currencytype=="CR115") {
           exchage = data* 1  }
        else{exchage = data* this.excrate}

         var final1 = exchage.toFixed(3)
         this.INV_Amt_INR=final1;
        if (this.currencytype=="CR115") {
            return data;
        }
        else{
           return final1;
        }
    }
    get taxamount_G() {
        var data = this.qty * this.rateperqty
        this.Curamount=data;
        var exchage =1;
        if (this.currencytype=="CR115") {
           exchage = data* 1  }
        else{exchage = data* this.excrate}

        var final = exchage.toFixed(3)
        this.taxamount_G_Inr=final;
        if (this.currencytype=="CR115") {
            return data;
        }
        else{
           return final;
        }
    }
    // get taxamount_G() {
    //     var data = this.qty * this.rateperqty
    //     var exchage =1;
    //     if (this.currencytype=="CR115") {
    //        exchage = data* 1  }
    //     else{exchage = data* this.excrate}

    //     var final = exchage.toFixed(3)
    //     this.taxamount_G_Inr=final;
    //     return data
    // }
    get taxamount_N() {
        return 0
    }
    addcharges() {
        if (this.charge == "" || this.charge == undefined) {
            this._toasterService.toast("warning", "warning", "Select Charges Code ")
            return false
        }
        if (this.account == "" || this.account == undefined) {
            this._toasterService.toast("warning", "warning", "Select Account Name")
            return false
        }
        if (this.tax == "" || this.tax == undefined) {
            this._toasterService.toast("warning", "warning", "Select Tax Type")
            return false
        }
        if (this.qty == "" || this.qty == undefined) {
            this._toasterService.toast("warning", "warning", "Enter Quantity")
            return false
        }
        if (this.rateperqty == "" || this.rateperqty == undefined) {
            this._toasterService.toast("warning", "warning", "Enter Rate")
            return false
        }
        this._loaderService.display(true)
        let data2: any = []
        data2 = this.table9_account.filter((code: any) => code.ACCTCODE === this.account)[0];
        const jsonmaster = {
            ID: this.pk_chrgeid,
            INV_NO: this.crt_no,
            INV_CHRGCODE: this.charge.split("|")[0],
            INV_ACCOUNT: this.account.split("|")[0],
            ACCOUNT_NAME: data2.ACCTNAME,
            INV_DESC_CHRG: "",
            INV_DESC1_CHRG1: this.desc1,
            INV_DESC2_CHRG1: this.desc2,
            INV_TAXABLE: this.tax,
            INV_AMOUNT: this.Curamount,//This is NON-INR Amount
            INV_INRAMT: this.INV_Amt_INR,////This is NON-INR Amount
            // INV_TAXABLE_AMOUNT: this.tax == "G" ? this.taxamount_G : this.taxamount_N,
              INV_TAXABLE_AMOUNT: this.tax == "G" ? this.Curamount : this.taxamount_N,
            INV_TAXABLE_INRAMT:this.tax == "G" ? this.taxamount_G_Inr : this.taxamount_N,// this.tax == "G" ? this.taxamount_G : this.taxamount_N,
            USERNAME: this._loginService.getLogin()[0].CMP_USERNAME,
            VGUID: this._loginService.getLogin()[0].GUID,
            ACC_CHARGDTLS_ID: this.pk_charge_detail_id,
            CMPID: this._loginService.getLogin()[0].CMPID,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
            INV_QTY: this.qty,
            INV_RATE: this.rateperqty,
            INV_CURRENCY: this.currencytype,
            INV_EXRATE: this.excrate,
        }
        //console.log(jsonmaster)
        this._dataService.Common("Accounts/ACC_CRTNOTE_CHARGE_TMP", jsonmaster)
            .subscribe((data: any) => {
             //   console.log(data)
                if (data.Table[0].STATUS == "100") {
                    this._loaderService.display(false)
                    this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
                    this.chargetable = data.Table
                    // for (var i = 0; i < this.chargetable.length; i++) {
                    //     this.TotalAmount += parseFloat(this.chargetable[i].CRT_AMOUNT);
                    // }
                     for (var i = 0; i < this.chargetable.length; i++) {
                        this.TotalAmount += parseFloat(this.chargetable[i].CRT_INRAMT);
                    }
                    this.resetcharges()
                    this._loaderService.display(false)

                } else {
                    this._toasterService.toast("error", "error", data.Table[0].STATUSTEXT)
                    this._loaderService.display(false)


                }
            })
    }
    deletecharge(deldata) {
        this._loaderService.display(true)
        const jsonmaster = {
            ID: deldata.ID,
            GUID: deldata.VGUID,
            ACC_CHARGS_ID: deldata.ACC_CHARGDTLS_ID,
            INV_CHRGCODE: deldata.INV_CHRGCODE,
        }
        //console.log(jsonmaster)
        this._dataService.getData("Accounts/ACC_CRTNOTE_CHARGES_DELETE", jsonmaster)
            .subscribe((data: any) => {
               // console.log(data);
                if (data.Table1[0].STATUS.split("#")[0] == "100") {
                    this.chargetable = data.Table
                    this._toasterService.toast("success", "success", data.Table1[0].STATUS.split("#")[1])
                    this._loaderService.display(false)
                } else {
                    this._toasterService.toast("success", "success", data.Table1[0].STATUS.split("#")[1])
                    this._loaderService.display(false)
                }
            })
    }
    resetcharges() {
        this.chargetext = "Add"
        this.account = "",
            this.desc1 = "",
            this.desc2 = "",
            this.desc = ""
        this.tax = "",
            this.qty = ""
        this.rateperqty = ""
        this.charge = "",
            this.pk_charge_detail_id = "0"
        this.pk_chrgeid = "0"
    }
    editcharge(data) {
      //  console.log(data)
        let data2: any = [], data3: any = []
        data3 = this.table8_charge.filter((code: any) => code.CHARGE_CODE.split("|")[0] === data.CRT_CHRGCODE)[0];
        data2 = this.table9_account.filter((code: any) => code.ACCTNAME === data.ACCOUNT_NAME)[0];
        this.chargetext = "Update"
        this.pk_chrgeid = data.ID,
        this.pk_charge_detail_id = data.ACC_CHARGDTLS_ID
        this.account = data2.ACCTCODE,
        this.desc = data.CRT_DESC_CHRG
        this.desc1 = data.CRT_DESC1_CHRG1,
        this.desc2 = data.CRT_DESC2_CHRG1,
        this.tax = data.CRT_TAXABLE,
        this.charge = data3.CHARGE_CODE,
        this.rateperqty=data.CRT_RATE,
        this.qty=data.CRT_QTY
        this.currencytype = data.CRT_CURRENCY,
        this.excrate = data.CRT_EXRATE


    }
    GetChargeDesc(d) {
       // this.desc1 = d.split("|")[1]
       this.desc1 = d.split("|")[2]

       if(d.split("|")[0]=='8900'){
           this.disableaccount=false;
       }
       else
       {
           let gcode=d.split("|")[4] + '|' + d.split("|")[1]
           console.log(gcode);
           this.account=gcode
           this.disableaccount=true;
       }
    }

    fillAddress(expcode) {
        this.updated_billaddress = [];
        let datafind: any = []
        var data = expcode.split("|")[0]
        datafind = this.table1_billaddress.filter((code: any) => code.EXP_CODE === data)
        if (datafind.length == "1") {
            this.updated_billaddress = datafind
            this.billaddress = datafind[0].DATAVALUEFIELD
        } else  if (datafind.length > 1)  {
            this.updated_billaddress = datafind
        }
        else{ datafind = [] ;
            this.updated_billaddress = datafind;
            this.billaddress = datafind[0].DATAVALUEFIELD
            this.billaddress  = "";
        }
    }
    MasterDateChanged(ev) {
        this.masterdate = ev.formatted
    }

    despachadd() {
         if (this.jobdatalist.length == "0") {
            this._toasterService.toast('warning', 'warning', 'Please Fill the JobDetails Tab Details!');
            return false;
        }
        if (this.chargetable.length == "0") {
            this._toasterService.toast('warning', 'warning', 'Please Fill the Charge Tab Details!');
            return false;
        }
        if(this.despach_invoiceno==""){
            this._toasterService.toast("warning", "warning", "Enter Invoice No")
            return false
        }
        if(this.despach_invoiceno.length > 0 && this.despach_invoiceno.length < 15) {
            this._toasterService.toast('warning', 'warning', 'Invalid Invoice No - Please Check !');
           this._loaderService.display(false)
            return false;
           
         }
        if(this.despach_amount=="" || this.despach_amount==0 || this.despach_amount==undefined ){
            this._toasterService.toast("warning", "warning", "Enter Invoice  Amount")
            return false
        }
         if(this.pk_Despid=="0"){
            // if ((this.Totalinvamt + parseInt(this.despach_amount)) > this.TotalAmount) {
            //     this._toasterService.toast("warning", "warning", "Amount Could not be greater than Total amount of Charges ")
            //     return false
            // }
            if (( this.adjustedamt + parseInt(this.despach_amount)) > this.invtotamt) {
                this._toasterService.toast("warning", "warning", "Amount Could not be greater than Total invoice amount ")
                return false
            }
        }
        else{
          
            if ((this.Totalinvamt - parseInt(this.editdespach_amount) + parseInt(this.despach_amount)) > this.invtotamt) {
                this._toasterService.toast("warning", "warning", "Amount Could not be greater than Total invoice amount")
                return false
            }
        }
       
        this._loaderService.display(true);
        const jsonmaster = {
            ID: this.pk_Despid,
            CRT_NO: (this.crt_no=="0" ) ? this.pk_Desp_detail_id : this.crt_no,//this.pk_Desp_detail_id,
            CRT_INVNO: this.despach_invoiceno,
            CRT_AMOUNT: this.despach_amount,
            CRT_ADJUST: this.Checked == true ? "Y" : "N",
            CMPID: this._loginService.getLogin()[0].CMPID,
            VGUID: this._loginService.getLogin()[0].GUID,
            ACC_INVDTLS_ID: this.pk_inv_Despdetailid,
            INVSTATUS: (this.checkno == true) ? 'Y' : 'N',
             CRT_CLIENT:this.client.split("|")[0]
        }
       // console.log(jsonmaster)
        this._dataService.Common("Accounts/ACC_CRTNOTE_INVOICE_TMP", jsonmaster)
            .subscribe((data: any) => {
               // console.log(data)
                if (data.Table[0].STATUS == "100") {
                    this.despach_table = data.Table1
                    this.Totalinvamt=0;
                    for (var i = 0; i < this.despach_table.length; i++) {
                        this.Totalinvamt += parseFloat(this.despach_table[i].CRT_AMOUNT);
                    }
                    this.despachreset()
                    this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
                    this._loaderService.display(false);
                }
                else if (data.Table[0].STATUS == "103") {
                    this._loaderService.display(false);
                    this.checkno = confirm(data.Table[0].STATUSTEXT)
                    if (this.checkno == true) {
                        this.despachadd()
                    } else {
                        return false
                    }
                } else {
                    this._toasterService.toast("error", "error", data.Table[0].STATUSTEXT);
                    this._loaderService.display(false);
                }
            })
    }
    despachedit(data) {
        this.despatchtext = "Update"
        this.pk_Despid = data.ID
        this.pk_Desp_detail_id = data.CRT_NO,
            this.pk_inv_Despdetailid = data.ACC_INVDTLS_ID
        this.despach_invoiceno = data.CRT_INVNO,
            this.despach_amount = data.CRT_AMOUNT
        this.Checked = data.CRT_ADJUST == "Y" ? this.Checked = true : this.Checked = false
    }
    despachreset() {
        this.despatchtext = "Add"
        this.despach_invoiceno = "",
            this.despach_amount = ""
        this.Checked = false
        this.pk_Despid = "0"
        this.pk_Desp_detail_id = "0",
            this.pk_inv_Despdetailid = "0"
    }
    despachdelete(data) {
        this._loaderService.display(true);
        const jsonmaster = {
            ID: data.ID,
            GUID: data.VGUID,
            ACC_INVDTLS_ID: data.ACC_INVDTLS_ID,
            MAKERID: this._loginService.getLogin()[0].CMPID,

        }
      //  console.log(jsonmaster)
        this._dataService.getData("Accounts/ACC_CRTNOTE_INV_DELETE", jsonmaster)
            .subscribe((data: any) => {
              if (data.Table1[0].STATUS.split("#")[0] == "100") {
                    this._toasterService.toast("success", "success", data.Table1[0].STATUS.split("#")[1])
                    this.despach_table = data.Table
                    this.Totalinvamt=0;
                    if(this.despach_table.length>0){
                        for (var i = 0; i < this.despach_table.length; i++) {
                            this.Totalinvamt += parseFloat(this.despach_table[i].CRT_AMOUNT);
                        }
                    }
                    else{
                        this.Totalinvamt =0;
                    }

                    this._loaderService.display(false);
                }else{
                    this._loaderService.display(false);
                    this._toasterService.toast("error", "error", data.Table1[0].STATUS.split("#")[1])
                }
            })
    }
    MainCreditNote_submit() {
          if(this.crtdate=="" || this.crtdate==undefined || this.crtdate==null){
            this._toasterService.toast('warning', 'warning', 'Please enter Credit Note Date!');
            return false;
        }
        if (this.chargetable.length == "0") {
            this._toasterService.toast('warning', 'warning', 'Please Fill the Charge Tab Details!');
            return false;
        }
        if (this.jobdatalist.length == "0") {
            this._toasterService.toast('warning', 'warning', 'Please Fill the JobDetails Tab Details!');
            return false;
        }
        if (this.client.split("|")[0]==""){
            this._toasterService.toast('warning', 'warning', 'Please select client!');
            return false;
        }
        if (this.billaddress.split("|")[0]==""){
            this._toasterService.toast('warning', 'warning', 'Please Select Bill to Address !');
            return false;
        }
        if ( this.document==""){
            this._toasterService.toast('warning', 'warning', 'Please select Document through!');
            return false;
        }
        if ( this.no_pkgs==""){
            this._toasterService.toast('warning', 'warning', 'No of Packages Cannot be left Blank!');
            return false;
        }
        if(this.currency.split("|")[0] !='CR115'){
            if(this.crt_currate==""){
                this._toasterService.toast('warning', 'warning', 'Please Enter INR Ruppes!');
                return false;
            }
            if(this.crt_currate1==""){
                this._toasterService.toast('warning', 'warning', 'Please Enter INR Ruppes!');
                return false;
            }
        }
        this._loaderService.display(true);
        const jsonmaster = {
            CMPID: this._loginService.getLogin()[0].CMPID,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
            ID: this.crt_id,
            CRT_NO: this.crt_no,
            CRT_DATE: this.crtdate,
            CRT_CLIENT: this.client.split("|")[0],
            CRT_SHIPPER: this.document.split("|")[0],
            CRT_BILLTYPE: this.billtype,
            CRT_PKGS: this.no_pkgs,
            CRT_TYPEOFPKG: this.pkgs,
            CRT_NOOFPCS: this.no_pieces,
            CRT_TYPEOFPCS: this.pieces,
            CRT_CLIENTREF: this.client_ref,
            CRT_WT: this.weight,
            CRT_VOL: this.volume,
            CRT_HAWBNO: this.master,
            CRT_HAWBDT: this.masterdate,
            CRT_CARRIER: this.carrier,
            CRT_GOODS: this.goods,
            CRT_CUR: this.currency.split("|")[0],
            CRT_CURINR: "",
            CRT_CURRATE: this.crt_currate,
            CRT_CURRATE1: this.crt_currate1,
            CRT_TAX: "",
            CRT_CUR_NM: "",
            NARRATIONDESC: this.narration,
            MAKERIP: this._loginService.getLogin()[0].MAKERIP,
            BILLTOADDID: this.billaddress.split("|")[0],
            VGUID: this._loginService.getLogin()[0].GUID,
            CN_TYPE: this.mode,

        }
      //  console.log(jsonmaster)
        if (this.crt_no == "0" || this.crt_no == "") {
            this._dataService.Common("Accounts/ACC_CRTNOTE_Final_IU", jsonmaster)
                .subscribe((data: any) => {
                  // console.log(data)
                    if (data.Table[0].STATUS == "100") {
                        this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
                        this.MainReset();
                        this._loaderService.display(false);
                    } else {
                        this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
                        this._loaderService.display(false);
                    }
                })
        } else {
            this._dataService.Common("Accounts/ACC_CRTNOTE_Final_IU", jsonmaster)
                .subscribe((data: any) => {
                    //console.log(data);
                    if (data.Table[0].STATUS == "100") {
                        this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
                        this.MainReset();
                        this._loaderService.display(false);
                    } else {
                        this._toasterService.toast("error", "error", data.Table[0].STATUSTEXT);
                        this._loaderService.display(false);
                    }
                })
        }
    }
    MainCreditEdit_populate() {
        this._loaderService.display(true)
        const jsonmaster = {
            CRTNOTE: this.crt_no,
            cmp_code: this._loginService.getLogin()[0].CMPCODE,
            citycode: this._loginService.getLogin()[0].CITYCODE,
            makerid: this._loginService.getLogin()[0].CMPID,
            vguid: this._loginService.getLogin()[0].GUID
        }
       // console.log(jsonmaster)

        this._dataService.getData("Accounts/ACC_CRTNOTE_Edit_Populate", jsonmaster)
            .subscribe((data: any) => {
               // console.log(data)
                this.jobdatalist = data.Table
                this.chargetable = data.Table2
                this.despach_table = data.Table3
                this.goods = data.Table1[0].CRT_GOODS
                this.masterdate = data.Table1[0].CRT_HAWBDT
                this.master = data.Table1[0].CRT_HAWBNO
                this.carrier = data.Table1[0].CRT_CARRIER
                this.Adv_rec = data.Table1[0].CRT_ADVANCE
                this.no_pieces = data.Table1[0].CRT_NOOFPCS
                this.no_pkgs = data.Table1[0].CRT_PKGS
                this.volume = data.Table1[0].CRT_VOL
                this.weight = data.Table1[0].CRT_WT
                this.narration = data.Table1[0].NARRATION
                this.billtype = data.Table1[0].CRT_BILLTYPE
                this.client_ref = data.Table1[0].CRT_CLIENTREF
                this.crt_currate = data.Table1[0].CRT_CURRATE
                this.crt_currate1 = data.Table1[0].CRT_CURRATE1
                this.crtdate = data.Table1[0].CRT_DATE
                this.crt_no = data.Table1[0].CRT_NO
                this.crt_id = data.Table1[0].ID
                this.mode=data.Table1[0].CN_TYPE
                if (data.Table1[0].CRT_TYPEOFPCS != "") { this.pieces = data.Table1[0].CRT_TYPEOFPCS }
                if (data.Table1[0].CRT_TYPEOFPKG != "") { this.pkgs = data.Table1[0].CRT_TYPEOFPKG }
                let datacurrency: any = [], dataclient: any = [], datadocument: any = []
                if (data.Table1[0].CRT_CLIENT != "") {
                    //console.log(data.Table1[0].CRT_CLIENT)
                    dataclient = this.table_client.filter((code: any) => code.EXP_CODE.split("|")[0] === data.Table1[0].CRT_CLIENT)[0];
                    this.client = dataclient.EXP_CODE
                }
                if (data.Table1[0].CRT_CUR != "") {
                    datacurrency = this.table3_curreny.filter((code: any) => code.cur_code.split("|")[0] === data.Table1[0].CRT_CUR);
                    this.currency = datacurrency[0].cur_code
                }
                if (data.Table1[0].CRT_SHIPPER != "") {
                    datadocument = this.table2_document.filter((code: any) => code.EXP_CODE.split("|")[0] === data.Table1[0].CRT_SHIPPER);
                    this.document = datadocument[0].EXP_CODE
                }
                this.fillAddress(data.Table1[0].CRT_CLIENT)
                this.billaddress = data.Table1[0].BILLTOADDR
                this._loaderService.display(false)
            })
    }
    GetCurrencyName(data) {
        data = this.table3_curreny.filter((code: any) => code.cur_code === data)[0]
        this.currencyname = data.DATATEXTVALUE
    }
    Narrationarea() {
        var textarea = document.querySelector("#autoresizing");
        textarea.addEventListener('input', autoResize, false);
        function autoResize() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        }
    }
    MainReset(){
        this.resetcharges()
        this.resetjob()
        this.despachreset()
        this.jobdatalist=[]
        this.chargetable=[]
        this.despach_table=[]
        this.goods = ""
        this.masterdate = ""
        this.master =  ""
        this.carrier =  ""
        this.Adv_rec =  ""
        this.no_pieces =  ""
        this.no_pkgs =  ""
        this.volume =  ""
        this.weight =  ""
        this.narration =  ""
        this.billtype =  ""
        this.client_ref =  ""
        this.crt_currate =  ""
        this.crt_currate1 =  ""
        this.crt_no =  "0"
        this.mode = ""
        this.client=""
        this.billaddress=""
        this.pieces=""
        this.pkgs=""
        const jsonmaster = {
            VGUID: this._loginService.getLogin()[0].GUID,
              }
         this._dataService.getData("Accounts/ACC_CREDITNOTE_NG_RESET", jsonmaster)
             .subscribe((data: any) => {
                 //console.log(data);
                 if(data.Table[0].STATUS == "100"){
                   }
                })
        this._router.navigate(['/accounts/transaction/creditnote/general/ ' ]);
    }
    viewinvno(Invoiceno) {
        // console.log(Invoiceno)
         var Inv =Invoiceno.target;
         Inv=Inv.innerText;
        // Inv=Inv.replace('</p>','')

          var inv = Inv.trim()
         // console.log(inv)
          let theTop = (screen.height / 2) - (483 / 2);
          let theLeft = (screen.width / 2) - (780 / 2);
          let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
          window.open('./#/popup/Account-Invoice-View/' + inv + '/', "Invoice View", toolbar);
      }
 GetInvoicebalAmt(){
        const jsondata = {
            invno: this.despach_invoiceno,
            crtno: this.crt_no,
          
        }
        this._loaderService.display(true);
        this._dataService.getData("Accounts/ACC_CREDITNOTE_GETINVOICE_BALAMOUNT", jsondata)
            .subscribe((data: any) => {
             //   console.log(data)
                if (data.Table[0].STATUS == "100") {
                    this.invtotamt = data.Table[0].Invoicetotamt
                    this.adjustedamt = data.Table[0].AdjustedAmt
                    this.despach_amount=data.Table[0].balamt
                    } 
                    else if (data.Table[0].STATUS == "103") {
                        alert(data.Table[0].STATUSTXT);
                        this.despach_invoiceno='';
                        return false;
                    }
                    this._loaderService.display(false);
      });
      }
}
