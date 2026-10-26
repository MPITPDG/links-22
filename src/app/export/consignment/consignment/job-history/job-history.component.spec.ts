import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { DataService } from '../../../../shared/service/dataService';
import { LoginService } from '../../../../shared/service/loginService';
import { JobHistoryComponent } from './job-history.component';

// Synthetic fixtures only: no real job numbers, users or customers.
describe('JobHistoryComponent', () => {
    let answer: any;
    let calls: { api: string; body: any }[];
    let fixture: ComponentFixture<JobHistoryComponent>;

    const ready = () => ({
        Table: [{ STATUS: '100', STATUSTEXT: '', EXPTNO: 'TEST-JOB-1', CMPCODE: '9', CITYCODE: 'TST', CREATED_BY: '7', CREATED_BY_NAME: 'Alice Admin', DOCRECD: '04-03-2026', EVENTS: 2 }],
        Table1: [
            { SRC: 'JOB', EVENT_ID: 1, EVENT_DT: '2026-03-04T10:00:00', USER_ID: '7', USER_NAME: 'Alice Admin', MODE: 'ADD', TABLENAME: 'EXPT_MASTER',
              COLUMNNAME: 'EXPTNO|EXPT_MODE|EXPT_POD|', ORIGINALDATA: 'TEST-JOB-1|SEA|PORT-A|', MODIFIEDDATA: '', IP: '10.0.0.1', RECORD_ID: '11' },
            { SRC: 'JOB', EVENT_ID: 2, EVENT_DT: '2026-03-05T09:00:00', USER_ID: '8', USER_NAME: 'Bob Booker', MODE: 'EDIT', TABLENAME: 'EXPT_MASTER',
              COLUMNNAME: 'EXPTNO|EXPT_POD|', ORIGINALDATA: 'TEST-JOB-1|PORT-A|', MODIFIEDDATA: 'TEST-JOB-1|PORT-B|', IP: '10.0.0.2', RECORD_ID: '11' }
        ]
    });

    function make(): ComponentFixture<JobHistoryComponent> {
        calls = [];
        TestBed.configureTestingModule({
            declarations: [JobHistoryComponent],
            imports: [FormsModule],
            providers: [
                {
                    provide: DataService, useValue: {
                        Common: (api: string, body: any) => {
                            calls.push({ api, body });
                            return answer instanceof Error ? throwError(() => answer) : of(answer);
                        }
                    }
                },
                { provide: LoginService, useValue: { getLogin: () => [{ CMPID: 7, ROLETYPE: 'SA' }] } }
            ]
        });
        fixture = TestBed.createComponent(JobHistoryComponent);
        fixture.componentRef.setInput('exptno', 'TEST-JOB-1');
        fixture.detectChanges();
        return fixture;
    }

    function open() {
        fixture.componentRef.setInput('open', true);
        fixture.detectChanges();
    }

    const shown = () => ((fixture.nativeElement as HTMLElement).textContent || '').replace(/\s+/g, ' ');

    afterEach(() => { if (fixture) { fixture.destroy(); } });

    it('does not call the API before the card is opened', () => {
        answer = ready();
        make();
        expect(calls.length).toBe(0);
        expect(shown()).toContain('The history loads when this section comes into view.');
    });

    it('loads once when opened and shows the Created card and the changes', () => {
        answer = ready();
        make();
        open();
        expect(calls).toEqual([{ api: 'Export/JobHistory', body: { ExptNo: 'TEST-JOB-1', UserId: '7' } }]);
        const t = shown();
        expect(t).toContain('04-03-2026 10:00');
        expect(t).toContain('by Alice Admin (7)');
        expect(t).toContain('Mode of shipment');
        expect(t).toContain('PORT-A');
        expect(t).toContain('Bob Booker (8)');
        expect(t).toContain('Port of discharge');
        expect(t).toContain('PORT-B');
        expect(t).toContain('1 session · 1 field change');
        fixture.componentRef.setInput('open', false);
        fixture.detectChanges();
        open();
        expect(calls.length).toBe(1);
    });

    it('filters the timeline and says when nothing matches', () => {
        answer = ready();
        make();
        open();
        const box = (fixture.nativeElement as HTMLElement).querySelector('#jhSearch') as HTMLInputElement;
        box.value = 'nothing like this';
        box.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        expect(fixture.componentInstance.filter.q).toBe('nothing like this');
        expect(shown()).toContain('No entries match the filters.');
        const clear = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
            .find(b => (b.textContent || '').indexOf('Clear filters') >= 0) as HTMLButtonElement;
        clear.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.filter.q).toBe('');
        expect(shown()).toContain('PORT-B');
    });

    it('fails soft when the API is not there yet', () => {
        answer = new Error('404');
        make();
        open();
        expect(shown()).toContain('History is not deployed yet.');
    });

    it('shows the procedure\'s text to a user who is not an administrator', () => {
        answer = { Table: [{ STATUS: '104', STATUSTEXT: 'Only administrators can see job history.' }] };
        make();
        open();
        expect(shown()).toContain('Only administrators can see job history.');
    });

    it('says when a job has no history', () => {
        answer = { Table: [{ STATUS: '100', STATUSTEXT: '', EXPTNO: 'TEST-JOB-1', EVENTS: 0 }], Table1: [] };
        make();
        open();
        expect(shown()).toContain('No history recorded for this job.');
    });

    it('reloads for another job', () => {
        answer = ready();
        make();
        open();
        fixture.componentRef.setInput('exptno', 'TEST-JOB-2');
        fixture.detectChanges();
        expect(calls.map(c => c.body.ExptNo)).toEqual(['TEST-JOB-1', 'TEST-JOB-2']);
    });
});
