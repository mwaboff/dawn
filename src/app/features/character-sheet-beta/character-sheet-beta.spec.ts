import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, vi } from 'vitest';

import { CharacterSheetBeta } from './character-sheet-beta';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { AuthService } from '../../core/services/auth.service';
import { DiceRollerService } from '../../core/services/dice-roller.service';
import { TransformationCardService } from '../../shared/services/transformation-card.service';
import { CompanionService } from '../../shared/services/companion.service';
import { CharacterSheetResponse } from '../create-character/models/character-sheet-api.model';
import { InventorySection } from '../character-sheet/components/inventory-section/inventory-section';
import { BeastformSection } from '../character-sheet/components/beastform-section/beastform-section';
import { MartialStancePanel } from '../character-sheet/components/martial-stance-panel/martial-stance-panel';
import { TransformationPanel } from '../character-sheet/components/transformation-panel/transformation-panel';
import { CompanionPanel } from '../character-sheet/components/companion-panel/companion-panel';
import { BeastformSectionBeta } from './components/beastform-section-beta/beastform-section-beta';
import { MartialStancePanelBeta } from './components/martial-stance-panel-beta/martial-stance-panel-beta';
import { TransformationPanelBeta } from './components/transformation-panel-beta/transformation-panel-beta';
import { CompanionPanelBeta } from './components/companion-panel-beta/companion-panel-beta';

/**
 * `CharacterSheetBeta` inherits every save pipeline, equip constraint and handler from
 * `CharacterSheet` unchanged (only the template/CSS are new) -- `character-sheet.spec.ts` already
 * covers that logic exhaustively, so per .agents/rules/testing.md this file does not re-test it.
 * It covers only what's actually new: the six card groups render through `EntityCard`, the four
 * Hope & Fear panels are the *beta* siblings (not the classic ones a copy/paste typo could
 * silently reintroduce), and equipment/inventory still render through the reused classic pieces.
 */
const mockResponse: CharacterSheetResponse = {
  id: 1,
  name: 'Aragorn',
  level: 5,
  evasion: 10,
  armorMax: 5,
  armorMarked: 0,
  majorDamageThreshold: 3,
  severeDamageThreshold: 6,
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
  hitPointMax: 10,
  hitPointMarked: 0,
  stressMax: 6,
  stressMarked: 0,
  hopeMax: 3,
  hopeMarked: 0,
  gold: 50,
  ownerId: 1,
  notes: '',
  proficiency: 1,
  transformationEnabled: true,
  companionsEnabled: true,
  equippedDomainCardIds: [101],
  vaultDomainCardIds: [102],
  communityCardIds: [],
  ancestryCardIds: [],
  subclassCardIds: [],
  domainCardIds: [101, 102],
  classCards: [{ id: 1, name: 'Sorcerer', description: 'Arcane bloodline.', classFeatures: [] }],
  classes: [{ id: 1, name: 'Sorcerer', classFeatures: [{ id: 1, name: 'Beastform', description: 'Transform.' }] }],
  subclassCards: [{ id: 2, name: 'Warden of the Elements', level: 'Mastery', domainNames: ['Sage', 'Valor'], features: [{ id: 1, name: 'Stance Fighter', description: 'Choose a stance.' }] }],
  ancestryCards: [{ id: 3, name: 'Elf', description: 'Keen senses.', features: [] }],
  communityCards: [{ id: 4, name: 'Highborne', description: 'Raised in privilege.', features: [] }],
  domainCards: [
    { id: 101, name: 'Rock Barrage', description: 'Hurl stone.', associatedDomainName: 'Valor', level: 3, recallCost: 2, features: [] },
    { id: 102, name: 'Rune Ward', description: 'A shimmering ward.', associatedDomainName: 'Sage', level: 1, features: [] },
  ],
  inventoryWeapons: [],
  inventoryArmors: [],
  inventoryItems: [],
  experienceIds: [],
  createdAt: '2026-01-01T00:00:00',
  lastModifiedAt: '2026-01-01T00:00:00',
};

