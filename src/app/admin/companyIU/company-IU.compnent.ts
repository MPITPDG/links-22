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
    selector: 'app-Companycreation',
    templateUrl: 'company-IU.compnent.html'

})


export class companyIU implements OnInit   { 
    
    @ViewChild('fileUpload', {static: false}) fileUploadVar: any;
    uploadResult: any=[];
    fileData: File = null;
    filesToUpload: Array<File>;
    selectedFileNames: string[] = [];
    CmpCode : string="";CmpName:string="";CmpAddr1:string="";CmpAddr2:string="";
    CmpAddr3: string="";CmpCustLicNo:string="";CmpIATACode:string="";CmpTelNo:string=""
    CmpFaxNo:string="";CmpEmail:string="";Cmpregsertax :string="";Cmpregtpttax: string="";
    Cmpregauxsertax:string="";Cmpregesic: string="";Cmpincometax:string="";Cmptanno:string="";
    Cmpregstosertax:string="";Cmpchsertax:string="";city: string="";city2: string="";
    BrAddr1 :string="";BrAddr2:string="";BrAddr3:string="";Bracstmntfrom:string="";
    Bracstmntfromemail:string="";CmpbrImage: any;BrCmpurl:string="";
    City:string="";BrCmpTax:string="";BrGSTNo:string="";BrTelNo:string="";BrFaxNo:string="";
    BrEmail:string=""; listcnt: any; ACTIVECITY: any=[]; ACTIVECITYCODE: any=[];AUTHORITY:any=[];
    Citylist:any=[];addrlist:any=[];Branchlist:any;  branchcode:any[]; CityCode:any=[];
    Addresscity : string="";Citylist1:any=[];imageName: any;Cmp_Code: any;
    TmpcitybranchObject: any = {};branchArr :any=[];
    pk_cmpaddressId: string="0";cmp_id: string="0"; queryParamsReqType: string = "";queryParamsUserId:string="";
    validEmail:boolean = false;
    ///exp_city :any=[];imp_city :any=[];sorc_city: any=[];
    isHblissu : boolean =false;
    ishawblissw:boolean=false;
    isactive : boolean =false;
    ismore:boolean=false;
    text: string="Submit";txtchild : string ="Add";count1:number=0;
    public selectedFile;
    public event1;
    imgURL: any;
    receivedImageData: any;
    base64Data: any;
    convertedImage: any;
    public files: any[];
    constructor( 
        
        private _dataService: DataService, 
        private _toasterService:ToastCommonService, 
        private loaderService: LoaderService, 
        private _router: Router,
        private http: HttpClient, 
        private httpClient: HttpClient,
        private _activatedRoute: ActivatedRoute,
        private _loginService:LoginService,  
        private _configuration: Configuration) { }
        
        Header: string="Company Details"
    ngOnInit()
    {   
          this._loginService.verifyRights('1', '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('Add', data);
            });
        this._activatedRoute.params.subscribe(params => {
            this.queryParamsUserId = params["Id"];                 
            
        })
         const jsoncmp = {  MakerID:this._loginService.getLogin()[0].CMPID }
       
       this._dataService.Common("Admin/Companypageload",jsoncmp)
        .subscribe((data: any) => {
        
        })
        
        this._dataService.getAll("Common/GetFillcity")
       .subscribe((data: any) => {
           this.Citylist=data.Table;
       });

       this._dataService.getAll("Common/GetFillcity")
       .subscribe((data: any) => {
           this.Citylist1=data.Table;
       });   
                  
        this._dataService.getAll("Admin/Fill_Usercity")
            .subscribe((data: any) => {
                this.Branchlist=data.Table;
               ///this.loaderService.display(false);
            });
          
