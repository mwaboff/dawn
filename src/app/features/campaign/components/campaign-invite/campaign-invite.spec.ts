import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CampaignInvite } from './campaign-invite';

@Component({
  template: `<app-campaign-invite [campaignId]="campaignId()" />`,
  imports: [CampaignInvite],
})
class TestHost {
  campaignId = signal(1);
}

describe('CampaignInvite', () => {
  let fixture: ComponentFixture<TestHost>;
  let el: HTMLElement;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    el = fixture.nativeElement;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    expect(el.querySelector('app-campaign-invite')).toBeTruthy();
  });

  it('should show generate button initially', () => {
    expect(el.querySelector('.invite-generate-btn')).toBeTruthy();
  });

  it('should not show invite URL initially', () => {
    expect(el.querySelector('.invite-url-input')).toBeFalsy();
  });

  it('should show invite URL after generating', () => {
    (el.querySelector('.invite-generate-btn') as HTMLElement).click();

    const req = httpTesting.expectOne(r => r.url.includes('/invites'));
    req.flush({ token: 'abc123', campaignId: 1, expiresAt: '2026-01-02T00:00:00' });
    fixture.detectChanges();

    const input = el.querySelector('.invite-url-input') as HTMLInputElement;
    expect(input.value).toContain('/campaigns/join/abc123');
  });

  it('should show expiry note after generating', () => {
    (el.querySelector('.invite-generate-btn') as HTMLElement).click();

    const req = httpTesting.expectOne(r => r.url.includes('/invites'));
    req.flush({ token: 'xyz', campaignId: 1, expiresAt: '' });
    fixture.detectChanges();

    expect(el.querySelector('.invite-note')?.textContent).toContain('24 hours');
  });

  it('should show error on HTTP failure', () => {
    (el.querySelector('.invite-generate-btn') as HTMLElement).click();

    const req = httpTesting.expectOne(r => r.url.includes('/invites'));
    req.flush('Error', { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(el.querySelector('.invite-error')).toBeTruthy();
  });
});
