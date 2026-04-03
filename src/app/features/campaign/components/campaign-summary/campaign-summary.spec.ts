import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignSummary } from './campaign-summary';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';

function buildCampaign(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 1,
    name: 'Test Campaign',
    creatorId: 1,
    creator: { id: 1, username: 'gm_user', email: '', role: 'USER', createdAt: '', lastModifiedAt: '' },
    gameMasterIds: [1],
    playerIds: [],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

@Component({
  template: `<app-campaign-summary [campaign]="campaign()" />`,
  imports: [CampaignSummary],
})
class TestHost {
  campaign = signal(buildCampaign());
}

describe('CampaignSummary', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(el.querySelector('app-campaign-summary')).toBeTruthy();
  });

  it('should display campaign name', () => {
    host.campaign.set(buildCampaign({ name: 'Dragon Slayers' }));
    fixture.detectChanges();

    expect(el.querySelector('.summary-name')?.textContent?.trim()).toBe('Dragon Slayers');
  });

  it('should display GM username', () => {
    expect(el.querySelector('.summary-gm')?.textContent).toContain('gm_user');
  });

  it('should display description when present', () => {
    host.campaign.set(buildCampaign({ description: 'An epic adventure' }));
    fixture.detectChanges();

    expect(el.querySelector('.summary-description')?.textContent?.trim()).toBe('An epic adventure');
  });

  it('should not display description when absent', () => {
    expect(el.querySelector('.summary-description')).toBeFalsy();
  });

  it('should show ended badge when campaign is ended', () => {
    host.campaign.set(buildCampaign({ deletedAt: '2026-03-01T00:00:00' }));
    fixture.detectChanges();

    expect(el.querySelector('.summary-badge-ended')).toBeTruthy();
  });

  it('should not show ended badge for active campaign', () => {
    expect(el.querySelector('.summary-badge-ended')).toBeFalsy();
  });
});
