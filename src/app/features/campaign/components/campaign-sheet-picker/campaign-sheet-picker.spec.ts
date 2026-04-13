import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { CampaignSheetPicker } from './campaign-sheet-picker';
import { AuthService } from '../../../../core/services/auth.service';
import { CharacterSheetResponse } from '../../../create-character/models/character-sheet-api.model';

function buildSheet(overrides: Partial<CharacterSheetResponse> = {}): CharacterSheetResponse {
  return {
    id: 100,
    name: 'Aelara',
    level: 5,
    ownerId: 42,
    pronouns: '',
    evasion: 0,
    armorMax: 0,
    armorMarked: 0,
    majorDamageThreshold: 0,
    severeDamageThreshold: 0,
    agilityModifier: 0,
    agilityMarked: false,
    strengthModifier: 0,
    strengthMarked: false,
    finesseModifier: 0,
    finesseMarked: false,
    instinctModifier: 0,
    instinctMarked: false,
    presenceModifier: 0,
    presenceMarked: false,
    knowledgeModifier: 0,
    knowledgeMarked: false,
    hitPointMax: 0,
    hitPointMarked: 0,
    stressMax: 0,
    stressMarked: 0,
    hopeMax: 0,
    hopeMarked: 0,
    gold: 0,
    communityCardIds: [],
    ancestryCardIds: [],
    subclassCardIds: [],
    domainCardIds: [],
    proficiency: 0,
    equippedDomainCardIds: [],
    vaultDomainCardIds: [],
    experienceIds: [],
    createdAt: '',
    lastModifiedAt: '',
    subclassCards: [{ id: 1, name: 'Sorcerer Path', associatedClassName: 'Sorcerer' }],
    ...overrides,
  };
}

function wrapPaged(content: CharacterSheetResponse[]) {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 100,
    number: 0,
  };
}

@Component({
  template: `
    <app-campaign-sheet-picker
      [campaignId]="campaignId()"
      [excludeSheetIds]="excludeSheetIds()"
      [mode]="mode()"
      (sheetSelected)="selectedId = $event"
      (cancelled)="cancelCalled = true"
    />
  `,
  imports: [CampaignSheetPicker],
})
class TestHost {
  campaignId = signal(1);
  excludeSheetIds = signal<number[]>([]);
  mode = signal<'submit' | 'npc'>('submit');
  selectedId: number | null = null;
  cancelCalled = false;
}

describe('CampaignSheetPicker', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;
  let httpTesting: HttpTestingController;

  function setup(userId: number | null = 42) {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    const authService = TestBed.inject(AuthService);
    vi.spyOn(authService, 'user').mockReturnValue(
      userId !== null
        ? { id: userId, username: 'testuser', email: '', role: 'USER', createdAt: '', lastModifiedAt: '', usernameChosen: true }
        : null,
    );

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    httpTesting = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpTesting?.verify();
  });

  it('should show loading state initially', () => {
    setup();
    fixture.detectChanges();

    expect(el.querySelector('.sheet-picker-skeleton')).toBeTruthy();

    httpTesting.expectOne(r => r.url.includes('/character-sheets')).flush(wrapPaged([]));
  });

  it('should render available sheets after fetch', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/character-sheets')).flush(
      wrapPaged([buildSheet(), buildSheet({ id: 101, name: 'Bren', level: 3 })]),
    );
    fixture.detectChanges();

    expect(el.querySelectorAll('.sheet-picker-entry').length).toBe(2);
  });

  it('should filter out excluded sheet IDs', () => {
    setup();
    host.excludeSheetIds.set([100]);
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/character-sheets')).flush(
      wrapPaged([buildSheet(), buildSheet({ id: 101, name: 'Bren', level: 3 })]),
    );
    fixture.detectChanges();

    expect(el.querySelectorAll('.sheet-picker-entry').length).toBe(1);
    expect(el.querySelector('.sheet-picker-name')?.textContent?.trim()).toBe('Bren');
  });

  it('should show empty state when all sheets filtered out', () => {
    setup();
    host.excludeSheetIds.set([100]);
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/character-sheets')).flush(wrapPaged([buildSheet()]));
    fixture.detectChanges();

    expect(el.querySelector('.sheet-picker-message')).toBeTruthy();
    expect(el.querySelector('.sheet-picker-message')?.textContent).toContain('All your characters are already in this campaign');
  });

  it('should show npc empty state in npc mode', () => {
    setup();
    host.mode.set('npc');
    host.excludeSheetIds.set([100]);
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/character-sheets')).flush(wrapPaged([buildSheet()]));
    fixture.detectChanges();

    expect(el.querySelector('.sheet-picker-message')?.textContent).toContain('You have no characters to add as NPCs');
  });

  it('should highlight selected sheet on click', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/character-sheets')).flush(wrapPaged([buildSheet()]));
    fixture.detectChanges();

    (el.querySelector('.sheet-picker-entry') as HTMLElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.sheet-picker-entry.selected')).toBeTruthy();
  });

  it('should disable confirm button when no sheet selected', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/character-sheets')).flush(wrapPaged([buildSheet()]));
    fixture.detectChanges();

    const btn = el.querySelector('.sheet-picker-confirm') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('should emit sheetSelected on confirm', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/character-sheets')).flush(wrapPaged([buildSheet()]));
    fixture.detectChanges();

    (el.querySelector('.sheet-picker-entry') as HTMLElement).click();
    fixture.detectChanges();
    (el.querySelector('.sheet-picker-confirm') as HTMLElement).click();

    expect(host.selectedId).toBe(100);
  });

  it('should emit cancel on cancel click', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/character-sheets')).flush(wrapPaged([]));
    fixture.detectChanges();

    (el.querySelector('.sheet-picker-cancel') as HTMLElement).click();
    expect(host.cancelCalled).toBe(true);
  });

  it('should show correct title for submit mode', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/character-sheets')).flush(wrapPaged([]));
    fixture.detectChanges();

    expect(el.querySelector('.sheet-picker-title')?.textContent?.trim()).toBe('Submit a Character');
  });

  it('should show correct title for npc mode', () => {
    setup();
    host.mode.set('npc');
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/character-sheets')).flush(wrapPaged([]));
    fixture.detectChanges();

    expect(el.querySelector('.sheet-picker-title')?.textContent?.trim()).toBe('Add an NPC');
  });

  it('should show error state on fetch failure', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url.includes('/character-sheets')).flush('Error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el.querySelector('.sheet-picker-message')?.textContent).toContain('Failed to load your characters');
  });

  it('should show error state when user is not logged in', () => {
    setup(null);
    fixture.detectChanges();

    expect(el.querySelector('.sheet-picker-message')?.textContent).toContain('Failed to load your characters');
  });
});
