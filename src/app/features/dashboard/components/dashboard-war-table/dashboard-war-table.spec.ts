import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardWarTable } from './dashboard-war-table';
import { CharacterSummary } from '../../../profile/models/profile.model';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';

@Component({
  template: `
    <app-dashboard-war-table
      [characters]="characters()"
      [charactersLoading]="charactersLoading()"
      [charactersError]="charactersError()"
      [campaigns]="campaigns()"
      [campaignsLoading]="campaignsLoading()"
      [campaignsError]="campaignsError()"
      [username]="username()"
    />
  `,
  imports: [DashboardWarTable],
})
class TestHost {
  characters = signal<CharacterSummary[]>([]);
  charactersLoading = signal(false);
  charactersError = signal(false);
  campaigns = signal<CampaignResponse[]>([]);
  campaignsLoading = signal(false);
  campaignsError = signal(false);
  username = signal('Tester');
}

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
    name: 'The Dark Campaign',
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

describe('DashboardWarTable', () => {
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
    expect(el.querySelector('app-dashboard-war-table')).toBeTruthy();
  });

  it('should render empty-state when both lists are empty, not loading, not error', () => {
    fixture.detectChanges();
    expect(el.querySelector('.wt-featured--single')?.textContent).toContain('The table is empty.');
  });

  it('should render featured character card name when characters list is non-empty', () => {
    host.characters.set([makeCharacter({ id: 10, name: 'Lyra' })]);
    fixture.detectChanges();
    expect(el.querySelector('.wt-featured__name')?.textContent?.trim()).toBe('Lyra');
  });

  it('should render featured campaign card name when campaigns list is non-empty', () => {
    host.campaigns.set([makeCampaign({ id: 5, name: 'Shattered Realms' })]);
    fixture.detectChanges();
    const cards = el.querySelectorAll('.wt-featured__name');
    const names = Array.from(cards).map(c => c.textContent?.trim());
    expect(names).toContain('Shattered Realms');
  });

  it('should link featured character card to /character/{id}', () => {
    host.characters.set([makeCharacter({ id: 10, name: 'Lyra' })]);
    fixture.detectChanges();
    const card = el.querySelector('.wt-featured__card') as HTMLAnchorElement;
    expect(card.getAttribute('href')).toBe('/character/10');
  });

  it('should link featured campaign card to /campaign/{id}', () => {
    host.campaigns.set([makeCampaign({ id: 5, name: 'Shattered Realms' })]);
    fixture.detectChanges();
    const cards = el.querySelectorAll('.wt-featured__card') as NodeListOf<HTMLAnchorElement>;
    const hrefs = Array.from(cards).map(c => c.getAttribute('href'));
    expect(hrefs).toContain('/campaign/5');
  });

  it('should render empty-state character card linking to /create-character when no characters', () => {
    host.campaigns.set([makeCampaign({ id: 1, name: 'Saga' })]);
    fixture.detectChanges();
    const emptyCard = el.querySelector('.wt-featured__card--empty') as HTMLAnchorElement;
    expect(emptyCard.getAttribute('href')).toBe('/create-character');
  });

  it('should render empty-state campaign card linking to /campaigns/create when no campaigns', () => {
    host.characters.set([makeCharacter({ id: 1, name: 'Hero' })]);
    fixture.detectChanges();
    const emptyCards = el.querySelectorAll('.wt-featured__card--empty') as NodeListOf<HTMLAnchorElement>;
    const hrefs = Array.from(emptyCards).map(c => c.getAttribute('href'));
    expect(hrefs).toContain('/campaigns/create');
  });

  it('should render one .wt-marker--hero per character beyond the first', () => {
    host.characters.set([
      makeCharacter({ id: 1, name: 'Alpha' }),
      makeCharacter({ id: 2, name: 'Beta' }),
      makeCharacter({ id: 3, name: 'Gamma' }),
    ]);
    fixture.detectChanges();
    expect(el.querySelectorAll('.wt-marker--hero').length).toBe(2);
  });

  it('should render one .wt-marker--saga per campaign beyond the first', () => {
    host.campaigns.set([
      makeCampaign({ id: 1, name: 'Alpha' }),
      makeCampaign({ id: 2, name: 'Beta' }),
      makeCampaign({ id: 3, name: 'Gamma' }),
    ]);
    fixture.detectChanges();
    expect(el.querySelectorAll('.wt-marker--saga').length).toBe(2);
  });

  it('should show marker initial as first character of name, uppercased', () => {
    host.characters.set([
      makeCharacter({ id: 1, name: 'Alpha' }),
      makeCharacter({ id: 2, name: 'beta' }),
    ]);
    fixture.detectChanges();
    const initial = el.querySelector('.wt-marker--hero .wt-marker__initial');
    expect(initial?.textContent?.trim()).toBe('B');
  });

  it('should link hero marker to /character/{id}', () => {
    host.characters.set([
      makeCharacter({ id: 1, name: 'Alpha' }),
      makeCharacter({ id: 2, name: 'Beta' }),
    ]);
    fixture.detectChanges();
    const marker = el.querySelector('.wt-marker--hero') as HTMLAnchorElement;
    expect(marker.getAttribute('href')).toBe('/character/2');
  });

  it('should link saga marker to /campaign/{id}', () => {
    host.campaigns.set([
      makeCampaign({ id: 1, name: 'Alpha' }),
      makeCampaign({ id: 2, name: 'Beta' }),
    ]);
    fixture.detectChanges();
    const marker = el.querySelector('.wt-marker--saga') as HTMLAnchorElement;
    expect(marker.getAttribute('href')).toBe('/campaign/2');
  });

  it('should link "View all heroes" to /profile', () => {
    host.characters.set([makeCharacter({ id: 1, name: 'Hero' })]);
    fixture.detectChanges();
    const seals = el.querySelectorAll('.wt-seal') as NodeListOf<HTMLAnchorElement>;
    const footerSeals = Array.from(seals).filter(s => s.closest('.wt-footer'));
    const hrefs = footerSeals.map(s => s.getAttribute('href'));
    expect(hrefs).toContain('/profile');
  });

  it('should link "View all sagas" to /campaigns', () => {
    host.characters.set([makeCharacter({ id: 1, name: 'Hero' })]);
    fixture.detectChanges();
    const seals = el.querySelectorAll('.wt-seal') as NodeListOf<HTMLAnchorElement>;
    const footerSeals = Array.from(seals).filter(s => s.closest('.wt-footer'));
    const hrefs = footerSeals.map(s => s.getAttribute('href'));
    expect(hrefs).toContain('/campaigns');
  });

  it('should render loading state (.wt-loading) when either is loading', () => {
    host.charactersLoading.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.wt-loading')).toBeTruthy();
  });
});
