import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { of } from 'rxjs';

import { AdvancementConfig } from './advancement-config';
import { AvailableAdvancement, AdvancementChoice, LevelUpOptionsResponse } from '../../models/level-up-api.model';
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
    { name: 'Agility', abbreviation: 'AGI', modifier: 2, marked: false },
    { name: 'Strength', abbreviation: 'STR', modifier: 1, marked: false },
    { name: 'Finesse', abbreviation: 'FIN', modifier: 0, marked: true },
    { name: 'Instinct', abbreviation: 'INS', modifier: -1, marked: false },
    { name: 'Presence', abbreviation: 'PRE', modifier: 1, marked: false },
    { name: 'Knowledge', abbreviation: 'KNO', modifier: 0, marked: false },
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
});
