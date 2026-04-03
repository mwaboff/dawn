import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignPendingList } from './campaign-pending-list';
import { CampaignResponse, CharacterSheetSummary } from '../../../../shared/models/campaign-api.model';

function buildSheet(overrides: Partial<CharacterSheetSummary> = {}): CharacterSheetSummary {
  return {
    id: 20,
    name: 'Lyra',
    level: 2,
    ownerId: 3,
    ownerUsername: 'new_player',
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

function buildCampaign(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 1,
    name: 'Test',
    creatorId: 1,
    gameMasterIds: [1],
    playerIds: [],
    pendingCharacterSheetIds: [20],
    pendingCharacterSheets: [buildSheet()],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

@Component({
  template: `
    <app-campaign-pending-list
      [campaign]="campaign()"
      (approve)="approvedId = $event"
      (reject)="rejectedId = $event"
      (viewCharacter)="viewedId = $event"
    />
  `,
  imports: [CampaignPendingList],
})
class TestHost {
  campaign = signal(buildCampaign());
  approvedId: number | null = null;
  rejectedId: number | null = null;
  viewedId: number | null = null;
}

describe('CampaignPendingList', () => {
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
    expect(el.querySelector('app-campaign-pending-list')).toBeTruthy();
  });

  it('should display pending entries', () => {
    expect(el.querySelectorAll('.pending-entry').length).toBe(1);
  });

  it('should display character name', () => {
    expect(el.querySelector('.pending-name')?.textContent?.trim()).toBe('Lyra');
  });

  it('should display owner username', () => {
    expect(el.querySelector('.pending-owner')?.textContent?.trim()).toBe('by new_player');
  });

  it('should show empty state when no pending sheets', () => {
    host.campaign.set(buildCampaign({ pendingCharacterSheets: [], pendingCharacterSheetIds: [] }));
    fixture.detectChanges();

    expect(el.querySelector('.pending-list-empty')).toBeTruthy();
  });

  it('should emit approve when approve button is clicked', () => {
    (el.querySelector('.pending-approve-btn') as HTMLElement).click();

    expect(host.approvedId).toBe(20);
  });

  it('should emit reject when reject button is clicked', () => {
    (el.querySelector('.pending-reject-btn') as HTMLElement).click();

    expect(host.rejectedId).toBe(20);
  });

  it('should emit viewCharacter when entry is clicked', () => {
    (el.querySelector('.pending-entry') as HTMLElement).click();

    expect(host.viewedId).toBe(20);
  });
});