        if(this.queryParamsUserId !=' ')
        {
            this.editpopulate()
            this.text='Update';
        }
      /*  if(this.queryParamsUserId ==' ')
        {
            this._dataService.getData("Company/Fill_CompanyBranch_DetailsPageLoad",'' )
            .subscribe((data: any) => {
                this.addrlist=data.Table
            })
            
        } */
            
}         
        
        
         editpopulate()
            {
        const jsonmaster = { _CmpCode  : this.queryParamsUserId}
        this._dataService.getData("Admin/Fill_Company_Details", jsonmaster)
         .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100") {
            this.cmp_id=    data.Table[0].ID    ; 
            this.CmpName  =    data.Table[0].cmpname    ; 
            this.CmpAddr1=    data.Table[0].cmpaddr1    ; 
            this.CmpAddr2 =    data.Table[0].cmpaddr2    ; 
            this.CmpAddr3 =    data.Table[0].cmpaddr3    ;    
            this.city  =    data.Table[0].cmpcity    ; 
            //this.ACTIVECITY =    data.Table[0].cmpactivecity    ; 
           // this.ACTIVECITYCODE=data.Table[0].cmpactivecitycode; 
            this.CmpCustLicNo =    data.Table[0].cmpcustlicno    ; 
            this.CmpIATACode =    data.Table[0].cmpiatacode    ; 
            this.CmpTelNo  =    data.Table[0].cmptelno    ; 
            this.CmpFaxNo =    data.Table[0].cmpfaxno    ; 
            this.CmpEmail =    data.Table[0]. cmpemail   ; 
            this.Cmpregsertax  =    data.Table[0].cmprgdsrvtax   ; 
            this.Cmpregtpttax =    data.Table[0].cmprgdtpttax    ; 
            this.Cmpregauxsertax =    data.Table[0].cmprgdauxtax    ; 
            this.Cmpregesic  =    data.Table[0].cmprgdesic    ; 
            this.Cmpincometax  =    data.Table[0].cmprgdinctaxno   ;        

            this.Cmptanno =    data.Table[0].cmptanno ; 
            this.Cmpregstosertax =    data.Table[0].cmprgdstrtax; 
            this.Cmpchsertax  =data.Table[0].cmprgdchsrvtax; 
            if (data.Table[0].cmpactivecity!=''){
                data.Table[0].cmpactivecity.split(',').forEach((item, index) => {              
               this.branchArr.push(item.trim());
               });
          }
       this.branchcode=this.branchArr;
       this.loaderService.display(false);
            this.addrlist=data.Table1    
            //this.citybranchlict=data.Table2;
           
            this.loaderService.display(false);
            }
            else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
            this.loaderService.display(false);
    }
         })
    }
       

           
     Addcildrcrd()
     {
        if (this.BrAddr1=="" || this.BrAddr1==undefined){
            this._toasterService.toast('warning', 'warning', 'Branch Address1 cannot be blank!');
            return false;
        }
        ///if(this.BrAddr1.normalize()==""){
           /// this._toasterService.toast('warning', 'warning', 'Branch Address1 could not be blank !');
           /// return false;
         //}
         if(this.BrAddr2=="" || this.BrAddr2==undefined){
            this._toasterService.toast('warning', 'warning', 'Branch Address2 could not be blank !');            
            return false;
         }
         if(this.BrAddr3=="" || this.BrAddr3==undefined){
             this._toasterService.toast('warning', 'warning', 'Branch Address3 could not be blank !');            
             return false;
          }
         
          if(this.city2==""){
             this._toasterService.toast('warning', 'warning', 'Please select Branch City  !');            
             return false;
          }
         // this.onChange(this.BrEmail)
         this.uploadFiles()
         this.loaderService.display(true);
                 const jsonmasterchild = {pk_cmpaddressid:this.pk_cmpaddressId,braddrs1:this.BrAddr1,
                    braddrs2:this.BrAddr2,braddrs3:this.BrAddr3,fk_cityid:this.city2,brphoneno:this.BrTelNo,
                    brfaxno:this.BrFaxNo,bremail:this.BrEmail,brcmpImage: this.CmpbrImage ,brcmpurl:this.BrCmpurl,
                    brtax:this.BrCmpTax,brgstno:this.BrGSTNo,bracstmntfrom:this.Bracstmntfrom,
                    bracstmntfrmemail:this.Bracstmntfromemail,
                    brishblissu : (this.isHblissu==true)?"Y" :"",
                    brishawbissw:(this.ishawblissw==true)?"Y" :"",
                    brisactive:(this.isactive==true)?"Y" :"",
                    brismore:(this.ismore==true)?"Y" :"",
              
                    MakerIP:this._loginService.getLogin()[0].MAKERIP, 
                    MakerID:this._loginService.getLogin()[0].CMPID,  
                    vguid :this._loginService.getLogin()[0].GUID ,
                    cmpid:this.cmp_id
                   }
                   if(this.queryParamsUserId !=' ')
                   {
                    this._dataService.Common("Admin/Company_Address_UPDATE", jsonmasterchild)
                    .subscribe((data: any) => {
          
                        if (data.Table[0].STATUS == "100") {
                            this.addrlist=data.Table1;
                            this.loaderService.display(false);
                            this.Resetcildrcrd();
                        }
                        else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
                                this.loaderService.display(false);
                        }
                     });   
                }
                else
                {
                this._dataService.Common("Admin/Company_Address_IU", jsonmasterchild)
                .subscribe((data: any) => {
          
                    if (data.Table[0].STATUS == "100") {
                        this.addrlist=data.Table1;
                        this.loaderService.display(false);
                        this.Resetcildrcrd();
                        this.txtchild="Add";
                    }
                    else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
                            this.loaderService.display(false);
                    }
                 });   
            }
        
       
       
     }
     Resetcildrcrd(){
        this.pk_cmpaddressId ="";
        this.BrAddr1="";
        this.BrAddr2="";
        this.BrAddr3="";
        this.BrTelNo="";
        this.BrFaxNo="";
        this.BrEmail="";
        this.BrGSTNo="";
        this.BrCmpTax ="";
        this.city2="";
        this.Bracstmntfrom="";
        this.Bracstmntfromemail="";
        this.isHblissu=false;
        this.ishawblissw=false;
        this.ismore=false;
        this.isactive=false;
        this.CmpbrImage="";
        this.BrCmpurl="";
        
     }
     Editchildrecd(id)
     {
        let filterData = this.addrlist.filter((filter) => filter.ID == id)[0]; 
        this.pk_cmpaddressId=filterData.ID;
        this.BrAddr1=filterData.BRADDR1;
        this.BrAddr2=filterData.BRADDR2;
        this.BrAddr3=filterData.BRADDR3;
       // this.City=filterData.CITYID;
        this.city2=filterData.CITYID;
        this.BrTelNo=filterData.BRPHONE;
        this.BrFaxNo=filterData.BRFAX;
        this.BrEmail=filterData.BREMAIL;
        this.CmpbrImage=filterData.BRCMPIMAGE;
        this.BrCmpurl=filterData.BRCMPURL;
        this.BrCmpTax=filterData.BRTAX;
        this.BrGSTNo=filterData.BRGSTNO;
        this.Bracstmntfrom=filterData.BRCSTMNT;
        this.Bracstmntfromemail=filterData.BRCSTMNTEMAIL;
       // this.isHblissu=filterData.BRISBLISSU;
       this.isHblissu=(filterData.BRISBLISSU=='Y')?true:false; ;
        //this.ishawblissw=filterData.BRHAWBLIW; 
        this.ishawblissw=(filterData.BRHAWBLIW=='Y')?true:false; 
        //this.isactive=filterData.BRISACTIVE;
        this.isactive=(filterData.BRISACTIVE=='Y')?true:false; ;
        //this.ismore=filterData.BRISMORE;
        this.ismore=(filterData.BRISMORE=='Y')?true:false; 

        this.txtchild="Update";
     }

     deletechildrecd(id){
        if(confirm('Are you sure want to delete the record ?'))
        {   this.loaderService.display(true);
       const jsonmaster = { id  : id,guid :this._loginService.getLogin()[0].GUID ,makerid :this._loginService.getLogin()[0].CMPID,ID:this.queryParamsUserId}
       this._dataService.getData("Admin/Company_Address_deleteNew", jsonmaster)
        .subscribe((data: any) => {
           if (data.Table[0].STATUS == "100") {
               this.addrlist=data.Table1;
               this._toasterService.toast('info', 'Complete', data.Table[0].STA_MSG);
               this.loaderService.display(false);
           }
           else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
           this.loaderService.display(false);
   }
        }); 
       }
       else{return false;  this.loaderService.display(false);}
    }  

    
    onChange(emialid)
    {
        if(this._dataService.emailvalidation(emialid)==false){
            this._toasterService.toast('warning', 'warning', 'Enter Invalid E-mail !');
            return false;
        }
    }
    onFileChanged(event){
        const file = event.target.files[0];
        this.filesToUpload=event.target.files[0];
    // file.append('myFile', this.selectedFile, this.selectedFile.name);
        console.log(file)
    }


    Add_Main()
    {
     
        if(this.CmpName=="" || this.CmpName==undefined){
           this._toasterService.toast('warning', 'warning', 'Company name could not be blank !');
           return false;
        }
        if(this.CmpAddr1=="" || this.CmpAddr1==undefined){
           this._toasterService.toast('warning', 'warning', 'Company Address1 could not be blank !');            
           return false;
        }
        if(this.CmpAddr2=="" || this.CmpAddr2==undefined){
            this._toasterService.toast('warning', 'warning', 'Company Address2 could not be blank !');            
            return false;
         }
         if(this.CmpAddr3=="" || this.CmpAddr3==undefined){
            this._toasterService.toast('warning', 'warning', 'Company Address3 could not be blank !');            
            return false;
         }
         if(this.city==""){
            this._toasterService.toast('warning', 'warning', 'Please select Company City  !');            
            return false;
         }

         if(this.queryParamsUserId ==' ')
         {
         if(this.count1==0)
         
         {
            this._toasterService.toast('warning', 'warning', 'Please select at least one active City  !');            
            return false;
         }

        }

    //      let isSelected: any = this.Branchlist.filter((item) => item.checked == true);
    //      ///if(branchcode != null && branchcode.length > 0) {
    //         if(isSelected.length== 0) {
    //             this._toasterService.toast('warning', 'warning', 'Please select atleast one Active City   !');            
    //             return false;
    //    }else
    //       {
    //         //  this._toasterService.toast('warning', 'warning', 'Please select atleast one Active City   !');            
    //         // return false;
    //      }
       



         /////if(this.queryParamsUserId ==' ')
         ///{
         this.branchcode.forEach((item, index) => {              
            this.ACTIVECITY = this.ACTIVECITY+item + ",";           
            this.listcnt=this.Branchlist.filter((cntrylist:any)=>cntrylist.CITYCODE==item);
            this.ACTIVECITYCODE=this.ACTIVECITYCODE+this.listcnt[0].CITYCODE1 + ",";
            let autcode=item + '-'+ this.listcnt[0].CITYCODE1+'-555,'
            this.AUTHORITY = this.AUTHORITY  +autcode;
           
      });
   //// }
        /* if(this.AUTHORITY== ""){
            this._toasterService.toast('warning', 'warning', 'Please select atleast one Active City !' );            
            return false;
        }*/
        
        this.loaderService.display(true);
        const jsonmaster = {
            
        pk_cmpId :  this.cmp_id, 
        cmpname :this.CmpName.replace("'","`")  , 
        cmpaddr1 :  this.CmpAddr1, 
        cmpaddr2 : this.CmpAddr2.replace("'","`") , 
        cmpaddr3 : this.CmpAddr3 ,    
        cmpcity : this.city   ,  
        cmpactivecity :this.ACTIVECITY , 
        cmpactivecitycode:this.ACTIVECITYCODE,
        cmpcustlicno : this.CmpCustLicNo.replace("'","`") , 
        cmpiatacode : this.CmpIATACode.replace("'","`") , 
        cmptelno : this.CmpTelNo , 
        cmpfaxno :this.CmpFaxNo  , 
        cmpemail : this.CmpEmail , 
        cmprgdsrvtax : this.Cmpregsertax , 
        cmprgdtpttax :this.Cmpregtpttax.replace("'","`")  , 
        cmprgdauxtax : this.Cmpregauxsertax.replace("'","`") , 
        cmprgdesic : this.Cmpregesic.replace("'","`") , 
        cmprgdinctaxno :this.Cmpincometax  , 
        cmptanno :this.Cmptanno  , 
        cmprgdstrtax : this.Cmpregstosertax , 
        cmprgdchsrvtax :this.Cmpchsertax , 
        MakerIP :  this._loginService.getLogin()[0].MAKERIP,
        MakerID :  this._loginService.getLogin()[0].CMPID,
      
        RequestMode : this.queryParamsReqType  , 
      
        VGUID : this._loginService.getLogin()[0].GUID
        }
        this._dataService.Common("Admin/Company_Master_IU", jsonmaster)
        .subscribe((data: any) => {
           if (data.Table[0].STATUS == "100") {
            if(this.queryParamsUserId ==' '){
          { this._toasterService.toast('success', 'success', 'Company  saved successfully !');   }
               this.loaderService.display(false);
                 this.RestMain();
               
           }
           else if(this.queryParamsUserId !=' ') {
           { this._toasterService.toast('success', 'success', 'Company updated successfully !');   }
           this.loaderService.display(false);
             this.RestMain();
           
       }
    }
           else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
                    this.loaderService.display(false);
            }
        });  
    }
    //  onItemSelect(item:any){
    //     console.log(item);
    //      console.log(this.branchcode);
    //      this.count1=this.branchcode.length;
    //  }
    RestMain()
    {
        this.Resetcildrcrd();
           
        this.CmpName ='';  
        this.CmpAddr1 ='';  
        this.CmpAddr2 ='';     
        this.CmpAddr3  =''; 
        this.branchcode=[];
        this.CmpTelNo =''; 
        this.CmpFaxNo=''; 
        this.CmpEmail =''; 
        this.CityCode =''; 
        this.CmpCustLicNo =''; 
        this.CmpIATACode  =''; 
        this.Cmpchsertax =''; 
        this.Cmpincometax =''; 
       this.Cmpregesic  =''; 
       this.Cmpregsertax  =''; 
       this.Cmpregstosertax  =''; 
       this.Cmpregtpttax =''; 
       this.Cmpregauxsertax='';
       this.Cmptanno  =''; 
       this.text="Submit";
       this.city='';
       this.addrlist=[];
       this.branchcode=[];
       this._router.navigate(['/admin/company/Company/ ']);
      /* if(this.queryParamsUserId !='')
       {
        this._router.navigate(['/admin/companyIU/company-IU/ / ']);
       }
       else
       {this._router.navigate(['/admin/companyIU/company-IU/'+ this.queryParamsUserId  +' / ']);}
       
       this.loaderService.display(false);*/
    }
    onchnage(branchs)
    {
        console.log(branchs)
        this.count1=branchs.length;

    }
   
    uploadFiles()
    {
        this.uploadResult = "";
 
        // if (this.filesToUpload.length > 0)
        // {
           // this.filesToUpload[0].size;
           
            let formData: FormData = new FormData(); 
            formData.append('uploadedFiles', this.selectedFile, this.selectedFile.name); 
            

            let apiUrl ="http://localhost:8090/Uploadfiles"; 
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
       // }


        onFileChanged1(event)
        {
            this.selectedFile=event.target.files[0];
            let reader =new FileReader();
            reader.readAsDataURL(event.target.files[0]);
            reader.onload=(event2)=>  {
                this.CmpbrImage=this.selectedFile.name;
                this.filesToUpload=event.target.files[0];  
            };

        }   

        onUpload() {


            const uploadData = new FormData();
            uploadData.append('myFile', this.selectedFile, this.selectedFile.name);
          
          
             this.httpClient.post('http://localhost:8090/Uploadfiles', uploadData)
             .subscribe(
                          res => {console.log(res);
                                  this.receivedImageData = res;
                                 this.base64Data = this.receivedImageData.pic;
                                 this.convertedImage = 'data:image/jpeg;base64,' + this.base64Data; },
                         err => console.log('Error Occured duringng saving: ' + err)
                       );
          
            // let apiUrl ="Admin/UploadFiles"; 
            // this.http.post(apiUrl, uploadData )            
            //   .subscribe((data: any) => {
            //             this.uploadResult = data.Table;                       
            //         },
            //         err => {                        
                        
            //             alert("File Upload successfully !");
            //         },
            //         () => {
                      
            //             this.fileUploadVar.nativeElement.value = "";
            //             this.selectedFileNames = [];
            //             this.filesToUpload = [];
            //         } );
           }


        

            handleOnChange(email) {

            // don't remember from where i copied this code, but this works.
            let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        
            if ( re.test(email) ) {
               
            }
            else {
                alert("File Upload successfully !");
                this.BrEmail="";
            }
        
        } 
}