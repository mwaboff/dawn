import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
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
import { InventorySectionBeta } from './components/inventory-section-beta/inventory-section-beta';
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
 * It covers only what's actually new: the four collapsible card groups render through `EntityCard`
 * in the right order, the four Hope & Fear panels are the *beta* siblings (not the classic ones a
 * copy/paste typo could silently reintroduce), and equipment/inventory still render through the
 * reused classic pieces. `CollapsibleCardGroup`'s own disclosure mechanics are its spec's job --
 * what's tested here is which groups exist, what lands in them, and which one starts collapsed.
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
  // One `classes` entry now serves both the class card and `showBeastforms()`, which reads the
  // same field -- the fixture used to carry a duplicate `classCards` copy for the card.
  classes: [{
    id: 1,
    name: 'Sorcerer',
    description: 'Arcane bloodline.',
    classFeatures: [{ id: 1, name: 'Beastform', description: 'Transform.' }],
  }],
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

  /** The `<app-collapsible-card-group>` whose header reads `heading`, or undefined if that group
   * isn't on the page (an empty group renders nothing at all). */
  function cardGroup(heading: string): HTMLElement | undefined {
    const root = fixture.nativeElement as HTMLElement;
    return Array.from(root.querySelectorAll<HTMLElement>('app-collapsible-card-group')).find(
      group => group.querySelector('.card-group__label')?.textContent?.trim() === heading,
    );
  }

  function cardNamesIn(heading: string): string[] {
    const group = cardGroup(heading);
    return Array.from(group?.querySelectorAll<HTMLElement>('.entity-card__name') ?? []).map(
      el => el.textContent?.trim() ?? '',
    );
  }

  /** Clicks a group's header toggle -- the Domain Card Vault needs this before its cards exist. */
  function toggleGroup(heading: string): void {
    (cardGroup(heading)?.querySelector('.card-group__toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  it('renders one EntityCard per class/subclass/ancestry/community and equipped domain card', () => {
    createComponent();
    // The vault group starts collapsed, so its one card is deliberately absent from this count.
    expect(entityCards().length).toBe(1 + 1 + 1 + 1 + 1);
  });

  it('maps a subclass card\'s level onto the EntityCard subtitle text', () => {
    createComponent();
    const names = entityCards().map(el => el.textContent);
    expect(names.some(t => t?.includes('Warden of the Elements') && t.includes('Mastery'))).toBe(true);
  });

  describe('combined Class & Subclass group', () => {
    const multiclassResponse: CharacterSheetResponse = {
      ...mockResponse,
      classes: [
        { id: 1, name: 'Sorcerer', classFeatures: [] },
        { id: 7, name: 'Warrior', classFeatures: [] },
      ],
      subclassCards: [
        { id: 20, name: 'Call of the Brave', associatedClassId: 7, level: 'FOUNDATION', features: [] },
        { id: 12, name: 'Elemental Fury', associatedClassId: 1, level: 'MASTERY', features: [] },
        { id: 10, name: 'Elemental Origin', associatedClassId: 1, level: 'FOUNDATION', features: [] },
      ],
    };

    it('renders class and subclass cards under one heading instead of two groups', () => {
      createComponent();

      expect(cardGroup('Class & Subclass')).toBeTruthy();
      expect(cardGroup('Class')).toBeUndefined();
      expect(cardGroup('Subclass')).toBeUndefined();
      expect(cardNamesIn('Class & Subclass')).toEqual(['Sorcerer', 'Warden of the Elements']);
    });

    it('lists every class in API order, then each class\'s subclasses lowest level first', () => {
      createComponent(of(multiclassResponse));

      expect(cardNamesIn('Class & Subclass')).toEqual([
        'Sorcerer',
        'Warrior',
        'Elemental Origin',
        'Elemental Fury',
        'Call of the Brave',
      ]);
    });

    it('renders a class card and a subclass card that share a numeric id without a track collision', () => {
      expect(() =>
        createComponent(
          of({
            ...mockResponse,
            classes: [{ id: 3, name: 'Sorcerer', classFeatures: [] }],
            subclassCards: [{ id: 3, name: 'Elemental Origin', associatedClassId: 3, level: 'FOUNDATION', features: [] }],
          }),
        ),
      ).not.toThrow();
      expect(cardNamesIn('Class & Subclass')).toEqual(['Sorcerer', 'Elemental Origin']);
    });
  });

  describe('combined Ancestry & Community group', () => {
    it('renders ancestry cards before community cards under one heading', () => {
      createComponent();

      expect(cardGroup('Ancestry & Community')).toBeTruthy();
      expect(cardNamesIn('Ancestry & Community')).toEqual(['Elf', 'Highborne']);
    });

    it('keeps the group when only one of the two card types is present', () => {
      createComponent(of({ ...mockResponse, ancestryCards: [], ancestryCardIds: [] }));

      expect(cardNamesIn('Ancestry & Community')).toEqual(['Highborne']);
    });
  });

  it('collapses a group and hides its cards when its heading is clicked', () => {
    createComponent();

    toggleGroup('Class & Subclass');

    expect(cardNamesIn('Class & Subclass')).toEqual([]);
    expect(cardGroup('Class & Subclass')?.querySelector('.card-group__label')?.textContent?.trim())
      .toBe('Class & Subclass');
  });

  it('shows the equipped/max count on the Equipped Domain Cards heading', () => {
    createComponent();
    const count = cardGroup('Equipped Domain Cards')?.querySelector('.card-group__count');
    expect(count?.textContent?.trim()).toBe('1/5');
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

  it('starts the Domain Card Vault collapsed, with its count still visible', () => {
    createComponent();

    expect(entityCards(cardGroup('Domain Card Vault')!).length).toBe(0);
    expect(cardGroup('Domain Card Vault')?.querySelector('.card-group__count')?.textContent?.trim()).toBe('1');
  });

  it('renders vault domain cards as muted EntityCards once the vault is expanded', () => {
    createComponent();
    toggleGroup('Domain Card Vault');

    const vaulted = fixture.debugElement.query(By.css('.vault-section app-entity-card'));
    expect(vaulted.nativeElement.classList.contains('entity-card--muted')).toBe(true);
  });

  it('moves a domain card from vault to equipped when its inherited Equip handler fires', () => {
    createComponent();
    toggleGroup('Domain Card Vault');

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

  it('renders the beta inventory section, not the classic one', () => {
    createComponent();
    expect(fixture.debugElement.query(By.directive(InventorySectionBeta))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(InventorySection))).toBeNull();
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

  it('does not render a card group when both of its card arrays are empty', () => {
    createComponent(
      of({ ...mockResponse, ancestryCards: [], ancestryCardIds: [], communityCards: [], communityCardIds: [] }),
    );

    expect(cardGroup('Ancestry & Community')).toBeUndefined();
  });

  describe('in-place item dialog', () => {
    it('opens the item dialog with the kind and itemId instead of navigating when editing an inventory item', () => {
      createComponent();
      const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');

      component.onEditInventoryItem({ type: 'weapon', itemId: 42 });

      expect(component.itemModalRequest()).toEqual({ kind: 'weapon', itemId: 42 });
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('opens the dialog in create mode with a null itemId', () => {
      createComponent();

      component.setCreatingItemKind('weapon');

      expect(component.itemModalRequest()).toEqual({ kind: 'weapon', itemId: null });
    });

    it('closes the dialog when setCreatingItemKind(null) is called', () => {
      createComponent();
      component.setCreatingItemKind('weapon');

      component.setCreatingItemKind(null);

      expect(component.itemModalRequest()).toBeNull();
    });

    it('closes the dialog and re-requests the sheet when the item dialog reports an update', () => {
      createComponent();
      component.itemModalRequest.set({ kind: 'weapon', itemId: 42 });
      const service = TestBed.inject(CharacterSheetService) as unknown as { getCharacterSheet: ReturnType<typeof vi.fn> };
      service.getCharacterSheet.mockClear();

      component.onItemModalUpdated();

      expect(component.itemModalRequest()).toBeNull();
      expect(service.getCharacterSheet).toHaveBeenCalledWith(1, expect.any(Array));
    });
  });
});
