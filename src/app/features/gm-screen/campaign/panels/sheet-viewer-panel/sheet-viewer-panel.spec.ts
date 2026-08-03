import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { CampaignResponse } from '../../../../../shared/models/campaign-api.model';
import { CharacterSheetResponse } from '../../../../create-character/models/character-sheet-api.model';
import { GmScreenContext } from '../../gm-screen-context.service';
import { SheetViewerPanel } from './sheet-viewer-panel';

const BASE_URL = 'http://localhost:8080/api/dh/character-sheets';
const BRENNA_URL = `${BASE_URL}/42`;
const MARROW_URL = `${BASE_URL}/43`;

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

function sheet(id = 42, name = 'Brenna'): CharacterSheetResponse {
  return {
    id,
    name,
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

  /** Answers the roster's initial fan-out so each test starts from loaded vitals. */
  const flushAll = () => {
    httpMock.expectOne(r => r.url === BRENNA_URL).flush(sheet());
    httpMock.expectOne(r => r.url === MARROW_URL).flush(sheet(43, 'Old Marrow'));
    fixture.detectChanges();
  };

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

  it('groups player characters and NPCs', () => {
    flushAll();
    expect(component.groups().map(g => g.label)).toEqual(['Player characters', 'NPCs']);
    expect(component.groups()[0].members.map(m => m.name)).toEqual(['Brenna']);
  });

  it('GETs every campaign character up front with the full expand set', () => {
    const requests = httpMock.match(r => r.url.startsWith(BASE_URL));
    expect(requests.map(r => r.request.url).sort()).toEqual([BRENNA_URL, MARROW_URL]);
    expect(requests[0].request.params.get('expand')).toContain('inventoryWeapons');
    requests[0].flush(sheet());
    requests[1].flush(sheet(43, 'Old Marrow'));
  });

  it('shows each member with vitals on the roster row', () => {
    flushAll();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Brenna');
    expect(text).toContain('Old Marrow');
    // Evasion, HP marked and Stress read straight off the row -- no expansion needed.
    expect(text).toContain('11');
    expect(text).toContain('2/7');
    expect(text).toContain('1/6');
  });

  it('keeps the detail block collapsed until a row is opened', () => {
    flushAll();
    const detail = fixture.nativeElement.querySelector('#party-detail-42') as HTMLElement;
    expect(detail.hidden).toBe(true);

    fixture.nativeElement.querySelector('.stat-row__toggle').click();
    fixture.detectChanges();
    expect(detail.hidden).toBe(false);
    expect(component.isExpanded(42)).toBe(true);
  });

  it('opens one row at a time', () => {
    flushAll();
    component.toggle(42);
    component.toggle(43);
    expect(component.isExpanded(42)).toBe(false);
    expect(component.isExpanded(43)).toBe(true);
  });

  it('does not refetch a sheet it already holds', () => {
    flushAll();
    fixture.detectChanges();
    httpMock.expectNone(() => true);
  });

  it('refetches every sheet when refresh is pressed', () => {
    flushAll();
    component.refresh();
    httpMock.expectOne(r => r.url === BRENNA_URL).flush(sheet());
    httpMock.expectOne(r => r.url === MARROW_URL).flush(sheet(43, 'Old Marrow'));
  });

  it('marks only the failed member unavailable and leaves the rest usable', () => {
    httpMock
      .expectOne(r => r.url === BRENNA_URL)
      .flush('boom', { status: 500, statusText: 'Server Error' });
    httpMock.expectOne(r => r.url === MARROW_URL).flush(sheet(43, 'Old Marrow'));
    fixture.detectChanges();

    expect(component.hasFailed(42)).toBe(true);
    expect(component.hasFailed(43)).toBe(false);
    expect(component.sheetFor(43)?.name).toBe('Old Marrow');
    expect(fixture.nativeElement.textContent).toContain('Vitals unavailable');
  });

  it('tells the GM when the campaign has no characters', () => {
    flushAll();
    TestBed.inject(GmScreenContext).setCampaign({
      ...campaign(),
      playerCharacters: [],
      nonPlayerCharacters: [],
    });
    fixture.detectChanges();

    expect(component.hasMembers()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('No characters have joined');
  });
});
