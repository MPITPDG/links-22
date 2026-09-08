import { Component,    Input, Output, ViewChild, EventEmitter, OnInit, OnChanges, ElementRef,ViewEncapsulation } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { SharedDataSerice } from '../../export-share-data.service';
import { FontChangerComponent } from '../../../shared/common-font-changer.directive';
import{ActivatedRoute,Router} from '@angular/router';
import { LoaderService } from '../../../shared/service/loader.service';
//import { environment } from '../../../../environments/environment';


@Component({
    selector: 'app-MAWB_Model',
    templateUrl: 'Mawb_Tarifrating.component.html',
    // styleUrls: ['../../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'],
    // encapsulation: ViewEncapsulation.None
})
export class MAWBModelpopupcomponent  implements OnInit {
    @ViewChild('MAWBModelpopup', {static: false}) public editModal: ModalDirective;
    @ViewChild('updateButton', {static: false}) updateButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private disableButton: FontChangerComponent;
    @ViewChild('MawbRate', {static: false}) public mawbEdit: MAWBTarifratingcomponent;


    @Input() type: string;
    @Input() exptno: string;
    title: string = "";

    constructor(private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService,
        private _loginService : LoginService) { }


    ngOnInit(){
        if (this._sharedconsig.exportEditData != undefined) {
            this.exptno = this._sharedconsig.exportEditData.EXPTNO;
        }
    }

    show(etype) {
        this.type = etype;
        let editList = this._sharedconsig.exportEditData;
        let exptno_view
        exptno_view=editList.EXPTNO

        if (this.type == 'MawbTarif') { this.title = "MAWB - Update - " + this._sharedconsig.exportEditData.MAWBNO; this.mawbEdit.changefunction(); }
        this.editModal.show();
    }
    hide() {
        this.editModal.hide();
    }
    updateData() {
        if (this.type == 'MawbTarif') { this.mawbEdit.validate(); }

    }

    onSuccess(result: any) {
        if (result.status == 100) {
            this._toasterService.toast('success', '', result.message);
            this.hide();
        }
    }


    onDisabled(event: boolean) {
        if (event == false) {
            this.disableButton.changeFontwithEnableButton(4, this.updateButton);
        } else if (event == true) {
            this.disableButton.changeFontwithDisableButton(11, this.updateButton);
        }
    }


}

