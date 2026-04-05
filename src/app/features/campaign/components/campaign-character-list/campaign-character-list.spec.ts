import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignCharacterList } from './campaign-character-list';
import { CampaignResponse, CampaignCharacterSheet, CampaignCharacterSummary } from '../../../../shared/models/campaign-api.model';

function buildCharacter(overrides: Partial<CampaignCharacterSheet> = {}): CampaignCharacterSheet {
  return {
    id: 10,
    name: 'Kael',
    level: 3,
    ownerId: 2,
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

function buildSummary(overrides: Partial<CampaignCharacterSummary> = {}): CampaignCharacterSummary {
  return {
    id: 10,
    name: 'Kael',
    level: 3,
    ownerId: 2,
    ownerUsername: 'player1',
    ancestryNames: [],
    classNames: [],
    subclassNames: [],
    ...overrides,
  };
}

function buildCampaign(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 1,
    name: 'Test',
    creatorId: 1,
    gameMasterIds: [1],
    playerIds: [2],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [10],
    playerCharacters: [buildCharacter()],
    nonPlayerCharacterIds: [],
    isEnded: false,
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

@Component({
  template: `
    <app-campaign-character-list
      [campaign]="campaign()"
      [canManage]="canManage()"
      [confirmingRemoveId]="confirmingRemoveId()"
      [characterSummaries]="characterSummaries()"
      (removeCharacter)="removedId = $event"
      (viewCharacter)="viewedId = $event"
      (cancelRemove)="cancelCalled = true"
    />
  `,
  imports: [CampaignCharacterList],
})
class TestHost {
  campaign = signal(buildCampaign());
  canManage = signal(false);
  confirmingRemoveId = signal<number | null>(null);
  characterSummaries = signal<CampaignCharacterSummary[]>([]);
  removedId: number | null = null;
  viewedId: number | null = null;
  cancelCalled = false;
}

describe('CampaignCharacterList', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(el.querySelector('app-campaign-character-list')).toBeTruthy();
  });

  it('should display character entries', () => {
    expect(el.querySelectorAll('.character-entry').length).toBe(1);
  });

  it('should display character name', () => {
    expect(el.querySelector('.character-name')?.textContent?.trim()).toBe('Kael');
  });

  it('should display character level', () => {
    expect(el.querySelector('.character-level')?.textContent?.trim()).toBe('3');
  });

  it('should display owner username as a link from summary', () => {
    host.characterSummaries.set([buildSummary()]);
    fixture.detectChanges();

    const ownerLink = el.querySelector('.character-owner') as HTMLAnchorElement;
    expect(ownerLink?.textContent?.trim()).toBe('player1');
    expect(ownerLink?.tagName).toBe('A');
  });

  it('should not display owner link when no summary exists', () => {
    expect(el.querySelector('.character-owner')).toBeFalsy();
  });

  it('should display class names from subclass cards fallback', () => {
    host.campaign.set(buildCampaign({
      playerCharacters: [buildCharacter({ subclassCards: [{ associatedClassName: 'Guardian' }, { associatedClassName: 'Ranger' }] })],
    }));
    fixture.detectChanges();

    const classText = el.querySelector('.character-class')?.textContent?.replace(/\s+/g, ' ').trim();
    expect(classText).toContain('Guardian');
    expect(classText).toContain('Ranger');
  });

  it('should display class and subclass from characterSummaries', () => {
    host.campaign.set(buildCampaign({
      playerCharacters: [buildCharacter()],
    }));
    host.characterSummaries.set([{
      id: 10,
      name: 'Kael',
      level: 3,
      ownerId: 2,
      ownerUsername: 'player1',
      ancestryNames: [],
      classNames: ['Guardian'],
      subclassNames: ['Iron Wall'],
    }]);
    fixture.detectChanges();

    const classText = el.querySelector('.character-class')?.textContent?.replace(/\s+/g, ' ').trim();
    expect(classText).toContain('Guardian');
    expect(classText).toContain('Iron Wall');
  });

  it('should show empty state when no characters', () => {
    host.campaign.set(buildCampaign({ playerCharacters: [], playerCharacterIds: [] }));
    fixture.detectChanges();

    expect(el.querySelector('.character-list-empty')).toBeTruthy();
  });

  it('should not show remove button when canManage is false', () => {
    expect(el.querySelector('.character-remove-btn')).toBeFalsy();
  });

  it('should show remove button when canManage is true', () => {
    host.canManage.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.character-remove-btn')).toBeTruthy();
  });

  it('should emit viewCharacter when entry is clicked', () => {
    (el.querySelector('.character-entry') as HTMLElement).click();

    expect(host.viewedId).toBe(10);
  });

  it('should show confirmation when confirmingRemoveId matches', () => {
    host.canManage.set(true);
    host.confirmingRemoveId.set(10);
    fixture.detectChanges();

    expect(el.querySelector('.character-confirm-text')).toBeTruthy();
  });
});
