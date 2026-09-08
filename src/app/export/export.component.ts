import { Component, OnInit } from '@angular/core'; 
import { AuthService } from '../shared/service/authService';
import { DataService } from '../shared/service/dataService';
import { Router} from '@angular/router';
import { LoginService } from '../shared/service/loginService';
import { ToastCommonService } from '../shared/service/toastService';
import { LoaderService } from '../shared/service/loader.service';
import { AccordionComponent } from 'ngx-bootstrap/accordion';
 
 @Component({
  selector: 'app-EXP-Dashboard',
     templateUrl: 'export.component.html',
     styles:[ `.hoverTable tr{
      background:#e7e2db;
    }
    .hoverTable tr:hover {
       
      color: #c14a1d;
}`]
 })
export class ExportComponent implements OnInit {
  constructor(
    private _router: Router,
    private _dataService: DataService,
    private _auth: AuthService,
    private _toasterService: ToastCommonService,
    private _loginService: LoginService ,
    private loaderService: LoaderService       ) {
}

Searchdata: any=[];
Exportdata:any[];
filtjoblist:any[];


collapse: boolean = true;
collapse1: boolean = false;
Expand: boolean = true;
Expand1: boolean = false;
oneAtATime: boolean = true;

   ngOnInit(): void {
    this.loaderService.display(true);
    const jsonExport = { CityCode:  this._loginService.getLogin()[0].CITYCODE};
    this._dataService.getData('Export/EXPT_EXPORT_DASHBOARD_Vessel', jsonExport)
    .subscribe((data: any) => {

        if (data.Table[0].STATUS === "100") {

           
            this.Searchdata = data.Table; 
            this.Exportdata = data.Table1 
                    
            this.loaderService.display(false);  
        } else {
            this.loaderService.display(false);
            this._toasterService.toast('error', 'Error', data.Table[0].statusText);
        }
    });
  }
  getVslJob(Rtno,port) {
    let updateItem = this.Searchdata.find(item => item.VSL_RTNO === Rtno && item.PORT==port);
    let index1 = this.Searchdata.indexOf(updateItem);
    
    if (this.Searchdata[index1]["CHECK"] == true) {
        this.Searchdata[index1]["CHECK"] = null;
    }
    else {
        for (let obj = 0; obj < this.Searchdata.length; obj++) {
            this.Searchdata[obj]["CHECK"] = null;
        }

        let index = this.Searchdata.indexOf(updateItem);
        this.Searchdata[index]["CHECK"] = true;
      
    }

    this.filtjoblist = this.Exportdata.filter((joblist: any) => joblist.EXPT_VESSEL === Rtno && joblist.EXPT_VESSEL);
    if (this.filtjoblist.length == 0)
    {
      alert("Ex-Job Not yet Opened !");
      this.Searchdata[index1]["CHECK"] = null;
      return false;
    }
}


}

 