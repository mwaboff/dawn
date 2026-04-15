import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { of } from 'rxjs';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';

import { AdvancementConfig } from './advancement-config';
import { AvailableAdvancement, AdvancementChoice, TraitEnum, LevelUpOptionsResponse } from '../../models/level-up-api.model';
import { CharacterSheetView } from '../../../character-sheet/models/character-sheet-view.model';
import { DomainService } from '../../../../shared/services/domain.service';
import { SubclassService } from '../../../../shared/services/subclass.service';
import { SubclassPathService } from '../../../../shared/services/subclass-path.service';

const mockCharacterSheet: CharacterSheetView = {
  id: 1,
  ownerId: 1,
  name: 'Test Hero',
  level: 2,
  proficiency: { base: 1, modified: 1, hasModifier: false, modifierSources: [] },
  evasion: { base: 10, modified: 10, hasModifier: false, modifierSources: [] },
  hitPointMax: { base: 6, modified: 6, hasModifier: false, modifierSources: [] },
  armorScore: { base: 0, modified: 0, hasModifier: false, modifierSources: [] },
  majorDamageThreshold: { base: 4, modified: 4, hasModifier: false, modifierSources: [] },
  severeDamageThreshold: { base: 8, modified: 8, hasModifier: false, modifierSources: [] },
  hopeMax: { base: 5, modified: 5, hasModifier: false, modifierSources: [] },
  stressMax: { base: 5, modified: 5, hasModifier: false, modifierSources: [] },
  hitPointMarked: 0,
  armorMarked: 0,
  armorMax: 0,
  hopeMarked: 0,
  stressMarked: 0,
  gold: 0,
  traits: [
    { name: 'Agility', abbreviation: 'AGI', modifier: { base: 2, modified: 2, hasModifier: false, modifierSources: [] }, marked: false },
    { name: 'Strength', abbreviation: 'STR', modifier: { base: 1, modified: 1, hasModifier: false, modifierSources: [] }, marked: false },
    { name: 'Finesse', abbreviation: 'FIN', modifier: { base: 0, modified: 0, hasModifier: false, modifierSources: [] }, marked: true },
    { name: 'Instinct', abbreviation: 'INS', modifier: { base: -1, modified: -1, hasModifier: false, modifierSources: [] }, marked: false },
    { name: 'Presence', abbreviation: 'PRE', modifier: { base: 1, modified: 1, hasModifier: false, modifierSources: [] }, marked: false },
    { name: 'Knowledge', abbreviation: 'KNO', modifier: { base: 0, modified: 0, hasModifier: false, modifierSources: [] }, marked: false },
  ],
  activePrimaryWeapon: null,
  activeSecondaryWeapon: null,
  activeArmor: null,
  subclassCards: [],
  ancestryCards: [],
  communityCards: [],
  domainCards: [],
  equippedDomainCards: [],
  vaultDomainCards: [],
  maxEquippedDomainCards: 5,
  inventoryWeapons: [],
  inventoryArmors: [],
  inventoryItems: [],
  experiences: [
    { id: 1, description: 'Survived the Wilds', modifier: 2 },
    { id: 2, description: 'Defeated the Dragon', modifier: 3 },
    { id: 3, description: 'Founded a Guild', modifier: 1 },
  ],
  classEntries: [],
};

const mockLevelUpOptions: LevelUpOptionsResponse = {
  currentLevel: 1,
  nextLevel: 2,
  currentTier: 1,
  nextTier: 2,
  tierTransition: true,
  availableAdvancements: [],
  domainCardLevelCap: null,
  accessibleDomainIds: [],
  equippedDomainCardCount: 2,
  maxEquippedDomainCards: 5,
};

function createBoostTraitsAdvancement(): AvailableAdvancement {
  return {
    type: 'BOOST_TRAITS',
    description: 'Boost two traits',
    limitPerTier: 2,
    usedInTier: 0,
    remaining: 2,
    mutuallyExclusiveWith: null,
  };
}

function createBoostExperiencesAdvancement(): AvailableAdvancement {
  return {
    type: 'BOOST_EXPERIENCES',
    description: 'Boost two experiences',
    limitPerTier: 2,
    usedInTier: 0,
    remaining: 2,
    mutuallyExclusiveWith: null,
  };
}

