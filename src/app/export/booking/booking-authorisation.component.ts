import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { BookingAuthorisationService, BookingRow, AuthoriseResponse } from './booking-authorisation.service';

/*
  Export > Booking > Approval (route /export/Booking/authorisation).
  Ported from MPERPNG-20 booking-authorisation.component; replaces the unrouted
  Links Bookingauthorisation (booking_orderNo_authorisation). Kept from Links:
  the rights check (form 357, Add), the list / save calls (through
  BookingAuthorisationService -> DataService), the OrderNo+StyleNo string format
  and the toast messages. From MP: sortable list, select all / master checkbox,
  confirmation dialog listing the selected orders, load-failure state.
*/
@Component({
    selector: 'app-booking-authorisation',
    templateUrl: './booking-authorisation.component.html',
    styleUrls: ['./booking-authorisation.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BookingAuthorisationComponent implements OnInit, OnDestroy {

  /** Links page title, shown as the heading. */
  Header = 'HAPPYCHIC BOOKING AUTHORISATION';

  // ── State ──────────────────────────────────────────────
  allRows: BookingRow[] = [];       // master list from the API
  displayRows: BookingRow[] = [];   // sorted view

  isLoading = false;
  isSaving  = false;
  showModal = false;

  /* Distinguishes "the load failed" from "there is nothing to authorise";
     both used to render the same empty state. */
  loadFailed = false;
  loadErrorDetail = '';

  // ── Sort ───────────────────────────────────────────────
  sortColumn = 'CREATEDON';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  private destroy$ = new Subject<void>();

  // ── Derived counts ─────────────────────────────────────
  get totalCount(): number        { return this.allRows.length; }
  get authorisedCount(): number   { return this.allRows.filter(r => r.authorised).length; }
  get unauthorisedCount(): number { return this.allRows.filter(r => !r.authorised).length; }
  get selectedRows(): BookingRow[] { return this.allRows.filter(r => r.checked && !r.authorised); }
  get selectedCount(): number     { return this.selectedRows.length; }

  get masterChecked(): boolean {
    const pending = this.allRows.filter(r => !r.authorised);
    return pending.length > 0 && pending.every(r => r.checked);
  }
  get masterIndeterminate(): boolean {
    return this.selectedCount > 0 && !this.masterChecked;
  }

  constructor(
    private svc: BookingAuthorisationService,
    private _loginService: LoginService,
    private _toaster: ToastCommonService,
  ) { }

  ngOnInit() {
    this._loginService.verifyRights(357, '')
      .subscribe((data: any) => {
        this._loginService.checkVerify('Add', data);
      });
    this.bindgrid();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Load (Links BindList) ──────────────────────────────
  bindgrid() {
    const login = this._loginService.getLogin()[0];
    this.isLoading = true;
    this.loadFailed = false;
    this.loadErrorDetail = '';

    this.svc.getUnauthorisedBookings(login.CMPID, login.CMPCODE, login.ROLETYPE)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (rows: BookingRow[] | null) => {
          this.isLoading = false;
          if (!rows) {
            // 200 without a booking list: say so rather than show "nothing to authorise".
            this.loadFailed = true;
            this.loadErrorDetail = 'The server responded without a booking list.';
            this.allRows = [];
          } else {
            this.allRows = rows.map(r => ({
              ...r,
              authorised: String(r.AUTHORISED_FLAG ?? '') === '1',
              checked: false
            }));
          }
          this.applySort();
        },
        (err: any) => {
          this.isLoading = false;
          this.loadFailed = true;
          this.loadErrorDetail = (err && err.status)
            ? ('HTTP ' + err.status + (err.statusText ? ' ' + err.statusText : ''))
            : 'The server could not be reached.';
          this.allRows = [];
          this.applySort();
        });
  }

  retryLoad() { this.bindgrid(); }

  // ── Checkbox helpers ───────────────────────────────────
  toggleRow(row: BookingRow) {
    if (!row.authorised) { row.checked = !row.checked; }
  }

  toggleMaster(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.allRows.filter(r => !r.authorised).forEach(r => r.checked = checked);
  }

  selectAll()   { this.allRows.filter(r => !r.authorised).forEach(r => r.checked = true); }
  deselectAll() { this.allRows.forEach(r => r.checked = false); }

  // ── Sort ───────────────────────────────────────────────
  private readonly dateCols = [
    'BOOKINGON', 'DOCSEXPECT', 'APPROVALEXPECT', 'CARGOEXPECT',
    'ETD_ORIGIN', 'TRANS_ETA', 'TRANS_ETD', 'ETA_DEST', 'CREATEDON'
  ];

  sortBy(col: string) {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'ASC';
    }
    this.applySort();
  }

  applySort() {
    const dir = this.sortDirection === 'ASC' ? 1 : -1;
    const isDate = this.dateCols.includes(this.sortColumn);
    this.displayRows = [...this.allRows].sort((a, b) => {
      const av = (a as any)[this.sortColumn] || '';
      const bv = (b as any)[this.sortColumn] || '';
      if (isDate) {
        return (this.parseDate(av) - this.parseDate(bv)) * dir;
      }
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }

  /** Accepts "22/06/2026", "22-Jun-2026 18:02:23" and ISO dates; 0 when unparseable. */
  parseDate(val: string): number {
    if (!val) { return 0; }
    const slash = String(val).match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (slash) {
      return new Date(`${slash[3]}-${slash[2]}-${slash[1]}`).getTime();
    }
    const dash = String(val).match(/^(\d{2})-([A-Za-z]{3})-(\d{4})/);
    if (dash) {
      return new Date(`${dash[2]} ${dash[1]}, ${dash[3]}`).getTime();
    }
    const t = Date.parse(val);
    return isNaN(t) ? 0 : t;
  }

  getSortClass(col: string): string {
    if (this.sortColumn !== col) { return 'sort-both'; }
    return this.sortDirection === 'ASC' ? 'sort-asc' : 'sort-desc';
  }

  // ── Confirm dialog ─────────────────────────────────────
  openConfirmModal() {
    if (this.selectedCount === 0) {
      this._toaster.toast('warning', 'warning', 'No Data For Save -- Please Check');
      return;
    }
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  // ── Authorise (Links Add_data) ─────────────────────────
  authorise() {
    // OrderNo+StyleNo per selected row, comma separated with a trailing comma (as Links built it).
    const ordStyleStr = this.selectedRows.map(r => `${r.ORDERNO}${r.STYLENO}`).join(',') + ',';
    const login = this._loginService.getLogin()[0];
    this.isSaving = true;

    this.svc.authoriseBookings(login.CMPCODE, login.CITYCODE, ordStyleStr, login.CMPID)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (res: AuthoriseResponse) => {
          this.isSaving = false;
          this.closeModal();
          if (res.STATUS == '100') {
            this._toaster.toast('success', 'success', res.STATUSMSG);
            this.deselectAll();
            this.bindgrid();
          } else if (res.STATUS == '101') {
            this._toaster.toast('warning', 'warning', 'Record Cannot Be Added. Please Contact System Administrator');
          } else if (res.STATUS == '103') {
            this._toaster.toast('warning', 'warning', 'Record Already Assigned to User . -- Please Check ');
          } else {
            this._toaster.toast('error', 'Error', res.STATUSMSG || 'Unexpected response from the server.');
          }
        },
        (err: any) => {
          this.isSaving = false;
          this.closeModal();
          this._toaster.toast('error', 'Error', (err && err.status) ? ('HTTP ' + err.status + ' ' + (err.statusText || '')) : 'Authorisation failed.');
        });
  }

  // ── Abort: clears the selection and reloads (Links RestMain) ──
  abort() {
    this.deselectAll();
    this.bindgrid();
  }
}
