import { Component, OnInit,EventEmitter,Output,Input ,OnChanges,AfterViewInit} from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
@Component({
    selector: 'app-main-consignment-calcbm-add',
    templateUrl: 'consg_main_calccbm.component.html',
    styles: []
})

export class MainCalCbmAddComponent implements OnInit , OnChanges {
    //Calculate CBM
    @Output() result:EventEmitter<any> =  new EventEmitter();
    @Input() grosswt: any;
    @Input () noofpkgs:any;
    @Input () exptno:any;
    //exptno: string;
    chkcbm : any="";
    Length : any="";
    Width : any="";
    Height : any="";
    Pkgs : any="";
    calcbm : any="";
    cm_val:any="";
    inch_val:any="";
    tot_val : any="";
    m_tot_val : any ="";
    tot_cbm_val : any ="";
    Cbm : any = "";
    VolWt:any="";
    TotCbm:any="";
    NoOfPackages:any="";
    calculationtable: Array<any> = [];
//     grosswt:any="";
//     noofpieces:any="";
    Grwt:any="";
    Unit:any="2";
    Packages:any="";
    Volume:any="";
    ID:any="";
    chblwt:any="";
    Dimensionlist:any=[];
    runtotnoofpkgs:any="";
    Maintblid:string="";
    ISNOTEDITABLE:string="0";
    text:string="Add";
       constructor(private _route: ActivatedRoute,
       private _dataService: DataService,
       private _loginService: LoginService,
       private _toasterService:ToastCommonService
       ) {
       }
       ngOnInit()
       {
          
           this.Grwt = this.grosswt;
           this.NoOfPackages = this.noofpkgs;
        
           if(this.exptno!=""){
              this.FillData();
           }
           
       }
//    ngAfterViewInit()
//    {
//     if(this.exptno!=""){
//         this.FillData();
//     }
//    }
   PageLoad()
   {
       this.Grwt = this.grosswt;
       this.NoOfPackages = this.noofpkgs;
       if(this.exptno!=""){
           this.FillData();
       }
   }
   ngOnChanges() {
    // this._route.params.subscribe(params => {
    //     this.exptno = params["exptno"];

    // });
    console.log(this.exptno);
      this.PageLoad();

     }
     FillData(){
        const jsondata =
        { JOBNO  : this.exptno,
          VGUID: this._loginService.getLogin()[0].GUID ,
          CMPID:this._loginService.getLogin()[0].CMPID
         }
          this._dataService.getData("Export/Export_JobDimension_GetData", jsondata)
           .subscribe((data: any) => {
               if (data.Table[0].STATUS.split("#")[0] == "100") {
               //this._toasterService.toast('success', 'success', data.Table1[0].STATUS.split("#")[1]);
               this.Dimensionlist=data.Table;
               this.runtotnoofpkgs = data.Table1[0].RUNNING_TOTALNOOFPKGS;
               this.TotCbm= data.Table1[0].TOTCBM;
               this.VolWt=data.Table1[0].TOTVOLWT;
               }
               else if (data.Table[0].STATUS.split("#")[0] == "103")
               {
                this._toasterService.toast('success', 'success', data.Table[0].STATUS.split("#")[1]);
               }

         });
        }
//    fn_CalCBMMulti(){
//         if (Math.abs(this.Length) == 0) {
//             alert("Please enter length !");

//                  return false;
//          }
//          if (Math.abs(this.Width) == 0) {
//                  alert("Please enter Width !");

//                  return false;
//          }
//          if (Math.abs(this.Height) == 0) {
//                  alert("Please enter height");

//                  return false;
//          }
//          if (Math.abs(this.Pkgs) == 0) {
//                  alert("Please enter Pkgs.");
//                  return false;
//          }
//          //INCH = 1 AND CM = 2

//          if (this.Unit=="1"){
//                  //INCH = 1
//                  this.cm_val = this.cm_val + (2.54*this.Length) * (2.54*this.Width) * (2.54*this.Height) * (2.54*this.Pkgs)
//          }
//          else if(this.Unit=="2") {
//                  //CM = 1
//                  this.inch_val = this.inch_val + (this.Length * this.Width * this.Height * this.Pkgs)
//          }

//          this.tot_val = this.cm_val + this.inch_val;
//          this.tot_val = this.tot_val/1000000;
//          this.m_tot_val = this.m_tot_val + this.tot_val;
//          this.Volume = Math.round(this.m_tot_val*10000)/10000 ;
//          this.Volume
//          return this.Volume;
// }

    fn_CalCBM(){
        this.inch_val="";
        this.cm_val="";
        if (Math.abs(this.Packages) == 0) {
            alert("Please enter Packages.");
            return false;
    }
       if (Math.abs(this.Length) == 0) {
               alert("Please enter length !");

               return false;
       }
       if (Math.abs(this.Width) == 0) {
               alert("Please enter Width !");

               return false;
       }
       if (Math.abs(this.Height) == 0) {
               alert("Please enter height");

               return false;
       }

       //INCH = 1 AND CM = 2

       if (this.Unit=="1"){
               //INCH = 1
               this.cm_val = this.cm_val + (2.54*this.Length) * (2.54*this.Width) * (2.54*this.Height) * (2.54*this.Packages)
       }
       else if(this.Unit=="2") {
               //CM = 1
               this.inch_val = this.inch_val + (this.Length * this.Width * this.Height * this.Packages)
       }

       this.tot_val = this.cm_val + this.inch_val;
       this.Volume = Math.round(this.tot_val);//Math.round(this.m_tot_val*10000)/10000 ;
       this.tot_val = this.tot_val/1000000;
       this.m_tot_val = this.m_tot_val + this.tot_val;
       this.Cbm=this.Volume/1000000;
       this.chblwt=this.Cbm/0.006;

         return this.Volume;

    }

