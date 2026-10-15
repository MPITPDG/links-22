import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service';
import { SpPager, spExportCsv } from './sp-list';

@Component({
    selector: 'app-bl-update',
    templateUrl: 'bl-details-update.component.html',
    host: { class: 'kit-sp' },
    styles: [`
        .goodsissue-container table, 
        .goodsissue-container tr, 
        .goodsissue-container td, 
        .goodsissue-container th {
          border: none;
        }
      `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BlUpdateComponent implements OnInit {
    private baseUrl: string = 'Export/Export_Vessel_List';
    blno;
    bldate;
    vlrtnno;
    datalist: any = [];
    vslcmpName: string = "0";
    vessel: any = [];
    BlType: string = 'M';
    str:string="";
    dataArray: any = [];
    selectedBookingNo: string | null = null;
    public disableupdatebtn:boolean=false;
    pager: SpPager = new SpPager(() => this.datalist);

    get selectedCount(): number {
        return (this.datalist || []).filter((r: any) => r.CHECKED == true || r.CHECKED == '1').length;
    }

    exportCsv() {
        spExportCsv('bl-update', ['Expt no.', 'BL no.', 'BL dt', 'Container', 'Booking carr. no.', 'Shipper', 'Consignee', 'Pkgs', 'Gr. wt', 'Chrg. wt', 'Pcs'],
            this.datalist.map((r: any) => [r.EXPTNO, r.EXPT_BLNO, r.EXPT_BLDT, r.CONTAINER, r.BOOK_CARR_NBR, r.SHIPPER, r.CONSIGNEE, r.PKGS, r.GRWT, r.CHBLWT, r.PCS]));
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

    constructor(
        private loaderService: LoaderService,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService) {
              
    }
    ngOnInit() { 
        this.loaderService.display(true);    
        this._loginService.verifyRights(231, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });
        const jsonExport = { SEARCHMODE:"0", VSLNAME: '', VSL_VOY: '', CITYCODE:this._loginService.getLogin()[0].CITYCODE };
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {
                // Fail soft: a missing / empty Table leaves the vessel list empty.
                if (data && data.Table && data.Table.length > 0 && data.Table[0].STATUS == 100) {
                    this.vessel = data.Table1 || [];
                    this.loaderService.display(false);
                }
                else {

                    this._toasterService.toast('Warning', 'Warning', 'Data Loaded Successfully');
                    this.loaderService.display(false);
                }
            }, () => { this.vessel = []; this.loaderService.display(false); });
    }
    searchData() {
    this.dataArray=[];
    this.datalist=[];
    if(this.blno=='' || this.blno==undefined || this.blno=="")
    {
        alert('Please enter BL No.');
        return false;
    }
    if(this.bldate=='' || this.bldate==undefined || this.bldate=="")
        {
            alert('Please enter BL Date.');
            return false;
        }
    
    // this.blno='';
    // this.bldate='';
        if(this.vslcmpName=='0' || this.vslcmpName==undefined || this.vslcmpName=="")
            {
                alert('Please select Vessel');
                return false;
            }    
        this.loaderService.display(true);
        const _jsonData = {
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
            EXPT_VESSEL:this.vslcmpName.split("|")[0],
            VSL_PORT:this.vslcmpName.split("|")[1],
            BLNO:(this.blno==undefined)?'':this.blno,
            BLDATE:(this.bldate==undefined)?'':this.bldate
        };
        this._dataService.getData("Export/EXPT_SHIPMENT_PROGRESS_GETBLDATA", _jsonData)
            .subscribe((data: any) => {
                this.loaderService.display(false);
                // Fail soft: EXPT_SHIPMENT_PROGRESS_GETBLDATA may be missing on this API;
                // no Table means an empty list, never a throw.
                if (data && data.Table && data.Table.length > 0) {
                    if (data.Table[0].STATUS == 100) {
                     this.datalist = data.Table;
                     this.pager.reset();
                     for (let i = 0; i < this.datalist.length; i++) {
                        if (this.datalist[i].CHECKED == true) {
                            let obj = {
                                EXPTNO: this.datalist[i].EXPTNO.trim()
                            };
                            this.dataArray.push(obj);
                        }
                    }
                     console.log('table' ,this.datalist)
                     console.log('array' ,this.dataArray)
                     if(data.Table1 && data.Table1.length > 0 && data.Table1[0].MODE == 'UPDATE'){
                  
                        this.disableupdatebtn=true ;    
                     }
                     else {
                         this.disableupdatebtn=false;
                     }   
                    }
                    // if (data.Table[0].EXISTFLAG == 1) {
                    //    this.disableupdatebtn=true ;    
                    // }
                    // else {
                    //     this.disableupdatebtn=false;
                    // }
                }
                // if (data.Table1.length > 0) {
                //     this.blno=data.Table1[0].EXPT_BLNO;
                //     this.bldate= (data.Table1[0].EXPT_BLDT != "") ? (data.Table1[0].EXPT_BLDT) : "";
                // }
                // if(data.Table2.length > 0 && data.Table3.length >0  ){
                //     if(data.Table2[0].CHECKEDCNT != data.Table3[0].UNCHECKEDCNT && data.Table3[0].UNCHECKEDCNT > 0){
                  
                //        this.disableupdatebtn=false ;    
                //     }
                //     else {
                //         this.disableupdatebtn=true;
                //     }

                // }
           }, () => {
                this.loaderService.display(false);
                this._toasterService.toast('error', 'Error', 'BL data could not be loaded.');
           });
        }
        UpdateBLData(){
            if(this.blno=='' || this.blno==undefined || this.blno=="")
                {
                    alert('Please enter BL No.');
                    return false;
                }
                if(this.bldate=='' || this.bldate==undefined || this.bldate=="")
                    {
                        alert('Please enter BL Date.');
                        return false;
                    }
            if (this.datalist.length==0){
                alert('Please select at least one to update bl no & bl date. ')
                return false;
            }
            // for (let i = 0; i < this.datalist.length; i++) {
            //     if(this.datalist[i].CHECKED==true ){
            //         this.str += this.datalist[i].EXPTNO  + "|" ;
            //     }
                
            // }
            // Links: start from an empty list each time, so a second Update does not
            // resend the jobs of the first one.
            this.str = '';
            for (let i = 0; i < this.dataArray.length; i++) {
               // if(this.datalist[i].CHECKED==true ){
                    this.str += this.dataArray[i].EXPTNO  + "|" ;
               // }
                
            }
            console.log(this.str);
            const jsondata = {
                BLNO:this.blno,
                BLDATE:this.bldate,
                BLTYPE:this.BlType,
                CMPCODE: this._loginService.getLogin()[0].CMPCODE,
                CITYCODE: this._loginService.getLogin()[0].CITYCODE,
                STR: this.str,
             }
             if(this.str!=''){
              this.loaderService.display(true);
              this._dataService.Common("Export/EXPT_SHIPMENTPROGRESS_BLDETAILS_UPDATE", jsondata)
              .subscribe((data: any) => {
                // Fail soft: EXPT_SHIPMENTPROGRESS_BLDETAILS_UPDATE may be missing on this API.
                if (data && data.Table && data.Table.length > 0 && data.Table[0].STATUS == "100") {
                  this._toasterService.toast("success", "success", data.Table[0].STATUSTXT)
                  this.dataArray=[];
                  this.ResetData();
                  this.loaderService.display(false);
                } else {
                  const msg = (data && data.Table && data.Table.length > 0) ? (data.Table[0].STATUSTXT || data.Table[0].STATUSTEXT) : '';
                  this._toasterService.toast('error', 'Error', msg || 'BL details could not be updated.');
                  this.loaderService.display(false);
                }
              }, () => {
                this.loaderService.display(false);
                this._toasterService.toast('error', 'Error', 'BL details could not be updated.');
              });
             }
        }
        getCheckboxValues(event, exptno, id) {
            var index = this.dataArray.findIndex(x => x.EXPTNO == exptno);
            if (event) {
                let obj = {
                    EXPTNO: exptno,
                 }
                this.dataArray.push(obj);
            }
            else {
                this.dataArray.splice(index, 1);
            }
            console.log('arraychecked' ,this.dataArray)
        }
        BLDateDateChanged(ev){
            this.bldate=ev.formatted
    
        console.log(this.bldate)
        }
        ResetData(){
            this.blno='';
            this.bldate='';
            this.vslcmpName='0';
            this.datalist=[];
        }
        onSelectJob(selectedJob: any) {
            const bookingNo = selectedJob.BOOK_CARR_NBR;
            this.datalist.forEach(job => {
              if (job.BOOK_CARR_NBR === bookingNo) {
                job.CHECKED = selectedJob.CHECKED;
              }
            });
          }
          onCheckboxChange(job: any) {
            if (job.CHECKED) {
              // When selecting a job
              this.handleSelection(job);
            } else {
              // When deselecting a job
              this.handleDeselection(job);
            }
          }
          deselectJob(deselectedJob: any) {
            // Deselect the job
            deselectedJob.selected = false;
        
            // Check if any other jobs with the same booking number are still selected
            const anySelectedWithSameBookingNo = this.datalist.some(
              job => job.CHECKED && job.BOOK_CARR_NBR === this.selectedBookingNo
            );
        
            // If no jobs are selected with the current booking number, reset the selectedBookingNo
            if (!anySelectedWithSameBookingNo) {
              this.selectedBookingNo = null;
            }
          }
          handleDeselection(job: any) {
            // Deselect the current job
            this.deselectJobsWithSameBookingNo(job.BOOK_CARR_NBR);
        
            // Check if any other jobs with the same booking number are still selected
            const anySelected = this.datalist.some(j => j.BOOK_CARR_NBR === job.BOOK_CARR_NBR && j.CHECKED);
        
            if (!anySelected) {
              // Reset the selectedBookingNo if no jobs with the same booking number are selected
              this.selectedBookingNo = null;
            }
          }
          handleSelection(job: any) {
            if (this.selectedBookingNo === null) {
              // First selection sets the booking number
              this.selectedBookingNo = job.BOOK_CARR_NBR;
              if(this.selectedBookingNo!=''){
                this.selectJobsWithSameBookingNo(job.BOOK_CARR_NBR);
              }
              
            } else if (job.BOOK_CARR_NBR !== this.selectedBookingNo) {
              // Prevent selection of jobs with a different booking number
              job.CHECKED = false;
              alert('You can only select jobs with the same booking number.');
            }
          }
          selectJobsWithSameBookingNo(bookingNo: string) {
            this.datalist.forEach(job => {
              if (job.BOOK_CARR_NBR === bookingNo) {
                job.CHECKED = true;
              }
            });
          }
       
// Deselect all jobs with the same booking number
deselectJobsWithSameBookingNo(bookingNo: string) {
    this.datalist.forEach(job => {
      if (job.BOOK_CARR_NBR === bookingNo) {
        job.CHECKED = false;
      }
    });
  }
}
