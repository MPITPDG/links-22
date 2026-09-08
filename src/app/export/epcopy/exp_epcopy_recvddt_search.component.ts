
import { Component, OnInit} from '@angular/core'; 
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { ActivatedRoute,Router} from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker'; 
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';


@Component({
    selector: 'app-epcopy-search',
    templateUrl: 'exp_epcopy_recvddt_search.component.html' 
})

export class ExptEpcopyRecvddtSearch {
    viewIdType: string = '';
    rights: number = null;
    searchList: any = [];
    searchListLength: number = 0;
    checkType: string = 'ExportNo';
    SearchValue: any = '';
    ErrorMessage: string = '';
    headerType:string='Ep Copy Search'
    
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService  ,       
        
         ) {
    }


    changeType(event) {
        this.checkType = event;
    }

    search() {
        if (this.SearchValue == '') {
            if (this.checkType == 'ExportNo') { this.ErrorMessage = "Please enter Export No"; return false; }
            else if (this.checkType == 'OrderNo') { this.ErrorMessage = "Please enter Order No"; return false; }
            else if (this.checkType == 'RefNo') { this.ErrorMessage = "Please enter Ref. No"; return false; }
            else if (this.checkType == 'ShippingBill') { this.ErrorMessage = "Please enter shiping bill No"; return false; }
        } else { this.ErrorMessage = ""; }
         this.loaderService.display(true);
        const  jsonData = {             
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            Searchtype: this.checkType ,
            SearchValue: this.SearchValue 
        };
        this._dataService.getData('export/exp_EpCopySearch', jsonData)  
        .subscribe((data: any) => {
             if(data.Table.length>1)
             {
                if (data.Table[0].STATUS == 100) {
                    this.searchList=data.Table;
                } else {
                
                    this._toasterService.toast('error', 'Error', 'No Record Found');
                }
             }
             else
              {
                  let exptno= data.Table[0].exptno;
                 this._router.navigate(['export/shipment-progress/epcopy-recvddt',  exptno ]);
              }
             this.loaderService.display(false);
        })
    }


}

@Component({
    selector: 'app-epcopy-recvddt',
    templateUrl: 'exp_epcopy_recvddt.component.html' 
  
})

export class ExptEpcopyRecvddt {

    Recddt:any="";
    sntclntdt:any="";
    DEPBno:string="";
    Depbdt:any="";
    mateno  :string="";
    matetecptdt:any="";
    courierno:string="";
    courierdt:any="";
    courierrmrk:string="";
    ARE1:string="";
    ARE2:string="";
    ARE3:string="";
    ARE1dt:any="";
    ARE2dt:any="";
    ARE3dt:any="";
    ARE1Nocptrecvd:string="";
    ARE2Nocptrecvd:string="";
    ARE3Nocptrecvd:string="";
    exptno:string="";
    exptdata:any=[];
    shipblno:String="";
    shipbldt:any="";

