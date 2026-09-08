import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoaderService } from '../../shared/service/loader.service';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
@Component({
  selector: 'app-invoice-view',
  templateUrl: './invoice-view.component.html',
  styles: []
})
export class InvoiceViewComponent implements OnInit {
  inv_jobno:string=""
  inv_pkgs:string=""
  inv_grwt:string=""
  INV_NO:string=""
 INV_DATE:string=""
  CLIENTNAME:string=""
  BILLTO_INVADDR:string=""
  INV_BILLTYPE:string=""
  CUR_NAME:string=""
  NARRATION:string=""
  INV_GOODS:string=""
  INV_WT:string=""
  INV_VOL:string=""
  INV_TAX:string=""
  PAYBLEBYDT:string=""
  INV_NOOFPCS:string=""
  INV_PKGS:string=""
  INV_HAWBDT:string=""
  INV_HAWBNO:string=""
  INV_CARRIER:string=""
  INV_ADVANCE:string=""
  INV_CLIENTREF:String=""
  INV_CURRATE:String=""
  SUPPLYTYPE:string=""
  INV_CURRATE1:string=""
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
      this.invoiceviewdata(params["InvNo"]);
 });
  }
  invoiceviewdata(datainv){
    this.loaderService.display(true)
    const jsonmaster = {
      invoiceno: datainv,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
    }
    //console.log(jsonmaster)
    this._dataService.getData("Accounts/ACC_invoice_view", jsonmaster)
      .subscribe((data: any) => {
    //    console.log(data)
       if(data.Table[0].STATUS=="#100"){
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
 
       this.INV_NO=data.Table2[0].INV_NO
       this.INV_DATE=data.Table2[0].INV_DATE
       this.CLIENTNAME=data.Table2[0].CLIENTNAME
       this.BILLTO_INVADDR=data.Table2[0].BILLTO_INVADDR
       this.INV_BILLTYPE=data.Table2[0].INV_BILLTYPE
       this.CUR_NAME=data.Table2[0].CUR_NAME
       this.INV_CLIENTREF=data.Table2[0].INV_CLIENTREF
       this.NARRATION=data.Table2[0].NARRATION
       this.INV_GOODS=data.Table2[0].INV_GOODS
       this.INV_CURRATE=data.Table2[0].INV_CURRATE
       this.INV_CURRATE1=data.Table2[0].INV_CURRATE1
       this.INV_WT=data.Table2[0].INV_WT
       this.INV_VOL=data.Table2[0].INV_VOL
       this.INV_TAX=data.Table2[0].INV_TAX
       this.PAYBLEBYDT=data.Table2[0].PAYBLEBYDT
       this.INV_NOOFPCS=data.Table2[0].INV_NOOFPCS
       this.INV_PKGS=data.Table2[0].INV_PKGS
       this.INV_HAWBDT=data.Table2[0].INV_HAWBDT
       this.INV_HAWBNO=data.Table2[0].INV_HAWBNO
       this.INV_CARRIER=data.Table2[0].INV_CARRIER
       this.INV_ADVANCE=data.Table2[0].INV_ADVANCE
       this.SUPPLYTYPE=data.Table2[0].SUPPLYTYPE
       this.loaderService.display(false)
       }
       else{this.loaderService.display(false);}
      })
  }
  jobprofitreport(jobno) {

    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-Job-Profit-Report/' + jobno + '/', "Job Profit Report", toolbar);

  }
}
