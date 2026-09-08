import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { JobprofitserviceService } from 'src/app/shared/service/jobprofitservice.service';
import {Configuration}  from '../../../app.constants'
@Component({
    selector: 'app-consigneejobprofit',
    templateUrl: './consignee_jobprofit.component.html',
    styles: []
})
export class ConsigneeJobprofitComponent implements OnInit {

    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '18px',
        width: '150px',
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
    PageName: string = "Consignee Job Profit "

    ConsigneeList: any = []
    consignee: string;
    FinalClient: string = ""
    FromDate: any = "";
    ToDate: any = "";
    SearchType = "DATE"
    modetype: string = "SEA";
    to_datewise: any = "";
    from_datewise: any = "";
    single_jobno: string = "";
    detaildata_of: any;
    cityname: string = "";
    mode:string="SEA";
    fromval:string="";
    toval:string="";
    consgname:string="--All--";
    downloadurl:string="";
    constructor(
      
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private _router: Router,
        private http: HttpClient, private exportser: JobprofitserviceService,
        private _activatedRoute: ActivatedRoute,
        private _loginService: LoginService,
        private _config:Configuration
    ) {}
   
    ngOnInit() {
        this.downloadurl=this._config.ServerWithApiUrl;
        this.FillAccount();
      
    }
  
    FillAccount() {
        const jsondata = {
          CmpCode:this._loginService.getLogin()[0].CMPCODE,
          CityCode:this._loginService.getLogin()[0].CITYCODE,
          CityCode1:this._loginService.getLogin()[0].CITYCODE1
        }
        this._dataService.getData("Accounts/ACC_ACCOUNT_FILL_JOBPROFIT_Fill", jsondata)
            .subscribe((data: any) => {
                this.ConsigneeList = data.Table1
               
            })
    }
  GetconsigneeName(connm)  {
     this.consgname=connm;
    }
    Exporttoexcel(){
      
            if(this.consignee=="" ){
              alert('Please select Consignee');
              return false;      
            }
        
            if(this.FromDate=="" || this.FromDate==undefined){
                alert('Please enter from date');
                return false;        
            }
          else  if(this.ToDate=="" || this.ToDate==undefined){
                alert('Please enter to date');
                return false;        
            }
       
        
      const jsonview = {
            FromDate: this.FromDate.formatted,
            ToDate: this.ToDate.formatted,
            JobNoFrom: "",
            JobNoTo: "",
            SearchType: "DATE",
            DateType: "CONSER",
            Mode: this.modetype,
            CityCode1: this._loginService.getLogin()[0].CITYCODE1,
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            ConCode: (this.consignee!=null)? this.consignee:"0",
            consgname: this.consgname,
            UserName: this._loginService.getLogin()[0].CMP_USERNAME,
            headerfromdt:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate.formatted),
            headertodt:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate.formatted),
            };
            console.log(this.modetype);
            console.log(this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate.formatted))
            this._dataService.Common("Accounts/GenerateConsigneeJobProfit", jsonview)
            .subscribe({
                next: (res: any) => {
                console.log("Report generated:", res);
                 if (res.status === 'success') {
                       // this.downloadZip(res.flname); // Triggers automatic download
                       this.downloadFile(res.flname)
                        } else {
                        alert('No data found.');
                        }
                // Handle success (e.g., download the file if response contains path)
                },
                error: (err) => {
                console.error("Error generating report", err);
                }
            });
        //     this.loaderService.display(false);
    }
    getmodevalue(val){
        if(val=="SEA"){
            this.mode="SEA"
        }
        else  if(val=="AIR"){
            this.mode="AIR"
        } 
    }

      downloadFile(fileName: string) {
          this._dataService.postAndGetResponsezip(fileName).subscribe(fileData => {
            const blob: any = new Blob([fileData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            let link = document.createElement("a");
              if (link.download !== undefined) {
              let url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute("download", fileName);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }
          );
        }

   downloadZip(fileName: string) {
        const url = this.downloadurl +`Accounts/DownloadZip?fileName=${fileName}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.zip`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
}

    Reset() {
        this.consignee = undefined;
        this.FromDate = "";
        this.ToDate = "";
        this.modetype = "SEA";
    
    }
}
