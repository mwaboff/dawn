import { describe, it, expect } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CampaignJoin } from './campaign-join';

describe('CampaignJoin', () => {
  let component: CampaignJoin;
  let fixture: ComponentFixture<CampaignJoin>;
  let httpMock: HttpTestingController;

  function setup(token = 'test-token'): void {
    TestBed.configureTestingModule({
      imports: [CampaignJoin],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ token }),
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(CampaignJoin);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('should show joining state on init', () => {
    setup();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Joining campaign...');
    expect(component.joining()).toBe(true);

    httpMock.expectOne('http://localhost:8080/api/campaigns/join/test-token').flush({});
  });

  it('should call joinCampaign with token from route', () => {
    setup('abc-123');
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:8080/api/campaigns/join/abc-123');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should show success state with campaign name', () => {
    setup();
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:8080/api/campaigns/join/test-token');
    req.flush({ campaignId: 'camp-1', campaignName: 'Dragon Slayers', role: 'PLAYER' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dragon Slayers');
    expect(compiled.textContent).toContain('Welcome to the Party');
    expect(component.joining()).toBe(false);
    expect(component.result()).toBeTruthy();
  });

  it('should show View Campaign link pointing to correct campaign', () => {
    setup();
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:8080/api/campaigns/join/test-token');
    req.flush({ campaignId: 'camp-42', campaignName: 'Test Campaign', role: 'PLAYER' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[href="/campaign/camp-42"]');
    expect(link).toBeTruthy();
    expect(link?.textContent?.trim()).toBe('View Campaign');
  });

  it('should show expired error for 400 responses', () => {
    setup();
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:8080/api/campaigns/join/test-token');
    req.flush({ message: 'Expired' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Invite Expired');
    expect(compiled.textContent).toContain('expired or has already been used');
    expect(component.error()).toBe('expired');
  });

  it('should show unauthorized error for 401 responses', () => {
    setup();
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:8080/api/campaigns/join/test-token');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Sign In Required');
    expect(component.error()).toBe('unauthorized');
  });

  it('should show invalid error for 404 responses', () => {
    setup();
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:8080/api/campaigns/join/test-token');
    req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Invalid Invite');
    expect(component.error()).toBe('not-found');
  });

  it('should show generic error for other failures', () => {
    setup();
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:8080/api/campaigns/join/test-token');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Something Went Wrong');
    expect(component.error()).toBe('unknown');
  });

  it('should show Go to Campaigns link on error', () => {
    setup();
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:8080/api/campaigns/join/test-token');
    req.flush({ message: 'Error' }, { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[href="/campaigns"]');
    expect(link).toBeTruthy();
    expect(link?.textContent?.trim()).toBe('Go to Campaigns');
  });
});
