
import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router } from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-epcopy-rpt',
    templateUrl: 'ep-copy-coversheet-search.component.html'

})

export class ExptRptEpCopySheet implements OnInit {
    checkWise: string = "1";
    checkWiseS: string = "1";
    checkWiseF: string = "1";
    shipbillno = "";
    exptno = "";
    subject = "Shipped on :";
    dtprint :any = "";

    shipdisable: boolean = false;
    exptnodisable: boolean = true;


    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService

    ) {
    }

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
    ngOnInit()
    {
        this._loginService.verifyRights(19, '')
        .subscribe((data: any) => { this._loginService.checkVerify('View', data); });

    }
  /*  print() {
        let mode; let searchcrt; let searchval; let rptfrmt,dt ;
        if (this.dtprint == "") { dt = "" } else { dt = this.dtprint.formatted; }
        if (this.checkWise == '1') { mode = 'Sea'; }
        else { mode = "Air"; }

        if (this.checkWiseS == '1') {
            searchcrt = "SHPBILNO";
            searchval = this.shipbillno;
        }
        else {
            searchcrt = "EXPTNO";
            searchval = this.exptno;
        }

        if (this.checkWiseF == '1') { rptfrmt = "tbl"; }
        else { rptfrmt = "smt"; }
        this._toasterService.toast('info', 'Complete', "Generate Ep copy coversheet");
        this.loaderService.display(true);


        const jsonExport = { SECHMODE: searchcrt, RPTFRMT: rptfrmt, VALUE: searchval, EXPT_MODE: mode };

        this._dataService.getDownload("Export/Generate_EpCopy", jsonExport, { responseType: 'arraybuffer' })
            .subscribe((data: any) => {
                this._dataService.html_downloadFileByUrl(data, "EP_Copy_Coversheet.html");
                this.loaderService.display(false);

            });
    }*/

    print() {
        // window.open('www.manilal.com', "_blank");

        let mode,searchcrt, searchval, rptfrmt, dt;
        if (this.dtprint == "") { dt = "" } else { dt = this.dtprint.formatted; }
        if (this.checkWise == '1') { mode = 'sea'; }
        else { mode = "air"; }

        if (this.checkWiseS == '1') {
            searchcrt = "SHPBILNO";
            searchval = this.shipbillno;
        }
        else {
            searchcrt = "EXPTNO";
            searchval = this.exptno;
        }

        if (this.checkWiseF == '1') { rptfrmt = "TABLE"; }
        else { rptfrmt = "STATEMENT"; }
        
          let URL = "http://manilal.com/erp/UI/Export/frm_Exp_Rpt_EpCopyCoverSheet_Print.aspx?" +
        // let URL = "http://localhost:52299/erp/UI/Export/frm_Exp_Rpt_EpCopyCoverSheet_Print.aspx?" +
            "huhpnk=" + this._loginService.getLogin()[0].GUID
            + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
            + "&Userid=" + this._loginService.getLogin()[0].CMPID
            + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
            + "&SearchType=" + rptfrmt
            + "&Exptno="+ this.shipbillno
            + "&PrintDt="+ dt
            + "&EPSubject="+ this.subject
            + "&Mode="+mode
            + "&Exportno=" +this.exptno
            + "&CurLogInIP=" + environment.edocumentIp
        window.open(URL, "_blank");
        
        
    }

 

    mainCheck(ctype) {
        this.checkWise = ctype;
        if (this.checkWise == '2') {

            this.subject = "";
        }
    }
    mainCheckF(ctype) {
        this.checkWiseF = ctype;
    }
    mainchkSearch(ctype) {
        this.checkWiseS = ctype;
        if (this.checkWiseS == "1") {
            this.shipdisable = false;
            this.exptnodisable = true;
            this.shipbillno = "";
        }
        else {
            this.shipdisable = true;
            this.exptnodisable = false;
            this.exptno = "";
        }

    }
    mainchkFormat(ctype) {
        this.checkWiseF = ctype;

    }
}