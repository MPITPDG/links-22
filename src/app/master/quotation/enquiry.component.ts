// enquiry-page.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IMyOptions} from 'mydatepicker';
import { DataService } from '../../shared/service/dataService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { DatePipe } from '@angular/common'

@Component({
  selector: 'app-enquiry-page',
  templateUrl: './enquiry.component.html',
     styleUrls: ['./quotation.search.component.scss']
})
export class EnquiryPageComponent implements OnInit {
  enquiryForm!: FormGroup;
  enqmodetable: any = []
  enqtypetable: any = []
  enqeximtable: any = []
  enqinputbytable: any = []
  enqshipmenttable: any = []
  incotermtable: any = []
  enqnetworktable: any = []
  enqcountrytable: any = []
  enqsalespersontable: any = []
  enqstatustable: any = []
  enqbranchtable: any = [] 
  enqdimensiontable: any = [] 
  enqpoltable: any = [] 
  enqpodtable: any = [] 
  enqagenttable: any = [];
  enquirydetails: any = []; 
  enquiryinputby: string = '';
  enqtype;
  enqexim;
  enqnetwork;
  enqshipment;
  enqincoterms;
  enqcountry;
  enqagentName;
  enqsalesPerson;
  enqmode;
  enqdimension;
  enqpol;
  enqpod;
  enqaoa;
  enqaod;
  emailsubjectline: string = '';
  remarks: string = '';
  jobno: string = '';
  shipper: string = '';
  consignee: string = '';
  enqstatus;
   daystaken: string = '';
  specialremark: string = '';
  enqrefno: string = '';
  enqreceiptdt;
  enqquotedt;
  enqbranch;
  pkid;
  enqinputby;
  btntext:string="SUBMIT"
  PKID: string = '0';
  dispno;
  //enqmodetable: any = [] 
  // Dropdown data arrays
 

   public myDatePickerOptions: IMyOptions= {
    dateFormat: 'dd/mm/yyyy',
    inline: false,
    height: '20px',
    width: '160px',
    componentDisabled: false,
    selectionTxtFontSize: '12px',
    editableDateField: false,
    sunHighlight: true,
    //satHighlight: true,
    firstDayOfWeek: 'su',
    openSelectorTopOfInput: false,
    openSelectorOnInputClick: true,
    // //selectorHeight: '180px',    // selectorWidth: '200px'
  };
  public myDatePickerOptions1: IMyOptions= {
    dateFormat: 'dd/mm/yyyy',
    inline: false,
    height: '20px',
    width: '160px',
    componentDisabled: false,
    selectionTxtFontSize: '12px',
    editableDateField: false,
    sunHighlight: true,
    //satHighlight: true,
    firstDayOfWeek: 'su',
    openSelectorTopOfInput: true,
    openSelectorOnInputClick: true,
    // //selectorHeight: '180px',    // selectorWidth: '200px'
  };

  constructor(private fb: FormBuilder,
    private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private http: HttpClient,
        private _activatedRoute: ActivatedRoute,
        private _loginService: LoginService, public datepipe: DatePipe,
        private _router: Router,
  ) { }