describe('CharacterSheetBeta', () => {
  let fixture: ComponentFixture<CharacterSheetBeta>;
  let component: CharacterSheetBeta;

  /** Configures a fresh TestBed module. Does not create or flush the component, so callers that
   * need to inspect pre-ngOnInit state can create it themselves before the first detectChanges. */
  function configure(routeId: string, serviceResponse = of(mockResponse), authUser: object | null = { id: 1 }) {
    TestBed.configureTestingModule({
      imports: [CharacterSheetBeta],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CharacterSheetService, useValue: { getCharacterSheet: vi.fn().mockReturnValue(serviceResponse), updateCharacterSheet: vi.fn().mockReturnValue(of(mockResponse)) } },
        { provide: AuthService, useValue: { user: vi.fn().mockReturnValue(authUser), isAdmin: vi.fn().mockReturnValue(false) } },
        { provide: TransformationCardService, useValue: { getAllTransformationCards: vi.fn().mockReturnValue(of([])) } },
        { provide: CompanionService, useValue: { getCompanions: vi.fn().mockReturnValue(of([])) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => routeId } } } },
      ],
    });
  }

  function createComponent(serviceResponse = of(mockResponse)) {
    configure('1', serviceResponse);
    fixture = TestBed.createComponent(CharacterSheetBeta);
    component = fixture.componentInstance;
    TestBed.inject(DiceRollerService);
    fixture.detectChanges();
  }

  it('creates the component', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('inherits ngOnInit and renders the loaded sheet name and level', () => {
    createComponent();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Aragorn');
    expect(text).toContain('5');
  });

  it('starts in loading state before the first detectChanges runs ngOnInit', () => {
    configure('1');
    const freshFixture = TestBed.createComponent(CharacterSheetBeta);
    expect(freshFixture.componentInstance.loading()).toBe(true);
  });

  it('renders an error state when the id is invalid, inherited from CharacterSheet.ngOnInit', () => {
    configure('not-a-number', of(mockResponse), null);
    const badFixture = TestBed.createComponent(CharacterSheetBeta);
    badFixture.detectChanges();
    expect(badFixture.nativeElement.querySelector('.sheet-error')).toBeTruthy();
  });

  function entityCards(root: HTMLElement = fixture.nativeElement): HTMLElement[] {
    return Array.from(root.querySelectorAll('app-entity-card'));
  }

  it('renders one EntityCard per class/subclass/ancestry/community card', () => {
    createComponent();
    expect(entityCards().length).toBeGreaterThanOrEqual(1 + 1 + 1 + 1 + 2); // + the two domain cards
  });

  it('maps a subclass card\'s level onto the EntityCard subtitle text', () => {
    createComponent();
    const names = entityCards().map(el => el.textContent);
    expect(names.some(t => t?.includes('Warden of the Elements') && t.includes('Mastery'))).toBe(true);
  });

  it('shows the equipped/max count on the Equipped Domain Cards heading', () => {
    createComponent();
    const root: HTMLElement = fixture.nativeElement;
    const counts = Array.from(root.querySelectorAll<HTMLElement>('.card-group__count'));
    const heading = counts.find(el => el.textContent?.includes('/'));
    expect(heading?.textContent?.trim()).toBe('1/5');
  });

  it('moves a domain card from equipped to vault when its inherited Vault handler fires', () => {
    createComponent();
    const vaultBtn = fixture.nativeElement.querySelector('.card-swap-btn--vault') as HTMLButtonElement;
    expect(vaultBtn).toBeTruthy();

    vaultBtn.click();
    fixture.detectChanges();

    expect(component.equippedDomainCardEntries().length).toBe(0);
    expect(component.vaultDomainCardEntries().length).toBe(2);
  });

  it('renders vault domain cards as muted EntityCards', () => {
    createComponent();
    const vaulted = fixture.debugElement.query(By.css('.vault-section app-entity-card'));
    expect(vaulted.nativeElement.classList.contains('entity-card--muted')).toBe(true);
  });

  it('moves a domain card from vault to equipped when its inherited Equip handler fires', () => {
    createComponent();
    const equipBtn = fixture.nativeElement.querySelector('.card-swap-btn--equip') as HTMLButtonElement;
    expect(equipBtn).toBeTruthy();

    equipBtn.click();
    fixture.detectChanges();

    expect(component.equippedDomainCardEntries().length).toBe(2);
    expect(component.vaultDomainCardEntries().length).toBe(0);
  });

  it('renders the beta beastform section, not the classic one', () => {
    createComponent();
    expect(fixture.debugElement.query(By.directive(BeastformSectionBeta))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(BeastformSection))).toBeNull();
  });

  it('renders the beta martial stance panel, not the classic one', () => {
    createComponent();
    expect(fixture.debugElement.query(By.directive(MartialStancePanelBeta))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(MartialStancePanel))).toBeNull();
  });

  it('renders the beta transformation panel, not the classic one', () => {
    createComponent();
    expect(fixture.debugElement.query(By.directive(TransformationPanelBeta))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(TransformationPanel))).toBeNull();
  });

  it('renders the beta companion panel, not the classic one', () => {
    createComponent();
    expect(fixture.debugElement.query(By.directive(CompanionPanelBeta))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(CompanionPanel))).toBeNull();
  });

  it('reuses the classic InventorySection as-is', () => {
    createComponent();
    expect(fixture.debugElement.query(By.directive(InventorySection))).toBeTruthy();
  });

  it('keeps the classic equipment-card markup for Equipped Weapons/Armor (deferred rework)', () => {
    createComponent();
    expect(fixture.nativeElement.querySelector('.column-right .empty-state')?.textContent).toContain('No weapons equipped');
  });

  it('renders a weapon whose features both have blank names without throwing on duplicate @for track keys', () => {
    // character-sheet-view.mapper.ts:178 defaults an absent feature name to '' -- two nameless
    // features on the same weapon used to collide under `track feature.name` and crash the @for.
    const blankNamedFeatures = [{ description: 'First unnamed feature.' }, { description: 'Second unnamed feature.' }];
    expect(() =>
      createComponent(
        of({
          ...mockResponse,
          inventoryWeapons: [
            {
              id: 1,
              weaponId: 1,
              equipped: true,
              slot: 'PRIMARY',
              weapon: { id: 1, name: 'Nameless Blade', features: blankNamedFeatures },
            },
          ],
        }),
      ),
    ).not.toThrow();
    expect(fixture.nativeElement.textContent).toContain('First unnamed feature.');
    expect(fixture.nativeElement.textContent).toContain('Second unnamed feature.');
  });

  it('does not render a card group for an empty card array', () => {
    createComponent(of({ ...mockResponse, communityCards: [], communityCardIds: [] }));
    expect(fixture.nativeElement.querySelector('.card-group__heading--community')).toBeNull();
  });
});
