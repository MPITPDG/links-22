import { Component, OnInit,TemplateRef } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router} from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { OrderPipe } from 'ngx-order-pipe';
import { FilterPipe } from 'ngx-filter-pipe';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';

@Component({
    templateUrl: 'CN-Auth.component.html'
})
export class CNAuth implements OnInit {
  public searchString: string;

    Crtdata:any=[]
    newArray: any = [];
    order: string = 'CLIENTNAME';
    reverse: boolean = false;
    userFilter: any = { INV_CRTNO: '' };
    sortedCollection: any[];
    PageActual: number = 1;
    modalRef: BsModalRef;
    checkbox: boolean;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private modalService: BsModalService,
        private loaderService: LoaderService, private orderPipe: OrderPipe, private filterPipe: FilterPipe
    
      ) {  this.sortedCollection = orderPipe.transform(this.Crtdata, this.Crtdata.CLIENTNAME) }
    ngOnInit(): void {
       // console.log(this._loginService.getLogin()[0])
        this.loaderService.display(true)
        this.verifyPermission('387','View')
        this.getdataforauth()
      }
      verifyPermission(formId, userMode) {
        this.loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {         
               this._loginService.checkVerify(userMode, data);
               this.loaderService.display(false);
    
            });
    }
      getdataforauth(){
        const jsonmaster = {
          cmpid: this._loginService.getLogin()[0].CMPID,
          cmp_code: this._loginService.getLogin()[0].CMPCODE,
          RoleType:(this._loginService.getLogin()[0].ROLETYPE=='')? 'USER':this._loginService.getLogin()[0].ROLETYPE,
          Type: "CN"
        }
        this._dataService.getData("Accounts/ACC_invoice_auth_list", jsonmaster)
          .subscribe((data: any) => {
            this.Crtdata = data.Table;
            this.loaderService.display(false)
          })
      }
      getCheckboxValues(event, data) {
        var index = this.newArray.findIndex(x => x.inoiceno == data);
        if (event) {
          let obj = {
            inoiceno: data
          }
          this.newArray.push(obj);
        }
        else {
          this.newArray.splice(index, 1);
        }
      }

      authorisedata() {
        if (this.newArray == "" || this.newArray == undefined) {
          this._toasterService.toast('info', 'info', 'Select At Least One Crt No!');
          return false;
        }
        var output = this.newArray.map(function (item) {
          return item.inoiceno;
        });
        var datatry = output.join(",")
        var output1 = datatry
        const adddata = {
          NOSTR: output1,
          CMPID: this._loginService.getLogin()[0].CMPID,
          cmp_code: this._loginService.getLogin()[0].CMPCODE,
          citycode: this._loginService.getLogin()[0].CITYCODE,
          CHKAuthorityFlag: "1",
        }
        this._dataService.Common("Accounts/ACC_CN_Authorisation_Update", adddata)
          .subscribe((data: any) => {
            console.log(data)
            if (data.Table1[0].STATUSMSG !="") {
              this._toasterService.toast('success', 'success', data.Table1[0].STATUSMSG);
              this.getdataforauth()
            }
          })
    
      }
    
      setOrder(value: string) {
        if (this.order === value) {
          this.reverse = !this.reverse;
        }
        this.order = value;
      }
      checkAll(ev) {
        this.newArray = []
        this.Crtdata.forEach(x => x.Checked = ev.target.checked)
        if (ev.target.checked == true) {
          for (var i = 0; i < this.Crtdata.length; i++) {
            let obj = {
              inoiceno: this.Crtdata[i].INV_CRTNO
            }
            this.newArray.push(obj);
          }
        } else {
          this.newArray = []
        }
      }
    
      abortdata(){
        this.Crtdata.forEach(obj => {
          obj.Checked = false
        })
        this.checkbox=false;
        this.newArray=[]
      }
  
      crtviewdata(creditno) {
        if(creditno ==''||creditno==undefined || creditno.length < 15){
          alert("Enter 15 digit CreditNote No !")
          return false
        }
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/Account-CreditNote-View/' + creditno + '/' , "CreditNote View", toolbar);
    }
}