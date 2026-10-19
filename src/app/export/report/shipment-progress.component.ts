import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    templateUrl: 'shipment-progress.component.html',
    styleUrls: ['./export-report-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ShipmentProgressReportComponent implements OnInit {
    CityList: Array<any> = [];
    ReportType: string = 'Sea';
    City: string  = '';
    FromDate: any = null;
    ToDate:any = null;
    DateType: string = 'actual';
    DisplayType: string = '0';

    /** Presentation (from MPERPNG-20): drives the Display Type option pills.
     *  Values and order unchanged from the original nine radio buttons. */
    readonly displayTypeOptions: Array<{ value: string; label: string }> = [
        { value: '0', label: 'DocRecd On' },
        { value: '1', label: 'Approval Received On' },
        { value: '2', label: 'Shipping Bill Dt' },
        { value: '3', label: 'Custom Cleared On' },
        { value: '4', label: 'CargoRecd On' },
        { value: '5', label: 'EpCopy Received On' },
        { value: '6', label: 'Carting Date' },
        { value: '7', label: 'EpCopy Sent On' },
        { value: '8', label: 'Out of Charge Date' },
    ];

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
                this.CityList = (data && data.Table) || [];
                this.City = this._loginService.getLogin()[0].CITYCODE1;
                this._loaderService.display(false);
               
            });
    }

    /** Presentation (from MPERPNG-20): period-preset buttons above From/To.
     *  Sets the same my-date-picker models the pickers already use. */
    setPreset(months: number) {
        const to = new Date();
        const from = new Date(to.getFullYear(), to.getMonth() - months, to.getDate());
        this.FromDate = this._dataService.stringdttoArry(this.fmtDMY(from));
        this.ToDate = this._dataService.stringdttoArry(this.fmtDMY(to));
    }

    private fmtDMY(d: Date): string {
        const p = (n: number) => ('0' + n).slice(-2);
        return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
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