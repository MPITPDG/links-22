import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';

@Component({
  selector: 'app-client-origin-rate-search',
  templateUrl: './client-origin-rate-search.component.html',
  styles: []
})
export class ClientOriginRateSearchComponent implements OnInit {

  searchValue: String = "";
  Effective_from_date;
  Effective_to_date;
  Masterdetail_list: any = []
  client: string = ''
  origin: string = ''
  origintable: any = []
  clientable: any = []
  type:any
  exampleRadios1:string='1'
  displayType:string='SEARCH'
  config: any; 
  public searchString: string;
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
    this._dataService.getData("Admin/ACC_CLIENT_RATE_PAGELOAD", jsonmaster2)
      .subscribe((data: any) => {
        this.origintable = data.Table1
        this.clientable = data.Table
      })
      this.config = { 
        itemsPerPage: 15,
        currentPage: 1,
        totalItems:this.Masterdetail_list.count
      };  

  }

  // search(data) {
  //   this.type = data
  //   if (this.type == "Client") {
  //    this.originmodule=false
  //    this.datemodule=false
  //   } else if (this.type == "origin") {
  //     this.clientmodule=false
  //     this.datemodule=false
  //   } else {
  //     this.originmodule=false
  //     this.clientmodule=false
  //   }
  // }

  searchlist() {
    var jsonmaster
    let serchtext="",frdt="",todt="";
    if (this.exampleRadios1 == "1") {
      serchtext=this.client
      if (this.client=="")
      {
        this._toasterService.toast('warning', 'warning', "Please select client !");
        return false;
      }
    //  jsonmaster = { SearchVal:this.exampleRadios1, SearchText: this.client, efftfrdt: "", effttodt: "" }
    } else if (this.exampleRadios1== "2") {
      serchtext=this.origin
      if (this.origin=="")
      {
        this._toasterService.toast('warning', 'warning', "Please select origin !");
        return false;
      }
      //jsonmaster = { SearchVal:this.exampleRadios1, SearchText: this.origin, efftfrdt: "", effttodt: "" }
    } else {
      serchtext=""
      frdt=this.Effective_from_date.formatted;
      todt=this.Effective_to_date.formatted
      if (frdt=="")
      {
        this._toasterService.toast('warning', 'warning', "Please select start Date !");
        return false;
      }
      if (todt=="")
      {
        this._toasterService.toast('warning', 'warning', "Please select to Date !");
        return false;
      }
      if (frdt !="" && todt!=""){
        if (this._dataService.date2Comparison(frdt,todt) ==false)
        {
          this._toasterService.toast('warning', 'warning', 'To date should be greater than from date !');
          return false;
        }
      }
     // jsonmaster = { SearchVal: this.exampleRadios1, SearchText: "", efftfrdt: this.Effective_from_date.formatted, effttodt: this.Effective_to_date.formatted, }
    }
    this.loaderService.display(true)
    jsonmaster = { SearchVal: this.exampleRadios1, SearchText: serchtext, efftfrdt: frdt, effttodt: todt}
   // console.log(jsonmaster)
    this._dataService.getData("Admin/ACC_CLIENT_RATE_SEARCHLIST", jsonmaster)
      .subscribe((data: any) => {
       // console.log(data)
        this.Masterdetail_list = data.Table
        this.displayType='LIST';
        this.loaderService.display(false)
      })
  }

  ListOnclick(ID,CODE) {
    if (confirm('Click Ok to Print or Click Cancel to Edit ?')) {
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      window.open('./#/popup/Admin-Quotation-Print/' + CODE + '/' , "Quotation Print", toolbar);
   } 
   else
   { this._router.navigate(['/master/quotation/ClientRate/' + ID]);
  }
    }
  pageChanged(event){
    this.config.currentPage = event;
  }
  back() {
    //this.result.emit(true);
    this._router.navigate(['/master/quotation/ClientRateSearch']);
}
}
