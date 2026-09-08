import { AfterViewInit, Component, OnInit } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router, ActivatedRoute } from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { ToastCommonService } from '../../../shared/service/toastService';
import { FilterPipe } from 'ngx-filter-pipe';
import { LoaderService } from '../../../shared/service/loader.service';
import { TabsetComponent } from 'ngx-bootstrap/tabs';
import { DatePipe } from '@angular/common';
 
@Component({
    templateUrl: 'general-invoice.component.html',
    styles: [`
    // .form-control {
    //    padding:0px !important;
    //    margin:0px !important;
    //    //height:20px !important;
    // }
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
    // .tab-content .tab-pane {
    //     padding-bottom: 0rem !important;
    // }
    #autoresizing { 
        display: block; 
        overflow: hidden; 
        resize: none; 
    } 
    
    
    `],
    providers: [DatePipe]

})
export class InvoiceComponent implements OnInit    {
    term: string;
    selected_data: any
    Header: string = "Invoice ";
    value: number = 1;
     
    table4_billtype: []; table5_mode: []; table1_billaddress; table6_pkgs: []; table7_pieces: []; table8_charge: []; table13_currencytype: []
    table9_account: []; table3_curreny: []; table_client: []; table2_document: []; Table12_despach: []; Table11_enclose: []; updated_billaddress

    billtype: string = ""; billaddress: string; pkgs: string = ""; pieces: string = ""; currency: string = "";
    client: string; document: string; rupeestext: string = ""; Adv_rec: string = ""; volume: string = ""; weight: string = ""; client_ref: string = ""; chargetable: any = []
    carrier: string = ""; goods: string = ""; master: string = ""; BE_no: string = ""; masterdate; currencyname: string = ""
    ship_billno: string = ""; shipbilldate; clent_excutive: string = ""; narration: string = ""; no_pkgs: string = ""; no_pieces: string = ""
    inv_currate: string = ""; inv_currate1: string = ""
    jobno: string = ""; jobnolist: string = ""; sel_id: string = ""; sel_job; Ship_code: string = ""; newArray: any = []; ListJob: []; jobdatalist: any = []; REMARK1: String = "";
    paybydate; client_excutive: string = ""
    public showModal_ListJob: boolean = false; public show_pkg_piece: boolean = false; public jobno_disable: boolean = false
    public showModal_Remark: boolean = false; public modecondition: boolean = false; public addjob: boolean = true; public jobupdate: boolean = false

    InvoiceDate = new Date();

    invoiceid: string = "0"; queryParamsUserId: string = ""; Mainaddtext = "Submit"

    pk_jobid: string = "0"; pk_job_detail_id: string = "0"; packages: string = ""; propweight: string = ""; invno: string = "";
    invdate; mode: string = "";

    pk_chrgeid: string = "0"; pk_charge_detail_id = "0"; chargetext = "Add"; excrate: any = "1.00"; currencytype: string = ""; tax: string = "";
    qty: any = ""; rateperqty: any = ""; charge: string; account: string; desc: string = ""; desc1: string = ""; desc2: string = ""

    pk_Enclid: string = "0"; pk_Ecl_detail_id: string = "0"; enclosuretext = "Add"; enclose_desc: string = ""; enclose_number: string = "";
    enclosuretable: any = []; enclose_code: string = "";

