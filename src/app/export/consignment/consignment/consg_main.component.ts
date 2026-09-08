import { Component, OnInit ,Input,OnChanges,ViewChild} from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router } from '@angular/router';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoginService } from '../../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { SharedDataSerice } from '../../export-share-data.service';
import { LoaderService } from '../../../shared/service/loader.service';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { ModalDirective } from 'ngx-bootstrap/modal';
@Component({
    templateUrl: 'consg_main.component.html'
    //styleUrls: ['../../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'],
   // encapsulation: ViewEncapsulation.None
})
export class ConsgMainComponent implements OnInit , OnChanges{
    private baseUrl: string = 'Export/GetMainConsignment';
    @ViewChild('CalculateCBM', {static: false}) public calcCBMmodel: ModalDirective;
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
    public myDocPickerOptions: IMyDpOptions = {
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
        selectorWidth: '200px',
        disableSince: this.disableFutureDate()
    };

    disableFutureDate() {
        let d = new Date();
        let disabledDate;
        let year = new Date().getFullYear();
        let month = d.getMonth() + 1;
        let date = d.getDate();
        if (month === 12 && date === 31) { //For next year change
            disabledDate = { year: year + 1, month: 1, day: 1 };
        } else if (month < 12 && (date === 31 || date === 30 || date === 28 || date === 29)) { //For next month change
            disabledDate = { year: year, month: month + 1, day: 1 };
        } else { //For next day change
            disabledDate = { year: year, month: month, day: date + 1 };
        }
        return disabledDate;
    }

    formheader: any;

    sourcingagents: Array<any> = [];
    commoncities: Array<any> = [];
    commoncurrencies: Array<any> = [];
    agentsname: Array<any> = [];
    documentlist: Array<any> = [];
    orderexistnolist: Array<any> = [];
    packagelist: Array<any> = [];
    itclist: Array<any> = [];
    orderlist: Array<any> = [];
    portterminal:Array<any> = [];
    Allportterminallist:any=[];
    loadingportlst :any=[] ;
    editloadingportlst :any=[] ;
    modetype: string = null; // AIR, SEA
    disabledExistOrderNoList: boolean = false;

    //Top
    exwork: any = false;
    customclr: any = false;
    freightfrd: any = false;
    shipper: any = "";
    consignee: any = "";
    noofpackages: number = null;
    typeofpackages: any = "PKG";
    noofpieces: number = null;
    typeofpieces: any = "PIECES";

    //Main
    lblshipper: any = "";
    lblbillto: any = "";
    lblmanufacturer: any = "";
    lblagent: any = "";
    lblsubagent: any = "";
    lblconsignee: any = "";
    lblifcontobank: any = "";
    lblbuyername: any = "";
    lblsourceagent: any = "";
    agentid : string ="";

    //Air Models
    isvisiblevessel: any;
    vesselname: any = "";
    agentname: any = "";
    cartingdt: any = null;
    prealertsentdt: any = null;
    airlinename: any = "";
    plannedfltno: any = "";
    plannedfltdt: any = null;
    actualfltno: any = "";
    actualfltdt: any = null;
    mawbno: any = "";
    mawbdt: any = null;
    mawbdest: any;
    mawbfreight: any = "PP";
    houseawbno: any = "";
    houseawbdt: any = null;
    transtype: any = "Direct";//radio buttonoptions: Direct, Trans
    transportone: any = "-1";
    transporttwo: any = "-1";
    fltno1: any = "";
    fltno2: any = "";
    etdonedt: any = null;
    etdtwodt: any = null;
    etaonedt: any = null;
    etatwodt: any = null;
    loadingport: any = "";
    loadingportterminal: string = "";
    loadingportname: string="";

    cartingplace: any = "";
    podchrg: any = null;
    portit: any = null;
    destcity: any;
    shprgrosswt: any = "";
    shprvolume: any = "";
    grosswt: any = "";
    volume: any = "0.001";
    netwt: any = "";
    frieght: any = "CC";
    chblwt: any = "";
    goodsremark: any = "";


    //Invoice
    docrecdt: any = null;
    grino: any = null;
    gridt: any = null;
    expinvno: any = null;
    exptinvdt: any = null;
    currency: any = '0';
    currencyrate: any = null;
    inrrate: any = null;
    incoterm: any = "FOB";
    invamt: any = null;
    frtchrgs: any = null;
    insuramt: any = null;
    discount: any = "";
    pkgothrs: any = "";
    commission: any = "";
    commissionpaidto: any = "";
    addrsone: any = "";
    addrstwo: any = "";
    natureofpayment: any = null;
    othrdeduction: any = "";
    remark: any = "";
    fobinr: any = 0;
    marketval: any = 0;
    typeshpnbill: any = "FREE";
    valueaddition: any = "";
    valueamt: any = "";
    invshiptype: any = "";  //radio buttonoptions: Provisional ,DEEC, Book
    receiptno: any = "";
    receiptdt: any = null;
    bookno: any = "";
    bookdt: any = null;
    advlicenceno: any = "";
    passbookno: any = "";
    passbookdt: any = null;
    emvone: any = "";
    emvtwo: any = "";
    emvthree: any = "";
    groupcode: any = "";
    sionno: any = "";
    dutyper: any = "";
    dutyamt: any = "";
    cssper: any = "";
    imptlbluse: any = false;
    billentryno: any = "";
    billentrydt: any = null;
    arformnoone: any = "";
    arformdtone: any = null;
    arformcommone: any = "";
    arformdivone: any = "";
    arformrateone: any = "";
    arformnotwo: any = "";
    arformdttwo: any = null;
    arformcommtwo: any = "";
    arformdivtwo: any = "";
    arformratetwo: any = "";
    arformnothree: any = "";
    arformdtthree: any = null;
    arformcommthree: any = "";
    arformdivthree: any = "";
    arformratethree: any = "";
    arformnofour: any = "";
    arformdtfour: any = null;
    arformcommfour: any = "";
    arformdivfour: any = "";
    arformratefour: any = "";

    //Document
    docreceived: string = "";
    doccallfor: string = "";
    docactualreceived: string = "NO";

    //ITC Code
    itccode: any = "";
    itcfobinr: any = "";
    itcsrno: any = "";
    itcunitone: any = "";
    itctypeone: any = "";
    itcgroupcode: any = "";
    itcconditionno: any = "";
    itcunittwo: any = "";
    itctypetwo: any = "";
    itcnotice: any = "";
    itcpercent: any = 0;
    itcperunit: any = 0;
    rbitc: any = ""; //radio buttonoptions: Percent, PerUnit
    itcdescription: any = "";


    //Order No
    ordercontractno: any = "";
    orderpayment: any = "";
    orderexistno: any = null;
    orderno: any = "";
    orderreferenceno: any = "";
    orderitemdesc: any = "";
    orderpiece: any = "";
    ordertypeofpiece: any = "";
    orderpackage: any = "";
    orderwarehouse: any = "";
    orderlsddt: any = null;
    orderdrndt: any = null;
    ordergrwt: any = "";
    ordernetwt: any = "";
    ordervolume: any = "";
    orderchblwt: any = "";
    orderfobval: any = "";
    ordercurrency: any = "";
    ordercneedept: any = "";
    ordercontainerno: any = "";
    ordericshscode: any = "";
    ordericshsdescription: any = "";


    //Package No
    packagefrom: any = "";
    packageto: any = "";
    packagealphabet: any = "";

    //Marks & Numbers
    marksandnumbers: any = "";

    //Quota
    quotacertnoone: any = "";
    quotacertnotwo: any = "";
    quotacertnothree: any = "";
    quotavalidatedt: any = null;
    quotaobtaindt: any = null;
    quotaexpirydt: any = null;

    //Hidden Field
    hdexptno: any = "";
    hdexptid: any = "0";
    hdpkgindexid: any = "0";
    hdpkgnoid: any = "0";
    hdnoofpkg_edit: any = "0";
    hdnoofpkg_total: any = "0";
    hdnoofpcs_edit: any = "0";
    hdnoofpcs_total: any = "0";
    hditccount: any = "0";
    hdmarkscount: any = "0";

    hdnoofgrwt_edit: any = "0";
    hdnoofgrwt_total: any = "0";

    hdnoofchbl_edit: any = "0";
    hdnoofchbl_total: any = "0";

    hdcbm_edit: any = "0";
    hdcbm_total: any = "0";
    //ITC hd
    hditcid: any = "0";
    hditccodeid: any = "0";
    hditcdescid: any = "0";