@Component({
  template: `
    <app-advancement-config
      [advancement]="advancement()"
      [characterSheet]="characterSheet()"
      [levelUpOptions]="levelUpOptions()"
      [initialChoice]="initialChoice()"
      [excludedTraits]="excludedTraits()"
      (configChanged)="onConfigChanged($event)"
    />
  `,
  imports: [AdvancementConfig],
})
class TestHost {
  advancement = signal<AvailableAdvancement>(createBoostTraitsAdvancement());
  characterSheet = signal<CharacterSheetView>(mockCharacterSheet);
  levelUpOptions = signal<LevelUpOptionsResponse>(mockLevelUpOptions);
  initialChoice = signal<AdvancementChoice | undefined>(undefined);
  excludedTraits = signal<TraitEnum[]>([]);
  lastEmittedChoice: AdvancementChoice | null = null;

  onConfigChanged(choice: AdvancementChoice): void {
    this.lastEmittedChoice = choice;
  }
}

describe('AdvancementConfig', () => {
  let hostFixture: ComponentFixture<TestHost>;
  let host: TestHost;

  const mockDomainService = { getDomainCards: vi.fn().mockReturnValue(of([])) };
  const mockSubclassService = { getSubclasses: vi.fn().mockReturnValue(of([])) };
  const mockSubclassPathService = { getSubclassPaths: vi.fn().mockReturnValue(of([])) };

  beforeEach(async () => {
    mockDomainService.getDomainCards.mockClear();
    mockSubclassService.getSubclasses.mockClear();
    mockSubclassPathService.getSubclassPaths.mockClear();

    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        { provide: DomainService, useValue: mockDomainService },
        { provide: SubclassService, useValue: mockSubclassService },
        { provide: SubclassPathService, useValue: mockSubclassPathService },
      ],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHost);
    host = hostFixture.componentInstance;
  });

  it('should create', () => {
    hostFixture.detectChanges();
    const el = hostFixture.nativeElement.querySelector('app-advancement-config');
    expect(el).toBeTruthy();
  });

  describe('BOOST_TRAITS', () => {
    beforeEach(() => {
      hostFixture.detectChanges();
    });

    it('should render checkboxes for unmarked traits only', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.trait-checkbox');

      expect(checkboxes.length).toBe(5);

      const names = Array.from(checkboxes).map(
        cb => cb.querySelector('.trait-checkbox__name')?.textContent?.trim()
      );
      expect(names).toContain('Agility');
      expect(names).toContain('Strength');
      expect(names).not.toContain('Finesse');
    });

    it('should include marked traits during tier 3 transition', () => {
      host.levelUpOptions.set({
        ...mockLevelUpOptions,
        currentLevel: 4,
        nextLevel: 5,
        currentTier: 2,
        nextTier: 3,
        tierTransition: true,
      });
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.trait-checkbox');
      expect(checkboxes.length).toBe(6);

      const names = Array.from(checkboxes).map(
        cb => cb.querySelector('.trait-checkbox__name')?.textContent?.trim()
      );
      expect(names).toContain('Finesse');
    });

    it('should include marked traits during tier 4 transition', () => {
      host.levelUpOptions.set({
        ...mockLevelUpOptions,
        currentLevel: 7,
        nextLevel: 8,
        currentTier: 3,
        nextTier: 4,
        tierTransition: true,
      });
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.trait-checkbox');
      expect(checkboxes.length).toBe(6);
    });

    it('should NOT include marked traits during tier 2 transition', () => {
      host.levelUpOptions.set({
        ...mockLevelUpOptions,
        currentLevel: 1,
        nextLevel: 2,
        currentTier: 1,
        nextTier: 2,
        tierTransition: true,
      });
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.trait-checkbox');
      expect(checkboxes.length).toBe(5);
    });

    it('should display trait modifiers', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const modifiers = compiled.querySelectorAll('.trait-checkbox__modifier');
      const values = Array.from(modifiers).map(m => m.textContent?.trim());

      expect(values).toContain('+2');
      expect(values).toContain('+1');
      expect(values).toContain('-1');
    });

    it('should toggle trait selection on checkbox change', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.trait-checkbox input') as NodeListOf<HTMLInputElement>;

      checkboxes[0].click();
      hostFixture.detectChanges();

      const labels = compiled.querySelectorAll('.trait-checkbox');
      expect(labels[0].classList.contains('selected')).toBe(true);
    });

    it('should limit selection to 2 traits', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.trait-checkbox input') as NodeListOf<HTMLInputElement>;

      checkboxes[0].click();
      hostFixture.detectChanges();
      checkboxes[1].click();
      hostFixture.detectChanges();

      expect(checkboxes[2].disabled).toBe(true);
      expect(checkboxes[3].disabled).toBe(true);
    });

    it('should emit configChanged when 2 traits are selected', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.trait-checkbox input') as NodeListOf<HTMLInputElement>;

      checkboxes[0].click();
      hostFixture.detectChanges();
      checkboxes[1].click();
      hostFixture.detectChanges();

      expect(host.lastEmittedChoice).toBeTruthy();
      expect(host.lastEmittedChoice?.type).toBe('BOOST_TRAITS');
      expect(host.lastEmittedChoice?.traits?.length).toBe(2);
    });

    it('should allow deselecting a trait', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.trait-checkbox input') as NodeListOf<HTMLInputElement>;

      checkboxes[0].click();
      hostFixture.detectChanges();
      checkboxes[0].click();
      hostFixture.detectChanges();

      const labels = compiled.querySelectorAll('.trait-checkbox');
      expect(labels[0].classList.contains('selected')).toBe(false);
    });

    it('should show boost arrow when a trait is selected', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.trait-checkbox input') as NodeListOf<HTMLInputElement>;

      checkboxes[0].click();
      hostFixture.detectChanges();

      const arrow = compiled.querySelectorAll('.trait-boost-arrow');
      expect(arrow.length).toBe(1);
      expect(arrow[0].textContent).toContain('+3');
    });

    it('should not show boost arrow for unselected traits', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;

      const arrows = compiled.querySelectorAll('.trait-boost-arrow');
      expect(arrows.length).toBe(0);
    });

    it('should remove boost arrow when a trait is deselected', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.trait-checkbox input') as NodeListOf<HTMLInputElement>;

      checkboxes[0].click();
      hostFixture.detectChanges();
      expect(compiled.querySelectorAll('.trait-boost-arrow').length).toBe(1);

      checkboxes[0].click();
      hostFixture.detectChanges();
      expect(compiled.querySelectorAll('.trait-boost-arrow').length).toBe(0);
    });
  });

  describe('BOOST_EXPERIENCES', () => {
    beforeEach(() => {
      host.advancement.set(createBoostExperiencesAdvancement());
      hostFixture.detectChanges();
    });

    it('should render checkboxes for all experiences', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.experience-checkbox');

      expect(checkboxes.length).toBe(3);
    });

    it('should display experience descriptions and modifiers', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const descs = compiled.querySelectorAll('.experience-checkbox__desc');
      const mods = compiled.querySelectorAll('.experience-checkbox__mod');

      expect(descs[0].textContent?.trim()).toBe('Survived the Wilds');
      expect(mods[0].textContent?.trim()).toBe('+2');
    });

    it('should toggle experience selection', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.experience-checkbox input') as NodeListOf<HTMLInputElement>;

      checkboxes[0].click();
      hostFixture.detectChanges();

      const labels = compiled.querySelectorAll('.experience-checkbox');
      expect(labels[0].classList.contains('selected')).toBe(true);
    });

    it('should limit selection to 2 experiences', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.experience-checkbox input') as NodeListOf<HTMLInputElement>;

      checkboxes[0].click();
      hostFixture.detectChanges();
      checkboxes[1].click();
      hostFixture.detectChanges();

      expect(checkboxes[2].disabled).toBe(true);
    });

    it('should emit configChanged when 2 experiences are selected', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.experience-checkbox input') as NodeListOf<HTMLInputElement>;

      checkboxes[0].click();
      hostFixture.detectChanges();
      checkboxes[1].click();
      hostFixture.detectChanges();

      expect(host.lastEmittedChoice).toBeTruthy();
      expect(host.lastEmittedChoice?.type).toBe('BOOST_EXPERIENCES');
      expect(host.lastEmittedChoice?.experienceIds?.length).toBe(2);
    });

    it('should show boost arrow when an experience is selected', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.experience-checkbox input') as NodeListOf<HTMLInputElement>;

      checkboxes[0].click();
      hostFixture.detectChanges();

      const arrows = compiled.querySelectorAll('.experience-boost-arrow');
      expect(arrows.length).toBe(1);
      expect(arrows[0].textContent).toContain('+3');
    });

    it('should not show boost arrow for unselected experiences', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;

      const arrows = compiled.querySelectorAll('.experience-boost-arrow');
      expect(arrows.length).toBe(0);
    });
  });

  describe('UPGRADE_SUBCLASS', () => {
    beforeEach(() => {
      host.advancement.set({
        type: 'UPGRADE_SUBCLASS',
        description: 'Upgrade subclass',
        limitPerTier: 1,
        usedInTier: 0,
        remaining: 1,
        mutuallyExclusiveWith: 'MULTICLASS',
      });
      host.characterSheet.set({
        ...mockCharacterSheet,
        subclassCards: [
          { id: 100, name: 'Troubadour', description: '', features: [], associatedClassId: 1, associatedClassName: 'Bard', subclassPathName: 'Troubadour', level: 'FOUNDATION' },
        ],
      });
      hostFixture.detectChanges();
    });

    it('should load subclass cards for all character class IDs', () => {
      expect(mockSubclassService.getSubclasses).toHaveBeenCalledWith(1);
    });

    it('should load subclass cards for multiple classes when multiclassed', async () => {
      mockSubclassService.getSubclasses.mockClear();

      const multiclassFixture = TestBed.createComponent(TestHost);
      const multiclassHost = multiclassFixture.componentInstance;
      multiclassHost.advancement.set({
        type: 'UPGRADE_SUBCLASS',
        description: 'Upgrade subclass',
        limitPerTier: 1,
        usedInTier: 0,
        remaining: 1,
        mutuallyExclusiveWith: 'MULTICLASS',
      });
      multiclassHost.characterSheet.set({
        ...mockCharacterSheet,
        subclassCards: [
          { id: 100, name: 'Troubadour', description: '', features: [], associatedClassId: 1, associatedClassName: 'Bard', subclassPathName: 'Troubadour', level: 'FOUNDATION' },
          { id: 300, name: 'Berserker', description: '', features: [], associatedClassId: 2, associatedClassName: 'Warrior', subclassPathName: 'Berserker', level: 'FOUNDATION' },
        ],
      });
      multiclassFixture.detectChanges();

      expect(mockSubclassService.getSubclasses).toHaveBeenCalledWith(1);
      expect(mockSubclassService.getSubclasses).toHaveBeenCalledWith(2);
    });

    it('should render subclass path selector', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const selector = compiled.querySelector('app-subclass-path-selector');
      expect(selector).toBeTruthy();
    });

    it('should display upgrade hint text', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const hint = compiled.querySelector('.config-hint');
      expect(hint?.textContent).toContain('next upgrade');
    });
  });

  describe('GAIN_DOMAIN_CARD', () => {
    beforeEach(() => {
      host.advancement.set({
        type: 'GAIN_DOMAIN_CARD',
        description: 'Gain a domain card',
        limitPerTier: 1,
        usedInTier: 0,
        remaining: 1,
        mutuallyExclusiveWith: null,
      });
      host.levelUpOptions.set({
        ...mockLevelUpOptions,
        accessibleDomainIds: [1, 2],
        domainCardLevelCap: 3,
      });
      hostFixture.detectChanges();
    });

    it('should load domain cards on init', () => {
      expect(mockDomainService.getDomainCards).toHaveBeenCalledWith(
        [1, 2], 0, 100, [1, 2, 3]
      );
    });

    it('should render card selection grid', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const grid = compiled.querySelector('app-card-selection-grid');
      expect(grid).toBeTruthy();
    });
  });

  describe('MULTICLASS', () => {
    const mockSubclassPathCards: CardData[] = [
      { id: 10, name: 'Troubadour', description: '', cardType: 'subclassPath' as never, metadata: { associatedClassId: 1, associatedClass: { id: 1, name: 'Bard' } } },
      { id: 20, name: 'Berserker', description: '', cardType: 'subclassPath' as never, metadata: { associatedClassId: 2, associatedClass: { id: 2, name: 'Warrior' } } },
      { id: 30, name: 'Sharpshooter', description: '', cardType: 'subclassPath' as never, metadata: { associatedClassId: 3, associatedClass: { id: 3, name: 'Ranger' } } },
    ];

    const mockWarriorSubclassCards: CardData[] = [
      { id: 200, name: 'Berserker', description: '', cardType: 'subclass', metadata: { subclassPathId: 20, level: 'FOUNDATION', associatedClassName: 'Warrior' } },
      { id: 201, name: 'Berserker Spec', description: '', cardType: 'subclass', metadata: { subclassPathId: 20, level: 'SPECIALIZATION', associatedClassName: 'Warrior' } },
    ];

    const mockRangerSubclassCards: CardData[] = [
      { id: 300, name: 'Sharpshooter', description: '', cardType: 'subclass', metadata: { subclassPathId: 30, level: 'FOUNDATION', associatedClassName: 'Ranger' } },
    ];

    beforeEach(() => {
      host.advancement.set({
        type: 'MULTICLASS',
        description: 'Multiclass',
        limitPerTier: 1,
        usedInTier: 0,
        remaining: 1,
        mutuallyExclusiveWith: 'UPGRADE_SUBCLASS',
      });
      host.characterSheet.set({
        ...mockCharacterSheet,
        subclassCards: [
          { id: 100, name: 'Troubadour', description: '', features: [], associatedClassId: 1, associatedClassName: 'Bard', subclassPathName: 'Troubadour', level: 'FOUNDATION' },
        ],
      });
      mockSubclassPathService.getSubclassPaths.mockReturnValue(of(mockSubclassPathCards));
      mockSubclassService.getSubclasses.mockImplementation((classId: number) => {
        if (classId === 2) return of(mockWarriorSubclassCards);
        if (classId === 3) return of(mockRangerSubclassCards);
        return of([]);
      });
      hostFixture.detectChanges();
    });

    it('should load subclass paths and fetch subclasses for eligible classes', () => {
      expect(mockSubclassPathService.getSubclassPaths).toHaveBeenCalled();
      expect(mockSubclassService.getSubclasses).toHaveBeenCalledWith(2);
      expect(mockSubclassService.getSubclasses).toHaveBeenCalledWith(3);
      expect(mockSubclassService.getSubclasses).not.toHaveBeenCalledWith(1);
    });

    it('should render subclass path selector', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const selector = compiled.querySelector('app-subclass-path-selector');
      expect(selector).toBeTruthy();
    });

    it('should show class filter pills when multiple classes available', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const pills = compiled.querySelectorAll('.class-pill');
      expect(pills.length).toBe(3);
      expect(pills[0].textContent?.trim()).toBe('All');
      expect(pills[1].textContent?.trim()).toBe('Ranger');
      expect(pills[2].textContent?.trim()).toBe('Warrior');
    });

    it('should default All filter as active', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const allPill = compiled.querySelector('.class-pill');
      expect(allPill?.classList.contains('active')).toBe(true);
    });

    it('should filter cards when a class pill is clicked', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const pills = compiled.querySelectorAll('.class-pill');
      (pills[2] as HTMLButtonElement).click();
      hostFixture.detectChanges();

      expect(pills[2].classList.contains('active')).toBe(true);
      const paths = compiled.querySelectorAll('.tabbed-path');
      expect(paths.length).toBe(1);
    });

    it('should show all cards when All pill is clicked after filtering', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const pills = compiled.querySelectorAll('.class-pill');
      (pills[2] as HTMLButtonElement).click();
      hostFixture.detectChanges();
      (pills[0] as HTMLButtonElement).click();
      hostFixture.detectChanges();

      const paths = compiled.querySelectorAll('.tabbed-path');
      expect(paths.length).toBe(2);
    });

    it('should display hint text', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const hint = compiled.querySelector('.config-hint');
      expect(hint?.textContent).toContain('Choose a new class path');
    });

    it('should emit configChanged with MULTICLASS type when a card is selected', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const cardInner = compiled.querySelector('app-daggerheart-card .card') as HTMLElement;
      cardInner.click();
      hostFixture.detectChanges();

      expect(host.lastEmittedChoice).toBeTruthy();
      expect(host.lastEmittedChoice?.type).toBe('MULTICLASS');
      expect(host.lastEmittedChoice?.subclassCardId).toBe(200);
    });

    it('should not show class filter when only one class is available', () => {
      mockSubclassPathService.getSubclassPaths.mockReturnValue(of([mockSubclassPathCards[1]]));
      mockSubclassService.getSubclasses.mockReturnValue(of(mockWarriorSubclassCards));

      const singleClassFixture = TestBed.createComponent(TestHost);
      const singleClassHost = singleClassFixture.componentInstance;
      singleClassHost.advancement.set({
        type: 'MULTICLASS',
        description: 'Multiclass',
        limitPerTier: 1,
        usedInTier: 0,
        remaining: 1,
        mutuallyExclusiveWith: 'UPGRADE_SUBCLASS',
      });
      singleClassHost.characterSheet.set(mockCharacterSheet);
      singleClassFixture.detectChanges();

      const compiled = singleClassFixture.nativeElement as HTMLElement;
      const filter = compiled.querySelector('.class-filter');
      expect(filter).toBeNull();
    });
  });

  describe('excluded traits', () => {
    beforeEach(() => {
      host.excludedTraits.set(['AGILITY', 'STRENGTH']);
      hostFixture.detectChanges();
    });

    it('should show excluded class on traits in excludedTraits list', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxLabels = compiled.querySelectorAll('.trait-checkbox');

      const agilityLabel = Array.from(checkboxLabels).find(
        el => el.querySelector('.trait-checkbox__name')?.textContent?.trim() === 'Agility'
      );
      expect(agilityLabel?.classList.contains('excluded')).toBe(true);
    });

    it('should disable excluded trait checkboxes', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxLabels = compiled.querySelectorAll('.trait-checkbox');

      const agilityLabel = Array.from(checkboxLabels).find(
        el => el.querySelector('.trait-checkbox__name')?.textContent?.trim() === 'Agility'
      );
      const input = agilityLabel?.querySelector('input') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it('should show exclusion note for excluded traits', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const notes = compiled.querySelectorAll('.trait-excluded-note');
      expect(notes.length).toBe(2);
      expect(notes[0].textContent).toContain('chosen in other selection');
    });

    it('should not show modifier for excluded traits', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxLabels = compiled.querySelectorAll('.trait-checkbox');

      const agilityLabel = Array.from(checkboxLabels).find(
        el => el.querySelector('.trait-checkbox__name')?.textContent?.trim() === 'Agility'
      );
      const modifier = agilityLabel?.querySelector('.trait-checkbox__modifier');
      expect(modifier).toBeNull();
    });

    it('should not apply excluded styling to non-excluded traits', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxLabels = compiled.querySelectorAll('.trait-checkbox');

      const instinctLabel = Array.from(checkboxLabels).find(
        el => el.querySelector('.trait-checkbox__name')?.textContent?.trim() === 'Instinct'
      );
      expect(instinctLabel?.classList.contains('excluded')).toBe(false);
    });

    it('should auto-deselect a trait that becomes excluded', () => {
      // First, clear excluded so we can select
      host.excludedTraits.set([]);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const checkboxes = compiled.querySelectorAll('.trait-checkbox input') as NodeListOf<HTMLInputElement>;

      // Select Agility (index 0)
      checkboxes[0].click();
      hostFixture.detectChanges();

      const labels = compiled.querySelectorAll('.trait-checkbox');
      expect(labels[0].classList.contains('selected')).toBe(true);

      // Now exclude Agility
      host.excludedTraits.set(['AGILITY']);
      hostFixture.detectChanges();

      expect(labels[0].classList.contains('selected')).toBe(false);
      expect(labels[0].classList.contains('excluded')).toBe(true);
    });
  });
});