@Component({
    selector: 'app-MAWB_tariffRate',
    template: `
    <table class="table table-bordered table-sm-new">
    <tbody>
       <tr>
          <td class="width220" colspan="3"><span class="col-form-span-label"></span></td>
          <td class="width300" colspan="3"><span class="col-form-span-label"><strong><u>Existing</u></strong></span></td>
          <td class="width300" colspan="3"><span class="col-form-span-label"><strong><u>New</u></strong></span></td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>Chargable Weight</strong></span></td>
          <td colspan="3"><span class="col-form-span-label">{{Wgt}}</span></td>
          <td colspan="3"><input type="text" [(ngModel)]="UserWgt" class="form-control width100" (change)="changeUserWeight()"  /></td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>Gross Weight</strong></span></td>
          <td colspan="3"><span class="col-form-span-label">{{GrossWeight}}</span></td>
          <td colspan="3"><input type="text" [(ngModel)]="UserGrossWeight" class="form-control width100" (change)="changeUserWeight()"   /></td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"></span></td>
          <td colspan="6"><span class="col-form-span-label"><input type="checkbox" [(ngModel)]="isMinRate" [disabled]="true" />Print as MIN Rate Charges</span></td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>Freight INR/Kg </strong></span></td>
          <td colspan="6">
             <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'Prepaid'},{VALUEFIELD: 'CC', TEXTFIELD: 'Collect'}]"
                        bindLabel="TEXTFIELD"
                        bindValue="VALUEFIELD"
                        [(ngModel)]="FreightRate"
                        class="form-control width100"
                        (change)="changeFreight(FreightRate)"
                        [disabled]="true"
                        >
             </ng-select> -->
             <select class="form-control width100" [(ngModel)]="FreightRate"  (change)="changeFreight(FreightRate)" [disabled]="true">
                 <option value="">--Select--</option>
                 <option value="PP">Prepaid</option>
                 <option value="CC">Collect</option>
         </select>
          </td>
       </tr>

       <tr class="col-form-span-heading">
          <td colspan="3"><span class="col-form-span-label"><strong>FREIGHT </strong></span></td>
          <td colspan="3"><span class="col-form-span-label"><strong>TARIFF RATE </strong></span></td>
          <td colspan="3"><span class="col-form-span-label"><strong>NET NET RATE </strong></span></td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>Supplier </strong></span></td>

          <td colspan="6">
             <!-- <ng-select [items]="netData"
                        bindLabel="DataTextField"
                        bindValue="DataValueField"
                        [(ngModel)]="SupplierNet"
                        class="form-control"
                        >
             </ng-select> -->
             <select class="form-control " [(ngModel)]="SupplierNet">
                 <option value="">--select--</option>
                  <option *ngFor="let d of netData" value={{d.DataValueField}}>{{d.DataTextField}}</option>
             </select>
         </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>Freight Chargeble As </strong></span></td>
          <td colspan="3">
             <span class="col-form-span-label">
                 <input type="radio" name="TarFreightType" [checked]="TariffRate == 1" (click)="tarCheck(1)"/>All Inclusive&nbsp;
                 <input type="radio" name="TarFreightType" [checked]="TariffRate == 2" (click)="tarCheck(2)"/>Freight + Surcharge
             </span>
         </td>
         <td colspan="3">
             <span class="col-form-span-label">
                 <input type="radio"  name="NetFreightType" [checked]="NetRate == 1" (click)="netCheck(1)"/>All Inclusive&nbsp;
                 <input type="radio"  name="NetFreightType" [checked]="NetRate == 2" (click)="netCheck(2)"/>Freight + Surcharge
             </span>
         </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong><u>DESCRIPTION</u></strong></span></td>
          <td colspan="3">
             <span class="col-form-span-label" *ngIf="FreightRate == 'PP' || FreightRate == null"><strong><u>Payable On / Rate / Prepaid</u></strong></span>
             <span class="col-form-span-label" *ngIf="FreightRate == 'CC'"><strong><u>Payable On / Rate / Collect</u></strong></span>
          </td>
          <td colspan="3">
             <span class="col-form-span-label" *ngIf="FreightRate == 'PP' || FreightRate == null"><strong><u>Payable On / Rate / Prepaid</u></strong></span>
             <span class="col-form-span-label" *ngIf="FreightRate == 'CC'"><strong><u>Payable On / Rate / Collect</u></strong></span>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(1) FREIGHT (BASIC) </strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'CW', TEXTFIELD: 'CW'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"

                                     [(ngModel)]="TarFreightPayOn"
                                     class="form-control width70"
                                     [disabled]="true"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="TarFreightPayOn" [disabled]="true">
                             <option value="null">--</option>
                             <option value="CW">CW</option>
                         </select>

                     </td>
                     <td class="width60"><input type="text" [(ngModel)]="TarFreightRate" class="form-control" (change)="selectionChange($event)" (change)="changeTariffRates('Freight');changeNetRates('Freight')" /></td>
                     <td class="width100"><input type="text" [(ngModel)]="TarFreight" class="form-control" [disabled]="UserWgt > 151" /></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="TarFreightFrt"
                                     class="form-control width70"
                                     (change)="fnChangeFreight_PP_CC_TAR()"
                                     >
                         </ng-select> -->

                         <select class="form-control width70" [(ngModel)]="TarFreightFrt" (change)="fnChangeFreight_PP_CC_TAR()"  >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'CW', TEXTFIELD: 'CW'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"

                                     [(ngModel)]="NetFreightPayOn"
                                     class="form-control width70"
                                     [disabled]="true"
                                     (change)="fnCalculate_Tar()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="NetFreightPayOn" [disabled]="true">
                             <option value="null">--</option>
                             <option value="CW">CW</option>
                         </select>
                     </td>
                     <td class="width60"><input type="text" [(ngModel)]="NetFreightRate" class="form-control" (change)="changeNetRates('Freight')" /></td>
                     <td class="width100"><input type="text" [(ngModel)]="NetFreight" class="form-control"  [disabled]="UserWgt > 151"/></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="NetFreightFrt"
                                     class="form-control width70"
                                     (change)="fnChangeFreight_PP_CC_NET()"
                                     >
                         </ng-select> -->
                         <select class="form-control width80" [(ngModel)]="NetFreightFrt" (change)="fnChangeFreight_PP_CC_NET()"  >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td class="col-form-span-heading" colspan="9"><span class="col-form-span-label"><strong>FREIGHT (SURCHARGE)</strong></span></td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(2) FSC </strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">

                         <select class="form-control width70" [(ngModel)]="TarFscPayOn" (change)="TarFscPayOnChange($event)" (change)="changePayOnTariff('Fsc')" [disabled]="TariffRate == 1">
                             <option value="null">--</option>
                             <option value="CW">CW</option>
                             <option value="GW">GW</option>
                         </select>
                     </td>
                     <td class="width60"><input type="text" [(ngModel)]="TarFscRate" class="form-control" [disabled]="TariffRate == 1" (change)="TariffRateChange($event)" (change)="changeTariffRates('Fsc');changeNetRates('Fsc')"/></td>
                     <td class="width100"><input type="text" [(ngModel)]="TarFsc" class="form-control"  [disabled]="TariffRate == 1"/></td>
                     <td class="width60">

                         <select class="form-control width70" [(ngModel)]="TarFscFrt" (change)="fnCalculate_Tar()" [disabled]="true" >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">

                         <select class="form-control width70" [(ngModel)]="NetFscPayOn" [disabled]="NetRate == 1" (change)="changePayOnNet('Fsc')">
                             <option value="null">--</option>
                             <option value="CW">CW</option>
                             <option value="GW">GW</option>
                         </select>
                     </td>
                     <td class="width60"><input type="text" [(ngModel)]="NetFscRate" [disabled]="NetRate == 1" (change)="changeNetRates('Fsc')" class="form-control" /></td>
                     <td class="width100"><input type="text" [(ngModel)]="NetFsc" class="form-control"  [disabled]="UserWgt > 151"/></td>
                     <td class="width60">

                         <select class="form-control width70" [(ngModel)]="NetFscFrt" (change)="fnCalculate_Net()" 	[disabled]="true"  >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(3) IRC </strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">

                         <select class="form-control width70" [(ngModel)]="TarIrcPayOn"  [disabled]="TariffRate == 1" (change)="TarIrcPayOnChange($event)"  (change)="changePayOnTariff('Irc')">
                             <option value="null">--</option>
                             <option value="CW">CW</option>
                             <option value="GW">GW</option>
                         </select>
                     </td>
                     <td class="width60"><input type="text" [(ngModel)]="TarIrcRate" class="form-control"  [disabled]="TariffRate == 1"  (change)="TarIrcChange($event)" (change)="changeTariffRates('Irc');changeNetRates('Irc')"/></td>
                     <td class="width100"><input type="text" [(ngModel)]="TarIrc" class="form-control" [disabled]="TariffRate == 1"/></td>
                     <td class="width60">

                         <select class="form-control width80" [(ngModel)]="TarIrcFrt" [disabled]="true" (change)="fnCalculate_Tar()"  >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'CW', TEXTFIELD: 'CW'},{VALUEFIELD: 'GW', TEXTFIELD: 'GW'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="NetIrcPayOn"
                                     class="form-control width70"
                                     [disabled]="NetRate == 1"
                                     (change)="changePayOnNet('Irc')"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="NetIrcPayOn" [disabled]="NetRate == 1" (change)="changePayOnNet('Irc')">
                             <option value="null">--</option>
                             <option value="CW">CW</option>
                             <option value="GW">GW</option>
                         </select>
                     </td>
                     <td class="width60"><input type="text" [(ngModel)]="NetIrcRate" [disabled]="NetRate == 1" (change)="changeNetRates('Irc')" class="form-control" /></td>
                     <td class="width100"><input type="text" [(ngModel)]="NetIrc" class="form-control" [disabled]="UserWgt > 151" /></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="NetIrcFrt"
                                     class="form-control width70"
                                     [disabled]="true"
                                     (change)="fnCalculate_Net()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="NetIrcFrt"  [disabled]="true" (change)="fnCalculate_Net()" >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>

                     </td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(4) X-RAY </strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'CW', TEXTFIELD: 'CW'},{VALUEFIELD: 'GW', TEXTFIELD: 'GW'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="TarXrayPayOn"
                                     class="form-control width70"
                                     [disabled]="TariffRate == 1 "
                                     (change)="changePayOnTariff('Xray')"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="TarXrayPayOn"  (change)="XraypayChange($event)"	(change)="changePayOnTariff('Xray')">
                             <option value="null">--</option>
                             <option value="CW">CW</option>
                             <option value="GW">GW</option>
                         </select>
                     </td>
                     <td class="width60"><input type="text" [(ngModel)]="TarXrayRate" class="form-control"   (change)="XrayChange($event)"  (change)="changeTariffRates('Xray');changeNetRates('Xray')"/></td>
                     <!--  <td class="width100"><input type="text" [(ngModel)]="TarXray" class="form-control" [disabled]="UserWgt > 151" /></td>-->
                     <td class="width100"><input type="text" [(ngModel)]="TarXray" class="form-control" (change)="fnCalculate_Tar()" /></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="TarXrayFrt"
                                     class="form-control width70"
                                     [disabled]="true"
                                     (change)="fnCalculate_Tar()"
                                     >
                         </ng-select> -->
                         <select class="form-control width80" [(ngModel)]="TarXrayFrt"  [disabled]="true" 	(change)="fnCalculate_Tar()">
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>

                     </td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'CW', TEXTFIELD: 'CW'},{VALUEFIELD: 'GW', TEXTFIELD: 'GW'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="NetXrayPayOn"
                                     class="form-control width70"
                                     [disabled]="NetRate == 1"
                                     (change)="changePayOnNet('Xray')"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="NetXrayPayOn"  (change)="changePayOnNet('Xray')">
                             <option value="null">--</option>
                             <option value="CW">CW</option>
                             <option value="GW">GW</option>
                         </select>
                     </td>
                     <td class="width60"><input type="text" [(ngModel)]="NetXrayRate"  (change)="changeNetRates('Xray')" class="form-control" /></td>
                     <!-- <td class="width100"><input type="text" [(ngModel)]="NetXray" class="form-control" [disabled]="UserWgt > 151" /></td> -->
                     <td class="width100"><input type="text" [(ngModel)]="NetXray" class="form-control" (change)="fnCalculate_Net()" /></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="NetXrayFrt"
                                     class="form-control width70"
                                     [disabled]="true"
                                     (change)="fnCalculate_Net()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="NetXrayFrt" [disabled]="true" (change)="fnCalculate_Net()">
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(5) MISCELLANEOUS CHARGES </strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'CW', TEXTFIELD: 'CW'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="TarMcPayOn"
                                     class="form-control width70"
                                     [disabled]="true"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="TarMcPayOn" (change)="TarMcPayOnChange($event)" (change)="changePayOnTariff('Misc')">
                                <option value="null">--</option>
                                <option value="CW">CW</option>
                                <option value="GW">GW</option>
                         </select>
                     </td>
                     <!-- <td class="width60"><input type="text" [(ngModel)]="TarMcRate" class="form-control" [disabled]="UserWgt > 151" /></td>
                    <td class="width100"><input type="text" [(ngModel)]="TarMc" class="form-control" [disabled]="UserWgt > 151" /></td> -->
                    <td class="width60"><input type="text" [(ngModel)]="TarMcRate" class="form-control" (change)="TarMcRateChange($event)" (change)="changeTariffRates('Misc');changeNetRates('Misc')" /></td>
					<td class="width100"><input type="text" [(ngModel)]="TarMc" class="form-control" (change)="fnCalculate_Tar()" /></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="TarMcFrt"
                                     class="form-control width70"
                                     (change)="fnCalculate_Tar()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="TarMcFrt" (change)="fnCalculate_Tar()"  >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'CW', TEXTFIELD: 'CW'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="NetMcPayOn"
                                     class="form-control width70"
                                     [disabled]="true"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="NetMcPayOn" (change)="changePayOnNet('Misc')">
                                <option value="null">--</option>
                                <option value="CW">CW</option>
                                <option value="GW">GW</option>
                         </select>
                     </td>
                     <!--  <td class="width60"><input type="text" [(ngModel)]="NetMcRate" class="form-control" [disabled]="UserWgt > 151" /></td>
                     <td class="width100"><input type="text" [(ngModel)]="NetMc" class="form-control" [disabled]="UserWgt > 151" /></td>-->
                     <td class="width60"><input type="text" [(ngModel)]="NetMcRate" class="form-control" (change)="changeNetRates('Misc')" /></td>
					<td class="width100"><input type="text" [(ngModel)]="NetMc" class="form-control" (change)="fnCalculate_Net()" /></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="NetMcFrt"
                                     class="form-control width70"
                                     (change)="fnCalculate_Net()"
                                     >
                         </ng-select> -->

                     <select class="form-control width70" [(ngModel)]="NetMcFrt" (change)="fnCalculate_Net()"  >
                         <option value="null">--</option>
                         <option value="PP">PP</option>
                         <option value="CC">CC</option>
                     </select>
                     </td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(6) CTG </strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'GW', TEXTFIELD: 'GW'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"

                                     [(ngModel)]="TarCtgPayOn"
                                     class="form-control width70"
                                     [disabled]="true"
                                     >
                         </ng-select> -->
                         <!-- <select class="form-control width70" [(ngModel)]="TarCtgPayOn" [disabled]="true"> -->
                         <select class="form-control width70" [(ngModel)]="TarCtgPayOn" (change)="TarCtgPayOnChange($event)" (change)="changePayOnTariff('CTG')" >
                             <option value="null">--</option>
                             <option value="GW">GW</option>
                         </select>
                     </td>
                     <td class="width60"><input type="text" [(ngModel)]="TarCtgRate"  class="form-control" (change)="TarCtgRateChange($event)" (change)="changeTariffRates('CTG');changeNetRates('CTG')"/></td>
                     <td class="width100"><input type="text" [(ngModel)]="TarCtg" class="form-control" (change)="fnCalculate_Tar();" /></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="TarCtgFrt"
                                     class="form-control width70"
                                     (change)="fnCalculate_Tar()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="TarCtgFrt" (change)="fnCalculate_Tar()"  >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'GW', TEXTFIELD: 'GW'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="NetCtgPayOn"
                                     class="form-control width70"
                                     [disabled]="true"
                                     >
                         </ng-select> -->
                         <!-- <select class="form-control width70" [(ngModel)]="NetCtgPayOn" [disabled]="true"> -->
                         <select class="form-control width70" [(ngModel)]="NetCtgPayOn" (change)="changePayOnNet('CTG')">
                         <option value="null">--</option>
                         <option value="CW">CW</option>
                         <option value="GW">GW</option>
                         </select>
                     </td>
                     <!-- <td class="width60"><input type="text" [(ngModel)]="NetCtgRate" class="form-control" [disabled]="true" /></td>
                     <td class="width100"><input type="text" [(ngModel)]="NetCtg" class="form-control" [disabled]="UserWgt > 151" /></td> -->
                     <td class="width60"><input type="text" [(ngModel)]="NetCtgRate" class="form-control"  (change)="changeNetRates('CTG')"/></td>
					<td class="width100"><input type="text" [(ngModel)]="NetCtg" class="form-control"   (change)="fnCalculate_Net()"/></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"

                                     [(ngModel)]="NetCtgFrt"
                                     class="form-control width70"
                                     (change)="fnCalculate_Net()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="NetCtgFrt" (change)="fnCalculate_Net()"  >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(7) THC </strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'CW', TEXTFIELD: 'CW'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="TarThcPayOn"
                                     class="form-control width70"
                                     [disabled]="true"
                                     >
                         </ng-select> -->
                         <!-- <select class="form-control width70" [(ngModel)]="TarThcPayOn" [disabled]="true"> -->
                         <select class="form-control width70" [(ngModel)]="TarThcPayOn" (change)="TarThcPayOnChange($event)" (change)="changePayOnTariff('THC')">
                         <option value="null">--</option>
                         <option value="CW">CW</option>
                         <option value="GW">GW</option>

                         </select>
                     </td>
                     <!-- <td class="width60"><input type="text" [(ngModel)]="TarThcRate" class="form-control" [disabled]="true" /></td>
                     <td class="width100"><input type="text" [(ngModel)]="TarThc" class="form-control" [disabled]="true" /></td>-->
                     <td class="width60"><input type="text" [(ngModel)]="TarThcRate" class="form-control"  (change)="TarThcRateChange($event)" (change)="changeTariffRates('THC');changeNetRates('THC')" /></td>
                     <td class="width100"><input type="text" [(ngModel)]="TarThc" class="form-control" (change)="fnCalculate_Tar();" /></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="TarThcFrt"
                                     class="form-control width70"
                                     (change)="fnCalculate_Tar()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="TarThcFrt" (change)="fnCalculate_Tar()">
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>

                     </td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'GW', TEXTFIELD: 'GW'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="NetThcPayOn"
                                     class="form-control width70"
                                     [disabled]="true"
                                     >
                         </ng-select> -->
                         <!-- <select class="form-control width70" [(ngModel)]="NetThcPayOn" [disabled]="true"> -->
                         <select class="form-control width70" [(ngModel)]="NetThcPayOn" (change)="changePayOnNet('THC')">
                         <option value="null">--</option>
                         <option value="CW">CW</option>
                         <option value="GW">GW</option>
                         </select>
                     </td>
                     <!--  <td class="width60"><input type="text" [(ngModel)]="NetThcRate" class="form-control" [disabled]="true" /></td>
                     <td class="width100"><input type="text" [(ngModel)]="NetThc" class="form-control" [disabled]="true" /></td> -->
                     <td class="width60"><input type="text" [(ngModel)]="NetThcRate" class="form-control"  (change)="changeNetRates('THC')"/></td>
					<td class="width100"><input type="text" [(ngModel)]="NetThc" class="form-control" (change)="fnCalculate_Net()" /></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="NetThcFrt"
                                     class="form-control width70"
                                     (change)="fnCalculate_Net()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="NetThcFrt" 	(change)="fnCalculate_Net()">
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr *ngIf="CityCode != 'DAC'">
          <td colspan="3"><span class="col-form-span-label"><strong>(8) BUSINESS PROMOTION </strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'CW', TEXTFIELD: 'CW'},{VALUEFIELD: 'GW', TEXTFIELD: 'GW'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="TarBPPayOn"
                                     class="form-control width70"
                                     (change)="changePayOnTariff('BP')"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="TarBPPayOn" (change)="TarBPPayOnChange($event)" (change)="changePayOnTariff('BP')" >
                             <option value="null">--</option>
                             <option value="CW">CW</option>
                             <option value="GW">GW</option>
                         </select>
                     </td>
                     <td class="width60"><input type="text" [(ngModel)]="TarBPRate" class="form-control" (change)="TarBPRateChange($event)" (change)="changeTariffRates('BP');changeNetRates('BP')"/></td>
                     <td class="width100"><input type="text" [(ngModel)]="TarBP" class="form-control"  [disabled]="UserWgt > 151"/></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="TarBPFrt"
                                     class="form-control width70"
                                     (change)="fnCalculate_Tar()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="TarBPFrt"(change)="fnCalculate_Tar()">
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'CW', TEXTFIELD: 'CW'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"

                                     [(ngModel)]="NetBPPayOn"
                                     class="form-control width70"
                                     [disabled]="true"
                                     (change)="changePayOnNet('BP')"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="NetBPPayOn" [disabled]="true" (change)="changePayOnNet('BP')">
                             <option value="null">--</option>
                             <option value="CW">CW</option>
                             <option value="GW">GW</option>
                         </select>
                     </td>
                     <td class="width60"><input type="text" [(ngModel)]="NetBPRate" class="form-control"  (change)="changeNetRates('BP')" /></td>
                     <td class="width100"><input type="text" [(ngModel)]="NetBP" class="form-control" [disabled]="UserWgt > 151" /></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="NetBPFrt"
                                     class="form-control width70"
                                     (change)="fnCalculate_Net()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="NetBPFrt" (change)="fnCalculate_Net()">
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(9) AMS </strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60"></td>
                     <td class="width60"></td>
                     <td class="width100"><input type="text" [(ngModel)]="TarAms" class="form-control" (change)="TarAmsChange($event)" (change)="onChangeAms('TAR')"/></td>
                     <td class="width70">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="TarAmsFrt"
                                     class="form-control width70"
                                     (change)="fnCalculate_Tar()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="TarAmsFrt" (change)="TarAmsFrtChange($event)" (change)="fnCalculate_Tar()"  >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60"></td>
                     <td class="width60"></td>
                     <td class="width100"><input type="text" [(ngModel)]="NetAms" class="form-control" (change)="onChangeAms('NET')" /></td>
                     <td class="width70">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="NetAmsFrt"
                                     class="form-control width70"
                                     (change)="fnCalculate_Net()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="NetAmsFrt" (change)="fnCalculate_Net()"  >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(10) MAWB </strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60"></td>
                     <td class="width60"></td>
                     <td class="width100"><input type="text" [(ngModel)]="HawbTar" (change)="fnCalculate_Tar()" class="form-control" [disabled]="UserWgt > 151" /></td>
                     <td class="width70">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="HawbTarFrt"
                                     class="form-control width70"
                                     (change)="fnCalculate_Tar()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="HawbTarFrt" (change)="fnCalculate_Tar()"  >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60"></td>
                     <td class="width60"></td>
                     <td class="width100"><input type="text" [(ngModel)]="HawbNet" class="form-control" [disabled]="UserWgt > 151" /></td>
                     <td class="width70">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="HawbNetFrt"
                                     class="form-control width70"
                                     (change)="fnCalculate_Net()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="HawbNetFrt" (change)="fnCalculate_Net()"  >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(11) PCA </strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60"></td>
                     <td class="width60"></td>
                     <td class="width100"><input type="text" [(ngModel)]="PcaTar" (change)="fnCalculate_Tar()" class="form-control" /></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="PcaTarFrt"
                                     class="form-control width70"
                                     (change)="fnCalculate_Tar()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="PcaTarFrt" (change)="fnCalculate_Tar()"  >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60"></td>
                     <td class="width60"></td>
                     <td class="width100"><input type="text" [(ngModel)]="PcaNet" class="form-control" /></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="PcaNetFrt"
                                     class="form-control width70"
                                     (change)="fnCalculate_Net()"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="PcaNetFrt" (change)="fnCalculate_Net()"  >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
       <td colspan="3"><span class="col-form-span-label"><strong>(12) DEST.TRUCKING </strong></span></td>
       <td colspan="3">
            <table class="table-sm-new bglightgray">
              <tr>
                  <td class="width60">

                      <select class="form-control width70" [(ngModel)]="TarTruckPayOn" (change)="TarTruckPayOnChange($event)" (change)="changePayOnTariff('DT')" >
                          <option value="null">--</option>
                          <option value="CW">CW</option>
                          <option value="GW">GW</option>
                      </select>
                  </td>
                  <td class="width60"><input type="text" [(ngModel)]="TarTruckRate" class="form-control" (change)="TarTruckRateChange($event)" (change)="changeTariffRates('DT');changeNetRates('DT')"/></td>
                  <td class="width100"><input type="text" [(ngModel)]="TarTruck" class="form-control"  [disabled]="UserWgt > 151"/></td>
                  <td class="width60">

                      <select class="form-control width70" [(ngModel)]="TarTruckFrt"(change)="fnCalculate_Tar()">
                          <option value="null">--</option>
                          <option value="PP">PP</option>
                          <option value="CC">CC</option>
                      </select>
                  </td>
              </tr>
          </table>
       </td>
       <td colspan="3">
            <table class="table-sm-new bglightgray">
              <tr>
                  <td class="width60">

                      <select class="form-control width70" [(ngModel)]="NetTruckPayOn" (change)="changePayOnNet('DT')">
                          <option value="null">--</option>
                          <option value="CW">CW</option>
                          <option value="GW">GW</option>
                      </select>
                  </td>
                  <td class="width60"><input type="text" [(ngModel)]="NetTruckRate" class="form-control"  (change)="changeNetRates('DT')" /></td>
                  <td class="width100"><input type="text" [(ngModel)]="NetTruck" class="form-control" [disabled]="UserWgt > 151" /></td>
                  <td class="width60">

                      <select class="form-control width70" [(ngModel)]="NetTruckFrt" (change)="fnCalculate_Net()">
                          <option value="null">--</option>
                          <option value="PP">PP</option>
                          <option value="CC">CC</option>
                      </select>
                  </td>
              </tr>
          </table>
       </td>
    </tr>
    <tr class="formheading">
       <td colspan="11"><strong><span class="col-form-span-label">(13)  AIRLINE CHARGES</span></strong></td>
    </tr>
    <tr>

       <td colspan="11">
           <table class="table table-sm-new bgwhite" width="100%">
               <tr >
                   <td>
                       <select class="form-control width80" [(ngModel)]="CHARGETYPE" (change)="GetChrges(CHARGETYPE)" >
                          <option value="null">--Select--</option>
                          <option *ngFor="let d of ChrgTypelist" value={{d.DataValueField}}>{{d.DataTextField}}</option>
                  </select>
                   </td>
                   <td>
                       <select class="form-control  width130" [(ngModel)]="CHARGENAME" >
                       <option value="null">--</option>
                       <option *ngFor="let d of AirLineCharges" value={{d.DataValueField}}>{{d.DataTextField}}</option>
                 </select></td>

                   <td class="width60"></td>
                   <td class="width60"></td>
                   <td class="centerlabel">
                       <input type="text" class="width100" [(ngModel)]="RATE_TAR" (change)="changeNetRate(RATE_TAR)" class="form-control">
                   </td>
                   <td>
                       <select class="form-control width70" [(ngModel)]="RATE_TAR_FRT" (change)="changeNetFreight(RATE_TAR_FRT)" >
                           <option value="null">--</option>
                           <option value="PP">PP</option>
                           <option value="CC">CC</option>
                   </select>
                   </td>
                   <td class="width60"></td>
                   <!-- <td class="width60"></td> -->
                   <td>
                       <input type="text" class="width100" [(ngModel)]="RATE_NET" disabled class="form-control">
                   </td>
                   <td>
                       <select class="form-control width70" [(ngModel)]="RATE_NET_FRT" >
                           <option value="null">--</option>
                           <option value="PP">PP</option>
                           <option value="CC">CC</option>
                   </select>
                   </td>


                 </tr>
                 <tr>
                   <td colspan="9" align="center" >
                       <button type="button" class="btn btn-sm btn-warning" (click)="AddMAWBALCharges()">
                           <span class="col-form-span-label">
                               <i class="fa fa-plus"></i>&nbsp;{{txtchild}}</span>
                       </button>
                       <button type="button" class="btn btn-sm btn-danger" (click)="ResetMAWBCharges()">
                           <span class="col-form-span-label">
                               <i class="fa fa-ban"></i>Reset</span>
                       </button>
                   </td>
                 </tr>
               <!-- <tr *ngFor="let obj of dtAirLineCharges; let i= index">
                   <td>
                       <select class="form-control width80" [(ngModel)]="obj.CHARGETYPE"  >
                          <option value="">--Select--</option>
                          <option *ngFor="let d of ChrgTypelist[i]" value={{d.DataValueField}}>{{d.DataTextField}}</option>
                  </select>
                   </td>
                   <td>
                       <select class="form-control  width130" [(ngModel)]="obj.CHARGECODE" (change)="GetChrgType(obj.CHARGECODE,i)" >
                       <option value="null">--</option>
                       <option *ngFor="let d of AirLineCharges" value={{d.DataValueField}}>{{d.DataTextField}}</option>
                 </select></td>

                   <td class="width60"></td>
                   <td class="width60"></td>
                   <td class="centerlabel">
                       <input type="text" class="width100" [(ngModel)]="obj.CHRGAMT1" (change)="changeAmt2(obj.CHRGAMT1,i)" class="form-control">
                   </td>
                   <td>
                       <select class="form-control width70" [(ngModel)]="obj.FREIGHT1" (change)="changeFreight2(obj.FREIGHT1,i,obj.CHRGAMT1)" >
                           <option value="">--Select--</option>
                           <option value="PP">PP</option>
                           <option value="CC">CC</option>
                   </select>
                   </td>
                   <td class="width60"></td>
                   <td class="width60"></td>
                   <td>
                       <input type="text" class="width100" [(ngModel)]="obj.CHRGAMT2" disabled class="form-control">
                   </td>
                   <td>
                       <select class="form-control width70" [(ngModel)]="obj.FREIGHT2" >
                           <option value="">--Select--</option>
                           <option value="PP">PP</option>
                           <option value="CC">CC</option>
                   </select>
                   </td>
                   <td class="centerlabel width20">
                       <button type="button" class="btn btn-sm btn-danger" (click)="removeRow(i)" *ngIf="dtAirLineCharges.length > 1">
                           <span class="col-form-span-label"><i class="fa fa-times"></i></span>
                       </button>
                   </td>

                 </tr> -->

               <tr>
                   <td colspan="11">
                       <table class="table table-bordered  table-sm-new bgwhite" *ngIf="Chargeslist.length>0" width="100%" >
                                           <thead>
                                               <tr class="formheading">
                                                   <th></th>
                                                   <th  class="col-form-span-label">DA/DC</th>
                                                   <th class="col-form-span-label">Charge</th>
                                                   <th  class="col-form-span-label">Tariff Rate </th>
                                                   <th  class="col-form-span-label">Tariff Rate Freight</th>
                                                   <th  class="col-form-span-label">Net Rate </th>
                                                   <th class="col-form-span-label">Net Rate Freight</th>

                                               </tr>
                                           </thead>
                                            <tbody   >
                                               <tr *ngFor="let obj of Chargeslist">
                                                   <td class="centerlabel">
                                                       <i class="fa fa-pencil" (click)="Editchildrecd(obj.PK_ID)"  ></i>
                                                       &nbsp;
                                                       <i class="fa fa-trash" (click)="deletechildrecd(obj.PK_ID,obj.FK_CHRGDETAILSID)"></i>
                                                   </td>
                                                      <td><span class="col-form-span-label">{{obj.CHARGETYPE}}</span></td>
                                                   <td><span class="col-form-span-label">{{obj.CHRGNAME}}</span></td>
                                                   <td><span class="col-form-span-label">{{obj.RATE_TAR}}</span></td>
                                                   <td><span class="col-form-span-label">{{obj.RATE_TAR_FRT}}</span></td>
                                                   <td><span class="col-form-span-label">{{obj.RATE_NET}}</span></td>
                                                   <td><span class="col-form-span-label">{{obj.RATE_NET_FRT}}</span></td>
                                                   <td><span class="col-form-span-label">{{obj.NARRATION}}</span></td>
                                               </tr>
                                           </tbody>
                                       </table>

                   </td>
               </tr>
           </table>
       </td>
    </tr>
     <tr class="col-form-span-heading">
       <td colspan="11"></td>
     </tr>
       <tr class="col-form-span-heading">
          <td colspan="3"></td>
          <td colspan="3">
               <table class="table-sm-new">
                 <tr>
                     <td class="width120"><span class="col-form-span-label"><strong>PP Total</strong></span></td>
                     <td class="width120"><span class="col-form-span-label"><strong>CC Total</strong></span></td>
                     <td class="width60"></td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new">
                 <tr>
                     <td class="width120"><span class="col-form-span-label"><strong>PP Total</strong></span></td>
                     <td class="width120"><span class="col-form-span-label"><strong>CC Total</strong></span></td>
                     <td class="width60"></td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(14) DUE CARRIER [2+3+4+5+6+7+8+9]</strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width120"><input type="text" [(ngModel)]="DurCarrierTar" [disabled]="UserWgt > 151" class="form-control" [maxlength]="20"/></td>
                     <td class="width120"><input type="text" [(ngModel)]="DurCarrierTarCC" [disabled]="true" class="form-control"  [maxlength]="20"/></td>
                     <td class="width60"></td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width120"><input type="text" [(ngModel)]="DurCarrierNet" [disabled]="UserWgt > 151" class="form-control" [maxlength]="20"/></td>
                     <td class="width120"><input type="text" [(ngModel)]="DurCarrierNetCC" [disabled]="true" class="form-control" [maxlength]="20" /></td>
                     <td class="width60"></td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(15) DUE AGENT [10+11]</strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width120"><input type="text" [(ngModel)]="DueAgentTar" class="form-control" [disabled]="UserWgt > 151" [maxlength]="20" /></td>
                     <td class="width120"><input type="text" [(ngModel)]="DueAgentTarCC" class="form-control" [disabled]="true" [maxlength]="20" /></td>
                     <td class="width60"></td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width120"><input type="text" [(ngModel)]="DueAgentNet" class="form-control" [disabled]="UserWgt > 151" [maxlength]="20" /></td>
                     <td class="width120"><input type="text" [(ngModel)]="DueAgentNetCC" class="form-control" [disabled]="true" [maxlength]="20" /></td>
                     <td class="width60"></td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(16) TOTAL [1+12+13] </strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width120"><input type="text" [(ngModel)]="TotalTar" class="form-control" [disabled]="UserWgt > 151" [maxlength]="20" /></td>
                     <td class="width120"><input type="text" [(ngModel)]="TotalTarCC" class="form-control" [disabled]="true" [maxlength]="20" /></td>
                     <td class="width60"></td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width120"><input type="text" [(ngModel)]="TotalNet" class="form-control" [disabled]="UserWgt > 151" [maxlength]="20" /></td>
                     <td class="width120"><input type="text" [(ngModel)]="TotalNetCC" class="form-control" [disabled]="true" [maxlength]="20" /></td>
                     <td class="width60"></td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(17) OTHER CHARGES </strong></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width120"></td>
                     <td class="width120"><input type="text" [(ngModel)]="OtherTar" class="form-control"  [maxlength]="20"/></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"

                                     [(ngModel)]="OtherTarFrt"
                                     class="form-control"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="OtherTarFrt" >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width120"></td>
                     <td class="width120"><input type="text" [(ngModel)]="OtherNet" class="form-control" [maxlength]="20" /></td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="OtherNetFrt"
                                     class="form-control"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="OtherNetFrt" >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(18) Air Freight Commission </strong></span></td>
          <td colspan="3"><span class="col-form-span-label"></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width120"></td>
                     <td class="width120"><input type="text" [(ngModel)]="AirFrtCommission" class="form-control" [maxlength]="20" /></td>
                     <td class="width60"></td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(19) Freight Rebate </strong></span></td>
          <td colspan="3"><span class="col-form-span-label"></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width120"></td>
                     <td class="width120"><input type="text" [(ngModel)]="FrtRebate" class="form-control" [maxlength]="20" /></td>
                     <td class="width60"></td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr *ngIf="CityCode == 'DAC'">
          <td colspan="3"><span class="col-form-span-label"><strong>(20) Business Promotion</strong></span></td>
          <td colspan="3"><span class="col-form-span-label"></span></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width120"></td>
                     <td class="width120"><input type="text" [(ngModel)]="BusinesPromo" class="form-control" [maxlength]="20" /></td>
                     <td class="width60"></td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(21) TDS </strong></span></td>
          <td colspan="3">
             <!-- <ng-select [items]="tdsData"
                         bindLabel="TEXTFIELD"
                         bindValue="VALUEFIELD"

                         [(ngModel)]="DrpTDS"
                         class="form-control"
                         >
             </ng-select> -->
             <select class="form-control " [(ngModel)]="DrpTDS">
                 <option value="">--</option>
                  <option *ngFor="let d of tdsData" value={{d.DataValueField}}>{{d.DataTextField}}</option>
             </select>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width120"></td>
                     <td class="width120"><input type="text" [(ngModel)]="TxtTDS" class="form-control" [maxlength]="20" /></td>
                     <td class="width60"></td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>(22) Service Tax </strong></span></td>
          <td colspan="3">
             <!-- <ng-select [items]="serviceTax"
                         bindLabel="TEXTFIELD"
                         bindValue="VALUEFIELD"

                         [(ngModel)]="DrpServiceTax"
                         class="form-control"
                         >
             </ng-select> -->
             <select class="form-control " [(ngModel)]="DrpServiceTax">
                 <option value="">--</option>
                  <option *ngFor="let d of serviceTax" value={{d.DataValueField}}>{{d.DataTextField}}</option>
             </select>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width120"></td>
                     <td class="width120"><input type="text" [(ngModel)]="TxtServiceTax" class="form-control" [maxlength]="20" /></td>
                     <td class="width60"></td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>OTHER CHARGES </strong></span></td>
          <td colspan="3"><span class="col-form-span-label"><strong>AMOUNT / CALCULATE WITH</strong></span></td>
          <td colspan="3"><span class="col-form-span-label"><strong>AMOUNT / CALCULATE WITH</strong></span></td>
       </tr>
       <tr>
          <td colspan="3"><input type="text" [(ngModel)]="OtherChrg1" class="form-control" [maxlength]="10" (change)="onChangeOtherChargeName(1)"/></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60"><input type="text" [(ngModel)]="OtherAmt1_Tar" class="form-control" (change)="onChangeOther_Tar(1)"  /></td>
                     <td class="width80">
                         <span class="col-form-span-label">
                             <input type="radio" name="CalOneDcTar" [checked]="CalOneDcTar == 1" (click)="calOneTarCheck(1)"/>DueCarrier
                         </span>
                     </td>
                     <td class="width80">
                         <span class="col-form-span-label">
                             <input type="radio" name="CalOneDcTar" [checked]="CalOneDcTar == 2" (click)="calOneTarCheck(2)"/>DueAgent
                         </span>
                     </td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"

                                     [(ngModel)]="OtherAmt1TarFrt"
                                     class="form-control"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="OtherAmt1TarFrt" >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>

                     </td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60"><input type="text" [(ngModel)]="OtherAmt1_Net" class="form-control" [maxlength]="10"  (change)="onChangeOther_Net(1)" /></td>
                     <td class="width80">
                         <span class="col-form-span-label">
                             <input type="radio" name="CalOneDcNet" [checked]="CalOneDcNet == 1" (click)="calOneNetCheck(1)"/>DueCarrier
                         </span>
                     </td>
                     <td class="width80">
                         <span class="col-form-span-label">
                             <input type="radio" name="CalOneDcNet" [checked]="CalOneDcNet == 2" (click)="calOneNetCheck(2)"/>DueAgent
                         </span>
                     </td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="OtherAmt1NetFrt"
                                     class="form-control"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="OtherAmt1NetFrt" >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>

                     </td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><input type="text" [(ngModel)]="OtherChrg2" class="form-control" [maxlength]="10"  (change)="onChangeOtherChargeName(2)"/></td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60"><input type="text" [(ngModel)]="OtherAmt2_Tar" class="form-control" (change)="onChangeOther_Tar(2)"  [maxlength]="10"/></td>
                     <td class="width80">
                         <span class="col-form-span-label">
                             <input type="radio" name="CalTwoDcTar" [checked]="CalTwoDcTar == 1" (click)="calTwoTarCheck(1)"/>DueCarrier
                         </span>
                     </td>
                     <td class="width80">
                         <span class="col-form-span-label">
                             <input type="radio" name="CalTwoDcTar" [checked]="CalTwoDcTar == 2" (click)="calTwoTarCheck(2)"/>DueAgent
                         </span>
                     </td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"
                                     [(ngModel)]="OtherAmt2TarFrt"
                                     class="form-control"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="OtherAmt2TarFrt" >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
          <td colspan="3">
               <table class="table-sm-new bglightgray">
                 <tr>
                     <td class="width60"><input type="text" [(ngModel)]="OtherAmt2_Net" class="form-control" [maxlength]="10" (change)="onChangeOther_Net(2)" /></td>
                     <td class="width80">
                         <span class="col-form-span-label">
                             <input type="radio" name="CalTwoDcNet" [checked]="CalTwoDcNet == 1" (click)="calTwoNetCheck(1)"/>DueCarrier
                         </span>
                     </td>
                     <td class="width80">
                         <span class="col-form-span-label">
                             <input type="radio" name="CalTwoDcNet" [checked]="CalTwoDcNet == 2" (click)="calTwoNetCheck(2)"/>DueAgent
                         </span>
                     </td>
                     <td class="width60">
                         <!-- <ng-select [items]="[{VALUEFIELD: 'PP', TEXTFIELD: 'PP'},{VALUEFIELD: 'CC', TEXTFIELD: 'CC'}]"
                                     bindLabel="TEXTFIELD"
                                     bindValue="VALUEFIELD"

                                     [(ngModel)]="OtherAmt2NetFrt"
                                     class="form-control"
                                     >
                         </ng-select> -->
                         <select class="form-control width70" [(ngModel)]="OtherAmt2NetFrt" >
                             <option value="null">--</option>
                             <option value="PP">PP</option>
                             <option value="CC">CC</option>
                         </select>
                     </td>
                 </tr>
             </table>
          </td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>REMARK </strong></span></td>
          <td colspan="6"><input type="text" [(ngModel)]="Remark" class="form-control" /></td>
       </tr>
       <tr class="col-form-span-heading">
          <td colspan="9"><span class="col-form-span-label"><strong>Freight on MAWB - Already Printed</strong></span></td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong><u>DESCRIPTION</u></strong></span></td>
          <td colspan="3"><span class="col-form-span-label"><strong><u>PREPAID</u></strong></span></td>
          <td colspan="3"><span class="col-form-span-label"><strong><u>COLLECT</u></strong></span></td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>FREIGHT</strong></span></td>
          <td colspan="3"><span class="col-form-span-label">{{Ppchrg}}</span></td>
          <td colspan="3"><span class="col-form-span-label">{{Ccchrg}}</span></td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>DUE AGENT  </strong></span></td>
          <td colspan="3"><span class="col-form-span-label">{{Pptotagt}}</span></td>
          <td colspan="3"><span class="col-form-span-label">{{Cctotagt}}</span></td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>DUE CARRIER  </strong></span></td>
          <td colspan="3"><span class="col-form-span-label">{{Pptotcarr}}</span></td>
          <td colspan="3"><span class="col-form-span-label">{{Cctotcarr}}</span></td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong><u>TOTAL </u> </strong></span></td>
          <td colspan="3"><span class="col-form-span-label"><strong><u>{{Pptot}}</u></strong></span></td>
          <td colspan="3"><span class="col-form-span-label"><strong><u>{{Cctot}}</u></strong></span></td>
       </tr>
       <tr>
          <td colspan="3"><span class="col-form-span-label"><strong>MISCELLANEOUS CHARGES </strong></span></td>
          <td colspan="6"><span class="col-form-span-label">{{Othchrg}}</span></td>
       </tr>
     </tbody>
 </table>

    `,
    // styleUrls: ['../../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'],
    // encapsulation: ViewEncapsulation.None
})
export class MAWBTarifratingcomponent    {

