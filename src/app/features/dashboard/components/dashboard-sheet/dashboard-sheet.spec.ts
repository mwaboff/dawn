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

  it('should render three shields with labels Heroes, Sagas, Days', () => {
    const labels = el.querySelectorAll('.ds-shield__label');
    const texts = Array.from(labels).map(l => l.textContent?.trim());
    expect(texts).toContain('Heroes');
    expect(texts).toContain('Sagas');
    expect(texts).toContain('Days');
  });

  it('should show Heroes shield value matching characters length', () => {
    host.characters.set([makeCharacter({ id: 1 }), makeCharacter({ id: 2 })]);
    fixture.detectChanges();

    const shields = el.querySelectorAll('.ds-shield');
    const heroesShield = Array.from(shields).find(s => s.getAttribute('aria-label') === 'Heroes');
    expect(heroesShield?.querySelector('.ds-shield__value')?.textContent?.trim()).toBe('2');
  });

  it('should show Sagas shield value matching campaigns length', () => {
    host.campaigns.set([makeCampaign({ id: 1 }), makeCampaign({ id: 2 }), makeCampaign({ id: 3 })]);
    fixture.detectChanges();

    const shields = el.querySelectorAll('.ds-shield');
    const sagasShield = Array.from(shields).find(s => s.getAttribute('aria-label') === 'Sagas');
    expect(sagasShield?.querySelector('.ds-shield__value')?.textContent?.trim()).toBe('3');
  });

  it('should show Days shield as 0 when no campaigns', () => {
    host.campaigns.set([]);
    fixture.detectChanges();

    const shields = el.querySelectorAll('.ds-shield');
    const daysShield = Array.from(shields).find(s => s.getAttribute('aria-label') === 'Days adventuring');
    expect(daysShield?.querySelector('.ds-shield__value')?.textContent?.trim()).toBe('0');
  });

  it('should compute Days from oldest campaign createdAt', () => {
    host.campaigns.set([
      makeCampaign({ id: 1, createdAt: '2024-01-01T00:00:00' }),
      makeCampaign({ id: 2, createdAt: '2025-01-01T00:00:00' }),
    ]);
    fixture.detectChanges();

    const shields = el.querySelectorAll('.ds-shield');
    const daysShield = Array.from(shields).find(s => s.getAttribute('aria-label') === 'Days adventuring');
    const value = parseInt(daysShield?.querySelector('.ds-shield__value')?.textContent?.trim() ?? '-1', 10);
    expect(value).toBeGreaterThan(0);
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
    // Guardian maps to #5e8ed4 (rgb(94, 142, 212))
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

  it('should link "+ Forge a hero" CTA to /create-character', () => {
    host.characters.set([makeCharacter()]);
    fixture.detectChanges();

    const ctas = Array.from(el.querySelectorAll('.ds-cta')) as HTMLAnchorElement[];
    const forgeLink = ctas.find(a => a.textContent?.includes('Forge a hero'));
    expect(forgeLink?.getAttribute('href')).toBe('/create-character');
  });

  it('should link "+ Begin a chronicle" CTA to /campaigns/create', () => {
    host.campaigns.set([makeCampaign()]);
    fixture.detectChanges();

    const ctas = Array.from(el.querySelectorAll('.ds-cta')) as HTMLAnchorElement[];
    const beginLink = ctas.find(a => a.textContent?.includes('Begin a chronicle'));
    expect(beginLink?.getAttribute('href')).toBe('/campaigns/create');
  });

  it('should render username in the greeting', () => {
    host.username.set('Elara');
    fixture.detectChanges();

    expect(el.querySelector('.ds-name')?.textContent?.trim()).toContain('Elara');
  });
});
