import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoaderService } from '../../shared/service/loader.service';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';

@Component({
  selector: 'app-creditnote-view',
  templateUrl: './creditnote-view.component.html',
  styles: []
})
export class CreditnoteViewComponent implements OnInit {

  CRT_jobno:string=""
  CRT_pkgs:string=""
  CRT_grwt:string=""
  CRT_NO:string=""
 CRT_DATE:string=""
  CLIENTNAME:string=""
  BILLTO_CRTADDR:string=""
  CRT_BILLTYPE:string=""
  CUR_NAME:string=""
  NARRATION:string=""
  CRT_GOODS:string=""
  CRT_WT:string=""
  CRT_VOL:string=""
  CRT_TAX:string=""
  PAYBLEBYDT:string=""
  CRT_NOOFPCS:string=""
  CRT_PKGS:string=""
  CRT_HAWBDT:string=""
  CRT_HAWBNO:string=""
  CRT_CARRIER:string=""
  CRT_ADVANCE:string=""
  CRT_CLIENTREF:String=""
  CRT_CURRATE:String=""
  SUPPLYTYPE:string=""
       datatabl_1=[]
       datatabl_2=[]
       datatabl_3=[]
       datatabl_4=[]
       datatabl_5=[]
      datatabl_6=[]
       datatabl_7=[]
      datatabl_8=[]
       datatabl_9=[]
       datatabl_10=[]
  constructor( public _dataService: DataService,	
    private _route: ActivatedRoute,public _loginService: LoginService,
		private loaderService: LoaderService) {}

  ngOnInit() {
    this._route.params.subscribe(params => {
      this.viewdata(params["CrtNo"]);
 });
  }
  viewdata(dataCRT){
    const jsonmaster = {
      CNno: dataCRT,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      type:"View",
      finstartdt:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      fin_enddt:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
    }
   // console.log(jsonmaster)

    this._dataService.getData("Accounts/ACC_CN_view", jsonmaster)
      .subscribe((data: any) => {
        //console.log(data)
      this.datatabl_1=data.Table1
       this.datatabl_2=data.Table2
       this.datatabl_3=data.Table3
       this.datatabl_4=data.Table4
       this.datatabl_5=data.Table5
       this.datatabl_6=data.Table6
       this.datatabl_7=data.Table7
       this.datatabl_8=data.Table8
       this.datatabl_9=data.Table9
       this.datatabl_10=data.Table10
 
       this.CRT_NO=data.Table[0].CRT_NO
       this.CRT_DATE=data.Table[0].CRT_DATE
       this.CLIENTNAME=data.Table[0].CLIENTNAME
       this.BILLTO_CRTADDR=data.Table[0].BILLTO_ADD
       this.CRT_BILLTYPE=data.Table[0].CRT_BILLTYPE
       this.CUR_NAME=data.Table[0].CUR_NAME
       this.CRT_CLIENTREF=data.Table[0].CRT_CLIENTREF
       this.NARRATION=data.Table[0].NARRATION
       this.CRT_GOODS=data.Table[0].CRT_GOODS
       this.CRT_CURRATE=data.Table[0].CRT_CURRATE
       this.CRT_WT=data.Table[0].CRT_WT
       this.CRT_VOL=data.Table[0].CRT_VOL
       this.CRT_TAX=data.Table[0].CRT_TAX
       this.PAYBLEBYDT=data.Table[0].PAYBLEBYDT
       this.CRT_NOOFPCS=data.Table[0].CRT_NOOFPCS
       this.CRT_PKGS=data.Table[0].CRT_PKGS
       this.CRT_HAWBDT=data.Table[0].CRT_HAWBDT
       this.CRT_HAWBNO=data.Table[0].CRT_HAWBNO
       this.CRT_CARRIER=data.Table[0].CRT_CARRIER
       this.CRT_ADVANCE=data.Table[0].CRT_ADVANCE   
       this.SUPPLYTYPE=data.Table[0].SUPPLYTYPE        
      })
  }

}
