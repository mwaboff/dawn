import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { of } from 'rxjs';

import { AdvancementsStep } from './advancements-step';
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

const sampleAdvancements: AvailableAdvancement[] = [
  { type: 'GAIN_HP', description: 'Increase HP by 1', limitPerTier: 2, usedInTier: 0, remaining: 2, mutuallyExclusiveWith: null },
  { type: 'GAIN_STRESS', description: 'Increase Stress by 1', limitPerTier: 2, usedInTier: 0, remaining: 2, mutuallyExclusiveWith: null },
  { type: 'BOOST_TRAITS', description: 'Boost two traits', limitPerTier: 2, usedInTier: 0, remaining: 2, mutuallyExclusiveWith: null },
  { type: 'BOOST_EVASION', description: 'Increase Evasion', limitPerTier: 1, usedInTier: 1, remaining: 0, mutuallyExclusiveWith: null },
  { type: 'BOOST_PROFICIENCY', description: 'Increase Proficiency', limitPerTier: 1, usedInTier: 0, remaining: 1, mutuallyExclusiveWith: 'MULTICLASS' },
  { type: 'MULTICLASS', description: 'Gain a new class', limitPerTier: 1, usedInTier: 0, remaining: 1, mutuallyExclusiveWith: 'BOOST_PROFICIENCY' },
];

@Component({
  template: `
    <app-advancements-step
      [availableAdvancements]="advancements()"
      [characterSheet]="characterSheet()"
      [levelUpOptions]="levelUpOptions()"
      [initialAdvancements]="initialAdvancements()"
      (advancementsChanged)="onAdvancementsChanged($event)"
    />
  `,
  imports: [AdvancementsStep],
})
class TestHost {
  advancements = signal<AvailableAdvancement[]>(sampleAdvancements);
  characterSheet = signal<CharacterSheetView>(mockCharacterSheet);
  levelUpOptions = signal<LevelUpOptionsResponse>(mockLevelUpOptions);
  initialAdvancements = signal<AdvancementChoice[]>([]);
  lastEmittedAdvancements: AdvancementChoice[] | null = null;

  onAdvancementsChanged(choices: AdvancementChoice[]): void {
    this.lastEmittedAdvancements = choices;
  }
}