      @Input() exptno: any;
      @Input() type: string;
      @Output() result: EventEmitter<any> = new EventEmitter<any>();
      @Output() disabledBtn: EventEmitter<boolean> = new EventEmitter<boolean>();


    quryParamsExpCode:string="";
    netData: any = [];
    tdsData: any = [];
    serviceTax: any = [];

    pageload: boolean = false;
    SupplierNet: any = null;
    TariffRate: any = null;
    NetRate: any = null;
    CityCode: any = null;

    CalOneDcTar: number = null;
    CalOneDcNet: number = null;
    CalTwoDcTar: number = null;
    CalTwoDcNet: number = null;

    NetRightsAdd: boolean = false;
    NetRights: boolean = false;
    hdNetRights: boolean = false;

    dataMode: string = null;

    Wgt: any = null;
    UserWgt: any = null;
    GrossWeight: any = null;
    UserGrossWeight: any = null;
    isMinRate: boolean = false;
    FreightRate: any = 'PP';
    AgentsRate: any = '0.00';

    //FREIGHT (BASIC)
    TarFreightPayOn: any = 'CW';
    TarFreightRate: any = null;
    TarFreight: any = null;
    TarFreightFrt: string = 'PP';
    NetFreightPayOn: any = 'CW';
    NetFreightRate: any = null;
    NetFreight: any = null;
    NetFreightFrt: string = 'PP';
    //FSC
    TarFscPayOn: any = null;
    TarFscRate: any = null;
    TarFsc: any = null;
    TarFscFrt: string = 'PP';
    NetFscPayOn: any = null;
    NetFscRate: any = null;
    NetFsc: any = null;
    NetFscFrt: string = 'PP';
    //IRC
    TarIrcPayOn: any = null;
    TarIrcRate: any = null;
    TarIrc: any = null;
    TarIrcFrt: string = 'PP';
    NetIrcPayOn: any = null;
    NetIrcRate: any = null;
    NetIrc: any = null;
    NetIrcFrt: string = 'PP';
    //XRAY
    TarXrayPayOn: any = null;
    TarXrayRate: any = null;
    TarXray: any = null;
    TarXrayFrt: string = 'PP';
    NetXrayPayOn: any = null;
    NetXrayRate: any = null;
    NetXray: any = null;
    NetXrayFrt: string = 'PP';
    //MISCELLANEOUS CHARGES
    TarMcPayOn: any = 'CW';
    TarMcRate: any = null;
    TarMc: any = null;
    TarMcFrt: string = 'PP';
    NetMcPayOn: any = 'CW';
    NetMcRate: any = null;
    NetMc: any = null;
    NetMcFrt: string = 'PP';
    //CTG
    TarCtgPayOn: any = 'GW';
    TarCtgRate: any = null;
    TarCtg: any = null;
    TarCtgFrt: string = 'PP';
    NetCtgPayOn: any = 'GW';
    NetCtgRate: any = null;
    NetCtg: any = null;
    NetCtgFrt: string = 'PP';
    //THC
    TarThcPayOn: any = 'CW';
    TarThcRate: any = null;
    TarThc: any = null;
    TarThcFrt: string = 'PP';
    NetThcPayOn: any = 'GW';
    NetThcRate: any = null;
    NetThc: any = null;
    NetThcFrt: string = 'PP';
    //BUSINESS PROMOTION
    TarBPPayOn: any = 'CW';
    TarBPRate: any = null;
    TarBP: any = null;
    TarBPFrt: string = 'PP';
    NetBPPayOn: any = 'CW';
    NetBPRate: any = null;
    NetBP: any = null;
    NetBPFrt: string = 'PP';


       //DESTIMATION TRUCKING
       TarTruckPayOn: any = 'CW';
       TarTruckRate: any = null;
       TarTruck: any = null;
       TarTruckFrt: string = 'PP';
       NetTruckPayOn: any = 'CW';
       NetTruckRate: any = null;
       NetTruck: any = null;
       NetTruckFrt: string = 'PP';

    TarAms: any = null;
    TarAmsFrt: any = 'PP';
    NetAms: any = null;
    NetAmsFrt: any = 'PP';

    HawbTar: any = null;
    HawbTarFrt: any = 'PP';
    HawbNet: any = null;
    HawbNetFrt: any = 'PP';

    PcaTar: any = null;
    PcaTarFrt: any = 'PP';
    PcaNet: any = null;
    PcaNetFrt: any = 'PP';

    DurCarrierTar: any = null;
    DurCarrierTarCC: any = null;
    DurCarrierNet: any = null;
    DurCarrierNetCC: any = null;

    DueAgentTar: any = null;
    DueAgentTarCC: any = null;
    DueAgentNet: any = null;
    DueAgentNetCC: any = null;

    TotalTar: any = null;
    TotalTarCC: any = null;
    TotalNet: any = null;
    TotalNetCC: any = null;

    OtherTar: any = null;
    OtherTarFrt: any = 'PP';
    OtherNet: any = null;
    OtherNetFrt: any = 'PP';

    AirFrtCommission: any = null;

    FrtRebate: any = null;

    BusinesPromo: any = null;

    DrpTDS: any = null;
    TxtTDS: any = null;

    DrpServiceTax: any = null;
    TxtServiceTax: any = null;

    OtherChrg1: any = null;
    OtherAmt1_Tar: any = null;
    OtherAmt1TarFrt: any = 'PP';
    OtherAmt1_Net: any = null;
    OtherAmt1NetFrt: any = 'PP';

    OtherChrg2: any = null;
    OtherAmt2_Tar: any = null;
    OtherAmt2TarFrt: any = 'PP';
    OtherAmt2_Net: any = null;
    OtherAmt2NetFrt: any = 'PP';

    Remark: string = null;
    Ppchrg: string = null;
    Ccchrg: string = null;
    Pptotagt: string = null;
    Cctotagt: string = null;
    Pptotcarr: string = null;
    Cctotcarr: string = null;
    Pptot: string = null;
    Cctot: string = null;
    Othchrg: string = null;
    ISAUTO_FRT_INV: string ="";
    oldchblwt: any = null;
    oldgrwt : any = null;

