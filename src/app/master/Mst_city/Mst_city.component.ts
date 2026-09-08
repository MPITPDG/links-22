import{Component,OnInit,ViewChild} from '@angular/core';
import{ActivatedRoute,Router} from '@angular/router';
//import { HttpClient, HttpEventType,   } from '@angular/common/http';

import{DataService} from '../../shared/service/dataService';
//import{AuthService} from '../../shared/service/authService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';







@Component({
    selector:'app-Mst_city',
    templateUrl:'Mst_city.component.html'
})

export class Mst_citycomponent implements OnInit{
    txtcity_code: string;
    txtcity_name: string;
    drpcity_country: string="";
    Countrylist:any[];
    Seaport :string="";
    Airport : string="";
    Cons_origin : string="";
    cons_dest : string="";
    del_dest : string="";
    Trans_Point :string="";
    cityId : string="";

    Header: string="CITY DETAILS"
    
    Transpoints = [
                { Transpoint:"Sea Port",value : 'Y'}, 
                { Transpoint:"Air Port" ,value : 'Y' }, 
                { Transpoint:"Consolidation Origin", value : 'Y' }, 
                { Transpoint:"Consolidation Destination" ,value : 'Y' },
                { Transpoint:"Delivery Destination", value : "Y"},
                { Transpoint:"Transhipment Point", value : "Y"}
            ]

    constructor (
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService,   
  
    ){}

    ngOnInit(){
        
        this.loaderService.display(true);
        this._dataService.getAll("Master/populatecountry")
        .subscribe((data: any) => {
            this.Countrylist=data.Table;
        });
        this.loaderService.display(false);
    }
    onChange(Transpoint,value)
    {
        if (Transpoint=="Sea Port")
        {this.Seaport="Y"; }
        else if(Transpoint=="Air Port")
        {this.Airport="Y"; }
        else if(Transpoint=="Consolidation Origin")
        { this.Cons_origin ="Y";}
        else if(Transpoint=="Consolidation Destination")
        {this.cons_dest ="Y";}
        else if(Transpoint=="Delivery Destination")
        {this.del_dest ="Y";}
        else if(Transpoint=="Transhipment Point")
        {this.Trans_Point="Y"; }


    }

    finalSubmit(){
        if (this.txtcity_code=="" || this.txtcity_code==undefined){
            this._toasterService.toast('warning', 'warning', 'City Code cannot be blank!');
            return false;
        }
        if(this.txtcity_name==""|| this.txtcity_name==undefined)
        {
            this._toasterService.toast('warning', 'warning', 'City Name cannot be blank!');
            return false;
        }
        if(this.drpcity_country=="")
        {
            this._toasterService.toast('warning', 'warning', 'Country cannot be blank!');
            return false;
        }
        
        this.loaderService.display(true);
        const jsonmaster = {
            id:  this.cityId  ,
            city_code:this.txtcity_code    ,
            city_name: this.txtcity_name.replace("'","`"),
            // agt_title: this.title   ,
            city_country:this.drpcity_country    ,
            city_seaport: this.Seaport   ,
            city_airport: this.Airport   ,
            city_consoleorigin:this.Cons_origin    ,
            city_consoledest:this.cons_dest    ,
            city_deldest: this.del_dest   ,
            city_tranship: this.Trans_Point   ,
            MakerID: this._loginService.getLogin()[0].CMPID ,
            MakerIP: this._loginService.getLogin()[0].MAKERIP  ,
            cmp_code:  this._loginService.getLogin()[0].CMPCODE ,           
            citycode: this._loginService.getLogin()[0].CITYCODE,
        
             }
            this._dataService.Common("Master/cityIU", jsonmaster)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == "100") 
                { this._toasterService.toast('success', 'success', 'City saved successfully !');   }
                else if(data.Table[0].STATUS == "200")
                { this._toasterService.toast('warning', 'warning', 'City  '+this.txtcity_name+' already exists !');   }
            });
            this.loaderService.display(false);

    }
}