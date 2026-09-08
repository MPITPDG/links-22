import { Component, OnInit ,ViewChild} from '@angular/core';
import{DataService} from '../../shared/service/dataService';
import { ToastCommonService } from '../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service'; 
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { Configuration } from '../../app.constants';
 import{AuthService} from '../../shared/service/authService';

 
@Component({
    selector: 'app-ItemCodeCreation',
    templateUrl: 'itemcode-IU.component.html'

})


export class itemcodeIU implements OnInit { 



    Companylist:any=[];Citylist:any=[];AccountNamelist:any=[];ExpireDate: any = "";
    selItems:any=[];items:any=[];city: string="";company: string="";usertext: string="";
    ItemName:string="";Searchtype:string="A";ItemList:any=[];Remark:string="";accountname:string="";
    ItemNameType: string = "A";SItemName:string=""; text: string="Submit";Itemcode:string="";
    lbl:string="";
    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '16px',
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
    constructor( private _dataService: DataService, 
        private _toasterService:ToastCommonService, 
        private loaderService: LoaderService, 
        private _router: Router,
        private http: HttpClient, 
        private _activatedRoute: ActivatedRoute,
        private _loginService:LoginService,  
        private _configuration: Configuration) { }
        Header: string="Item Code Details"
ngOnInit()


{ 
   
    if (this.Itemcode==' ')
    {
        this._loginService.verifyRights(187, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });
        this.Header= 'ITEM CODE  DETAILS  - ADD';
        
      
    }
    this._dataService.getAll("Master/MST__ACCOUNTS_ITEMCODE_FILL_DROPDOWN")
    .subscribe((data: any) => {
        this.Companylist=data.Table;
        this.AccountNamelist=data.Table2;
    });
}


selectionChange(cmpcode) {
    //this.companyvalue = event.target.value; 
   
    const jsonlist= {CMPCODE:cmpcode,
     
         }
    this._dataService.getData("Master/MST_ACCOUNTS_ITEMCODE_FILL_DROPDOWN_CITY",jsonlist)
    .subscribe((data: any) => {
     this.Citylist=data.Table;
           
    });
  
}   
bindlist(accode)
{
    const jsonitem= {CmpCode:this.company,
        CityCode:this.city,
        AccCode:accode,
        ItemName:this.ItemName,
        SearchType:this.Searchtype
    }
    this._dataService.getData("Master/MST_ACCOUNTS_ITEMCODE_FILL_GRID",jsonitem)
    .subscribe((data: any) => {
             this.ItemList=data.Table
            
     
    });
   
}
SearchItem()
{
    const jsonitem= {CmpCode:this.company,
        CityCode:this.city,
        AccCode:this.accountname,
        ItemName:this.SItemName,
        SearchType:this.ItemNameType
    }
    this._dataService.getData("Master/MST_ACCOUNTS_ITEMCODE_FILL_GRID",jsonitem)
    .subscribe((data: any) => {
            this.ItemList=data.Table
          
            

    });

   
}

    ListOnclick(Itemcode)
    {
        let filterData = this.ItemList.filter((filter) => filter.ITEMCODE == Itemcode)[0]; 
        this.ItemName=filterData.ITEMNAME;
       // this.ExpireDate=(filterData.EXPIREDATE != "") ? this._dataService.stringdttoArry(filterData.EXPIREDATE) : "";filterData.EXPIREDATE;
        this.ExpireDate=(filterData.EXPIREDATE != "") ? this._dataService.stringdttoArry(filterData.EXPIREDATE) : "";
        this.Remark=filterData.REMARKS;
        this.Itemcode=filterData.ITEMCODE;
        this.text="Update" 
           }

           AddMain()
           {   


            this.loaderService.display(true);
            if(this.ItemName=="" || this.ItemName==undefined){
                this._toasterService.toast('warning', 'warning', 'Please Enter Item !');
                return false;
             }  
             if (this.ExpireDate == "" || this.ExpireDate == undefined || this.ExpireDate == null) { 
            
                this._toasterService.toast('warning', 'warning', 'Expire Date should not be blank !');            
                return false;
            
        }
            

        if (this.Itemcode=="")
        {
            const jsonmaster = {
                
                CmpCode : this.company,
                CityCode:this.city,
                AccCode :this.accountname  , 
                ItemName:this.ItemName,
                ExpireDate:this.ExpireDate.formatted,
                Remarks:this.Remark,
                MakerID:this._loginService.getLogin()[0].CMPID,
                MakerIP:this._loginService.getLogin()[0].MAKERIP
            }
        this._dataService.Common("Master/MST_ACCOUNTS_ITEMCODE_IU", jsonmaster)
         .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100") {
              
             { this._toasterService.toast('success', 'success', 'Item saved successfully!');   }
                this.loaderService.display(false);
                this.RestMain();
             }
             else if (data.Table[0].STATUS == "101") {
                { this._toasterService.toast('success','success', 'Item ' + this.ItemName + ' already exists!');   }
                this.loaderService.display(false);
                this.RestMain();
             } 
            }
         );
         this.showItem()
        }
          else 
           {
             const jsonmasteredit = {
                
                 CmpCode : this.company,
                CityCode:this.city,
                 ITEMCODE:this.Itemcode,
                 AccCode :this.accountname  , 
                 ItemName:this.ItemName,
                 ExpireDate:this.ExpireDate.formatted,
                 Remarks:this.Remark,
                 MakerID:this._loginService.getLogin()[0].CMPID,
                 MakerIP:this._loginService.getLogin()[0].MAKERIP
            }
             this._dataService.Common("Master/MST_ACCOUNTS_ITEMCODE_UPDATE", jsonmasteredit)
             .subscribe((data: any) => {
                if (data.Table[0].STATUS == "100") {
                 
                 { this._toasterService.toast('success', 'success', 'Item Code updated successfully!');   }
                    this.loaderService.display(false);
                    this.RestMain();
                 }
            
                }
             );
        }
     }

        RestMain()
        {
            // this.city="";
            // this.company="";
            this.ExpireDate="";
            this.ItemName="";   
            this.Remark="";   
            // this.accountname="";   
    
            this.text="Submit";
        }


        showItem()
        {
            if(this.company=="" || this.company==undefined){
                this._toasterService.toast('warning', 'warning', 'Please select Company !');
                return false;
             }  
             if(this.city==""){
                 this._toasterService.toast('warning', 'warning', 'Please select City  !');            
                 return false;
              }  
              if(this.accountname==""){
                this._toasterService.toast('warning', 'warning', 'Please select AccountName  !');            
                return false;
             }  
             const jsonitem= {CmpCode:this.company,
                CityCode:this.city,
                AccCode:this.accountname,
                ItemName:this.ItemName,
                SearchType:this.ItemNameType
            }
            this._dataService.getData("Master/MST_ACCOUNTS_ITEMCODE_FILL_GRID",jsonitem)
            .subscribe((data: any) => {
                    this.ItemList=data.Table
            });
        }
}
