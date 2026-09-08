import { Component, OnInit ,ViewChild} from '@angular/core';
import{DataService} from '../../shared/service/dataService';
import { ToastCommonService } from '../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service'; 
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { Configuration } from '../../app.constants';
 

 
@Component({
    selector: 'app-userprofilecreation',
    templateUrl: 'userprofile-creation.component.html'

})


export class userprofilecreation implements OnInit   { 
    @ViewChild('fileUpload', {static: false}) fileUploadVar: any;
    uploadResult: any=[];
    fileData: File = null;
    filesToUpload: Array<File>;
    selectedFileNames: string[] = [];

    Header:String='User Profile';
    LinerId: string="0"; queryParamsUserId: string = "";quryParamsLinerCode:string="";
    username: string;password : string;fullname: string ;greeting: string;
    imageName: any;email: string;datelimit: any;
    equadmin: boolean =false;isresigned : boolean =false;noofdays: string;
    unblock: boolean =false;location: string;
    USRCODE:String="";branchcode : any[];
    ACTIVECITY: any=[]; ACTIVECITYCODE: any=[];AUTHORITY:any=[];
    Locationlist : any;Branchlist: any ;
    ID: string="0"; listcnt: any;
    text :string="Submit";count1:number=0;
    branchArr :any=[];
    
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
        private http: HttpClient, 
        private _activatedRoute: ActivatedRoute,
        private _loginService:LoginService,  
        private _configuration: Configuration) { }


        ngOnInit()
        {
            this._activatedRoute.params.subscribe(params => {
                this.queryParamsUserId = params["userid"];                              
            })
            if (this.queryParamsUserId==" ")
            {
                this._loginService.verifyRights(0, '')
                .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });
            }
            else{
                this._loginService.verifyRights(123, '')
                .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });
                this.editpopulate();
                this.text="Update";
            }
    
            this._dataService.getAll("Admin/Fill_Location")
            .subscribe((data: any) => {
                this.Locationlist=data.Table;
            });
    
            this._dataService.getAll("Admin/Fill_Usercity")
            .subscribe((data: any) => {
                this.Branchlist=data.Table;
            });

            this._loginService.verifyRights(108, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Add', data); }); 
        }
                            
    onChange(emialid)
    {
        if(this._dataService.emailvalidation(emialid)==false){
            this._toasterService.toast('warning', 'warning', 'Enter Invalid E-mail !');
        }
    }
    onKeydown(searchValue : string) {        
      //  console.log(searchValue);     
        let ucase = new RegExp("[A-Z]+");
        let lcase = new RegExp("[a-z]+");
        let num = new RegExp("[0-9]+");  

    }

    onFileChanged(event){
        const file = event.target.files[0];
    // file.append('myFile', this.selectedFile, this.selectedFile.name);
        console.log(file)
    }

    Add_Profile(){

        if(this.username==""){
            this._toasterService.toast('warning', 'warning', 'User Name could not be blank !');
            return false;
        }
        if(this.password==""){
            this._toasterService.toast('warning', 'warning', 'Password could not be blank !');            
            return false;
        }
        if(this.fullname=="" || this.fullname== undefined ){
            this._toasterService.toast('warning', 'warning', 'Full Name could not be blank !');
            return false;
        }
        if(this.greeting=="" || this.greeting== undefined){
            this._toasterService.toast('warning', 'warning', 'Greeting could not be blank !');            
            return false;
        }
        if(this.location=="" || this.location== undefined){
            this._toasterService.toast('warning', 'warning', 'Please select Location !');            
            return false;
        }
        if(this.datelimit =="" || this.datelimit== undefined){
            this._toasterService.toast('warning', 'warning', 'Datelimit could not be blank !');            
            return false;
        }
        
        if(this.queryParamsUserId ==' ')
         {
         if(this.count1==0)
         
         {
            this._toasterService.toast('warning', 'warning', 'Please select at least one branch  !');            
            return false;
         }

        }

        this.branchcode.forEach((item, index) => {              
            this.ACTIVECITY = this.ACTIVECITY+item + ",";           
            this.listcnt=this.Branchlist.filter((cntrylist:any)=>cntrylist.CITYCODE==item);
            this.ACTIVECITYCODE=this.ACTIVECITYCODE+this.listcnt[0].CITYCODE1 + ",";
            let autcode=item + '-'+ this.listcnt[0].CITYCODE1+'-555,'
            this.AUTHORITY = this.AUTHORITY  +autcode;

      });


    //    if(this.AUTHORITY== ""){
    //         this._toasterService.toast('warning', 'warning', 'Please select atleast one branch');            
    //         return false;
    //     }

       this.loaderService.display(true);

        
 
        const userdata = {
            USRCODE : this.USRCODE,
            USRNAME : this.username,
            PASSWORD : this.password,
            DATELINE : this.datelimit.formatted,
            FULLNAME : this.fullname,
            GREET : this.greeting,
            EMAIL : this.email,
            ACTIVECITY : this.ACTIVECITY,
            ACTIVECITYCODE : this.ACTIVECITYCODE,
            AUTHORITY : this.AUTHORITY,
            ISADMIN : (this.equadmin==true)?"Y" :"N",
            ROLE : (this.equadmin==true)?"SA" :"User",
            IMG : this.imageName,
            LOCATION : this.location,
            ID : this.ID,
            NOOFDAYS : (this.noofdays=='')?"30":this.noofdays,
            UNBLOCK :  (this.unblock==true)?"0" :"",
            ISRESIGNED : (this.isresigned==true)?"Y" :"",
            // branchlist : this.branchcode,           
                     
        }

        this._dataService.Common("Admin/Admin_Profile_IU", userdata)
            .subscribe((data: any) => {
                console.log(data.Table[0].STATUS)
                console.log(data)
                
               if (data.Table[0].STATUS.split("#")[0]== "100") {
                 { this._toasterService.toast('success', 'success', data.Table[0].STATUSTEXT);   }
                   
                   this.loaderService.display(false);
                   this.RestMain();
               }
               else{  
                   // console.log("sds")
                    this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
                    this.RestMain();
                   this.loaderService.display(false);
                }
            }); 
    }
    editpopulate()
    {
        this.loaderService.display(true);
        const jsonmaster = { CMP_USERCODE  : this.queryParamsUserId}
        this._dataService.getData("Admin/Profile_details_populate", jsonmaster)
         .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100") {
                this.USRCODE=	data.Table[0].CMP_USERCODE;
                this.username=	data.Table[0].CMP_USERNAME ;
                this.password=	data.Table[0].CMP_PASSWORD ;
                this.datelimit =	(data.Table[0].CMP_DATELIMIT != "") ? this._dataService.stringdttoArry(data.Table[0].CMP_DATELIMIT) : "";
                
                this.fullname=	data.Table[0].FULLNAME;
                this.greeting=	data.Table[0].GREETING;
                this.email=	data.Table[0].MAIL;
                // this.ACTIVECITY=	data.Table[0].CMP_ACTIVECITY;
                // this.ACTIVECITYCODE=	data.Table[0].CMP_ACTIVECITYCODE;
                this.AUTHORITY=	data.Table[0].AUTHORITY;
                this.equadmin =	(data.Table[0].CMP_EQUALTOADMIN=='Y')?true:false;
                //this.imageName=	data.Table[0].IMAGE;
                this.location=	data.Table[0].LOCATION;
                this.ID=	data.Table[0].CMPID;
                this.noofdays=	data.Table[0].NOOFDAYS ;
                this.unblock=	(data.Table[0].BLOCK=='0')?false:true; 
                this.isresigned=(data.Table[0].ISRESIGNED=='1')?true:false; 

                if (data.Table[0].CMP_ACTIVECITY!='')
                {
                      data.Table[0].CMP_ACTIVECITY.split(',').forEach((item, index) => {              
                     this.branchArr.push(item.trim());
                     
                     });
                }
             this.branchcode=this.branchArr;
             this.loaderService.display(false);
            }
            else
            {
                this.loaderService.display(false);
            }
     
        })
    }
    RestMain()
    {
        this.username="";
        this.password="";
        this.fullname="";
        this.greeting="";
        this.imageName="";
        this.isresigned=false;
        this.email="";
        this.equadmin=false;
        this.branchcode=[];
        this.noofdays="";
        this.unblock=false;
        this.text="Submit";
        this.ACTIVECITY="";
        this.ACTIVECITYCODE="";
        this.AUTHORITY="";
    }
   
    onchnage(branchs)
    {
        console.log(branchs)
        this.count1=branchs.length;

    }

    ileChangeEvent(fileInput: any)
    {
        //Clear Uploaded Files result message
        this.uploadResult = "";
        this.filesToUpload = <Array<File>>fileInput.target.files;
 
        for (let i = 0; i < this.filesToUpload.length; i++)
        {
            this.selectedFileNames.push(this.filesToUpload[i].name);
        }
        return false;
    }
    upload()
    {
        if (this.filesToUpload.length == 0)
        {
            alert('Please select at least 1  files to upload!');
        }       
        else
        {  this.uploadFiles(); }
    }
    uploadFiles()
    {
        this.uploadResult = "";
 
        if (this.filesToUpload.length > 0)
        {
            this.filesToUpload[0].size;
           
            let formData: FormData = new FormData(); 
            formData.append('uploadedFiles', this.filesToUpload[0], this.filesToUpload[0].name); 
            

            let apiUrl ="Admin/UploadFiles"; 
            this.http.post(apiUrl, formData )            
              .subscribe((data: any) => {
                        this.uploadResult = data.Table;                       
                    },
                    err => {                        
                        
                        alert("File Upload successfully !");
                    },
                    () => {
                      
                        this.fileUploadVar.nativeElement.value = "";
                        this.selectedFileNames = [];
                        this.filesToUpload = [];
                    } );
                }
        }

}