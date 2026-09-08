import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import {environment}  from '../../../../environments/environment.prod'

@Component({
  selector: 'app-credit-note-search',
  templateUrl: './credit-note-search.component.html',
  styles: [ `main{
    position: absolute;
    top: 110px;
    left: 231px;
    right: 0;
    bottom: 0;
    background: #f2f5fe;
    padding: 1rem;
  }

  #content{
    height: 100%;
    display: flex;
    flex-direction: column;
  }`]
})
export class CreditNoteSearchComponent implements OnInit {
    clientable: any = []; exampleRadios1: string = 'CreditNo'; client: string = ""; crtno: string = "";
    client_startdate; client_enddate; jobno: string = ""; amount: string = ""; printallcredit_date;printarray:any=[]
    datewise_startdate; datewise_enddate; Searchdata_list: any = []
    public myDatePickerOptions: IMyDpOptions = {
      dateFormat: 'dd-mmm-yyyy',
      inline: false,
      height: '20px',
      width: '135px',
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

    constructor(private _dataService: DataService,
      private _toasterService: ToastCommonService,
      private loaderService: LoaderService,
      private http: HttpClient,
      private _activatedRoute: ActivatedRoute,private _router:Router,
      private _loginService: LoginService,
    ) { }

    ngOnInit() {
      //console.log(this._loginService.getLogin())
         this.verifyPermission('424','Add')

      const jsonmaster = {
        cmpid: this._loginService.getLogin()[0].CMPID,
        cmp_code: this._loginService.getLogin()[0].CMPCODE,
        citycode: this._loginService.getLogin()[0].CITYCODE,
        citycode1: this._loginService.getLogin()[0].CITYCODE1
      }
      this._dataService.getData("Accounts/ACC_INVOICE_Search_Pageloag", jsonmaster)
        .subscribe((data: any) => {
        //  console.log(data)
          this.clientable = data.Table
        })
    }
    verifyPermission(formId, userMode) {
      this.loaderService.display(true);
      this._loginService.verifyRights(formId, '')
          .subscribe((data: any) => {
             this._loginService.checkVerify(userMode, data);
             this.loaderService.display(false);

          });
     }
     customSearchFn(term: string, item: any) {
      return item.EXP_NAME_CITY.toLowerCase().startsWith(term.toLowerCase())
       }
    searchlist() {
      if (this.exampleRadios1 == "CreditNo") {
        if (this.crtno == "") {
          this._toasterService.toast('warning', 'warning', "Please enter Credit No to search !");
          return false;
        }
      }    else if (this.exampleRadios1 == "Client") {
        if(this.client == "" || this.client == null)  {
          this._toasterService.toast('warning', 'warning', "Please select client !");
          return false;
        }
        else if(this.client != "" &&
        (this.client_startdate == "" || this.client_startdate ==undefined) &&
        ( this.client_enddate == "" || this.client_enddate==undefined))  {
          this._toasterService.toast('warning', 'warning', "Please select startdate and enddate  !");
          return false;
        }
        if ((this.client_startdate !=""  || this.client_startdate ==undefined)
        && this.client_enddate!="" || this.client_enddate==undefined){
           let intdtfrm1 ,intdtTo1;
           intdtfrm1=this._dataService.datechnge(this.client_startdate.formatted)
           intdtTo1=this._dataService.datechnge(this.client_enddate.formatted)
           if (this._dataService.date2Comparison(intdtfrm1,intdtTo1)==false){
             this._toasterService.toast('warning', 'warning', 'To date should be greater than from date !');
             return false;
           }
         }
      }
       else if (this.exampleRadios1 == "JobNo") {
        if (this.jobno == "") {
          this._toasterService.toast('warning', 'warning', "Please input job no. !");
          return false;
        }
      } else if (this.exampleRadios1 == "Amount") {
        if (this.amount == "") {
          this._toasterService.toast('warning', 'warning', "Please input amount !");
          return false;
        }
      }  else if (this.exampleRadios1 == "Date") {
        if (this.datewise_startdate =="" || this.datewise_startdate == undefined)
        {
          this._toasterService.toast('warning', 'warning', "Please select start Date !");
          return false;
        }
        if ( this.datewise_enddate=="" || this.datewise_enddate == undefined)
        {
          this._toasterService.toast('warning', 'warning', "Please select to Date !");
          return false;
        }
        if (this.datewise_startdate !="" && this.datewise_enddate!=""){
          let intdtfrm ,intdtTo;
          intdtfrm=this._dataService.datechnge(this.datewise_startdate.formatted)
          intdtTo=this._dataService.datechnge(this.datewise_enddate.formatted)
          if (this._dataService.date2Comparison(intdtfrm,intdtTo) ==false)
          {
            this._toasterService.toast('warning', 'warning', 'To date should be greater than from date !');
            return false;
          }
  }
      } else if (this.exampleRadios1 == "6") {
        if (this.printallcredit_date == "" || this.printallcredit_date == undefined) {
          this._toasterService.toast('warning', 'warning', "Please select start Date !");
          return false;
        }else{
          this.getcreditnoteofday()
        }
      }
      this.loaderService.display(true)
      var jsonmaster = {
        CREDITNO:this.crtno,
        Client:this.client,
        JobNo:this.jobno,
        Amount:this.amount,
        FromDate:this.exampleRadios1=="Client" ? this.client_startdate.formatted :this.exampleRadios1=="Date" ? this.datewise_startdate.formatted:"" ,
        ToDate:this.exampleRadios1=="Client" ? this.client_enddate.formatted:this.exampleRadios1=="Date"?this.datewise_enddate.formatted:"",
        cmp_code: this._loginService.getLogin()[0].CMPCODE,
        citycode:this._loginService.getLogin()[0].CITYCODE,
        TYPE:this.exampleRadios1,
        yearid:"",
        Fin_StartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
        Fin_EndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,

      }
    // console.log(jsonmaster)
      this._dataService.getData("Accounts/ACC_CREDITNOTE_Search_List", jsonmaster)
        .subscribe((data: any) => {
          this.loaderService.display(false)
          if(data.Table.length=="0"){
            this._toasterService.toast("warning", "warning", "No record found");
          }else  if(data.Table.length=="1"){
            this.Searchdata_list = data.Table;
            this.ListOnclick(data.Table[0].crt_no)
          }else{
          this.Searchdata_list = data.Table
          }
        })
    }
    CreditView(creditno) {
      if(creditno ==''||creditno==undefined || creditno.length < 15){
        alert("Enter 15 digit CreditNote No !")
        return false
      }
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      window.open('./#/popup/Account-CreditNote-View/' + creditno + '/' , "CreditNote View", toolbar);
  }
  CreditNotePrint(creditno) {
    if(creditno ==''||creditno==undefined || creditno.length < 15){
      alert("Enter 15 digit CreditNote No !")
      return false
    }
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
   // window.open('./#/popup/Account-CreditNote-print/' + creditno + '/' , "CreditNote Print", toolbar);
   let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_CreditNote_Print.aspx?" +
   "huhpnk=" + this._loginService.getLogin()[0].GUID
   + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
   + "&Userid=" + this._loginService.getLogin()[0].CMPID
   + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
   + "&CreditNoteNo=" +creditno
   + "&DisplayMode=" + "0"
   + "&CurLogInIP=" + environment.edocumentIp
   window.open(URL, "_blank");
  }

    ListOnclick(CREDITNO) {
      let  authby ;
      let updateItem = this.Searchdata_list.find(item => item.crt_no === CREDITNO);
      authby=updateItem.AuthorisedBy;
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
     // window.open('./#/popup/Account-CreditNote-print/' + creditno + '/' , "CreditNote Print", toolbar);
     if (confirm('Click Ok to Print or Click Cancel to Edit ?')) {
     let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_CreditNote_Print.aspx?" +
     "huhpnk=" + this._loginService.getLogin()[0].GUID
     + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
     + "&Userid=" + this._loginService.getLogin()[0].CMPID
     + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
     + "&CreditNoteNo=" +CREDITNO
     + "&DisplayMode=" + "0"
     + "&CurLogInIP=" + environment.edocumentIp
     + "&cmp_username=" + this._loginService.getLogin()[0].CMP_USERNAME
     + "&FinStartDate=" + this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE
     + "&FinEndDate=" + this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
     window.open(URL, "_blank");
     return false;
    }
        else
     {
      if(authby == "undefined" || authby == "0"){
      this._router.navigate(['/accounts/transaction/creditnote/general/' + CREDITNO]);
      }
      else{
        alert("You can update But print the Credit Note No.["+CREDITNO +"] Because Credit note is Already Authorised !!");
        this.CreditView(CREDITNO)
      }
    }
    }
    getcreditnoteofday(){
      this.loaderService.display(true)
      var jsonmaster = {
        cmp_code: this._loginService.getLogin()[0].CMPCODE,
        citycode:this._loginService.getLogin()[0].CITYCODE,
        DAY:this.printallcredit_date.formatted
      }
     // console.log(jsonmaster)
      this._dataService.getData("Accounts/ACC_CREDITNOTE_SEARCH_PERDAY", jsonmaster)
        .subscribe((data: any) => {
          this.loaderService.display(false)
        //  console.log(data)
          if(data.Table.length=="0"){
            this._toasterService.toast("warning", "warning", "No record found");
          }else if(data.Table.length=="1"){
            this.ListOnclick(data.Table[0].crt_no)
          }else{
          this.Searchdata_list = data.Table
          }
        })
    }

    getCheckboxValues(event, data) {
      var index = this.printarray.findIndex(x => x.creditno == data);
      if (event) {
        let obj = {
          creditno: data
        }
        this.printarray.push(obj);
       // console.log(  this.printarray)

      }
      else {
        this.printarray.splice(index, 1);
       // console.log(  this.printarray)

      }
    }
    checkAll(ev) {
      this.printarray = []
      this.Searchdata_list.forEach(x => x.Checked = ev.target.checked)
      if (ev.target.checked == true) {
        for (var i = 0; i < this.Searchdata_list.length; i++) {
          let obj = {
            creditno: this.Searchdata_list[i].crt_no
          }
          this.printarray.push(obj);
        //  console.log(  this.printarray)
        }
      } else {
        this.printarray = []
      }
    }
    PrintCreditNote(){
      if(this.printarray.length=="0"){
        this._toasterService.toast("warning", "warning", "Select at least One CreditNote No to Print.");
        return false
      }
      var output = this.printarray.map(function (item) {
        return item.creditno;
      });
      var datatry = output.join(",")
      var printnolist = datatry
    //  console.log(printnolist)
      let URL = "http://180.179.207.163/erp/UI/Accounts/frm_Acc_Tran_CreditNote_BulkPrint.aspx?" +
                    "huhpnk=" + this._loginService.getLogin()[0].GUID
                    + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
                    + "&Userid=" + this._loginService.getLogin()[0].CMPID
                    + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
                    + "&entryno=" +printnolist
                    + "&CurLogInIP=" + environment.edocumentIp
                    window.open(URL, "_blank");
    }

    back() {
      //this.result.emit(true);
      this._router.navigate(['/accounts/transaction/creditnote/creditnotesearch']);
  }
  reset(){
    this.crtno="";
    this.client_startdate="";
    this.client_enddate=""
    this.datewise_startdate=""
    this.datewise_enddate=""
    this.client=""
    this.jobno=""
    this.amount=""
    this.printallcredit_date = ""
    this.exampleRadios1="CreditNo"
   }

  }
