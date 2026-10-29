import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { KycService } from './kyc.service';

/**
 * Master > Request > KYC documents: every pending client / supplier request with its KYC progress and
 * how long it has been waiting (red after twice the agreed time). Ops upload KYC files here; Accounts
 * verify or return them. Route kyc/:PartyType/:Code (PartyType A = both, Code ' ' = none selected).
 */
@Component({
    selector: 'app-kyc-requests',
    templateUrl: 'kyc-requests.component.html',
    styleUrls: ['./request-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class KycRequestsComponent implements OnInit {
    partyType: string = '';       // '' both, E client, S supplier
    status: string = '';          // '' all, P, R, V
    list: any[] = [];
    loaded: boolean = false;
    selType: string = '';
    selCode: string = '';
    selStatus: string = '';

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _kyc: KycService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService
    ) { }

    ngOnInit() {
        this._activatedRoute.params.subscribe(params => {
            const t = (params['PartyType'] || 'A').trim();
            const c = (params['Code'] || '').trim();
            this.partyType = (t == 'E' || t == 'S') ? t : '';
            if (c != '') { this.selType = this.partyType || 'E'; this.selCode = c; }
            this.load();
        });
    }

    load() {
        this.loaderService.display(true);
        this._kyc.requestList(this.partyType, this.status).subscribe((data: any) => {
            this.loaderService.display(false);
            this.loaded = true;
            this.list = (data && data.Table) ? data.Table : [];
        }, () => { this.loaderService.display(false); this.loaded = true; });
    }

    select(r: any) {
        this.selType = r.PARTY_TYPE;
        this.selCode = r.REQ_CODE;
    }

    onPanelStatus(st: string) {
        this.selStatus = st;
        // keep the list in step with what was just uploaded / verified
        const row = this.list.find(r => r.PARTY_TYPE == this.selType && r.REQ_CODE == this.selCode);
        if (row && row.KYC_STATUS != st) { this.load(); }
    }

    /** request screen, where a user with Modify on the master authorises once KYC is verified */
    openRequest() {
        const page = this.selType == 'S' ? 'supplier' : 'client';
        this._router.navigate(['/master/request/' + page + '/TEMP/' + this.selCode]);
    }

    get pending(): number { return this.list.filter(r => r.KYC_STATUS != 'V').length; }
    get late(): number { return this.list.filter(r => r.AGE_FLAG == 'RED' || r.AGE_FLAG == 'AMBER').length; }
}
