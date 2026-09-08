import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DataService } from '../shared/service/dataService';
import { AuthService } from '../shared/service/authService';
import { Router } from '@angular/router';
import { ToastCommonService } from '../shared/service/toastService';
import { LoginService } from '../shared/service/loginService';
import { environment } from '../../environments/environment';

@Component({
    templateUrl: 'module.component.html',
    styleUrls: ['module.component.css']
})
export class ModuleComponent implements OnInit {
    @ViewChild('selector', {static: false}) selector: ElementRef;
    public moduleData = [];

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService) { }

    ngOnInit() {
        // if (this._loginService.getLogin()[0].CITYCODE != 'LIL' || this._loginService.getLogin()[0].CITYCODE != 'PAR' ||this._loginService.getLogin()[0].COUNTRY != 'INDIA') 
        // {   
        //     this.modules('3','/export')
        // }
        this.moduleData = this.getModuleDataList();
        let deg = 360 / this.moduleData.length;
        for (let i = 0; i < this.moduleData.length; i++) {
            let d = i * deg;
            this.moduleData[i]["listyle"] = { 'transform': 'rotate(' + d + 'deg)' };
            this.moduleData[i]["labelstyle"] = { 'transform': 'rotate(-' + d + 'deg)' };
        }

       
    }

   
    modules(moduleid, url) {
        if (url != null) {
            // if  (moduleid != 1) {                 
            //     this._loginService.getLogin()[0].FINANCIAL_YEAR[0]= null;   }
            if (moduleid == 7) {
                this.externalUrl(7);
            }       
            else if  (moduleid == 2) {
                    if (this._loginService.getLogin()[0].CMPID=="1" )
                    {
                        this._loginService.setModuleModify(moduleid);
                        this._router.navigate([url]);
                    }
                    else
                    {
                        this._toasterService.toast("warning", "Alert", "No Access");
                    }
                }
             else {
                this._loginService.setModuleModify(moduleid);
                this._router.navigate([url]);
            }
        } else {
            this._toasterService.toast("warning", "Alert", "Working Under Process");
        }
    }


    externalUrl(moduleid) {
        if (moduleid == 7) { 
            let url = environment.edocumentIp 
            + "eDocument-Links/View.html#/AutoLogin?huhpnk=" + this._loginService.getLogin()[0].CMP_USERENCCODE 
            + "&cityname=" + this._loginService.getLogin()[0].CITYNAME
            + "&cmpcode=" + this._loginService.getLogin()[0].CMPCODE 
            + "&citycode=" + this._loginService.getLogin()[0].CITYCODE 
            + "&RoleType=" + this._loginService.getLogin()[0].ROLETYPE 
            + "&citycode1=" + this._loginService.getLogin()[0].CITYCODE1 
            + "&level=" + this._loginService.getLogin()[0].RIGHTS_CODE 
            + "&CurLogInIP=" + environment.edocumentIp + "edocument";
            window.open(url, "_blank");
        }
    }

    getModuleDataList() {
        let tmpArray = [];
        // if (this._loginService.getLogin()[0].CITYCODE === 'LIL' || this._loginService.getLogin()[0].CITYCODE === 'PAR') {
        //     tmpArray = [
        //         { id: 1, moduleid: 1, name: 'Finance', listyle: null, labelstyle: null, icon: 'fa fa-inr fa-2x', url: '/accounts-fra' },
        //         { id: 2, moduleid: 8, name: 'Master', listyle: null, labelstyle: null, icon: 'fa fa-plus-square fa-2x', url: '/master' },
        //         { id: 3, moduleid: 3, name: 'Export', listyle: null, labelstyle: null, icon: 'fa fa-exchange fa-2x', url: '/export' },
        //         { id: 4, moduleid: 10, name: 'Order', listyle: null, labelstyle: null, icon: 'fa fa-shopping-cart fa-2x', url: null },
        //         //{ id: 5, moduleid: 12, name: 'ICS', listyle: null, labelstyle: null, icon: 'fa fa-sitemap fa-2x', url: null },
        //         //{ id: 6, moduleid: 6, name: 'BHEL', listyle: null, labelstyle: null, icon: 'fa fa-tachometer fa-2x', url: null },
        //         { id: 7, moduleid: 11, name: 'Raise Ticket', listyle: null, labelstyle: null, icon: 'fa fa-ticket fa-2x', url: null },
        //         //{ id: 8, moduleid: 12, name: 'Profile', listyle: null, labelstyle: null, icon: 'fa fa-user-circle-o fa-2x', url: null },
        //         { id: 9, moduleid: 5, name: 'EDI/XML', listyle: null, labelstyle: null, icon: 'fa fa-comments-o fa-2x', url: null },
        //         { id: 10, moduleid: 7, name: 'E-Doc', listyle: null, labelstyle: null, icon: 'fa fa-folder-open fa-2x', url: '7' },
        //         { id: 11, moduleid: 9, name: 'Import', listyle: null, labelstyle: null, icon: 'fa fa-cubes fa-2x', url: '/importfra' },
        //         { id: 12, moduleid: 2, name: 'Admin', listyle: null, labelstyle: null, icon: 'fa fa-cogs fa-2x', url: null }
        //     ];
        // } else 
        if (this._loginService.getLogin()[0].COUNTRY === 'INDIA') {
            tmpArray = [
                { id: 1, moduleid: 1, name: 'Finance', listyle: null, labelstyle: null, icon: 'fa fa-inr fa-2x', url: '/accounts' },
                { id: 2, moduleid: 8, name: 'Master', listyle: null, labelstyle: null, icon: 'fa fa-plus-square fa-2x', url: '/master' },
                { id: 3, moduleid: 3, name: 'Export', listyle: null, labelstyle: null, icon: 'fa fa-exchange fa-2x', url: '/export' },
               // { id: 4, moduleid: 10, name: 'Order', listyle: null, labelstyle: null, icon: 'fa fa-shopping-cart fa-2x', url: null },
                //{ id: 5, moduleid: 12, name: 'ICS', listyle: null, labelstyle: null, icon: 'fa fa-sitemap fa-2x', url: null },
                //{ id: 6, moduleid: 6, name: 'BHEL', listyle: null, labelstyle: null, icon: 'fa fa-tachometer fa-2x', url: null },
               // { id: 7, moduleid: 11, name: 'Raise Ticket', listyle: null, labelstyle: null, icon: 'fa fa-ticket fa-2x', url: null },
                //{ id: 8, moduleid: 12, name: 'Profile', listyle: null, labelstyle: null, icon: 'fa fa-user-circle-o fa-2x', url: null },
                //{ id: 9, moduleid: 5, name: 'EDI/XML', listyle: null, labelstyle: null, icon: 'fa fa-comments-o fa-2x', url: null },
                { id: 10, moduleid: 7, name: 'E-Doc', listyle: null, labelstyle: null, icon: 'fa fa-folder-open fa-2x', url: '7' },
                { id: 11, moduleid: 4, name: 'Import', listyle: null, labelstyle: null, icon: 'fa fa-cubes fa-2x', url: '/import' },
                { id: 12, moduleid: 12, name: 'Admin', listyle: null, labelstyle: null, icon: 'fa fa-cogs fa-2x', url: '/admin' }
            ];
        }
        //  else {
        //     tmpArray = [
        //         { id: 2, moduleid: 8, name: 'Master', listyle: null, labelstyle: null, icon: 'fa fa-plus-square fa-2x', url: '/master' },
        //         { id: 3, moduleid: 3, name: 'Export', listyle: null, labelstyle: null, icon: 'fa fa-exchange fa-2x', url: '/export' },
        //         //{ id: 5, moduleid: 12, name: 'ICS', listyle: null, labelstyle: null, icon: 'fa fa-sitemap fa-2x', url: null },
        //         //{ id: 6, moduleid: 6, name: 'BHEL', listyle: null, labelstyle: null, icon: 'fa fa-tachometer fa-2x', url: null },
        //         { id: 7, moduleid: 11, name: 'Raise Ticket', listyle: null, labelstyle: null, icon: 'fa fa-ticket fa-2x', url: null },
        //         { id: 8, moduleid: 12, name: 'Profile', listyle: null, labelstyle: null, icon: 'fa fa-user-circle-o fa-2x', url: null },
        //         { id: 10, moduleid: 7, name: 'E-Doc', listyle: null, labelstyle: null, icon: 'fa fa-folder-open fa-2x', url: '7' }
        //     ];
        // }
        return tmpArray;
    }
}