    fun_clear()
    {
       this.Length="";
       this.Width="";
       this.Height="";
       this.Packages="";
       this.Cbm ="";
       this.Volume="";
       this.tot_val ="";
       this.inch_val="";
       this.cm_val="";
       this.Pkgs="";
       this.text="Add";
       this.ID=""
       this.Unit="0"
    }
    AddDimension(){
        if(this.Dimensionlist==undefined){
            alert("Please Enter Dimension Details.");
            return false;
        }
        const jsondata= {
                PK_ID: this.ID,
                JOBNO: (this.exptno==undefined)?"" :this.exptno,
                JGRWT: this.Grwt,
                JPKGS: this.NoOfPackages,
                DIMPKGS: (this.Packages == "")? "0": this.Packages,
                DIMLENGTH: (this.Length == "") ? "0": this.Length,
                DIMWIDTH: (this.Width == "") ? "0": this.Width,
                DIMHEIGHT: (this.Height == "") ? "0": this.Height,
                DIMVOLUME: (this.Volume == "") ? "0": this.Volume,
                DIMCBM:(this.Cbm == "") ? "0": this.Cbm,
                DIMCHBLWT:(this.chblwt == "") ? "0": this.chblwt,
                MAKERID:this._loginService.getLogin()[0].CMPID,
                MAKERIP:this._loginService.getLogin()[0].MAKERIP,
                VGUID: this._loginService.getLogin()[0].GUID,
                DIMTYPE:this.Unit

              }
        this._dataService.Common("Export/Export_JobDimension_Tmp_IU", jsondata)
        .subscribe((data: any) => {
       //   console.log(data)
          if (data.Table1[0].STATUS.split("#")[0]== "100") {
             this.Dimensionlist = data.Table;
             this.runtotnoofpkgs = data.Table1[0].RUNNING_TOTALNOOFPKGS;
             this.TotCbm= data.Table1[0].TOTCBM;
             this.VolWt=data.Table1[0].TOTVOLWT;
             this.fun_clear();
            // alert(data.Table1[0].STATUS.split("#")[1]);
             this._toasterService.toast('success', 'success', data.Table1[0].STATUS.split("#")[1]);
          }
          else{
                alert(data.Table1[0].STATUS.split("#")[1]);
                return false;
          }
             });
    }
    EditDimension(id)
    {
       let filterData = this.Dimensionlist.filter((filter) => filter.PK_ID == id)[0];
       this.ID=filterData.PK_ID;
       this.Length=filterData.DIMLENGTH;
       this.Packages=filterData.DIMPKGS;
       this.Width=filterData.DIMWIDTH;
       this.Height=filterData.DIMHEIGHT//"Update";
       this.Volume=filterData.DIMVOLUME;
       this.Cbm=filterData.DIMCBM;
       this.chblwt=filterData.DIMCHBLWT;
       this.Maintblid=filterData.MAINTBLID;
       this.Unit=filterData.DIMTYPE;
       this.text="Update";
    }
    DeleteDimension(id,maintblid)
    {
        if(maintblid==null || maintblid==undefined){
            maintblid=0;
        }
        if(this.ISNOTEDITABLE=="1")
        {
            this._toasterService.toast("warning","warning","You cannot delete this reocrd!")
        }
        else
        {
        if(confirm('Are you sure want to delete the record ?'))
        {
         const jsondelete =
          { ID  : id,
            VGUID :this._loginService.getLogin()[0].GUID,
            MAINTBLID:maintblid,
            MAKERID:this._loginService.getLogin()[0].CMPID,
           }
            this._dataService.getData("Export/Export_JobDimension_Tmp_DEL", jsondelete)
             .subscribe((data: any) => {
                 if (data.Table1[0].STATUS.split("#")[0] == "100") {
                 this._toasterService.toast('success', 'success', data.Table1[0].STATUS.split("#")[1]);
                 this.Dimensionlist=data.Table;
                 this.runtotnoofpkgs = data.Table1[0].RUNNING_TOTALNOOFPKGS;
                 this.TotCbm= data.Table1[0].TOTCBM;
                 this.VolWt=data.Table1[0].TOTVOLWT;
                 }
            else{
                this._toasterService.toast("warning","warning" ,"Error in deleting");
                 }
           });
        }
    }
    }
    Close(){
        if(this.runtotnoofpkgs<this.NoOfPackages && this.runtotnoofpkgs > 0 ){
            alert("Current Total Packages  is Less than Actual Total");
            return false;
        }
        else
        {
            this.result.emit({totcbm:this.TotCbm,chblwt:this.VolWt});
        }
          // this.result.emit({totcbm:this.TotCbm,chblwt:this.VolWt});
           //window.close();
   }
}