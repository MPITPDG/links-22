import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-RePrintCheque-Chequereport-search',
    templateUrl: './ReprintCheque-Assign-ChequeNo.component.html',
    styles: []
  })

  export class RePrintChequeAssignChequeNoComponent implements OnInit {
    data_list:any=[];
    displayType: string = 'LIST';
    OurBankList:any=[];
    OurBank:string; 
    defval:string;
    PrintCount:number=0;
    public showModal_ChqList: boolean = false; 
    ListChq: any=[]; 
    newArray: any = [];
    checkbox: boolean;
    Loadstatus:string;
    ChkStatus:string;
    SChequeNo:String;
    MSG:string="";
    Chequestr:any=[];
    hdnstatus:string; 
    AvailableCount :number;
    AssignCount:number;
    PayOrderCel:string="";
    StartCheque:number;
    celltxt:string="";
    str:string="";
    chkclick:string="N";
    public myDatePickerOptions: IMyDpOptions = {
      dateFormat: 'dd-mmm-yyyy',
      inline: false,
      height: '20px',
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
  
    constructor(private _dataService: DataService,
      private _toasterService: ToastCommonService,
      private loaderService: LoaderService,
      private http: HttpClient,
      private _activatedRoute: ActivatedRoute,private _router:Router,
      private _loginService: LoginService,
    ) { }
    ngOnInit() {
      this.verifyPermission('92','View')
        const jsonparam= {  CMPCODE:this._loginService.getLogin()[0].CMPCODE,
            CITYCODE:this._loginService.getLogin()[0].CITYCODE,
            CITYCODE1:this._loginService.getLogin()[0].CITYCODE1
             }
    
        this._dataService.getData("Accounts/ACC_CHEQUESTOCK_FILLOURBANK",jsonparam)
        .subscribe((data: any) => {
            this.OurBankList=data.Table;
            
        });
        this.loaderService.display(false)
        const jsondef= {  CMPCODE:this._loginService.getLogin()[0].CMPCODE,
            CITYCODE:this._loginService.getLogin()[0].CITYCODE,
            CITYCODE1:this._loginService.getLogin()[0].CITYCODE1
             }
    
        this._dataService.getData("Accounts/ACC_SETDEFAULT",jsondef)
        .subscribe((data: any) => {
             this.defval=data.Table[0].acctcode;
              let defbankval=data.Table[0].acctcode;
            this.OurBank=defbankval;
            if(this.OurBankList != undefined  )
            {
            this.GetDataList();
              }
        });
       /// this.SetDefBank();

    }
  verifyPermission(formId, userMode) {
    this.loaderService.display(true);
    this._loginService.verifyRights(formId, '')
        .subscribe((data: any) => {          
           this._loginService.checkVerify(userMode, data);
           this.loaderService.display(false);

        });
}
    
    SetDefBank()
    {  
    const jsondef= {  CMPCODE:this._loginService.getLogin()[0].CMPCODE,
        CITYCODE:this._loginService.getLogin()[0].CITYCODE,
        CITYCODE1:this._loginService.getLogin()[0].CITYCODE1
         }

    this._dataService.getData("Accounts/ACC_SETDEFAULT",jsondef)
    .subscribe((data: any) => {
        this.defval=data.Table[0].acctcode;
        let defbankval=data.Table[0].acctcode;
        this.OurBank=defbankval;
        
    });
    this.loaderService.display(false)
        } 

    GetDataList()
    {
        const jsondata= {
            USERID: this._loginService.getLogin()[0].CMPID,    
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            citycode: this._loginService.getLogin()[0].CITYCODE,
            ENTRYNO:"",
            FROMDATE:"",
            TODATE:"",
            OURBNK:this.OurBank,
            TYPE:"",
            STATUSTYPE:""
        
        }

        this._dataService.getData("Accounts/ACC_BP_CMP_CHEQUE_SEARCH_READYTO_REPRINT", jsondata)
        .subscribe((data: any) => { 
           
                this.data_list = data.Table
                this.loaderService.display(false)
               
           
        } );
    }
    ViewChequeStockhelp()
    {
        this.showModal_ChqList = true
        this.loaderService.display(true)
        const jsonchqdtl= {
                   
          CMPCODE : this._loginService.getLogin()[0].CMPCODE,
          CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
          chequeno:"",
          OURBANK:this.OurBank.split("|")[0]
           

        };

        this._dataService.getData("Accounts/ACC_CHEQUE_STOCK_HELPVIEW", jsonchqdtl)
        .subscribe((data: any) => { 
           
                this.ListChq = data.Table
                this.loaderService.display(false)
               
           
        } );
      
    }

    checkAll(ev) {
        this.newArray = []
        this.data_list.forEach(x => x.Checked = ev.target.checked)
        if (ev.target.checked == true) {
          for (var i = 0; i < this.data_list.length; i++) {
            let obj = {
              bpno: this.data_list[i].entryno
            }
            this.newArray.push(obj);
          }
        } else {
          this.newArray = []
        }
      }


      CheckStatus()
      {
        if (this.SChequeNo.toString() == '' || this.SChequeNo == undefined) {
          alert("Please Enter Starting Cheque No");
          this._toasterService.toast('warning', 'warning', 'Please Enter Starting Cheque No!');
          return false;
      }
      if (this.newArray == "" || this.newArray == undefined) {
        this._toasterService.toast('warning', 'warning', 'Please Select Atleast one Cheque!');
        return false;
      }
        const jsonchqstatus= {
                   
          CMPCODE: this._loginService.getLogin()[0].CMPCODE,
          CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
          CHEQUENO:this.SChequeNo,
          OURBNK:this.OurBank.split("|")[0],
          PRINTCOUNT:this.PrintCount
        };

      this._dataService.getData("Accounts/ACC_BP_CHEQUE_AVAILABILITY", jsonchqstatus)
      .subscribe((data: any) => { 
            if(data.Table[0].STATUS1=="1")
            { 
              this.ChkStatus="Y"
              this.MSG="All Cheques Available"

            }
            else
            { 
              this.ChkStatus="N"
              if(data.Table[0].STATUS=="0")
              {
                this.MSG="Cheque/s does not available"
              } 
              else
              {
                this.MSG="*" + (data.Table[0].STATUS + " Continuous Cheques Available")
              } 
            }
            this.Assign(data.Table);
          } );     
          this.loaderService.display(false)   
          //this.chkclick="Y";
             }

    close() {
        this.showModal_ChqList = false;
    }

    getCheckboxValues(event, data,chktype) {
      ///this.chkclick="N";
      //this.celltxt = ""
      var index = this.newArray.findIndex(x => x.ENTRYNO == data);
      if (event) {
        let obj = {
          entryno: data,
          checked:event,
          chequetype:chktype
        } 
        this.Chequestr = this.Chequestr  +  data  + "," 
        this.newArray.push(obj);
        this.PrintCount=this.PrintCount+1;
      }
      else {
        //this.newArray.push(obj);
        this.newArray.splice(index, 1);
        this.PrintCount=this.PrintCount-1;
      }
    }
  Assign(dtbl)
  {
    if (dtbl[0].STATUS != "0")
      {
        this.AvailableCount=dtbl[0].STATUS;
        this.AssignCount=1;
        this.StartCheque=Number(this.SChequeNo);
      for (let i = 0; i < this.data_list.length; i++) {
       if (this.data_list[i].Checked === true)
       { 
        if(this.AvailableCount >= this.AssignCount)
          {
        this.data_list[i]["CHEQUENO"] = this.StartCheque;
        //this.data_list[i]["CHEQUENO"].color="Green" 
        this.StartCheque = this.StartCheque + 1
        this.AssignCount = this.AssignCount + 1
          } 
        else
          {
            this.data_list[i]["CHEQUENO"] = "Not Available"
            
          } 
       } 
         else
           {
            this.data_list[i]["CHEQUENO"] = ""
               
          } 
        }  
      }
      else
      for (let i = 0; i < this.data_list.length; i++) {
        if (this.data_list[i].Checked === true)
        {  
          this.data_list[i]["CHEQUENO"]="Not Available"
        }
        else
        {  
          this.data_list[i]["CHEQUENO"]=""
        }
      }

      } 
  

    AssignChqNoToList(dtbl)
    {
      if (dtbl[0].STATUS == "1")
      {
        //var StartCheque=this.SChequeNo;
        this.AvailableCount=dtbl[0].STATUS;
        this.AssignCount=1;

       
      for (var i = 0, len = this.newArray.length; i < len; i++) {
        if(this.newArray[i].checked==true) 
        {
        
            if(this.AvailableCount >= this.AssignCount)
            {
            //this.celltxt = this.SChequeNo
            this.StartCheque = this.StartCheque + 1
            this.AssignCount = this.AssignCount + 1
             } 
            else
              {
           this.celltxt = "Not Available"
                 
              } 
        } 
        else
        {
               this.celltxt = ""
                     
              } 
            }  
          }    
           else
           {
            for (var i = 0, len = this.newArray.length; i < len; i++) {
              if(this.newArray[i].checked==true) 
              {
                this.celltxt = "Not Available"
              }     
              else
              {
                this.celltxt = ""
              } 
           } 

        } 
        ////this.newArray = []
    }
    AssignToPrint()
    {
      this.CheckStatus();
      //var str = '';
      var j=0;
      for (var i = 0, len = this.newArray.length; i < len; i++) {
        this.str += this.newArray[i].entryno + ' ,' ;
        this.hdnstatus="I";
        j=j+1;
    }
      if(this.ChkStatus=="Y")
      {
        const jsonprint= {
                   
          CMPCODE: this._loginService.getLogin()[0].CMPCODE,
          CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
          CHEQUENO:this.SChequeNo,
          COUNT:this.PrintCount,
          OURBNK:this.OurBank.split("|")[0],
          ENTRYNO:this.str,
          PSTATUS:this.hdnstatus
        }

      this._dataService.getData("Accounts/ACC_CMP_BP_CHEQUENO_ASSIGNTOPRINT_LIST", jsonprint)
      .subscribe((data: any) => { 
            if(data.Table[0].STATUS1=="1")
            { 
              this.MSG="*All Cheques Available";
              this.RedirectToPrint(this.str);
            }
            else
            { 
            if(data.Table[0].STATUS=="0")
            { 
              this.MSG="Cheque/s does not available";
              this._toasterService.toast('warning', 'warning', 'Cheque/s does not available!');
            }
            else
            { 
              this._toasterService.toast('warning', 'warning', '"*" + data.Table[0].STATUS + " Continuous Cheques Available"!');
             
            }

      } 
    });
      } 
    } 

      RedirectToPrint(chkstr)
      { 
        var StrValue="";var StrChequeno="";
        const jsonchkprint= {
                   
          strentryNo: chkstr
             }

      this._dataService.getData("Accounts/ACC_BP_CMP_CHEQUE_READYTO_PRINT_LIST_35", jsonchkprint)
      .subscribe((data: any) => { 
                    if(data.Table.length>0)
                    { 
                      var ENTRYNO;var STATUS1;var chequeno;var OurBank1;
                      for (var i = 0, len = data.Table.length; i < len; i++) {
                        STATUS1=data.Table[i].Status;
                        ENTRYNO=data.Table[i].EntryNo;
                        chequeno=data.Table[i].ChequeNo;
                        OurBank1=this.OurBank;
                        StrValue= StrValue + (ENTRYNO) + "," + chequeno + "," + (OurBank1) + "," + "P" + "," + "" + ";"
                        StrChequeno=StrChequeno + chequeno + ","
                    }
      
                    }

      });
  }

      ViewReqBP(enno,name)
      {
        if(enno ==''||enno==undefined || enno.length < 15){
          alert("Enter 15 digit EntryNo No !")
          return false
        }
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/Account-Request-Bank-Payment-print/' + enno + '/' , "BPRequest View", toolbar);
      
            // let theTop = (screen.height / 2) - (483 / 2);
            // let theLeft = (screen.width / 2) - (780 / 2);
            // let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
            // let URL = "http://localhost:1086/manilal_v4_20200303_0859/UI/Accounts/frm_Acc_CompCheq_Request_BP_View.aspx?" +
            // "EntryNo=" + enno
            // + "&EntryDt=" + name
            // window.open(URL, "", toolbar);
            // this.loaderService.display(false);
      }

    }