    pk_Despid: string = "0"; pk_Desp_detail_id: string = "0"; despatchtext = "Add"; despach_desc: string = ""; despach_no: string = "";
    despach_table: any = []; despachcode: string = ""
    CLIENTCODE; ISPAYBYDT_AIR; ISPAYBYDT_SEA; CREDITPERIOD_SEA; CREDITPERIOD_AIR; HDMODE
    INVDATE; HAWBDATE;
    fromright_dt: any=null;
    toright_dt: any=null;
    tab: number = 1;
    AUTHORISEDTOPRINT:string;
    INV_Amt_INR ;  taxamount_G_Inr ;
    public disableexrate:boolean=true;
    public disablegeninvcur:boolean=false;
    public disablegencurrate:boolean=false;
    public disablegencurrate1:boolean=false;
    disableaccount: boolean = false;
    Curamount;
    invstartdate;
    codelistActt :any=[] ;
    accountname:string="";
    public disabletax:boolean=false;
    errorMessage: string = '';
    constructor(
        private _router: Router,
        private _dataService: DataService, private datePipe: DatePipe,
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
        selectorWidth: '200px',
        
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
    ngOnInit(): void {
        this._loaderService.display(true)
        this.invdate = new Date();
        this.invdate = this._dataService.datechnge(this.invdate)
        this.paybydate=new Date();
        this.paybydate=this._dataService.datechnge(this.paybydate)
        this.invstartdate=new Date();
        this._activatedRoute.params.subscribe(params => {
            this.queryParamsUserId = params["invoiceno"];
            this.invoiceid = (this.queryParamsUserId == " " ? "0" : this.queryParamsUserId);
        })
        if (this.queryParamsUserId != ' ') {
          //  this.verifyPermission('3','Modify');
          this.verifyPermission('423','Modify');
        }else{
          // this.verifyPermission('3','Add');
          this.verifyPermission('423','Add');
        }

        const jsoncmp = {
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
            CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
            cmpid: this._loginService.getLogin()[0].CMPID,
            INVNO: "",
            type: "II"
        }
        this._dataService.getData("Accounts/ACC_INVOICE_PAGE_LOAD", jsoncmp)
            .subscribe((data: any) => {
              //  console.log(data)
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
                this.Table12_despach = data.Table12
                this.Table11_enclose = data.Table11
                this.table13_currencytype = data.Table13
                this.currencytype = "CR115"
                this.excrate="1"
               
                if (this.queryParamsUserId != ' ') {
                    this.MainEdit_populate()
                     this.Mainaddtext = "Update";
                  }
              this._loaderService.display(false);  
            })
            // $(document).ready(function(){
            //     $("p").click(function(){
            //         alert('alert'); 
            //     }); 
            // }); 
            
    }
    onInput(event: Event): void {
        const input = (event.target as HTMLInputElement).value;
    
        // Regex to allow up to 4 decimal places
        const regex = /^\d*(\.\d{0,4})?$/;
    
        if (regex.test(input)) {
          this.inv_currate = input; // Valid input
          this.errorMessage = '';
        } else {
          this.errorMessage = 'Invalid input format.';
        }
      }
    
      // Final validation on blur
      onBlur(event: Event): void {
        const input = (event.target as HTMLInputElement).value;
    
        // Remove invalid characters or correct the format
        const regex = /^\d*(\.\d{0,4})?$/;
    
        if (!regex.test(input)) {
          this.inv_currate = this.inv_currate.replace(/[^0-9.]/g, '').replace(/(\.\d{4})\d+/, '$1');
        }
      }
    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {   
                if (this._loginService.getLogin()[0].ROLETYPE!='SA'){
                    this.fromright_dt= data.Table[0].rightsfrmdt;
                    this.toright_dt=data.Table[0].rightstodt;
                    this.onDisableRange();
                 }
               this._loginService.checkVerify(userMode, data);
               //this._loaderService.display(false);

            });
    }
    onvalchange(){this.value =2}
    onDisableRange() {
        var date = new Date(this.fromright_dt);
        var newdate = new Date(date);
        let bdate = new Date();
        bdate=newdate 
        let copy = this.getCopyOfOptions();
        bdate.setDate(bdate.getDate());     
        copy.disableUntil={year: bdate.getFullYear(), month: bdate.getMonth() + 1, day: bdate.getDate()} ;
        this.myDatePickerOptionsInv = copy;

        let todt = new Date(this.toright_dt);
        var newtodate = new Date(todt);
        let d=new Date();
        d=newtodate;
        let copy1 = this.getCopyOfOptions();
        copy1.disableSince = {year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate()+1};
        this.myDatePickerOptionsInv = copy1;
    }
    // onDisableRange() {
    //     var date = new Date(this.fromright_dt);
    //     var newdate = new Date(date);
    //     let bdate = new Date();
    //     bdate=newdate 
    //     let copy = this.getCopyOfOptions();
    //     bdate.setDate(bdate.getDate());     
    //     copy.disableUntil={year: bdate.getFullYear(), month: bdate.getMonth() + 1, day: bdate.getDate()} ;
    //     this.myDatePickerOptionsInv = copy;

      
    // }
    getCopyOfOptions(): IMyDpOptions {
        return JSON.parse(JSON.stringify(this.myDatePickerOptionsInv));
    }

    // **ADD JOB FUNCTION START ***
    listjobpopup() {
        if (this.jobno == "" && this.mode != "") {
            this.showModal_ListJob = true
            this.modecondition = true
            this._loaderService.display(true)
            const jsoncmp1 = {
                frmdt: this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE),
                todt: this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE),
                CMPCODE: this._loginService.getLogin()[0].CMPCODE,
                CITYCODE: this._loginService.getLogin()[0].CITYCODE,
                CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
                Type: this.mode
            }
            this._dataService.getData("Accounts/ACC_INVOICE_LIST_JOB", jsoncmp1)
                .subscribe((data: any) => {
                    if (data.Table[0].STATUS == "100") {
                        this.ListJob = data.Table
                        this._loaderService.display(false)
                    } else {
                        this._toasterService.toast('warning', 'warning', data.Table[0].STATUSTEXT);
                        this._loaderService.display(false)
                    }
                })
        } else if (this.jobno != "" && this.mode != "") {
            this.inputlist()
        } else if (this.jobno != "" && this.mode == "") {
            this._toasterService.toast('warning', 'warning', 'Please Select Mode!');
            return false;
        } else {
            this._toasterService.toast('warning', 'warning', 'Please Select Mode!');
            return false;
        }

    } // **END OF ADDING JOB FUNCTION START ***
    

    inputlist() {
        if (this.jobdatalist.length > "0") {
            let jobno: any = []
            jobno = this.jobdatalist.filter((code: any) => code.INV_JOBNO === this.jobno)
            if (jobno.length > "0") {
                this._toasterService.toast('warning', 'warning', 'Job Number already Exists!');
                return false;
            }
        }
        this.populatejob()
    }
    popup_listjob() {
        if (this.newArray == "") {
            this._toasterService.toast('warning', 'warning', 'Please Select Job Number!');
            return false;
        }
        this.showModal_ListJob = false
        var output = this.newArray.map(function (item) {
            return item.inoiceno;
        });
        this.jobnolist = output.join(",")
        this.newArray = []
        this.populatejob()
    }
    getCheckboxValues(event, data, shipcode, id) {
        this.sel_id = id
        if (this.jobdatalist.length > "0") {
            let data2: any = []
            data2 = this.jobdatalist.filter((code: any) => code.INV_JOBNO == data)            
            if (data2.length > "0") {
                this._toasterService.toast('warning', 'warning', 'Job Number already Exists!');
                return false;
            }
            //  if (this.jobdatalist[0].EXPORTER != shipcode) {
            //      this.ListJob[this.sel_id]["Checked"] = false;
            //      this._toasterService.toast('warning', 'warning', 'Shipper Name should be same type!');
            //      return false;
            //  }
        }
        //  if (this.newArray.length > "0") {
        //      if (this.newArray[0].exporter != shipcode) {
        //          this.ListJob[this.sel_id]["Checked"] = false;
        //          this._toasterService.toast('warning', 'warning', 'Shipper Name should be same type!');
        //          return false;
        //      }
        //  }

        if (this.jobdatalist.length > "0") {
            let data2: any = []
            data2 = this.jobdatalist.filter((code: any) => code.INV_JOBNO == data)
            if (data2.length > "0") {
                this._toasterService.toast('warning', 'warning', 'Job Number already Exists!');
                return false;
            }
        }
        this.Ship_code = shipcode
        this.sel_job = data
        this.sel_id = id
        let popup: any = [];
        popup = this.ListJob.filter((code: any) => code.EXPTNO === data);
        this.REMARK1 = popup[0].REMARK
        if (this.REMARK1 != "") {
            this.showModal_Remark = true
        } else {
            var index = this.newArray.findIndex(x => x.inoiceno == data);
            if (event) {
                let obj = {
                    inoiceno: data,
                    exporter: shipcode
                }
                this.newArray.push(obj);
            }
            else {
                this.newArray.splice(index, 1);
            }
        }
    }
    remarks_popup_select(type) {
        // if (this.jobdatalist.length > "0") {
        //     if (this.jobdatalist[0].EXPORTER != this.Ship_code) {
        //         this.ListJob[this.sel_id]["Checked"] = false;
        //         this._toasterService.toast('warning', 'warning', 'Shipper Name should be same type!');
        //         return false;
        //     }
        // }
        // if (this.newArray.length > "0") {
        //     if (this.newArray[0].exporter != this.Ship_code) {
        //         this.ListJob[this.sel_id]["Checked"] = false;
        //         this._toasterService.toast('warning', 'warning', 'Shipper Name should be same type!');
        //         return false;
        //     }
        // }
        this.showModal_Remark = false
        if (type == "YES") {
            let obj = {
                inoiceno: this.sel_job,
                exporter: this.Ship_code
            }
            this.newArray.push(obj);
        } else {
            var index = this.newArray.findIndex(x => x.inoiceno == this.sel_job);
            this.newArray.splice(index, 1);
            this.ListJob[this.sel_id]["Checked"] = false;
        }
    }
    populatejob() {
        this._loaderService.display(true)
        if(this.jobno.substr(7, 1) !=this.mode){
            this._toasterService.toast('warning', 'warning', 'You have entered  jobno of different mode !');
            this._loaderService.display(false)
             return false 
        }
        if(this.jobno.length > 0 && this.jobno.length < 15) {
            this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
           this._loaderService.display(false)
            return false;
           
         }
        if(this.jobno.length > 0 && this.jobno.length == 15)  {
            if (this.jobno.substr(0, 2) != this._loginService.getLogin()[0].CMPCODE)  {
                this._toasterService.toast("warning","warning",'You have entered Job No of different Company !');
                this._loaderService.display(false)
                return false;
             }
            // if (this.jobno.substr(2, 3) != this._loginService.getLogin()[0].CITYCODE1)   {
            //     this._toasterService.toast("warning","warning",'You have entered Job No of different City !');
            //     this._loaderService.display(false)
            //     return false;
            //    }
       }
        const jsoncmp2 = {
            JOBSTR: this.jobno == "" ? this.jobnolist : this.jobno,
            TYPE: this.mode,
            CMPID: this._loginService.getLogin()[0].CMPID,
            GUID: this._loginService.getLogin()[0].GUID,
            INVNO: null,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE
        }
        this._dataService.getData("Accounts/ACC_INVOICE_JOB_POPULATE", jsoncmp2)
            .subscribe((data: any) => {
                //console.log(data)
                if (data.Table[0].STATUS == "100") {
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
                    this.ship_billno = data.Table1[0].SHIPBILLNO
                    this.shipbilldate = data.Table1[0].SHIPBIILLDT
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

    Editjob(ID) {
        this.addjob = false
        this.jobupdate = true
        this.show_pkg_piece = true
        this.selected_data = ID
        this.jobno_disable = true
        this.invno = ID.INV_NO
        this.invdate = this.datePipe.transform(this.InvoiceDate, 'dd/mm/yyyy')
        this.jobno = ID.INV_JOBNO
        this.packages = ID.INV_PKGS
        this.propweight = ID.INV_GRWT
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
        this.invno = ""
        this.invdate = this.datePipe.transform(this.InvoiceDate, 'dd/mm/yyyy')

    }
    updatejob() {
        this._loaderService.display(true)
        const jsonmaster = {
            ID: this.selected_data.ID,
            INV_NO: this.invno,
            INV_JOBNO: this.jobno,
            INV_PKGS: this.packages,
            INV_GRWT: this.propweight,
            VGUID: this.selected_data.VGUID,
            ACC_JOBDTLS_ID: this.selected_data.ACC_JOBDTLS_ID,
            CMPID: this._loginService.getLogin()[0].CMPID,
        }
        this._dataService.Common("Accounts/ACC_invoice_Job_TMP", jsonmaster)
            .subscribe((data: any) => {
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
            Makerid: this._loginService.getLogin()[0].CMPID,
        }
        this._dataService.getData("Accounts/ACC_INVOICE_JOB_DELETE", jsonmaster)
            .subscribe((data: any) => {
                if (data.Table2[0].STATUS == "100") {
                    this._toasterService.toast("success", "success", data.Table2[0].STATUSTEXT)
                    
                        if(data.Table.length=="0" )
                        { 
                            this.jobdatalist =[]
                        }else
                        {  this.jobdatalist = data.Table
                        }
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
      
    //Charges functions
    get amount() {
        var data = this.qty * this.rateperqty
        this.Curamount=data;
        var exchage =1;
        if (this.currencytype=="CR115") {
           exchage = data* 1  }
        else{exchage = data* this.excrate}
         
         var final1 = exchage.toFixed(2)
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
          
        var final = exchage.toFixed(2)
        this.taxamount_G_Inr=final;
        return final
    }
    get taxamount_N() {
        return 0
    }
    // get Curamount() {
    //     var data = this.qty * this.rateperqty
    //    return data;
    //      }
        
  
    addcharges() {
        if (this.charge == "" || this.charge == undefined) {
            this._toasterService.toast("warning", "warning", "Select Charges Code ")
            return false
        }
        if (this.charge.split("|")[0] == "8900") {
            if (this.account == "" || this.account == undefined) {
            this._toasterService.toast("warning", "warning", "Select Account Name")
            return false
            }


        }
        if (this.desc1 == "" || this.desc1  == undefined) {
            this._toasterService.toast("warning", "warning", "Please Input Charge description !")
            return false
        }
        if (this.currencytype == "" || this.currencytype == undefined) {
            this._toasterService.toast("warning", "warning", "Select  Currency Type")
            return false
        }
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
            INV_NO: this.invoiceid,
            INV_CHRGCODE: this.charge.split("|")[0],
            INV_ACCOUNT: this.account.split("|")[0],
            ACCOUNT_NAME: data2.ACCTNAME,
            INV_DESC_CHRG: "",
            INV_DESC1_CHRG1: this.desc1,
            INV_DESC2_CHRG1: this.desc2,
            INV_TAXABLE: this.tax,
            INV_AMOUNT: this.Curamount,//this.amount,
            INV_INRAMT: this.INV_Amt_INR,//this.amount,
            //INV_TAXABLE_AMOUNT: this.tax == "G" ? this.taxamount_G : this.taxamount_N,
            INV_TAXABLE_AMOUNT: this.tax == "G" ? this.Curamount : this.taxamount_N,
            INV_TAXABLE_INRAMT: this.tax == "G" ? this.taxamount_G_Inr : this.taxamount_N,//this.tax == "G" ? this.taxamount_G : this.taxamount_N,
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
        this._dataService.Common("Accounts/ACC_invoice_Charge_TMP", jsonmaster)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == "100") {
                    this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
                    this.chargetable = data.Table
                      if(this.chargetable.length==0){
                        this.disablegeninvcur=false;
                        this.disablegencurrate=false;
                        this.disablegencurrate1=false;    
                    }
                    else
                    {
                        if(this.currency.split("|")[0]!='CR115'){
                        this.disablegeninvcur=true;
                        this.disablegencurrate=true;
                        this.disablegencurrate1=true;
                        }
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
      //  console.log(jsonmaster)
        this._dataService.getData("Accounts/ACC_INVOICE_CHARGES_DELETE", jsonmaster)
            .subscribe((data: any) => {
                //console.log(data);
                if (data.Table1[0].STATUS.split("#")[0] == "100") {
                    this.chargetable = data.Table
                    if(this.chargetable.length==0){
                        this.disablegeninvcur=false;
                        this.disablegencurrate=false;
                        this.disablegencurrate1=false;    
                    }
                    else
                    {
                        this.disablegeninvcur=true;
                        this.disablegencurrate=true;
                        this.disablegencurrate1=true;
                    }
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
            this.qty = "",
            this.rateperqty = "",
            this.currencytype = "CR115"
        this.excrate = "1.00",
            this.charge = "",
            this.pk_charge_detail_id = "0"
        this.pk_chrgeid = "0"
    }
    editcharge(data) {
        let data2: any = [], data3: any = []
        data3 = this.table8_charge.filter((code: any) => code.CHARGE_CODE.split("|")[0] === data.INV_CHRGCODE)[0];
        data2 = this.table9_account.filter((code: any) => code.ACCTNAME === data.ACCOUNT_NAME)[0];
        this.chargetext = "Update"
        this.pk_chrgeid = data.ID,
        this.pk_charge_detail_id = data.ACC_CHARGDTLS_ID
        this.account = data2.ACCTCODE,
        this.desc = data.INV_DESC_CHRG
        this.desc1 = data.INV_DESC1_CHRG1,
        this.desc2 = data.INV_DESC2_CHRG1,
        this.tax = data.INV_TAXABLE,
        this.qty = data.INV_QTY,
        this.rateperqty = data.INV_RATE,
        this.currencytype = data.INV_CURRENCY,
        this.excrate = data.INV_EXRATE,
        this.charge = data3.CHARGE_CODE
    }
    // GetChargeDesc(d) {
    //     this.desc1 = d.split("|")[1]
    // }
    GetChargeDesc(d) {
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
    GetAccountDesc(event){
        // console.log(event.value.split("|")[1])
         if(this.charge.split("|")[0]=="8900"){
             this.desc1=event.split("|")[1]
         }

     }
    //Enclosure functions
    addenclosure() {
        if (this.enclose_code == "" || this.enclose_code == undefined) {
            this._toasterService.toast("warning", "warning", "Select Enclosure Code")
            return false
        }
        if (this.enclose_desc == "" || this.enclose_desc == undefined) {
            this._toasterService.toast("warning", "warning", "Enter Enclosure Description")
            return false
        }
        if (this.enclose_number == "" || this.enclose_number == undefined) {
            this._toasterService.toast("warning", "warning", "Enter Enclosure Number")
            return false
        }
        this._loaderService.display(true);
        const jsonmaster = {
            ID: this.pk_Enclid,
            INV_NO: this.invoiceid,
            INV_ENCLCODE: this.enclose_code,
            INV_DESC: this.enclose_desc,
            INV_NUMBER: this.enclose_number,
            USERNAME: this._loginService.getLogin()[0].CMP_USERNAME,
            VGUID: this._loginService.getLogin()[0].GUID,
            ACC_ENCLDTLS_ID: this.pk_Ecl_detail_id,
            CMPID: this._loginService.getLogin()[0].CMPID,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,

        }
        this._dataService.Common("Accounts/ACC_invoice_enclosure_TMPIU", jsonmaster)
            .subscribe((data: any) => {
                //  console.log(data);
                if (data.Table[0].STATUS == "100") {
                    this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
                    this.enclosuretable = data.Table
                //    console.log(this.enclosuretable);
                    this.resetenclosure()
                    this._loaderService.display(false);
                }
                else {
                    this._toasterService.toast("error", "error", data.Table[0].STATUSTEXT);
                    this._loaderService.display(false);
                }
            })
    }
    resetenclosure() {
        this.enclosuretext = "Add"
        this.enclose_code = "",
            this.enclose_desc = "",
            this.enclose_number = "",
            this.pk_Ecl_detail_id = "0",
            this.pk_Enclid = "0"
    }
    deleteenclosur(data) {
        this._loaderService.display(true);

        const jsonmaster = {
            ID: data.ID,
            GUID: data.VGUID,
            ACC_ENCLDTLS_ID: data.ACC_ENCLDTLS_ID,
        }
        //  console.log(jsonmaster)
        this._dataService.getData("Accounts/ACC_INVOICE_ENCLOSURE_DELETE", jsonmaster)
            .subscribe((data: any) => {
                // console.log(data);
                if (data.Table1[0].STATUS.split("#")[0] == "100") {
                    this._toasterService.toast("success", "success", data.Table1[0].STATUS.split("#")[1])
                    this.enclosuretable = data.Table
                    this._loaderService.display(false);

                }
            })
    }
    editenclosue(data) {
        //  console.log(data)
        this.enclosuretext = "Update"
        this.pk_Enclid = data.ID,
            this.pk_Ecl_detail_id = data.ACC_ENCLDTLS_ID,
            this.enclose_code = data.INV_ENCLCODE,
            this.enclose_desc = data.INV_DESC,
            this.enclose_number = data.INV_NUMBER
    }

    //despatch functions
    despachadd() {
        if (this.despachcode == "" || this.despachcode == undefined) {
            this._toasterService.toast("warning", "warning", "Select Dispatch Code")
            return false
        }
        if (this.despach_desc == "" || this.despach_desc == undefined) {
            this._toasterService.toast("warning", "warning", "Enter Dispatch Description")
            return false
        }
        if (this.despach_no == "" || this.despach_no == undefined) {
            this._toasterService.toast("warning", "warning", "Enter Dispatch Number")
            return false
        }
        this._loaderService.display(true);
        const jsonmaster = {
            ID: this.pk_Despid,
            INV_NO: this.invoiceid,
            INV_DESPCODE: this.despachcode,
            INV_DESC: this.despach_desc,
            INV_NUMBER: this.despach_no,
            USERNAME: this._loginService.getLogin()[0].CMP_USERNAME,
            VGUID: this._loginService.getLogin()[0].GUID,
            ACC_DESPDTLS_ID: this.pk_Desp_detail_id,
            CMPID: this._loginService.getLogin()[0].CMPID,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
        }
        this._dataService.Common("Accounts/ACC_invoice_Dispatch_TMPIU", jsonmaster)
            .subscribe((data: any) => {
                if (data.Table1[0].STATUS.split("#")[0] == "100") {
                    this._toasterService.toast("success", "success", data.Table1[0].STATUS.split("#")[1])
                    this.despach_table = data.Table
                    this.despachreset()
                    this._loaderService.display(false);
                } else {
                    this._toasterService.toast("error", "error", data.Table1[0].STATUSTEXT);
                    this._loaderService.display(false);
                }
            })
    }
    despachdelete(data) {
        this._loaderService.display(true);
        const jsonmaster = {
            ID: data.ID,
            GUID: data.VGUID,
            ACC_DESPDTLS_ID: data.ACC_DESPDTLS_ID,
        }
        this._dataService.getData("Accounts/ACC_INVOICE_dispatch_DELETE", jsonmaster)
            .subscribe((data: any) => {
                if (data.Table1[0].STATUS.split("#")[0] == "100") {
                    this._toasterService.toast("success", "success", data.Table1[0].STATUS.split("#")[1])
                    this.despach_table = data.Table
                    this._loaderService.display(false);

                }
            })
    }
    despachreset() {
        this.despatchtext = "Add"
        this.despachcode = "",
            this.despach_desc = "",
            this.despach_no = "",
            this.pk_Desp_detail_id = "0",
            this.pk_Despid = "0"
    }
    despachedit(data) {
       // console.log(data)
        this.despatchtext = "Update"
        this.pk_Despid = data.ID,
            this.pk_Desp_detail_id = data.ACC_DESPDTLS_ID,
            this.despachcode = data.INV_DESPCODE,
            this.despach_desc = data.INV_DESC,
            this.despach_no = data.INV_NUMBER
    }

    //Final Submit 
    MainInvoice_submit() {
        //console.log(this.invoiceid)
             if(this.invdate=="" || this.invdate==undefined || this.invdate==null){
            this._toasterService.toast('warning', 'warning', 'Please enter Invoice Date!');
            return false;
        }
        if (this.AUTHORISEDTOPRINT=="1"){
            this._toasterService.toast("warning", "warning", "You can`t Update this invoice print already taken !");
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
            if(this.inv_currate==""){
                this._toasterService.toast('warning', 'warning', 'Please Enter INR Ruppes!');
                return false;
            }    
            if(this.inv_currate1==""){
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
            INV_NO: this.invno,
            INV_DATE: this.invdate,//this.datePipe.transform(this.InvoiceDate, 'dd/MM/yyyy'),
            INV_CLIENT: this.client.split("|")[0],
            INV_CLIENT_NM: this.billaddress.split("|")[0],
            INV_SHIPPER: this.document,
            INV_BILLTYPE: this.billtype,
            INV_PKGS: this.no_pkgs,
            INV_TYPEOFPKG: this.pkgs,
            INV_NOOFPCS: this.no_pieces,
            INV_TYPEOFPCS: this.pieces,
            INV_CLIENTREF: this.client_ref,
            INV_WT: this.weight,
            INV_VOL: this.volume,
            INV_HAWBNO: this.master,
            INV_HAWBDT: this.masterdate,
            INV_CARRIER: this.carrier,
            INV_GOODS: this.goods,
            INV_CUR: this.currency.split("|")[0],
            INV_CURINR: "",
            INV_CURRATE: this.inv_currate,
            INV_CURRATE1: this.inv_currate1,
            INV_TAX: "",
            INV_ADVANCE: this.Adv_rec,
            NARRATIONDESC: this.narration,
            VGUID: this._loginService.getLogin()[0].GUID,
            MAKER_ID: this._loginService.getLogin()[0].CMPID,
            MAKER_IP: this._loginService.getLogin()[0].MAKERIP,
            SHIPINGBILLNO: this.ship_billno,
            SHIPBILLDT: (this.shipbilldate == undefined )? "" : this.shipbilldate,
            paydt: this.paybydate,
            INV_TYPE: this.mode,
            CLIENTCONT: this.client_excutive,
            INVSTARTDATE:this.invstartdate
        }
        // console.log(jsonmaster)
        if (this.invoiceid == "0") {
            this._dataService.Common("Accounts/ACC_invoice_INSERT", jsonmaster)
                .subscribe((data: any) => {
                    //  console.log(data)
                    if (data.Table[0].STATUS == "100") {
                        this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT);
                        this.MainReset();
                        this._loaderService.display(false);
                    } else {
                        this._toasterService.toast("error", "error", data.Table[0].STATUSTEXT);
                        //this.MainReset();
                        this._loaderService.display(false);
                    }
                })
        } else {
            this._dataService.Common("Accounts/ACC_invoice_UPDATE", jsonmaster)
                .subscribe((data: any) => {
                    //  console.log(data);
                    if (data.Table[0].STATUS == "100") {
                        this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT);
                        this.MainReset();
                        this._loaderService.display(false);
                    } else {
                        this._toasterService.toast("error", "error", data.Table[0].STATUSTEXT);
                       // this.MainReset();
                        this._loaderService.display(false);
                    }
                })
        }
    }

    //search populate function
    MainEdit_populate() {
        const jsonmaster = {
            InvoiceNo: this.queryParamsUserId,
            cmp_code: this._loginService.getLogin()[0].CMPCODE,
            citycode: this._loginService.getLogin()[0].CITYCODE,
            makerid: this._loginService.getLogin()[0].CMPID,
            vguid: this._loginService.getLogin()[0].GUID
        }
        this._loaderService.display(true)
        this._dataService.getData("Accounts/ACC_INVOICE_Edit_Populate", jsonmaster)
            .subscribe((data: any) => {
               // console.log(data);
               if (data.Table[0].STATUS == "100") {
                this.jobdatalist = data.Table
                this.chargetable = data.Table3
                this.enclosuretable = data.Table4
                this.despach_table = data.Table5
                this.goods = data.Table1[0].INV_GOODS
                this.masterdate = data.Table1[0].INV_HAWBDT
                this.master = data.Table1[0].INV_HAWBNO
                this.carrier = data.Table1[0].INV_CARRIER
                this.Adv_rec = data.Table1[0].INV_ADVANCE
                this.no_pieces = data.Table1[0].INV_NOOFPCS
                this.no_pkgs = data.Table1[0].INV_PKGS
                this.volume = data.Table1[0].INV_VOL
                this.weight = data.Table1[0].INV_WT
                this.narration = data.Table1[0].NARRATION
                this.billtype = data.Table1[0].INV_BILLTYPE
                this.client_ref = data.Table1[0].INV_CLIENTREF
                this.inv_currate = data.Table1[0].INV_CURRATE
                this.inv_currate1 = data.Table1[0].INV_CURRATE1
                this.ship_billno = data.Table1[0].SHIPBILLNO
                this.shipbilldate = data.Table1[0].SHIPBILLDT
                this.invdate = data.Table1[0].INV_DATE
                this.invno = data.Table1[0].INV_NO
                this.mode = data.Table1[0].INV_TYPE
                this.AUTHORISEDTOPRINT= data.Table1[0].AUTHORISEDTOPRINT;
                if (data.Table1[0].INV_TYPEOFPCS != "") { this.pieces = data.Table1[0].INV_TYPEOFPCS }
                if (data.Table1[0].INV_TYPEOFPKG != "") { this.pkgs = data.Table1[0].INV_TYPEOFPKG }
                let datacurrency: any = [], dataclient: any = [], datadocument: any = []
                if (data.Table1[0].INV_CLIENT != "") {
                    dataclient = this.table_client.filter((code: any) => code.EXP_CODE.split("|")[0] === data.Table1[0].INV_CLIENT)[0];
                    this.client =  dataclient.EXP_CODE;
                }
                this.fillAddress(this.client)//data.Table1[0].INV_CLIENT);
                this.billaddress = data.Table1[0].INV_ADDID + "|" + data.Table1[0].INV_CLIENT + "|" + data.Table1[0].EXP_INVSTATE
                if (data.Table1[0].INV_CUR != "") {
                    datacurrency = this.table3_curreny.filter((code: any) => code.cur_code.split("|")[0] === data.Table1[0].INV_CUR.split("|")[0]);
                    this.currency = datacurrency[0].cur_code
                }
                if (data.Table1[0].INV_SHIPPER != "") {
                    datadocument = this.table2_document.filter((code: any) => code.EXP_CODE.split("|")[0] === data.Table1[0].INV_SHIPPER);
                    this.document = datadocument[0].EXP_CODE
                }
                if(this.currency!='CR115'){
                    this.disablegeninvcur=true;
                    this.disablegencurrate=true;
                    this.disablegencurrate1=true;
                }
                else{
                    this.disablegeninvcur=false;
                    this.disablegencurrate=false;
                    this.disablegencurrate1=false; 
                }
                this.paybydate = (data.Table1[0].PAYBLEBYDT == "") ? "" : this._dataService.datechnge(data.Table1[0].PAYBLEBYDT)
                this.billaddress.split('|')[0]=data.Table1[0].INV_ADDID;
                this._loaderService.display(false)
                if (this.AUTHORISEDTOPRINT=="1"){
                    this._toasterService.toast("warning", "warning", "You can`t Update this invoice print already taken !");
                }
            }
            else{
                this._toasterService.toast("error", "error", data.Table[0].STATUSTEXT);
            }
            })
     

      

    }

    GetCurrencyName(data) {
        data = this.table3_curreny.filter((code: any) => code.cur_code === data)[0]
        this.currencyname = data.DATATEXTVALUE
        if(this.currency.split("|")[0] =='CR115'){
            this.inv_currate="1";
            this.inv_currate1="1";
          }
          else{
            this.inv_currate="";
            this.inv_currate1="1";
          }
    }
    MasterDateChanged(ev) {
        this.masterdate = ev.formatted
    }
    shipbilldateChanged(ev) {
        this.shipbilldate = ev.formatted
    }

    fillAddress(expcode) {
        this.updated_billaddress = [];
        let datafind: any = []
        var data = expcode.split("|")[0]
        datafind = this.table1_billaddress.filter((code: any) => code.EXP_CODE === data)
     //   console.log(datafind)
        if (datafind.length == "1") {
            this.updated_billaddress = datafind
            this.billaddress = datafind[0].DATAVALUEFIELD
        } else  if (datafind.length > 1)  {
            this.updated_billaddress = datafind
            this.billaddress = datafind[0].DATAVALUEFIELD
        }
        else{ datafind = [] ;
            this.updated_billaddress = datafind;
            this.billaddress  = ""
        }
        let InvMode= this.mode
        let jobmode;
        if (InvMode == '2' || InvMode == '6') {
            jobmode = "AIR";
        }
        else if (InvMode == '1' || InvMode == '5') {
            jobmode= "SEA";
        }
        else {
            jobmode = InvMode;
        }

        const jsonmaster = {
            clientcode: expcode.split("|")[0],
            invdt:this.invdate,// this.datePipe.transform(this.InvoiceDate, 'dd-MM-yyyy'),
            mode:jobmode,
            ISPAYBYDT_AIR: expcode.split("|")[1],
            ISPAYBYDT_SEA: expcode.split("|")[2],
            CREDITPERIOD_SEA: expcode.split("|")[3],
            CREDITPERIOD_AIR: expcode.split("|")[4],
            HAWBDT: this.masterdate == undefined ? "" : this.masterdate
        }
        this._dataService.getData("Accounts/ACC_INVOICE_PAYBYDATE_GET", jsonmaster)
            .subscribe((data: any) => {
                this.paybydate = this._dataService.datechnge(data.Table[0].PAYBYDATE)
            })
    }
    // Narrationarea() {
    //     var textarea = document.querySelector("#autoresizing");
    //     textarea.addEventListener('input', autoResize, false);
    //     function autoResize() {
    //         this.style.height = 'auto';
    //         this.style.height = this.scrollHeight + 'px';
    //     }
    // }
    close() {
        this.showModal_ListJob = false
    }
    close1() {
        this.showModal_Remark = false
    }
    viewjob(Invoiceno) {
      // console.log(Invoiceno)
       var Inv =Invoiceno.target;
       Inv=Inv.innerText;
      // Inv=Inv.replace('</p>','')
      
        var inv = Inv.trim()
        console.log(inv)
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/Account-Invoice-View/' + inv + '/', "Invoice View", toolbar);
    }
    MainReset() {
        this.resetcharges()
        this.resetenclosure()
        this.resetjob()
        this.despachreset()
        this.jobdatalist=[]
        this.chargetable=[]
        this.enclosuretable=[]
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
        this.inv_currate =  ""
        this.inv_currate1 =  ""
        this.ship_billno =  ""
        this.shipbilldate =  ""
      ///  this.invdate =  ""
        this.invno =  ""
        this.mode = ""
        this.client=""
        this.billaddress=""
        this.pieces=""
        this.pkgs="";
        this.updated_billaddress = [];
        this.table2_document;
        const jsonmaster = {
            VGUID: this._loginService.getLogin()[0].GUID,
              }
         this._dataService.getData("Accounts/ACC_INVOICE_NG_RESET", jsonmaster)
             .subscribe((data: any) => {
                 //console.log(data);
                 if(data.Table[0].STATUS == "100"){
                   }
                })
        this._router.navigate(['/accounts/transaction/invoice/general/ ' ]);
    }
    fn_calculatepaybydate(expcode){
        let InvMode= this.mode
        let jobmode;
        if (InvMode == '2' || InvMode == '6') {
            jobmode = "AIR";
        }
        else if (InvMode == '1' || InvMode == '5') {
            jobmode= "SEA";
        }
        else {
            jobmode = InvMode;
        }

        const jsonmaster = {
            clientcode: expcode.split("|")[0],
            invdt:this.invdate,// this.datePipe.transform(this.invdate, 'dd-MM-yyyy'),
            mode:jobmode,
            ISPAYBYDT_AIR: expcode.split("|")[1],
            ISPAYBYDT_SEA: expcode.split("|")[2],
            CREDITPERIOD_SEA: expcode.split("|")[3],
            CREDITPERIOD_AIR: expcode.split("|")[4],
            HAWBDT: this.masterdate == undefined ? "" : this.masterdate
        }
        this._dataService.getData("Accounts/ACC_INVOICE_PAYBYDATE_GET", jsonmaster)
            .subscribe((data: any) => {
                this.paybydate = this._dataService.datechnge(data.Table[0].PAYBYDATE)
            })
    }
    InvoiceDateChanged(ev){
        this.invdate=ev.formatted
        
        if(this.client !='' || this.client != ""   ){
            
            this.fn_calculatepaybydate(this.client)
        }else{
            this.paybydate=new Date();
            this.paybydate=this._dataService.datechnge(this.paybydate);
        }
    //console.log(ev)
    }
    fn_CalPayByDtae(d) {
        //console.log(d)
        var ClientValue = d.split("|")
        this.CLIENTCODE = ClientValue[0];
        this.ISPAYBYDT_AIR = ClientValue[1];
        this.ISPAYBYDT_SEA = ClientValue[2];
        this.CREDITPERIOD_SEA = ClientValue[3];
        this.CREDITPERIOD_AIR = ClientValue[4];

        var InvMode = this.mode
        if (InvMode == '2' || InvMode == '6') {
            this.HDMODE = "AIR";
        }
        else if (InvMode == '1' || InvMode == '5') {
            this.HDMODE = "SEA";
        }
        else {
            this.HDMODE = "";
        }
        this.INVDATE = this.invdate;
        this.HAWBDATE = this.masterdate;

        if (this.HAWBDATE != '' && this.HDMODE == 'AIR') {
            var dtStr = this.HAWBDATE
        } else {
            var dtStr = this.INVDATE;
        }
        var dtCh = "/"
        // var daysInMonth = DaysArray(12)
        var pos1 = dtStr.indexOf(dtCh)
        var pos2 = dtStr.indexOf(dtCh, pos1 + 1)
        var strDay = dtStr.substring(0, pos1)
        var strMonth = dtStr.substring(pos1 + 1, pos2)
        var strYear = dtStr.substring(pos2 + 1)
        var strYr = strYear

        if (strDay.charAt(0) == "0" && strDay.length > 1) strDay = strDay.substring(1)
        if (strMonth.charAt(0) == "0" && strMonth.length > 1) strMonth = strMonth.substring(1)
        for (var i = 1; i <= 3; i++) {
            if (strYr.charAt(0) == "0" && strYr.length > 1) strYr = strYr.substring(1)
        }

        var month = parseInt(strMonth);
        var day = parseInt(strDay);
        var year = parseInt(strYr);

        dtStr = month + "/" + day + "/" + year
        if (this.HDMODE == 'AIR' && this.ISPAYBYDT_AIR == '1') {
            if (this.CREDITPERIOD_AIR != '0') {
                var Mydate = new Date(dtStr);
                Mydate.setDate(Mydate.getDate() + parseInt(this.CREDITPERIOD_AIR));
                //Mydate.setDate = DateAdd(mydate, "D", parseInt(CREDITPERIOD_AIR));

                var Air_date = Mydate.getDate();
                var Air_month = Mydate.getMonth();
                Air_month++;
                var Air_year = Mydate.getFullYear();
                let Air_date1: String = "", Air_month1: String = ""
                if (Air_date <= 9)
                    Air_date1 = '0' + Air_date;
                if (Air_month <= 9)
                    Air_month1 = '0' + Air_month;

                if (Air_month > 12) {
                    Air_month1 = '01';
                    Air_year = year + 1;
                }
                this.paybydate = Air_date1 + "/" + Air_month1 + "/" + Air_year;
               // console.log(this.paybydate)
            }
            else {
                let month1: string = ""
                if (day >= 1 && day <= 15) {
                    month = month + 1;
                    if (month <= 9) {
                        month1 = '0' + month;
                    }
                    if (month > 12) {
                        month1 = '01';
                        year = year + 1;
                    }
                    this.paybydate = '10' + "/" + month1 + "/" + year;
                    //console.log(this.paybydate)
                }
                else if (day >= 16 && day <= 31) {
                    month = month + 1;
                    if (month <= 9) {
                        month1 = '0' + month;
                    }
                    if (month > 12) {
                        month1 = '01';
                        year = year + 1;
                    }
                    this.paybydate = '25' + "/" + month1 + "/" + year;
                    //   console.log( this.paybydate)
                }
            }
            //     document.getElementById("txtPayBydt").value = PAYBYDATE;
            //    document.getElementById("txtPayBydt").readOnly = true;
            //     document.getElementById("imgPayBydt").style.visibility = "hidden";
            //     document.getElementById("txtPayBydt").style.backgroundColor = "whitesmoke";

        }
        else if (this.HDMODE == 'SEA' && this.ISPAYBYDT_SEA == '1') {
            var Mydate = new Date(dtStr);
            Mydate.setDate(Mydate.getDate() + parseInt(this.CREDITPERIOD_SEA));
            let Sea_date1: string = "", Sea_month1: String = ""
            var Sea_date = Mydate.getDate();
            var Sea_month = Mydate.getMonth();
            Sea_month++;
            var Sea_year = Mydate.getFullYear();

            if (Sea_date <= 9)
                Sea_date1 = '0' + Sea_date;
            if (Sea_month <= 9)
                Sea_month1 = '0' + Sea_month;

            if (Sea_month > 12) {
                Sea_month1 = '01';
                Sea_year = Sea_year + 1;
            }

            this.paybydate = Sea_date1 + "/" + Sea_month1 + "/" + Sea_year;
            // console.log( this.paybydate)
            // document.getElementById("txtPayBydt").value = PAYBYDATE;                         
            // document.getElementById("txtPayBydt").readOnly = true;
            // document.getElementById("imgPayBydt").style.visibility = "hidden";
            // document.getElementById("txtPayBydt").style.backgroundColor = "whitesmoke";
        }
        else {
            this.paybydate = this.datePipe.transform(this.InvoiceDate, 'dd/MM/yyyy')
            // console.log( this.paybydate)
            // document.getElementById("txtPayBydt").value = PAYBYDATE;                           
            // document.getElementById("txtPayBydt").readOnly = false;
            // document.getElementById("imgPayBydt").style.visibility = "visible";
            // document.getElementById("txtPayBydt").style.backgroundColor = "white";
        }
    }
    PayByDateDateChanged(ev){
        this.paybydate=ev.formatted

    //console.log(ev)
    }
    TextareaValueChange(ev) {
          this.narration = ev.target.value;
      } 
      getexchangerate(ev)
      {
            if(ev=="CR115"){
                this.excrate="1.00"
                this.disableexrate=true;
            }
            else
            {
                this.excrate=""
                this.disableexrate=false;
            }
            if(this.currency.split("|")[0]==this.currencytype){
               this.excrate=this.inv_currate 
               this.disableexrate=true;
            }
      }
      Calcamount(){
        var data = this.qty * this.rateperqty
        var exchage =1;
        if (this.currencytype=="CR115") {
           exchage = data* 1  }
        else{exchage = data* this.excrate}
         
         var final1 = exchage.toFixed(3)
         this.taxamount_G_Inr=final1;  
      }
      resetCurcharges(){
        this._loaderService.display(true)
        if(confirm('R u sure you want to modify the ex rates?' + "\n" +'Click  ok to delete other than INR currency entries and click cancel nothing to modify')){
           // if(confirm('this will delete all charges for currency ' + this.currency.split("|")[1] + ' and you can modify exrate in General')){
        const jsonmaster = {
            CMPID: this._loginService.getLogin()[0].CMPID,
            VGUID: this._loginService.getLogin()[0].GUID,
            CURRENCY: this.currency.split("|")[0],
      }
      //  console.log(jsonmaster)
        this._dataService.getData("Accounts/ACC_INVOICE_RESET_CHRGCURRENCY", jsonmaster)
            .subscribe((data: any) => {
                //console.log(data);
                if(data.Table1[0].STATUS.split("#")[0] == "100"){
                    this.chargetable=data.Table;
                    this.disablegeninvcur=false;
                    this.disablegencurrate=false;
                    this.disablegencurrate1=false; 
                    this._toasterService.toast("success", "success", data.Table1[0].STATUS.split("#")[1]); 
                    this._loaderService.display(false)
                    }
                     })
                }
           
       // }
        this._loaderService.display(false)
        }
        GetAcctname(event){
            this.codelistActt = this.table9_account.filter((code: any) => code.ACCTCODE.split("|")[0] === event.split("|")[0]);
           //this.accountname=event.target.options[event.target.options.selectedIndex].text;
           this.accountname=this.codelistActt[0].ACCTNAME;
        //    if((this.jobno.substr(7, 1) =="5" || this.jobno.substr(7, 1) =="6")
        //    && ( this.codelistActt[0].ACCTCODE.split("|")[0]=="G101610"))
        //    {
        //        alert('As per GST Notification' + "\n" + ' Import ' + this.accountname + ' can not be taxable !');
        //        this.tax="N";
        //        this.disabletax=true;
        //        return false;
        //    }
        //    else{
        //     this.disabletax=false;
        //    }
           if(this.charge.split("|")[0]=="8900"){
            this.desc1=event.split("|")[1]
        }
       }

}