    // queryParams:string='';
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService,
        private route: ActivatedRoute,
        
         ) {
    }
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
    ngOnInit(): void {
        this.loaderService.display(true);
         this.route.params
      .subscribe(params => {
        // Defaults to 0 if no query param provided.
       // this.page = +params['page'] || 0;
      this.exptno=params["exptno"];
    //   console.log( this.route.snapshot.queryParams["exptno"]);
 
      });

        const  jsonData = {             
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            Searchtype: 'ViewExportDetails',
            SearchValue:  this.exptno
        };
        this._dataService.getData('export/exp_EpCopySearch', jsonData)  
        .subscribe((data: any) => {
            //  this.bldate = (this.exptdt[0].EXPT_HBLDT != "") ? this._dataService.stringdttoArry(this.exptdt[0].EXPT_HBLDT) : ""; 
            if (data.Table[0].STATUS == 100) {
                this.Recddt=(data.Table[0].epcopydt != "") ? this._dataService.stringdttoArry(data.Table[0].epcopydt) : ""; ;
                
                this.sntclntdt=(data.Table[0].epcopysentdt != "") ? this._dataService.stringdttoArry(data.Table[0].epcopysentdt) : ""; 
                this.DEPBno=data.Table[0].DEPB_CopyOfSBillNo;
                this.Depbdt=(data.Table[0].DEPB_CopyOfSBillDt != "") ? this._dataService.stringdttoArry(data.Table[0].DEPB_CopyOfSBillDt) : "";  
                this.mateno  =data.Table[0].ARE3_NoCopyReceived;
                this.matetecptdt=(data.Table[0].OriginalMateReceiptDt != "") ? this._dataService.stringdttoArry(data.Table[0].OriginalMateReceiptDt) : ""; 
                this.courierno=data.Table[0].CourierNo;
                this.courierdt=(data.Table[0].CourierDt != "") ? this._dataService.stringdttoArry(data.Table[0].CourierDt) : "";  
                this.courierrmrk=data.Table[0].CourierRemark;
                this.ARE1=data.Table[0].ARE1_No;
                this.ARE2=data.Table[0].ARE2_No;
                this.ARE3=data.Table[0].ARE3_No;
                this.ARE1dt=(data.Table[0].ARE1_Dt != "") ? this._dataService.stringdttoArry(data.Table[0].ARE1_Dt) : "";  
                this.ARE2dt=(data.Table[0].ARE2_Dt != "") ? this._dataService.stringdttoArry(data.Table[0].ARE2_Dt) : "";   
                this.ARE3dt=(data.Table[0].ARE3_Dt != "") ? this._dataService.stringdttoArry(data.Table[0].ARE3_Dt) : ""; 
                this.ARE1Nocptrecvd=data.Table[0].ARE1_NoCopyReceived;
                this.ARE2Nocptrecvd=data.Table[0].ARE2_NoCopyReceived;
                this.ARE3Nocptrecvd=data.Table[0].ARE3_NoCopyReceived;
                this.shipblno=data.Table[0].EP_CopyOfSBillNo;
                this.shipbldt=(data.Table[0].EP_CopyOfSBillDt != "") ? this._dataService.stringdttoArry(data.Table[0].EP_CopyOfSBillDt) : "";

                this.exptdata=data.Table[0];
                 
                this.loaderService.display(false);
            }
        })
    }

    updateRecddt()
    {
       
       
        var recddt,sentdt,are1dat,are2dat,are3dat,depbdat,omatedat,courdat,billdt;
        if (this.Recddt == "") { recddt = "" } else { recddt = this.Recddt.formatted; }
        if (this.sntclntdt == "") { sentdt = "" } else { sentdt = this.sntclntdt.formatted; }
        if (this.Depbdt == "") { depbdat = "" } else { depbdat = this.Depbdt.formatted; }
        if (this.ARE1dt == "") { are1dat = "" } else { are1dat= this.ARE1dt.formatted; }
        if (this.ARE2dt == "") { are2dat = "" } else { are2dat = this.ARE2dt.formatted; }
        if (this.ARE3dt == "") { are3dat = "" } else { are3dat = this.ARE3dt.formatted; }
       // if (this.Recddt == "") { recddt = "" } else { recddt = this.Recddt.formatted; }
        if (this.shipbldt == "") { billdt = "" } else { billdt = this.shipbldt.formatted; }
        if (this.matetecptdt == "") { omatedat = "" } else { omatedat = this.matetecptdt.formatted; }
        if (this.courierdt == "") { courdat = "" } else { courdat = this.courierdt.formatted; }
        
        if (recddt == null) {
            this._toasterService.toast('error', 'Error', "Please select Recd. Date.");
             
            return false;
        }

        if (this.shipblno == null) {
            this._toasterService.toast('error', 'Error', "Please enter EP Copy of S/Bill No.");            
            return false;
        }
        this.loaderService.display(true);
        const  jsonData = {             
            //CityCode: this._loginService.getLogin()[0].CITYCODE,
             strExptNo: this.exptno,
            epcopydt: recddt,
            epcopysentdt:sentdt,            
            EP_CopyOfSBillNo:this.shipblno,
            EP_CopyOfSBillDt:billdt,
            DEPB_CopyOfSBillNo: this.DEPBno,
            DEPB_CopyOfSBillDt:   depbdat,
            ARE1_No:   this.ARE1, 
            ARE1_Dt: are1dat,
            ARE1_NoCopyReceived : this.ARE1Nocptrecvd,
            ARE2_No: this.ARE2,
            ARE2_Dt:are2dat,
            ARE2_NoCopyReceived: this.ARE2Nocptrecvd,
            ARE3_No:  this.ARE3,
            ARE3_Dt: are3dat, 
            ARE3_NoCopyReceived :this.ARE3Nocptrecvd,          
            OriginalMateReceiptNo:  this.mateno  ,
            OriginalMateReceiptDt:  omatedat,
            citycode: this._loginService.getLogin()[0].CITYCODE,
            cmp_code: this._loginService.getLogin()[0].CMPCODE,
            MakerID:this._loginService.getLogin()[0].CMPID,
            MakerIP:this._loginService.getLogin()[0].MAKERIP,
            CourierNo:this.courierno,
            CourierDt:   courdat,
            CourierRemark:  this.courierrmrk,
                
 
        };
        this._dataService.Common('export/exp_Epcopy_recvddt_Udate', jsonData)  
        .subscribe((data: any) => {
            if (data.Table[0].STATUS == 100) {
                this.loaderService.display(false);
                this._toasterService.toast('success', 'success', 'Epcaopy received date updated successfully');   
                this.ResetAll()
                this._router.navigate(['export/shipment-progress/epcopy-recvddt']);
                return false;
            }
            else
            {
                this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);    
                this.loaderService.display(false);        
                return false;
                
            }
        })
    }
    ResetAll()
    {
        this.Recddt="";
        this.sntclntdt="";
        this.DEPBno="";
        this.Depbdt="";
        this.mateno  ="";
        this.matetecptdt="";
        this.courierno="";
        this.courierdt="";
        this.courierrmrk="";
        this.ARE1="";
        this.ARE2="";
        this.ARE3="";
        this.ARE1dt="";
        this.ARE2dt="";
        this.ARE3dt="";
        this.ARE1Nocptrecvd="";
        this.ARE2Nocptrecvd="";
        this.ARE3Nocptrecvd="";

    }
}