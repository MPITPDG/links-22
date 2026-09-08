import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/service/authService';
import { DataService } from 'src/app/shared/service/dataService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';

@Component({
  selector: 'app-print-cheque',
  templateUrl: './print-cheque.component.html',
  styles: [`
.class1{
  color:red;
  font-weight:bold;
  font-family:sans-serif
}
.class2{
  font-weight:bold;
  color:green;
  font-family:sans-serif
}
`]
})
export class PrintChequeComponent implements OnInit {
  Header: string = "COMP BP ENTRYNO - LIST - ASSIGN TO - CHEQUE NO AND PRINT"
  BankList: any;
  BankName: string = ""
  searvhptintlist: any = []
  checkbox: boolean = false;
  newarray: any = [];
  cheque_nolist: any = [];
  showModal_ChequenoList: boolean = false
  PageActual: number = 1;
  p2: number = 1;
  HDPOAMT: any;
  HDNEFTAMT: any;
  HDRTGSAMT: any;
  AvilableCount: any;
  AssignCount: any = 1
  PayOrderCel: any
  Amount: any
  StartCheck: any="";
  HdnStatus: string;
  HdPayOrder: any;
  HdnChequeStr: any;
  HdnPrintCount: any;
  start_chqno: string
  Hdcheckstatus: string;
  chkstatus:string;
  BankRefNo:string;
  CHEQUENO:string;
  EntryNo:string="";
  flag:string="";
  Print_List:any=[];
  chkprntstrval:any="";
  constructor(
    private _router: Router,
    private _dataService: DataService,
    private _auth: AuthService, private _activatedRoute: ActivatedRoute,
    private _toasterService: ToastCommonService,
    private _loginService: LoginService,
    private _loaderService: LoaderService,
  ) { }
  ngOnInit() {
    //console.log(this._loginService.getLogin())
    this._loaderService.display(true)
    this.verifyPermission('92','View')

    const jsoncmp = {
      cmpcode: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      citycode1: this._loginService.getLogin()[0].CITYCODE1,
    }
    // console.log(jsoncmp)
    this._dataService.getData("Accounts/ACC_CHEQUESTOCK_FILLOURBANK", jsoncmp)
      .subscribe((data: any) => {
        //  console.log(data)
        this.BankList = data.Table
        this.BankName = this.BankList[0].ACCTCODENAME
        this.cheserchprint()
        this._loaderService.display(false)
      })
  }
  verifyPermission(formId, userMode) {
    this._loaderService.display(true);
    this._loginService.verifyRights(formId, '')
        .subscribe((data: any) => {
           this._loginService.checkVerify(userMode, data);
           this._loaderService.display(false);

        });
}
  cheserchprint() {
    const jsonmaster = {
      CMPID: this._loginService.getLogin()[0].CMPID,
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      ENTRYNO: "",
      FROMDT: "",
      TODAT: "",
      OURBNK: this.BankName,
      TYPE: "",
      STATUStype: "BP",
    }
    //console.log(jsonmaster)
    this._loaderService.display(true)

    this._dataService.getData("Accounts/ACC_BP_CMP_CHEQUE_SEARCH_PRINTING", jsonmaster)
      .subscribe((data: any) => {
       // console.log(data)
        this.searvhptintlist = data.Table
      //  console.log(data.Table.length);

       /// this.AvilableCount = data.Table.length
        this.HDPOAMT = data.Table1[0].PAYORDERAMT
        this.HDNEFTAMT = data.Table1[0].NEFTAMT
        this.HDRTGSAMT = data.Table1[0].RTGSAMT

        this._loaderService.display(false)

      })

  }
  addchequestock() {
    const jsonmaster = {
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
      OURBANK: this.BankName,
      chequeno: ""

    }
    // console.log(jsonmaster)
    this._loaderService.display(true)

    this._dataService.getData("Accounts/ACC_CHEQUE_STOCK_HELPVIEW", jsonmaster)
      .subscribe((data: any) => {
        // console.log(data)
        this.cheque_nolist = data.Table
        this.showModal_ChequenoList = true
        this._loaderService.display(false)

      })
  }
  cheqavailable() {
    // console.log(this.newarray.length);

    if (this.start_chqno == '' || this.start_chqno == undefined) {
      alert("Please enter Starting Cheque No")
      return false
    }
    if (this.newarray.length == '0' || this.newarray == undefined) {
      alert("Please Select atleast one BP Request Entryno at a time !")
      return false
    }
    const jsonmaster = {
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,   //CHECK WITH MANILAL PROJECT
      CHEQUNO: this.start_chqno,
      OURBANK: this.BankName,
      PRINTCNTVAL: "1"
    }
    //   console.log(jsonmaster)
    this._loaderService.display(true)

    this._dataService.getData("Accounts/ACC_BP_CHEQUE_AVAILABILITY", jsonmaster)
      .subscribe((data: any) => {
        //     console.log(data)
        this._loaderService.display(false)
          this.AvilableCount=data.Table[0].Column1;
        if (data.Table[0].Column1 == '1') {

          this.Hdcheckstatus = 'Y'
          this._toasterService.toast("success", "success", "All Cheques Available")
          this.chkstatus="All Cheques Available"


        } else if (data.Table[0].Column1 = '0') {
          this.Hdcheckstatus = 'N'
          this._toasterService.toast("success", "success", "Cheque/s does not available")
          this.chkstatus="Cheque/s does not available"
        } else {
          this._toasterService.toast("success", "success", "*" + data.Table[0].STATUS + " Contineous Cheques Available")
        }
        this.check_chqueno();
      })

  }

