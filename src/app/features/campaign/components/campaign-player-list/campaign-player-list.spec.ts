import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignPlayerList } from './campaign-player-list';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';

function buildCampaign(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 1,
    name: 'Test',
    creatorId: 1,
    gameMasterIds: [1],
    gameMasters: [{ id: 1, username: 'gm_user', email: '', role: 'USER', createdAt: '', lastModifiedAt: '', usernameChosen: true }],
    playerIds: [2],
    players: [{ id: 2, username: 'player1', email: '', role: 'USER', createdAt: '', lastModifiedAt: '', usernameChosen: true }],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    isEnded: false,
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

@Component({
  template: `
    <app-campaign-player-list
      [campaign]="campaign()"
      [canManage]="canManage()"
      [confirmingKickId]="confirmingKickId()"
      (kickPlayer)="kickedId = $event"
      (viewPlayer)="viewedId = $event"
      (cancelKick)="cancelCalled = true"
    />
  `,
  imports: [CampaignPlayerList],
})
class TestHost {
  campaign = signal(buildCampaign());
  canManage = signal(false);
  confirmingKickId = signal<number | null>(null);
  kickedId: number | null = null;
  viewedId: number | null = null;
  cancelCalled = false;
}

describe('CampaignPlayerList', () => {
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
    expect(el.querySelector('app-campaign-player-list')).toBeTruthy();
  });

it('should display GM badge', () => {
    expect(el.querySelector('.player-badge-gm')?.textContent?.trim()).toBe('Game Master');
  });

  it('should display player entries', () => {
    expect(el.querySelectorAll('.player-entry').length).toBe(2);
  });

  it('should display player username', () => {
    const names = el.querySelectorAll('.player-name');
    const texts = Array.from(names).map(n => n.textContent?.trim());

    expect(texts).toContain('player1');
  });

  it('should not show remove button when canManage is false', () => {
    expect(el.querySelector('.player-remove-btn')).toBeFalsy();
  });

  it('should show remove button for non-GM when canManage is true', () => {
    host.canManage.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.player-remove-btn')).toBeTruthy();
  });

  it('should emit kickPlayer when remove is clicked', () => {
    host.canManage.set(true);
    fixture.detectChanges();
    (el.querySelector('.player-remove-btn') as HTMLElement).click();

    expect(host.kickedId).toBe(2);
  });

  it('should show confirmation when confirmingKickId matches', () => {
    host.canManage.set(true);
    host.confirmingKickId.set(2);
    fixture.detectChanges();

    expect(el.querySelector('.player-confirm-text')?.textContent).toContain('Remove player1');
  });

  it('should emit cancelKick when cancel is clicked', () => {
    host.canManage.set(true);
    host.confirmingKickId.set(2);
    fixture.detectChanges();
    (el.querySelector('.player-confirm-cancel') as HTMLElement).click();

    expect(host.cancelCalled).toBe(true);
  });

  it('should emit viewPlayer when entry is clicked', () => {
    (el.querySelectorAll('.player-entry')[1] as HTMLElement).click();

    expect(host.viewedId).toBe(2);
  });

  it('should show empty state when no players', () => {
    host.campaign.set(buildCampaign({ gameMasters: [], players: [], gameMasterIds: [], playerIds: [] }));
    fixture.detectChanges();

    expect(el.querySelector('.player-list-empty')).toBeTruthy();
  });
});
