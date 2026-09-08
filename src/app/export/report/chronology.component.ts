import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    templateUrl: 'chronology.component.html'
})
export class ChrnologyReportComponent implements OnInit {
    CityList: Array<any> = [];
    ReportType: string = 'Sea';
    City: string = '';
    FromDate: any = null;
    ToDate: any = null;
    listShipper:any=[];
    Shipper: string= "-1";
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
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService) {
    }

    ngOnInit() {
        this._loginService.verifyRights('20', '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('View', data);  //For verify user access
            });
        this.pageLoad();
    }

    pageLoad() {
        this._loaderService.display(true);
        this._dataService.getData("Common/getCityList", {})
            .subscribe((data: any) => {
                this.CityList = data.Table;
                this.City = this._loginService.getLogin()[0].CITYCODE1;
                //console.log("City ", data);
                this._loaderService.display(false);

            });

            // this._dataService.getAll("Export/Fill_dsr_PAGELOAD")
            // .subscribe((data: any) => {
            //         this.listShipper=data.Table3
            // });
    }

    onSearch() {
        if (this.City == null) {
            alert("Please select City");
            return false;
        }
        if (this.FromDate == null) {
            alert("Please select From date");
            return false;
        } if (this.ToDate == null) {
            alert("Please select To date");
            return false;
        }
        if (this._dataService.dateTWoComparison(this.FromDate.formatted, this.ToDate.formatted)) {
            alert("To date must be greater than from date");
            return false;
        }
        let _jsonGet = {
            mode: this.ReportType,
            citycode1: this.City,
            fromdate: this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate.formatted),
            todate: this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate.formatted),
            cmpcode: this._loginService.getLogin()[0].CMPCODE,
            // shipper:this.Shipper
        };
        this._loaderService.display(true);
        this._dataService.getDownload("Export/Generate_Chronology", _jsonGet, { responseType: 'arraybuffer' })
            .subscribe((data: any) => {
                this._dataService.commonDownloadExcelFile(data, "Chronology" + this._dataService.timeFormatAMPM() + ".xls");
                this._loaderService.display(false);
            });
    }
}