
import { Component, OnInit} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router} from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../shared/service/loginService';
import {IMyDpOptions} from 'mydatepicker';
import { ToastCommonService } from '../../shared/service/toastService';
import { SharedDataSerice } from '../export-share-data.service';
import { LoaderService } from '../../shared/service/loader.service';

@Component({
    selector: 'app-vessel-iu',
    templateUrl: 'exp_mst_vessel_iu.component.html'

})


export class VesselMstComponent implements OnInit {
    private baseUrl: string = 'Export/GetExportVslpageload_fill';

    ports: any;
    Agents: any;
    Liners: any;
    Agentslist: any;
    SavPrtAgt: any = [];
    EditPrtAgtList: any;
    vessel: any;
    Addchild : string="Add";
    //---- model object

    vslname: any = "";
    vslvoyno: any = "";
    vslRtno: any = "";
    vslSname: any = "";
    Vslport: any = "-1";
    VslRrotnNo: any = "";
    vslLCD: any = "";
    Vsleta: any = "";
    VslArvldt: any = "";
    Vsletd: any = "";
    VslAsail: any = "";
    Vsldly: any = "";
    Vslnotcald: any = "";
    VslAgent: any = "-1";
    VslspLine: any = "-1";
    Vslcrtpl: any = "";
    Vslcrtclrk: any = "";
    TBL_INDEXID: any = "0";
    ID: any = "0";
    TBL_INDEXID_AGT: any = "0";
    AGTID: any = "0";
    AGTNAME: any = "";
    LINERNAME: any = "";
    PORT_NAME: any = ""
    Pkid: any = "";

