import { Directive,Component, OnInit, Output, ViewChild, ElementRef ,ViewEncapsulation,Input, EventEmitter, OnDestroy, HostListener,ChangeDetectorRef} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { ButtonService } from '../../shared/common-font-changer.directive';
import { LoaderService } from '../../shared/service/loader.service';
 //import { SortService } from '../../shared/service/sortservice';


import {Observable, Subject,Subscription} from 'rxjs/Rx';
//import { CustomTableOptions, CustomTableConfig, CustomTableColumnDefinition } from './customTable.component';

// export class CustomTableColumnDefinition {
//   public name: string = '';
//   public value: string = '';
//   public binding: string = '';
//   public filter: string = '';
//   public computedClass: any;
//   public isComputed: boolean = false;
//   public isAnchor: boolean = false;
//   public srefBinding: string = '';
// }
// export class CustomTableConfig {
//   public sortBy: string = '';
//   public sortDirection: string = 'desc';
//   public pageSize: number = 100;
//   public pageNumber: number = 1;
//   public totalCount: number = 0;
//   public totalPages: number = 0;
//   public maxSize: number = 10;
//   public showSelectCheckbox: boolean = true;
//   public showSelectAll: boolean = true;
//   public showSort: boolean = true;
//   public clientSort: boolean = false;
//   public clientPaging: boolean = false;
//   public stickyHeader: boolean = true;
//   public stickyHeaderOffset: number = 0;
//   public stickyContainer: string = '';
// }

// export class CustomTableOptions {
//   public records : Observable<Array<any>>;
//   public columns: Array<CustomTableColumnDefinition>;
//   public rowDefns: Array<any>;
//   public config: CustomTableConfig;
//   public callbacks: any;

