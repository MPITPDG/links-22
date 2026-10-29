import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { KycService } from './kyc.service';

/**
 * Master > KYC document rules: Accounts choose which eDocument document titles are mandatory for a
 * new client / supplier (all, India only or overseas only) and add titles. Editing needs Modify on
 * KYC VERIFICATION; everyone else sees the list read-only.
 */
@Component({
    selector: 'app-kyc-rules',
    templateUrl: 'kyc-rules.component.html',
    styleUrls: ['./request-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class KycRulesComponent implements OnInit {
    partyType: string = 'E';
    rules: any[] = [];
    info: any = null;
    canEdit: boolean = false;
    newTitle: string = '';

    constructor(private _kyc: KycService, private _toasterService: ToastCommonService, private loaderService: LoaderService) { }

    ngOnInit() { this.load(); }

    load() {
        this.loaderService.display(true);
        this._kyc.ruleList(this.partyType).subscribe((data: any) => {
            this.loaderService.display(false);
            this.info = (data && data.Table && data.Table.length > 0) ? data.Table[0] : null;
            this.canEdit = this.info != null && this.info.CAN_EDIT == 'Y';
            this.rules = (data && data.Table1) ? data.Table1 : [];
        }, () => { this.loaderService.display(false); });
    }

    save(r: any) {
        this._kyc.ruleSave(this.partyType, r.PK_DOCUMENTID, r.IS_MANDATORY, r.REGION).subscribe((data: any) => {
            if (data.Table[0].STATUS == '100') { this._toasterService.toast('success', 'success', r.DOCUMENTNAME + ' saved.'); }
            else { this._toasterService.toast('warning', 'warning', data.Table[0].STATUSTEXT); this.load(); }
        });
    }

    toggleMandatory(r: any, checked: boolean) {
        r.IS_MANDATORY = checked ? 'Y' : 'N';
        this.save(r);
    }

    addTitle() {
        if (this.newTitle.trim() == '') { this._toasterService.toast('warning', 'warning', 'Type the document title.'); return; }
        this._kyc.titleAdd(this.partyType, this.newTitle).subscribe((data: any) => {
            if (data.Table[0].STATUS == '100') { this.newTitle = ''; this.load(); }
            else { this._toasterService.toast('warning', 'warning', data.Table[0].STATUSTEXT); }
        });
    }

    get mandatoryCount(): number { return this.rules.filter(r => r.IS_MANDATORY == 'Y').length; }
}
