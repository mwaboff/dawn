import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { CampaignResponse } from '../../../../../shared/models/campaign-api.model';
import { CharacterSheetResponse } from '../../../../create-character/models/character-sheet-api.model';
import { GmScreenContext } from '../../gm-screen-context.service';
import { SheetViewerPanel } from './sheet-viewer-panel';

const SHEET_URL = 'http://localhost:8080/api/dh/character-sheets/42';

function campaign(): CampaignResponse {
  return {
    id: 7,
    name: 'The Hollow Road',
    creatorId: 1,
    gameMasterIds: [1],
    playerIds: [],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [42],
    playerCharacters: [
      { id: 42, name: 'Brenna', level: 3, ownerId: 2, createdAt: '', lastModifiedAt: '' },
    ],
    nonPlayerCharacterIds: [43],
    nonPlayerCharacters: [
      { id: 43, name: 'Old Marrow', level: 1, ownerId: 1, createdAt: '', lastModifiedAt: '' },
    ],
    fear: 0,
    isEnded: false,
    createdAt: '',
    lastModifiedAt: '',
  };
}

function sheet(): CharacterSheetResponse {
  return {
    id: 42,
    name: 'Brenna',
    level: 3,
    evasion: 11,
    armorMax: 6,
    armorMarked: 1,
    majorDamageThreshold: 8,
    severeDamageThreshold: 16,
    agilityModifier: 2,
    agilityMarked: false,
    strengthModifier: 0,
    strengthMarked: false,
    finesseModifier: 1,
    finesseMarked: false,
    instinctModifier: -1,
    instinctMarked: false,
    presenceModifier: 1,
    presenceMarked: false,
    knowledgeModifier: 0,
    knowledgeMarked: false,
    hitPointMax: 7,
    hitPointMarked: 2,
    stressMax: 6,
    stressMarked: 1,
    hopeMax: 6,
    hopeMarked: 4,
    gold: 3,
    ownerId: 2,
    communityCardIds: [],
    ancestryCardIds: [],
    subclassCardIds: [],
    domainCardIds: [],
    proficiency: 2,
    equippedDomainCardIds: [],
    vaultDomainCardIds: [],
    experienceIds: [],
    createdAt: '',
    lastModifiedAt: '',
  };
}

describe('SheetViewerPanel', () => {
  let fixture: ComponentFixture<SheetViewerPanel>;
  let component: SheetViewerPanel;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SheetViewerPanel],
      providers: [provideHttpClient(), provideHttpClientTesting(), GmScreenContext],
    });
    TestBed.inject(GmScreenContext).setCampaign(campaign());
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SheetViewerPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists player characters and NPCs as options', () => {
    expect(component.playerOptions()).toEqual([{ id: 42, label: 'Brenna (Lv 3)' }]);
    expect(component.npcOptions()).toEqual([{ id: 43, label: 'Old Marrow (Lv 1)' }]);
  });

  it('GETs the full sheet when a character is selected', () => {
    component.onSelect('42');

    const request = httpMock.expectOne(r => r.url === SHEET_URL);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('expand')).toContain('inventoryWeapons');
    request.flush(sheet());

    expect(component.sheet()?.name).toBe('Brenna');
  });

  it('re-issues the GET when refresh is pressed', () => {
    component.onSelect('42');
    httpMock.expectOne(r => r.url === SHEET_URL).flush(sheet());

    component.refresh();

    httpMock.expectOne(r => r.url === SHEET_URL).flush(sheet());
  });

  it('does not fetch when refresh is pressed with nothing selected', () => {
    component.refresh();

    httpMock.expectNone(() => true);
  });

  it('clears the sheet when the empty option is chosen', () => {
    component.onSelect('42');
    httpMock.expectOne(r => r.url === SHEET_URL).flush(sheet());

    component.onSelect('');

    expect(component.sheet()).toBeNull();
    expect(component.selectedId()).toBeNull();
  });

  it('renders the stat block after a successful load', () => {
    component.onSelect('42');
    httpMock.expectOne(r => r.url === SHEET_URL).flush(sheet());
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Brenna');
    // Thresholds come from the mapper (level-derived with no armor equipped), not the raw payload.
    expect(text).toContain('Major 3 / Severe 6');
    expect(text).toContain('2 / 7 marked');
  });

  it('surfaces an error state when the sheet fails to load', () => {
    component.onSelect('42');
    httpMock
      .expectOne(r => r.url === SHEET_URL)
      .flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.error()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Could not load');
  });
});