  payordergenrte() {

    //console.log(this.newarray.length);
    if(this.newarray.length==0)
    {
      alert("Please Select Atleast one Entry No. !")
      return false;
    }
    if (this.PayOrderCel == "" || this.PayOrderCel == "CHQ" ) {
     if(this.BankRefNo=="")
     {
      alert("Please Add Bank Ref.No. !")
      return false;
    }
    }
    if(this.PayOrderCel == "NEFT" || this.PayOrderCel == "RTGS" ){
      if(this.newarray[0].BRefNo==undefined || this.newarray[0].BRefNo=='')
      {
        alert("Please Add Bank Ref.No. !")
        return false;
      }
    }
   
    this.openwin()
    // var output = this.newarray.map(function (item) {
    //   return item.EntryNo;
    // });
    // var bpreqno = output.join(",") pay order no = "" else will call check status funtion
    this._loaderService.display(true)
    console.log(this.HdnChequeStr);
    console.log(this.HdPayOrder);
    if (this.HdPayOrder != "") {
      const jsonmaster = {
        CMPID: this._loginService.getLogin()[0].CMPID,
        CMPCODE: this._loginService.getLogin()[0].CMPCODE,
        CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
        OURBANK: this.BankName,
        //   BPReqNo: bpreqno + ',',
        BPReqNo: this.HdPayOrder, // this.HdnChequeStr,
        MAKERID: this._loginService.getLogin()[0].CMPID,
        MAKERIP: this._loginService.getLogin()[0].MAKERIP
      }
      //  console.log(jsonmaster);

      this._dataService.getData("Accounts/ACC_BRBPCRCPCE_PAYORDER_GENERATE_NG", jsonmaster)
        .subscribe((data: any) => {
          this._loaderService.display(false)

          if (data.Table[0].STATUS == "0") {
            this._toasterService.toast("success", "success", data.Table[0].SUCCESS)
            this.cheserchprint();
            this.newarray=[];
          }

        })
    } else {
      this._loaderService.display(false)
      //  console.log(this.Hdcheckstatus);

      if (this.Hdcheckstatus == "Y") {
        //  console.log('@');

        const _jsonmaster = {
          CMPCODE: this._loginService.getLogin()[0].CMPCODE,
          CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
          chequNo: this.start_chqno,
          count: "1",
          OURBANK: this.BankName,
          BPReqNo: this.HdnChequeStr.split("|")[0]+",",
          Pstatus: this.HdnStatus
        }
        //  console.log(_jsonmaster);
        let brno =this.HdnChequeStr.split("|")[0] +","
        this._dataService.getData("Accounts/ACC_CMP_BP_CHEQUENO_ASSIGNTOPRINT_LIST", _jsonmaster)
          .subscribe((data: any) => {
               console.log(data);
               this._router.navigate(['/accounts/CompCheque/prntchque/chqreview/' +  brno + '/'
               + this.HdnPrintCount+ '/' + this.start_chqno + '/' + this.BankName + '/' +this.HdnChequeStr]);

          })


      }

    }
  }
  ChequePreview(){
    let brno =this.HdnChequeStr.split("|")[0] +","
    for (let i = 0; i < this.Print_List.length; i++) {
      //let strval
      this.chkprntstrval=this.chkprntstrval + this.Print_List[i].ENTRYNO + "," + this.Print_List[i].CHEQUENO + "," + this.BankName + "," + "P" +  "," + "" + "," +  this.Print_List[i].BANKREFNO + ";"
    //  console.log(strval);
    }
    this._router.navigate(['/accounts/CompCheque/prntchque/chqreview/' +  brno + '/'
    + this.HdnPrintCount+ '/' + this.start_chqno + '/' + this.BankName + '/' +this.chkprntstrval]);
  }
    //hdcheckstatus='Y'
    // api call new one

