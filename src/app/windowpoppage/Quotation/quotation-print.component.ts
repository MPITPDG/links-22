import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-quotation-print',
  templateUrl: './quotation-print.component.html',
  styleUrls: ['./quotation-print.component.css'] // or .scss
})
export class SalesQuotationPrintComponent implements OnInit {
  // Replace this with your actual data binding
  @Input() quote: any;
  @Input() company: any;
  @Input() client: any;
  @Input() companyLogoUrl: string = 'assets/logo.png'; 
  quotationno:any;
  quotmastertable:any=[]
  quotdtltable:any=[]
  quotno;
  quotdate;
  validupto;
   cmpname;
   cmpimage;
   clientemail;
   contactperson;
   incoterm;
   shipmenttype;
   containerloadtype;
   pickup;
   pol;
   pod;
   ocean;
   shipmode;
  constructor(
        private _dataService: DataService,
        private _loaderService: LoaderService,
        private _router: Router,
        private http: HttpClient,
        private _route: ActivatedRoute,
        private _loginService: LoginService,
      ) { }
  ngOnInit() {
      this._route.params.subscribe(params => {
        this.quotationno = params["quotno"]
        console.log(this.quotationno);
        // this.incoterm="EXWOP"
        // this.shipmenttype="EXPORT"
        //this.containerloadtype='LCL/FCL'
          this.getDataforPrint()
      });
      
   
    }

     
    getDataforPrint()
    {
        const json = { QUOTCODE:this.quotationno} 
            this._dataService.getData("Master/MASTER_QUOTATION_PRINT", json)
        .subscribe((data: any) => {
            console.log(data);
            this.quotmastertable= data.Table;
            this.quotno=data.Table[0].QUOT_CODE;
            console.log(data.Table[0].QUOT_CODE);
            this.quotdate=data.Table[0].QUOT_DATE;
            this.quotdate=this.convertDateToHyphenFormat(this.quotdate);
            this.validupto=data.Table[0].VALIDUPTO;
            this.validupto=this.convertDateToHyphenFormat(this.validupto);
            this.cmpname=data.Table[0].CMP_NAME;
            this.cmpimage="assets/img/Untitled-1.png";// + data.Table[0].CMP_IMAGE;
            this.clientemail=data.Table[0].EMAIL;
            this.quotdtltable= data.Table1;
            this.contactperson=data.Table[0].CONTACT_PERSON;
            this.pickup='';
            this.pol=data.Table[0].POL;
            this.pod=data.Table[0].POD;
            this.shipmode=data.Table[0].SHIP_MODE;
            this.ocean=data.Table[0].LINER_NAME;
            this.shipmenttype=data.Table[0].SHIP_TYPE;
            this.containerloadtype=data.Table[0].CONTLOADTYPE;
            this.incoterm=data.Table[0].INCOTERM;
          })
          console.log( this.quotno);
           this._loaderService.display(false);
       
    }
  // Function to trigger the browser's print dialog
  printDocument(): void {
    window.print();
  }
  convertDateToHyphenFormat(dateString: string): string {
  if (!dateString) {
    return ''; // Handle null or empty input
  }
  
  // 1. Split the string by the '/' separator.
  const parts = dateString.split('/'); 
  
  // Check if we have three parts (DD, MM, YYYY)
  if (parts.length === 3) {
    // 2. Join the parts using the '-' separator.
    // The order (parts[0]=DD, parts[1]=MM, parts[2]=YYYY) remains the same.
    return parts.join('-');
  }
  
  // Return the original string if the format is unexpected
  return dateString;
}
}