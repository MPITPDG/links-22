import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-print-document-annexure-edit',
    templateUrl: 'edit-annexure.component.html'
})
export class EditAnnexureComponent implements OnInit {
    @ViewChild('searchButton', {static: false}) searchButton: ElementRef;
    @Output() result = new EventEmitter();
    @Input() exptno: any;

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

    datasetTable: Array<any> = [];
    datasetTable1: Array<any> = [];
    datasetTable2: Array<any> = [];
    datasetTable3: Array<any> = [];
    datatableContainer: Array<any> = [];
    datasetTable5: Array<any> = [];
    datatableExchangeRate: Array<any> = [];

    ExporterAddress: any = '';
    ExporterType: any = '';
    ExporterTypeA: any = '';
    ConsigneeAddress: any = '';
    ConsigneeCountry: any = '';
    PortOfDestination: any = '';
    FinalDestination: any = '';
    Parameter: string = 'yes';
    FactoryStuffed: string = ''; 
    SampleAccompanied: string = ''; 
    NatureOfCargo: string = '';
    MarksAndNumber: string = '';
    NoOfLoosePacket: string = '';
    NoOfContainers: string = '';
    NetWeight: string = '';
    UnitOfMeasurement: string = '';
    RotationDate: any = null;
    FactoryStuffedAir: string = '';
    Agency: string = '';
    MarksAndNumberAir: string = '';
    SampleAccompaniedAir: string = '0';
    NoOfLoosePacketAir: string = '';
    UnitOfMeasurementAir: string = '';
    PeriodPaymentContract: string = '';
    NameAddressOfBuyer: string = '';

    ExporterDesignation: string = '';
    CHADesignation: string = '';
    IdCardNo: string = '';
    DDate: any = null;