    Acc_BP_CMP_Cheque_ReadyTo_Print_List_35(str){
      this._loaderService.display(true);
      const jsoncmp = {
        strentryNo: str,
      }
     // console.log(jsoncmp)
      this._dataService.getData("Accounts/ACC_BP_CMP_CHEQUE_READYTO_PRINT_LIST_35", jsoncmp)
        .subscribe((data: any) => {
        //  console.log(data)
        this.Print_List=data.Table;

      })
      this._loaderService.display(false);
    }

  openwin() {

    // this._loaderService.display(true)

    var stringArr, stringArr1;
    var cmpname;
    var cmpname1;
    cmpname = "";
    cmpname1 = "";
    stringArr = [];
    stringArr1 = [];
    var j;
    j = 0;
    var Cmp_Code = this._loginService.getLogin()[0].CMPCODE;
    var ChqNo = this.StartCheck;

      let selectedata = this.searvhptintlist.filter((filter) => filter.ENTRYNO == this.newarray[0].EntryNo)[0];

     console.log(selectedata);
    var AMOUNT = selectedata.AMOUNT;  //data.table.Amount
    var CondPOAMT = this.HDPOAMT; //data.table1.PAYORDERAMT
    var CondNEFTMT = 1;
    var CondRTGSAMT = 1;

    if (selectedata.CHEQUETYPE == 'NEFT') {
      /*
      Modification done for NEFT cheque print,
      after getting the mail from chetan on 22/03/2017 11:45 AM
      Please modify the same as “Amount should be greater than 1 lakh”.

      Again modified for freight service IDFC bank checque print for NEFT and RTGS
      by nisha As per Chetan's mail

      */

      if (AMOUNT >= CondNEFTMT) {

        if (Cmp_Code == "30" || Cmp_Code == "31") {  //02
          var answer = confirm("Are you sure you want to generate NEFT BP Without Cheque No. ? \n click cancel ");
        }
        else {
          var answer = confirm("Are you sure you want to generate NEFT BP With Cheque No. ? ");
        }
        if (answer == false) {
          if (Cmp_Code == "30" || Cmp_Code == "31") {  //02
            if(selectedata.BANKREFNO=='' || selectedata.BANKREFNO==undefined){
              alert("Please Enter Bank Ref.No. !")
              this._loaderService.display(false)
              return false;
            }
            cmpname = selectedata.ENTRYNO;  //data.table.ENTRYNO
            this.HdnStatus = "I"; //INPROCESS  // declare a globel variable HdnStatus ans assign here
           // stringArr1 = stringArr + cmpname + ",";
           stringArr1 = stringArr + cmpname + '|' + selectedata.BANKREFNO + ",";
            j = j + 1;
          }
          else {
            this._loaderService.display(false)

            return false;
          }
        }
        else {
          cmpname = selectedata.ENTRYNO; //data.table.ENTRYNO
          this.HdnStatus = "I"; //INPROCESS // declare a globel variable HdnStatus ans assign here
          stringArr = stringArr + cmpname + ",";
          j = j + 1;
        }
      }
      else {
        var answer = confirm("Are you sure you want to Generate NEFT BP Without Cheque No. ? \n\n NOTE : NEFT Cheque will Print Only when \n            Request Amount Should be greater and equal to 1 Lakh .")
        if (answer == false) {
          this._loaderService.display(false)
          return false;
        }
        else {
          cmpname1 = selectedata.ENTRYNO;;
         // stringArr1 = stringArr1 + cmpname1 + ","; // ONLY BP NO WILL GENERATE FOR NEFT BUT NO CHEQUE WILL PRINT
         stringArr1 = stringArr1 + cmpname1 + '|' + selectedata.BANKREFNO + ",";
        }
      }
    }
    else if (selectedata.CHEQUETYPE == 'RTGS') {
      if (AMOUNT >= CondRTGSAMT) {
        if (Cmp_Code == "30" || Cmp_Code == "31") {
          var answer = confirm("Are you sure you want to Generate RTGS BP Without Cheque No. ?  \n click cancel ");
          //  \n\n NOTE : RTGS Cheque will Print Only when Request Amount Should be greate or equal to Rs. 2 Lakh .")
        }
        else {
          var answer = confirm("Are you sure you want to Generate RTGS BP Without Cheque No. ? ");
          //\n\n NOTE : RTGS Cheque will Print Only when Request Amount Should be greate or equal to Rs. 2 Lakh .")
        }

        if (answer == false) {
          if (Cmp_Code == "30" || Cmp_Code == "31") {
            if(selectedata.BANKREFNO=='' || selectedata.BANKREFNO==undefined){
              alert("Please Enter Bank Ref.No. !")
              this._loaderService.display(false)
              return false;
            }
            cmpname = selectedata.ENTRYNO;
            this.HdnStatus = "I"; //INPROCESS
            // stringArr1 = stringArr + cmpname + ",";
            if(selectedata.BANKREFNO==undefined){
              selectedata.BANKREFNO="";
            }
            stringArr1 = stringArr + cmpname + '|' + selectedata.BANKREFNO + ",";
            j = j + 1;
          }
          else {
            this._loaderService.display(false)

            return false;
          }
        }
        else {
          cmpname = selectedata.ENTRYNO;
          this.HdnStatus = "I"; //INPROCESS
          stringArr = stringArr + cmpname + ",";
          j = j + 1;
        }
      }
      else {
        var answer = confirm("Are you sure you want to Generate RTGS BP Without Cheque No. ? \n\n NOTE : RTGS Cheque will Print Only when Request Amount Should be greate or equal to Rs. 2 Lakh .")
        if (answer == false) {
          this._loaderService.display(false)

          return false;
        }
        else {
          cmpname1 = selectedata.ENTRYNO;
          if(selectedata.BANKREFNO==undefined){
            selectedata.BANKREFNO="";
          }
          // stringArr1 = stringArr1 + cmpname1 + ","; // ONLY BP NO WILL GENERATE FOR RTGS BUT NO CHEQUE WILL PRINT
          stringArr1 = stringArr1 + cmpname1 + '|' + selectedata.BANKREFNO + ",";
        }
      }
    }
    ///*
    else if (selectedata.CHEQUETYPE == 'Pay Order') //&& ()
    {
      /*
      Modification done for PO cheque print,
      after discussion with chetan
      Please modify the same as “Amount up to 1 lakh Payorder without cheque no acceptable”.
      */
      // /*
      if (AMOUNT >= CondNEFTMT) {
        if (Cmp_Code == "02" || Cmp_Code == "01") {
          var answer = confirm("Are you sure you want to generate Payorder BP Without Cheque No. ? \n click cancel   \n\n NOTE : Payorder Cheque will Print Only when \n            Request Amount Should be greater and equal to 1 Lakh   ")
        }
        else {
          var answer = confirm("Are you sure you want to generate Payorder BP With Cheque No. ? \n\n NOTE : Payorder Cheque will Print Only when \n            Request Amount Should be greater and equal to 1 Lakh .")

        }
        if (answer == false) {
          if (Cmp_Code == "02" || Cmp_Code == "01") {
            if(selectedata.BANKREFNO=='' || selectedata.BANKREFNO==undefined){
              alert("Please Enter Bank Ref.No. !")
              this._loaderService.display(false)
              return false;
            }
            cmpname = selectedata.ENTRYNO;
            this.HdnStatus = "I"; //INPROCESS
            // stringArr1 = stringArr + cmpname + ",";
            if(selectedata.BANKREFNO==undefined){
              selectedata.BANKREFNO="";
            }
            stringArr1 = stringArr + cmpname + '|' + selectedata.BANKREFNO + ",";
            j = j + 1;
          }
          else {
            this._loaderService.display(false)

            return false;
          }
        }
        else {
          cmpname = selectedata.ENTRYNO;
          this.HdnStatus = "I"; //INPROCESS
          stringArr = stringArr + cmpname + ",";
          j = j + 1;
        }
      }
      else {
        var answer = confirm("Are you sure you want to Generate Payorder BP Without Cheque No. ? \n\n NOTE : Payorder Cheque will Print Only when \n            Request Amount Should be greater and equal to 1 Lakh .")
        if (answer == false) {
          this._loaderService.display(false)

          return false;
        }
        else {
          cmpname1 = selectedata.ENTRYNO;
          stringArr1 = stringArr1 + cmpname1 + ","; // ONLY BP NO WILL GENERATE FOR NEFT BUT NO CHEQUE WILL PRINT
        }
      }
    }
    else if (selectedata.CHEQUETYPE == 'DD') //&& ()
    {
      /*
      Modification done for DD cheque print,
      after discussion with chetan
      Please modify the same as “for MPCLFPL DD without Cheque No”.
      Please modify the same as “for MPFSPL DD with Cheque No”.
      */

      if (Cmp_Code == "01") {
        var answer = confirm("Are you sure you want to generate DD Bank Payment Without Cheque No. ? ")
      }
      else {
        var answer = confirm("Are you sure you want to generate DD Bank Payment With Cheque No. ? ");
      }

      if (answer == true) {
        if(selectedata.BANKREFNO=='' || selectedata.BANKREFNO==undefined){
          alert("Please Enter Bank Ref.No. !")
          this._loaderService.display(false)
          return false;
        }
        if (Cmp_Code == "33") {

          //dd checq will print with chq no.
          cmpname = selectedata.ENTRYNO;
          this.HdnStatus = "I"; //INPROCESS
          // stringArr1 = stringArr + cmpname + ",";
          if(selectedata.BANKREFNO==undefined){
            selectedata.BANKREFNO="";
          }
          stringArr1 = stringArr + cmpname + '|' + selectedata.BANKREFNO + ",";
          j = j + 1;
        }
        else if (Cmp_Code == "30") {
          //dd checq will print without chq no.
          cmpname = selectedata.ENTRYNO;
          // stringArr1 = stringArr + cmpname + ",";
          if(selectedata.BANKREFNO==undefined){
            selectedata.BANKREFNO="";
          }
          stringArr1 = stringArr + cmpname + '|' + selectedata.BANKREFNO + ",";
          j = j + 1;
        }
        else {
          this._loaderService.display(false)
          return false;
        }
      }
      else {
        this._loaderService.display(false)
        return false;
      }

      //}
      //else {
      //    var answer = confirm("Are you sure you want to Generate Payorder BP Without Cheque No. ? \n\n NOTE : Payorder Cheque will Print Only when \n            Request Amount Should be greater and equal to 1 Lakh .")
      //    if (answer == false) { fnLoading_Stop(); return false; }
      //    else {
      //        cmpname1 = tRows[i].getElementsByTagName("td")[2].innerText;
      //        stringArr1 = stringArr1 + cmpname1 + ","; // ONLY BP NO WILL GENERATE FOR NEFT BUT NO CHEQUE WILL PRINT
      //    }
      //}
    }
    else // NORMAL CHEQUE, NOTE OVER CHEQUE AND PAY ORDER CHEQUE WILL PRINT WITH GENERATE BP NO
    {
      cmpname = selectedata.ENTRYNO;
      this.HdnStatus = "I"; //INPROCESS
      // stringArr = stringArr + cmpname + ",";
      stringArr = stringArr + cmpname + '|' + this.BankRefNo + ",";
      j = j + 1;
    }

    this.HdPayOrder = stringArr1;
    //alert(stringArr1);
    if (stringArr != "" && stringArr1 != "") {
      alert("Please select any one type.");
      this._loaderService.display(false)

      return false;
    }
    if (stringArr1 == "") {
      if (j != 0) {
        this.HdnChequeStr = stringArr;
        this.HdnPrintCount = j;
        this._loaderService.display(false)
        return true;
      }
      else {
        alert("Please Select Atleast one Entry No. !")
        this._loaderService.display(false)
        return false;
      }

    }

  }
  getbankrefno(eno,bno){
    this.newarray=[];
    // Guard: do NOT allow selecting an un-authorised BP request via the Bank Ref No box.
    // The checkbox is already disabled for 'Not Authorised' rows; this closes the same
    // bypass on the Bank Ref No input so unauthorised entries can never be generated.
    let selrow = this.searvhptintlist.filter((x) => x.ENTRYNO == eno)[0];
    if (selrow && selrow.PRINTSTATUS == 'Not Authorised') {
      alert("This BP Request is Not Authorised. It cannot be generated until the accounts authority authorises it.");
      return;
    }
    let obj = {
      EntryNo: eno,
      BRefNo:bno
    }
    this.newarray.push(obj);
  }
  getCheckboxValues(event, entryno, chqtype, amount,bnkrefno) {
    // if(this.start_chqno=="" || this.start_chqno ==undefined){
    //   alert("Enter the Cheque No. !")
    //   return false;
    // }
    this.CHEQUENO=""
    var index = this.newarray.findIndex(x => x.ENTRYNO == entryno);
    if (event) {
      //  console.log(this.newarray);
      this.flag="1";
      if (this.newarray.length > "0") {
        alert("Please Select only one BP Request Entryno at a time !")
        for (let i = 0; i < this.searvhptintlist.length; i++) {
          if (this.searvhptintlist[i].ENTRYNO == entryno) {
            this.searvhptintlist[i]["Checked"] = false;
          }
        }
        return false
      }

      let obj = {
        EntryNo: entryno,
        BRefNo:bnkrefno
      }
      this.newarray.push(obj);
      this.PayOrderCel = chqtype
      this.Amount = amount
      this.EntryNo=entryno
      this.check_chqueno()
    }
    else {
      //  console.log(this.newarray);
      this.newarray.splice(index, 1);
      this.flag="0";
    }
  }

