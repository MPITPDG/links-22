import { Component ,OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    templateUrl: 'delivery-status.component.html'
})
export class DeliveryStatusReportComponent implements OnInit {
    CityList: Array<any> = [];
    ConsigneeList: Array<any> = [];
    ReportType: string = '0.CONSIGNEE LINER CONTRACT';
    City: string  = '';
    Consignee: string = '0';
    FromDate: any = null;
    ToDate:any = null;

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
        private _loginService: LoginService,
        private _loaderService: LoaderService) {
    }

    ngOnInit(){
        this._loginService.verifyRights('21', '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('View', data);  //For verify user access
            });
        this.pageLoad();
    }

    pageLoad(){
        this.getCityData();
        this.getConsigneeData();
    }

    getCityData(){
        this._loaderService.display(true);
        this._dataService.getData("Common/getCityList", {})
            .subscribe((data: any) => {
                this.CityList = data.Table;
                this.City = this._loginService.getLogin()[0].CITYCODE;
                this._loaderService.display(false);
               
            });
    }

    getConsigneeData(){
        this._loaderService.display(true);
        this._dataService.getData("Common/getConsigneeList", {})
            .subscribe((data: any) => {
                this.ConsigneeList = data.Table;
                this._loaderService.display(false);
            });
    }

    onSearch() {
        if(this.City==null){
            alert("Please select City");
            return false;
        }
        if(this.FromDate==null){
            alert("Please select From date");
            return false;
        }if(this.ToDate==null){
            alert("Please select To date");
            return false;
        }
        if(this._dataService.dateTWoComparison(this.FromDate.formatted,this.ToDate.formatted)){
            alert("To date must be greater than from date");
            return false;
        }
        this._loaderService.display(true);
        let _jsonGet = {
            mode: this.ReportType,
            citycode: this.City,
            supplier: (this.Consignee!=null)? this.Consignee : '0',
            fromdate: this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate.formatted),
            todate: this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate.formatted)
        };
        this._dataService.getDownload("Export/Generate_Delivery_Status", _jsonGet,{responseType:'arraybuffer'})
            .subscribe((data: any) => {
                this._dataService.commonDownloadExcelFile(data, "Delivery_Status"+this._dataService.timeFormatAMPM()+".xls");
                this._loaderService.display(false);
               
            });
    }
}