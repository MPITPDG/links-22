import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CustomInterceptor } from './dataService';

/** CustomInterceptor: JSON for ordinary calls, but uploads (FormData / Blob / URLSearchParams) keep their own Content-Type. */
describe('CustomInterceptor', () => {
    let http: HttpClient;
    let backend: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
                { provide: HTTP_INTERCEPTORS, useClass: CustomInterceptor, multi: true },
            ],
        });
        http = TestBed.inject(HttpClient);
        backend = TestBed.inject(HttpTestingController);
    });

    afterEach(() => backend.verify());

    it('sets JSON on an ordinary object body', () => {
        http.post('/api/x', { a: 1 }).subscribe();
        const req = backend.expectOne('/api/x');
        expect(req.request.headers.get('Content-Type')).toBe('application/json');
        expect(req.request.headers.get('Accept')).toBe('application/json');
        req.flush({});
    });

    it('leaves a FormData upload alone, so the browser sends multipart with its boundary', () => {
        const fd = new FormData();
        fd.append('file', new Blob(['x']), 'a.txt');
        http.post('/api/upload', fd).subscribe();
        const req = backend.expectOne('/api/upload');
        expect(req.request.headers.has('Content-Type')).toBeFalse();
        expect(req.request.body instanceof FormData).toBeTrue();
        req.flush({});
    });

    it('leaves Blob and URLSearchParams bodies alone', () => {
        http.post('/api/blob', new Blob(['x'], { type: 'text/plain' })).subscribe();
        http.post('/api/form', new URLSearchParams({ a: '1' })).subscribe();
        const b = backend.expectOne('/api/blob'), f = backend.expectOne('/api/form');
        expect(b.request.headers.has('Content-Type')).toBeFalse();
        expect(f.request.headers.has('Content-Type')).toBeFalse();
        b.flush({}); f.flush({});
    });

    it('keeps a Content-Type the caller set itself', () => {
        http.post('/api/y', 'raw', { headers: { 'Content-Type': 'text/plain' } }).subscribe();
        const req = backend.expectOne('/api/y');
        expect(req.request.headers.get('Content-Type')).toBe('text/plain');
        req.flush({});
    });
});