    //Order hd
    hdorderid: any = "0";
    hdordernoid: any = "0";

    City: string = '';
    tempSession: any = {};

    checkedigroup: string = '';
    @Input() totcbm: string ='';
    Totalcbm:any="0";
    TotalGrwt: any =0;
    disablecalcbmbtn: boolean = false;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) {
        this.City = this._loginService.getLogin()[0].CITYCODE;
    }

    ngOnInit() {
        if (this._sharedconsig.sharedData === undefined) {
            this._toasterService.toast('error', 'info', "Your data is lost due to page refresh.");
            this._router.navigate(['export/Consignment/start']);
            return false;
        }
        this.tempSession = this._sharedconsig.sharedData;
        this.modetype = this.tempSession.modeofship;
        if (this.modetype=="AIR")
        {this.formheader = (this.tempSession.airshipmode == 0) ? "EXPORT CONSINGNMENT - NEW [" + this.tempSession.modeofship + " [NORMAL AIR]]" : "EXPORT CONSINGNMENT - NEW [" + this.tempSession.modeofship + " DIFFERED AIR]";
        this.disablecalcbmbtn=false; }
        else
        {this.formheader = (this.tempSession.airshipmode == 2) ? "EXPORT CONSINGNMENT - NEW [" + this.tempSession.modeofship + " SEA-AIR]":"EXPORT CONSINGNMENT - NEW [" + this.tempSession.modeofship + " [SEA]]";
        this.disablecalcbmbtn=true;}
        this.shipper = this.tempSession.exportername;
        this.consignee = this.tempSession.consigneename;
        this.vesselname = this.tempSession.vesselname;
        this.isvisiblevessel = (this.tempSession.vesselid !="")?this.tempSession.vesselid.split('|')[0] :null, this.tempSession.vesselid.split('|')[0];// this.tempSession.vesselid;

        this.lblshipper = this.tempSession.exportername;
        this.lblbillto = this.tempSession.billtoname;
        this.lblmanufacturer = this.tempSession.manufacturername;
        this.lblagent = this.tempSession.agentname;
        this.lblsubagent = this.tempSession.subagentname;
        this.lblconsignee = this.tempSession.consigneename;
        this.lblifcontobank = this.tempSession.consigneetobankname;
        this.lblbuyername = this.tempSession.buyername;
        this.noofpieces = this.tempSession.pcs;
        this.agentid=this.tempSession.agentid;

        const _jsonData = {
            cmpid: this._loginService.getLogin()[0].CMPID,
            citycode: this._loginService.getLogin()[0].CITYCODE,
            mode: this.modetype,
            concode: this.tempSession.consigneeid,
            vesselcode: (this.tempSession.vesselid !="")?this.tempSession.vesselid.split('|')[0] :'',//this.tempSession.vesselcode,
            vesselport:(this.tempSession.vesselid !="")?this.tempSession.vesselid.split('|')[1] :'',// this.tempSession.vesselport
        };
        this._loaderService.display(true);
        this._dataService.Common('Export/GetMainConsignment', _jsonData)
            .subscribe((data: any) => {
                this.sourcingagents = data.Table;
                this.commoncities = data.Table1;
                this.commoncurrencies = data.Table2;
                this.documentlist = data.Table3;
                //this.orderexistnolist = data.Table4;
                this.agentsname = data.Table5;
                this.agentname = (data.Table5 != undefined) ? ((data.Table5.length > 0) ? data.Table5[0].VALUEFIELD : null) : null;
                this.checkedigroup = (data.Table6.length > 0) ? data.Table6[0].FK_GRPID : '';
                if (this._loginService.getLogin()[0].CMPCODE == "01") {
                    this._loaderService.display(false);
                    this.disabledExistOrderNoList = true;
                } else {
                    this.getOrderList(this.tempSession.consigneeid, this.tempSession.exporterid, this.tempSession.airshipmode, this.tempSession.modeofship);
                }
                this.Allportterminallist=data.Table7;
            });
    }
    ngOnChanges() {

      }

    getOrderList(concode, expcode, shipmode, mode) {
        const _jsonData = {
            concode: concode,
            expcode: expcode,
            exptmode: mode + shipmode
        };
        //this._loaderService.display(true);
        this._dataService.getData('Export/GetMainConsignmentOrderList', _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.orderexistnolist = data.Table;
                if (data.Table[0].STATUS == '100') {
                    this.orderexistnolist = data.Table;
                    this.orderexistnolist.forEach(obj => {
                        obj["VALUEFIELD"] = obj.ORDERNO + '|' + obj.STYLENO + '|' + obj.PCS + '|' + obj.STYLENO + '|' + obj.REF_ASSORTI;
                        obj["TEXTFIELD"] = ' Order No:  ' + obj.ORDERNO + '  Style No:  ' + obj.STYLENO + '  Ref Assorti:  ' + obj.REF_ASSORTI;
                        //obj["TEXTFIELD"] = '<strong style="font-weight: bold;">Order No: </strong>' + obj.ORDERNO + '&nbsp;&nbsp;&nbsp;&nbsp;<strong style="font-weight: bold;"> Style No: </strong>' + obj.STYLENO + '&nbsp;&nbsp;&nbsp;&nbsp;<strong style="font-weight: bold;">Ref Assorti: </strong>' + obj.REF_ASSORTI;
                    });
                } else if (data.Table[0].STATUS == '103') {
                    alert(data.Table[0].STATUSTEXT);
                }
            });
    }

    //Air shipment
    transType(check): void {
        this.transtype = check;
        if (check == "Direct") {
            this.transportone = null;
            this.transporttwo = null;
        } else if (check == "Trans") {

        }
    }

    chgPortDischarge(check): void {
        if (check != null) {
            this.destcity = this.commoncities.filter((list: any) => list.CITY_CODE === check)[0].CITY_CODE;
        } else { this.destcity = null; }
    }

    //Invoice
    changeCurrency(check): void {
        if (check != null) {
            if (check.split('|')[0] == 'CR115') { this.currencyrate = "1.00"; this.inrrate = "1.00"; }
            else { this.currencyrate = check.split('|')[2]; this.inrrate = check.split('|')[3]; }
        } else { this.currencyrate = ""; this.inrrate = ""; }
        this.calculateFOBMarket();
    }

    changeIncoterm(check): void {
        if (check != null) {
            this.incoterm = check;
            this.frtchrgs = (this.incoterm == 'FOB' || this.incoterm == 'C&I') ? '' : this.frtchrgs;
            this.insuramt = (this.incoterm == 'FOB' || this.incoterm == 'C&F') ? '' : this.insuramt;
        } else { this.frtchrgs = null; this.insuramt = null; }
        //frieght
        if (this.incoterm == 'FOB')
        {
            this.frieght="CC"
        }
    }
    changefreight(check):void{
        if (check != null) {
            if (check !="CC" &&  this.incoterm =="FOB")
            {
                var vrf = confirm("You selected Incoterm FOB and freight 'PP',It should be 'CC' ,Are you sure you want to freight as . " + check + "?");
                if (vrf == true) {
                    this.frieght=check;
                }
                else{ this.frieght="CC"; }

            }
            else
            {
                if (check =="CC" &&  this.incoterm !="FOB")
                {
                    var vr = confirm("You selected Incoterm "+this.incoterm+" and freight 'CC',It should be 'PP' ,Are you sure you want to freight as . " + check + "?");
                    if (vr == true) {
                        this.frieght=check;
                    }
                    else{ this.frieght="PP"; }
                }
            }
        }
    }

    changeddInvoiceShipType(check): void {
        this.typeshpnbill = check;
        this.invshiptype = "";
    }

    changerbInvoiceShipType(check): void {
        this.invshiptype = check;
    }

    calculateFOBMarket() {
        let tmp: any, fob: any, mktvalue: any;
        if (this.currency != null) {
            if (this.currency.split('|')[0] == 'CR115') {
                fob = Math.abs(this.invamt) - (((this.insuramt != null) ? this.insuramt : 0) + ((this.frtchrgs != null) ? this.frtchrgs : 0));
            } else {
                tmp = (this.invamt - (((this.insuramt != null) ? this.insuramt : 0) + ((this.frtchrgs != null) ? this.frtchrgs : 0))) * this.inrrate;
                fob = tmp / this.currencyrate;
            }
            mktvalue = (fob * 1.10);
            this.fobinr = Math.round(fob * 100) / 100;
            this.itcfobinr= this.fobinr;
            this.marketval = Math.round(mktvalue * 100) / 100;
        }
    }

    //Document List
    changeDocumentList(check, rbtype): void {
        let updateItem = this.documentlist.find(item => item.DOCCODE === check);
        let rType = null, cType = null, ntype = null;
        if (rbtype == "R") { rType = 'R' + check; cType = null; ntype = null; }
        else if (rbtype == "C") { rType = null; cType = 'C' + check; ntype = null; }
        else if (rbtype == "N") { rType = null; cType = null; ntype = 'N' + check; }
        let index = this.documentlist.indexOf(updateItem);
        this.documentlist[index]["RECD"] = rType;
        this.documentlist[index]["CALL"] = cType;
        this.documentlist[index]["NA"] = ntype;
    }

    getDocumentValue(): void {
        this.docreceived = "";
        this.doccallfor = "";
        for (let doc of this.documentlist) {
            if (doc.RECD != null) {
                this.docreceived += doc.RECD.substring(1) + ',';
            }
            else if (doc.CALL != null) {
                this.doccallfor += doc.CALL.substring(1) + ',';
            }//else if (doc.NA != null) { console.log(doc.NA); }
        }
    }

    //ITC CODE
    changePercentUnit(check): void {
        this.rbitc = check;
        this.itcpercent = 0;
        this.itcperunit = 0;
    }

    changeExistOrderNo(check): void {
        if (check != null) {
            let filterData = this.orderexistnolist.filter((filterby) => filterby.ORDERNO == check.split("|")[0] && filterby.STYLENO == check.split("|")[1] && filterby.REF_ASSORTI == check.split("|")[4])[0];
            this.orderno = filterData.ORDERNO;
            this.orderreferenceno = filterData.STYLENO;
            this.orderpiece = filterData.PCS;
            this.ordergrwt = filterData.GRWT;
            this.ordernetwt = filterData.NETWT
            this.ordervolume = filterData.CBM;
            this.orderpackage = filterData.PKGS;
            this.ordercneedept=filterData.REF_ASSORTI;
        } else {
            this.orderno = "";
            this.orderreferenceno = "";
            this.orderpiece = "";
            this.ordergrwt = "";
            this.ordernetwt = "";
            this.ordervolume = "";
            this.orderpackage ="";
            this.ordercneedept="";
        }
    }

    calculateCHBL(grosswt) {
        if (this.volume != "") { this.volume = Math.abs(this.volume); } else { this.volume = 0; }
        // if (this.grosswt != '') {
        //     this.grosswt = Math.abs(this.grosswt);
        // } else { this.grosswt = ""; }

        let cblwt = Math.abs(this.volume) / 0.006;
        cblwt = Math.round(cblwt);

        if (cblwt > this.grosswt) { this.chblwt = cblwt; } else { this.chblwt = this.grosswt; }
        //this.chblwt = this.grosswt;
        return false;
    }

    addEditITCDtls() {
        if (this.validateITC() == false) { return false; }
        if (this.hditcid == '0') { if (this.itclist.length == 12) { this._toasterService.toast('error', 'Error', "You cant add ITC Details. -[MAX 12]"); return false; } }
        this.crudITC((this.hditcid == "0") ? "A" : "E", this.hditccodeid, this.hdexptno, this.itccode, this.itcfobinr, this.itcsrno, this.itcunitone, this.itctypeone, this.itcnotice, this.itcconditionno, this.itcunittwo, this.itctypetwo, this.itcpercent, (this.rbitc == "Percent") ? "yes" : "no", this.itcperunit, (this.rbitc == "Percent") ? this.itcpercent * this.itcfobinr / 100 : this.itcunittwo * this.itcperunit, this.itcgroupcode, this.itcdescription, this._loginService.getLogin()[0].CMPID, this.hditcid, this._loginService.getLogin()[0].GUID, this.hditcdescid);
    }

    validateITC() {
        if (this.itccode != "") {
            let pos = this.itccode.indexOf(".") + 1;
            let server = this.itccode.substring(pos);
            if (this.itccode.length < 9 || this.itccode.indexOf(".") == -1 || this.itccode.indexOf(" ") != -1 || server.length != 2) {
                this._toasterService.toast('error', 'Error', "Invalid ITC Code");
                return false;
            } else if (this.itcfobinr == "") { this._toasterService.toast('error', 'Error', "FOB INR can not be blank"); return false; }
            else if (this.itcsrno == "") { this._toasterService.toast('error', 'Error', "Drawback Sub sr.no can not be blank"); return false; }
        } else {
            this._toasterService.toast('error', 'Error', "ITC Code can not be empty.");
            return false;
        }
    }

    editITC(indexid, itcid, itccodeid, exptno) {
        let popData = this.itclist.filter((list: any) => list.TBL_INDEXID === indexid);
        //this.hdexptno = exptno;
        this.itccode = popData[0].ITCCODE;
        this.itcfobinr = popData[0].FOBINR;
        this.itcsrno = popData[0].DBKSUBSRNO;
        this.itcunitone = popData[0].UNIT;
        this.itctypeone = popData[0].TPE;
        this.itcnotice = popData[0].APPENDIXNO;
        this.itcconditionno = popData[0].CONDITIONNO;
        this.itcunittwo = popData[0].UNITA;
        this.itctypetwo = popData[0].TPEA;
        this.itcpercent = popData[0].DBKPERCENT;
        this.rbitc = (popData[0].DBKPERCENTA == "yes") ? "Percent" : "PerUnit";
        this.itcperunit = popData[0].RATEPERUNIT;
        this.itcgroupcode = popData[0].EXP_ITCGROUPCODE;
        this.itcdescription = popData[0].DESCRIPTION;
        this.hditcid = popData[0].TBL_INDEXID;
        this.hditccodeid = popData[0].ITCCODE;
        this.hditcdescid = popData[0].ITCDESCID;
    }

    deleteITC(indexid, itcid, itccodeid, exptno) {
        this.crudITC("D", itcid, exptno, itccodeid, "", "", "", "", "", "", "", "", "", "", "", "", "", "", this._loginService.getLogin()[0].CMPID, indexid, this._loginService.getLogin()[0].GUID, "");
    }

    resetITC() {
        this.itccode = "";
        this.itcfobinr = "";
        this.itcsrno = "";
        this.itcunitone = "";
        this.itctypeone = "";
        this.itcgroupcode = "";
        this.itcconditionno = "";
        this.itcunittwo = "";
        this.itctypetwo = "";
        this.itcnotice = "";
        this.itcpercent = 0;
        this.itcperunit = 0;
        this.rbitc = "Percent";
        this.itcdescription = "";
        this.hditcid = "0";
        this.hditccodeid = "0";
        this.hditcdescid = "0";
    }

    crudITC(itctype, hditccodeid, hdexptno, itccode, itcfobinr, itcsrno, itcunitone, itctypeone, itcnotice, itcconditionno, itcunittwo, itctypetwo, itcpercent, itcpercenta, itcperunit, dbkamt, itcgroupcode, itcdescription, userid, hditcid, guid, hditcdescid) {
        const _itcsjsonData = {
            itctype: itctype,
            hditccodeid: hditccodeid,
            hdexptno: hdexptno,
            itccode: itccode,
            itcfobinr: itcfobinr,
            itcsrno: itcsrno,
            itcunitone: itcunitone,
            itctypeone: itctypeone,
            itcnotice: itcnotice,
            itcconditionno: itcconditionno,
            itcunittwo: itcunittwo,
            itctypetwo: itctypetwo,
            itcpercent: itcpercent,
            itcpercenta: itcpercenta,
            itcperunit: itcperunit,
            dbkamt: dbkamt,
            itcgroupcode: itcgroupcode,
            itcdescription: itcdescription,
            userid: userid,
            hditcid: hditcid,
            guid: guid,
            hditcdescid: hditcdescid
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentITC", _itcsjsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table[0].STATUS == "100") {
                    if (data.Table[0].STATUS.length == 0) {
                        this.hditccount = 0;
                    } else { this.hditccount = data.Table[0].TOTALCOUNT; }
                    this.itclist = data.Table;
                    this.resetITC();
                } else if (data.Table[0].STATUS == "103") {
                    this._toasterService.toast('error', 'Error', 'Drawback Sub Sr.No can not be same for same ITC code [' + data.Table[0].ITCCODE + ']');
                }
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                });
    }

    //Order No
    addEditOrderDtls() {
        if (this.validateOrder()) {
            if (this._loginService.getLogin()[0].CMPCODE != "01") {
                if (!this.checkOrderExistInAddedList()) {
                    this.crudOrder((this.hdordernoid == "0") ? "A" : "E", this.hdordernoid,
                        this.hdorderid, this.hdexptno, this.orderno, this.orderpiece,
                        this.ordertypeofpiece, this.orderwarehouse, this.orderpackage,
                        this.ordergrwt, this.ordervolume, this.ordernetwt,
                        this.orderchblwt, this.orderitemdesc, (this.orderlsddt == null) ? "" : this.orderlsddt.formatted,
                        this.orderreferenceno, this.orderfobval, this.ordercurrency, (this.orderdrndt == null) ? "" : this.orderdrndt.formatted,
                        this.ordercneedept, this.ordercontainerno, this.ordericshscode, this.ordericshsdescription);
                }
            } else {
                this.crudOrder((this.hdordernoid == "0") ? "A" : "E", this.hdordernoid,
                    this.hdorderid, this.hdexptno, this.orderno, this.orderpiece,
                    this.ordertypeofpiece, this.orderwarehouse, this.orderpackage,
                    this.ordergrwt, this.ordervolume, this.ordernetwt,
                    this.orderchblwt, this.orderitemdesc, (this.orderlsddt == null) ? "" : this.orderlsddt.formatted,
                    this.orderreferenceno, this.orderfobval, this.ordercurrency, (this.orderdrndt == null) ? "" : this.orderdrndt.formatted,
                    this.ordercneedept, this.ordercontainerno, this.ordericshscode, this.ordericshsdescription);
            }
        }
    }

    checkOrderExistInAddedList(): boolean {
        let filterData = this.orderlist.filter((filterby) => filterby.ORDERNO == this.orderno && filterby.STYLENO == this.orderreferenceno && filterby.REF_ASSORTI == this.ordercneedept);
        if (this.orderlist.length > 0) {
            if (this.hdordernoid == 0) {
                if (filterData.length > 0) {
                    this._toasterService.toast('warning', 'Alert', 'You can not add same order number again.');
                    return true;
                } else { return false; }
            }
        }
        else {
            if (this.checkedigroup != '0') {
                let filterExist = this.orderexistnolist.filter((filterby) => filterby.ORDERNO == this.orderno && filterby.STYLENO == this.orderreferenceno && filterby.REF_ASSORTI == this.ordercneedept);
                if (filterExist.length > 0) {
                    return false;
                } else {
                    this._toasterService.toast('warning', 'Alert', 'Order No does not exist in the list. You can not add manually');
                    return true;
                }
            }
        }
    }
    validateOrder(): boolean {
        if (Math.abs(this.grosswt) == 0) { this._toasterService.toast('error', 'Error', 'Gross  Wt. in Vessel/Port/Goods can not be Empty.'); return false; }
        if (Math.abs(this.volume) == 0) { this._toasterService.toast('error', 'Error', 'Volume in  Vessel/Port/Goods can not be Empty.'); return false; }
        if (this.orderno == "") { this._toasterService.toast('error', 'Error', 'Order No. can not be Empty.'); return false; }
        else if (Math.abs(this.orderpiece) == 0) { this._toasterService.toast('error', 'Error', 'Pieces can not be Empty.'); return false; }
        else if (Math.abs(this.ordergrwt) == 0 || this.ordergrwt == "") { this._toasterService.toast('error', 'Error', "Gross wt should not blank"); return false; }
        else if (Math.abs(this.orderchblwt) == 0 || this.orderchblwt == "") { this._toasterService.toast('error', 'Error', "Chbl wt should not blank"); return false; }
        else if (Math.abs(this.ordervolume) == 0 || this.ordervolume == "") { this._toasterService.toast('error', 'Error', "Volume should not blank"); return false; }
        let TotalPcs = 0;
        TotalPcs = (Math.abs(this.orderpiece)) + (Math.abs(this.hdnoofpcs_total) - Math.abs(this.hdnoofpcs_edit));
        if (this.noofpieces == null) {
            this._toasterService.toast('error', 'Error', "Please enter Total No.of Pcs.");
            return false;
        }
        if (Math.abs(TotalPcs) > Math.abs(this.noofpieces)) {
            this._toasterService.toast('error', 'Error', "Sum of Pcs should be less then or equal to Total No.of Pcs (" + String(this.noofpieces) + ")");
            return false;
        }
        //let TotalGrwt : any = 0;
        this.TotalGrwt = (Math.abs(this.ordergrwt)) + (Math.abs(this.hdnoofgrwt_total) - Math.abs(this.hdnoofgrwt_edit));
        this.TotalGrwt = parseFloat(this.TotalGrwt).toFixed(2);
        if (Math.abs(this.TotalGrwt) > Math.abs(this.grosswt)) {
            this._toasterService.toast('error', 'Error', "Sum of Order GrWt should be less then or equal to Total Gr.Wt (" + String(this.grosswt) + ")");
            return false;
        }
        //let Totalcbm = 0;
        this.Totalcbm = (Math.abs(this.ordervolume)) + (Math.abs(this.hdcbm_total) - Math.abs(this.hdcbm_edit));
        if (Math.abs(this.Totalcbm) > Math.abs(this.volume)) {
            this._toasterService.toast('error', 'Error', "Sum of Order Volume (" + String(this.Totalcbm) + ")should be less then or equal to Total Volume (" + String(this.volume) + ")");
            return false;
        }
        return true;
    }
    validateOrderold(): boolean {
       /* if (this.orderno == "") { this._toasterService.toast('error', 'Error', 'Order No. can not be Empty.'); return false; }
        else if (Math.abs(this.orderpiece) == 0) { this._toasterService.toast('error', 'Error', 'Pieces can not be Empty.'); return false; }
        let TotalPcs = 0;
        TotalPcs = (Math.abs(this.orderpiece)) + (Math.abs(this.hdnoofpcs_total) - Math.abs(this.hdnoofpcs_edit));
        if (this.noofpieces == null) {
            this._toasterService.toast('error', 'Error', "Please enter Total No.of Pcs.");
            return false;
        }
        if (Math.abs(TotalPcs) > Math.abs(this.noofpieces)) {
            this._toasterService.toast('error', 'Error', "Sum of Pcs should be less then or equal to Total No.of Pcs (" + String(this.noofpieces) + ")");
            return false;
        }
        return true;*/
        if ( Math.abs(this.grosswt)  ==  0) { this._toasterService.toast('error', 'Error', 'Gross  Wt. in Vessel/Port/Goods can not be Empty.'); return false; }
        if ( Math.abs(this.volume)  ==  0) { this._toasterService.toast('error', 'Error', 'Volume in  Vessel/Port/Goods can not be Empty.'); return false; }
        if (this.orderno == "") { this._toasterService.toast('error', 'Error', 'Order No. can not be Empty.'); return false; }
        if(this.orderreferenceno=="" || this.orderreferenceno==undefined ){ this._toasterService.toast('error', 'Error', 'Reference. No.can not be Empty. if ref.no not available please put NA '); return false; }
        if(this.orderitemdesc=="" || this.orderitemdesc==undefined) {  this._toasterService.toast('error', 'error', "Please enter Item Description !");            return false; }
        else if (Math.abs(this.orderpiece) == 0) { this._toasterService.toast('error', 'error', 'Pieces can not be Empty.'); return false; }
        else if (Math.abs(this.ordergrwt) == 0 || this.ordergrwt=="") { this._toasterService.toast('error', 'Error', "Gross wt should not blank");  return false;}
        else if (Math.abs(this.orderchblwt) == 0  || this.orderchblwt=="") { this._toasterService.toast('error', 'Error', "Chbl wt should not blank");  return false;}
        else if (Math.abs(this.ordervolume) == 0  || this.ordervolume=="") { this._toasterService.toast('error', 'Error', "Volume should not blank");  return false;}
        let TotalPcs = 0;
        TotalPcs = (Math.abs(this.orderpiece)) + (Math.abs(this.hdnoofpcs_total) - Math.abs(this.hdnoofpcs_edit));
        if (this.noofpieces == null) {
            this._toasterService.toast('error', 'Error', "Please enter Total No.of Pcs.");
            return false;
        }
        if (Math.abs(TotalPcs) > Math.abs(this.noofpieces)) {
            this._toasterService.toast('error', 'Error', "Sum of Pcs should be less then or equal to Total No.of Pcs (" + String(this.noofpieces) + ")");
            return false;
        }
        //let TotalGrwt: any =0;
        this.TotalGrwt = (Math.abs(this.ordergrwt)) + (Math.abs(this.hdnoofgrwt_total) - Math.abs(this.hdnoofgrwt_edit));
        this.TotalGrwt=parseFloat(this.TotalGrwt).toFixed(2);
        if (Math.abs(this.TotalGrwt) > Math.abs(this.grosswt))
        {
            this._toasterService.toast('error', 'Error', "Sum of Order GrWt should be less then or equal to Total Gr.Wt (" + String(this.grosswt) + ")");
            return false;
        }
        //let Totalcbm any=0;
        this.Totalcbm = (Math.abs(this.ordervolume)) + (Math.abs(this.hdcbm_total) - Math.abs(this.hdcbm_edit));
        if(Math.abs(this.Totalcbm)> Math.abs(this.volume))
        {
            this._toasterService.toast('error', 'Error', "Sum of Order Volume (" + String(this.Totalcbm) + ")should be less then or equal to Total Volume (" + String(this.volume) + ")");
            return false;
        }
        return true;
    }

    editOrder(indexid, orderid, exptno, ordernoid) {
        let popData = this.orderlist.filter((list: any) => list.TBL_INDEXID === indexid);
        this.orderno = popData[0].ORDERNO;
        this.orderreferenceno = popData[0].STYLENO;
        this.orderitemdesc = popData[0].ITEMDESC;
        this.orderpiece = popData[0].PIECES;
        this.ordertypeofpiece = popData[0].TYPEOFPCS;
        this.orderpackage = popData[0].PKGS;
        this.orderwarehouse = popData[0].WAREHOUSE;
        this.orderlsddt = (popData[0].LSD != "") ? this._dataService.stringdttoArry(popData[0].LSD) : null;
        this.orderdrndt = (popData[0].DRNDATE != "") ? this._dataService.stringdttoArry(popData[0].DRNDATE) : null;
        this.ordergrwt = popData[0].GRWT;
        this.ordernetwt = popData[0].NETWT;
        this.ordervolume = popData[0].VOLUME;
        this.orderchblwt = popData[0].CHBLWT;
        this.orderfobval = popData[0].FOBVALUE;
        this.ordercurrency = popData[0].CURENCY;
        this.hdorderid = orderid;
        this.hdordernoid = indexid;
        this.hdnoofpcs_edit = popData[0].PIECES;
        this.ordercontainerno = popData[0].ContainerNo;
        this.ordericshscode = popData[0].ICSHSCode;
        this.ordericshsdescription = popData[0].ICSHSDescription;
        this.hdnoofgrwt_edit=popData[0].GRWT;
        this.hdnoofchbl_edit=popData[0].CHBLWT;
        this.hdcbm_edit=popData[0].VOLUME;
    }

    deleteOrder(indexid, orderid, exptno, ordernoid) {
        this.crudOrder("D", indexid, orderid, exptno,ordernoid , "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "");
    }

    crudOrder(ordertype, indexid, orderid, exptno, ordernoid, orderpiece, ordertypeofpiece, orderwarehouse, orderpackage, ordergrwt, ordervolume, ordernetwt, orderchblwt, orderitemdesc, orderlsddt, orderreferenceno, orderfobval, ordercurrency, orderdrndt, ordercneedept, ordercontainerno, ordericshscode, ordericshsdescription) {
        const _orderjsonData = {
            ordertype: ordertype,
            ordernoid: indexid,
            orderid: orderid,
            exptno: exptno,
            orderno: ordernoid,
            orderpiece: orderpiece,
            ordertypeofpiece: ordertypeofpiece,
            orderwarehouse: orderwarehouse,
            orderpackage: orderpackage,
            ordergrwt: ordergrwt,
            ordervolume: ordervolume,
            ordernetwt: ordernetwt,
            orderchblwt: orderchblwt,
            orderitemdesc: orderitemdesc,
            orderlsddt: orderlsddt,
            orderreferenceno: orderreferenceno,
            orderfobval: orderfobval,
            ordercurrency: ordercurrency,
            orderdrndt: orderdrndt,
            userid: this._loginService.getLogin()[0].CMPID,
            guid: this._loginService.getLogin()[0].GUID,
            ordercneedept: ordercneedept,
            ordercontainerno: ordercontainerno,
            ordericshscode: ordericshscode,
            ordericshsdescription: ordericshsdescription,
            concode: this.tempSession.consigneeid
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentOrder", _orderjsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.orderlist = data.Table;
                this.hdnoofpcs_edit = "0";
                this.hdnoofpcs_total = data.Table[0].TOTAL;
                this.hdnoofpkg_total =data.Table[0].TOTAL_PKG;
                this.hdnoofgrwt_total=data.Table[0].TOTAL_GRWT;
                this.hdnoofchbl_total =data.Table[0].TOTAL_CHBL;

                this.resetOrder();
                this.orderexistno = null;
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                });
    }

    resetOrder() {
        this._loaderService.display(true);
        this.orderno = "";
        this.orderreferenceno = "";
        this.orderitemdesc = "";
        this.orderpiece = "";
        this.ordertypeofpiece = "";
        this.orderpackage = "";
        this.orderwarehouse = "";
        this.orderlsddt = null;
        this.orderdrndt = null;
        this.ordergrwt = "";
        this.ordernetwt = "";
        this.ordervolume = "";
        this.orderchblwt = "";
        this.orderfobval = "";
        this.ordercurrency = "";
        this.hdorderid = "0";
        this.hdordernoid = "0";
        this.ordercneedept = "";
        this.ordercontainerno = "";
        this.ordericshscode = "";
        this.ordericshsdescription = "";
        this._loaderService.display(false);
    }


    //Package No
    addEditPkgDtls() {
        if (this.validatePkgs() == false) { return false; };
        this.crudPackage(this.hdpkgindexid, this.hdpkgnoid, this.hdexptno, (this.hdpkgindexid == "0") ? "A" : "E", this.packagefrom, this.packageto, this.packagealphabet);
        return false;
    }

    editPackage(indexid, pkgnoid, exptno) {
        let popData = this.packagelist.filter((list: any) => list.TBL_INDEXID === indexid);
        this.hdpkgindexid = popData[0].TBL_INDEXID;
        this.hdpkgnoid = popData[0].PKGNOID;
        this.hdexptno = popData[0].EXPTNO;
        this.packagefrom = popData[0].FROM;
        this.packageto = popData[0].TO;
        this.packagealphabet = popData[0].ALPHABET;
    }

    deletePackage(indexid, pkgnoid, exptno) {
        this.crudPackage(indexid, pkgnoid, exptno, "D", "", "", "");
    }

    crudPackage(indexid, pkgnoid, exptno, pkgtype, pkgfrom, pkgto, pkgalphabet) {
        const _pkgsjsonData = {
            indexid: indexid,
            pkgnoid: pkgnoid,
            exptno: exptno,
            pkgtype: pkgtype,
            pkgfrom: pkgfrom,
            pkgto: pkgto,
            pkgalphabet: pkgalphabet,
            userid: this._loginService.getLogin()[0].CMPID,
            guid: this._loginService.getLogin()[0].GUID
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentPackage", _pkgsjsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.packagelist = data.Table;
                this.hdnoofpkg_edit = "0";
                this.hdnoofpkg_total = data.Table[0].TOTAL;
                this.resetPackage();
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                });
    }

    resetPackage() {
        this.hdpkgindexid = "0";
        this.hdpkgnoid = "0";
        this.packagefrom = "";
        this.packageto = "";
        this.packagealphabet = "";
        this.hdnoofpkg_edit = "0";
    }

    validatePkgs() {
        if (Math.abs(this.packagefrom) == 0) {
            this._toasterService.toast('error', 'Error', "From No. can not be Empty & should be greater then 0.");
            return false;
        }
        if (Math.abs(this.packageto) == 0) {
            this._toasterService.toast('error', 'Error', "To No. can not be Empty & should be greater then 0.");
            return false;
        }
        if (Math.abs(this.packagefrom) > Math.abs(this.packageto)) {
            this._toasterService.toast('error', 'Error', "From No. should be less then To No.");
            return false;
        }
        let TotalPkgs = 0;
        if (this.hdnoofpkg_edit!=0){
            TotalPkgs = ((Math.abs(this.packageto) - Math.abs(this.packagefrom)) + 1) + (Math.abs(this.hdnoofpkg_total) - Math.abs(this.hdnoofpkg_edit));
        }
        else
        { TotalPkgs = ((Math.abs(this.packageto) - Math.abs(this.packagefrom)) + 1) + (Math.abs(this.hdnoofpkg_total) - Math.abs(this.packageto));
        }

        if (this.noofpackages == null) {
            this._toasterService.toast('error', 'Error', "Please enter Total No.of Pkgs.");
            return false;
        }
        if (Math.abs(TotalPkgs) > Math.abs(this.noofpackages)) {
            this._toasterService.toast('error', 'Error', "Sum of No.of Pkgs(" + String(TotalPkgs) + ") should be less then or equal to Total No.of Pkgs (" + String(this.noofpackages) + ")");
            return false;
        }
    }

    submit() {
        //Top validation
        if(this.chblwt==null){
            this._toasterService.toast('error', 'Error', "Please enter chargeble weight.");
            return false;
        }
        if(this.volume==null){
            this._toasterService.toast('error', 'Error', "Please enter volume.");
            return false;
        }
        if (this.noofpackages == null) { this._toasterService.toast('error', 'Error', "No. of Packages can not be blank"); }
        if (this.noofpackages == null) { this._toasterService.toast('error', 'Error', "No. of Pieces can not be blank"); }
        if ( this.noofpackages <this.hdnoofpkg_total) {
            //fnPackage();
            this._toasterService.toast('error', 'Error', "Sum of No.of Pkgs (" + String(this.hdnoofpkg_total) + ") should be less then or equal to Total No.of Pkgs (" + String(this.noofpackages) + ")");
            return false;
        }
        if (this.noofpieces< this.hdnoofpcs_total) {
            //fnOrderNo();
            this._toasterService.toast('error', 'Error', "Sum of No.of Pcs (" + String(this.hdnoofpcs_total) + ") should be less then or equal to Total No.of Pcs (" + String(this.noofpieces) + ")");
            return false;
        }

        if  (this.noofpackages != this.hdnoofpkg_total) {
            //fnOrderNo();
            this._toasterService.toast('error', 'Error', "Sum of  Pkgs (" + String(this.hdnoofpkg_total) + ") should not match with Total No.of Pkgs (" + String(this.noofpackages) + ")");
            return false;
        }
        if (this.modetype =="AIR"){
        if ( this.grosswt  !=  this.hdnoofgrwt_total) {
            //fnOrderNo();
            this._toasterService.toast('error', 'Error', "Sum of Grwt (" + String(this.hdnoofgrwt_total) + ") should not match with Total ex-job grwt (" + String(this.grosswt) + ")");
            return false;
        }

        if (this.chblwt != this.hdnoofchbl_total) {
            //fnOrderNo();
            this._toasterService.toast('error', 'Error', "Sum of ChblWt (" + String(this.hdnoofchbl_total) + ") should not match with Total ex-job chblwt (" + String(this.chblwt) + ")");
            return false;
        }
        }
        else
        {
           let agents = (this.agentname != null) ? this.agentname : "";
           if (agents==""){
            this._toasterService.toast('error', 'Error', " PLease select Vessel Agent ! ");
            return false;
           }

        }
        this.getDocumentValue();
        if (this.validateInvoice() == false) { return false; }


        //Nexr
        if (this.exwork == false && this.customclr == false && this.freightfrd == false) { //EX, CUSTOM, FRTFRD
            this._toasterService.toast('error', 'Error', "Please select atleast one Clearance Option !"); return false;
        }

        if (this.docactualreceived == 'YES') {
            let response = confirm("The Actual Document Received Date(In #Documents Tab) should be set current date.\n You can not Change or Modify Actual Document Received Date later");
            if (response== false) {
                return false;
            }
        }
        if(this.loadingport=='' || this.loadingport==undefined){
            this._toasterService.toast('warning', 'warning', "Please enter Port Of Loading !");
            return false;
        }

        //send value
        let Exwork = (this.exwork == true) ? "EX" : "";
        let CustomClr = (this.customclr == true) ? "CUSTOM" : "";
        let Freightfrd = (this.freightfrd == true) ? "FRTFRD" : "";

        let expt_docrecd = (this.docrecdt != null) ? this.docrecdt.formatted : "";
        let expt_grino = (this.grino != null) ? this.grino : "";
        let expt_gridate = (this.gridt != null) ? this.gridt.formatted : "";
        let expt_invno = (this.expinvno != null) ? this.expinvno : "";
        let expt_invdate = (this.exptinvdt != null) ? this.exptinvdt.formatted : "";

        let expt_cur = (this.currency != null) ? this.currency.split("|")[0] : "";
        let expt_curname = (this.currency != null) ? this.currency.split("|")[1] : "";
        let expt_currate = (this.currency != null) ? this.currencyrate : "";
        let expt_curinrrate = (this.currency != null) ? this.inrrate : "";

        let expt_invtype = (this.incoterm != null) ? this.incoterm : "";

        let expt_invamt = (this.invamt != null) ? this.invamt : "";
        let expt_freight = (this.frtchrgs != null) ? this.frtchrgs : "";
        let expt_insamt = (this.insuramt != null) ? this.insuramt : "";
        let invdiscount = this.discount;
        let expt_packing = this.pkgothrs;
        let invcommission = this.commission;
        let commname = this.commissionpaidto;
        let commaddr1 = this.addrsone;
        let commaddr2 = this.addrstwo;
        let natureofpayment = (this.natureofpayment != null) ? this.natureofpayment : "";
        let invdeductamt = this.othrdeduction;
        let invdeductdesc = this.remark;
        let expt_fob = (this.fobinr != null) ? this.fobinr : "";
        let expt_mktvalue = this.marketval;

        let expt_shipbilltype = (this.typeshpnbill != null) ? this.typeshpnbill : "";
        let sbvalue = this.valueaddition;
        let sbamount = this.valueamt;

        let sbbooktype = "";
        if (this.invshiptype == "Provisional") { sbbooktype = "P"; }
        if (this.invshiptype == "DEEC") { sbbooktype = "B"; }
        if (this.invshiptype == "Book") { sbbooktype = "E"; }


        let sbprorecptno = this.receiptno;
        let sbprorecptdt = (this.receiptdt != null) ? this.receiptdt.formatted : "";
        let sbdeecbookno = this.bookno;
        let sbdeecbookdt = (this.bookdt != null) ? this.bookdt.formatted : "";
        let sbdeeclicno = this.advlicenceno;
        let sbexpbookno = this.passbookno;
        let sbexpbookdt = (this.passbookdt != null) ? this.passbookdt.formatted : "";
        let sbexempt1 = this.emvone;
        let sbexempt2 = this.emvtwo;
        let sbexempt3 = this.emvthree;
        let sbgroupcode = this.groupcode;
        let sbsionno = this.sionno;
        let sbduty = this.dutyper;
        let sbdutyamt = this.dutyamt;
        let sbcess = this.cssper;

        let implable = (this.imptlbluse == true) ? "yes" : "";

        let billentryno = this.billentryno;
        let billentrydt = (this.billentrydt != null) ? this.billentrydt.formatted : "";
        let arformno = this.arformnoone;
        let arformdt = (this.arformdtone != null) ? this.arformdtone.formatted : "";
        let commissionrate = this.arformcommone;
        let division = this.arformdivone;
        let range = this.arformrateone;
        let arformno1 = this.arformnotwo;
        let arformdt1 = (this.arformdttwo != null) ? this.arformdttwo.formatted : "";
        let commissionrate1 = this.arformcommtwo;
        let division1 = this.arformdivtwo;
        let range1 = this.arformratetwo;
        let arformno2 = this.arformnothree;
        let arformdt2 = (this.arformdtthree != null) ? this.arformdtthree.formatted : "";
        let commissionrate2 = this.arformcommthree;
        let division2 = this.arformdivthree;
        let range2 = this.arformratethree;
        let arformno3 = this.arformnofour;
        let arformdt3 = (this.arformdtfour != null) ? this.arformdtfour.formatted : "";
        let commissionrate3 = this.arformcommfour;
        let division3 = this.arformdivfour;
        let range3 = this.arformratefour;


        let expt_pod = (this.podchrg != null) ? this.podchrg : "";
        let expt_it = (this.portit != null) ? this.portit : "";


        let cartdate = "", prealertdate = "", airlinename = "",
            planflightno = "", planflightdate = "", actflightno = "",
            actflightdate = "", mawbno = "", mawbdate = "", mawbdest = "",
            mawbfrt = "", hawbno = "", hawbdate = "", direct = "",
            tranport1 = "", flightno1 = "", etd1 = "", eta1 = "",
            tranport2 = "", flightno2 = "", etd2 = "", eta2 = "";

        let agent = "";

        if (this.modetype == "AIR") {

            cartdate = (this.cartingdt != null) ? this.cartingdt.formatted : "";
            prealertdate = (this.prealertsentdt != null) ? this.prealertsentdt.formatted : "";
            airlinename = this.airlinename;
            planflightno = this.plannedfltno;
            planflightdate = (this.plannedfltdt != null) ? this.plannedfltdt.formatted : "";
            actflightno = this.actualfltno;
            actflightdate = (this.actualfltdt != null) ? this.actualfltdt.formatted : "";
            mawbno = this.mawbno;
            mawbdate = (this.mawbdt != null) ? this.mawbdt.formatted : "";

            mawbdest = (this.mawbdest != null) ? this.mawbdest : "";


            mawbfrt = this.mawbfreight;
            hawbno = this.houseawbno;
            hawbdate = (this.houseawbdt != null) ? this.houseawbdt.formatted : "";

            if (this.transtype == "Direct") {
                direct = 'yes';
                tranport1 = "";
                tranport2 = "";
                etd1 = "";
                etd2 = "";
                eta2 = "";
            } else {
                direct = 'no';
                tranport1 = (this.transportone != null) ? this.transportone : "";
                tranport2 = (this.transporttwo != null) ? this.transporttwo : "";

                etd1 = (this.etdonedt != null) ? this.etdonedt.formatted : "";
                etd2 = (this.etdtwodt != null) ? this.etdtwodt.formatted : "";
                eta2 = (this.etatwodt != null) ? this.etatwodt.formatted : "";
            }

            flightno1 = this.fltno1;
            eta1 = (this.etaonedt != null) ? this.etaonedt.formatted : "";
            flightno2 = this.fltno2;

            //vessel
            agent = "";
        }
        else {
            agent = (this.agentname != null) ? this.agentname : "";
        }


        let expt_ldgport =this.loadingport;// commented this.loadingportname;due to chnage from text to dropdown
        let expt_cartplace = this.cartingplace;
        let expt_destcity = (this.podchrg != null) ? this.podchrg : "";
        let expt_destcountry = (this.destcity != null) ? this.destcity : "";
        let expt_grwtshipper = this.shprgrosswt;
        let expt_volumeshipper = this.shprvolume;
        let expt_grwt = this.grosswt;
        let expt_netwt = this.netwt;
        let expt_volume = this.volume;
        let expt_frt = this.frieght;
        let expt_chblwt = this.chblwt;
        let expt_remarks = this.goodsremark;


        let expt_noofpkgs = this.noofpackages;
        let expt_typeofpkgs = (this.typeofpackages != null) ? this.typeofpackages : "";
        let expt_noofpcs = this.noofpieces;
        let expt_typeofpcs = (this.typeofpieces != null) ? this.typeofpieces : "";


        let exptcontractno = this.ordercontractno;
        let periodofpayment = this.orderpayment;


        let quotacertno = this.quotacertnoone;
        let quotacertno1 = this.quotacertnotwo;
        let quotacertno2 = this.quotacertnothree;
        let yr = expt_docrecd.substr(6, 4);//(new Date()).getFullYear();
        let expt_quotavaliddt = (this.quotavalidatedt != null) ? this.quotavalidatedt.formatted : "";
        let expt_quotaobtaindt = (this.quotaobtaindt != null) ? this.quotaobtaindt.formatted : "";
        let expt_quotaexpirydt = (this.quotaexpirydt != null) ? this.quotaexpirydt.formatted : "";


        let marksnumbers = this.marksandnumbers;

        let recddocstr = this.docreceived;
        let calldocstr = this.doccallfor;
        let diffAir;
        if( this.modetype=="AIR")
        { diffAir=this.tempSession.airshipmode;  }
        else
        { diffAir=this.tempSession.airshipmode;}

        let _jsonFinal = {
            Exptno: this.hdexptno,
            Expt_Guid: this._loginService.getLogin()[0].GUID,
            Expt_Mode: this.modetype,
            Expt_Exporter: this.tempSession.exporterid,
            Expt_Billto: this.tempSession.billtoid,
            Expt_Consignee: this.tempSession.consigneeid,
            Expt_Docrecd: expt_docrecd,
            Expt_Ldgport: expt_ldgport,
            Expt_Grino: expt_grino,
            Expt_Gridate: expt_gridate,
            Expt_Invno: expt_invno,
            Expt_Invdate: expt_invdate,
            Expt_Invtype: expt_invtype,
            Expt_Cur: expt_cur,
            Expt_Curname: expt_curname,
            Expt_Currate: expt_currate,
            Expt_Curinrrate: expt_curinrrate,
            Expt_Invamt: expt_invamt,
            Expt_Insamt: expt_insamt,
            Expt_Freight: expt_freight,
            Expt_Fob: expt_fob,
            Expt_Shipbilltype: expt_shipbilltype,
            Expt_Noofpkgs: expt_noofpkgs,
            Expt_Typeofpkgs: expt_typeofpkgs,
            Expt_Noofpcs: expt_noofpcs,
            Expt_Typeofpcs: expt_typeofpcs,
            Expt_Grwt: expt_grwt,
            Expt_Netwt: expt_netwt,
            Expt_Volume: expt_volume,
            Expt_Mktvalue: expt_mktvalue,
            Expt_Vessel: this.tempSession.vesselcode,
            Expt_Vslagent: agent,
            Expt_Pod: expt_pod,
            Expt_It: expt_it,
            Expt_Destcity: expt_destcity,
            Expt_Destcountry: expt_destcountry,
            Expt_Frt: expt_frt,
            Expt_Remarks: expt_remarks,
            Citycode: this._loginService.getLogin()[0].CITYCODE,
            Cmpcode: this._loginService.getLogin()[0].CMPCODE,
            Invcommission: invcommission,
            Invdiscount: invdiscount,
            Invdeductamt: invdeductamt,
            Invdeductdesc: invdeductdesc,
            Implable: implable,
            Billentryno: billentryno,
            Billentrydt: billentrydt,
            Sbvalue: sbvalue,
            Sbamount: sbamount,
            Sbbooktype: sbbooktype,
            Arformno: arformno,
            Arformdt: arformdt,
            Sbprorecptno: sbprorecptno,
            Sbprorecptdt: sbprorecptdt,
            Sbexempt1: sbexempt1,
            Sbexempt2: sbexempt2,
            Sbexempt3: sbexempt3,
            Sbdeecbookno: sbdeecbookno,
            Sbdeecbookdt: sbdeecbookdt,
            Sbdeeclicno: sbdeeclicno,
            Sbgroupcode: sbgroupcode,
            Sbsionno: sbsionno,
            Sbexpbookno: sbexpbookno,
            Sbexpbookdt: sbexpbookdt,
            Sbduty: sbduty,
            Sbdutyamt: sbdutyamt,
            Sbcess: sbcess,
            Notifybuyer: this.tempSession.notifybuyer,
            Expt_Buyer: this.tempSession.buyerid,
            Natureofpayment: natureofpayment,
            Expt_Packing: expt_packing,
            Commname: commname,
            Commaddr1: commaddr1,
            Commaddr2: commaddr2,
            Commissionrate: commissionrate,
            Division: division,
            Range: range,
            Arformno1: arformno1,
            Arformdt1: arformdt1,
            Commissionrate1: commissionrate1,
            Division1: division1,
            Range1: range1,
            Arformno2: arformdt2,
            Arformdt2: arformdt2,
            Commissionrate2: commissionrate2,
            Division2: division2,
            Range2: range2,
            Arformno3: arformdt3,
            Arformdt3: arformdt3,
            Commissionrate3: commissionrate3,
            Division3: division3,
            Range3: range3,
            Exptcontractno: exptcontractno,
            Periodofpayment: periodofpayment,
            Expt_Quotavaliddt: expt_quotavaliddt,
            Expt_Quotaobtaindt: expt_quotaobtaindt,
            Expt_Quotaexpirydt: expt_quotaexpirydt,
            Manufacturer: this.tempSession.manufacturerid,
            Quotacertno: quotacertno,
            Quotacertno1: quotacertno1,
            Quotacertno2: quotacertno2,
            Yr: yr,
            Expt_Grwtshipper: expt_grwtshipper,
            Expt_Volumeshipper: expt_volumeshipper,
            Expt_Cartplace: expt_cartplace,
            Expt_Bank: this.tempSession.consigneetobankid,
            Expt_Srcagt: (this.lblsourceagent != null) ? this.lblsourceagent : "",
            Expt_Chblwt: expt_chblwt,
            Vsl_Port: (this.tempSession.vesselport != null) ? this.tempSession.vesselport : "",
            Username: this._loginService.getLogin()[0].CMPID,
            Id: this.hdexptid,
            Citycode1: this._loginService.getLogin()[0].CITYCODE1,
            Recddocstr: recddocstr,
            Calldocstr: calldocstr,
            Cartdate: cartdate,
            Prealertdate: prealertdate,
            Airlinename: airlinename,
            Planflightno: planflightno,
            Planflightdate: planflightdate,
            Actflightno: actflightno,
            Actflightdate: actflightdate,
            Mawbdest: mawbdest,
            Mawbfrt: mawbfrt,
            Tranport1: tranport1,
            Flightno1: flightno1,
            Etd1: etd1,
            Eta1: eta1,
            Tranport2: tranport2,
            Flightno2: flightno2,
            Etd2: etd2,
            Eta2: eta2,
            Mawbno: mawbno,
            Mawbdate: mawbdate,
            Hawbno: hawbno,
            Hawbdate: hawbdate,
            Marks1: marksnumbers,
            Marks2: "",
            Marks3: "",
            Marks4: "",
            Marks5: "",
            Marks6: "",
            Marks7: "",
            Marks8: "",
            Marks9: "",
            Marks10: "",
            Marks11: "",
            Marks12: "",
            Marks13: "",
            Marks14: "",
            Marks15: "",
            Makerip: this._loginService.getLogin()[0].MAKERIP, //Waiting for link to ip
            Isdiffair:diffAir, // this.tempSession.airshipmode,
            Exwork: Exwork,
            Customclr: CustomClr,
            Freightfrd: Freightfrd,
            ActualDocReceived: this.docactualreceived,
            SubAgentId: this.tempSession.subagentid,
            agentid: this.agentid,
            MODEOF_SHIPMENT:this.tempSession.modeofshipment,
            FK_TERMINALID: (this.loadingportterminal.split("|")[0] != null) ? this.loadingportterminal.split("|")[0] : "",

        }
        this._loaderService.display(true);
        this._dataService.Common("Export/Exp_Mst_Export_IU", _jsonFinal)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table[0].STATUS == "100") {
                    alert("Export Consignment " + data.Table[0]["STATUSTEXT"] + " Gnererated Successfully!");
                    this._router.navigate(['export/Consignment/search']);
                }
                else
                {
                    this._toasterService.toast('error', 'Error',   data.Table[0].STATUSTEXT);
                }
            } );
    }

    onTypeChange(type) {
        if (type == 'E') {
            this.customclr = false;
            this.freightfrd = false;
        } else if (type == 'C' || type == 'F') {
            this.exwork = false;
        }
    }

    validatePort(): boolean {
        if (this.shprgrosswt == null) { this._toasterService.toast('error', 'Error', "Shipper Gross Weight can not be blank"); return false; }
        if (this.grosswt == null) { this._toasterService.toast('error', 'Error', "Gross Weight can not be blank"); return false; }
        if (this.netwt == null) { this._toasterService.toast('error', 'Error', "Net Weight can not be blank"); return false; }
        if (eval(this.netwt) > eval(this.grosswt)) { this._toasterService.toast('error', 'Error', "Net Weight should be less than or equal to Gross Weight"); return false; }
        if (this.volume == null) { this._toasterService.toast('error', 'Error', "Volume can not be blank"); return false; }
        if (this.modetype == "AIR") {
            if (eval(this.modetype) == 0) { this._toasterService.toast('error', 'Error', "Gross Weight can not be blank"); return false; }
            else if (eval(this.volume) > (eval(this.grosswt) * 0.25)) { this._toasterService.toast('error', 'Error', "Volume should not be greter than 25% of Gross wt."); return false; }
        }
        return true;
    }


    validateInvoice(): boolean {
        if (this.docrecdt == null) { this._toasterService.toast('error', 'Error', "Document Received Date can not be blank"); return false; }
        if (this.expinvno == null) { this._toasterService.toast('error', 'Error', "Invoice No. can not be blank"); return false; }
        if (this.exptinvdt == null) { this._toasterService.toast('error', 'Error', "Invoice Date can not be blank"); return false; }
        if (this._dataService.DateFromAndToComparision_exp(this.exptinvdt.formatted,this.docrecdt.formatted) == false) { this._toasterService.toast('error', 'Error', "Invoice Date Should be less than or Equal to Doc. Recd Date."); return false; }
        if (this.invamt == null) { this._toasterService.toast('error', 'Error', "Invoice amount can not be blank"); return false; }
        if (this.incoterm != null) {
            if ((this.incoterm == "CIF") || (this.incoterm == "C&I")) {
                if (this.insuramt == null) {
                    this._toasterService.toast('error', 'Error', "Insurance amount can not be blank"); return false;
                } else if (this.insuramt > (this.invamt * 10 / 100)) {
                    this._toasterService.toast('error', 'Error', "Insurance Amount should be less than 10% of Invoice Amount"); return false;
                }
            }
            if ((this.incoterm == "CIF") || (this.incoterm == "C&I")) {
                if (this.frtchrgs == null) {
                    this._toasterService.toast('error', 'Error', "Freight Charges can not be blank"); return false;
                } else if (this.frtchrgs > (this.invamt * 60 / 100)) {
                    this._toasterService.toast('error', 'Error', "Freight Charges should be less than 60% of Invoice Amount"); return false;
                }
            }
        }
        return true;
    }

    deleteConfirm(index, codeid, code, exptno) {
        let confirmDel = confirm("Do you want to confirm?");
        if (confirmDel) {
            this.deleteITC(index, codeid, code, exptno);
        }
    }

    abort() {
        const _jsonData = {
            status: 'A',
            pagetype: 'MAIN',
            guid: this._loginService.getLogin()[0].GUID,
            cmpid: this._loginService.getLogin()[0].CMPID
        };
        this._loaderService.display(true);
        this._dataService.Common('Export/ExportLogCompleted', _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this._router.navigate(['export/Consignment/start']);
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                },
                () => {
                });
    }
    GetTerminal(portcode)  {
        this.portterminal = this.Allportterminallist.filter((code: any) => code.ID.split("|")[1] === portcode);

    }
    CalcbmModalold() {
        if (this.noofpieces == null || this.noofpieces == 0 || this.noofpieces == undefined)
        { this._toasterService.toast('error', 'Error', "No. of Pieces can not be blank");
        return false;
        }

        if (this.grosswt == null || this.grosswt == "" || this.grosswt == undefined)
        { this._toasterService.toast('error', 'Error', "Gross Wt can not be blank");
        return false;
        }

         let theTop = (screen.height / 2) - (350 / 2);
         let theLeft = (screen.width / 2) - (500 / 2);
         let toolbar = 'resizable=no,scrollbars=no,width=650,height=400,status=no,left=' + theLeft + ',top=' + theTop;
         window.open('./#/popup/consignment-calcbm-Add/'  + this.grosswt + '/' + this.noofpieces + '/' , "CalculateCBM", toolbar);
    }
    CalcbmModal() {
        if (this.noofpackages == null || this.noofpackages == 0 || this.noofpackages == undefined)
        { this._toasterService.toast('error', 'Error', "No. of Packages can not be blank");
        return false;
        }

        if (this.grosswt == null || this.grosswt == "" || this.grosswt == undefined)
        { this._toasterService.toast('error', 'Error', "Gross Wt can not be blank");
        return false;
        }
        this.calcCBMmodel.show();
        // window.open('./#/popup/consignment-calcbm-Add/'  + this.grosswt + '/' + this.noofpieces + '/' , "CalculateCBM", toolbar);
    }

      changevolume(event) {
        this.calcCBMmodel.hide();
        console.log(event);
        console.log(event.totcbm,event.chblwt)
        this.volume=event.totcbm;
       // this.chblwt=event.chblwt
       if (event.chblwt > this.grosswt) { this.chblwt = event.chblwt; } else { this.chblwt = this.grosswt; }
      }
      hide() {
        this.calcCBMmodel.hide();
    }

}