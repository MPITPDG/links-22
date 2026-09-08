import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';

@Component({
  selector: 'app-enquiry-search',
  templateUrl: './enquiry.search.component.html',
  styleUrls: ['./quotation.search.component.scss']
})
export class EnquirySearchComponent implements OnInit {

  searchValue: String = "1";
  startdate;
  enddate;
  enquirylist: any = []
  salesperson;
  salespersontable: any = []
  enqbranchtable: any = []
  enqbranch;
  type:any
  exampleRadios1:string="1"
  displayType:string='SEARCH'
  config: any; 
  public searchString: string;
   SearchTitle:string="Enquiry Search"
  public myDatePickerOptions: IMyDpOptions = {
    dateFormat: 'dd/mm/yyyy',
    inline: false,
    height: '20px',
    width: '160px',
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
    private _activatedRoute: ActivatedRoute,
    private _loginService: LoginService,
    private _router: Router,
  ) { }

  ngOnInit() {
    const jsonmaster2 = {
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
    }
    this._dataService.getData("Admin/ADMIN_SALESENQUIRY_PAGELOAD", jsonmaster2)
      .subscribe((data: any) => {
        this.salespersontable = data.Table
          this.enqbranchtable = data.Table8;
      
      })
      this.config = { 
        itemsPerPage: 15,
        currentPage: 1,
        totalItems:this.enquirylist.count
      };  

  }

  searchdata() {
    var jsonmaster
    let serchtext="",frdt="",todt="";
    if (this.exampleRadios1 == "1") {
      serchtext=this.salesperson
      if (this.salesperson=="" || this.salesperson==null || this.salesperson==undefined)
      {
        this._toasterService.toast('warning', 'warning', "Please Select Salesperson !");
        return false;
      }
   
    }
    else if (this.exampleRadios1 == "2") {
      serchtext=this.enqbranch
      if (this.enqbranch=="" || this.enqbranch==null || this.enqbranch==undefined)
      {
        this._toasterService.toast('warning', 'warning', "Please Select Branch !");
        return false;
      }
      
    } 
     else if (this.exampleRadios1 == "3")  {
      serchtext=""

        if (!this.startdate) {
            alert("Please Select From Date.");
            return false;
        }
        else if (!this.enddate) {
            alert("Please Select To Date.");
            return false;
        }
        else if (this.startdate !="" && this.enddate!=""){
              if (this._dataService.date2Comparison(this.startdate.formatted,this.enddate.formatted)==false){
              this._toasterService.toast('warning', 'warning', 'End date should be greater than Start date !');
              return false;
            }
          }
    
  }
    this.loaderService.display(true)
    jsonmaster = { SEARCHVAL: this.exampleRadios1, SEARCHTXT: serchtext, STARTDT: (this.startdate==undefined ? "" : this.startdate.formatted), ENDDT: (this.enddate==undefined ? "" : this.enddate.formatted) }
   // console.log(jsonmaster)
        this._dataService.getData("Admin/ADMIN_SALESENQUIRY_SEARCHLIST", jsonmaster)
      .subscribe((data: any) => {
       // console.log(data)
        this.enquirylist = data.Table
        if(data.Table.length==0){
          this._toasterService.toast('warning', 'warning', "No records found !");
        }
        this.displayType='LIST';
        this.SearchTitle="Enquiry List"
        this.loaderService.display(false)
      })
  
  }

 ListOnclick(enqno) {
    if (confirm('Click Ok to Print or Click Cancel to Edit ?')) {
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
       
    
      window.open('./#/popup/enquiryprint/' + enqno + '/', "Enquiry Print", toolbar);

   } 
   else
   { this._router.navigate(['/master/quotation/enquiry/' + enqno ]);
  }
    }
   
  pageChanged(event){
    this.config.currentPage = event;
  }
  back() {
    //this.result.emit(true);
    this._router.navigate(['/master/quotation/enquirysearch']);
    }
    Reset() {
      this.salesperson=null
      this.startdate=""
      this.enddate=""
      this.enqbranch=null
      this.exampleRadios1 = "1";
    }

      Exporttoxl(){
            this.loaderService.display(true);
             let serchtext="",frdt="",todt="";
    if (this.exampleRadios1 == "1") {
      serchtext=this.salesperson
    }
     else if (this.exampleRadios1 == "2") {
      serchtext=this.enqbranch
     }
      else if (this.exampleRadios1 == "3")  {
      serchtext=""
      }

          const  jsonmaster = { SEARCHVAL: this.exampleRadios1, SEARCHTXT: serchtext, STARTDT: (this.startdate==undefined ? "" : this.startdate.formatted), ENDDT: (this.enddate==undefined ? "" : this.enddate.formatted) }
            this._dataService.getDownload("Admin/ADMIN_SALESENQUIRY_LIST_XL", jsonmaster, { responseType: 'arraybuffer' })
                .subscribe((data: any) => {
                    this._dataService.common_downloadFileByUrl(data, "Enquirylist as on date "  + this.enddate.formatted + ".xls");
                    this.loaderService.display(false);
    
                });
              }

}