    Commission: Number = 0;
    DiscountFobRate: Number = 0;
    PackingMiscCharges: Number = 0;
    OtherDeduction: Number = 0;
    Freight: Number = 0;
    Insurance: Number = 0;

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this.pageLoad(this.exptno);
    }

    pageLoad(exptno) {
        this._loaderService.display(true);
        const _jsonData = {
            exptno: exptno,
            citycode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData("Export/AnnexureEditPopulateData", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.datasetTable = data.Table;
                this.datasetTable1 = data.Table1;
                this.datasetTable2 = data.Table2;
                this.datasetTable3 = data.Table3;
                if (data.Table4.length > 0) {
                    this.datatableContainer = data.Table4;
                } else {
                    this.datatableContainer = [{ ID: 0, CONTAINERNO: '', SIZE: '', SEALNO: '', SEALDATE: '', PSTUFFED: '' }];
                }

                this.datasetTable5 = data.Table5;
                if (data.Table6.length > 0) {
                    this.datatableExchangeRate = data.Table6;
                } else {
                    this.datatableExchangeRate = [{ ID: 0, CODE: '', UNIT: '', EXCHANGE_RATE: '', EFFECTIVE_DATE: null, BANK_NAME: '', CERTIFICATE_NO: '', CERTIFICATE_DATE: null }];
                }

                this.ExporterAddress = (this.datasetTable.length > 0) ? this.datasetTable[0].SHIPPER : "";
                if (this.ExporterAddress == "") {
                    this.ExporterAddress = (this.datasetTable1.length > 0)? this.datasetTable1[0].EXP_ADD1
                        + "\n" + this.datasetTable1[0].EXP_ADD2
                        + "\n" + this.datasetTable1[0].EXP_ADD3
                        + "\n" + this.datasetTable1[0].EXP_CITYNAME
                        + " " + this.datasetTable1[0].EXP_PINCODE
                        + " " + this.datasetTable1[0].EXP_COUNTRYNAME : "";
                }

                this.ExporterType = (this.datasetTable.length > 0) ? this.datasetTable[0].EXPTYPEB.substring(0, 3) : "";
                if (this.ExporterType == "") {
                    this.ExporterType = (this.datasetTable1.length > 0) ? this.datasetTable1[0].EXPTYPEB : "";
                }

                this.ExporterTypeA = (this.datasetTable.length > 0) ? this.datasetTable[0].EXPTYPEA.substring(0, 3) : "";
                if (this.ExporterTypeA == "") {
                    this.ExporterTypeA = (this.datasetTable1.length > 0) ? this.datasetTable1[0].EXPTYPEA : "";
                }

                this.ConsigneeAddress = (this.datasetTable.length > 0) ? this.datasetTable[0].CONSIGNEE : "";
                if (this.ConsigneeAddress == "") {
                    this.ConsigneeAddress =  (this.datasetTable1.length > 0)? (this.datasetTable1[0].CON_ADD1
                        + "\n" + this.datasetTable1[0].CON_ADD2
                        + "\n" + this.datasetTable1[0].CON_ADD3
                        + "\n" + this.datasetTable1[0].CON_CITYNAME
                        + " " + this.datasetTable1[0].CON_PINCODE
                        + " " + this.datasetTable1[0].CON_COUNTRYNAME).trim() : "";
                }
                this.ConsigneeCountry = (this.datasetTable1.length > 0)? this.datasetTable1[0].CON_COUNTRYNAME : "";
                this.PortOfDestination = (this.datasetTable1.length > 0)? this.datasetTable1[0].POD_CITYNAME : "";
                this.FinalDestination = (this.datasetTable1.length > 0)? this.datasetTable1[0].DESTINATION_COUNTRYNAME : "";

                this.FactoryStuffed = (this.datasetTable.length > 0) ? this.datasetTable[0].STUFFING : "";
                this.SampleAccompanied = (this.datasetTable.length > 0) ? this.datasetTable[0].SAMPLE : "";
                this.NatureOfCargo = (this.datasetTable.length > 0) ? this.datasetTable[0].CARGOSTAT : "";
                this.MarksAndNumber =  (this.datasetTable1.length > 0)? (this.datasetTable1[0].EXPT_MARKS).trim() : "";

                this.NoOfLoosePacket = (this.datasetTable.length > 0) ? this.datasetTable[0].NOOFPKT : "";
                if (this.NoOfLoosePacket == "") {
                    this.NoOfLoosePacket = (this.datasetTable1.length > 0) ? this.datasetTable1[0].EXPT_NOOFPCS + " " + this.datasetTable1[0].EXPT_TYPEOFPCS : "";
                }

                this.UnitOfMeasurement = (this.datasetTable.length > 0) ? this.datasetTable[0].UNIT : "";

                this.FactoryStuffedAir = (this.datasetTable.length > 0) ? this.datasetTable[0].STUFFING : "";
                this.Agency = (this.datasetTable.length > 0) ? this.datasetTable[0].AGENCY : "";
                this.MarksAndNumberAir = (this.datasetTable1.length > 0) ? (this.datasetTable1[0].EXPT_MARKS).trim() : "";
                this.SampleAccompaniedAir = (this.datasetTable.length > 0) ? this.datasetTable[0].SAMPLE : "";
                this.NoOfLoosePacketAir = (this.datasetTable1.length > 0) ? this.datasetTable1[0].EXPT_NOOFPCS + " " + this.datasetTable1[0].EXPT_TYPEOFPCS : "";
                this.UnitOfMeasurementAir = (this.datasetTable.length > 0) ? this.datasetTable[0].UNIT : "";
                this.RotationDate = (this.datasetTable1.length > 0) ? (this.datasetTable1[0].VSL_RTDATE != '') ? this.datasetTable1[0].VSL_RTDATE : null : null;
                this.PeriodPaymentContract = (this.datasetTable.length > 0) ? this.datasetTable[0].PERIOD : "";
                if (this.PeriodPaymentContract == "") {
                    this.PeriodPaymentContract = (this.datasetTable1.length > 0) ? this.datasetTable1[0].PERIODOFPAYMENT : "";
                }

                this.NameAddressOfBuyer =  (this.datasetTable1.length > 0)? (this.datasetTable1[0].CON_ADD1
                    + "\n" + this.datasetTable1[0].CON_ADD2
                    + "\n" + this.datasetTable1[0].CON_ADD3
                    + "\n" + this.datasetTable1[0].CON_CITYNAME
                    + " " + this.datasetTable1[0].CON_PINCODE
                    + " " + this.datasetTable1[0].CON_COUNTRYNAME).trim() : "" ;

                this.Commission =  (this.datasetTable1.length > 0)? this.datasetTable1[0].INVCOMMISSION : "" ;
                this.DiscountFobRate =  (this.datasetTable1.length > 0)? this.datasetTable1[0].INVDISCOUNT : "" ;
                this.PackingMiscCharges = (this.datasetTable.length > 0) ? this.datasetTable[0].MISC : '';
                this.OtherDeduction =  (this.datasetTable1.length > 0)? this.datasetTable1[0].INVDEDUCTAMT : "" ;
                this.Freight =  (this.datasetTable1.length > 0)? this.datasetTable1[0].EXPT_FREIGHT : "" ;
                this.Insurance =  (this.datasetTable1.length > 0)? this.datasetTable1[0].EXPT_INSAMT : "" ;

                this.ExporterDesignation = (this.datasetTable.length > 0) ? this.datasetTable[0].SDES : '';
                this.CHADesignation = (this.datasetTable.length > 0) ? this.datasetTable[0].CDES : '';
                this.IdCardNo = (this.datasetTable.length > 0) ? this.datasetTable[0].IDNO : '';

                this.DDate = (this.datasetTable.length > 0) ?
                    (this.datasetTable[0].DDATE != '') ? this._dataService.stringdttoArry(this.datasetTable[0].DDATE) : this._dataService.stringdttoArry(this._dataService.getCurrentdate())
                    : this._dataService.stringdttoArry(this._dataService.getCurrentdate());

            });
    }

    addRow(type) {
        if (type == 'CONTAINER') {
            this.datatableContainer.push({ ID: 0, CONTAINERNO: '', SIZE: '', SEALNO: '', SEALDATE: '', PSTUFFED: '' });
        } else if (type == 'EXCHANGERATE') {
            this.datatableExchangeRate.push({ ID: 0, CODE: '', UNIT: '', EXCHANGE_RATE: '', EFFECTIVE_DATE: null, BANK_NAME: '', CERTIFICATE_NO: '', CERTIFICATE_DATE: null });
        }
    }

    removeRow(type, index) {
        if (type == 'CONTAINER') {
            this.datatableContainer.splice(index, 1);
        } else if (type == 'EXCHANGERATE') {
            this.datatableExchangeRate.splice(index, 1);
        }
    }

    backToEdit() {
        this.result.emit({ exptno: this.exptno, view: 998 });
    }

    nextSubmit() {
        if (this.ExporterAddress == '') {
            alert("Please enter exporter address");
            return false;
        } else if (this.ConsigneeAddress == '') {
            alert("Please enter consignee address");
            return false;
        } else if (this.FactoryStuffed == '') {
            alert("Please select [ Y ] for Factory Stuffing and [ N ] for Dock Stuffing");
            return false;
        }


        let strContainerData = '', strExchangeRateData = '';
        this.datatableContainer.forEach((key) => {
            if (key.CONTAINERNO != '') {
                let sealDate = (key.SEALDATE!=null) ? key.SEALDATE.formatted : '';
                strContainerData += key.ID
                    + '@' + this.exptno
                    + '@' + key.CONTAINERNO
                    + '@' + key.SIZE
                    + '@' + key.SEALNO
                    + '@' + String(sealDate)
                    + '@' + key.PSTUFFED + '|';
            }
        });

        this.datatableExchangeRate.forEach((key) => {
            if (key.CODE != '') {
                let effectiveDate = (key.EFFECTIVE_DATE!=null) ? key.EFFECTIVE_DATE.formatted : '';
                let certificateDate = (key.CERTIFICATE_DATE!=null) ? key.CERTIFICATE_DATE.formatted : '';
                strExchangeRateData += key.ID
                    + '@' + this.exptno
                    + '@' + key.CODE
                    + '@' + key.UNIT
                    + '@' + key.EXCHANGE_RATE
                    + '@' + String(effectiveDate)
                    + '@' + key.BANK_NAME
                    + '@' + key.CERTIFICATE_NO
                    + '@' + String(certificateDate) + '|';
            }
        });

        const _jsonData = {
            ExptNo: this.exptno,
            Parameter: this.Parameter,
            Sample: this.SampleAccompanied,
            CargoStatus: this.NatureOfCargo,
            NoOfPcs: this.NoOfLoosePacket,
            NoOfContainer: this.NoOfContainers,
            Unit: this.UnitOfMeasurement,
            RotationDate: (this.RotationDate != null) ? this.RotationDate.formatted : '',
            PeriodPaymentContract: this.PeriodPaymentContract,
            ExporterDesignation: this.ExporterDesignation,
            DDate: (this.DDate != null) ? this.DDate.formatted : '',
            CHADesignation: this.CHADesignation,
            IdCardNo: this.IdCardNo,
            EXPTYPEA: (this.ExporterTypeA!=null)? this.ExporterTypeA : '',
            EXPTYPEB: (this.ExporterType!=null)? this.ExporterType : '',
            MarksAndNumber: this.MarksAndNumber,
            Commission: this.Commission,
            Discount: this.DiscountFobRate,
            Misc: this.PackingMiscCharges,
            Deduction: this.OtherDeduction,
            Freight: this.Freight,
            Insurance: this.Insurance,
            Stuffing: this.FactoryStuffed,
            Shipper: this.ExporterAddress,
            Consignee: this.ConsigneeAddress,
            Agency: this.Agency,
            ConsigneeCountry: this.ConsigneeCountry,
            Pod: this.PortOfDestination,
            FinalDestination: this.FinalDestination,
            NameAddressOfBuyer: this.NameAddressOfBuyer,
            StrContainer: strContainerData,
            StrExchangeRate: strExchangeRateData,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            MakerId: this._loginService.getLogin()[0].CMPID
        };
        
        this._loaderService.display(true);
        this._dataService.Common("Export/AnnexureEditIU", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if(data.Table[0]["STATUS"]===100){
                    alert("Annexure updated successfully");
                    this.result.emit({ exptno: this.exptno, view: 998});
                }else{
                    alert("Something went wrong");
                }

            });
    }
}