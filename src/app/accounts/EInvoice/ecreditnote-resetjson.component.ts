import { Component, OnInit} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router ,ActivatedRoute} from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import {Configuration}  from '../../app.constants'

@Component({
    selector: 'app-ecreditnote-resetjson',
    templateUrl: './ecreditnote-resetjson.component.html',
    styles: [`
    .green-text {
        color: green; /* Adjust the styles as per your requirement */
      },
      .disabled-row {
        opacity: 0.5; /* or any other styling to indicate a disabled state */
        pointer-events: none; /* Disable pointer events */
      }
    `]
  })
  export class CreditNoteResetJson implements OnInit {
    resetjsonlist: any = []
    newArray: any = [];
    rptdownloadurl:string;
    subheader:string="";
    JsonId:string="";
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService, 
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
        private _activatedRoute: ActivatedRoute,
     //   private _http: Http, 
        private _config:Configuration ,
       // private _httpclient:HttpClient,
      ) { }
      ngOnInit() {
              this.subheader="List Of JSON Created Credit Note From : " + this._dataService.datechnge1(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE)  
              + " To :  " +  this._dataService.datechnge1(new Date)
             this.GetResetJsonList();
      }
      GetResetJsonList() {
        const jsonmaster = {
          FINSTARTDT: this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE),
          CMPCODE: this._loginService.getLogin()[0].CMPCODE,
          CITYCODE: this._loginService.getLogin()[0].CITYCODE
        }
            this._loaderService.display(true);
              this._dataService.getData("Accounts/ACC_ECreditNote_ResetJsonList", jsonmaster)
          .subscribe((data: any) => {
            console.log(data)
            this.resetjsonlist = data.Table;
            this._loaderService.display(false);
            
          })
      }
      getCheckboxValues(event: boolean, jsonid: string, id: string, invno: string, i: number) {
        this.newArray = this.newArray || [];
        this.JsonId = jsonid;
    
        if (event) {
            // Selecting: Update all checkboxes with the same jsonid to be checked
            this.resetjsonlist.forEach(item => {
                if (item.FK_JSON_ID === jsonid) {
                    let obj = {
                        id: item.ID,
                        jsonid: item.FK_JSON_ID,
                        invno: item.INV_NO,
                        Checked: true // Mark as selected
                    };
    
                    // Add to newArray only if not already present
                    if (!this.newArray.some(x => x.id === item.ID)) {
                        this.newArray.push(obj);
                    }
    
                    item.Checked = true; // Update the UI state
                } else {
                    item.Checked = false; // Uncheck others with different jsonid
                }
            });
        } else {
            // Deselecting: Update all checkboxes with the same jsonid to be unchecked
            this.resetjsonlist.forEach(item => {
                if (item.FK_JSON_ID === jsonid) {
                    item.Checked = false; // Uncheck in UI
                    // Remove from newArray
                    this.newArray = this.newArray.filter(x => x.jsonid !== jsonid);
                }
            });
        }
    
        console.log(this.newArray);
    }
      getCheckboxValuesold(event, jsonid,id,invno,i) {
        this.newArray=[];
        this.JsonId="";
        this.JsonId=jsonid
        var index = this.newArray.findIndex(x => x.id == id);
        if (event) {
                
            // Update all checkboxes with the same jsonid to be checked
            this.resetjsonlist.forEach(item => {
              if (item.FK_JSON_ID === jsonid) {
                let obj = {
                    id:item.ID,
                    jsonid: item.FK_JSON_ID,
                    invno: item.INV_NO,
                    Checked: true // Assuming your object has a Checked property
                  };
                  this.newArray.push(obj);
                 item.Checked = true;
              }
              else{
                item.Checked = false; 
                
              }
            });
          } else {
            if (index !== -1) {
              this.newArray.splice(index, 1);
            }
          }
          console.log(this.newArray);
      }
           
      
        ResetJson(){
            if(this.newArray.length==0){
                alert('Please select at least one Json File. ');
                return false;
              }
              var output = this.newArray.map(function (item) {
                return item.invno;
              });
              var datatry = output.join(",")
              var output1 = datatry
  
              var outputinvoiceid = this.newArray.map(function (item) {
                  return item.id;
                });
                var datatry1 = outputinvoiceid.join(",")
                var outputinvoiceid1 = datatry1
                console.log(outputinvoiceid1)
                console.log(output1)
            if(this.newArray.length >0){
              if (confirm('Are you sure you want to Reset Json File \n ' + output1 + '?')) {
                this._loaderService.display(true);
                const adddata = {
                  JSONFILEID: this.JsonId,
                  CRNOTEID:outputinvoiceid1
                 }
                 this._loaderService.display(true);
                //console.log(adddata)
                this._dataService.getData("Accounts/ACC_ECREDITNOTERESETDATA_FORJSON", adddata)
                  .subscribe((data: any) => {
                    if(data.Table[0].STATUS=="100")
                    {
                       alert(data.Table[0].STATUSMSG);
                       this.GetResetJsonList();
                       this.newArray=[];
                       this._loaderService.display(false);
                       return false;
                                          
                    }
                    else{
                      alert('No Json file to Reset !!');
                      this._loaderService.display(false);
                      return false;
                    }
                   
                  })
 
              }
            }
           }
      }
 
