import { Component ,OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    templateUrl: 'shipment-progress.component.html'
})
export class ShipmentProgressReportComponent implements OnInit {
    CityList: Array<any> = [];
    ReportType: string = 'Sea';
    City: string  = '';
    FromDate: any = null;
    ToDate:any = null;
    DateType: string = 'actual';
    DisplayType: string = '0';

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
        this._loginService.verifyRights('23', '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('View', data);  //For verify user access
            });
        this.pageLoad();
    }

    pageLoad(){
        this.getCityData();
    }

    getCityData(){
        this._loaderService.display(true);
        this._dataService.getData("Common/getCityList", {})
            .subscribe((data: any) => {
                this.CityList = data.Table;
                this.City = this._loginService.getLogin()[0].CITYCODE1;
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
            citycode1: this.City,
            fromdate: this.FromDate.formatted,
            todate: this.ToDate.formatted,
            datetype: this.DateType,
            displaytype: this.DisplayType,
            cmpcode: this._loginService.getLogin()[0].CMPCODE,
            citycode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getDownload("Export/Generate_Shipment_Progress", _jsonGet,{responseType:'arraybuffer'})
            .subscribe((data: any) => {
                this._dataService.commonDownloadExcelFile(data, "DataEntry_Progress"+this._dataService.timeFormatAMPM()+".xls");
                this._loaderService.display(false);
            });
    }
}