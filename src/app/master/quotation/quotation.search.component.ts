import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';

@Component({
  selector: 'app-quotation-search',
  templateUrl: './quotation.search.component.html',
   styleUrls: ['./quotation.search.component.scss']
})
export class QuotationSearchComponent implements OnInit {

  searchValue: String = "";
  startdate;
  enddate;
  quotationlist: any = []
  client;
  origin: string = ''
  origintable: any = []
  clientable: any = []
  shpmodetable:any
  type:any
  exampleRadios1:string='1'
  displayType:string='SEARCH'
  config: any; 
  public searchString: string;
  SearchTitle:string="Quotation Search"
  shipmode;
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
      CMPID: this._loginService.getLogin()[0].CMPID,
    }
    this._dataService.getData("Admin/ADMIN_QUOTATION_PAGELOAD", jsonmaster2)
      .subscribe((data: any) => {
        this.origintable = data.Table1
        this.clientable = data.Table
        this.shpmodetable = data.Table5
      })
      this.config = { 
        itemsPerPage: 15,
        currentPage: 1,
        totalItems:this.quotationlist.count
      };  

  }



  searchlist() {
     this._loginService.verifyRights(431, '')
      .subscribe((data: any) => { 
          this._loginService.checkVerify('View', data); 
          
      });
    var jsonmaster
    let serchtext="",frdt="",todt="";
    if (this.exampleRadios1 == "1") {
      serchtext=this.client
      if (this.client=="" || this.client==null || this.client==undefined)
      {
        this._toasterService.toast('warning', 'warning', "Please select client !");
        return false;
      }
   
    } 
    else if (this.exampleRadios1== "2") {
      serchtext=this.shipmode
      if (this.shipmode=="" || this.shipmode==null || this.shipmode==undefined)
      {
        this._toasterService.toast('warning', 'warning', "Please select shipment mode !");
        return false;
      }
      
    }
    else if (this.exampleRadios1== "3") {
      serchtext=this.origin
      if (this.origin=="")
      {
        this._toasterService.toast('warning', 'warning', "Please select origin !");
        return false;
      }
      
    } else {
      serchtext=""

        if (!this.startdate) {
            this._toasterService.toast('warning', 'warning', "Please select start date !");
            return false;
        }
        else if (!this.enddate) {
            this._toasterService.toast('warning', 'warning', "Please select end date !");
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
    jsonmaster = { SearchVal: this.exampleRadios1, SearchText: serchtext, efftfrdt: (this.startdate==undefined ? "" : this.startdate.formatted), effttodt: (this.enddate==undefined ? "" : this.enddate.formatted) }
   // console.log(jsonmaster)
        this._dataService.getData("Admin/ADMIN_QUOTATION_SEARCHLIST", jsonmaster)
      .subscribe((data: any) => {
       // console.log(data)
        this.quotationlist = data.Table
        if(data.Table.length==0){
          this._toasterService.toast('warning', 'warning', "No records found !");
        }
        this.displayType='LIST';
        this.SearchTitle="Quotation List"
        this.loaderService.display(false)
      })
  
  }

 ListOnclick(ID,quotno,shipmode) {
    if (confirm('Click Ok to Print or Click Cancel to Edit ?')) {
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        if (shipmode == "AIR") {
      window.open('./#/popup/Air-Quotationprint/' + quotno + '/', "Air Quotation Print", toolbar);
    }
    else if (shipmode == "SEA") {
      window.open('./#/popup/Sea-Quotationprint/' + quotno + '/', "Sea Quotation Print", toolbar);
  }
   } 
   else
   { this._router.navigate(['/master/quotation/Quotation/' + quotno ]);
  }
    }
   
  pageChanged(event){
    this.config.currentPage = event;
  }
  back() {
    //this.result.emit(true);
    this._router.navigate(['/master/quotation/QuotationSearch']);
    }
    Reset() {
      this.client=null
      this.origin=null
      this.startdate=""
      this.enddate=""
      this.searchValue = "1";
    }

}
