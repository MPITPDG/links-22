import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
@Component({
    templateUrl: 'docket-print.component.html'
})
export class DocketPrintComponent implements OnInit {
    paramData: any = { exptno: null };
    dataTable: Array<any> = [];
   // dataTable1: Array<any> = [];
    dataTable2: Array<any> = [];
    dataTable3: Array<any> = [];
    lengthData: number = 0;
   dataTable1 : any [];
   billto :string="";
    constructor(
        private _dataService: DataService,
        private _route: ActivatedRoute,
        private _loginService: LoginService) { }


    ngOnInit() {
        this._route.params.subscribe(params => {
            this.paramData = {
                exptno: params["exptno"]
            }
           
            this.pageLoad(this.paramData);
        });

    }

    pageLoad(paramData: any) {
        let exptno ;
        if(this._loginService.getLogin()[0].CITYCODE =='LIL' ||this._loginService.getLogin()[0].CITYCODE =='PAR')
        {
            exptno=this._loginService.getLogin()[0].CMPCODE+ this._loginService.getLogin()[0].CMPCODE+ paramData.exptno
        }
        else
        {
            exptno= paramData.exptno
        }
        const _jsonData = {
            exptno: exptno
        };
        this._dataService.getData("Export/DocketPrint", _jsonData)
            .subscribe((data: any) => {
                this.lengthData = 1;
                if (data.Table.length > 0) {
                    data.Table[0].HSTUFFED = (data.Table[0].HSTUFFED == null) ? '' : data.Table[0].HSTUFFED;
                    data.Table[0].STUFFWHERE = (data.Table[0].STUFFWHERE == null) ? '' : data.Table[0].STUFFWHERE;
                    data.Table[0].CARGORECD = (data.Table[0].CARGORECD == null) ? '' : data.Table[0].CARGORECD;
                    data.Table[0].DIRECTVSL = (data.Table[0].DIRECTVSL == null) ? '' : data.Table[0].DIRECTVSL;
                    data.Table[0].AGT_NAME = (data.Table[0].AGT_NAME == null) ? '' : data.Table[0].AGT_NAME;
                    data.Table[0].CARTCLERK = (data.Table[0].CARTCLERK == null) ? '' : data.Table[0].CARTCLERK;
                    data.Table[0].CARTEDDT = (data.Table[0].CARTEDDT == null) ? '' : data.Table[0].CARTEDDT;
                    data.Table[0].CARTPLACE = (data.Table[0].CARTPLACE == null) ? '' : data.Table[0].CARTPLACE;
                    this.dataTable = (data.Table.length > 0) ? data.Table[0] : [];
                    this.dataTable1 =  data.Table1;//(data.Table1.length > 0) ? data.Table1[0] :[];
                    this.dataTable2 = (data.Table2.length > 0) ? data.Table2[0] : [];
                    this.dataTable3 = (data.Table3.length > 0) ? data.Table3  : [];
                    this.billto=data.Table[0].expt_billto_n;
                    
                }
            });
    }
}