describe('AdvancementsStep', () => {
  let hostFixture: ComponentFixture<TestHost>;
  let host: TestHost;

  const mockDomainService = { getDomainCards: vi.fn().mockReturnValue(of([])) };
  const mockSubclassService = { getSubclasses: vi.fn().mockReturnValue(of([])) };
  const mockSubclassPathService = { getSubclassPaths: vi.fn().mockReturnValue(of([])) };

  beforeEach(async () => {
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
    hostFixture.detectChanges();
  });

  it('should create', () => {
    const el = hostFixture.nativeElement.querySelector('app-advancements-step');
    expect(el).toBeTruthy();
  });

  it('should render all advancement tiles', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');
    expect(tiles.length).toBe(6);
  });

  it('should display advancement labels and descriptions', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const labels = compiled.querySelectorAll('.advancement-tile__label');
    const descriptions = compiled.querySelectorAll('.advancement-tile__description');

    expect(labels[0].textContent?.trim()).toBe('Boost HP Max');
    expect(descriptions[0].textContent?.trim()).toBe('Increase HP by 1');
  });

  it('should display remaining counts', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const counts = compiled.querySelectorAll('.advancement-tile__count');

    expect(counts[0].textContent?.trim()).toBe('2/2');
    expect(counts[3].textContent?.trim()).toBe('0/1');
  });

  it('should show mutual exclusion note', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const exclusives = compiled.querySelectorAll('.advancement-tile__exclusive');

    expect(exclusives.length).toBe(2);
    expect(exclusives[0].textContent).toContain('Exclusive with Multiclass');
  });

  it('should toggle selection when tile is clicked', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');

    (tiles[0] as HTMLElement).click();
    hostFixture.detectChanges();

    expect(tiles[0].classList.contains('selected')).toBe(true);
  });

  it('should deselect when a selected tile is clicked again', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');

    (tiles[0] as HTMLElement).click();
    hostFixture.detectChanges();
    (tiles[0] as HTMLElement).click();
    hostFixture.detectChanges();

    expect(tiles[0].classList.contains('selected')).toBe(false);
  });

  it('should allow selecting up to 2 advancements', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');

    (tiles[0] as HTMLElement).click();
    hostFixture.detectChanges();
    (tiles[1] as HTMLElement).click();
    hostFixture.detectChanges();

    expect(tiles[0].classList.contains('selected')).toBe(true);
    expect(tiles[1].classList.contains('selected')).toBe(true);
  });

  it('should disable unselected tiles when 2 are selected', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');

    (tiles[0] as HTMLElement).click();
    hostFixture.detectChanges();
    (tiles[1] as HTMLElement).click();
    hostFixture.detectChanges();

    expect(tiles[2].classList.contains('disabled')).toBe(true);
  });

  it('should disable tiles with remaining=0', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');

    expect(tiles[3].classList.contains('disabled')).toBe(true);
  });

  it('should enforce mutual exclusion', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');

    // Select BOOST_PROFICIENCY (index 4)
    (tiles[4] as HTMLElement).click();
    hostFixture.detectChanges();

    // MULTICLASS (index 5) should be disabled
    expect(tiles[5].classList.contains('disabled')).toBe(true);
  });

  it('should emit advancementsChanged for non-config advancements', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');

    // Select GAIN_HP (no config needed)
    (tiles[0] as HTMLElement).click();
    hostFixture.detectChanges();

    expect(host.lastEmittedAdvancements).toBeTruthy();
    expect(host.lastEmittedAdvancements?.length).toBe(1);
    expect(host.lastEmittedAdvancements?.[0].type).toBe('GAIN_HP');
  });

  it('should show config panel for configurable advancement types', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');

    // Select BOOST_TRAITS (index 2, needs config)
    (tiles[2] as HTMLElement).click();
    hostFixture.detectChanges();

    const configWrapper = compiled.querySelector('.advancement-config-wrapper');
    expect(configWrapper).toBeTruthy();
  });

  it('should not show config panel for non-configurable advancements', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');

    // Select GAIN_HP (index 0, no config)
    (tiles[0] as HTMLElement).click();
    hostFixture.detectChanges();

    const configWrapper = compiled.querySelector('.advancement-config-wrapper');
    expect(configWrapper).toBeNull();
  });

  it('should display selection count', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const instruction = compiled.querySelector('.step-instruction');

    expect(instruction?.textContent).toContain('0/2');

    const tiles = compiled.querySelectorAll('.advancement-tile');
    (tiles[0] as HTMLElement).click();
    hostFixture.detectChanges();

    expect(instruction?.textContent).toContain('1/2');
  });

  it('should set aria-pressed on selected tiles', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');

    (tiles[0] as HTMLElement).click();
    hostFixture.detectChanges();

    expect(tiles[0].getAttribute('aria-pressed')).toBe('true');
    expect(tiles[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('should set aria-disabled on disabled tiles', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');

    // BOOST_EVASION (index 3) has remaining=0
    expect(tiles[3].getAttribute('aria-disabled')).toBe('true');
  });

  it('should show stat arrow for GAIN_HP when selected', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');

    (tiles[0] as HTMLElement).click();
    hostFixture.detectChanges();

    const arrow = tiles[0].querySelector('.stat-boost-arrow');
    expect(arrow).toBeTruthy();
    expect(arrow?.textContent).toContain('6 → 7');
  });

  it('should show stat arrow for GAIN_STRESS when selected', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');

    (tiles[1] as HTMLElement).click();
    hostFixture.detectChanges();

    const arrow = tiles[1].querySelector('.stat-boost-arrow');
    expect(arrow).toBeTruthy();
    expect(arrow?.textContent).toContain('5 → 6');
  });

  it('should not show stat arrow when tile is not selected', () => {
    const compiled = hostFixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.advancement-tile');

    const arrow = tiles[0].querySelector('.stat-boost-arrow');
    expect(arrow).toBeNull();
  });

  it('should hide exclusive note when exclusive type is not in available advancements', () => {
    host.advancements.set([
      { type: 'BOOST_PROFICIENCY', description: 'Increase Proficiency', limitPerTier: 1, usedInTier: 0, remaining: 1, mutuallyExclusiveWith: 'MULTICLASS' },
    ]);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const exclusives = compiled.querySelectorAll('.advancement-tile__exclusive');
    expect(exclusives.length).toBe(0);
  });
});
