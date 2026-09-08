import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
@Component({
    selector: 'app-consignment-remark-view',
    template: `
            				<table class="table table-bordered table-striped table-sm-new bgwhite">
							   <tbody>
								  <tr>
									 <td class="col-form-span-heading centerlabel" colspan="6">CONSIGNMENT DETAILS (REMARKS) </td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><b>EXPORT NO</b></span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{exptno}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><b>Consignee Remark</b></span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{remarkData?.CON_REMARK}}</span></td>
								  </tr>
								  <tr>
									 <td class="width150"><span class="col-form-span-label"><b>Our Remark</b></span> </td>
									 <td colspan="3"><span class="col-form-span-label">{{remarkData?.OUR_REMARK}}</span></td>
								  </tr>
								</tbody>
							</table>
        `
})
export class RemarkViewComponent implements OnInit {
    exptno: string;
    remarkData: any;
	constructor(private _route: ActivatedRoute,
		private _dataService: DataService,
		private _loginService: LoginService) { }
    ngOnInit() {
        this._route.params.subscribe(params => {
            this.exptno = params["exptno"];
			this.setRemarkData(this.exptno);
        });
	}
	
	setRemarkData(exptno) {
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.Common("Export/ConsignmentView", _jsonData)
            .subscribe((data: any) => {
				this.remarkData = { 
					CON_REMARK: data.Table[0].CON_REMARK, 
					OUR_REMARK: data.Table[0].OUR_REMARK
				};
            });
    }
}