  ngOnInit(): void {
    this.enquiryForm = this.fb.group({
    });
    this.enqmodetable = [
      { DATAVALUE: 'Air', DATATEXTVALUE: 'Air' },
      { DATAVALUE: 'Sea', DATATEXTVALUE: 'Sea' },

    ];
    this.enqeximtable = [
    { DATAVALUE: 'Export', DATATEXTVALUE: 'Export' },
    { DATAVALUE: 'Import', DATATEXTVALUE: 'Import' },

  ];
  this._activatedRoute.params.subscribe(params => {
         this.enqrefno = params["enquiryno"];
  }) ;
   this.enqreceiptdt = new Date();
    this.enqreceiptdt = this._dataService.datechnge(this.enqreceiptdt)
    this.pageload();
     if (this.enqrefno != ' ') {
      this._loginService.verifyRights(432, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });
         this.editpopulate()
    }
    else {
      this._loginService.verifyRights(432, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });

    }
   
      // this.containerloadtypetable = [
      //   { DATAVALUE: 'LCL/FCL', DATATEXTVALUE: 'LCL/FCL' },
      //   { DATAVALUE: 'FCL/FCL', DATATEXTVALUE: 'FCL/FCL' },
      //   { DATAVALUE: 'LCL/LCL', DATATEXTVALUE: 'LCL/LCL' },
      //   { DATAVALUE: 'FCL/LCL', DATATEXTVALUE: 'FCL/LCL' },
      //   { DATAVALUE: 'GROUPAGE', DATATEXTVALUE: 'GROUPAGE' }
      // ];
 
  }
  editpopulate() {
    
      const jsonmaster = {
        EnqNo: this.enqrefno,
        Makerid: this._loginService.getLogin()[0].CMPID,
        VGuid: this._loginService.getLogin()[0].GUID,
        
      }
      this.loaderService.display(true)
      this._dataService.getData("Admin/ADMIN_SALESENQUIRY_POPULATE", jsonmaster)
        .subscribe((data: any) => {
          if (data.Table[0].STATUS == "100") {
            console.log(data.Table[0])
              
              this.dispno = data.Table[0].DISPNO,
              this.enqrefno = data.Table[0].ENQREFNO,///data.Table[0].ENQREFNO,
              this.enqreceiptdt = data.Table[0].ENQRECPTDT,
             // this.enqinputby = data.Table[0].ENQINPUTBY,
              this.enqtype = data.Table[0].ENQTYPE,
              this.enqshipment = data.Table[0].SHIPMENT,
              this.enqexim = data.Table[0].EXIM,
              this.enqincoterms = data.Table[0].INCOTERM,
              this.enqnetwork = data.Table[0].NETWORK,
              this.enqcountry = data.Table[0].COUNTRY_CODE,
              this.enqagentName = data.Table[0].AGENT_NAME,
              this.enqsalesPerson = data.Table[0].SALESPERSON,
              this.enqbranch = data.Table[0].BRANCH,
              this.enqmode = data.Table[0].MODE,
              // this.enqaod = data.Table[0].AOD,
              // this.enqaoa = data.Table[0].AOA,
              this.enqdimension = data.Table[0].DIMENSION,
              this.enqpol = data.Table[0].POL,
              this.enqpod = data.Table[0].POD,
             // this.jobno = data.Table[0].JOBNO,
              this.remarks = data.Table[0].REMARK,
             // this.specialremark = data.Table[0].SPREMARK,
              this.emailsubjectline = data.Table[0].EMAIL,
              this.shipper = data.Table[0].SHIPPER,
              this.consignee = data.Table[0].CONSIGNEE,
              // this.enqquotedt = data.Table[0].ENQ_QUOT_DATE,
               this.enqstatus = data.Table[0].ENQSTATUS,
              // this.daystaken = data.Table[0].QUOTRATEDAYS,
              this.pkid = data.Table[0].PK_ID,
              this.btntext="UPDATE";
            this.loaderService.display(false)
          } else {
            this._toasterService.toast('error', 'error', data.Table[0].STATUSTEXT);
            this.loaderService.display(false)
          }
        })
    }
  pageload(){
    const jsonmaster2 = {
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
    }
    this._dataService.getData("Admin/ADMIN_SALESENQUIRY_PAGELOAD", jsonmaster2)
      .subscribe((data: any) => {
        
        this.enqsalespersontable = data.Table;
        this.enqtypetable = data.Table1;
        this.enqshipmenttable= data.Table2;
        this.enqnetworktable = data.Table3
        this.enqdimensiontable = data.Table4
        this.enqstatustable = data.Table5
        this.enqcountrytable = data.Table6
        this.incotermtable = data.Table7
        this.enqbranchtable = data.Table8;
        this.enqpoltable = data.Table9
        this.enqpodtable = data.Table9
        this.enqagenttable = data.Table10
        this.enquirydetails=data.Table11;
      

        this.loaderService.display(false)
        console.log(data)
      })
  }
   onenqreceiptdtChanged(ev2) {
    this.enqreceiptdt = ev2.formatted
  }
  onenqquotedtChanged(ev3) {
    this.enqquotedt = ev3.formatted
  }
  AddEnquiry() {

         if (this.enqmode == "" || this.enqmode == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Mode !');
      return false;
    }
     if (this.enqtype == "" || this.enqtype == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Enquiry Type !');
      return false;
    }
   
     if (this.enqexim == "" || this.enqexim == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Exim !');
      return false;
    }
      if (this.enqsalesPerson == "" || this.enqsalesPerson == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Sales Person !');
      return false;
    }
          if (this.enqagentName == "" || this.enqagentName == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please Enter Agent Name !');
      return false;
    }

        if (this.enqcountry == "" || this.enqcountry == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Country !');
      return false;
    }
    
       if (this.enqbranch == "" || this.enqbranch == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Branch !');
      return false;
    }
          if (this.enqnetwork == "" || this.enqnetwork == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Network !');
      return false;
    }
   
     if (this.enqpol == "" || this.enqpol == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Port Of Loading !');
      return false;
    }
     if (this.enqpod == "" || this.enqpod == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Port Of Discharge !');
      return false;
    }
        if (this.enqincoterms == "" || this.enqincoterms == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Incoterms !');
      return false;
    }
 

     if (this.enqdimension == "" || this.enqdimension == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Dimension !');
      return false;
    }
    
     if (this.enqstatus == "" || this.enqstatus == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Status !');
      return false;
    }
    this.loaderService.display(true);
     const enquiryData = {
            PK_ID: (this.pkid=="0" || this.pkid==null)? "":this.pkid,
            ENQREFNO: this.enqrefno,
            ENQRECPTDT: this.enqreceiptdt,
            ENQTYPE: this.enqtype ,
            EXIM: (this.enqexim==null)?"":this.enqexim,
            INCOTERM: (this.enqincoterms==null)?"":this.enqincoterms,
            NETWORK: (this.enqnetwork==null)?"":this.enqnetwork,
            COUNTRY_CODE: (this.enqcountry==null)?"":this.enqcountry,
            AGENT_NAME: (this.enqagentName==null)? "": this.enqagentName,
            SALESPERSON: (this.enqsalesPerson==null)?"":this.enqsalesPerson,
            BRANCH:  (this.enqbranch==null)?"":this.enqbranch,
            MODE: (this.enqmode==null)?"":this.enqmode,
            DIMENSION:(this.enqdimension==null)?"":this.enqdimension,
            POL:(this.enqpol==null)?"":this.enqpol,
            POD:this.enqpod,
            EMAIL: this.emailsubjectline,
            REMARK: (this.remarks== '') ? "" : this.remarks,
            SHIPPER: (this.shipper=='') ? "" : this.shipper, 
            CONSIGNEE: (this.consignee=='') ? "" : this.consignee, 
            STATUS: (this.enqstatus==null)?"":this.enqstatus,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
            CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
            MAKERID: this._loginService.getLogin()[0].CMPID,
            MAKERIP: this._loginService.getLogin()[0].MAKERIP,
            // ID: this.ID,
            // NOOFDAYS: (this.noofdays == '') ? "30" : this.noofdays,
            // UNBLOCK: (this.unblock == true) ? "0" : "",
            // ISRESIGNED: (this.isresigned == true) ? "Y" : "",
            // branchlist : this.branchcode,           
        }
         this._dataService.Common("Admin/Admin_SalesEnquiry_IU", enquiryData)
            .subscribe((data: any) => {
               
                console.log(data.Table[0].STATUS)              
                if (data.Table[0].STATUS == "100") {
                  this.enquirydetails=data.Table1;
                    { this._toasterService.toast('success', 'success', data.Table[0].STATUSTEXT); }
                    this.loaderService.display(false);
                    this.ResetEnquiry();
                     this._router.navigate(['/master/quotation/enquiry/ ']);
     
                }
                else {
                    this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT);
                }
            });
  }
    TextareaValueChange(ev) {
    this.specialremark = ev.target.value;
  }

   EditEnquiry(id) {
    /////  let filterData = this.chargesdetails.filter((filter) => filter.PKID == id)[0];
    let filterData = id;
    this.PKID = filterData.PK_ID;
    this.enqrefno = filterData.ENQREFNO;
    this.enqreceiptdt= filterData.ENQRECPTDT;
    this.enqtype = filterData.ENQTYPE;
    this.enqmode = filterData.MODE;
    this.enqexim = filterData.EXIM;
    this.enqsalesPerson = filterData.SALESPERSON;
    this.enqagentName = filterData.AGENT_NAME;
    this.enqcountry = filterData.COUNTRY_CODE;
    this.enqbranch = filterData.BRANCH;
    this.enqnetwork=filterData.NETWORK;
    this.enqpod=filterData.POD;
    this.enqpol=filterData.POL;
    this.enqdimension=filterData.DIMENSION;
    this.enqincoterms=filterData.INCOTERM;
    this.enqstatus=filterData.ENQSTATUS;
    this.emailsubjectline=filterData.EMAIL;
    this.remarks=filterData.REMARK;
    this.shipper=filterData.SHIPPER;
    this.consignee=filterData.CONSIGNEE;
    this.dispno=filterData.DISPNO;
    this.btntext = "Update"
  }

  DeleteEnquiry(id){
              
                  if(confirm('Are you sure want to delete the record ?')) { 
                      this.loaderService.display(true);      
                      const jsondelete = { ID  : id,
                        CMPCODE: this._loginService.getLogin()[0].CMPCODE,
                        CITYCODE: this._loginService.getLogin()[0].CITYCODE,
                      
                      }
                      this._dataService.getData("Admin/ADMIN_SALESENQUIRY_DELETE", jsondelete)
                          .subscribe((data: any) => {              
                          if (data.Table[0].STATUS== "100") {
                              this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT );
                              this.enquirydetails=data.Table1;
                              this.loaderService.display(false);
                              }            
                              else { 
                              this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT);
                              this.loaderService.display(false);
                              }
                          });            
                        }
  }