    //AIRLINE CHARGES
    dtAirLineCharges: Array<any> = [];
    AirLineCharges: any = [];
    AllAirLineChargeslist:any=[];
    ChrgTypelist:any=[];
    ChrgTypelistold:Array<any> = [];
    CHARGETYPE:string;
    DELCHARGETYPE:string;
    CHARGENAME:string;
    EDIT_CHARGETYPE:string="";
    EDIT_RATE_TAR:any = null;
    DEL_RATE_TAR:any = null;
    RATE_TAR: any = null;
    RATE_TAR_FRT: string = 'PP';
    DEL_RATE_TAR_FRT:string;
    RATE_NET: any = null;
    EDIT_RATE_NET:any = null;
    DEL_RATE_NET:any = null;
    RATE_NET_FRT: string = 'PP';
    DEL_RATE_NET_FRT:string;
    childID:string="0";
    Chargeslist: any = [];
    HAWBChargeslist: any = [];
    makerid:string;
    guid :string="";
    txtchild : string ="Add"
    CHRGDETAILSID:string="0";
    FK_ID: string="0";
    PK_ID: string="0";
    tot_rate_tar_pp_da:any = null;
    tot_rate_tar_pp_dc:any = null;
    tot_rate_tar_cc_da:any = null;
    tot_rate_tar_cc_dc:any = null;
    tot_rate_net_pp_da:any = null;
    tot_rate_net_pp_dc:any = null;
    tot_rate_net_cc_da:any = null;
    tot_rate_net_cc_dc:any = null;
    dttable6: any = [];

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService,
        private _activatedRoute: ActivatedRoute,

        ) {}

    changefunction()
    {  var verifyData = null;
        this._loginService.verifyRights(236, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('Modify', data);  //For verify user access
                this._loginService.verifyRights(264, '')
                    .subscribe((returnData: any) => {
                        this.NetRightsAdd = this._loginService.returnRights('Add', returnData, this._loginService.getLogin()[0].ROLETYPE);
                        if (this.NetRightsAdd == false) {
                            this.NetRights = this._loginService.returnRights('View', returnData, this._loginService.getLogin()[0].ROLETYPE);
                        }
                        this.hdNetRights = (this.NetRightsAdd == true) ? true : false;
                    });
                // this._loaderService.display(true);
                this.Resetchildrcrdpageload();
                verifyData = data.Table;
                this.setDropDownData(this._sharedconsig.exportEditData.MAWBNO, this._sharedconsig.exportEditData.EXPTNO);
                this.setData(this._sharedconsig.exportEditData.MAWBNO, this._loginService.getLogin()[0].CMP_USERENCCODE, this._sharedconsig.exportEditData.EXPTNO);
            });
    }


    tarCheck(num: number) {
        // this.TariffRate = num;
        this.TariffRate = num;
        this.NetRate = num;
        //FSC
        this.TarFscPayOn = null;
        this.TarFscRate = "";
        this.TarFsc = "";
        //IRC
        this.TarIrcPayOn = null;
        this.TarIrcRate = "";
        this.TarIrc = "";
        //XRAY
        this.TarXrayPayOn = null;
        this.TarXrayRate = "";
        this.TarXray = "";
    }

    netCheck(num: number) {
        this.NetRate = num;
        this.TariffRate = num;
        //FSC
        this.NetFscPayOn = null;
        this.NetFscRate = "";
        this.NetFsc = "";
        //IRC
        this.NetIrcPayOn = null;
        this.NetIrcRate = "";
        this.NetIrc = "";
        //XRAY
        this.NetXrayPayOn = null;
        this.NetXrayRate = "";
        this.NetXray = "";
    }

    calOneTarCheck(num: number) {
        this.CalOneDcTar = num;
    }

    calOneNetCheck(num: number) {
        this.CalOneDcNet = num;
    }

    calTwoTarCheck(num: number) {
        this.CalTwoDcTar = num;
    }

    calTwoNetCheck(num: number) {
        this.CalTwoDcNet = num;
    }

    changeFreight(typ) {
        this.FreightRate = typ;
    }

    fn_PageLoad() {
        let CWt = this.UserWgt;
        let GWt = this.UserGrossWeight;

        if (Math.abs(CWt) < 151) // || Math.abs(GWt) < 151)---LAST CHANGES
        {
            this.fn_Load_150_check();
        }
        else {
            this.HawbTar = "150.00";
            this.PcaTar = "250.00";
            this.fn_MC_CTG_Tar();
            this.fn_THC_Tar();
            this.fn_ChangeChareableAsTar();
            if (this.hdNetRights == true) {
                this.HawbNet = "150.00";
                this.PcaNet = "250.00";
                // this.HawbNet = true;
                // this.PcaNet = false;
                this.fn_MC_CTG_Net();
                this.fn_THC_Net();
                this.fn_ChangeChareableAsNet();
            }
        }
    }

    fn_Load_150_check() {
        // this.TarFreightRate = "";
        // this.TarFscRate = "";
        // this.TarIrcRate = "";
        // this.TarXrayRate = "";
        // this.TarMcRate = "";
        // this.TarCtgRate = "";
        // this.TarThcRate = "";
        // this.TarBPRate = "";

        this.fn_THC_Tar();
        this.fn_ChangeChareableAsTar();

        if (this.hdNetRights == true) {
            // this.NetFreightRate = "";
            // this.NetFscRate = "";
            // this.NetIrcRate = "";
            // this.NetXrayRate = "";
            // this.NetMcRate = "";
            // this.NetCtgRate = "";
            // this.NetThcRate = "";
            this.fn_THC_Net();
            this.fn_ChangeChareableAsNet();
        }
    }
    fn_ChangeChareableAsTar() {

        if (this.TariffRate == 1) {
            this.TarFscPayOn = null;
            this.TarFscRate = "";
            this.TarIrcPayOn = null;
            this.TarIrcRate = "";
            this.TarXrayPayOn = null;
            this.TarXrayRate = "";
            this.TarFsc = "";
            this.TarIrc = "";
            this.TarXray = "";
        }
        else {
            let CWt = this.UserWgt;
            let GWt = this.UserGrossWeight;
            if (Math.abs(CWt) < 151) // || Math.abs(GWt) < 151)---LAST CHANGES
            {


            }
            else {

            }
        }
        this.fnCalculate_Tar();
    }

    fn_ChangeChareableAsNet() {
        let CWt = this.UserWgt;
        let GWt = this.UserGrossWeight;

        if (this.NetRate == 1) {
            this.NetFscPayOn = null;
            this.NetFscRate = "";
            this.NetIrcPayOn = null;
            this.NetIrcRate = "";
            this.NetXrayPayOn = null;
            this.NetXrayRate = "";

            this.NetFsc = "";
            this.NetIrc = "";
            this.NetXray = "";
        }
        else {
            CWt = this.UserWgt
            GWt = this.UserGrossWeight
            if (Math.abs(CWt) < 151) // || Math.abs(GWt) < 151)---LAST CHANGES
            {

            }
            else {

            }
        }
        this.fnCalculate_Net()
    }

    setDropDownData(mawbno, exptno) {
        const _jsonData = {
            Type1: mawbno.substring(0, 3),
            Type2: exptno.substring(2, 5)
        };
        this._loaderService.display(true);
        this.exptno=exptno;
        this._dataService.Common("Export/ConsignmentMAWBFill_DROPDOWN", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.netData = data.Table;
                this.tdsData = data.Table1;
                this.serviceTax = data.Table2;
                this.AllAirLineChargeslist=data.Table3
                this.ChrgTypelist=data.Table4;
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText); },
                () => { });
    }

    setData(mawbno, code, exptno) {
        this._loaderService.display(true);
        const _jsonData = {
            Type1: mawbno,
            Type2: code,
            Type3: exptno.substring(2, 5),
            GUID:this._loginService.getLogin()[0].GUID,
            CmpId: this._loginService.getLogin()[0].CMPID,
            RoleType: this._loginService.getLogin()[0].ROLETYPE,
            CodeCity: this._loginService.getLogin()[0].CMPCODE + '' + this._loginService.getLogin()[0].CITYCODE1
        };

        this._dataService.Common("Export/Consignment_MAWB_PP_CC_View", _jsonData)
            .subscribe((data: any) => {

                this.CityCode = data.Table1[0].CITYCODE;

                this.Wgt = data.Table1[0].CHRGWT;
                this.UserWgt = data.Table1[0].CHBL_WGT_USER;
                this.oldchblwt=this.UserWgt;
                this.GrossWeight = data.Table1[0].GROSSWT;
                this.oldgrwt=this.GrossWeight;
                this.UserGrossWeight = data.Table1[0].GROSS_WGT_USER;
                this.isMinRate = (data.Table1[0].ISMIN == 'Y') ? true : false;
                this.FreightRate = (data.Table1[0].FREIGHT != '') ? data.Table1[0].FREIGHT : null;
                this.SupplierNet = (data.Table1[0].SUPPLIER_NET != '') ? data.Table1[0].SUPPLIER_NET : null;
                this.AgentsRate = (data.Table1[0].AGENTS_RATE != '') ? data.Table1[0].AGENTS_RATE : 0.00;
                this.TariffRate = (data.Table1[0].FRT_CHARGEABLE_AS_TAR == 'FS') ? 2 : 1;
                this.NetRate = (data.Table1[0].FRT_CHARGEABLE_AS_NET == 'FS') ? 2 : 1;


                //FREIGHT (BASIC)
                this.TarFreightPayOn = (data.Table1[0].FRT_PAYABLE_ON_TAR != '') ? data.Table1[0].FRT_PAYABLE_ON_TAR : 'CW';
                this.TarFreightRate = data.Table1[0].FRT_RATE_PER_KG_TAR;
                this.TarFreight = data.Table1[0].FRT_RATE_TAR;
                this.NetFreightPayOn = (data.Table1[0].FRT_PAYABLE_ON_NET != '') ? data.Table1[0].FRT_PAYABLE_ON_NET : 'CW';
                this.NetFreightRate = data.Table1[0].FRT_RATE_PER_KG_NET;
                this.NetFreight = data.Table1[0].FRT_RATE_NET;
                //FSC
                this.TarFscPayOn = (data.Table1[0].FSC_PAYABLE_ON_TAR != '') ? data.Table1[0].FSC_PAYABLE_ON_TAR : null;
                this.TarFscRate = data.Table1[0].FSC_RATE_PER_KG_TAR;
                this.TarFsc = data.Table1[0].FSC_RATE_TAR;
                this.NetFscPayOn = (data.Table1[0].FSC_PAYABLE_ON_NET != '') ? data.Table1[0].FSC_PAYABLE_ON_NET : null;
                this.NetFscRate = data.Table1[0].FSC_RATE_PER_KG_NET;
                this.NetFsc = data.Table1[0].FSC_RATE_NET;
                //IRC
                this.TarIrcPayOn = (data.Table1[0].IRC_PAYABLE_ON_TAR != '') ? data.Table1[0].IRC_PAYABLE_ON_TAR : null;
                this.TarIrcRate = data.Table1[0].IRC_RATE_PER_KG_TAR;
                this.TarIrc = data.Table1[0].IRC_RATE_TAR;
                this.NetIrcPayOn = (data.Table1[0].IRC_PAYABLE_ON_NET != '') ? data.Table1[0].IRC_PAYABLE_ON_NET : null;
                this.NetIrcRate = data.Table1[0].IRC_RATE_PER_KG_NET;
                this.NetIrc = data.Table1[0].IRC_RATE_NET;
                //XRAY
                this.TarXrayPayOn = (data.Table1[0].XRAY_PAYABLE_ON_TAR != '') ? data.Table1[0].XRAY_PAYABLE_ON_TAR : null;
                this.TarXrayRate = data.Table1[0].XRAY_RATE_PER_KG_TAR;
                this.TarXray = data.Table1[0].XRAY_RATE_TAR;
                this.NetXrayPayOn = (data.Table1[0].XRAY_PAYABLE_ON_NET != '') ? data.Table1[0].XRAY_PAYABLE_ON_NET : null;
                this.NetXrayRate = data.Table1[0].XRAY_RATE_PER_KG_NET;
                this.NetXray = data.Table1[0].XRAY_RATE_NET;
                //MISCELLANEOUS CHARGES
                this.TarMcPayOn = (data.Table1[0].MC_PAYABLE_ON_TAR != '') ? data.Table1[0].MC_PAYABLE_ON_TAR : null;
                this.TarMcRate = data.Table1[0].MC_RATE_PER_KG_TAR;
                this.TarMc = data.Table1[0].MC_RATE_TAR;
                this.NetMcPayOn = (data.Table1[0].MC_PAYABLE_ON_NET != '') ? data.Table1[0].MC_PAYABLE_ON_NET : null;
                this.NetMcRate = data.Table1[0].MC_RATE_PER_KG_NET;
                this.NetMc = data.Table1[0].MC_RATE_NET;
                //CTG
                this.TarCtgPayOn = (data.Table1[0].CTG_PAYABLE_ON_TAR != '') ? data.Table1[0].CTG_PAYABLE_ON_TAR : 'CW';
                this.TarCtgRate = data.Table1[0].CTG_RATE_PER_KG_TAR;
                this.TarCtg = data.Table1[0].CTG_RATE_TAR;
                this.NetCtgPayOn = (data.Table1[0].CTG_PAYABLE_ON_NET != '') ? data.Table1[0].CTG_PAYABLE_ON_NET : 'CW';
                this.NetCtgRate = data.Table1[0].CTG_RATE_PER_KG_NET;
                this.NetCtg = data.Table1[0].CTG_RATE_NET;
                //THC
                this.TarThcPayOn = (data.Table1[0].THC_PAYABLE_ON_TAR != '') ? data.Table1[0].THC_PAYABLE_ON_TAR : 'CW';
                this.TarThcRate = data.Table1[0].THC_RATE_PER_KG_TAR;
                this.TarThc = data.Table1[0].THC_RATE_TAR;
                this.NetThcPayOn = (data.Table1[0].THC_PAYABLE_ON_NET != '') ? data.Table1[0].THC_PAYABLE_ON_NET : 'CW';
                this.NetThcRate = data.Table1[0].THC_RATE_PER_KG_NET;
                this.NetThc = data.Table1[0].THC_RATE_NET;
                //BUSINESS PROMOTION
                this.TarBPPayOn = (data.Table1[0].BP_PAYABLE_ON_TAR != '') ? data.Table1[0].BP_PAYABLE_ON_TAR : null;
                this.TarBPRate = data.Table1[0].BP_RATE_PER_KG_TAR;
                this.TarBP = data.Table1[0].BP_RATE_TAR;
                this.NetBPPayOn = (data.Table1[0].BP_PAYABLE_ON_NET != '') ? data.Table1[0].BP_PAYABLE_ON_NET : null;
                this.NetBPRate = data.Table1[0].BP_RATE_PER_KG_NET;
                this.NetBP = data.Table1[0].BP_RATE_NET;

                // if (this.UserWgt > 151) {
                //     this.tarCheck(this.TariffRate);
                //     this.tarCheck(this.NetRate);
                // }

                this.TarAms = data.Table1[0].AMS_RATE_TAR;
                this.TarAmsFrt = (data.Table1[0].AMS_RATE_TAR_FRT) ? data.Table1[0].AMS_RATE_TAR_FRT : null;
                this.NetAms = data.Table1[0].AMS_RATE_NET;
                this.NetAmsFrt = (data.Table1[0].AMS_RATE_NET_FRT) ? data.Table1[0].AMS_RATE_NET_FRT : null;

                this.HawbTar = data.Table1[0].HAWB_TAR;
                if (data.Table1[0].HAWB_RATE_TAR_FRT !="")
               { this.HawbTarFrt = data.Table1[0].HAWB_RATE_TAR_FRT;}
                this.HawbNet = data.Table1[0].HAWB_NET;
                if(data.Table1[0].HAWB_RATE_NET_FRT !="")
                {this.HawbNetFrt = data.Table1[0].HAWB_RATE_NET_FRT;}

                this.PcaTar = data.Table1[0].PCA_TAR;
                if (data.Table1[0].PCA_RATE_TAR_FRT!="")
                {this.PcaTarFrt = data.Table1[0].PCA_RATE_TAR_FRT;}
                this.PcaNet = data.Table1[0].PCA_NET;
                if(data.Table1[0].PCA_RATE_NET_FRT !="")
                {this.PcaNetFrt = data.Table1[0].PCA_RATE_NET_FRT;}

                this.DurCarrierTar = data.Table1[0].DUE_CARRIER_TAR;
                this.DurCarrierTarCC = data.Table1[0].DUE_CARRIER_TAR_CC;
                this.DurCarrierNet = data.Table1[0].DUE_CARRIER_NET;
                this.DurCarrierNetCC = data.Table1[0].DUE_CARRIER_NET_CC;

                this.DueAgentTar = data.Table1[0].DUE_AGENT_TAR;
                this.DueAgentTarCC = data.Table1[0].DUE_AGENT_TAR_CC;
                this.DueAgentNet = data.Table1[0].DUE_AGENT_NET;
                this.DueAgentNetCC = data.Table1[0].DUE_AGENT_NET_CC;

                this.TotalTar = data.Table1[0].TOTAL_TAR;
                this.TotalTarCC = data.Table1[0].TOTAL_TAR_CC;
                this.TotalNet = data.Table1[0].TOTAL_NET;
                this.TotalNetCC = data.Table1[0].TOTAL_NET_CC;

                this.OtherTar = data.Table1[0].OTHER_CHRG_TAR;
                this.OtherTarFrt = (data.Table1[0].OTHER_RATE_TAR_FRT != '') ? data.Table1[0].OTHER_RATE_TAR_FRT : 'PP';
                this.OtherNet = data.Table1[0].OTHER_CHRG_NET;
                this.OtherNetFrt = (data.Table1[0].OTHER_RATE_NET_FRT != '') ? data.Table1[0].OTHER_RATE_NET_FRT : 'PP';

                this.AirFrtCommission = data.Table1[0].AIR_FRT_COMM_NET;

                this.FrtRebate = data.Table1[0].FRT_REBATE_NET;

                this.BusinesPromo = data.Table1[0].BUSINES_PROMO_NET;

                this.DrpTDS = data.Table1[0].TDS_ACCTCODE;
                this.TxtTDS = data.Table1[0].TDS_NET;

                this.DrpServiceTax = data.Table1[0].SERVICETAX_ACCTCODE;
                this.TxtServiceTax = data.Table1[0].SERVICE_TAX_NET;

                this.OtherChrg1 = data.Table1[0].OTHER_NAME1;
                this.OtherAmt1_Tar = data.Table1[0].OTHER_RATE1_TAR;
                this.CalOneDcTar = (data.Table1[0].OTHER_RATE1_TAR_CAL == 'DA') ? 2 : 1;
                this.OtherAmt1TarFrt = (data.Table1[0].OTHER_RATE1_TAR_FRT != '') ? data.Table1[0].OTHER_RATE1_TAR_FRT : 'PP';
                this.OtherAmt1_Net = data.Table1[0].OTHER_RATE1_NET;
                this.CalOneDcNet = (data.Table1[0].OTHER_RATE1_NET_CAL == 'DA') ? 2 : 1;
                this.OtherAmt1NetFrt = (data.Table1[0].OTHER_RATE1_NET_FRT != '') ? data.Table1[0].OTHER_RATE1_NET_FRT : 'PP';

                this.OtherChrg2 = data.Table1[0].OTHER_NAME2;
                this.OtherAmt2_Tar = data.Table1[0].OTHER_RATE2_TAR;
                this.CalTwoDcTar = (data.Table1[0].OTHER_RATE2_TAR_CAL == 'DA') ? 2 : 1;
                this.OtherAmt2TarFrt = (data.Table1[0].OTHER_RATE2_TAR_FRT != '') ? data.Table1[0].OTHER_RATE2_TAR_FRT : 'PP';
                this.OtherAmt2_Net = data.Table1[0].OTHER_RATE2_NET;
                this.CalTwoDcNet = (data.Table1[0].OTHER_RATE2_NET_CAL == 'DA') ? 2 : 1;
                this.OtherAmt2NetFrt = (data.Table1[0].OTHER_RATE2_NET_FRT != '') ? data.Table1[0].OTHER_RATE2_NET_FRT : 'PP';

                this.Remark = data.Table1[0].REMARK;
                this.Ppchrg = data.Table1[0].PPCHRG;
                this.Ccchrg = data.Table1[0].CCCHRG;
                this.Pptotagt = data.Table1[0].PPTOTAGT;
                this.Cctotagt = data.Table1[0].CCTOTAGT;
                this.Pptotcarr = data.Table1[0].PPTOTCARR;
                this.Cctotcarr = data.Table1[0].CCTOTCARR;
                this.Pptot = data.Table1[0].PPTOT;
                this.Cctot = data.Table1[0].CCTOT;
                this.Othchrg = data.Table1[0].OTHCHRG;
                this.ISAUTO_FRT_INV=data.Table1[0].FRTINV_FLG;

                this.TarTruckPayOn = (data.Table1[0].DEST_TRUCKING_PAYABLE_ON_TAR != '') ? data.Table1[0].DEST_TRUCKING_PAYABLE_ON_TAR : null;
                this.TarTruckRate = data.Table1[0].DEST_TRUCKING_RATE_PER_KG_TAR;
                this.TarTruck = data.Table1[0].DEST_TRUCKING_RATE_TAR;
                this.NetTruckPayOn = (data.Table1[0].DEST_TRUCKING_PAYABLE_ON_NET != '') ? data.Table1[0].DEST_TRUCKING_PAYABLE_ON_NET : null;
                this.NetTruckRate = data.Table1[0].DEST_TRUCKING_RATE_PER_KG_NET;
                this.NetTruck = data.Table1[0].DEST_TRUCKING_RATE_NET;
              ///ADDED BY NALINI FOR AIRLINECHARGES
              this.Chargeslist=data.Table2
              this.tot_rate_tar_pp_da=data.Table3[0].RATE_TAR_TOTAL_PP_DA;
              this.tot_rate_net_pp_da=data.Table3[0].RATE_NET_TOTAL_PP_DA;
              this.tot_rate_tar_cc_da=data.Table4[0].RATE_TAR_TOTAL_CC_DA;
              this.tot_rate_net_cc_da=data.Table4[0].RATE_NET_TOTAL_CC_DA;
              this.tot_rate_tar_pp_dc=data.Table5[0].RATE_TAR_TOTAL_PP_DC;
              this.tot_rate_net_pp_dc=data.Table5[0].RATE_NET_TOTAL_PP_DC;
              this.tot_rate_tar_cc_dc=data.Table6[0].RATE_TAR_TOTAL_CC_DC;
              this.tot_rate_net_cc_dc=data.Table6[0].RATE_NET_TOTAL_CC_DC;

                this.fn_PageLoad();
                if(this.ISAUTO_FRT_INV=="1")
                {
                    alert("MAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This MAWB !!");
                    this._toasterService.toast('Warning', 'Warning', "MAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This MAWB !!");
                }
                this._loaderService.display(false);
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                 this._loaderService.display(false);},
                () => { });
    }

    changePayOnTariff(tarType: string) {
        if (tarType == 'Fsc') {
            this.TarFscRate = 0;
            this.TarFsc = 0;
        } else if (tarType == 'Irc') {
            this.TarIrcRate = 0;
            this.TarIrc = 0;
        } else if (tarType == 'Xray') {
            this.TarXrayRate = 0;
            this.TarXray = 0;
        } else if (tarType == 'BP') {
            this.TarBPRate = 0;
            this.TarBP = 0;
        }
        else if (tarType == 'Misc') {
            this.TarMcRate = 0;
            this.TarMc = 0;
        }
        else if (tarType == 'CTG') {
            this.TarCtgRate = 0;
            this.TarCtg = 0;
        }
        else if (tarType == 'THC') {
            this.TarThcRate = 0;
            this.TarThc = 0;
        }
        this.fnCalculate_Tar();
    }

    changePayOnNet(tarType: string) {
        if (tarType == 'Fsc') {
            this.NetFscRate = 0;
            this.NetFsc = 0;
        } else if (tarType == 'Irc') {
            this.NetIrcRate = 0;
            this.NetIrc = 0;
        } else if (tarType == 'Xray') {
            this.NetXrayRate = 0;
            this.NetXray = 0;
        }  else if (tarType == 'Misc') {
            this.NetMcRate = 0;
            this.NetMc = 0;
        }else if (tarType == 'CTG') {
            this.NetCtgRate = 0;
            this.NetCtg = 0;
        }
        else if (tarType == 'THC') {
            this.NetThcRate = 0;
            this.NetThc = 0;
        }else if (tarType == 'BP') {
            this.NetBPRate = 0;
            this.NetBP = 0;
        }
        this.fnCalculate_Net();
    }

    selectionChange(value: any) {
        this.TarFreightRate=this.NetFreightRate = value.target.value;
      }
      TariffRateChange(value: any) {
        this.NetFscRate = value.target.value;
     }
     TarFscPayOnChange(value: any) {
        this.NetFscPayOn = value.target.value;
     }
     TarIrcChange(value: any) {
        this.NetIrcRate = value.target.value;
     }
     TarIrcPayOnChange(value: any) {
        this.NetIrcPayOn = value.target.value;
     }
     XrayChange(value: any) {
        this.NetXrayRate = value.target.value;
       
     }
     XraypayChange(value: any) {
       this.NetXrayPayOn = value.target.value;
    }
    TarMcPayOnChange(value: any) {
        this.NetMcPayOn = value.target.value;
     }
     TarMcRateChange(value: any) {
        this.NetMcRate = value.target.value;
     }
     TarCtgPayOnChange(value: any) {
        this.NetCtgPayOn = value.target.value;
     }
     TarCtgRateChange(value: any) {
        this.NetCtgRate = value.target.value;
     }
     TarThcPayOnChange(value: any) {
        this.NetThcPayOn = value.target.value;
     }
     TarThcRateChange(value: any) {
        this.NetThcRate = value.target.value;
     }
     TarBPPayOnChange(value: any) {
        this.NetBPPayOn = value.target.value;
     }
     TarBPRateChange(value: any) {
        this.NetBPRate = value.target.value;
     }
     TarAmsChange(value: any) {
        this.NetAms = value.target.value;
     }
     TarAmsFrtChange(value: any) {
        this.NetAmsFrt = value.target.value;
     }
     TarTruckPayOnChange(value: any) {
        this.NetTruckPayOn = value.target.value;
     }
     TarTruckRateChange(value: any) {
        this.NetTruckRate = value.target.value;
     }
    changeTariffRates(tarType: string) {
        if (tarType == 'Freight') {
            if (Math.abs(this.TarFreightRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarFreightPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarFreight = 0; }
            this.onChangeTariffRates('Freight');
        } else if (tarType == 'Fsc') {
            if (Math.abs(this.TarFscRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarFscPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarFsc = 0; }
            this.onChangeTariffRates('Fsc');
        } else if (tarType == 'Irc') {
            if (Math.abs(this.TarIrcRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarIrcPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarIrc = 0; }
            this.onChangeTariffRates('Irc');
        } else if (tarType == 'Xray') {
            if (Math.abs(this.TarXrayRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarXrayPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarXray = 0; }
            this.onChangeTariffRates('Xray');
        }
        else if (tarType == 'Misc') {
            if (Math.abs(this.TarMcRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarMcPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarMc = 0; }
            this.onChangeTariffRates('Misc');
        }
        else if (tarType == 'CTG') {
            if (Math.abs(this.TarCtgRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarCtgPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarCtg = 0; }
            this.onChangeTariffRates('CTG');
        }  else if (tarType == 'THC') {
            if (Math.abs(this.TarThcRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarThcPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarThc = 0; }
            this.onChangeTariffRates('THC');
        }
        else if (tarType == 'BP') {
            if (Math.abs(this.TarBPRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarBPPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarBP = 0; }

            this.onChangeTariffRates('BP');
        }
        else if (tarType == 'DT') {
            if (Math.abs(this.TarTruckRate) != 0) {
                if (this.validateWeight() == false) { this.clearTariff(); return false; }
                if (this.TarTruckPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarTruck = 0; }
            this.onChangeTariffRates('DT');
        }
        this.fnCalculate_Tar();
    }

    changeNetRates(tarType: string) {
        if (tarType == 'Freight') {
            if (Math.abs(this.NetFreightRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetFreightPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetFreight = 0; }
            this.onChangeNetRates('Freight');
        } else if (tarType == 'Fsc') {
            if (Math.abs(this.NetFscRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetFscPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetFsc = 0; }
            this.onChangeNetRates('Fsc');
        } else if (tarType == 'Irc') {
            if (Math.abs(this.NetIrcRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetIrcPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetIrc = 0; }
            this.onChangeNetRates('Irc');
        } else if (tarType == 'Xray') {
            if (Math.abs(this.NetXrayRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetXrayPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetXray = 0; }
            this.onChangeNetRates('Xray');
        }
        else if (tarType == 'Misc') {
            if (Math.abs(this.NetMcRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetMcPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetMc = 0; }
            this.onChangeNetRates('Misc');
        }else if (tarType == 'CTG') {
            if (Math.abs(this.NetCtgRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetCtgPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetCtg = 0; }
            this.onChangeNetRates('CTG');
        }else if (tarType == 'THC') {
            if (Math.abs(this.TarThcRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.TarThcPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.TarThc = 0; }
            this.onChangeNetRates('THC');
        }else if (tarType == 'BP') {
            if (Math.abs(this.NetBPRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetBPPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetBP = 0; }
            this.onChangeNetRates('BP');
        }
        else if (tarType == 'DT') {
            if (Math.abs(this.NetTruckRate) != 0) {
                if (this.validateWeight() == false) { this.clearNet(); return false; }
                if (this.NetTruckPayOn == null) { alert('Please select Payable On.'); return false; }
            } else { this.NetTruck = 0; }
            this.onChangeNetRates('DT');
        }
        this.fnCalculate_Net();
    }

    validateWeight() {
        let CHBLWT = Math.abs(this.UserWgt);
        let GRWT = Math.abs(this.UserGrossWeight);
        if (CHBLWT == 0) {
            alert("Please enter Chageable Weight.");
            return false;
        }
        if (GRWT == 0) {
            alert("Please enter Gross Weight.");
            return false;
        }
        if (CHBLWT < GRWT) {
            alert("Chargable Wgt should be greaterthen or equal to Gross Weight.")
            return false;
        }
    }

    clearTariff() {
        this.TarFreightRate = "";
        this.TarFreight = "";
        this.TarFscPayOn = "0";
        this.TarFscRate = "";
        this.TarFsc = "";
        this.TarIrcPayOn = "0";
        this.TarIrcRate = "";
        this.TarIrc = "";
        this.TarXrayPayOn = "0";
        this.TarXrayRate = "";
        this.TarXray = "";
        this.TarMcRate = 1;
        let GRWT = Math.abs(this.UserGrossWeight);
        GRWT = Math.round(Math.abs(GRWT));
        GRWT = Math.abs(Number(GRWT.toFixed(2)));
        this.TarMc = GRWT;
        this.fn_MC_CTG_Tar();
        this.fn_THC_Tar();
    }

    clearNet() {
        this.NetFreightRate = null;
        this.NetFreight = null;
        this.NetFscPayOn = 0;
        this.NetFscRate = null;
        this.NetFsc = null;
        this.NetIrcPayOn = 0;
        this.NetIrcRate = null;
        this.NetIrc = null;
        this.NetXrayPayOn = 0;
        this.NetXrayRate = null;
        this.NetXray = null;
        this.NetMcRate = 1;
        this.NetMc = Math.abs(this.UserGrossWeight);
        this.fn_MC_CTG_Net();
        this.fn_THC_Net();
    }

    fn_MC_CTG_Tar() {
        let VALUE = 0;
        VALUE = Math.abs(this.UserWgt);
        VALUE = Math.round(Math.abs(VALUE))
        VALUE = (Math.abs(Number(VALUE.toFixed(2))));
        let Mawbno=this._sharedconsig.exportEditData.MAWBNO;
        let prestrg=Mawbno.substring(0,3);
        if (prestrg!="232" && this.CityCode != 'AMD' )
        {
            this.TarMcRate = 1;
            this.TarMc = VALUE;
        }
        if (prestrg!="232" && this.CityCode == 'AMD' )
        {
            this.TarMcRate = 1;
            this.TarMc = VALUE;
        }
        if (this.CityCode == 'MUM') {
            this.TarCtgRate = 1;
            VALUE = Math.abs(this.UserGrossWeight);
            VALUE = Math.round(Math.abs(VALUE));
            VALUE = (Math.abs(Number(VALUE.toFixed(2))));
            this.TarCtg = VALUE;
        }
        else {
            this.TarCtgRate = 0;
            this.TarCtg = 0;
        }
    }
    fn_THC_Tar() {
        let VALUE = 0;
        VALUE = Math.abs(this.UserWgt);
        VALUE = Math.round(Math.abs(VALUE));
        VALUE = (Math.abs(Number(VALUE.toFixed(2))));

        //THC CALCULATED ON CW * 0.08 AS PER ARJUN MAIL Tue 3/10/2015 1:41 PM

        this.TarThcRate = 0.08;
        this.TarThc = VALUE;

        if (this.CityCode == 'DAC') {
            this.TarThcRate = 0.08;
            VALUE = Math.abs(VALUE);
            let TOT = ((this.TarThcRate) * Math.abs(VALUE)).toFixed(2);
            this.TarThc = Math.abs(Number(TOT));
        }
        else {
            this.TarThcRate = 0;
            this.TarThc = 0;
        }
    }
    fn_MC_CTG_Net() {
        let VALUE = 0;
        if (this.hdNetRights == true) {
            VALUE = Math.abs(this.UserWgt);
            VALUE = Math.round(Math.abs(VALUE));
            VALUE = (Math.abs(Number(VALUE.toFixed(2))));
            let Mawbno=this._sharedconsig.exportEditData.MAWBNO;
            let prestrg=Mawbno.substring(0,3);
            if (prestrg !="232"   && this.CityCode != 'AMD')
            {   this.NetMcRate = 1;
                this.NetMc = VALUE;
            }
            if (prestrg !="232"   && this.CityCode == 'AMD')
            {   this.NetMcRate = 1;
                this.NetMc = VALUE;
            }
            if (this.CityCode == 'MUM') {
                this.NetCtgRate = 1;
                VALUE = Math.abs(this.UserGrossWeight);
                VALUE = Math.round(Math.abs(VALUE));
                VALUE = Math.abs(Number(VALUE.toFixed(2)));
                this.NetCtg = VALUE;
            }
            else {
                this.NetCtgRate = 0;
                this.NetCtg = 0;
            }
        }
    }
    fn_THC_Net() {
        let VALUE = 0;
        if (this.hdNetRights == true) {
            VALUE = Math.abs(this.UserWgt);
            VALUE = Math.round(Math.abs(VALUE));
            VALUE = (Math.abs(VALUE));
            //THC CALCULATED ON CW * 0.08 AS PER ARJUN MAIL Tue 3/10/2015 1:41 PM
            this.NetThcRate = 0.08;
            this.NetThc = VALUE;
            if (this.CityCode == "DAC") {
                this.NetThcRate = 0.08;
                VALUE = Math.abs(VALUE); // Math.abs(this.UserGrossWeight);
                let TOT = ((this.NetThcRate) * Math.abs(VALUE));
                this.NetThc = Math.abs(TOT).toFixed(2);
            }
            else {
                this.NetThcRate = 0;
                this.NetThc = 0;
            }
        }
    }

    onChangeTariffRates(tarType: string) {
        let MUL_VALUE = 0;
        let TOT = 0;
        if (tarType == 'Freight') {
            if (this.TarFreightPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarFreightPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarFreightRate) * Math.abs(MUL_VALUE));
            this.TarFreight = Math.round(TOT).toFixed(2);
        } else if (tarType == 'Fsc') {
            if (this.TarFscPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarFscPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarFscRate) * Math.abs(MUL_VALUE));
            this.TarFsc = Math.round(TOT).toFixed(2);
        } else if (tarType == 'Irc') {
            if (this.TarIrcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarIrcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarIrcRate) * Math.abs(MUL_VALUE));
            this.TarIrc = Math.round(TOT).toFixed(2);
        } else if (tarType == 'Xray') {
            if (this.TarXrayPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarXrayPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarXrayRate) * Math.abs(MUL_VALUE));
            this.TarXray = Math.round(TOT).toFixed(2);
        }
        else if (tarType == 'Misc') {
            if (this.TarMcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarMcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarMcRate) * Math.abs(MUL_VALUE));
            this.TarMc = Math.round(TOT).toFixed(2);
        }else if (tarType == 'CTG') {
            if (this.TarCtgPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarCtgPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarCtgRate) * Math.abs(MUL_VALUE));
            this.TarCtg = Math.round(TOT).toFixed(2);
        }else if (tarType == 'THC') {
            if (this.TarThcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarThcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarThcRate) * Math.abs(MUL_VALUE));
            this.TarThc = Math.round(TOT).toFixed(2);
        }else if (tarType == 'BP') {
            if (this.TarBPPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.TarBPPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.TarBPRate) * Math.abs(MUL_VALUE));
            this.TarBP = Math.round(TOT).toFixed(2);
        }
    }

    onChangeNetRates(tarType: string) {
        let MUL_VALUE = 0;
        let TOT = 0;
        if (tarType == 'Freight') {
            if (this.NetFreightPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetFreightPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetFreightRate) * Math.abs(MUL_VALUE));
            this.NetFreight = Math.round(TOT).toFixed(2);
        } else if (tarType == 'Fsc') {
            if (this.NetFscPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetFscPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetFscRate) * Math.abs(MUL_VALUE));
            this.NetFsc = Math.round(TOT).toFixed(2);
        } else if (tarType == 'Irc') {
            if (this.NetIrcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetIrcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetIrcRate) * Math.abs(MUL_VALUE));
            this.NetIrc = Math.round(TOT).toFixed(2);
        } else if (tarType == 'Xray') {
            if (this.NetXrayPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetXrayPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetXrayRate) * Math.abs(MUL_VALUE));
            this.NetXray = Math.round(TOT).toFixed(2);
        }
        else if (tarType == 'Misc') {
            if (this.NetMcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetMcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetMcRate) * Math.abs(MUL_VALUE));
            this.NetMc = Math.round(TOT).toFixed(2);
        }
        else if (tarType == 'CTG') {
            if (this.NetCtgPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetCtgPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetCtgRate) * Math.abs(MUL_VALUE));
            this.NetCtg = Math.round(TOT).toFixed(2);
        }    else if (tarType == 'THC') {
            if (this.NetThcPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetThcPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetThcRate) * Math.abs(MUL_VALUE));
            this.NetThc = Math.round(TOT).toFixed(2);
        }
        else if (tarType == 'BP') {
            if (this.NetBPPayOn == "CW") { MUL_VALUE = Math.abs(this.UserWgt); }
            else if (this.NetBPPayOn == "GW") { MUL_VALUE = Math.abs(this.UserGrossWeight); }
            TOT = (Math.abs(this.NetBPRate) * Math.abs(MUL_VALUE));
            this.NetBP = Math.round(TOT).toFixed(2);
        }
    }

     fnCalculate_Tar() {
        let FSC = 0, IRC = 0, XRAY = 0, MC = 0, CTG = 0, OC1_DC = 0, OC2_DC = 0, OC1_DA = 0, OC2_DA = 0, DUE_CARRIER = 0,
            HAWB = 0, PCA = 0, DUE_AGENT = 0, TOTAL = 0, FREIGHT = 0, AMS = 0, THC = 0, BUSINESPROMO = 0, BP = 0,
            FSC_CC = 0, IRC_CC = 0, XRAY_CC = 0, MC_CC = 0, CTG_CC = 0, OC1_DC_CC = 0, OC2_DC_CC = 0, OC1_DA_CC = 0,
            OC2_DA_CC = 0, DUE_CARRIER_CC = 0, HAWB_CC = 0, PCA_CC = 0, DUE_AGENT_CC = 0, TOTAL_CC = 0, FREIGHT_CC = 0,
            AMS_CC = 0, THC_CC = 0, BP_CC = 0,Truck_CC = 0,Truck=0;

        if (this.TarFscFrt == "PP") { FSC = (Math.abs(this.TarFsc)); }
        else { FSC_CC = (Math.abs(this.TarFsc)); }

        if (this.TarIrcFrt == "PP") { IRC = (Math.abs(this.TarIrc)); }
        else { IRC_CC = (Math.abs(this.TarIrc)); }

        if (this.TarXrayFrt == "PP") { XRAY = (Math.abs(this.TarXray)); }
        else { XRAY_CC = (Math.abs(this.TarXray)); }

        if (this.TarMcFrt == "PP") { MC = (Math.abs(this.TarMc)); }
        else { MC_CC = (Math.abs(this.TarMc)); }

        if (this.TarAmsFrt == "PP") { AMS = (Math.abs(this.TarAms)); }
        else { AMS_CC = (Math.abs(this.TarAms)); }

        if (this.CityCode == "MUM") {
            if (this.TarCtgFrt == "PP") { CTG = Math.abs(this.TarCtg); }
            else { CTG_CC = Math.abs(this.TarCtg); }
        }
        else {
            CTG = 0;
            CTG_CC = 0;
        }

       /* if (this.CityCode == "DAC") {
            if (this.TarThcFrt == "PP")
                THC = Math.abs(this.TarThc);
            else
                THC_CC = Math.abs(this.TarThc);
        }
        else {
            THC = 0;
            THC_CC = 0;
        }*/
        if (this.TarThcFrt == "PP") { THC = (Math.abs(this.TarThc)); }
        else { THC_CC = (Math.abs(this.TarThc)); }

        if (this.CityCode == "DAC") {
            BP = 0;
            BP_CC = 0;
        }
        else {
            if (this.TarBPFrt == "PP") { BP = Math.abs(this.TarBP); }
            else { BP_CC = Math.abs(this.TarBP); }
        }

        if (this.OtherAmt1TarFrt == "PP") {
            if (this.CalOneDcTar == 1) { OC1_DC = Math.abs(this.OtherAmt1_Tar); }
            else { OC1_DA = Math.abs(this.OtherAmt1_Tar); }
        }
        else {
            if (this.CalOneDcTar == 1) { OC1_DC_CC = Math.abs(this.OtherAmt1_Tar); }
            else { OC1_DA_CC = Math.abs(this.OtherAmt1_Tar); }
        }

        if (this.OtherAmt2TarFrt == "PP") {
            if (this.CalTwoDcTar == 1) { OC2_DC = Math.abs(this.OtherAmt2_Tar); }
            else { OC2_DA = Math.abs(this.OtherAmt2_Tar); }
        }
        else {
            if (this.CalTwoDcTar == 1) { OC2_DC_CC = Math.abs(this.OtherAmt2_Tar); }
            else { OC2_DA_CC = Math.abs(this.OtherAmt2_Tar); }
        }

        if (this.HawbTarFrt == "PP") { HAWB = Math.abs(this.HawbTar); }
        else { HAWB_CC = Math.abs(this.HawbTar); }

        if (this.PcaTarFrt == "PP") { PCA = Math.abs(this.PcaTar); }
        else { PCA_CC = Math.abs(this.PcaTar); }

        if (this.TarFreightFrt == "PP") { FREIGHT = Math.abs(this.TarFreight); }
        else { FREIGHT_CC = Math.abs(this.TarFreight); }

        if (this.TarTruckFrt == "PP") { Truck = Math.abs(this.TarTruck); }
        else { Truck_CC = Math.abs(this.TarTruck); }


        ///ADDED BY NALINI FOR ALCHARGES ON 21/04/2022
        let totrate_tar_pp_dc=Math.abs(this.tot_rate_tar_pp_dc)
        let tot_rate_tar_cc_dc=Math.abs(this.tot_rate_tar_cc_dc)

        let DUE_CARRIER1 = Math.abs(FSC) + Math.abs(IRC) + Math.abs(XRAY) + Math.abs(MC) + Math.abs(CTG) + Math.abs(AMS) + Math.abs(OC1_DC) + Math.abs(OC2_DC) + Math.abs(THC) + Math.abs(BP)+Math.abs(totrate_tar_pp_dc);
        DUE_CARRIER = Math.round(Math.abs(DUE_CARRIER1));
        DUE_CARRIER = DUE_CARRIER;
        let DUE_CARRIER1_CC = Math.abs(FSC_CC) + Math.abs(IRC_CC) + Math.abs(XRAY_CC) + Math.abs(MC_CC) + Math.abs(CTG_CC) + Math.abs(AMS_CC) + Math.abs(OC1_DC_CC) + Math.abs(OC2_DC_CC) + Math.abs(THC_CC) + Math.abs(BP_CC)+Math.abs(tot_rate_tar_cc_dc);
        DUE_CARRIER_CC = Math.round(Math.abs(DUE_CARRIER1_CC));
        DUE_CARRIER_CC = DUE_CARRIER_CC;

         ///ADDED BY NALINI FOR ALCHARGES ON 21/04/2022

        let totrate_tar_pp_da=Math.abs(this.tot_rate_tar_pp_da)
        let totrate_tar_cc_da=Math.abs(this.tot_rate_tar_cc_da)

        let DUE_AGENT1 = Math.abs(HAWB) + Math.abs(PCA) + Math.abs(OC1_DA) + Math.abs(OC2_DA)+ Math.abs(totrate_tar_pp_da);
        DUE_AGENT1 = Math.round(DUE_AGENT1);
        DUE_AGENT = DUE_AGENT1;
        let DUE_AGENT1_CC = Math.abs(HAWB_CC) + Math.abs(PCA_CC) + Math.abs(OC1_DA_CC) + Math.abs(OC2_DA_CC)+ Math.abs(totrate_tar_cc_da);
        DUE_AGENT1_CC = Math.round(DUE_AGENT1_CC);
        DUE_AGENT_CC = DUE_AGENT1_CC;

        let TOTAL1 = Math.abs(DUE_CARRIER) + Math.abs(DUE_AGENT) + Math.abs(FREIGHT)+ Math.abs(Truck)
        TOTAL1 = Math.round(TOTAL1);
        TOTAL = Math.abs(TOTAL1);
        let TOTAL1_CC = Math.abs(DUE_CARRIER_CC) + Math.abs(DUE_AGENT_CC) + Math.abs(FREIGHT_CC)+ Math.abs(Truck_CC)
        TOTAL1_CC = Math.round(TOTAL1_CC);
        TOTAL_CC = TOTAL1_CC;

        this.DurCarrierTar = DUE_CARRIER.toFixed(2);
        this.DueAgentTar = DUE_AGENT.toFixed(2);
        this.TotalTar = TOTAL.toFixed(2);
        this.DurCarrierTarCC = DUE_CARRIER_CC.toFixed(2);
        this.DueAgentTarCC = DUE_AGENT_CC.toFixed(2);
        this.TotalTarCC = TOTAL_CC.toFixed(2);
       // this.fn_CalculateAlCharges_Tar( this.dttable6);
    }

    fnCalculate_Net() {
        let FSC = 0, IRC = 0, XRAY = 0, MC = 0, CTG = 0, THC = 0, BP = 0, OC1_DC = 0, OC2_DC = 0, OC1_DA = 0, OC2_DA = 0,
            DUE_CARRIER = 0, HAWB = 0, PCA = 0, DUE_AGENT = 0, TOTAL = 0, FREIGHT = 0, AMS = 0, FSC_CC = 0, IRC_CC = 0,
            XRAY_CC = 0, MC_CC = 0, CTG_CC = 0, THC_CC = 0, BP_CC = 0, OC1_DC_CC = 0, OC2_DC_CC = 0, OC1_DA_CC = 0,
            OC2_DA_CC = 0, DUE_CARRIER_CC = 0, HAWB_CC = 0, PCA_CC = 0, DUE_AGENT_CC = 0, TOTAL_CC = 0, FREIGHT_CC = 0,
            AMS_CC = 0,Truck=0,Truck_CC=0 ;

        if (this.NetFscFrt == "PP") { FSC = Math.abs(this.NetFsc); }
        else { FSC_CC = Math.abs(this.NetFsc); }

        if (this.NetIrcFrt == "PP") { IRC = Math.abs(this.NetIrc); }
        else { IRC_CC = Math.abs(this.NetIrc); }

        if (this.NetXrayFrt == "PP") { XRAY = Math.abs(this.NetXray); }
        else { XRAY_CC = Math.abs(this.NetXray); }

        if (this.NetMcFrt == "PP") { MC = Math.abs(this.NetMc); }
        else { MC_CC = Math.abs(this.NetMc); }

        if (this.NetAmsFrt == "PP") { AMS = Math.abs(this.NetAms); }
        else { AMS_CC = Math.abs(this.NetAms); }

        if (this.CityCode == "MUM") {
            if (this.NetCtgFrt == "PP") { CTG = Math.abs(this.NetCtg); }
            else { CTG_CC = Math.abs(this.NetCtg); }
        }
        else {
            CTG = 0;
            CTG_CC = 0;
        }

        /*if (this.CityCode == "DAC") {
            if (this.NetThcFrt == "PP") { THC = Math.abs(this.NetThc); }
            else { THC_CC = Math.abs(this.NetThc); }
        }
        else {
            THC = 0;
            THC_CC = 0;
        }*/
        if (this.NetThcFrt == "PP") { THC = Math.abs(this.NetThc); }
        else { THC_CC = Math.abs(this.NetThc); }


        if (this.CityCode == "DAC") {
            BP = 0;
            BP_CC = 0;
        }
        else {
            if (this.NetBPFrt == "PP") { BP = Math.abs(this.NetBP); }
            else { BP_CC = Math.abs(this.NetBP); }
        }

        if (this.OtherAmt1NetFrt == "PP") {
            if (this.CalOneDcNet == 1) { OC1_DC = Math.abs(this.OtherAmt1_Net); }
            else { OC1_DA = Math.abs(this.OtherAmt1_Net); }
        }
        else {
            if (this.CalOneDcNet == 1) { OC1_DC_CC = Math.abs(this.OtherAmt1_Net); }
            else { OC1_DA_CC = Math.abs(this.OtherAmt1_Net); }
        }

        if (this.OtherAmt2NetFrt == "PP") {
            if (this.CalTwoDcTar == 1) { OC2_DC = Math.abs(this.OtherAmt2_Net); }
            else { OC2_DA = Math.abs(this.OtherAmt2_Net); }
        }
        else {
            if (this.CalTwoDcTar == 1) { OC2_DC_CC = Math.abs(this.OtherAmt2_Net); }
            else { OC2_DA_CC = Math.abs(this.OtherAmt2_Net); }
        }

        if (this.HawbNetFrt == "PP") { HAWB = Math.abs(this.HawbNet); }
        else { HAWB_CC = Math.abs(this.HawbNet); }

        if (this.PcaNetFrt == "PP") { PCA = Math.abs(this.PcaNet); }
        else { PCA_CC = Math.abs(this.PcaNet); }

        if (this.NetFreightFrt == "PP") { FREIGHT = Math.abs(this.NetFreight); }
        else { FREIGHT_CC = Math.abs(this.NetFreight); }

        if (this.NetTruckFrt == "PP") { Truck = Math.abs(this.NetTruck); }
        else { Truck_CC = Math.abs(this.NetTruck); }

         //ADDED BY NALINI ON 21/04/2022 FOR ALCHARGES DUE CARRIER
         let totrate_net_pp_dc=Math.abs(this.tot_rate_net_pp_dc)
         let tot_rate_net_cc_dc=Math.abs(this.tot_rate_net_cc_dc)

        let DUE_CARRIER1 = Math.abs(FSC) + Math.abs(IRC) + Math.abs(XRAY) + Math.abs(MC) + Math.abs(CTG) + Math.abs(AMS) + Math.abs(OC1_DC) + Math.abs(OC2_DC) + Math.abs(THC) + Math.abs(BP)+Math.abs(totrate_net_pp_dc);
        DUE_CARRIER1 = Math.round(Math.abs(DUE_CARRIER1));
        DUE_CARRIER = Math.abs(DUE_CARRIER1);
        let DUE_CARRIER1_CC = Math.abs(FSC_CC) + Math.abs(IRC_CC) + Math.abs(XRAY_CC) + Math.abs(MC_CC) + Math.abs(CTG_CC) + Math.abs(AMS_CC) + Math.abs(OC1_DC_CC) + Math.abs(OC2_DC_CC) + Math.abs(THC_CC) + Math.abs(BP_CC) +Math.abs(tot_rate_net_cc_dc);
        DUE_CARRIER1_CC = Math.round(Math.abs(DUE_CARRIER1_CC));
        DUE_CARRIER_CC = Math.abs(DUE_CARRIER1_CC);

            //ADDED BY NALINI ON 21/04/2022 FOR ALCHARGES DUE AGENT
            let totrate_net_pp_da=Math.abs(this.tot_rate_net_pp_da)
            let totrate_net_cc_da=Math.abs(this.tot_rate_net_cc_da)

        let DUE_AGENT1 = Math.abs(HAWB) + Math.abs(PCA) + Math.abs(OC1_DA) + Math.abs(OC2_DA) + Math.abs(totrate_net_pp_da);
        DUE_AGENT1 = Math.round(Math.abs(DUE_AGENT1));
        DUE_AGENT = Math.abs(DUE_AGENT1);
        let DUE_AGENT1_CC = Math.abs(HAWB_CC) + Math.abs(PCA_CC) + Math.abs(OC1_DA_CC) + Math.abs(OC2_DA_CC)  + Math.round(totrate_net_cc_da);
        DUE_AGENT1_CC = Math.round(Math.abs(DUE_AGENT1_CC));
        DUE_AGENT_CC = Math.abs(DUE_AGENT1_CC);

        let TOTAL1 = Math.abs(DUE_CARRIER) + Math.abs(DUE_AGENT) + Math.abs(FREIGHT)+ Math.abs(Truck)
        TOTAL1 = Math.round(Math.abs(TOTAL1));
        TOTAL = Math.abs(TOTAL1);
        let TOTAL1_CC = Math.abs(DUE_CARRIER_CC) + Math.abs(DUE_AGENT_CC) + Math.abs(FREIGHT_CC)+ Math.abs(Truck_CC)
        TOTAL1_CC = Math.round(Math.abs(TOTAL1_CC));
        TOTAL_CC = Math.abs(TOTAL1_CC);

        this.DurCarrierNet = DUE_CARRIER.toFixed(2);
        this.DueAgentNet = DUE_AGENT.toFixed(2);
        this.TotalNet = TOTAL.toFixed(2);
        this.DurCarrierNetCC = DUE_CARRIER_CC.toFixed(2);
        this.DueAgentNetCC = DUE_AGENT_CC.toFixed(2);
        this.TotalNetCC = TOTAL_CC.toFixed(2);
    }

    changeUserWeight() {
        if (this.oldchblwt!= this.UserWgt)
        {
            var answer = confirm("Are you sure you want to change Charable Weight from "+this.oldchblwt+" to "+this.UserWgt+"?")
            if (answer == false) { return false; }
            else
            {
                this.oldchblwt=this.UserWgt;
                this.fn_PageLoad();
                this.changeTariffRates('Freight');
                this.changeNetRates('Freight');
                this.changeTariffRates('Fsc');
                this.changeNetRates('Fsc');
                this.changeTariffRates('Irc');
                this.changeNetRates('Irc');
                this.changeTariffRates('Xray');
                this.changeNetRates('Xray');
                this.changeTariffRates('Misc');
                this.changeNetRates('Misc');
                this.changeTariffRates('CTG');
                this.changeNetRates('CTG');
                this.changeTariffRates('THC');
                this.changeNetRates('THC');
                this.fnCalculate_Tar();
                this.fnCalculate_Net();

            }
        }
        if (this.oldgrwt!= this.UserGrossWeight)
        {
            var answer = confirm("Are you sure you want to change Gross Weight from "+this.oldgrwt+" to "+this.UserGrossWeight+"?")
        if (answer == false) { return false; }
        }
        else
        {
            this.oldgrwt=this.UserGrossWeight;
            this.fn_PageLoad();
            this.fnCalculate_Tar();
            this.fnCalculate_Net();
        }
     }

    onChangeAms(rateType: string) {
        if (rateType == 'TAR') {
            this.fnCalculate_Tar();
        }
        else if (rateType == 'NET') {
            this.fnCalculate_Net();
        }
    }

    onChangeOtherChargeName(cnType: number) {
        if (cnType == 1) {
            if (this.OtherChrg1 == "") {
                this.OtherAmt1_Tar = "";
                this.fnCalculate_Tar();
                if (this.hdNetRights == true) {
                    this.OtherAmt1_Net = "";
                    this.fnCalculate_Net();
                }
            }
        }
        else if (cnType == 2) {
            if (this.OtherChrg2 == "") {
                this.OtherAmt2_Tar = "";
                this.fnCalculate_Tar();
                if (this.hdNetRights == true) {
                    this.OtherAmt2_Net = "";
                    this.fnCalculate_Net();
                }
            }
        }
    }

    onChangeOther_Tar(oType: number) {
        if (oType == 1) {
            if (Math.abs(this.OtherAmt1_Tar) > 0) {
                if (this.OtherChrg1 == "" || this.OtherChrg1 == null) {
                    alert("Please enter name of Charge1.");
                    this.OtherAmt1_Tar = null;
                    return false;
                }
            }
            this.fnCalculate_Tar();
        }
        else if (oType == 2) {
            if (Math.abs(this.OtherAmt2_Tar) > 0) {
                if (this.OtherChrg2 == "" || this.OtherChrg2 == null) {
                    alert("Please enter name of Charge2.");
                    this.OtherAmt2_Tar = null;
                    return false;
                }
            }
            this.fnCalculate_Tar();
        }
    }

    onChangeOther_Net(ChargeType) {
        if (ChargeType == '1') {
            if (Math.abs(this.OtherAmt1_Net) > 0) {
                if (this.OtherChrg1 == "" || this.OtherChrg1 == null) {
                    alert("Please enter name of Charge1.");
                    this.OtherAmt1_Net = null;
                    return false;
                }
            }
            this.fnCalculate_Net();
        }
        else if (ChargeType == '2') {
            if (Math.abs(this.OtherAmt2_Net) > 0) {
                if (this.OtherChrg2 == "" || this.OtherChrg2 == null) {
                    alert("Please enter name of Charge2.");
                    this.OtherAmt2_Net = null;
                    return false;
                }
            }
            this.fnCalculate_Net();
        }

    }

    fnChangeFreight_PP_CC_TAR() {
        let Value = this.TarFreightFrt;
        this.TarFscFrt = Value;
        this.TarIrcFrt = Value;
        this.TarXrayFrt = Value;
        this.fnCalculate_Tar();
    }

    fnChangeFreight_PP_CC_NET() {
        let Value = this.NetFreightFrt;
        this.NetFscFrt = Value;
        this.NetIrcFrt = Value;
        this.NetXrayFrt = Value;
        this.fnCalculate_Net();
    }

    fn_MAWB_IU() {

        if (this.validateWeight() == false) { return false; }

        let AGENTS_RATE = this.AgentsRate;

        if (parseFloat(AGENTS_RATE) > 20.00) {
            alert("Please Enter below 20 on Agent Charges! ");
            return false;
        }

        let MAWBNO = this._sharedconsig.exportEditData.MAWBNO;
        let CITYCODE = this.CityCode;
        let CHBL_WGT = this.Wgt;
        let GROSS_WGT = this.GrossWeight;
        let CHBL_WGT_USER = Math.abs(this.UserWgt);
        let GROSS_WGT_USER = Math.abs(this.UserGrossWeight);

        let FREIGHT = (this.FreightRate != null) ? this.FreightRate : "";

        let FRT_CHARGEABLE_AS_TAR = (this.TariffRate == 1) ? "AI" : "FS";

        let FRT_PAYABLE_ON_TAR = (this.TarFreightPayOn != null) ? this.TarFreightPayOn : "";
        let FRT_RATE_PER_KG_TAR = Math.abs(this.TarFreightRate);
        let FRT_RATE_TAR = Math.abs(this.TarFreight);

        let FSC_PAYABLE_ON_TAR = (this.TarFscPayOn != null) ? this.TarFscPayOn : "";
        let FSC_RATE_PER_KG_TAR = Math.abs(this.TarFscRate);
        let FSC_RATE_TAR = Math.abs(this.TarFsc);

        let IRC_PAYABLE_ON_TAR = (this.TarIrcPayOn != null) ? this.TarIrcPayOn : "";
        let IRC_RATE_PER_KG_TAR = Math.abs(this.TarIrcRate);
        let IRC_RATE_TAR = Math.abs(this.TarIrc);

        let XRAY_PAYABLE_ON_TAR = (this.TarXrayPayOn != null) ? this.TarXrayPayOn : "";
        let XRAY_RATE_PER_KG_TAR = Math.abs(this.TarXrayRate);
        let XRAY_RATE_TAR = Math.abs(this.TarXray);


        if (FRT_CHARGEABLE_AS_TAR == 'FS') {
            // if (FSC_RATE_TAR == 0) {
            //     alert("Please enter any one TARIFF RATE - FSC");
            //     return false;
            // }
            if (FSC_RATE_TAR == 0 && IRC_RATE_TAR == 0 && XRAY_RATE_TAR == 0) {
                alert("Please enter any one TARIFF RATE :[FSC] or [IRC] or [X-RAY]");
                return false;
            }

        }

        let MC_PAYABLE_ON_TAR = (this.TarMcPayOn != null) ? this.TarMcPayOn : "";
        let MC_RATE_PER_KG_TAR = Math.abs(this.TarMcRate);
        let MC_RATE_TAR = Math.abs(this.TarMc);

        let CTG_PAYABLE_ON_TAR = (this.TarCtgPayOn != null) ? this.TarCtgPayOn : "";
        let CTG_RATE_PER_KG_TAR = Math.abs(this.TarCtgRate);
        let CTG_RATE_TAR = Math.abs(this.TarCtg);

        let THC_PAYABLE_ON_TAR = (this.TarThcPayOn != null) ? this.TarThcPayOn : "";
        let THC_RATE_PER_KG_TAR = Math.abs(this.TarThcRate);
        let THC_RATE_TAR = Math.abs(this.TarThc);

        let BP_PAYABLE_ON_TAR = (this.TarBPPayOn != null) ? this.TarBPPayOn : "";
        let BP_RATE_PER_KG_TAR = Math.abs(this.TarBPRate);
        let BP_RATE_TAR = Math.abs(this.TarBP);

        let Truck_PAYABLE_ON_TAR = (this.TarTruckPayOn != null) ? this.TarTruckPayOn : "";
        let Truck_RATE_PER_KG_TAR = Math.abs(this.TarTruckRate);
        let Truck_RATE_TAR = Math.abs(this.TarTruck);

        let DUE_CARRIER_TAR = Math.abs(this.DurCarrierTar);
        let HAWB_TAR = Math.abs(this.HawbTar);
        let PCA_TAR = Math.abs(this.PcaTar);
        let DUE_AGENT_TAR = Math.abs(this.DueAgentTar);
        let TOTAL_TAR = Math.abs(this.TotalTar);
        let OTHER_CHRG_TAR = Math.abs(this.OtherTar);
        let REMARK = this.Remark;
        let AMS_RATE_TAR = Math.abs(this.TarAms);

        let OTHER_NAME1 = this.OtherChrg1;
        let OTHER_NAME2 = this.OtherChrg2;
        let OTHER_RATE1_TAR = Math.abs(this.OtherAmt1_Tar);
        let OTHER_RATE2_TAR = Math.abs(this.OtherAmt2_Tar);

        let OTHER_RATE1_TAR_CAL = (this.CalOneDcTar == 1) ? "DC" : "DA";
        let OTHER_RATE2_TAR_CAL = this.OtherAmt2_Tar;

        OTHER_RATE2_TAR_CAL = (this.CalTwoDcTar == 1) ? "DC" : "DA"; //Line 1413 one variable with different data

        let OTHER_RATE1_NET_CAL = (this.CalOneDcNet == 1) ? "DC" : "DA";

        let OTHER_RATE2_NET_CAL = (this.CalTwoDcNet == 1) ? "DC" : "DA";

        let ISMIN = (this.isMinRate == true) ? "Y" : "N";

        let EXPTNO = this.exptno;

        var FRT_RATE_TAR_FRT = '',
            FSC_RATE_TAR_FRT = '',
            IRC_RATE_TAR_FRT = '',
            XRAY_RATE_TAR_FRT = '',
            MC_RATE_TAR_FRT = '',
            CTG_RATE_TAR_FRT = '',
            THC_RATE_TAR_FRT = '',
            BP_RATE_TAR_FRT = '',
            HAWB_RATE_TAR_FRT = '',
            PCA_RATE_TAR_FRT = '',
            OTHER_RATE_TAR_FRT = '',
            TRUCK_RATE_TAR_FRT = '',

            FRT_RATE_NET_FRT = '',
            FSC_RATE_NET_FRT = '',
            IRC_RATE_NET_FRT = '',
            XRAY_RATE_NET_FRT = '',
            MC_RATE_NET_FRT = '',
            CTG_RATE_NET_FRT = '',
            THC_RATE_NET_FRT = '',
            BP_RATE_NET_FRT = '',
            AMS_RATE_NET_FRT = '',
            HAWB_RATE_NET_FRT = '',
            PCA_RATE_NET_FRT = '',
            OTHER_RATE_NET_FRT = '',
            AMS_RATE_TAR_FRT = '',
            TRUCK_RATE_NET_FRT;

        var FRT_CHARGEABLE_AS_NET = '',
            FRT_PAYABLE_ON_NET = '',
            FRT_RATE_PER_KG_NET: number,
            FRT_RATE_NET: number,
            FSC_PAYABLE_ON_NET = '',
            FSC_RATE_PER_KG_NET: number,
            FSC_RATE_NET: number,
            IRC_PAYABLE_ON_NET = '',
            IRC_RATE_PER_KG_NET: number,
            IRC_RATE_NET: number,
            XRAY_PAYABLE_ON_NET = '',
            XRAY_RATE_PER_KG_NET: number,
            XRAY_RATE_NET: number,
            MC_PAYABLE_ON_NET = '',
            MC_RATE_PER_KG_NET: number,
            MC_RATE_NET: number,
            CTG_PAYABLE_ON_NET = '',
            CTG_RATE_PER_KG_NET: number | string,
            CTG_RATE_NET: number,
            DUE_CARRIER_NET: number | string,
            HAWB_NET: number,
            PCA_NET: number,
            DUE_AGENT_NET: number | string,
            TOTAL_NET: number | string,
            OTHER_CHRG_NET: number,
            AMS_RATE_NET: number,
            OTHER_RATE1_NET: number,
            OTHER_RATE2_NET: number,
            ISNETEDIT = '',
            SupplierNet = '',
            AIR_FRT_COMMISSION = '',
            FRT_REBATE: number,
            TDS: number,
            SERVICE_TAX: number,
            THC_PAYABLE_ON_NET = '',
            THC_RATE_PER_KG_NET: number,
            THC_RATE_NET: number,
            BUSINES_PROMO = '',
            BP_PAYABLE_ON_NET = '',
            BP_RATE_PER_KG_NET: number | string,
            BP_RATE_NET: number,

            TRUCK_PAYABLE_ON_NET = '',
            TRUCK_RATE_PER_KG_NET: number | string,
            TRUCK_RATE_NET: number;


        if (Math.abs(FRT_RATE_TAR) > 0)
            FRT_RATE_TAR_FRT = this.TarFreightFrt;
        if (Math.abs(FSC_RATE_TAR) > 0)
            FSC_RATE_TAR_FRT = this.TarFscFrt;
        if (Math.abs(IRC_RATE_TAR) > 0)
            IRC_RATE_TAR_FRT = this.TarIrcFrt;
        if (Math.abs(XRAY_RATE_TAR) > 0)
            XRAY_RATE_TAR_FRT = this.TarXrayFrt;
        if (Math.abs(MC_RATE_TAR) > 0)
            MC_RATE_TAR_FRT = this.TarMcFrt;
        if (Math.abs(CTG_RATE_TAR) > 0)
            CTG_RATE_TAR_FRT = this.TarCtgFrt;
        if (Math.abs(THC_RATE_TAR) > 0)
            THC_RATE_TAR_FRT = this.TarThcFrt;
        if (Math.abs(BP_RATE_TAR) > 0)
            BP_RATE_TAR_FRT = this.TarBPFrt;
        if (Math.abs(AMS_RATE_TAR) > 0)
            AMS_RATE_TAR_FRT = this.TarAmsFrt;
        if (Math.abs(HAWB_TAR) > 0)
            HAWB_RATE_TAR_FRT = this.HawbTarFrt;
        if (Math.abs(PCA_TAR) > 0)
            PCA_RATE_TAR_FRT = this.PcaTarFrt;
        if (Math.abs(OTHER_CHRG_TAR) > 0)
            OTHER_RATE_TAR_FRT = this.OtherTarFrt;


        let OTHER_RATE1_TAR_FRT = '',
            OTHER_RATE2_TAR_FRT = '',
            OTHER_RATE1_NET_FRT = '',
            OTHER_RATE2_NET_FRT = '',
            DUE_CARRIER_NET_CC = 0,
            DUE_AGENT_NET_CC = 0,
            TOTAL_NET_CC = 0;

        if (Math.abs(OTHER_RATE1_TAR) > 0)
            OTHER_RATE1_TAR_FRT = this.OtherAmt1TarFrt;
        if (Math.abs(OTHER_RATE2_TAR) > 0)
            OTHER_RATE2_TAR_FRT = this.OtherAmt2TarFrt;

        let DUE_CARRIER_TAR_CC = Math.abs(this.DurCarrierTarCC),
            DUE_AGENT_TAR_CC = Math.abs(this.DueAgentTarCC),
            TOTAL_TAR_CC = Math.abs(this.TotalTarCC);

        let TDS_ACCTCODE = '',
            SERVICETAX_ACCTCODE = '';

        if (this.hdNetRights == true) {
            ISNETEDIT = 'Y';

            TDS = Math.abs(this.TxtTDS);
            SERVICE_TAX = Math.abs(this.TxtServiceTax);
            TDS_ACCTCODE = this.DrpTDS;
            SERVICETAX_ACCTCODE = this.DrpServiceTax;

            if (Math.abs(TDS) > 0) {
                if (TDS_ACCTCODE == "0") {
                    alert("Please select TDS Account Name.");
                    return false;
                }
            }
            else { TDS_ACCTCODE = ''; }

            if (Math.abs(SERVICE_TAX) > 0) {
                if (SERVICETAX_ACCTCODE == "0") {
                    alert("Please select Service Tax Account Name.");
                    return false;
                }
            }
            else { SERVICETAX_ACCTCODE = ''; }

            if (this.SupplierNet == null || this.SupplierNet == "" || this.SupplierNet==undefined) {
                alert("Please select Supplier / Airline.");
                return false;
            }
            SupplierNet = this.SupplierNet;

            FRT_CHARGEABLE_AS_NET = (this.NetRate == 1) ? "AI" : "FS";

            FRT_PAYABLE_ON_NET = (this.NetFreightPayOn != null) ? this.NetFreightPayOn : "";
            FRT_RATE_PER_KG_NET = Math.abs(this.NetFreightRate);
            FRT_RATE_NET = Math.abs(this.NetFreight);

            FSC_PAYABLE_ON_NET = (this.NetFscPayOn != null) ? this.NetFscPayOn : "";
            FSC_RATE_PER_KG_NET = Math.abs(this.NetFscRate);
            FSC_RATE_NET = Math.abs(this.NetFsc);

            IRC_PAYABLE_ON_NET = (this.NetIrcPayOn != null) ? this.NetIrcPayOn : "";
            IRC_RATE_PER_KG_NET = Math.abs(this.NetIrcRate);
            IRC_RATE_NET = Math.abs(this.NetIrc);

            XRAY_PAYABLE_ON_NET = (this.NetXrayPayOn != null) ? this.NetXrayPayOn : "";
            XRAY_RATE_PER_KG_NET = Math.abs(this.NetXrayRate);
            XRAY_RATE_NET = Math.abs(this.NetXray);

            // if (FRT_CHARGEABLE_AS_NET == 'FS') {
            //     if (FSC_RATE_NET == 0) {
            //         alert("Please enter any one NET NET RATE - FSC");
            //         return false;
            //     }
                //        if (FSC_RATE_NET == 0 && IRC_RATE_NET == 0 && XRAY_RATE_NET == 0) {
                //            alert("Please enter any one NET NET RATE :[FSC] or [IRC] or [X-RAY]");
                //            return false;
                //        }

           // }

            MC_PAYABLE_ON_NET = (this.NetMcPayOn != null) ? this.NetMcPayOn : "";
            MC_RATE_PER_KG_NET = Math.abs(this.NetMcRate);
            MC_RATE_NET = Math.abs(this.NetMc);

            CTG_PAYABLE_ON_NET = (this.NetCtgPayOn != null || this.NetCtgPayOn != '') ? this.NetCtgPayOn : "";
            CTG_RATE_PER_KG_NET = (this.NetCtgRate != null || this.NetCtgRate != '') ? Math.abs(this.NetCtgRate) : "";
            CTG_RATE_NET = Math.abs(this.NetCtg);


            THC_PAYABLE_ON_NET = (this.NetThcPayOn != null) ? this.NetThcPayOn : "";
            THC_RATE_PER_KG_NET = Math.abs(this.NetThcRate);
            THC_RATE_NET = Math.abs(this.NetThc);

            BP_PAYABLE_ON_NET = (this.NetBPPayOn != null) ? this.NetBPPayOn : "";
            BP_RATE_PER_KG_NET = (this.NetBPRate != null || this.NetBPRate != '') ? Math.abs(this.NetBPRate) : "";
            BP_RATE_NET = Math.abs(this.NetBP);

            DUE_CARRIER_NET = (this.DurCarrierNet != null || this.DurCarrierNet != '') ? Math.abs(this.DurCarrierNet) : "";
            HAWB_NET = Math.abs(this.HawbNet);
            PCA_NET = Math.abs(this.PcaNet);
            DUE_AGENT_NET = (this.DueAgentNet != null || this.DueAgentNet != '') ? Math.abs(this.DueAgentNet) : "";
            TOTAL_NET = Math.abs(this.TotalNet);
            OTHER_CHRG_NET = Math.abs(this.OtherNet);
            AMS_RATE_NET = Math.abs(this.NetAms);
            OTHER_RATE1_NET = Math.abs(this.OtherAmt1_Net);
            OTHER_RATE2_NET = Math.abs(this.OtherAmt2_Net);

            AIR_FRT_COMMISSION = (this.AirFrtCommission != null) ? this.AirFrtCommission : "";
            FRT_REBATE = this.FrtRebate;
            BUSINES_PROMO = (this.BusinesPromo != null || this.BusinesPromo != '') ? this.BusinesPromo : "";

            TRUCK_PAYABLE_ON_NET = (this.NetTruckPayOn != null) ? this.NetTruckPayOn : "";
            TRUCK_RATE_PER_KG_NET = (this.NetTruckRate != null || this.NetTruckRate != '') ? Math.abs(this.NetTruckRate) : "";
            TRUCK_RATE_NET = Math.abs(this.NetTruck);

            if (Math.abs(FRT_RATE_NET) > 0)
                FRT_RATE_NET_FRT = this.NetFreightFrt;
            if (Math.abs(FSC_RATE_NET) > 0)
                FSC_RATE_NET_FRT = this.NetFscFrt;
            if (Math.abs(IRC_RATE_NET) > 0)
                IRC_RATE_NET_FRT = this.NetIrcFrt;
            if (Math.abs(XRAY_RATE_NET) > 0)
                XRAY_RATE_NET_FRT = this.NetXrayFrt;
            if (Math.abs(MC_RATE_NET) > 0)
                MC_RATE_NET_FRT = this.NetMcFrt;
            if (Math.abs(CTG_RATE_NET) > 0)
                CTG_RATE_NET_FRT = this.NetCtgFrt;
            if (Math.abs(THC_RATE_NET) > 0)
                THC_RATE_NET_FRT = this.NetThcFrt;
            if (Math.abs(BP_RATE_NET) > 0)
                BP_RATE_NET_FRT = this.NetBPFrt;

            if (Math.abs(AMS_RATE_NET) > 0)
                AMS_RATE_NET_FRT = this.NetAmsFrt;
            if (Math.abs(HAWB_NET) > 0)
                HAWB_RATE_NET_FRT = this.HawbNetFrt;
            if (Math.abs(PCA_NET) > 0)
                PCA_RATE_NET_FRT = this.PcaNetFrt;
            if (Math.abs(OTHER_CHRG_NET) > 0)
                OTHER_RATE_NET_FRT = this.OtherNetFrt;

            if (Math.abs(OTHER_RATE1_NET) > 0)
                OTHER_RATE1_NET_FRT = this.OtherAmt1NetFrt;
            if (Math.abs(OTHER_RATE2_NET) > 0)
                OTHER_RATE2_NET_FRT = this.OtherAmt2NetFrt;

            if (Math.abs(TRUCK_RATE_NET) > 0)
                TRUCK_RATE_NET_FRT = this.NetTruckFrt;


            DUE_CARRIER_NET_CC = Math.abs(this.DurCarrierNetCC);
            DUE_AGENT_NET_CC = Math.abs(this.DueAgentNetCC);
            TOTAL_NET_CC = Math.abs(this.TotalNetCC);
        }
        else {
            let ISNETEDIT = 'N',
                SupplierNet = '',
                FRT_CHARGEABLE_AS_NET = "AI",
                FRT_PAYABLE_ON_NET = '0',
                FRT_RATE_PER_KG_NET = '0',
                FRT_RATE_NET = '0',

                FSC_PAYABLE_ON_NET = '0',
                FSC_RATE_PER_KG_NET = '0',
                FSC_RATE_NET = '0',

                IRC_PAYABLE_ON_NET = '0',
                IRC_RATE_PER_KG_NET = '0',
                IRC_RATE_NET = '0',

                XRAY_PAYABLE_ON_NET = '0',
                XRAY_RATE_PER_KG_NET = '0',
                XRAY_RATE_NET = '0',

                MC_PAYABLE_ON_NET = '0',
                MC_RATE_PER_KG_NET = '0',
                MC_RATE_NET = '0',

                CTG_PAYABLE_ON_NET = '0',
                CTG_RATE_PER_KG_NET = '0',
                CTG_RATE_NET = '0',

                THC_PAYABLE_ON_NET = '0',
                THC_RATE_PER_KG_NET = '0',
                THC_RATE_NET = '0',

                BP_PAYABLE_ON_NET = '0',
                BP_RATE_PER_KG_NET = '0',
                BP_RATE_NET = '0',

                Truck_PAYABLE_ON_NET = '0',
                Truck_RATE_PER_KG_NET = '0',
                Truck_RATE_NET = '0',

                DUE_CARRIER_NET = '0',
                HAWB_NET = '0',
                PCA_NET = '0',
                DUE_AGENT_NET = '0',
                TOTAL_NET = '0',
                OTHER_CHRG_NET = '0',
                AMS_RATE_NET = '0',
                OTHER_RATE1_NET = '0',
                OTHER_RATE2_NET = '0',

                AIR_FRT_COMMISSION = '',
                FRT_REBATE = '',
                BUSINES_PROMO = '',
                TDS = '',
                SERVICE_TAX = '';

            FRT_RATE_NET_FRT = '';
            FSC_RATE_NET_FRT = '';
            IRC_RATE_NET_FRT = '';
            XRAY_RATE_NET_FRT = '';
            MC_RATE_NET_FRT = '';
            CTG_RATE_NET_FRT = '';
            THC_RATE_NET_FRT = '';
            BP_RATE_NET_FRT = '';
            AMS_RATE_NET_FRT = '';
            HAWB_RATE_NET_FRT = '';
            PCA_RATE_NET_FRT = '';
            OTHER_RATE_NET_FRT = '';

            OTHER_RATE1_NET_FRT = '';
            OTHER_RATE2_NET_FRT = '';
            DUE_CARRIER_NET_CC = 0;
            DUE_AGENT_NET_CC = 0;
            TOTAL_NET_CC = 0;

            TDS_ACCTCODE = '';
            SERVICETAX_ACCTCODE = '';
        }

        const _jsonData = {
            EXPTNO: EXPTNO,
            MAWBNO: MAWBNO,
            CITYCODE: CITYCODE,
            CHBL_WGT: CHBL_WGT,
            GROSS_WGT: GROSS_WGT,
            CHBL_WGT_USER: CHBL_WGT_USER,
            GROSS_WGT_USER: GROSS_WGT_USER,
            FREIGHT: FREIGHT,
            FRT_CHARGEABLE_AS_TAR: FRT_CHARGEABLE_AS_TAR,
            FRT_CHARGEABLE_AS_NET: FRT_CHARGEABLE_AS_NET,
            FRT_PAYABLE_ON_TAR: FRT_PAYABLE_ON_TAR,
            FRT_RATE_PER_KG_TAR: FRT_RATE_PER_KG_TAR,
            FRT_RATE_TAR: FRT_RATE_TAR,
            FRT_PAYABLE_ON_NET: FRT_PAYABLE_ON_NET,
            FRT_RATE_PER_KG_NET: FRT_RATE_PER_KG_NET,
            FRT_RATE_NET: FRT_RATE_NET,
            FSC_PAYABLE_ON_TAR: FSC_PAYABLE_ON_TAR,
            FSC_RATE_PER_KG_TAR: FSC_RATE_PER_KG_TAR,
            FSC_RATE_TAR: FSC_RATE_TAR,
            FSC_PAYABLE_ON_NET: FSC_PAYABLE_ON_NET,
            FSC_RATE_PER_KG_NET: FSC_RATE_PER_KG_NET,
            FSC_RATE_NET: FSC_RATE_NET,
            IRC_PAYABLE_ON_TAR: IRC_PAYABLE_ON_TAR,
            IRC_RATE_PER_KG_TAR: IRC_RATE_PER_KG_TAR,
            IRC_RATE_TAR: IRC_RATE_TAR,
            IRC_PAYABLE_ON_NET: IRC_PAYABLE_ON_NET,
            IRC_RATE_PER_KG_NET: IRC_RATE_PER_KG_NET,
            IRC_RATE_NET: IRC_RATE_NET,
            XRAY_PAYABLE_ON_TAR: XRAY_PAYABLE_ON_TAR,
            XRAY_RATE_PER_KG_TAR: XRAY_RATE_PER_KG_TAR,
            XRAY_RATE_TAR: XRAY_RATE_TAR,
            XRAY_PAYABLE_ON_NET: XRAY_PAYABLE_ON_NET,
            XRAY_RATE_PER_KG_NET: XRAY_RATE_PER_KG_NET,
            XRAY_RATE_NET: XRAY_RATE_NET,
            MC_PAYABLE_ON_TAR: MC_PAYABLE_ON_TAR,
            MC_RATE_PER_KG_TAR: MC_RATE_PER_KG_TAR,
            MC_RATE_TAR: MC_RATE_TAR,
            MC_PAYABLE_ON_NET: MC_PAYABLE_ON_NET,
            MC_RATE_PER_KG_NET: MC_RATE_PER_KG_NET,
            MC_RATE_NET: MC_RATE_NET,
            CTG_PAYABLE_ON_TAR: CTG_PAYABLE_ON_TAR,
            CTG_RATE_PER_KG_TAR: CTG_RATE_PER_KG_TAR,
            CTG_RATE_TAR: CTG_RATE_TAR,
            CTG_PAYABLE_ON_NET: CTG_PAYABLE_ON_NET,
            CTG_RATE_PER_KG_NET: CTG_RATE_PER_KG_NET,
            CTG_RATE_NET: CTG_RATE_NET,
            DUE_CARRIER_TAR: DUE_CARRIER_TAR,
            DUE_CARRIER_NET: DUE_CARRIER_NET,
            HAWB_TAR: HAWB_TAR,
            HAWB_NET: HAWB_NET,
            PCA_TAR: PCA_TAR,
            PCA_NET: PCA_NET,
            DUE_AGENT_TAR: DUE_AGENT_TAR,
            DUE_AGENT_NET: DUE_AGENT_NET,
            TOTAL_TAR: TOTAL_TAR,
            TOTAL_NET: TOTAL_NET,
            OTHER_CHRG_TAR: OTHER_CHRG_TAR,
            OTHER_CHRG_NET: OTHER_CHRG_NET,
            REMARK: REMARK,
            AMS_RATE_TAR: AMS_RATE_TAR,
            AMS_RATE_NET: AMS_RATE_NET,
            OTHER_NAME1: OTHER_NAME1,
            OTHER_NAME2: OTHER_NAME2,
            OTHER_RATE1_TAR: OTHER_RATE1_TAR,
            OTHER_RATE2_TAR: OTHER_RATE2_TAR,
            OTHER_RATE1_NET: OTHER_RATE1_NET,
            OTHER_RATE2_NET: OTHER_RATE2_NET,
            OTHER_RATE1_TAR_CAL: OTHER_RATE1_TAR_CAL,
            OTHER_RATE2_TAR_CAL: OTHER_RATE2_TAR_CAL,
            OTHER_RATE1_NET_CAL: OTHER_RATE1_NET_CAL,
            OTHER_RATE2_NET_CAL: OTHER_RATE2_NET_CAL,
            ISNETEDIT: ISNETEDIT,
            ISMIN: ISMIN,
            SUPPLIER_NET: SupplierNet,
            AIR_FRT_COMM_NET: AIR_FRT_COMMISSION,
            FRT_REBATE_NET: FRT_REBATE,
            TDS_NET: TDS,
            SERVICE_TAX_NET: SERVICE_TAX,
            FRT_RATE_TAR_FRT: FRT_RATE_TAR_FRT,
            FSC_RATE_TAR_FRT: FSC_RATE_TAR_FRT,
            IRC_RATE_TAR_FRT: IRC_RATE_TAR_FRT,
            XRAY_RATE_TAR_FRT: XRAY_RATE_TAR_FRT,
            MC_RATE_TAR_FRT: MC_RATE_TAR_FRT,
            CTG_RATE_TAR_FRT: CTG_RATE_TAR_FRT,
            AMS_RATE_TAR_FRT: AMS_RATE_TAR_FRT,
            HAWB_RATE_TAR_FRT: HAWB_RATE_TAR_FRT,
            PCA_RATE_TAR_FRT: PCA_RATE_TAR_FRT,
            OTHER_RATE_TAR_FRT: OTHER_RATE_TAR_FRT,
            FRT_RATE_NET_FRT: FRT_RATE_NET_FRT,
            FSC_RATE_NET_FRT: FSC_RATE_NET_FRT,
            IRC_RATE_NET_FRT: IRC_RATE_NET_FRT,
            XRAY_RATE_NET_FRT: XRAY_RATE_NET_FRT,
            MC_RATE_NET_FRT: MC_RATE_NET_FRT,
            CTG_RATE_NET_FRT: CTG_RATE_NET_FRT,
            AMS_RATE_NET_FRT: AMS_RATE_NET_FRT,
            HAWB_RATE_NET_FRT: HAWB_RATE_NET_FRT,
            PCA_RATE_NET_FRT: PCA_RATE_NET_FRT,
            OTHER_RATE_NET_FRT: OTHER_RATE_NET_FRT,
            OTHER_RATE1_TAR_FRT: OTHER_RATE1_TAR_FRT,
            OTHER_RATE2_TAR_FRT: OTHER_RATE2_TAR_FRT,
            DUE_CARRIER_TAR_CC: DUE_CARRIER_TAR_CC,
            DUE_AGENT_TAR_CC: DUE_AGENT_TAR_CC,
            TOTAL_TAR_CC: TOTAL_TAR_CC,
            OTHER_RATE1_NET_FRT: OTHER_RATE1_NET_FRT,
            OTHER_RATE2_NET_FRT: OTHER_RATE2_NET_FRT,
            DUE_CARRIER_NET_CC: DUE_CARRIER_NET_CC,
            DUE_AGENT_NET_CC: DUE_AGENT_NET_CC,
            TOTAL_NET_CC: TOTAL_NET_CC,
            TDS_ACCTCODE: TDS_ACCTCODE,
            SERVICETAX_ACCTCODE: SERVICETAX_ACCTCODE,
            AGENTS_RATE: AGENTS_RATE,
            THC_PAYABLE_ON_TAR: THC_PAYABLE_ON_TAR,
            THC_RATE_PER_KG_TAR: THC_RATE_PER_KG_TAR,
            THC_RATE_TAR: THC_RATE_TAR,
            THC_PAYABLE_ON_NET: THC_PAYABLE_ON_NET,
            THC_RATE_PER_KG_NET: THC_RATE_PER_KG_NET,
            THC_RATE_NET: THC_RATE_NET,
            THC_RATE_TAR_FRT: THC_RATE_TAR_FRT,
            THC_RATE_NET_FRT: THC_RATE_NET_FRT,
            BUSINES_PROMO_NET: BUSINES_PROMO,
            BP_PAYABLE_ON_TAR: BP_PAYABLE_ON_TAR,
            BP_RATE_PER_KG_TAR: BP_RATE_PER_KG_TAR,
            BP_RATE_TAR: BP_RATE_TAR,
            BP_PAYABLE_ON_NET: BP_PAYABLE_ON_NET,
            BP_RATE_PER_KG_NET: BP_RATE_PER_KG_NET,
            BP_RATE_NET: BP_RATE_NET,
            BP_RATE_TAR_FRT: BP_RATE_TAR_FRT,
            BP_RATE_NET_FRT: BP_RATE_NET_FRT,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CmpId: this._loginService.getLogin()[0].CMPID,
            MakerIp: this._loginService.getLogin()[0].MAKERIP, //Change later by Ip
            DEST_TRUCKING_PAYABLE_ON_TAR: Truck_PAYABLE_ON_TAR,
            DEST_TRUCKING_RATE_PER_KG_TAR: Truck_RATE_PER_KG_TAR,
            DEST_TRUCKING_RATE_TAR: Truck_RATE_TAR,
            DEST_TRUCKING_PAYABLE_ON_NET: TRUCK_PAYABLE_ON_NET,
            DEST_TRUCKING_RATE_PER_KG_NET: TRUCK_RATE_PER_KG_NET,
            DEST_TRUCKING_RATE_NET: TRUCK_RATE_NET,
            DEST_TRUCKING_RATE_TAR_FRT: TRUCK_RATE_TAR_FRT,
            DEST_TRUCKING_RATE_NET_FRT: TRUCK_RATE_NET_FRT,
            VGUID:this._loginService.getLogin()[0].GUID,
        };
        this._loaderService.display(true);
      //  this.saveMAWBALChargesdetails("30521","15778704102")
         this._dataService.Common("Export/EXP_MST_EXPORT_MAWB_PP_CC_UPDATE", _jsonData)
             .subscribe((data: any) => {
                 if (data.Table[0].STATUS.split('#')[0]== '100') {
                     this._toasterService.toast('success', 'Alert', data.Table[0].STATUS.split('#')[1]);
                   ///  this.saveMAWBALChargesdetails("30521","15778704102")
                     this._loaderService.display(false);
                 }
                 else {
                     this._toasterService.toast('error', 'error', data.Table[0].STATUSTEXT);
                     this._loaderService.display(false);
                 }
             });
    }

    validate() {   if(this.ISAUTO_FRT_INV=="1")
    {alert("MAWB rate can not be Modified, Because Automatic Freight Invoice already Generated For This MAWB !!");return false;}
    else{this.fn_MAWB_IU(); }
    }
    AddMAWBALCharges()
    {
     if(this.CHARGETYPE=='' || this.CHARGETYPE==undefined)
     {
         alert("Please select Charge Type.")
         return false;
     }
     if(this.CHARGENAME=='' || this.CHARGENAME==undefined)
     {
         alert("Please select Charge. ")
         return false;
     }
     if(this.RATE_TAR==null)
     {
         alert("Please enter Tariff Rate. ")
         return false;
     }
     if(this.RATE_TAR_FRT=='')
     {
         alert("Please enter Tariff Rate Freight. ")
         return false;
     }
     if(this.PK_ID=="0"){
     if (this.Chargeslist.length > "0") {
         let chrgnm: any = []
         chrgnm = this.Chargeslist.filter((code: any) => code.FK_CHARGEID === parseInt(this.CHARGENAME.split("|")[0]))
         if (chrgnm.length > "0") {
             this._toasterService.toast('warning', 'warning', 'Same Charge already Exists!');
             return false;
         }
         }
     }
     const jsonchild= {PK_ID:this.PK_ID,
     FKID:this.FK_ID,
     CHRGDETAILSID:this.CHRGDETAILSID,
     MAWBNO:this._sharedconsig.exportEditData.MAWBNO,
     FK_CHARGEID:this.CHARGENAME.split("|")[0] ,
     CHARGETYPE:this.CHARGETYPE,
     RATE_TAR:this.RATE_TAR,
     RATE_TAR_FRT:this.RATE_TAR_FRT,
     RATE_NET:this.RATE_NET,
     RATE_NET_FRT:this.RATE_NET_FRT,
     MAKERID:this._loginService.getLogin()[0].CMPID,
     VGUID:this._loginService.getLogin()[0].GUID,
     }
    this._dataService.Common("Export/EXPT_MAWB_PRINT_RATE_AIRLINE_CHARGES_TMPIU", jsonchild)
        .subscribe((data: any) => {
        if (data.Table[0].STATUS == "100") {
                this.Chargeslist=data.Table1;
                this.dttable6=data.Table6;
                if(this.EDIT_CHARGETYPE != undefined){
                 this.fn_CalculateAlCharges_Tar(data.Table6);
                   }
                else
             {
                 this.fn_CalculateAlCharges_Add(data.Table6);
             }

                //this.fn_CalculateAlCharges_Net(data.Table6)
                this.tot_rate_tar_pp_da=data.Table2[0].RATE_TAR_TOTAL_PP_DA;
                this.tot_rate_net_pp_da=data.Table2[0].RATE_NET_TOTAL_PP_DA;
                this.tot_rate_tar_cc_da=data.Table3[0].RATE_TAR_TOTAL_CC_DA;
                this.tot_rate_net_cc_da=data.Table3[0].RATE_NET_TOTAL_CC_DA;
                this.tot_rate_tar_pp_dc=data.Table4[0].RATE_TAR_TOTAL_PP_DC;
                this.tot_rate_net_pp_dc=data.Table4[0].RATE_NET_TOTAL_PP_DC;
                this.tot_rate_tar_cc_dc=data.Table5[0].RATE_TAR_TOTAL_CC_DC;
                this.tot_rate_net_cc_dc=data.Table5[0].RATE_NET_TOTAL_CC_DC;
                this.Resetchildrcrd();
             //    this.loaderService.display(false);
            }
        else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT);
                   // this.loaderService.display(false);
            }
        });
 }
 ResetMAWBCharges(){
     this.CHARGETYPE=""
     this.CHARGENAME=""
     this.RATE_TAR=""
  //  this.RATE_TAR_FRT=""
     this.RATE_NET=""
     //this.RATE_NET_FRT=""
 }
 fn_CalculateAlCharges_Add(dtbl){
     if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='PP')
     {
      this.DueAgentNet=Math.abs(this.DueAgentNet)  + Math.abs(dtbl[0].RATE_NET);
      this.TotalNet=Math.abs(this.TotalNet) +  Math.abs(dtbl[0].RATE_NET);
      this.DueAgentTar=Math.abs(this.DueAgentTar)  + Math.abs(dtbl[0].RATE_TAR);
      this.TotalTar=Math.abs(this.TotalTar)  +  Math.abs(dtbl[0].RATE_TAR);
     }
     if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='CC')
     {
      this.DueAgentNetCC=Math.abs(this.DueAgentNetCC)  + Math.abs(dtbl[0].RATE_NET);
      this.TotalNet=Math.abs(this.TotalNet)  +  Math.abs(dtbl[0].RATE_NET);
      this.DueAgentTarCC=Math.abs(this.DueAgentTarCC)  + Math.abs(dtbl[0].RATE_TAR);
      this.TotalTar=Math.abs(this.TotalTar)  +  Math.abs(dtbl[0].RATE_TAR);
     }
     if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='PP')
     {
      this.DurCarrierNet=Math.abs(this.DurCarrierNet) + Math.abs(dtbl[0].RATE_NET);
      this.TotalNet=Math.abs(this.TotalNet)  +  Math.abs(dtbl[0].RATE_NET);
      this.DurCarrierTar=Math.abs(this.DurCarrierTar)  + Math.abs(dtbl[0].RATE_TAR);
      this.TotalTar=Math.abs(this.TotalTar)+ Math.abs(dtbl[0].RATE_TAR);
     }
     if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='CC')
     {
      this.DurCarrierNetCC=Math.abs(this.DurCarrierNetCC)+ Math.abs(dtbl[0].RATE_NET);
      this.TotalNet=Math.abs(this.TotalNet) +  Math.abs(dtbl[0].RATE_NET);
      this.DurCarrierTarCC=Math.abs(this.DurCarrierTarCC)  + Math.abs(dtbl[0].RATE_TAR);
      this.TotalTar=Math.abs(this.TotalTar) +  Math.abs(dtbl[0].RATE_TAR);
      }
 }
 fn_CalculateAlCharges_Net(dtbl){
     if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='PP')
     {
      this.DueAgentNet=(Math.abs(this.DueAgentNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
      this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET) ) +  Math.abs(dtbl[0].RATE_NET);
     }
     if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='CC')
     {
      this.DueAgentNetCC=(Math.abs(this.DueAgentNetCC) - Math.abs(this.EDIT_RATE_NET))  + Math.abs(dtbl[0].RATE_NET);
      this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(dtbl[0].RATE_NET);
     }
     if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='PP')
     {
      this.DurCarrierNet=(Math.abs(this.DurCarrierNet) -Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
      this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(dtbl[0].RATE_NET);
     }
     if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='CC')
     {
      this.DurCarrierNetCC=Math.abs(this.DurCarrierNetCC)+ Math.abs(dtbl[0].RATE_NET);
      this.TotalNet=Math.abs(this.TotalNet) +  Math.abs(dtbl[0].RATE_NET);

      }
 }
 fn_CalculateAlCharges_Tar(dtbl){
     if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='PP' &&  this.EDIT_CHARGETYPE=='DA')
     {
      this.DueAgentTar=(Math.abs(this.DueAgentTar) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
      this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR)) +  Math.abs(dtbl[0].RATE_TAR);
      this.DueAgentNet=(Math.abs(this.DueAgentNet) - Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
      this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET) ) +  Math.abs(dtbl[0].RATE_NET);
     }
     if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='CC' &&  this.EDIT_CHARGETYPE=='DA')
     {
      this.DueAgentTarCC=(Math.abs(this.DueAgentTarCC) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
      this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR)) +  Math.abs(dtbl[0].RATE_TAR);
      this.DueAgentNetCC=(Math.abs(this.DueAgentNetCC) - Math.abs(this.EDIT_RATE_NET))  + Math.abs(dtbl[0].RATE_NET);
      this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(dtbl[0].RATE_NET);
     }
     if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='CC' &&  this.EDIT_CHARGETYPE=='DC')
     {
      this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC) - Math.abs(this.EDIT_RATE_TAR));
      this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC) - Math.abs(this.EDIT_RATE_TAR)) ;
      this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_NET));
      this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) ;
      this.DueAgentNetCC=Math.abs(this.DueAgentNetCC)  + Math.abs(dtbl[0].RATE_NET);
      this.TotalNet=Math.abs(this.TotalNet)  +  Math.abs(dtbl[0].RATE_NET);
      this.DueAgentTarCC=Math.abs(this.DueAgentTarCC)  + Math.abs(dtbl[0].RATE_TAR);
      this.TotalTar=Math.abs(this.TotalTar)  +  Math.abs(dtbl[0].RATE_TAR);
     }
     if(dtbl[0].CHARGETYPE=='DA' && dtbl[0].RATE_TAR_FRT=='PP' &&  this.EDIT_CHARGETYPE=='DC')
     {
     this.DueAgentTar=Math.abs(this.DueAgentTar)  + Math.abs(dtbl[0].RATE_TAR);
     this.TotalTar=Math.abs(this.TotalTar)  +  Math.abs(dtbl[0].RATE_TAR);
     this.DueAgentNet=Math.abs(this.DueAgentNet)  + Math.abs(dtbl[0].RATE_NET);
     this.TotalNet=Math.abs(this.TotalNet) +  Math.abs(dtbl[0].RATE_NET);
     this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC) - Math.abs(this.EDIT_RATE_TAR));
     this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC) - Math.abs(this.EDIT_RATE_NET)) ;
     this.TotalTar=(Math.abs(this.TotalTar) + Math.abs(this.EDIT_RATE_TAR));
     this.TotalNet=(Math.abs(this.TotalNet) + Math.abs(this.EDIT_RATE_NET)) ;
     }
     if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='PP' &&  this.EDIT_CHARGETYPE=='DC')
     {
      this.DurCarrierTar=(Math.abs(this.DurCarrierTar) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
      this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR)) +  Math.abs(dtbl[0].RATE_TAR);
      this.DurCarrierNet=(Math.abs(this.DurCarrierNet) -Math.abs(this.EDIT_RATE_NET)) + Math.abs(dtbl[0].RATE_NET);
      this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_NET)) +  Math.abs(dtbl[0].RATE_NET);
     }
     if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='CC' &&  this.EDIT_CHARGETYPE=='DC')
     {
      this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC) - Math.abs(this.EDIT_RATE_TAR)) + Math.abs(dtbl[0].RATE_TAR);
      this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.EDIT_RATE_TAR))  +  Math.abs(dtbl[0].RATE_TAR);
      this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC)- Math.abs(this.EDIT_RATE_TAR))  +  Math.abs(dtbl[0].RATE_TAR);
      this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.EDIT_RATE_TAR))  +  Math.abs(dtbl[0].RATE_TAR);
     }
     if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='CC' &&  this.EDIT_CHARGETYPE=='DA')
     {
     this.DueAgentNetCC=(Math.abs(this.DueAgentNetCC)  - Math.abs(this.EDIT_RATE_NET));
     this.TotalNet=(Math.abs(this.TotalNet)  - Math.abs(this.EDIT_RATE_NET));
     this.DueAgentTarCC=(Math.abs(this.DueAgentTarCC)  - Math.abs(this.EDIT_RATE_TAR));
     this.TotalTar=(Math.abs(this.TotalTar)  - Math.abs(this.EDIT_RATE_TAR));
     this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC)  +Math.abs(dtbl[0].RATE_TAR));
     this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC) + Math.abs(dtbl[0].RATE_NET));
     this.TotalTar=(Math.abs(this.TotalTar) + Math.abs(dtbl[0].RATE_TAR));
     this.TotalNet=(Math.abs(this.TotalNet)  + Math.abs(dtbl[0].RATE_NET));
     }
     if(dtbl[0].CHARGETYPE=='DC' && dtbl[0].RATE_TAR_FRT=='PP' &&  this.EDIT_CHARGETYPE=='DA')
     {
     this.DueAgentNet=(Math.abs(this.DueAgentNet)  - Math.abs(this.EDIT_RATE_NET));
     this.TotalNet=(Math.abs(this.TotalNet)  - Math.abs(this.EDIT_RATE_NET));
     this.DueAgentTar=(Math.abs(this.DueAgentTar)  - Math.abs(this.EDIT_RATE_TAR));
     this.TotalTar=(Math.abs(this.TotalTar)  - Math.abs(this.EDIT_RATE_TAR));
     this.DurCarrierTar=(Math.abs(this.DurCarrierTar)  +Math.abs(dtbl[0].RATE_TAR));
     this.DurCarrierNet=(Math.abs(this.DurCarrierNet) + Math.abs(dtbl[0].RATE_NET));
     this.TotalTar=(Math.abs(this.TotalTar) + Math.abs(dtbl[0].RATE_TAR));
     this.TotalNet=(Math.abs(this.TotalNet)  + Math.abs(dtbl[0].RATE_NET));
     }
 }
 Resetchildrcrd(){
     this.CHARGETYPE=undefined;
     this.CHARGENAME="";
     this.RATE_TAR="";
     this.RATE_TAR_FRT="";
     this.RATE_NET="";
     this.RATE_NET_FRT="";
     this.txtchild="Add";
     this.CHRGDETAILSID="0";
     this.PK_ID="0";
     this.FK_ID="0";
     this.EDIT_CHARGETYPE=undefined;

 }
 Resetchildrcrdpageload(){
     this.CHARGETYPE=undefined;
     this.CHARGENAME="";
     this.RATE_TAR="";
     this.RATE_NET="";
     this.txtchild="Add";
     this.CHRGDETAILSID="0";
     this.PK_ID="0";
     this.FK_ID="0";
     this.EDIT_CHARGETYPE=undefined;

 }
 Editchildrecd(id) {
     let filterData = this.Chargeslist.filter((filter) => filter.PK_ID == id)[0];
     //this.fk=filterData.ID;
     this.PK_ID=filterData.PK_ID,
     this.FK_ID=filterData.FK_ID,
     this.CHARGETYPE=filterData.CHARGETYPE;
     this.CHRGDETAILSID=filterData.FK_CHRGDETAILSID;
     this.AirLineCharges =this.AllAirLineChargeslist.filter((code: any) => code.DataValueField.split("|")[1] === this.CHARGETYPE);
     this.CHARGENAME=filterData.FK_CHARGEID + '|' + filterData.CHARGETYPE;
     this.RATE_TAR=filterData.RATE_TAR;
     this.RATE_TAR_FRT=filterData.RATE_TAR_FRT;
     this.RATE_NET=filterData.RATE_NET;
     this.RATE_NET_FRT=filterData.RATE_NET_FRT;
     this.EDIT_RATE_TAR=filterData.RATE_TAR;
     this.EDIT_RATE_NET=filterData.RATE_NET;
     this.EDIT_CHARGETYPE=filterData.CHARGETYPE;
     this.txtchild="Update";
     }

     deletechildrecd(id,chrgdtlsid){

             if(confirm('Are you sure want to delete the record ?')) {
                 this._loaderService.display(true);
                 const jsondelete = { ID  : id,VGUID :this._loginService.getLogin()[0].GUID,FK_CHRGDTLSID:chrgdtlsid}
                 this._dataService.getData("Export/EXPT_MAWB_PRINT_RATE_AIRLINE_CHARGES_TMP_DEL", jsondelete)
                     .subscribe((data: any) => {

                         if (data.Table[0].STATUS== "100") {
                             this.Chargeslist=data.Table
                             this.DELCHARGETYPE=data.Table1[0].CHARGETYPE;
                             this.DEL_RATE_TAR=data.Table1[0].RATE_TAR;
                             this.DEL_RATE_TAR_FRT=data.Table1[0].RATE_TAR_FRT;
                             this.DEL_RATE_NET=data.Table1[0].RATE_NET;
                             this.DEL_RATE_NET_FRT=data.Table1[0].RATE_NET_FRT;
                             if(this.DELCHARGETYPE=='DA' && this.DEL_RATE_TAR_FRT=='PP')
                             {
                              this.DueAgentTar=(Math.abs(this.DueAgentTar) - Math.abs(this.DEL_RATE_TAR)) ;
                              this.DueAgentNet=(Math.abs(this.DueAgentNet) - Math.abs(this.DEL_RATE_NET)) ;
                              this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR)) ;
                              this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET)) ;
                             }

                             if(this.DELCHARGETYPE=='DA' && this.DEL_RATE_TAR_FRT=='CC')
                             {
                              this.DueAgentTarCC=(Math.abs(this.DueAgentTarCC) - Math.abs(this.DEL_RATE_TAR)) ;
                              this.DueAgentNetCC=(Math.abs(this.DueAgentNetCC) - Math.abs(this.DEL_RATE_NET)) ;
                              this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR)) ;
                              this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET));
                             }
                             if(this.DELCHARGETYPE=='DC' && this.DEL_RATE_TAR_FRT=='PP')
                             {
                              this.DurCarrierTar=(Math.abs(this.DurCarrierTar) - Math.abs(this.DEL_RATE_TAR));
                              this.DurCarrierNet=(Math.abs(this.DurCarrierNet) -Math.abs(this.DEL_RATE_NET));
                              this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR));
                              this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET));
                             }
                             if(this.DELCHARGETYPE=='DC' && this.DEL_RATE_TAR_FRT=='CC')
                             {
                              this.DurCarrierTarCC=(Math.abs(this.DurCarrierTarCC) - Math.abs(this.DEL_RATE_TAR));
                              this.DurCarrierNetCC=(Math.abs(this.DurCarrierNetCC) - Math.abs(this.DEL_RATE_NET));
                              this.TotalTar=(Math.abs(this.TotalTar) - Math.abs(this.DEL_RATE_TAR)) ;
                              this.TotalNet=(Math.abs(this.TotalNet) - Math.abs(this.DEL_RATE_NET)) ;
                             }
                             this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT );
                             this._loaderService.display(false);
                             }
                             else {
                             this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT);
                             this._loaderService.display(false);
                             }


                     });
             }
             else{return false;
                 this._loaderService.display(false); }
         }

 GetChrges(chrgtype)
 {
     this.AirLineCharges =this.AllAirLineChargeslist.filter((code: any) => code.DataValueField.split("|")[1] === chrgtype);
 }
 changeNetRate(rate1) {
     this.RATE_NET=rate1;
    }
 changeNetFreight(frt1) {
     this.RATE_NET_FRT=frt1
    }
}

