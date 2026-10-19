import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { DataService } from './shared/service/dataService';
import { LoginService } from './shared/service/loginService';
import { LoaderService } from './shared/service/loader.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [
        provideRouter([]),
        LoaderService,
        // The root component only needs these injected, not called.
        { provide: DataService, useValue: {} },
        { provide: LoginService, useValue: {} },
      ],
      // <ui-toaster> (standalone, imported by AppModule) is not needed here.
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('turns route reuse off so every navigation rebuilds the screen', () => {
    TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    expect(router.routeReuseStrategy.shouldReuseRoute({} as any, {} as any)).toBe(false);
  });

  it('follows LoaderService for the loading overlay', fakeAsync(() => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    const loader = TestBed.inject(LoaderService);
    app.ngOnInit();
    tick();
    expect(app.showLoader).toBe(false);

    loader.display(true);
    tick();
    expect(app.showLoader).toBe(true);

    loader.display(false);
    tick();
    expect(app.showLoader).toBe(false);
  }));
});
