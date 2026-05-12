import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardSheet } from './dashboard-sheet';
import { CharacterSummary } from '../../../profile/models/profile.model';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';

@Component({
  template: `
    <app-dashboard-sheet
      [characters]="characters()"
      [charactersLoading]="charactersLoading()"
      [charactersError]="charactersError()"
      [campaigns]="campaigns()"
      [campaignsLoading]="campaignsLoading()"
      [campaignsError]="campaignsError()"
      [username]="username()"
    />
  `,
  imports: [DashboardSheet],
})
class TestHost {
  characters = signal<CharacterSummary[]>([]);
  charactersLoading = signal(false);
  charactersError = signal(false);
  campaigns = signal<CampaignResponse[]>([]);
  campaignsLoading = signal(false);
  campaignsError = signal(false);
  username = signal('Taran');
}

function makeCharacter(overrides: Partial<CharacterSummary> = {}): CharacterSummary {
  return {
    id: 1,
    name: 'Aragorn',
    level: 5,
    classEntries: [{ className: 'Guardian' }],
    createdAt: '2025-06-15T10:30:00',
    lastModifiedAt: '2025-06-15T10:30:00',
    ...overrides,
  };
}

function makeCampaign(overrides: Partial<CampaignResponse> = {}): CampaignResponse {
  return {
    id: 1,
    name: 'The Long Road',
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

describe('DashboardSheet', () => {
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
    expect(el.querySelector('app-dashboard-sheet')).toBeTruthy();
  });

  it('should not render shields in the header', () => {
    expect(el.querySelector('.ds-shield')).toBeFalsy();
  });

  it('should render character loading skeletons when charactersLoading is true', () => {
    host.charactersLoading.set(true);
    fixture.detectChanges();

    expect(el.querySelectorAll('.roster-skeleton').length).toBeGreaterThanOrEqual(3);
  });

  it('should render campaign error message when campaignsError is true', () => {
    host.campaignsError.set(true);
    fixture.detectChanges();

    const messages = el.querySelectorAll('.roster-message');
    expect(messages.length).toBeGreaterThanOrEqual(1);
  });

  it('should render character empty state when characters is empty', () => {
    host.characters.set([]);
    fixture.detectChanges();

    const emptyTexts = Array.from(el.querySelectorAll('.ds-empty__text'))
      .map(t => t.textContent?.trim());
    expect(emptyTexts).toContain('No heroes inscribed. Forge your first.');
  });

  it('should render character entries with border-left containing a color for a known class', () => {
    host.characters.set([makeCharacter({ classEntries: [{ className: 'Guardian' }] })]);
    fixture.detectChanges();

    const row = el.querySelector('.ds-row') as HTMLElement | null;
    expect(row).toBeTruthy();
    const borderLeft = row!.style.borderLeft;
    expect(borderLeft).toBeTruthy();
    const hasBorderColor = borderLeft.includes('#5e8ed4') || borderLeft.includes('rgb(94, 142, 212)');
    expect(hasBorderColor).toBe(true);
  });

  it('should link character row to /character/{id}', () => {
    host.characters.set([makeCharacter({ id: 42 })]);
    fixture.detectChanges();

    const link = el.querySelector('.ds-row') as HTMLAnchorElement | null;
    expect(link?.getAttribute('href')).toBe('/character/42');
  });

  it('should link campaign row to /campaign/{id}', () => {
    host.campaigns.set([makeCampaign({ id: 7 })]);
    fixture.detectChanges();

    const link = el.querySelector('.ds-row--saga') as HTMLAnchorElement | null;
    expect(link?.getAttribute('href')).toBe('/campaign/7');
  });

  it('should link "+ Forge a hero" dashed add row to /create-character', () => {
    host.characters.set([makeCharacter()]);
    fixture.detectChanges();

    const adds = Array.from(el.querySelectorAll('.roster-entry--add')) as HTMLAnchorElement[];
    const forgeLink = adds.find(a => a.textContent?.includes('Forge a hero'));
    expect(forgeLink?.getAttribute('href')).toBe('/create-character');
  });

  it('should link "+ Begin a chronicle" dashed add row to /campaigns/create', () => {
    host.campaigns.set([makeCampaign()]);
    fixture.detectChanges();

    const adds = Array.from(el.querySelectorAll('.roster-entry--add')) as HTMLAnchorElement[];
    const beginLink = adds.find(a => a.textContent?.includes('Begin a chronicle'));
    expect(beginLink?.getAttribute('href')).toBe('/campaigns/create');
  });

  it('should still render the dashed add rows when the character list is empty', () => {
    host.characters.set([]);
    fixture.detectChanges();

    const adds = Array.from(el.querySelectorAll('.roster-entry--add')) as HTMLAnchorElement[];
    expect(adds.some(a => a.textContent?.includes('Forge a hero'))).toBe(true);
  });

  it('should not render the dashed add row while characters are loading', () => {
    host.charactersLoading.set(true);
    fixture.detectChanges();

    const adds = Array.from(el.querySelectorAll('.roster-entry--add')) as HTMLAnchorElement[];
    expect(adds.some(a => a.textContent?.includes('Forge a hero'))).toBe(false);
  });

  it('should show the character count in the Characters panel title', () => {
    host.characters.set([makeCharacter({ id: 1 }), makeCharacter({ id: 2 }), makeCharacter({ id: 3 })]);
    fixture.detectChanges();

    const titles = Array.from(el.querySelectorAll('.panel__title')).map(t => t.textContent?.trim());
    expect(titles).toContain('Characters (3)');
  });

  it('should show the campaign count in the Campaigns panel title', () => {
    host.campaigns.set([makeCampaign({ id: 1 }), makeCampaign({ id: 2 })]);
    fixture.detectChanges();

    const titles = Array.from(el.querySelectorAll('.panel__title')).map(t => t.textContent?.trim());
    expect(titles).toContain('Campaigns (2)');
  });

  it('should show zero counts when both lists are empty', () => {
    fixture.detectChanges();

    const titles = Array.from(el.querySelectorAll('.panel__title')).map(t => t.textContent?.trim());
    expect(titles).toContain('Characters (0)');
    expect(titles).toContain('Campaigns (0)');
  });

  it('should render username in the greeting', () => {
    host.username.set('Elara');
    fixture.detectChanges();

    expect(el.querySelector('.ds-name')?.textContent?.trim()).toContain('Elara');
  });
});