    Arrliner: any = [];

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _vslsharedvataSerice: SharedDataSerice,
        private loaderService: LoaderService,) {
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
            if (this._vslsharedvataSerice.sharedData !== undefined) {
                //userrights edit mode
            this._loginService.verifyRights(413, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });

            const jsonreset = {            
                cmpid: this._loginService.getLogin()[0].CMPID, GUID: this._loginService.getLogin()[0].GUID            
            };
            this._dataService.Common("Export/ExportVslMst_ResetAll", jsonreset)
                .subscribe((data: any) => {
    
                })
            const jsonExport = { cmpid:this._loginService.getLogin()[0].CMPID  };
            this._dataService.Common(this.baseUrl, jsonExport)
                .subscribe((data: any) => {
                    if (data.Table[0].STATUS == 100) {
                        this.ports = data.Table1;
                        this.Agents = data.Table2;
                        this.Liners = data.Table3;
                        this._toasterService.toast('info', 'Complete', 'Data filled successfully');                                       
                    } else {
                        this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);                   
                    }
                })
            this.baseUrl = 'Export/ExportVslMst_Populate';
            const jsonvessel = { VSL_RTNO: this._vslsharedvataSerice.sharedData, cmpid: this._loginService.getLogin()[0].CMPID , GUID: this._loginService.getLogin()[0].GUID  };
            this._dataService.Common(this.baseUrl, jsonvessel)
                .subscribe((data: any) => {
                    // console.log(data.Table);
                    if (data.Table[0].STATUS == 100) {
                        this.vessel = data.Table;

                        this.Pkid = this.vessel[0].ID;
                        this.vslRtno = this.vessel[0].VSL_RTNO;
                        this.vslname = this.vessel[0].VSL_NAME;
                        this.vslvoyno = this.vessel[0].VSL_VOYNO;
                        this.vslSname = this.vessel[0].VSL_SNAME;

                        this.SavPrtAgt = data.Table1;
                        this.loaderService.display(false);
                    } else {

                        this._toasterService.toast('error', 'Error', data.Table[0].STATUS);
                        this.loaderService.display(false);
                    }
               
                })              
        }else{ 
            this._loginService.verifyRights(413, '')
            .subscribe((data: any) => { 
                this._loginService.checkVerify('Add', data); 
                
            });
            const jsonreset = {            
                cmpid: this._loginService.getLogin()[0].CMPID, GUID: this._loginService.getLogin()[0].GUID            
            };
            this._dataService.Common("Export/ExportVslMst_ResetAll", jsonreset)
                .subscribe((data: any) => {
    
                })
            const jsonExport = { cmpid:this._loginService.getLogin()[0].CMPID  };
            this._dataService.Common(this.baseUrl, jsonExport)
                .subscribe((data: any) => {
                    if (data.Table[0].STATUS == 100) {
                        this.ports = data.Table1;
                        this.Agents = data.Table2;
                        this.Liners = data.Table3;
                        this._toasterService.toast('info', 'Complete', 'Data filled successfully'); 
                        this.loaderService.display(false);                                
                    } else {
                        this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);  
                        this.loaderService.display(false);                 
                    }
                })
            }
    }

    onAgentSelect(AgtCode) {
        this.Arrliner = [];
        //console.log(this.Arrliner);
        this.Agentslist = this.Agents.filter((linerlist: any) => linerlist.AGT_CODE == AgtCode);
        const Agtself = this.Agentslist[0].AGT_LINER1;// this.Agents.filter((linerlist: any) => linerlist.AGT_LINER1;
        // console.log(this.Agentslist);
        if (Agtself == "SELF" || Agtself == "") {
            this.Arrliner = this.Liners;
        }
        else {
            const AgtLIner1 = this.Agentslist[0].AGT_LINER1;
            const AgtLIner2 = this.Agentslist[0].AGT_LINER2;
            const AgtLIner3 = this.Agentslist[0].AGT_LINER3;

            if (AgtLIner1 != "" && AgtLIner2 != "" && AgtLIner3 != "") {
                var newItem = this.Liners.filter((linerlist: any) => linerlist.LINER_CODE == AgtLIner1);
                this.Arrliner.push(newItem[0]);

                newItem = this.Liners.filter((linerlist: any) => linerlist.LINER_CODE == AgtLIner2);
                this.Arrliner.push(newItem[0]);

                newItem = this.Liners.filter((linerlist: any) => linerlist.LINER_CODE == AgtLIner3);
                this.Arrliner.push(newItem[0]);
            }
            else if (AgtLIner1 != "" && AgtLIner2 == "" && AgtLIner3 == "") {
                var newItem = this.Liners.filter((linerlist: any) => linerlist.LINER_CODE == AgtLIner1);
                this.Arrliner.push(newItem[0]);
            }
            else if (AgtLIner1 != "" && AgtLIner2 != "" && AgtLIner3 == "") {
                var newItem = this.Liners.filter((linerlist: any) => linerlist.LINER_CODE == AgtLIner1);
                this.Arrliner.push(newItem[0]);

                newItem = this.Liners.filter((linerlist: any) => linerlist.LINER_CODE == AgtLIner2);
                this.Arrliner.push(newItem[0]);
            }
        }

    }

    // fn_Add_childRcd(Vslport, VslRrotnNo, vslLCD, Vsleta, VslArvldt, Vsletd, VslAsail, chkVsld, chkNtCall, VslAgent, VslspLine, Vslcrtpl, Vslcrtclrk) {
    AddEdit_childRcd() {
       
        this.baseUrl = 'Export/ExportVslPortAgtDtls_TmpIu';
        var LCD, ETA, ETD, ARRDT, SAIL;

        if (this.Vslport == undefined || this.Vslport == null || this.Vslport == "") {
            this._toasterService.toast('error', 'Error', "Please select port");
            return false;
        }

        if (this.Vsletd == "" || this.Vsletd == undefined || this.Vsletd == null) {
            this._toasterService.toast('error', 'Error', "Please Enter ETD");
            return false;
        }
        else {
            if (this.Vsleta == "" || this.Vsleta == undefined || this.Vsleta == null) { }
            else {
                if (this._dataService.date2Comparison(this.Vsleta.formatted, this.Vsletd.formatted) == false) {
                    this._toasterService.toast('error', 'Error', "ETD should be greater than ETA");
                    return false;
                }
            }
            if (this.VslArvldt == "" || this.VslArvldt == undefined || this.VslArvldt == null) { }
            else {
                if (this._dataService.date2Comparison(this.VslArvldt.formatted, this.Vsletd.formatted) == false) {
                    this._toasterService.toast('error', 'Error', "ETD should be greater than Actual Arrival");
                    return false;
                }
            }

        }
        if (this.Vsleta == "" || this.Vsleta == undefined || this.Vsleta == null) { }
        else {
            if (this.VslArvldt == "" || this.VslArvldt == undefined) { } else {
                if (this._dataService.date2Comparison(this.Vsleta.formatted, this.VslArvldt.formatted) == false) {
                    this._toasterService.toast('error', 'Error', "Actual Arrival should be greater than or equal to ETA");
                    return false;
                }
            }

        }

        if (this.VslAsail == "" || this.VslAsail == undefined || this.VslAsail == null) { }
        else {
            if (this.VslAgent == "") {
                this._toasterService.toast('error', 'Error', "Please select agent before entering Actual sailing");
                return false;
            }
            if (this.VslspLine == "") {
                this._toasterService.toast('error', 'Error', "Please select Shipping line before entering Actual sailing");
                return false;
            }
            var sailingdt = this.VslAsail.formatted;
            var date = this.Vsletd.formatted;

            var etddt = date.substring(3, 5) + "/" + date.substring(0, 2) + "/" + date.substring(6, 10)
            var startDate = new Date((etddt));

            var expDate = startDate;
            expDate.setDate(startDate.getDate() + 7);

            var etd_less_date = expDate.getDate();
            var etd_less_date1;
            var etddate = etd_less_date;

            if (etd_less_date.toString().length == 1) { etd_less_date1 = "0" + etd_less_date; }
            else { etd_less_date1 = etd_less_date; }

            var etd_less_Month = expDate.getMonth();
            var etd_less_Month1;
            var etd_less_Month = etd_less_Month + 1;

            if (etd_less_Month.toString().length == 1) { etd_less_Month1 = "0" + etd_less_Month; }
            else { etd_less_Month1 = etd_less_Month }

            var etd_less_year = expDate.getFullYear();
            var etd_year = etd_less_date1 + '/' + etd_less_Month1 + '/' + etd_less_year;

            startDate = new Date((etddt));

            var expDate1 = startDate;
            expDate1.setDate(startDate.getDate() - 10);
            var etd_gr_date = expDate1.getDate();
            var etd_gr_date1;

            if (etd_gr_date.toString().length == 1) { etd_gr_date1 = "0" + etd_gr_date; }
            else { etd_gr_date1 = etd_gr_date }

            var etd_gr_Month = expDate1.getMonth();
            var etd_gr_Month1
            etd_gr_Month = etd_gr_Month + 1;

            if (etd_gr_Month.toString().length == 1) { etd_gr_Month1 = "0" + etd_gr_Month; }
            else { etd_gr_Month1 = etd_gr_Month; }


            var etd_gr_year = expDate1.getFullYear();
            var etd_gryear = etd_gr_date1 + '/' + etd_gr_Month1 + '/' + etd_gr_year;

            if (this._dataService.date3Comparison(sailingdt, etd_year, etd_gryear) == false) {
                this._toasterService.toast('error', 'Error', "Saling date Should be less than " + etd_year + " greater then " + etd_gryear);
                return false;
            }
        }
        if (this.vslLCD == "") { LCD = "" } else { LCD = this.vslLCD.formatted; }
        if (this.Vsleta == "") { ETA = "" } else { ETA = this.Vsleta.formatted; }
        if (this.VslArvldt == "") { ARRDT = "" } else { ARRDT = this.VslArvldt.formatted; }
        if (this.VslAsail == "") { SAIL = "" } else { SAIL = this.VslAsail.formatted; }
        if (this.Vsletd == "") { ETD = "" } else { ETD = this.Vsletd.formatted; }
        this.loaderService.display(true);
        const jsonExport = { TBL_INDEXID: this.TBL_INDEXID, PK_PORTID: this.ID, VSL_RTNO: this.vslRtno, ROTATION: this.VslRrotnNo, PORT: this.Vslport, ETA: ETA, ARRIVAL: ARRDT, ETD: ETD, SAILING: SAIL, CARTING: LCD, VSLDELAY: this.Vsldly, NOTCALLED: this.Vslnotcald, USERNAME:  this._loginService.getLogin()[0].CMP_USERNAME, cmpid: this._loginService.getLogin()[0].CMPID, GUID:  this._loginService.getLogin()[0].GUID, TBL_INDEXIDAGT: this.TBL_INDEXID_AGT, PK_AGTID: (this.AGTID = "" ? 0 : this.AGTID ), VSL_AGENT: this.VslAgent, AGT_LINER: this.VslspLine, AGT_CARTPLACE: this.Vslcrtpl, AGT_CARTCLERK: this.Vslcrtclrk };
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {

                if (data.Table[0].STATUS == "100") {
                    this.SavPrtAgt = data.Table1;
                    this._toasterService.toast('info', 'Complete', data.Table[0].STA_MSG);
                    this.Clear_childRcd();
                    this.loaderService.display(false);
                } else {

                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                    this.loaderService.display(false);
                }
            });
           
            this.Addchild="Add";
    }

    delete_prtagt(PrtId) {
        

        this.baseUrl = 'Export/ExportVslPortAgtDtls_Tmpdelete';

        this.EditPrtAgtList = this.SavPrtAgt.filter((EditList: any) => EditList.TBL_INDEXID == PrtId);
        if (this.EditPrtAgtList[0].SAILING == "") {
            const jsonExport = { TBL_INDEXID: this.EditPrtAgtList[0].TBL_INDEXID, PK_PORTID: this.EditPrtAgtList[0].ID, VSL_RTNO: this.EditPrtAgtList[0].VSL_RTNO, PORT: this.EditPrtAgtList[0].PORT, cmpid: this._loginService.getLogin()[0].CMPID, GUID: this._loginService.getLogin()[0].GUID, TBL_INDEXIDAGT: this.EditPrtAgtList[0].TBL_INDEXID_AGT, PK_AGTID: this.EditPrtAgtList[0].AGTID };
            this._dataService.Common(this.baseUrl, jsonExport)
                .subscribe((data: any) => {
                    if (data.Table[0].STATUS == "100") {
                        this.SavPrtAgt = data.Table1;
                        this._toasterService.toast('info', 'Complete', data.Table[0].STA_MSG);
                    } else {
                        this._toasterService.toast('error', 'Error', data.Table[0].STA_MSG);
                    }
                },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                },
                () => {
                });
        }
        else {
            this._toasterService.toast('error', 'Error', "You cannot delete Port ,Sailing already done");
            return false;

        }

    }
    Edit_prtAgtDtls(PrtId) {
        this.Addchild="Update";
        this.EditPrtAgtList = this.SavPrtAgt.filter((EditList: any) => EditList.TBL_INDEXID == PrtId);
        if (this.EditPrtAgtList[0].SAILING == "") {
            this.Vslport = this.EditPrtAgtList[0].PORT;
            this.VslRrotnNo = this.EditPrtAgtList[0].ROTATION;
            this.vslLCD = (this.EditPrtAgtList[0].CARTING != "") ? this._dataService.stringdttoArry(this.EditPrtAgtList[0].CARTING) : "";
            this.Vsleta = (this.EditPrtAgtList[0].ETA != "") ? this._dataService.stringdttoArry(this.EditPrtAgtList[0].ETA) : "";
            this.VslArvldt = (this.EditPrtAgtList[0].ARRIVAL != "") ? this._dataService.stringdttoArry(this.EditPrtAgtList[0].ARRIVAL) : "";
            this.Vsletd = (this.EditPrtAgtList[0].ETD != "") ? this._dataService.stringdttoArry(this.EditPrtAgtList[0].ETD) : "";
            this.VslAsail = (this.EditPrtAgtList[0].SAILING != "") ? this._dataService.stringdttoArry(this.EditPrtAgtList[0].SAILING) : "";
            this.Vsldly = this.EditPrtAgtList[0].VSLDELAY;
            this.Vslnotcald = this.EditPrtAgtList[0].NOTCALLED;
            this.VslAgent = this.EditPrtAgtList[0].VSL_AGENT;
            if(this.EditPrtAgtList[0].VSL_AGENT != "-1")
            { this.onAgentSelect(this.EditPrtAgtList[0].VSL_AGENT); }
            
           
            this.VslspLine = this.EditPrtAgtList[0].AGT_LINER;
            this.Vslcrtpl = this.EditPrtAgtList[0].AGT_CARTPLACE;
            this.Vslcrtclrk = this.EditPrtAgtList[0].AGT_CARTCLERK;
            // Id s
            this.TBL_INDEXID = this.EditPrtAgtList[0].TBL_INDEXID;
            this.ID = this.EditPrtAgtList[0].ID;
            this.TBL_INDEXID_AGT = this.EditPrtAgtList[0].TBL_INDEXID_AGT;
            this.AGTID = this.EditPrtAgtList[0].AGTID;
        }
        else {
            this._toasterService.toast('error', 'Error', "You cannot edit Port/Agent details,Sailing already done");
            return false;

        }

    }
    Clear_childRcd() {
        this.Vslport = "-1";
        this.VslRrotnNo = "";
        this.vslLCD = "";
        this.Vsleta = "";
        this.VslArvldt = "";
        this.Vsletd = "";
        this.VslAsail = "";
        this.Vsldly = "";
        this.Vslnotcald = "";
        this.VslAgent = "-1";
        this.VslspLine = "-1";
        this.Vslcrtpl = "";
        this.Vslcrtclrk = "";
        
        // Id s
        this.TBL_INDEXID = 0;
        this.ID = 0;
        this.TBL_INDEXID_AGT = 0;
        this.AGTID = "0";
        this.Addchild="Add";
    }


    AddVslMst() {
        this.baseUrl = 'Export/ExportVslMst_IU';

        const jsonExport = {
            PK_id: this.Pkid,
            PK_PORTID: this.ID,
            VSL_RTNO: this.vslRtno,
            VSL_NAME: this.vslname,
            VSL_VOYNO: this.vslvoyno,
            VSL_SNAME: this.vslSname,
            cmpid: this._loginService.getLogin()[0].CMPID, GUID: this._loginService.getLogin()[0].GUID,
            USERNAME: this._loginService.getLogin()[0].CMP_USERNAME, MAKERIP: this._loginService.getLogin()[0].MAKERIP
        };
        this.loaderService.display(true);
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {

                if (data.Table[0].STATUS == "100") {
                    this._toasterService.toast('info', 'success', data.Table[0].STA_MSG);
                    this.ports = [];
                    this.Agents = [];
                    this.Liners =[];
                    this.Agentslist = [];
                    this.SavPrtAgt = [];
                    this.EditPrtAgtList = "";
                    this.Clear_childRcd();
                    this.vslRtno = "";
                    this.vslname = "";
                    this.vslSname = "";
                    this.loaderService.display(false);
                } else {

                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                    this.loaderService.display(false);
                }

             
            });
           
    }

    ResetAll() {
        this.Clear_childRcd();
        //this.ports = "";
        //this.Agents = "";
        //this.Liners = "";
        //this.Agentslist = "";
        this.SavPrtAgt = [];
        this.EditPrtAgtList = "";
        this.vslRtno = "";
        this.vslname = "";
        this.vslSname = "";
        this.vslvoyno ="";
        this.Pkid = "0";
        this._vslsharedvataSerice.sharedData=null;
        this.loaderService.display(true);
        const jsonExport = {            
            cmpid: this._loginService.getLogin()[0].CMPID, GUID: this._loginService.getLogin()[0].GUID            
        };
        this._dataService.Common("Export/ExportVslMst_ResetAll", jsonExport)
            .subscribe((data: any) => {

            })
        this._toasterService.toast('info', 'success', "Clear all data");
        this.loaderService.display(false);
    }
}
