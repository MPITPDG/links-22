import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoaderService } from '../../shared/service/loader.service';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';

@Component({
    selector: 'app-quotation-print',
    templateUrl: './Admin-Quotation-Print.component.html',
    styles: [`
    p .MsoNormal{
      padding:0rem !important;
      margin:0rem !important
    }
    .Rpt_Label_content {
      font-size: 8pt;
      color: black;
      font-family: Verdana,Arial;
    }
    .Rpt_Label {
      font-weight: bold;
      font-size: 8pt;
      color: black;
      font-family: Verdana,Arial;
  }
  .Rpt_CodeDate {
    font-weight: bold;
    font-size: 9pt;
    color: black;
    font-family: Verdana,Arial;
  }
  `]
})

  export class QuotationPrintComponent implements OnInit {
      QuotationNo:string="";
      chargestable
      CMP_IMAGE: string = ""
      GSTNO: string = ""
      PANNO: string = ""
      QuotDate: string = ""
      Narration: string = ""
      ClientName:string=""
      NARRATION1: string = ""
      datatable1
      TOTAMOUNT: string = ""
    constructor(public _dataService: DataService,
        private _route: ActivatedRoute, public _loginService: LoginService,
        private _loaderService: LoaderService) { }
    
      ngOnInit() {
        this._route.params.subscribe(params => {
          this.QuotationNo = params["QuotNo"]
         
        });
        this.print();
      }
      print() {
        const jsonmaster = {
          QuotNo: this.QuotationNo,
          CmpCode: this._loginService.getLogin()[0].CMPCODE,
          CityCode: this._loginService.getLogin()[0].CITYCODE
        }
       // console.log(jsonmaster)
        //console.log(jsonmaster)
        this._dataService.getData("Admin/Mst_Quotation_Print", jsonmaster)
          .subscribe((res: any) => {
         //   console.log(res)
            this.Narration = res.Table1[0].NARRATION
            this.CMP_IMAGE= "assets/img/" + res.Table[0].CMP_IMAGE
            this.GSTNO=res.Table[0].GSTIN
            this.PANNO=res.Table[0].PANNO
            this.datatable1=res.Table1
            this.chargestable = res.Table2
            this.TOTAMOUNT=res.Table3[0].TOTAMOUNT
            this._loaderService.display(false)
            if (this.Narration != "") {
              var html = this.Narration.replace(/<p[^>]*>/g, '').replace(/<\/p>/g, '<br />');
              this.NARRATION1 = html
            }
         
          })
      }
      PrintElem(){
        
      }
    }