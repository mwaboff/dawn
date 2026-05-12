import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardLedger } from './dashboard-ledger';
import { CharacterSummary } from '../../../profile/models/profile.model';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';

function makeCharacter(overrides: Partial<CharacterSummary> = {}): CharacterSummary {
  return {
    id: 1,
    name: 'Aragorn',
    level: 5,
    classEntries: [],
    createdAt: '2025-06-15T10:30:00',
    lastModifiedAt: '2025-06-15T10:30:00',
    ...overrides,
  };
}

function makeCampaign(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 1,
    name: 'The Iron Veil',
    creatorId: 1,
    gameMasterIds: [],
    playerIds: [],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    isEnded: false,
    createdAt: '2025-06-15T10:30:00',
    lastModifiedAt: '2025-06-15T10:30:00',
    ...overrides,
  };
}

@Component({
  template: `
    <app-dashboard-ledger
      [characters]="characters()"
      [charactersLoading]="charactersLoading()"
      [charactersError]="charactersError()"
      [campaigns]="campaigns()"
      [campaignsLoading]="campaignsLoading()"
      [campaignsError]="campaignsError()"
      [username]="username()"
    />
  `,
  imports: [DashboardLedger],
})
class TestHost {
  characters = signal<CharacterSummary[]>([]);
  charactersLoading = signal(false);
  charactersError = signal(false);
  campaigns = signal<CampaignResponse[]>([]);
  campaignsLoading = signal(false);
  campaignsError = signal(false);
  username = signal('');
}

describe('DashboardLedger', () => {
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
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(el.querySelector('app-dashboard-ledger')).toBeTruthy();
  });

  it('should render character loading skeletons when charactersLoading is true', () => {
    host.charactersLoading.set(true);
    fixture.detectChanges();

    const left = el.querySelector('.ledger-page--left');
    expect(left?.querySelectorAll('.roster-skeleton').length).toBe(3);
  });

  it('should render campaign loading skeletons when campaignsLoading is true', () => {
    host.campaignsLoading.set(true);
    fixture.detectChanges();

    const right = el.querySelector('.ledger-page--right');
    expect(right?.querySelectorAll('.roster-skeleton').length).toBe(3);
  });

  it('should render character error message when charactersError is true', () => {
    host.charactersError.set(true);
    fixture.detectChanges();

    const left = el.querySelector('.ledger-page--left');
    expect(left?.querySelector('.roster-message')).toBeTruthy();
  });

  it('should render campaign error message when campaignsError is true', () => {
    host.campaignsError.set(true);
    fixture.detectChanges();

    const right = el.querySelector('.ledger-page--right');
    expect(right?.querySelector('.roster-message')).toBeTruthy();
  });

  it('should render character empty state when characters list is empty', () => {
    fixture.detectChanges();

    const left = el.querySelector('.ledger-page--left');
    expect(left?.querySelector('.roster-empty-text')?.textContent?.trim()).toBe(
      'This page awaits your first hero.'
    );
  });

  it('should render campaign empty state when campaigns list is empty', () => {
    fixture.detectChanges();

    const right = el.querySelector('.ledger-page--right');
    expect(right?.querySelector('.roster-empty-text')?.textContent?.trim()).toBe(
      'This page awaits your first saga.'
    );
  });

  it('should render one roster-entry per character when populated', () => {
    host.characters.set([
      makeCharacter({ id: 1, name: 'Aragorn' }),
      makeCharacter({ id: 2, name: 'Lyra' }),
    ]);
    fixture.detectChanges();

    const left = el.querySelector('.ledger-page--left');
    const entries = left?.querySelectorAll('a.roster-entry:not(.roster-entry--add)');
    expect(entries?.length).toBe(2);
  });

  it('should link character row to /character/{id}', () => {
    host.characters.set([makeCharacter({ id: 42 })]);
    fixture.detectChanges();

    const left = el.querySelector('.ledger-page--left');
    const entry = left?.querySelector('a.roster-entry:not(.roster-entry--add)') as HTMLAnchorElement;
    expect(entry?.getAttribute('href')).toBe('/character/42');
  });

  it('should link campaign row to /campaign/{id}', () => {
    host.campaigns.set([makeCampaign({ id: 7 })]);
    fixture.detectChanges();

    const right = el.querySelector('.ledger-page--right');
    const entry = right?.querySelector('a.roster-entry:not(.roster-entry--add)') as HTMLAnchorElement;
    expect(entry?.getAttribute('href')).toBe('/campaign/7');
  });

  it('should link the add character row to /create-character', () => {
    fixture.detectChanges();

    const left = el.querySelector('.ledger-page--left');
    const addRow = left?.querySelector('a.roster-entry--add') as HTMLAnchorElement;
    expect(addRow?.getAttribute('href')).toBe('/create-character');
  });

  it('should link the add campaign row to /campaigns/create', () => {
    fixture.detectChanges();

    const right = el.querySelector('.ledger-page--right');
    const addRow = right?.querySelector('a.roster-entry--add') as HTMLAnchorElement;
    expect(addRow?.getAttribute('href')).toBe('/campaigns/create');
  });

  it('should link View all heroes to /profile', () => {
    fixture.detectChanges();

    const left = el.querySelector('.ledger-page--left');
    const link = left?.querySelector('a.ledger-view-all') as HTMLAnchorElement;
    expect(link?.getAttribute('href')).toBe('/profile');
  });

  it('should link View all sagas to /campaigns', () => {
    fixture.detectChanges();

    const right = el.querySelector('.ledger-page--right');
    const link = right?.querySelector('a.ledger-view-all') as HTMLAnchorElement;
    expect(link?.getAttribute('href')).toBe('/campaigns');
  });

  it('should render campaigns fine when characters section is in error', () => {
    host.charactersError.set(true);
    host.campaigns.set([makeCampaign({ id: 5, name: 'Shadow Pact' })]);
    fixture.detectChanges();

    const left = el.querySelector('.ledger-page--left');
    expect(left?.querySelector('.roster-message')).toBeTruthy();

    const right = el.querySelector('.ledger-page--right');
    const entry = right?.querySelector('a.roster-entry:not(.roster-entry--add)');
    expect(entry?.querySelector('.ledger-campaign-name')?.textContent?.trim()).toBe('Shadow Pact');
  });
});
