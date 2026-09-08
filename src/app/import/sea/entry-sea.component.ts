import { Component, OnInit ,ViewEncapsulation} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { Router } from '@angular/router';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    templateUrl: 'entry-sea.component.html',
    styleUrls: ['../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None
})
export class EntrySeaImportComponent implements OnInit {
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
        selectorHeight: '198px',
        selectorWidth: '200px'
    };
    FormHeader: string = '';

    ImporterList: Array<any> = [];
    BillToList: Array<any> = [];
    AgentList: Array<any> = [];
    InvoiceCurrencyList: Array<any> = [];
    FrightCurrencyList: Array<any> = [];
    InsuranceCurrencyList: Array<any> = [];
    CommissionCurrencyList: Array<any> = [];
    ShipmentPortList: Array<any> = [];
    TranshipmentPortList: Array<any> = [];
    TruckOurList: Array<any> = [];
    VesselNameList: Array<any> = [];
    TranshipmentVesselList: Array<any> = [];
    SupplierList: Array<any> = [];
    ContLengthList: Array<any> = [];
    ContTypeList: Array<any> = [];
    IncotermList: Array<any> = [];
    TypeOfPackage2List: Array<any> = [];
    SteTypeChargeList: Array<any> = [];
    BillOfEntryNoList: Array<any> = [];
    BusinessAssociateList: Array<any> = [];

    hdInvHasRec: any = '0';
    Iu_Mode: string = '';
    Mode: string = '';
    ImportId: any = '0';
    Importer: any = null;
    BillTo: any = null;
    VesselName: any = null;
    LinerAgent: any = null;
    BusinessAssociate: any = null;
    MblNo: any = '';
    MblDate: any = null;
    HblNo: any = '';
    HblDate: any = null;
    DirectVessel: any = 'YES';

    EXWORKS: boolean = false;
    CUSTOMCLR: boolean = false;
    FREIGHTFRD: boolean = false;

    TranshipmentVessel: any = null;
    TranshipmentPort: any = null;

    ArrivalPort: any = '';
    ShedNo: any = '';
    ExpectedArrDate: any = null;
    ActualArrDate: any = null;
    ArrivingICD: any = null;

    BankRefNo: any = '';
    PartyRefNo: any = '';
    GLDate: any = null;
    LastDate: any = null;
    FreeLastDate: any = null;
    ShipmentPort: any = null;

    DocumentCancel: boolean = false;

    RODdtID: any = 0;;
    RODDate: any = null;
    RODRemark: any = '';

    DocCallForUsID: any = 0;
    DocumentName: any = '';
    DocumentRecOn: any = null;

    DescriptionGoods: any = '';
    NoOfPackages1: any = '';
    TypeOfPackage2: any = null;
    GrossWeight: any = '';
    NetWeight: any = '';
    ContId: any = 0;
    ContNo: any = '';
    ContLength: any = null;
    ContType: any = null;
    ContNoOfPackage: any = '';

    BillOfEntry: any = null;
    BillOfEntryNo: any = '';
    BillOfEntryDate: any = null;
    BillOfEntryRemark: any = '';
    CustomId: any = 0;
    CustomDocumentName: any = '';
    CustomSubmittedOn: any = null;
    CustomRemark: any = '';

    InvoiceId: any = 0;
    InvoiceNo: any = '';
    InvoiceDate: any = null;
    Incoterm: any = null;
    BriefIncoterm: any = '';
    FrightEnable: boolean = false;
    InsurenceEnable: boolean = false;
    LocalCurrency: any = {
        abb: '',
        cur: '',
        curname: ''
    };
    InvValue: any = '';
    InvCurrency: any = null;
    InvExchRate: any = '';
    InvTotInr: any = '0';
    FrightAmount: any = '';
    FrightCurrency: any = null;
    FrightExchRate: any = '';
    FrightTotInr: any = '0';
    InsuranceAmount: any = '';
    InsuranceCurrency: any = null;
    InsuranceExchRate: any = '';
    InsuranceTotInr: any = '0';
    CommissionAmount: any = '';
    CommissionCurrency: any = null;
    CommissionExchRate: any = '';
    CommissionTotInr: any = '0';
    CifAmount: any = '0';
    AccessableValue: any = '0';

    DutyId: any = 0;
    DutyPaid: any = '';
    DutyIns: any = '';
    DutyPaidOnDate: any = null;
    DutyCashNo: any = '';
    DutyRemark: any = '';

    AdvRecOne: any = '';
    AdvRecOneDate: any = null;
    AdvRecTwo: any = '';
    AdvRecTwoDate: any = null;
    AdvRecThree: any = '';
    AdvRecThreeDate: any = null;
    AdvRecFour: any = '';
    AdvRecFourDate: any = null;

    ExaminationDate: any = null;
    ExaminationRemark: any = '';
    AssessmentDate: any = null;
    AssessmentRemark: any = '';
    CustomClerk: any = '';
    DockClerk: any = '';

    SteId: any = 0;
    SteTypeCharge: any = '';
    SteRecNo: any = '';
    StePayDate: any = null;
    SteAmount: any = '';
    SteRemark: any = '';

    PortId: any = 0;
    PortRecNo: any = '';
    PortPaidDate: any = null;
    PortAmount: any = '';
    PortRemark: any = '';

    OctId: any = 0;
    OctRecNo: any = '';
    OctPaidDate: any = null;
    OctAmount: any = '';
    OctRemark: any = '';

    DeliveryId: any = 0;
    rTruck: any = 'O';
    TruckOur: any = null;
    Supplier: any = null;
    TruckNo: any = '';
    TruckType: any = '';
    RateAgreed: any = '';
    DeliveryDate: any = null;
    DeliveryRemark: any = '';

    ImpRemark: any = '';

    voyno : any="";
    IGMNo : any="";
    ArrivalPortPOD: any="";
    Finaldest : any="";
    dtfinaldest :any=null;
    onlinesuubDt :any =null;
    submissionBy: any="0";
    dutyamt: any="";
    StampDutyAmt: any="";
    DutyPaidBy :any = 'LNK';
    DOrecvdOn :any =null;
    validatedt:any=null;
    deliverymode : any='CFS'
    IGMdt :any=null
    
    Arrivalportlist :any=[]
    userdtls :any =[];

    dtDATEOFROD: Array<any> = [];
    dtGOOD: Array<any> = [];
    dtDOCSUB: Array<any> = [];
    dtDUTY: Array<any> = [];
    dtSTEAGENT: Array<any> = [];
    dtPORTCFS: Array<any> = [];
    dtOCTROI: Array<any> = [];
    dtDELIVERY: Array<any> = [];
    dtINVOICE: Array<any> = [];
    dtCALLFORUS: Array<any> = [];
    constructor(private _router: Router,
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _route: ActivatedRoute,
        private _loaderService: LoaderService) { }

    ngOnInit(): void {
        this._route.params.subscribe(params => {
            if (params["import-id"]) {
                this.ImportId = params["import-id"];
                this.Iu_Mode = 'UPDATE';
                this.FormHeader = 'UPDATE - IMPORT SEA';
                this.verifyPermission(126, "Modify");
            }
            else {
                this.FormHeader = 'ADD - IMPORT SEA';
                this.Iu_Mode = 'ADD';
                this.verifyPermission(126, "Add");
            }
        });
    }

    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                if (this._loginService.checkVerify(userMode, data)) {
                    this.fillCommonDropdownList();
                } else { this._loaderService.display(false); }
            });
    }

    fillCommonDropdownList() {
        const _jsonData = {
            mode: 'Sea',
            iu_mode: this.Iu_Mode,
            citycode: this._loginService.getLogin()[0].CITYCODE,
        };
        this._dataService.getData("Import/Fill_Dropdown", _jsonData)
            .subscribe((data: any) => {
                this.getLocalCurrency();
                this.ImporterList = data.Table;
                this.BillToList = data.Table;
                this.AgentList = data.Table1;
                this.InvoiceCurrencyList = data.Table2;
                this.FrightCurrencyList = data.Table2;
                this.InsuranceCurrencyList = data.Table2;
                this.CommissionCurrencyList = data.Table2;
                this.ShipmentPortList = data.Table4;
                this.TranshipmentPortList = data.Table4;
                this.TruckOurList = data.Table5;
                this.VesselNameList = data.Table6;
                this.TranshipmentVesselList = data.Table7;
                this.SupplierList = data.Table8;
                this.ContLengthList = data.Table9;
                this.ContLength = (data.Table9.length > 0) ? data.Table9[0]["length"] : null;
                this.ContTypeList = data.Table10;
                this.IncotermList = data.Table11;
                this.TypeOfPackage2List = data.Table12;
                this.SteTypeChargeList = data.Table13;
                this.BillOfEntryNoList = data.Table15;
                this.BusinessAssociateList = data.Table16;
                this.Arrivalportlist = data.Table17;
                this.userdtls=data.Table18;
                this.populate(this.ImportId);
            });
    }

    getLocalCurrency() {
        const _jsonData = {
            citycode1: this._loginService.getLogin()[0].CITYCODE1,
        };
        this._dataService.getData("Import/GetLocalCurrency", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.length > 0) {
                    this.LocalCurrency["abb"] = data.Table[0]["Abb"];
                    this.LocalCurrency["cur"] = data.Table[0]["LocalCurrency"].split("|")[0];
                    this.LocalCurrency["curname"] = data.Table[0]["LocalCurrency"].split("|")[1];
                }
            });
    }

    populate(importId) {
        const _jsonData = {
            importid: importId,
        };
        this._dataService.getData("Import/populate_import", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.filltable(importId);
                if (data.Table.length > 0) {
                    if (this.ImportId != 0) {
                        this.populateImport(data.Table);
                    }
                }
            });
    }

    filltable(pkid) {
        const _jsonArrayData = [
            { ImportId: pkid, TableNo: "01", TableName: "DATEOFROD" },
            { ImportId: pkid, TableNo: "02", TableName: "GOOD" },
            { ImportId: pkid, TableNo: "03", TableName: "DOCSUB" },
            { ImportId: pkid, TableNo: "04", TableName: "DUTY" },
            { ImportId: pkid, TableNo: "05", TableName: "STEAGENT" },
            { ImportId: pkid, TableNo: "06", TableName: "PORTCFS" },
            { ImportId: pkid, TableNo: "07", TableName: "OCTROI" },
            { ImportId: pkid, TableNo: "08", TableName: "DELIVERY" },
            { ImportId: pkid, TableNo: "09", TableName: "INVOICE" },
            { ImportId: pkid, TableNo: "10", TableName: "CALLFORUS" },
        ]
        this._dataService.Common("Import/filltables", _jsonArrayData)
            .subscribe((data: any) => {
                this.dtDATEOFROD = data.DATEOFROD;
                this.dtGOOD = data.GOOD;
                this.dtDOCSUB = data.DOCSUB;
                this.dtDUTY = data.DUTY;
                this.dtSTEAGENT = data.STEAGENT;
                this.dtPORTCFS = data.PORTCFS;
                this.dtOCTROI = data.OCTROI;
                this.dtDELIVERY = data.DELIVERY;
                this.dtINVOICE = data.INVOICE;
                this.hdInvHasRec = (this.dtINVOICE.length > 0) ? "1" : "0";
                this.dtCALLFORUS = data.CALLFORUS;
            });
    }

    populateImport(data: any) {
        let popObject = data[0];
        this.Importer = popObject.fk_Importer;
        this.BillTo = popObject.fk_BillTo;
        this.VesselName =popObject.fk_Vessel_Airline; //popObject.fk_Vessel_Airline;
        this.LinerAgent = popObject.fk_Agent_Name;
        this.MblNo = popObject.Mbl_Mabl_NO;
        this.MblDate = (popObject.Mbl_Mabl_DT) ? this._dataService.stringdttoArry(popObject.Mbl_Mabl_DT) : null;
        this.HblNo = popObject.Bbl_Habl_NO;
        this.HblDate = (popObject.Bbl_Habl_DT) ? this._dataService.stringdttoArry(popObject.Bbl_Habl_DT) : null;
        this.DirectVessel = popObject.Dir_vessel.trim();
        this.TranshipmentVessel = (popObject.fk_Tran_Vessel_Airline != "") ? popObject.fk_Tran_Vessel_Airline : null;
        this.TranshipmentPort = (popObject.fk_Trans_Port != "") ? popObject.fk_Trans_Port : null;

        this.BankRefNo = popObject.Bank_Ref_No;
        this.PartyRefNo = popObject.Party_Ref_No;
        this.GLDate = (popObject.GlDate) ? this._dataService.stringdttoArry(popObject.GlDate) : null;
        this.LastDate = popObject.LastFreeDate;
        this.ShipmentPort = (popObject.fK_Port_of_Shipment != "") ? popObject.fK_Port_of_Shipment : null;

        this.DescriptionGoods = popObject.Desc_Good;
        this.NoOfPackages1 = popObject.NumOfPkg1;
        this.TypeOfPackage2 = (popObject.fk_TypeOfPackage != "") ? popObject.fk_TypeOfPackage : null;
        this.GrossWeight = popObject.GrossWt;
        this.NetWeight = popObject.NetWt;

        this.BillOfEntryNo = popObject.Bill_EntryNO;
        this.BillOfEntryDate = (popObject.BOE_Date) ? this._dataService.stringdttoArry(popObject.BOE_Date) : null;
        this.BillOfEntryRemark = popObject.BOE_Remark;

        this.InvoiceNo = popObject.Invoice_No;
        this.InvoiceDate = (popObject.Invoice_Date) ? this._dataService.stringdttoArry(popObject.Invoice_Date) : null;
        this.Incoterm = (popObject.fk_Incoterm != "") ? popObject.fk_Incoterm : null;
        this.checkEnableIncoterm();
        this.InvValue = popObject.InvoiceValue;
        this.InvCurrency = (popObject.fk_Inv_Currency != "|") ? (popObject.fk_Inv_Currency != "0|") ? popObject.fk_Inv_Currency : null : null;
        this.InvExchRate = popObject.InvExchRate;
        this.InvTotInr = popObject.Inv_Total;

        this.FrightAmount = popObject.Fright_Amount;
        //this.hdFriCurrency        ignore model
        this.FrightCurrency = (popObject.fk_Fri_Currency != "|") ? (popObject.fk_Fri_Currency != "") ? popObject.fk_Fri_Currency : null : null;
        this.FrightExchRate = popObject.FrightExchRate;
        this.FrightTotInr = popObject.Fright_Total;

        this.InsuranceAmount = popObject.Ins_Amount;
        //this.hdInsCurrency        ignore model
        this.InsuranceCurrency = (popObject.fk_Ins_Currency != "|") ? (popObject.fk_Ins_Currency != "") ? popObject.fk_Ins_Currency : null : null;
        this.InsuranceExchRate = popObject.InsExchRate;
        this.InsuranceTotInr = popObject.Ins_Total;

        this.CommissionAmount = popObject.Com_Amount;
        //this.hdCommissionCurrency        ignore model
        this.CommissionCurrency = (popObject.fk_Com_Currency != "|") ? (popObject.fk_Com_Currency != "") ? popObject.fk_Com_Currency : null : null;
        this.CommissionExchRate = popObject.ComExchRate;
        this.CommissionTotInr = popObject.Com_Total;

        this.CifAmount = popObject.CIF_Amount;
        this.AccessableValue = popObject.Access_Value;

        this.AdvRecOne = popObject.AdvRec1;
        this.AdvRecOneDate = (popObject.AdvRec1_Date) ? this._dataService.stringdttoArry(popObject.AdvRec1_Date) : null;
        this.AdvRecTwo = popObject.AdvRec2;
        this.AdvRecTwoDate = (popObject.AdvRec2_Date) ? this._dataService.stringdttoArry(popObject.AdvRec2_Date) : null;
        this.AdvRecThree = popObject.AdvRec3;
        this.AdvRecThreeDate = (popObject.AdvRec3_Date) ? this._dataService.stringdttoArry(popObject.AdvRec3_Date) : null;
        this.AdvRecFour = popObject.AdvRec4;
        this.AdvRecFourDate = (popObject.AdvRec4_Date) ? this._dataService.stringdttoArry(popObject.AdvRec4_Date) : null;

        this.ExaminationDate = (popObject.Exam_Date) ? this._dataService.stringdttoArry(popObject.Exam_Date) : null;
        this.ExaminationRemark = popObject.Exam_Remark;
        this.AssessmentDate = (popObject.Assess_Date) ? this._dataService.stringdttoArry(popObject.Assess_Date) : null;
        this.AssessmentRemark = popObject.Assess_Remark;

        this.CustomClerk = popObject.Custom_Clerk;
        this.DockClerk = popObject.Dock_Clerk;
        this.ArrivingICD = (popObject.ArrivingDateAtICD) ? this._dataService.stringdttoArry(popObject.ArrivingDateAtICD) : null;
        this.ImpRemark = popObject.Remark;
        this.FormHeader = "Update - Import Sea - " + popObject.Import_Code + " - " + popObject.Import_Date;
        this.BusinessAssociate = (popObject.BusinessAssociate != "") ? popObject.BusinessAssociate : null;
        this.BillOfEntry = (popObject.fk_BillOfEntry != "") ? popObject.fk_BillOfEntry : null;
        this.DocumentCancel = (popObject.Doc_Cancel == "Y") ? true : false;

        this.EXWORKS = (popObject.ExWork == 'EX') ? true : false;
        this.CUSTOMCLR = (popObject.CustomClr == 'CUSTOM') ? true : false;
        this.FREIGHTFRD = (popObject.Freightfrd == 'FRTFRD') ? true : false;

        this.VesselName =popObject.vsl_name;
        this.voyno = popObject.vsl_voyageno;
        this.IGMNo = popObject.vsl_IGMno;
        this.ArrivalPort = popObject.vsl_Arrivalport;
        this.ShedNo = popObject.vsl_Berthno; 
        this.Finaldest = popObject.FINAL_DESTPORT;
        this.dtfinaldest =(popObject.ARRV_DTFINALDEST) ? this._dataService.stringdttoArry(popObject.ARRV_DTFINALDEST) : null;
        this.onlinesuubDt=(popObject.ARRV_DTFINALDEST) ? this._dataService.stringdttoArry(popObject.ARRV_DTFINALDEST) : null;
        this.submissionBy = popObject.ONLINE_SUB_BY;
        this.dutyamt = popObject.DUTY_AMT;
        this.StampDutyAmt = popObject.STAMP_DUTY;
        this.DutyPaidBy = popObject.DUTYPAIDBY;
        this.DOrecvdOn =(popObject.ArrivingDateAtICD) ? this._dataService.stringdttoArry(popObject.ArrivingDateAtICD) : null;
        this.validatedt =(popObject.DELIVERY_VALIDATE_DT) ? this._dataService.stringdttoArry(popObject.DELIVERY_VALIDATE_DT) : null;   
        this.deliverymode = popObject.DELIVERYMODE;
        this.ArrivalPortPOD=popObject.VSL_ARRIVALPORTPOD;
        this.IGMdt=(popObject.IGMdt) ? this._dataService.stringdttoArry(popObject.IGMdt) : null; 
        this.ExpectedArrDate = (popObject.Exp_Arrival_Date) ? this._dataService.stringdttoArry(popObject.Exp_Arrival_Date) : null;
        this.ActualArrDate = (popObject.Act_Arrival_Date) ? this._dataService.stringdttoArry(popObject.Act_Arrival_Date) : null;
    }

    moreDetails() {
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=886,height=438,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/information/import/incoterm-information', "Clp_View", toolbar);
    }

    onTypeChange(type) {
        if (type == 'E') {
            this.CUSTOMCLR = false;
            this.FREIGHTFRD = false;
        } else if (type == 'C' || type == 'F') {
            this.EXWORKS = false;
        }
    }
    changeVesselName() {
        this.TranshipmentVessel = this.VesselName;
        this.changeTranVesselName();
    }

    changeTranVesselName() {
        if (this.TranshipmentVessel != null) {
            let TextValue = this.TranshipmentVessel;
            let TextSplit = TextValue.split('|');
            this.ArrivalPort = TextSplit[5] + "|" + TextSplit[6];
            this.ShedNo = TextSplit[8];
            this.ExpectedArrDate = TextSplit[3];
            this.ActualArrDate = TextSplit[4];
        }
        else if (this.VesselName != null) {
            let TextValue = this.VesselName;
            let TextSplit = TextValue.split('|');
            this.ArrivalPort = TextSplit[5] + "|" + TextSplit[6];
            this.ShedNo = TextSplit[8];
            this.ExpectedArrDate = TextSplit[3];
            this.ActualArrDate = TextSplit[4];
        }
        else {
            this.ArrivalPort = '';
            this.ShedNo = '';
            this.ExpectedArrDate = '';
            this.ActualArrDate = '';
        }
    }

    changeDrpContainerSize(contType) {
        if (this.ContLength) {
            const _jsonData = {
                container_size: this.ContLength,
            };
            this._loaderService.display(true);
            this._dataService.getData("Import/GetContainerType", _jsonData)
                .subscribe((data: any) => {
                    this._loaderService.display(false);
                    this.ContTypeList = data.Table;
                    this.ContType = contType;
                });
        }
    }

    checkEnableIncoterm() {
        if (this.Incoterm) {
            if (this.Incoterm.split('|')[1] == 'N') { this.freightEnable(true); } else { this.freightEnable(false); }
            if (this.Incoterm.split('|')[2] == 'N') { this.insurenceEnable(true); } else { this.insurenceEnable(false); }
            this.BriefIncoterm = this.Incoterm.split('|')[3];
        } else {
            this.BriefIncoterm = '';
            this.FrightEnable = false;
            this.InsurenceEnable = false;
        }
    }

    freightEnable(value: boolean) {
        this.FrightEnable = value;
        if (value) {
            this.FrightAmount = '';
            this.FrightCurrency = null;
            this.FrightExchRate = 0;
        }
    }

    insurenceEnable(value: boolean) {
        this.InsurenceEnable = value;
        if (value) {
            this.InsuranceAmount = '';
            this.InsuranceCurrency = null;
            this.InsuranceExchRate = 0;
        }
    }

    amountValidationInvoice(ctrlAmount, drpCntl, exchCtrl) {
        if (Math.abs(this[ctrlAmount]) == 0) {
            if (ctrlAmount == "InvValue") {
                this.clearInvoiceDtls('FrightAmount', 'FrightCurrency', 'FrightExchRate');
                this.clearInvoiceDtls('InsuranceAmount', 'InsuranceCurrency', 'InsuranceExchRate');
                this.clearInvoiceDtls('CommissionAmount', 'CommissionCurrency', 'CommissionExchRate');
            }
            this[ctrlAmount] = "";
            this[drpCntl] = null;
            this[exchCtrl] = "";
        }
        this.sumAmount();
    }

    clearInvoiceDtls(ctrlAmount, drpCntl, exchCtrl) {
        this[ctrlAmount] = "";
        this[drpCntl] = null;
        this[exchCtrl] = "";
    }

    sumAmount() {
        this.InvTotInr = Math.round(Math.abs(this.InvValue) * Math.abs(this.InvExchRate) * 100) / 100;
        this.FrightTotInr = Math.round(Math.abs(this.FrightAmount) * Math.abs(this.FrightExchRate) * 100) / 100;
        this.InsuranceTotInr = Math.round(Math.abs(this.InsuranceAmount) * Math.abs(this.InsuranceExchRate) * 100) / 100;
        this.CommissionTotInr = Math.round(Math.abs(this.CommissionAmount) * Math.abs(this.CommissionExchRate) * 100) / 100;
        this.cifAmount();
    }

    cifAmount() {
        let cifAmount = 0;
        cifAmount = Math.round((Math.abs(this.InvTotInr) + Math.abs(this.FrightTotInr) + Math.abs(this.InsuranceTotInr) + Math.abs(this.CommissionTotInr)) * 100) / 100;
        this.CifAmount = cifAmount;
        let accValue = Math.round(cifAmount * 1.01).toString() + ".00";
        //var accValue = pad_with_zeros(Math.round(CifAmt*1.01),2)
        //alert(Math.round(CifAmt*1.01))
        this.AccessableValue = accValue;
    }

    checkCurrency(drpCntl, ctrlAmount, exchCtrl) {
        if (this.Incoterm) {
            if (this.checkValues(ctrlAmount, drpCntl)) {
                let textSplit = this[drpCntl].split('|');
                if (textSplit[0] == this.LocalCurrency["cur"]) {
                    this[exchCtrl] = 1;
                    (<HTMLInputElement>document.getElementById(exchCtrl)).readOnly = true;
                } else {
                    this[exchCtrl] = (textSplit[1] != "") ? textSplit[1] : 0;
                    (<HTMLInputElement>document.getElementById(exchCtrl)).readOnly = false;
                }
            }
        } else {
            (<HTMLInputElement>document.getElementById(drpCntl)).value = null;
            this[drpCntl] = null;
            alert("Select Incoterm...");
        }
        this.sumAmount();
    }

    checkValues(CtrlName, DrpCtrl): boolean {
        if (Math.abs(this[CtrlName]) == 0) {
            alert("Amount Value Should not be empty...");
            (<HTMLInputElement>document.getElementById(DrpCtrl)).value = null;
            return false;
        }
        return true;
    }

    amountValidationInvExchChange(ctrlAmount, drpCtrl) {
        if (this[ctrlAmount] != "") {
            // if (ValidationforDigits(ctrlAmount, 10) == false) return false;
            // if (ValidationforAfterDigits(ctrlAmount, 3) == false) return false;
            // if (IsNumericDouble(ctrlAmount, "Exchange Rate") == false) return false;
            //else 
            this.InvExchChange(drpCtrl, ctrlAmount);
        }
    }

    InvExchChange(drpCtrl, ctrlAmount) {
        if (this[drpCtrl] != null) {
            this.sumAmount();
        } else {
            this[ctrlAmount] = 0;
            alert("Please select Currency..");
        }
    }

    fnAddEdit_DateOfROD_Dtls(index, type, pk_tblIndex, date, remark) {
        if (type == 'A') {
            if (!this.RODDate) {
                alert("Date Of Receipt Of Document Should not be Empty."); return false;
            }
            if (this._dataService.DateFromAndToComparision(this.RODDate.formatted, this._dataService.getCurrentdate())) {
                alert("Date Of Receipt Of Document Should be less than or equal to " + this._dataService.getCurrentdate()); return false;
            }
            if (this.dtDATEOFROD.filter(key => key.pk_tblIndex == pk_tblIndex).length > 0) {
                let updateItem = this.dtDATEOFROD.find(key => key.pk_tblIndex == pk_tblIndex);
                let index = this.dtDATEOFROD.indexOf(updateItem);
                this.dtDATEOFROD[index]["DateOfRODdt"] = this.RODDate.formatted;
                this.dtDATEOFROD[index]["DateOfRODremark"] = this.RODRemark;
            }
            else {
                this.dtDATEOFROD.push({
                    STATUS: 100,
                    fk_ImpoterId: "",
                    Import_Code: "",
                    pk__DateOfROD_DtlsId: "",
                    pk_tblIndex: (this.dtDATEOFROD.length > 0) ? Math.max.apply(Math, this.dtDATEOFROD.map(function (o) { return o.pk_tblIndex; })) + 1 : 1,
                    DateOfRODdt: this.RODDate.formatted,
                    DateOfRODremark: this.RODRemark,
                });
            }
            this.resetDateOfROD();
        }
        else if (type == 'P') {
            this.RODdtID = pk_tblIndex;
            this.RODDate = this._dataService.stringdttoArry(date);
            this.RODRemark = remark;
        }
        else if (type == 'D') {
            if (confirm("Are you sure want to delete Date of Receipt of Document date " + date)) {
                this.dtDATEOFROD.splice(index, 1);
                this.resetDateOfROD();
            }
        }
    }
    resetDateOfROD() {
        this.RODdtID = 0;
        this.RODDate = null;
        this.RODRemark = '';
    }

    fnAddEdit_DocCallForUs_Dtls(index, type, pk_tblIndex, name, date) {
        if (type == 'A') {
            if (!this.DocumentName) {
                alert("Document Name Should not be Empty."); return false;
            }
            if (this.dtCALLFORUS.filter(key => key.pk_tblIndex == pk_tblIndex).length > 0) {
                let updateItem = this.dtCALLFORUS.find(key => key.pk_tblIndex == pk_tblIndex);
                let index = this.dtCALLFORUS.indexOf(updateItem);
                this.dtCALLFORUS[index]["DocName"] = this.DocumentName;
                this.dtCALLFORUS[index]["ReceivedOn"] = this.DocumentRecOn.formatted;
            }
            else {
                this.dtCALLFORUS.push({
                    STATUS: 100,
                    fk_ImpoterId: "",
                    Import_Code: "",
                    pk_DocCall_DtlsId: "",
                    pk_tblIndex: (this.dtCALLFORUS.length > 0) ? Math.max.apply(Math, this.dtCALLFORUS.map(function (o) { return o.pk_tblIndex; })) + 1 : 1,
                    DocName: this.DocumentName,
                    ReceivedOn: this.DocumentRecOn.formatted,
                    AcknowledgedOn: "",
                    ISEDIT: 0
                });
            }
            this.resetDocCallForUs();
        }
        else if (type == 'P') {
            this.DocCallForUsID = pk_tblIndex;
            this.DocumentName = name;
            this.DocumentRecOn = this._dataService.stringdttoArry(date);
        }
        else if (type == 'D') {
            if (confirm("Are you sure want to delete Document " + name)) {
                this.dtCALLFORUS.splice(index, 1);
                this.resetDocCallForUs();
            }
        }
    }
    resetDocCallForUs() {
        this.DocCallForUsID = 0;
        this.DocumentName = '';
        this.DocumentRecOn = null;
    }

    fnAddEdit_Good_Dtls(index, type, pk_tblIndex, contno, contlength, contype, noofpackage) {
        if (type == 'A') {
            if (!this.ContNo) {
                alert("Container Number Should not be Empty."); return false;
            }
            if (this.ContNo.length != 11) {
                alert("Please enter 11 digit Container Number.."); return false;
            }
            if (!this.ContType) {
                alert("Please Select Container Type.."); return false;
            }
            if (this.ContId != 0) {
                let updateItem = this.dtGOOD.find(key => key.pk_tblIndex == pk_tblIndex);
                let index = this.dtGOOD.indexOf(updateItem);
                this.dtGOOD[index]["ContainerNumber"] = this.ContNo;
                this.dtGOOD[index]["ContLength"] = this.ContLength;
                this.dtGOOD[index]["ContType"] = this.ContType;
                this.dtGOOD[index]["NoOfPackages"] = this.ContNoOfPackage;
                this.dtGOOD[index]["ContainerSize"] = this.ContTypeList.find((key) => key.DATAVALUEFIELD == this.ContType).DATATEXTFIELD;
            }
            else {
                this.dtGOOD.push({
                    STATUS: 100,
                    fk_ImpoterId: "",
                    Import_Code: "",
                    pk__Good_DtlsId: "",
                    pk_tblIndex: (this.dtGOOD.length > 0) ? Math.max.apply(Math, this.dtGOOD.map(function (o) { return o.pk_tblIndex; })) + 1 : 1,
                    ContainerNumber: this.ContNo,
                    ContainerSize: this.ContTypeList.find((key) => key.DATAVALUEFIELD == this.ContType).DATATEXTFIELD,
                    NoOfPackages: this.ContNoOfPackage,
                    ContLength: (this.ContLength) ? this.ContLength : "",
                    ContType: this.ContType
                });
            }
            this.resetGood_Dtls();
        }
        else if (type == 'P') {
            this.ContId = pk_tblIndex;
            this.ContNo = contno;
            this.ContLength = contlength;
            this.ContNoOfPackage = noofpackage;
            this.changeDrpContainerSize(contype);
            //this.ContType=" "+ contype;
        }
        else if (type == 'D') {
            if (confirm("Are you sure want to delete Container No." + contno)) {
                this.dtGOOD.splice(index, 1);
                this.resetGood_Dtls();
            }
        }
    }
    resetGood_Dtls() {
        this.ContId = 0;
        this.ContNo = '';
        this.ContType = null;
        this.ContNoOfPackage = '';
    }

    fnAddEdit_BOE_Dtls(index, type, pk_tblIndex, name, date, remark) {
        if (type == 'A') {
            if (!this.CustomDocumentName) {
                alert("Document Name Should not be Empty."); return false;
            }
            if (!this.CustomSubmittedOn) {
                alert("Date Should not be Empty."); return false;
            }
            if (!this.CustomRemark) {
                alert("Remark Should not be Empty."); return false;
            }
            if (this.dtDOCSUB.filter(key => key.pk_tblIndex == pk_tblIndex).length > 0) {
                let updateItem = this.dtDOCSUB.find(key => key.pk_tblIndex == pk_tblIndex);
                let index = this.dtDOCSUB.indexOf(updateItem);
                this.dtDOCSUB[index]["BOEno"] = this.CustomDocumentName;
                this.dtDOCSUB[index]["BOEdt"] = this.CustomSubmittedOn.formatted;
                this.dtDOCSUB[index]["BOEremark"] = this.CustomRemark;
            }
            else {
                this.dtDOCSUB.push({
                    STATUS: 100,
                    fk_ImpoterId: "",
                    Import_Code: "",
                    pk__BOE_DtlsId: "",
                    pk_tblIndex: (this.dtDOCSUB.length > 0) ? Math.max.apply(Math, this.dtDOCSUB.map(function (o) { return o.pk_tblIndex; })) + 1 : 1,
                    BOEno: this.CustomDocumentName,
                    BOEdt: this.CustomSubmittedOn.formatted,
                    BOEremark: this.CustomRemark
                });
            }
            this.resetBOE_Dtls();
        }
        else if (type == 'P') {
            this.CustomId = pk_tblIndex;
            this.CustomDocumentName = name;
            this.CustomSubmittedOn = this._dataService.stringdttoArry(date);
            this.CustomRemark = remark;
        }
        else if (type == 'D') {
            if (confirm("Are you sure want to delete Bill of Entry No." + date)) {
                this.dtDOCSUB.splice(index, 1);
                this.resetBOE_Dtls();
            }
        }
    }
    resetBOE_Dtls() {
        this.CustomId = 0;
        this.CustomDocumentName = '';
        this.CustomSubmittedOn = null;
        this.CustomRemark = '';
    }

    fnAddEdit_Invoice_Dtls(index, type, pk_tblIndex, invno, invdate) {
        if (type == 'A') {
            if (!this.InvoiceNo) {
                alert("Invoice No Should not be Empty."); return false;
            }
            if (!this.InvoiceDate) {
                alert("Invoice Date Should not be Empty."); return false;
            }
            if (this.dtINVOICE.filter(key => key.pk_tblIndex == pk_tblIndex).length > 0) {
                let updateItem = this.dtINVOICE.find(key => key.pk_tblIndex == pk_tblIndex);
                let index = this.dtINVOICE.indexOf(updateItem);
                this.dtINVOICE[index]["Invoice_No"] = this.InvoiceNo;
                this.dtINVOICE[index]["Invoice_Date"] = this.InvoiceDate.formatted;
            }
            else {
                this.dtINVOICE.push({
                    STATUS: 100,
                    fk_ImpoterId: "",
                    Import_Code: "",
                    pk_Inv_DtlsId: "",
                    pk_tblIndex: (this.dtINVOICE.length > 0) ? Math.max.apply(Math, this.dtINVOICE.map(function (o) { return o.pk_tblIndex; })) + 1 : 1,
                    Invoice_No: this.InvoiceNo,
                    Invoice_Date: this.InvoiceDate.formatted,
                });
            }
            this.resetInvoice_Dtls();
        }
        else if (type == 'P') {
            this.InvoiceId = pk_tblIndex;
            this.InvoiceNo = invno;
            this.InvoiceDate = this._dataService.stringdttoArry(invdate);
        }
        else if (type == 'D') {
            if (confirm("Are you sure you want to delete Invoice No. " + invno + "?")) {
                this.dtINVOICE.splice(index, 1);
                this.resetInvoice_Dtls();
            }
        }
    }
    resetInvoice_Dtls() {
        this.InvoiceId = 0;
        this.InvoiceNo = '';
        this.InvoiceDate = null;
    }

    fnAddEdit_Duty_Dtls(index, type, pk_tblIndex, dutypaid, dutyins, dutypaidon, dutycashno, dutyremark) {
        if (type == 'A') {
            if (!this.DutyPaid && !this.DutyIns) {
                alert("Please enter any one of Duty Paid or Interest."); return false;
            }
            if (!this.DutyPaidOnDate) {
                alert("Date Should not be Empty."); return false;
            }
            if (!this.DutyCashNo) {
                alert("Cash No Should not be Empty."); return false;
            }
            if (this.dtDUTY.filter(key => key.pk_tblIndex == pk_tblIndex).length > 0) {
                let updateItem = this.dtDUTY.find(key => key.pk_tblIndex == pk_tblIndex);
                let index = this.dtDUTY.indexOf(updateItem);
                this.dtDUTY[index]["DutyPaid"] = this.DutyPaid;
                this.dtDUTY[index]["DutyIns"] = this.DutyIns;
                this.dtDUTY[index]["DutyPaidOn"] = this.DutyPaidOnDate.formatted;
                this.dtDUTY[index]["DutyCashNo"] = this.DutyCashNo;
                this.dtDUTY[index]["DutyRemark"] = this.DutyRemark;
            }
            else {
                this.dtDUTY.push({
                    STATUS: 100,
                    fk_ImpoterId: "",
                    Import_Code: "",
                    pk__DateOfROD_DtlsId: "",
                    pk_tblIndex: (this.dtDUTY.length > 0) ? Math.max.apply(Math, this.dtDUTY.map(function (o) { return o.pk_tblIndex; })) + 1 : 1,
                    DutyPaid: this.DutyPaid,
                    DutyIns: this.DutyIns,
                    DutyPaidOn: this.DutyPaidOnDate.formatted,
                    DutyCashNo: this.DutyCashNo,
                    DutyRemark: this.DutyRemark
                });
            }
            this.resetDuty_Dtls();
        }
        else if (type == 'P') {
            this.DutyId = pk_tblIndex;
            this.DutyPaid = dutypaid;
            this.DutyIns = dutyins;
            this.DutyPaidOnDate = this._dataService.stringdttoArry(dutypaidon);
            this.DutyCashNo = dutycashno;
            this.DutyRemark = dutyremark;
        }
        else if (type == 'D') {
            if (confirm("Are you sure you want to delete Duty Paid. " + dutypaid + "?")) {
                this.dtDUTY.splice(index, 1);
                this.resetDuty_Dtls();
            }
        }
    }
    resetDuty_Dtls() {
        this.DutyId = 0;
        this.DutyPaid = '';
        this.DutyIns = '';
        this.DutyPaidOnDate = null;
        this.DutyCashNo = '';
        this.DutyRemark = '';
    }

    fnAddEdit_SteAgent_Dtls(index, type, pk_tblIndex, stetype, sterecno, stepaydate, steamount, steremark) {
        if (type == 'A') {
            if (!this.SteTypeCharge) {
                alert("Please select Steamer Agent Charges Type"); return false;
            }
            if (!this.SteRecNo) {
                alert("Steamer Agent Receipt No Should not be Empty."); return false;
            }
            if (!this.StePayDate) {
                alert("Date Should not be Empty."); return false;
            }
            if (!this.SteAmount) {
                alert("Amount Should not be Empty."); return false;
            }
            if (!this.SteRemark) {
                alert("Remark Should not be Empty."); return false;
            }
            if (this.dtSTEAGENT.filter(key => key.pk_tblIndex == pk_tblIndex).length > 0) {
                let updateItem = this.dtSTEAGENT.find(key => key.pk_tblIndex == pk_tblIndex);
                let index = this.dtSTEAGENT.indexOf(updateItem);
                this.dtSTEAGENT[index]["SteType"] = this.SteTypeCharge;
                this.dtSTEAGENT[index]["SteRecNo"] = this.SteRecNo;
                this.dtSTEAGENT[index]["StePaydt"] = this.StePayDate.formatted;
                this.dtSTEAGENT[index]["SteAmount"] = this.SteAmount;
                this.dtSTEAGENT[index]["SteTypeValue"] = this.SteTypeChargeList.find(key => key.DATAVALUEFIELD == this.SteTypeCharge).DATATEXTFIELD;
                this.dtSTEAGENT[index]["SteRemark"] = this.SteRemark;
            }
            else {
                this.dtSTEAGENT.push({
                    STATUS: 100,
                    fk_ImpoterId: "",
                    Import_Code: "",
                    pk__SteAgent_DtlsId: "",
                    pk_tblIndex: (this.dtSTEAGENT.length > 0) ? Math.max.apply(Math, this.dtSTEAGENT.map(function (o) { return o.pk_tblIndex; })) + 1 : 1,
                    SteType: this.SteTypeCharge,
                    SteRecNo: this.SteRecNo,
                    StePaydt: this.StePayDate.formatted,
                    SteAmount: this.SteAmount,
                    SteTypeValue: this.SteTypeChargeList.find(key => key.DATAVALUEFIELD == this.SteTypeCharge).DATATEXTFIELD,
                    SteRemark: this.SteRemark
                });
            }
            this.resetSteAgent_Dtls();
        }
        else if (type == 'P') {
            this.SteId = pk_tblIndex;
            this.SteTypeCharge = stetype;
            this.SteRecNo = sterecno;
            this.StePayDate = this._dataService.stringdttoArry(stepaydate);
            this.SteAmount = steamount;
            this.SteRemark = steremark;
        }
        else if (type == 'D') {
            if (confirm("Are you sure you want to delete Steamer Agent Charges No. " + sterecno + "?")) {
                this.dtSTEAGENT.splice(index, 1);
                this.resetSteAgent_Dtls();
            }
        }
    }
    resetSteAgent_Dtls() {
        this.SteId = 0;
        this.SteTypeCharge = null;
        this.SteRecNo = '';
        this.StePayDate = null;
        this.SteAmount = '';
        this.SteRemark = '';
    }

    fnAddEdit_Port_Dtls(index, type, pk_tblIndex, rcno, paydate, amount, remark) {
        if (type == 'A') {
            if (!this.PortRecNo) {
                alert("Port Receipt No Should not be Empty."); return false;
            }
            if (!this.PortPaidDate) {
                alert("Date Should not be Empty."); return false;
            }
            if (!this.PortAmount) {
                alert("Amount Should not be Empty."); return false;
            }
            if (!this.PortRemark) {
                alert("Remark Should not be Empty."); return false;
            }
            if (this.dtPORTCFS.filter(key => key.pk_tblIndex == pk_tblIndex).length > 0) {
                let updateItem = this.dtPORTCFS.find(key => key.pk_tblIndex == pk_tblIndex);
                let index = this.dtPORTCFS.indexOf(updateItem);
                this.dtPORTCFS[index]["PortRecNo"] = this.PortRecNo;
                this.dtPORTCFS[index]["PortPaiddt"] = this.PortPaidDate.formatted;
                this.dtPORTCFS[index]["PortAmount"] = this.PortAmount;
                this.dtPORTCFS[index]["PortRemark"] = this.PortRemark;
            }
            else {
                this.dtPORTCFS.push({
                    STATUS: 100,
                    fk_ImpoterId: "",
                    Import_Code: "",
                    pk__Port_DtlsId: "",
                    pk_tblIndex: (this.dtPORTCFS.length > 0) ? Math.max.apply(Math, this.dtPORTCFS.map(function (o) { return o.pk_tblIndex; })) + 1 : 1,
                    PortRecNo: this.PortRecNo,
                    PortPaiddt: this.PortPaidDate.formatted,
                    PortAmount: this.PortAmount,
                    PortRemark: this.PortRemark
                });
            }
            this.resetPort_Dtls();
        }
        else if (type == 'P') {
            this.PortId = pk_tblIndex;
            this.PortRecNo = rcno;
            this.PortPaidDate = this._dataService.stringdttoArry(paydate);
            this.PortAmount = amount;
            this.PortRemark = remark;
        }
        else if (type == 'D') {
            if (confirm("Are you sure you want to delete Steamer Agent Charges No. " + rcno + "?")) {
                this.dtPORTCFS.splice(index, 1);
                this.resetPort_Dtls();
            }
        }
    }
    resetPort_Dtls() {
        this.PortId = 0;
        this.PortRecNo = '';
        this.PortPaidDate = null;
        this.PortAmount = '';
        this.PortRemark = '';
    }

    fnAddEdit_Octroi_Dtls(index, type, pk_tblIndex, rcno, paydate, amount, remark) {
        if (type == 'A') {
            if (!this.OctRecNo) {
                alert("Octroi Receipt No Should not be Empty."); return false;
            }
            if (!this.OctPaidDate) {
                alert("Date Should not be Empty."); return false;
            }
            if (!this.OctAmount) {
                alert("Amount Should not be Empty."); return false;
            }
            if (!this.OctRemark) {
                alert("Remark Should not be Empty."); return false;
            }
            if (this.dtOCTROI.filter(key => key.pk_tblIndex == pk_tblIndex).length > 0) {
                let updateItem = this.dtOCTROI.find(key => key.pk_tblIndex == pk_tblIndex);
                let index = this.dtOCTROI.indexOf(updateItem);
                this.dtOCTROI[index]["OctRecNo"] = this.OctRecNo;
                this.dtOCTROI[index]["OctRecPaidDT"] = this.OctPaidDate.formatted;
                this.dtOCTROI[index]["OctAmount"] = this.OctAmount;
                this.dtOCTROI[index]["OctRemark"] = this.OctRemark;
            }
            else {
                this.dtOCTROI.push({
                    STATUS: 100,
                    fk_ImpoterId: "",
                    Import_Code: "",
                    pk__Octroi_DtlsId: "",
                    pk_tblIndex: (this.dtOCTROI.length > 0) ? Math.max.apply(Math, this.dtOCTROI.map(function (o) { return o.pk_tblIndex; })) + 1 : 1,
                    OctRecNo: this.OctRecNo,
                    OctRecPaidDT: this.OctPaidDate.formatted,
                    OctAmount: this.OctAmount,
                    OctRemark: this.OctRemark
                });
            }
            this.resetOctroi_Dtls();
        }
        else if (type == 'P') {
            this.OctId = pk_tblIndex;
            this.OctRecNo = rcno;
            this.OctPaidDate = this._dataService.stringdttoArry(paydate);
            this.OctAmount = amount;
            this.OctRemark = remark;
        }
        else if (type == 'D') {
            if (confirm("Are you sure you want to delete Octroi No. " + rcno + "?")) {
                this.dtOCTROI.splice(index, 1);
                this.resetOctroi_Dtls();
            }
        }
    }
    resetOctroi_Dtls() {
        this.OctId = 0;
        this.OctRecNo = '';
        this.OctPaidDate = null;
        this.OctAmount = '';
        this.OctRemark = '';
    }

    fnAddEdit_Delivery_Dtls(index, type, pk_tblIndex, oh_truck, truck_value, truck_name, truck_no, truck_type, rate_agreed, date, remark) {
        let OH_truck = "";
        let truck = "";
        let truckValue = "";
        if (type == 'A') {
            if (this.rTruck == 'O') {
                if (!this.TruckOur) {
                    alert("Please Select Truck Value."); return false;
                }
                OH_truck = "OUR";
                truck = this.TruckOurList.find(key => key.DATAVALUEFIELD == this.TruckOur).DATATEXTFIELD;
                truckValue = this.TruckOur;
            } else {
                if (!this.Supplier) { alert("Please Select Supplier."); return false; }
                if (!this.TruckNo) { alert("Truck Number Should not be Empty."); return false; }
                if (!this.TruckType) { alert("Truck Type Should not be Empty."); return false; }
                if (this.rTruck == 'H') {
                    if (!this.RateAgreed) { alert("Rate Agreed Should not be Empty."); return false; }
                    OH_truck = "HIRED";
                } else {
                    OH_truck = "HIREDIMP";
                }
                truck = this.SupplierList.find(key => key.DATAVALUEFIELD == this.Supplier).DATATEXTFIELD;
                truckValue = this.Supplier;
            }

            if (!this.DeliveryDate) { alert("Date Should not be Empty."); return false; }
            if (!this.DeliveryRemark || this.DeliveryRemark == '') { alert("Remark Should not be Empty."); return false; }

            if (this.dtDELIVERY.filter(key => key.pk_tblIndex == pk_tblIndex).length > 0) {
                let updateItem = this.dtDELIVERY.find(key => key.pk_tblIndex == pk_tblIndex);
                let index = this.dtDELIVERY.indexOf(updateItem);
                this.dtDELIVERY[index]["OH_truck"] = OH_truck;
                this.dtDELIVERY[index]["trackValue"] = truckValue;
                this.dtDELIVERY[index]["TruckNo"] = this.TruckNo;
                this.dtDELIVERY[index]["TruckType"] = this.TruckType;
                this.dtDELIVERY[index]["RateAgreed"] = this.RateAgreed;
                this.dtDELIVERY[index]["DelDate"] = this.DeliveryDate.formatted;
                this.dtDELIVERY[index]["DelRemark"] = this.DeliveryRemark;
                this.dtDELIVERY[index]["truck"] = truck;
            }
            else {
                this.dtDELIVERY.push({
                    STATUS: 100,
                    fk_ImpoterId: "",
                    Import_Code: "",
                    pk__Del_DtlsId: "",
                    pk_tblIndex: (this.dtDELIVERY.length > 0) ? Math.max.apply(Math, this.dtDELIVERY.map(function (o) { return o.pk_tblIndex; })) + 1 : 1,
                    OH_truck: OH_truck,
                    trackValue: truckValue,
                    TruckNo: this.TruckNo,
                    TruckType: this.TruckType,
                    RateAgreed: this.RateAgreed,
                    DelDate: this.DeliveryDate.formatted,
                    DelRemark: this.DeliveryRemark,
                    truck: truck
                });
            }
            this.resetDelivery_Dtls();
        }
        else if (type == 'P') {
            this.DeliveryId = pk_tblIndex;
            if (oh_truck == 'OUR') {
                this.rTruck = 'O';
                this.TruckOur = truck_value;
            }
            else {
                this.rTruck = (oh_truck == 'HIRED') ? 'H' : 'HI';
                this.Supplier = truck_value;
            }
            this.TruckNo = truck_no;
            this.TruckType = truck_type;
            this.RateAgreed = rate_agreed;
            this.DeliveryDate = this._dataService.stringdttoArry(date);
            this.DeliveryRemark = remark;
        }
        else if (type == 'D') {
            if (confirm("Are you sure you want to delete Delivery Truck. " + truck_name + "?")) {
                this.dtDELIVERY.splice(index, 1);
                this.resetDelivery_Dtls();
            }
        }
    }
    resetDelivery_Dtls() {
        this.DeliveryId = 0;
        this.rTruck = 'O';
        this.TruckOur = null;
        this.Supplier = null;
        this.TruckNo = '';
        this.TruckType = '';
        this.RateAgreed = '';
        this.DeliveryDate = null;
        this.DeliveryRemark = '';
    }

    ValidateValueAndExchRate(drpCtrl, txtCtrl, AmtCtrl, lblCtrl): boolean {
        if (Math.abs(this[AmtCtrl]) != 0) {
            if (this[drpCtrl] == null) {
                alert("Please select currency for " + lblCtrl + ".");
                document.getElementById(drpCtrl).focus();
                return false;
            }
        }
        if (this[drpCtrl] != null) {
            if (Math.abs(this[txtCtrl]) == 0 || isNaN(this[txtCtrl])) {
                alert("Please enter ExchRate for " + lblCtrl + ".");
                document.getElementById(txtCtrl).focus();
                return false;
            }
        }
        return true;
    }

    LastFreeDateValidation(name, Sname, SnameExpect): boolean {
        if (this[name]) {
            let name1 = this[name];
            let Sname1 = this[Sname];
            let Sname2 = this[SnameExpect];
            if (Sname1 == null) {
                if (Sname2 == null) {
                    alert("Please Enter G. L. Date or Select Vessel first.");
                    return false;
                }
                else {
                    if (this._dataService.DateFromAndToComparision(name1, Sname2) == false) {
                        alert("Last Free Date Should be greater than Expected Arrival Date");
                        return false;
                    }
                }
            }
            else {
                if (this._dataService.DateFromAndToComparision(name1, Sname1.formatted) == false) {
                    alert("Last Free Date Should be greater than G.L Date");
                    return false;
                }
            }
        }
        return true;
    }

    InvoiceDateValidation(name): boolean {
        if (this[name] != null) {
            let name1 = this[name];
            var Sname1 = this.GetLowestEtaDate();
            if (this._dataService.DateFromAndToComparision(Sname1, name1.formatted) == false) {
                Sname1 = "Invoice Date Should be Less than " + Sname1 + " Date";
                alert(Sname1);
                return false;
            }
        } else {
            return true;
        }
    }

    GetLowestEtaDate() {
        let Drp1 = this.VesselName;
        let Drp2 = this.TranshipmentVessel;
        if (Drp1 != Drp2) {
            var TextSplit1, TextSplit2;
            TextSplit1 = Drp1.split('|');
            TextSplit2 = Drp2.split('|');
            if (this._dataService.DateFromAndToComparision(TextSplit2[3], TextSplit1[3]) == true) { return TextSplit1[3]; }
            else { return TextSplit2[3]; }
        }
        else {
            return this.ExpectedArrDate;
        }
    }

    AdvanceTabValidation(ctrlAmount, ctrlDate): boolean {
        if (this[ctrlAmount].trim('normalize') == "") {
            if (this[ctrlDate] != null) {
                alert("Please Enter Advance Recieved");
                return false;
            }
        }
        if (this[ctrlDate] == null) {
            if (this[ctrlAmount].trim('normalize') != "") {
                alert("Please Enter Advance Recieved On");
                return false;
            }
        }
        return true;
    }

    get_CurrencyCode(CtrlName) {
        return (this[CtrlName] != null) ? this[CtrlName].split('|')[0] : "";
    }

    totalValidation(): boolean {
        if(!this.EXWORKS&&!this.CUSTOMCLR&&!this.FREIGHTFRD){ alert("Please Check atleast one checkbox"); document.getElementsByName("ExWork")[0].focus(); return false;}
        if (!this.Importer) { alert("Select Importer..."); return false; }
        if (!this.BusinessAssociate) { alert("Select Business Associate..."); return false; }
        // if (!this.VesselName) { alert("Select Vessel Name..."); return false; }
        // else if (this.DirectVessel == 'NO') {
        //     if (!this.TranshipmentVessel) { alert("Please select Transhipment Vessel."); return false; }
        //     else if (this.VesselName == this.TranshipmentVessel) { alert("Transhipment Vessel and Vessel Name should not be Same for Direct Vessel No."); return false; }
        //     if (!this.TranshipmentPort) { alert("Please select Transhipment Port Name."); return false; }
        // }
        if (!this.MblNo && !this.HblNo) { alert("Please enter any one of following details MBL No. Or HBL No."); document.getElementsByName("MblNo")[0].focus(); return false; }
        else if (this.MblNo != '') {
            if (!this.MblDate) { alert("Please select MBL Date."); return false; }
            else if (!this._dataService.DateFromAndToComparision(this.MblDate.formatted,this._dataService.getCurrentdate())) { alert("MBL Date should be Less than or Equal to " + this._dataService.getCurrentdate()); return false; }
        } else if (this.HblNo != '') {
            if (!this.HblDate)
             { alert("Please select HBL Date."); return false;
             }
            else if (!this._dataService.DateFromAndToComparision(this.HblDate.formatted,this._dataService.getCurrentdate())) { alert("HBL Date should be Less than or Equal to " + this._dataService.getCurrentdate()); return false; }
        } else if (!this.ShipmentPort) { alert("Select Port of Shipment"); return false; }
        else if (this.DescriptionGoods == '') { alert("Description of Goods should not be empty"); document.getElementsByName("DescriptionGoods")[0].focus(); return false; }
        else if (this.NoOfPackages1 == '') { alert("No. of Packages should not be empty"); document.getElementsByName("NoOfPackages1")[0].focus(); return false; }
        else if (!this.TypeOfPackage2) { alert("Select Types of Packages"); return false; }
        else if (this.GrossWeight == '') { alert("Gross Weight should not be empty"); document.getElementsByName("GrossWeight")[0].focus(); return false; }
        else if (this.NetWeight != "") {
            if (Math.abs(this.NetWeight) > Math.abs(this.GrossWeight)) {
                alert("Net Weight Less then or Equal to Gross Weight.");
                document.getElementsByName("NetWeight")[0].focus();
                return false;
            }
        }
        if (this.dtINVOICE.length == 0) 
        { alert("Please Enter Atleast one Invoice No."); 
        document.getElementsByName("InvoiceNo")[0].focus(); 
        return false; }
        else if (!this.Incoterm) 
        { alert("Please select Incoterm.."); 
        return false; 
    }
        else if (this.InvValue == "")
         { alert("Invoice Value should not be empty"); 
         return false; }
        else if (!this.InvCurrency) 
        { alert("Please select Currency of Invoice."); 
        document.getElementById("InvCurrency").focus(); 
        return false; }
        else if (this.InvExchRate == "")
         { alert("Invoice Exch.Rate should not be empty");
          document.getElementById("InvExchRate").focus();
           return false; }
        else if (!this.ValidateValueAndExchRate('InvCurrency', 'InvExchRate', 'InvValue', 'Invoice Value')){ return false;  }        
        else if ( this.FrightEnable==false){ if (!this.ValidateValueAndExchRate('FrightCurrency', 'FrightExchRate', 'FrightAmount', 'Fright Amount')){  return false; }}       
        else if (this.InsurenceEnable==false){if (!this.ValidateValueAndExchRate('InsuranceCurrency', 'InsuranceExchRate', 'InsuranceAmount', 'Insurance Amount')) { return false; }}      
        else if (!this.ValidateValueAndExchRate('CommissionCurrency', 'CommissionExchRate', 'CommissionAmount', 'Commission Amount')) { return false; }
        else if (this.GLDate) {
            if (this.ExpectedArrDate!=null){
            if (!this._dataService.DateFromAndToComparision(this.GLDate.formatted, this.ExpectedArrDate)) {
                alert("G.L.Date Should be Greater than or Equal to Expected Arrival Date.");
                this.GLDate = null;
                return false;
            }
        }
        }
        else if (this.BillOfEntryDate != null) { 
            if (!this._dataService.date2Comparison(this.BillOfEntryDate.formatted,this._dataService.getCurrentdate()))
             { alert("Bill Of Entry Date should be Less than or Equal to " + this._dataService.getCurrentdate()); 
             return false; } 
            }
        //else if (!this.LastFreeDateValidation('LastDate', 'GLDate', 'ExpectedArrDate')) { return false; }
        else if (!this.InvoiceDateValidation('InvoiceDate')) { return false; }
        else if (Math.abs(this.InvValue) != 0) {
            if (Math.abs(this.InvExchRate) == 0) {
                alert("Please enter Exch.Rate for Invoice");
                document.getElementById("InvExchRate").focus();
                return false;
            }
        }
        else if (!this.AdvanceTabValidation('AdvRecOne', 'AdvRecOneDate')) { return false; }
        else if (!this.AdvanceTabValidation('AdvRecTwo', 'AdvRecTwoDate')) { return false; }
        else if (!this.AdvanceTabValidation('AdvRecThree', 'AdvRecThreeDate')) { return false; }
        else if (!this.AdvanceTabValidation('AdvRecFour', 'AdvRecFourDate')) { return false; }
        return true;
    }

    InsertAllDatas(mode) {
        let fk_Imp_Code = this.Importer;
        let fk_BillTo = this.BillTo;

        let Vsl_Air_Split ="0";// this.VesselName.split('|');//Sea
        let fk_Vsl_Air_name ="" ;//Vsl_Air_Split[0];//Sea
        let fk_Agt_name = (this.LinerAgent) ? this.LinerAgent : "";//Sea
        let Trans_vsl_Split ="";// this.TranshipmentVessel.split('|');//Sea
        let fk_Trans_vsl_name = "";//Trans_vsl_Split[0];//Sea

        let ArrivingDateAtICD = (this.ArrivingICD != null) ? this.SqlDate(this.ArrivingICD.formatted) : "";//Sea
        let GlDate = (this.GLDate != null) ? this.SqlDate(this.GLDate.formatted) : "";//Sea
        let Desc_Good = this.DescriptionGoods;//document.getElementById("txtDescGoods").value;//Sea
        let NumOfPkg1 = Math.abs(this.NoOfPackages1);//Sea
        let TypeOfPkg = (this.TypeOfPackage2) ? this.TypeOfPackage2 : ""; //Sea
        let GrossWt = Math.abs(this.GrossWeight);//Sea
        let NetWt = Math.abs(this.NetWeight);//Sea 

        let fk_ArilineId = "";//Air
        let FightNo = "";//Air
        let FightDate = ""//Air
        let fk_ArilineId_Transhipment = ""//Air
        let FightNo_Transhipment = "";//Air
        let FightDate_Transhipment = "";//Air
        let fk_ArrivalPort = "";//Air
        let Exp_Arrival_Date = (this.ExpectedArrDate != null) ? this.SqlDate(this.ExpectedArrDate.formatted) : "";//Air
        let Act_Arrival_Date =(this.ActualArrDate != null) ? this.SqlDate(this.ActualArrDate.formatted) : "";//Air

        let Mbl_Mabl_NO = this.MblNo;
        let Mbl_Mabl_DT = (this.MblDate != null) ? this.SqlDate(this.MblDate.formatted) : "";
        let Bbl_Habl_NO = this.HblNo;
        let Bbl_Habl_DT = (this.HblDate != null) ? this.SqlDate(this.HblDate.formatted) : "";
        let Dir_vessel = (this.DirectVessel == 'YES') ? 'YES' : 'NO';

        let fk_Trans_Port = (this.TranshipmentPort) ? this.TranshipmentPort : "";

        let Bank_Ref_No = this.BankRefNo;
        let Party_Ref_No = this.PartyRefNo;

        let LastFreeDate ;// (this.LastDate != null) ?  this.LastDate  :"";
        

        if(this.FreeLastDate != null){
            let strdate = this.LastDate.split("/");
            let StrSqlDate = strdate[1] + "/" + strdate[0] + "/" + strdate[2];
            LastFreeDate=StrSqlDate;
            }
            else { LastFreeDate= "";}

        let fk_ShipmentPort = (this.ShipmentPort) ? this.ShipmentPort : "";

        let BoeNo = (this.BillOfEntry != null) ? this.BillOfEntryNoList.find(key => key.DATAVALUEFIELD == this.BillOfEntry).DATATEXTFIELD : "";

        let fk_BillOfEntry = (this.BillOfEntry) ? this.BillOfEntry : "";
        let BoeDt = (this.BillOfEntryDate != null) ? this.SqlDate(this.BillOfEntryDate.formatted) : "";
        let BoeRemark = this.BillOfEntryRemark;
        let InvoiceNo = this.InvoiceNo;
        let InvoiceDt = (this.InvoiceDate != null) ? this.SqlDate(this.InvoiceDate.formatted) : "";

        let Incoterm_Split = (this.Incoterm) ? this.Incoterm.split("|")[0] : "";
        let fk_Incoterm = Incoterm_Split;

        let InvoiceValue = Math.abs(this.InvValue);
        let fk_cur_name = this.get_CurrencyCode('InvCurrency');
        let InvExchRate = Math.abs(this.InvExchRate);
        let InvTot = Math.abs(this.InvTotInr);

        let FrightAmt = Math.abs(this.FrightAmount);
        let fk_FrightCur = this.get_CurrencyCode('FrightCurrency');
        let FrightExchRate = Math.abs(this.FrightExchRate);
        let FrightTot = Math.abs(this.FrightTotInr);

        let InsAmt = Math.abs(this.InsuranceAmount);
        let fk_InsCur = this.get_CurrencyCode('InsuranceCurrency');
        let InsExchRate = Math.abs(this.InsuranceExchRate);
        let InsTot = Math.abs(this.InsuranceTotInr);

        let ComAmt = Math.abs(this.CommissionAmount);
        let fk_ComCur = this.get_CurrencyCode('CommissionCurrency');
        let ComExchRate = Math.abs(this.CommissionExchRate);
        let ComTot = Math.abs(this.CommissionTotInr);

        let CifAmt = Math.abs(this.CifAmount);
        let AccessValue = Math.abs(this.AccessableValue);

        let AdvRec1 = Math.abs(this.AdvRecOne);
        let AdvRec1Dt = (this.AdvRecOneDate != null) ? this.SqlDate(this.AdvRecOneDate.formatted) : "";
        let AdvRec2 = Math.abs(this.AdvRecTwo);
        let AdvRec2Dt = (this.AdvRecTwoDate != null) ? this.SqlDate(this.AdvRecTwoDate.formatted) : "";

        let AdvRec3 = Math.abs(this.AdvRecThree);
        let AdvRec3Dt = (this.AdvRecThreeDate != null) ? this.SqlDate(this.AdvRecThreeDate.formatted) : "";
        let AdvRec4 = Math.abs(this.AdvRecFour);
        let AdvRec4Dt = (this.AdvRecFourDate != null) ? this.SqlDate(this.AdvRecFourDate.formatted) : "";
        let ExamDate = (this.ExaminationDate != null) ? this.SqlDate(this.ExaminationDate.formatted) : "";
        let ExamRemark = this.ExaminationRemark;
        let AssessDate = (this.AssessmentDate != null) ? this.SqlDate(this.AssessmentDate.formatted) : "";
        let AssessRemark = this.AssessmentRemark;
        let CustomClerk = this.CustomClerk;
        let DockClerk = this.DockClerk;
        let imp_id = this.ImportId;
        let Remark = this.ImpRemark;
        let Doc_Cancel = (this.DocumentCancel) ? 'Y' : 'N';
        let BusinessAssociate = (this.BusinessAssociate) ? this.BusinessAssociate : "";
        let billofentryNo = this.BillOfEntryNo;

        let _jsonData = {
            ImpMode: "Sea",
            imp_id: imp_id,
            fk_Imp_Code: fk_Imp_Code,
            fk_Vsl_Air_name: fk_Vsl_Air_name,
            fk_Agt_name: fk_Agt_name,
            Mbl_Mabl_NO: Mbl_Mabl_NO,
            Mbl_Mabl_DT: Mbl_Mabl_DT,
            Bbl_Habl_NO: Bbl_Habl_NO,
            Bbl_Habl_DT: Bbl_Habl_DT,
            Dir_vessel: Dir_vessel,
            fk_Trans_vsl_name: fk_Trans_vsl_name,
            fk_Trans_Port: fk_Trans_Port,
            Bank_Ref_No: Bank_Ref_No,
            Party_Ref_No: Party_Ref_No,
            GlDate: GlDate,
            LastFreeDate: LastFreeDate,
            fk_ShipmentPort: fk_ShipmentPort,
            Desc_Good: Desc_Good,
            NumOfPkg1: NumOfPkg1,
            TypeOfPkg: TypeOfPkg,
            GrossWt: GrossWt,
            NetWt: NetWt,
            BoeNo: BoeNo,
            BoeDt: BoeDt,
            BoeRemark: BoeRemark,
            InvoiceNo: InvoiceNo,
            InvoiceDt: InvoiceDt,
            fk_Incoterm: fk_Incoterm,
            InvoiceValue: InvoiceValue,
            fk_cur_name: fk_cur_name,
            InvExchRate: InvExchRate,
            InvTot: InvTot,
            FrightAmt: FrightAmt,
            fk_FrightCur: fk_FrightCur,
            FrightExchRate: FrightExchRate,
            FrightTot: FrightTot,
            InsAmt: InsAmt,
            fk_InsCur: fk_InsCur,
            InsExchRate: InsExchRate,
            InsTot: InsTot,
            ComAmt: ComAmt,
            fk_ComCur: fk_ComCur,
            ComExchRate: ComExchRate,
            ComTot: ComTot,
            CifAmt: CifAmt,
            AccessValue: AccessValue,
            AdvRec1: AdvRec1,
            AdvRec1Dt: AdvRec1Dt,
            AdvRec2: AdvRec2,
            AdvRec2Dt: AdvRec2Dt,
            AdvRec3: AdvRec3,
            AdvRec3Dt: AdvRec3Dt,
            AdvRec4: AdvRec4,
            AdvRec4Dt: AdvRec4Dt,
            ExamDate: ExamDate,
            ExamRemark: ExamRemark,
            AssessDate: AssessDate,
            AssessRemark: AssessRemark,
            CustomClerk: CustomClerk,
            DockClerk: DockClerk,
            fk_BillTo: fk_BillTo,
            fk_BillOfEntry: fk_BillOfEntry,
            MakerID: this._loginService.getLogin()[0].CMPID,
            MakerIP: this._loginService.getLogin()[0].MAKERIP,
            Citycode1: this._loginService.getLogin()[0].CITYCODE1,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            ArrivingDateAtICD: ArrivingDateAtICD,
            Doc_Cancel: Doc_Cancel,
            Remark: Remark,
            fk_ArilineId: fk_ArilineId,
            FightNo: FightNo,
            FightDate: FightDate,
            fk_ArilineId_Transhipment: fk_ArilineId_Transhipment,
            FightNo_Transhipment: FightNo_Transhipment,
            FightDate_Transhipment: FightDate_Transhipment,
            fk_ArrivalPort: fk_ArrivalPort,
            Exp_Arrival_Date: Exp_Arrival_Date,
            Act_Arrival_Date: Act_Arrival_Date,
            BusinessAssociate: BusinessAssociate,
            Bill_EntryNO: billofentryNo,
            EXWORKS: (this.EXWORKS) ? "EX" : "",
            CUSTOM_CLR: (this.CUSTOMCLR) ? "CUSTOM" : "",
            FREIGHT_FRD: (this.FREIGHTFRD) ? "FRTFRD" : "",

            VSL_NAME: this.VesselName,
            VSL_VOYAGENO: this.voyno,
            VSL_IGMNO:this.IGMNo,
            VSL_ARRIVALPORT:this.ArrivalPort,
            VSL_ARRIVALPORTPOD: this.ArrivalPortPOD,
            VSL_BERTHNO:this.ShedNo,           
            FINAL_DESTPORT:this.Finaldest,
            ARRV_DTFINALDEST:this.dtfinaldest,
            ONLINE_SUB_DT:(this.onlinesuubDt != null) ? this.SqlDate(this.onlinesuubDt.formatted) : "",
            ONLINE_SUB_BY:(this.submissionBy != null) ? this.submissionBy : 0  ,
            DUTY_AMT:(this.dutyamt != null) ? this.dutyamt : 0  ,
            STAMP_DUTY:(this.StampDutyAmt != null) ? this.StampDutyAmt : 0   ,
            DUTYPAIDBY:this.DutyPaidBy,
            DO_RECEIVED_ON:(this.DOrecvdOn != null) ? this.SqlDate(this.DOrecvdOn.formatted) : "" ,
            DELIVERY_VALIDATE_BY:(this.validatedt != null) ? this.SqlDate(this.validatedt.formatted) : "",// (this.validateby != null) ? this.validateby : ''  ,
            DELIVERYMODE:this.deliverymode,
            // ,
            // IGMdt:(this.IGMdt != null) ? this.SqlDate(this.IGMdt.formatted) : "",

            DateOfRod: this.dtDATEOFROD,
            Goods: this.dtGOOD,
            Boe: this.dtDOCSUB,
            Duty: this.dtDUTY,
            SteAgent: this.dtSTEAGENT,
            Port: this.dtPORTCFS,
            Octroi: this.dtOCTROI,
            Delivery: this.dtDELIVERY,
            Invoice: this.dtINVOICE,
            DocCallForUs: this.dtCALLFORUS,

        }
        this._loaderService.display(true);
        this._dataService.Common("Import/Import_Iu", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table1[0].STATUS == '100') {
                    if (this.ImportId == 0) {
                        alert("The Import Code " + data.Table1[0].Import_Code + " Inserted Successfully!");
                        this.resetAllData();
                    }
                    else {
                        alert("The Import Code " + data.Table1[0].Import_Code + " Updated Successfully!");
                        this._router.navigate(['/import/sea/entry-data']);
                    }
                } else {
                    alert(data.Table[0].STATUSTEXT);
                }
            });
    }
    OnChangeArrivalDt(date)
    { 
        let strdate = date.formatted.split("/");
        let StrSqlDate = strdate[1] + "/" + strdate[0] + "/" + strdate[2];
        let yourDate =this._dataService.addDays(StrSqlDate,2);
        this.LastDate=yourDate;
        this.FreeLastDate=yourDate;
    }

    SqlDate(strdateP) {
        if (strdateP != "" || strdateP != undefined) {
            let strdate = strdateP.split("/");
            let StrSqlDate = strdate[1] + "/" + strdate[0] + "/" + strdate[2];
            return StrSqlDate;
        }
        else return "";
    }

    submit() {
        if (!this.totalValidation()) { return false; }
        this.InsertAllDatas('Sea');
    }

    abort() {
        if (this.ImportId == 0) {
            this.resetAllData();
        } else {
            this._router.navigate(['/import/sea/entry-data']);
        }
    }

    resetAllData() {
        this.hdInvHasRec = '0';
        this.Iu_Mode = '';
        this.Mode = '';
        this.ImportId = '0';
        this.Importer = null;
        this.BillTo = null;
        this.VesselName = null;
        this.LinerAgent = null;
        this.BusinessAssociate = null;
        this.MblNo = '';
        this.MblDate = null;
        this.HblNo = '';
        this.HblDate = null;
        this.DirectVessel = 'YES';
        this.EXWORKS = false;
        this.CUSTOMCLR = false;
        this.FREIGHTFRD = false;
        this.TranshipmentVessel = null;
        this.TranshipmentPort = null;
        this.ArrivalPort = '';
        this.ShedNo = '';
        this.ExpectedArrDate = null;
        this.ActualArrDate = null;
        this.ArrivingICD = null;
        this.BankRefNo = '';
        this.PartyRefNo = '';
        this.GLDate = null;
        this.LastDate = null;
        this.ShipmentPort = null;
        this.DocumentCancel = false;
        this.RODdtID = 0;;
        this.RODDate = null;
        this.RODRemark = '';
        this.DocCallForUsID = 0;
        this.DocumentName = '';
        this.DocumentRecOn = null;
        this.DescriptionGoods = '';
        this.NoOfPackages1 = '';
        this.TypeOfPackage2 = null;
        this.GrossWeight = '';
        this.NetWeight = '';
        this.ContId = 0;
        this.ContNo = '';
        this.ContLength = null;
        this.ContType = null;
        this.ContNoOfPackage = '';
        this.BillOfEntry = null;
        this.BillOfEntryNo = '';
        this.BillOfEntryDate = null;
        this.BillOfEntryRemark = '';
        this.CustomId = 0;
        this.CustomDocumentName = '';
        this.CustomSubmittedOn = null;
        this.CustomRemark = '';
        this.InvoiceId = 0;
        this.InvoiceNo = '';
        this.InvoiceDate = null;
        this.Incoterm = null;
        this.BriefIncoterm = '';
        this.FrightEnable = false;
        this.InsurenceEnable = false;
        this.LocalCurrency = {
            abb: '',
            cur: '',
            curname: ''
        };
        this.InvValue = '';
        this.InvCurrency = null;
        this.InvExchRate = '';
        this.InvTotInr = '0';
        this.FrightAmount = '';
        this.FrightCurrency = null;
        this.FrightExchRate = '';
        this.FrightTotInr = '0';
        this.InsuranceAmount = '';
        this.InsuranceCurrency = null;
        this.InsuranceExchRate = '';
        this.InsuranceTotInr = '0';
        this.CommissionAmount = '';
        this.CommissionCurrency = null;
        this.CommissionExchRate = '';
        this.CommissionTotInr = '0';
        this.CifAmount = '0';
        this.AccessableValue = '0';
        this.DutyId = 0;
        this.DutyPaid = '';
        this.DutyIns = '';
        this.DutyPaidOnDate = null;
        this.DutyCashNo = '';
        this.DutyRemark = '';
        this.AdvRecOne = '';
        this.AdvRecOneDate = null;
        this.AdvRecTwo = '';
        this.AdvRecTwoDate = null;
        this.AdvRecThree = '';
        this.AdvRecThreeDate = null;
        this.AdvRecFour = '';
        this.AdvRecFourDate = null;
        this.ExaminationDate = null;
        this.ExaminationRemark = '';
        this.AssessmentDate = null;
        this.AssessmentRemark = '';
        this.CustomClerk = '';
        this.DockClerk = '';
        this.SteId = 0;
        this.SteTypeCharge = '';
        this.SteRecNo = '';
        this.StePayDate = null;
        this.SteAmount = '';
        this.SteRemark = '';
        this.PortId = 0;
        this.PortRecNo = '';
        this.PortPaidDate = null;
        this.PortAmount = '';
        this.PortRemark = '';
        this.OctId = 0;
        this.OctRecNo = '';
        this.OctPaidDate = null;
        this.OctAmount = '';
        this.OctRemark = '';
        this.DeliveryId = 0;
        this.rTruck = 'O';
        this.TruckOur = null;
        this.Supplier = null;
        this.TruckNo = '';
        this.TruckType = '';
        this.RateAgreed = '';
        this.DeliveryDate = null;
        this.DeliveryRemark = '';
        this.ImpRemark = '';
        this.VesselName = '';
        this.voyno = '';
        this.IGMNo = '';
        this.ArrivalPort = '';
        this.ShedNo = ''; 
        this.Finaldest = '';
        this.dtfinaldest = null;
        this.onlinesuubDt=null;
        this.submissionBy = '0';
        this.dutyamt = '';
        this.StampDutyAmt = '';
        this.DutyPaidBy = '';
        this.DOrecvdOn = null;
        this.validatedt = null;
        this.deliverymode = '';
        this.IGMdt=null;
        this.FreeLastDate=null;

    }
}