ResetEnquiry(){

    this.enquiryinputby = null;
    this.enqagentName='';
    this.enqshipment = null;
    this.enqtype = null;
    this.enqexim = null;
    this.enqnetwork = null;
    this.enqincoterms = null;
    this.enqcountry = null;
    this.enqsalesPerson = null;
    this.enqbranch = null;
    this.enqmode = null;
    this.enqdimension = null;
    this.enqpol = null;
    this.enqpod = null;
    this.enqaoa = '';
    this.enqaod = '';
    this.emailsubjectline = '';
    this.remarks = '';
    this.jobno = '';
    this.shipper = '';
    this.consignee = '';
    this.enqstatus = '';
    this.enqquotedt = '';
    this.daystaken = '';
    this.specialremark = '';
    this.enqrefno = '';
    this.dispno = '';
    this.enqreceiptdt = new Date();
    this.enqreceiptdt = this._dataService.datechnge(this.enqreceiptdt)
    this.enqquotedt = '';
    this.btntext="SUBMIT"
    
}
ResetMainEnquiry() {
      if(confirm('Are you sure you want to reset enquiry data?')){
    this.enquiryForm.reset();
    this.enqtypetable = [];
    this.enquiryinputby = null;
    this.enqagentName='';
    this.enqshipment = null;
    this.enqnetwork = null;
    this.enqincoterms = null;
    this.enqcountry = null;
    this.enqsalesPerson = null;
    this.enqbranch = null;
    this.enqmode = null;
    this.enqdimension = null;
    this.enqpol = null;
    this.enqpod = null;
    this.enqaoa = '';
    this.enqaod = '';
    this.emailsubjectline = '';
    this.remarks = '';
    this.jobno = '';
    this.shipper = '';
    this.consignee = '';
    this.enqstatus = '';
    this.enqquotedt = '';
    this.daystaken = '';
    this.specialremark = '';
    this.enqrefno = '';
       this.dispno = '';
    this.enqreceiptdt = new Date();
    this.enqreceiptdt = this._dataService.datechnge(this.enqreceiptdt)
    this.enqquotedt = '';
    this.btntext="SUBMIT"
    this._router.navigate(['/master/quotation/enquiry/ ']);
      }
}
}