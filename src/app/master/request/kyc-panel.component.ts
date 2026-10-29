import { Component, EventEmitter, Input, OnChanges, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { ToastCommonService } from '../../shared/service/toastService';
import { KycService } from './kyc.service';

/**
 * KYC of one client / supplier request (or existing party): document checklist, upload to eDocument,
 * files, verify / return to Ops. Used on the KYC documents screen and on the request screens.
 * Emits the KYC status (P / R / V) every time it loads, so a request screen can hold Submit back.
 */
@Component({
    selector: 'app-kyc-panel',
    templateUrl: 'kyc-panel.component.html',
    styleUrls: ['./request-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class KycPanelComponent implements OnChanges {
    @Input() partyType: string = 'E';
    @Input() code: string = '';
    @Output() statusChange = new EventEmitter<string>();
    @ViewChild('kycFile') kycFileInput: any;

    hdr: any = null;
    docs: any[] = [];
    files: any[] = [];
    hist: any[] = [];
    message: string = '';
    loading: boolean = false;
    busy: boolean = false;
    showHist: boolean = false;

    selDoc: string = '';
    upRemark: string = '';
    upFile: File = null;
    verifyRemark: string = '';

    constructor(private _kyc: KycService, private _toasterService: ToastCommonService) { }

    ngOnChanges() { this.load(); }

    load() {
        this.hdr = null; this.docs = []; this.files = []; this.hist = []; this.message = '';
        if (!this.code || this.code.trim() == '') { return; }
        this.loading = true;
        // 'X' = no KYC shown (not set up / not found / error): the screen does not hold Submit back,
        // the API check on authorise decides
        this._kyc.status(this.partyType, this.code).subscribe((data: any) => {
            this.loading = false;
            if (!data || !data.Table || data.Table.length == 0 || data.Table[0].STATUS == null) {
                this.message = 'KYC is not set up yet (database script KYC_01_SETUP not run).';
                this.statusChange.emit('X');
                return;
            }
            if (data.Table[0].STATUS != '100') {
                this.message = data.Table[0].STATUSTEXT;
                this.statusChange.emit('X');
                return;
            }
            this.hdr = data.Table[0];
            this.docs = data.Table1 || [];
            this.files = data.Table2 || [];
            this.hist = data.Table3 || [];
            this.statusChange.emit(this.hdr.KYC_STATUS);
        }, () => { this.loading = false; this.message = 'KYC could not be loaded.'; this.statusChange.emit('X'); });
    }

    get locked(): boolean { return this.hdr != null && this.hdr.KYC_STATUS == 'V'; }
    get canVerify(): boolean { return this.hdr != null && this.hdr.CAN_VERIFY == 'Y'; }
    get late(): boolean {
        return this.hdr != null && this.hdr.AGE_HOURS != null && !this.locked && Number(this.hdr.AGE_HOURS) > Number(this.hdr.SLA_HOURS);
    }

    onFile(event: any) {
        this.upFile = (event.target.files && event.target.files.length > 0) ? event.target.files[0] : null;
    }

    upload() {
        if (this.selDoc == '') { this._toasterService.toast('warning', 'warning', 'Choose the document title.'); return; }
        if (this.upFile == null) { this._toasterService.toast('warning', 'warning', 'Choose the file to upload.'); return; }
        if (this.upFile.size > 10 * 1024 * 1024) { this._toasterService.toast('warning', 'warning', 'The file is larger than 10 MB.'); return; }
        this.busy = true;
        this._kyc.upload(this.partyType, this.hdr.CODE, this.selDoc, this.upRemark, this.upFile).subscribe((data: any) => {
            this.busy = false;
            if (data && data.Table && data.Table.length > 0 && data.Table[0].STATUS == '100') {
                this._toasterService.toast('success', 'success', 'File uploaded to eDocument.');
                this.selDoc = ''; this.upRemark = ''; this.upFile = null;
                if (this.kycFileInput) { this.kycFileInput.nativeElement.value = ''; }
                this.load();
            } else {
                this._toasterService.toast('warning', 'warning', (data && data.Table && data.Table.length > 0) ? data.Table[0].STATUSTEXT : 'Upload failed.');
            }
        }, () => { this.busy = false; this._toasterService.toast('warning', 'warning', 'Upload failed.'); });
    }

    removeFile(f: any) {
        if (!confirm('Remove ' + f.ACTUAL_FILENAME + ' from this KYC?')) { return; }
        this._kyc.removeFile(this.partyType, this.hdr.CODE, f.PK_UPLOADID).subscribe((data: any) => {
            if (data.Table[0].STATUS == '100') { this.load(); }
            else { this._toasterService.toast('warning', 'warning', data.Table[0].STATUSTEXT); }
        });
    }

    /** V = verify, R = return to Ops */
    decide(action: string) {
        if (action == 'R' && this.verifyRemark.trim() == '') {
            this._toasterService.toast('warning', 'warning', 'Write what is missing or wrong before returning the KYC.');
            return;
        }
        if (action == 'V' && !confirm('Confirm the KYC documents of ' + this.hdr.PARTY_NAME + ' are checked and correct?')) { return; }
        this.busy = true;
        this._kyc.verify(this.partyType, this.hdr.CODE, action, this.verifyRemark).subscribe((data: any) => {
            this.busy = false;
            if (data.Table[0].STATUS == '100') {
                this._toasterService.toast('success', 'success', data.Table[0].STATUSTEXT);
                this.verifyRemark = '';
                this.load();
            } else {
                this._toasterService.toast('warning', 'warning', data.Table[0].STATUSTEXT);
            }
        }, () => { this.busy = false; });
    }

    fileUrl(f: any): string { return this._kyc.fileUrl(f.FILEPATH); }
}