// @Directive({
//   selector: '[sortable-table]'
// })
@Component({
    selector: 'app-export-orderno-authorisation',
    templateUrl: 'booking_orderNo_authorisation.component.html' ,
    styleUrls: ['../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None
})

export class Bookingauthorisation implements OnInit {
    orderbookinglist:any=[];listcnt: any;listcnt1: any;
    orderstylenostr :any=[];hdnorderstylenostr :any=[];
    CHKAuthorityFlag:string="";
    text: string="Submit";
    selectedAll: any; sortByAsc: boolean = true;
    // _isSorting :boolean= false;_end:any;_start:any;isNumeric:boolean;sortBy: string = '';
    // sortDirection: string = 'desc';
     sortDir = 1;sortDir1 = 1;
    // public filteredData: Array<any>;
    // public filteredDataObservable: Observable<Array<any>>;
    //@Input() options: CustomTableOptions;
   // @Output() sortChange: EventEmitter<any> = new EventEmitter<any>()
    private _subscription:Subscription;
    constructor(
      
      private changeRef: ChangeDetectorRef,
        private _toaster: ToastCommonService,
       // private sortService: SortService,
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _disable: ButtonService,
        private loaderService : LoaderService,) {
    }
     @Output()
     sorted = new EventEmitter();
    //  @Input('sortable-column')
    //  columnName: string;

    //  @Input('sort-direction')
    //  //sortDirection: string = '';
    //  //private columnSortedSubscription: Subscription;
    //  @HostListener('click')
    //  sort() {
    //      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    //  } 
        Header: string="HAPPYCHIC BOOKING AUTHORISATION"
    ngOnInit() {
      
    //    this.columnSortedSubscription = this.sortService.columnSorted$.subscribe(event => {
    //      // reset this column's sort direction to hide the sort icons
    //      if (this.columnName != event.sortColumn) {
    //         this.sortDirection = '';
    //      }
    //  });

      // this._subscription = this.options.records.subscribe(res => { 
      //  this.filteredDataObservable = Observable.of(res); 
      //  this.filteredData = res;
      // this.changeRef.markForCheck();
      //this.zone = new NgZone({enableLongStackTrace: false});
      //this.zone.run(() => {
      //  console.log('Received table data');
     //});
    // });

        this._loginService.verifyRights(357, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('Add', data);
               
            });

            const jsonitem= {cmpid:this._loginService.getLogin()[0].CMPID,
                cmp_code:this._loginService.getLogin()[0].CMPCODE,
                RoleType:this._loginService.getLogin()[0].ROLETYPE,
                
            }
            this._dataService.getData("Export/Exp_Booking_OrderNo_Authorisation",jsonitem)
            .subscribe((data: any) => {
                     this.orderbookinglist=data.Table
                      // this._subscription = this.options.records.subscribe(res => { 
                      // this.filteredDataObservable = Observable.of(res); 
                      // this.filteredData = data.Table;
                      // this.changeRef.markForCheck();
                    });

                    
}

//  ngOnDestroy() {
//    this.columnSortedSubscription.unsubscribe();
//  }
chkonchange(orderno,styleno,chk)
    {
      
        if (chk==true){
            this.orderstylenostr=this.orderstylenostr  + orderno + styleno + ',';
            this.orderstylenostr=   this.orderstylenostr.replace(',,',',')
        }
             else{
                 this.orderstylenostr=   this.orderstylenostr.replace(orderno + styleno,'')
                 this.orderstylenostr=   this.orderstylenostr.replace(',,',',')
             
    }
    

}

chkonall(ischecked)
{
  if(ischecked==true)
  {
    this.orderbookinglist.forEach((item, index) => {              
      this.orderstylenostr = this.orderstylenostr+item.ORDERNO +item.STYLENO + ",";   
    } );
    this.orderstylenostr=   this.orderstylenostr.replace(',,',',') 
  }
 else
 {
  this.orderstylenostr="";
}
  
}
BindList()
{
const jsonitem= {cmpid:this._loginService.getLogin()[0].CMPID,
    cmp_code:this._loginService.getLogin()[0].CMPCODE,
    RoleType:this._loginService.getLogin()[0].ROLETYPE,
    
}
this._dataService.getData("Export/Exp_Booking_OrderNo_Authorisation",jsonitem)
.subscribe((data: any) => {
         this.orderbookinglist=data.Table
        });
    }
    Add_data()
{
    if (confirm("Are you sure you want to Authorise Selected Order and Style No.[" + this.orderstylenostr + "]  ? Select Ok to Accept and Cancel to Retry !!"))
                 {
                    if( this.orderstylenostr == "" )
                    {
                        this._toaster.toast("warning","warning" ,"No Data For Save -- Please Check " );
                        this.loaderService.display(false);
                    }   
                    else
                    {
                        
                        this.CHKAuthorityFlag="1";
                       // this.hdnorderstylenostr=this.orderstylenostr;
                        const jsonmaster = {
                            cmp_code:this._loginService.getLogin()[0].CMPCODE,
                            citycode:this._loginService.getLogin()[0].CITYCODE,
                            OrdStylestr:this.orderstylenostr,
                            CHKAuthorityFlag:"1",
                            cmpid:this._loginService.getLogin()[0].CMPID,
                        } 
                        this._dataService.Common("Export/Exp_Booking_OrderNo_Authorisation_SaveUpdate", jsonmaster)
                        .subscribe((data: any) => {
                            
                                if (data.Table[0].STATUS == "100") {
                                    this._toaster.toast("success","success" ,data.Table[0].STATUSMSG  );
                                    this.loaderService.display(false);
                                    this.BindList()
                                    this.orderstylenostr="";
                                }
                                else if(data.Table[0].STATUS == "101")
                                {
                                    this._toaster.toast("warning","warning" ,"Record Cannot Be Added. Please Contact System Administrator" );
                                this.loaderService.display(false);
                                }
                                else if(data.Table[0].STATUS == "103")
                                {
                                    this._toaster.toast("warning","warning" ,"Record Already Assigned to User . -- Please Check " );
                                    this.loaderService.display(false);  
                                }
                            });  
                        }
                } 
                else
                {
                    {this.loaderService.display(false);
                        return false}
                }
              }
                onSortClick(event) {
                  let target = event.currentTarget,
                    classList = target.classList;
                
                  if (classList.contains('fa-chevron-up')) {
                    classList.remove('fa-chevron-up');
                    classList.add('fa-chevron-down');
                    this.sortDir=-1;
                    this.sortArrdes('BOOKINGON');
                  } else {
                    classList.add('fa-chevron-up');
                    classList.remove('fa-chevron-down');
                    this.sortDir=1;
                    this.sortArr('BOOKINGON');
                  }
                   //this.sortArr('BOOKINGON');
                }
                sortArr(colName:any){
                  return this.orderbookinglist.sort((a,b)=>{
                      return  new Date(a.BOOKINGON).getTime() - new Date(b.BOOKINGON).getTime()
                    });
                  }
                  sortArrdes(colName:any){
                    return this.orderbookinglist.sort((a,b)=>{
                            // this.orderbookinglist.sort((a, b) => new Date(b.CREATEDON).getTime() - new Date(a.CREATEDON).getTime());
                            return  new Date(b.BOOKINGON).getTime() - new Date(a.BOOKINGON).getTime() //* this.sortDir;
                       
                     });
                   }
                  
                  sortArr1des(colName:any){
                   return this.orderbookinglist.sort((a,b)=>{
                           // this.orderbookinglist.sort((a, b) => new Date(b.CREATEDON).getTime() - new Date(a.CREATEDON).getTime());
                           return  new Date(b.CREATEDON).getTime() - new Date(a.CREATEDON).getTime() //* this.sortDir;
                      
                    });
                  }
                
                  onSortClick1(event) {
                    let target = event.currentTarget,
                      classList = target.classList;
                  
                    if (classList.contains('fa-chevron-up')) {
                      classList.remove('fa-chevron-up');
                      classList.add('fa-chevron-down');
                      this.sortDir=-1;
                      this.sortArr1des('CREATEDON');
                    } else {
                      classList.add('fa-chevron-up');
                      classList.remove('fa-chevron-down');
                      this.sortDir=1;
                      this.sortArr1('CREATEDON');
                    }
                  }   //this.sortArr1('CREATEDON');
                
                  sortArr1(colName:any){
                    return this.orderbookinglist.sort((a,b)=>{
                           // this.orderbookinglist.sort((a, b) => new Date(b.CREATEDON).getTime() - new Date(a.CREATEDON).getTime());
                           return  new Date(a.CREATEDON).getTime() - new Date(b.CREATEDON).getTime() //* this.sortDir;
                      
                    });
                  }
   
                  RestMain()
{
this.BindList();
this.selectedAll=false;
this.allNonTrades(false)
}
// selectAll() {
//     for (var i = 0; i < this.orderbookinglist.length; i++) {
//       this.orderbookinglist[i].selected = this.selectedAll;
//     }
//   }
//   checkIfAllSelected() {
//     this.selectedAll = this.orderbookinglist.every(function(item:any) {
//         return item.selected == true;
//       })
//   }
  
//   resetCheckBox() {
//     this.orderbookinglist.forEach(obj => {
//       const foundIndex = this.orderbookinglist.findIndex(x => x.value === obj.value);
//       obj.checked = true;
//       this.orderbookinglist[foundIndex] = obj;
//     });
//    }
   allNonTrades(ischecked) {
    //const checked = event.target.checked;
    this.orderbookinglist.forEach(item => item.selected = ischecked);
   // this.orderbookinglist.map(x => x.patchValue(true))
   
   this.chkonall(ischecked);
  
}
  // sortTable(parm) {
  //   this.orderbookinglist.subscribe(item => item.sort((a: any, b: any) => {
  //     return a[parm] - b[parm];
  //   }));
  // }

  // const tbl2 = document.querySelector('tbl1'); //get the table to be sorted
  // tbl2.querySelectorAll('th') // get all the table header elements
  //   .forEach((element, columnNo)=>{ // add a click handler for each 
  //     element.addEventListener('click', event => {
  //         sortTable(table1, columnNo); //call a function which sorts the table by a given column number
  //     })
  //   })

  //  table2data(tableBody){
  //   const tableData = []; // create the array that'll hold the data rows
  //   tableBody.querySelectorAll('tr')
  //     .forEach(row=>{  // for each table row...
  //       const rowData = [];  // make an array for that row
  //       row.querySelectorAll('td')  // for each cell in that row
  //         .forEach(cell=>{
  //           rowData.push(cell.innerText);  // add it to the row data
  //         })
  //       tableData.push(rowData);  // add the full row to the table data 
  //     });
  //   return tableData;
  // }
  //  data2table(tableBody, tableData){
  //   tableBody.querySelectorAll('tr') // for each table row...
  //     .forEach((row, i)=>{  
  //       const rowData = tableData[i]; // get the array for the row data
  //       row.querySelectorAll('td')  // for each table cell ...
  //         .forEach((cell, j)=>{
  //           cell.innerText = rowData[j]; // put the appropriate array element into the cell
  //         })
  //       tableData.push(rowData);
  //     });
  // }

  // trackByFn(index: number) {
  //   return index;
  // }

//   sort11(colName) {
//     this.orderbookinglist.sort((a, b) => a[colName] > b[colName] ? 1 : a[colName] < b[colName] ? -1 : 0)
// }


// sortColumn(headerName: string) {
//     if (this.sortBy === headerName) {
//       this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
//     }
//     this.sortBy = headerName;
// }
// onSortClick(event) {
//   let target = event.currentTarget,
//     classList = target.classList;

//   if (classList.contains('fa-chevron-up')) {
//     classList.remove('fa-chevron-up');
//     classList.add('fa-chevron-down');
//     this.sortDir=-1;
//     this.sortArr1des('BOOKINGON');
//   } else {
//     classList.add('fa-chevron-up');
//     classList.remove('fa-chevron-down');
//     this.sortDir=1;
//     this.sortArr1('BOOKINGON');
//   }
   //this.sortArr1('BOOKINGON');
//}

// sortArr(colName:any){
//   this.orderbookinglist.sort((a,b)=>{
//     a= a[colName].toLowerCase();
//     b= b[colName].toLowerCase();
//     return a.localeCompare(b) * this.sortDir;
//   });
// }

// onSortClick1(event) {
//   let target = event.currentTarget,
//     classList = target.classList;

//   if (classList.contains('fa-chevron-up')) {
//     classList.remove('fa-chevron-up');
//     classList.add('fa-chevron-down');
//     this.sortDir1=-1;
//     this.sortArrprep('CREATEDON');
//   } else {
//     classList.add('fa-chevron-up');
//     classList.remove('fa-chevron-down');
//     this.sortDir1=1;
//     this.sortArrprep('CREATEDON');
//   }
//   //this.sortArr1('CREATEDON');
// }
// convertDate(d) {
//   var p = d.split("/");
//   return +(p[2]+p[1]+p[0]);
//}
// sortArr1(colName:any){
//   this.orderbookinglist.sort((a,b)=>{

//         // this.orderbookinglist.sort((a, b) => new Date(b.CREATEDON).getTime() - new Date(a.CREATEDON).getTime());
//          return new Date(a.BOOKINGON).getTime() - new Date(b.BOOKINGON).getTime() * this.sortDir;
//     });
// }

// sortArr1des(colName:any){
//   this.orderbookinglist.sort((a,b)=>{
//          // this.orderbookinglist.sort((a, b) => new Date(b.CREATEDON).getTime() - new Date(a.CREATEDON).getTime());
//          return new Date(b.BOOKINGON).getTime() - new Date(a.BOOKINGON).getTime() * this.sortDir;
    
//   });
// }
// sortArrprep(colName:any){
//   this.orderbookinglist.sort((a,b)=>{

//         // this.orderbookinglist.sort((a, b) => new Date(b.CREATEDON).getTime() - new Date(a.CREATEDON).getTime());
//          return new Date(b.CREATEDON).getTime() - new Date(a.CREATEDON).getTime() * this.sortDir1;
//     });
// }
// sortArrprepdes(colName:any){
//   this.orderbookinglist.sort((b,a)=>{

//         // this.orderbookinglist.sort((a, b) => new Date(b.CREATEDON).getTime() - new Date(a.CREATEDON).getTime());
//          return new Date(b.CREATEDON).getTime() - new Date(a.CREATEDON).getTime() * this.sortDir1;
//     });
// }

// sortHeaderClick(headerName: string) {
//   if (headerName) {
//     if (this.options.config.sortBy === headerName) {
//       this.options.config.sortDirection = this.options.config.sortDirection === 'asc' ? 'desc' : 'asc';
//     }
//     this.options.config.sortBy = headerName;
//     // Get the matching column
//     var column: CustomTableColumnDefinition = this.options.columns.filter((column) => column.value === this.options.config.sortBy)[0];
//     //var isNumeric: bool = (column.filter && column.filter.indexOf("currency") != -1) || (column.isNumeric === true);
//     this.sort(this.filteredData, this.options.config.sortBy, this.options.config.sortDirection, this.isNumeric);
//   }
// }

//  sort(array: Array<any>, fieldName: string, direction: string, isNumeric: boolean)
// {
//   var sortFunc = function (field, rev, primer) {
//       // Return the required a,b function
//       return function (a, b) {
//           // Reset a, b to the field
//           a = primer(pathValue(a, field)), b = primer(pathValue(b, field));
//           // Do actual sorting, reverse as needed
//           return ((a < b) ? -1 : ((a > b) ? 1 : 0)) * (rev ? -1 : 1);
//       }
//   };
 
//   // Have to handle deep paths
//   var pathValue = function (obj, path) {
//       for (var i = 0, path = path.split('.'), len = path.length; i < len; i++) {
//           obj = obj[path[i]];
//       };
//       return obj;
//   };
 
//   var primer = isNumeric ?
//       function (a) {
//           var retValue = parseFloat(String(a).replace(/[^0-9.-]+/g, ''));
//           return isNaN(retValue) ? 0.0 : retValue;
//       } :
//       function (a) { return String(a).toUpperCase(); };
 
//   this._isSorting = true;
//   this._start = new Date().getTime();
//   array.sort(sortFunc(fieldName, direction === 'desc', primer));
//   this._end = new Date().getTime();
//   var time = this._end - this._start;
//   console.log('Sort time: ' + time);
//   this._isSorting = false;
// }
// isSorting(name: string) {
//   return this.options.config.sortBy !== name && name !== '';
// };

// isSortAsc(name: string) {
//   var isSortAsc: boolean = this.options.config.sortBy === name && this.options.config.sortDirection === 'asc';
//   return isSortAsc;
// };

// isSortDesc(name: string) {
//   var isSortDesc: boolean = this.options.config.sortBy === name && this.options.config.sortDirection === 'desc';
//   return isSortDesc;
// };
// getCellValue(row: any, column: CustomTableColumnDefinition) :string {
//   if (column.isComputed) {
//     let evalfunc = new Function ('r', 'return ' + column.binding);
//     let evalresult:string = evalfunc(row);
//     return evalresult;
//   } else {
//     return column.binding.split('.').reduce((prev:any, curr:string) => prev[curr], row);
//   }
// }
   
}
  



  