  check_chqueno() {
    debugger
    this.AssignCount="1"

    if (this.PayOrderCel == "" || this.PayOrderCel == "CHQ") {

      if (this.AvilableCount >= this.AssignCount) {
        this.CHEQUENO = this.start_chqno
        this.BankRefNo=this.start_chqno
        //  this.StartCheck =  parseInt(this.StartCheck) + 1
        this.AssignCount = parseInt(this.AssignCount) + 1
        //  document.getElementById("inputbox_chqno").style.color= "green";

      }
      else {
        if(this.start_chqno==undefined)
        {
          this.CHEQUENO ="";
        }
        else{
        this.CHEQUENO = "Not Available."
      }
        //   document.getElementById("inputbox_chqno").style.color= "red";

      }
    } else if (this.PayOrderCel == "Not Over") {
      if (this.AvilableCount >= this.AssignCount) {

        this.CHEQUENO = this.start_chqno
        //    this.StartCheck =  parseInt(this.StartCheck)+ 1
        this.AssignCount = parseInt(this.AssignCount) + 1
        // document.getElementById("inputbox_chqno").style.color= "green";

      }
      else {
        if(this.start_chqno==undefined)
        {
          this.CHEQUENO ="";
        }
        else{
        //this.CHEQUENO = "Not Available."
        if(this.start_chqno==undefined)
        {
          this.CHEQUENO ="";
        }
        else{
        this.CHEQUENO = "Not Available."
      }
      }

      }
    }
    else if (this.PayOrderCel == "Pay Order" && (this.Amount >= this.HDPOAMT)) {

      if (this.AvilableCount >= this.AssignCount) {

        this.CHEQUENO = this.start_chqno
        //  this.StartCheck = parseInt(this.StartCheck) + 1
        this.AssignCount = parseInt(this.AssignCount) + 1


      }
      else {

       // this.CHEQUENO = "Not Available."
       if(this.start_chqno==undefined)
        {
          this.CHEQUENO ="";
        }
        else{
        this.CHEQUENO = "Not Available."
      }
      }
    }
    else if (this.PayOrderCel == "NEFT" && (this.Amount >= this.HDNEFTAMT && this.Amount < 199999.99)) {
      if (this.AvilableCount >= this.AssignCount) {
        this.CHEQUENO = this.start_chqno
        //  this.StartCheck =  parseInt(this.StartCheck)+ 1
        this.AssignCount = parseInt(this.AssignCount) + 1
         }
      else {
        this.CHEQUENO = "Not Available."
        if(this.start_chqno==undefined)
        {
          this.CHEQUENO ="";
        }
        else{
        this.CHEQUENO = "Not Available."
      }

      }
    }
    else if (this.PayOrderCel == "RTGS" && this.Amount >= this.HDNEFTAMT) {
      if (this.AvilableCount >= this.AssignCount) {
        this.CHEQUENO = this.start_chqno
        //  this.StartCheck =  parseInt(this.StartCheck) + 1
        this.AssignCount = parseInt(this.AssignCount) + 1

      }
      else {
       // this.CHEQUENO = "Not Available."
       if(this.start_chqno==undefined)
        {
          this.CHEQUENO ="";
        }
        else{
        this.CHEQUENO = "Not Available."
      }

      }
    }
    else if (this.PayOrderCel == "DD") {
      if (this.AvilableCount >= this.AssignCount) {
        this.CHEQUENO = this.start_chqno
        // this.StartCheck =  parseInt(this.StartCheck) + 1
        this.AssignCount = parseInt(this.AssignCount) + 1
        }
      else {
        this.CHEQUENO = "Not Available."

      }
    }

  }
  close1() {
    this.showModal_ChequenoList = false
  }
  OpenView(No) {
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-Request-Bank-Payment-print/' +  No + '/', "Request Bank Payment View", toolbar);
  }
}
