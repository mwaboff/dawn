import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LevelUp } from './level-up';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { AuthService } from '../../core/services/auth.service';
import { CharacterSheetResponse } from '../create-character/models/character-sheet-api.model';
import { LevelUpOptionsResponse } from './models/level-up-api.model';

function makeSheetResponse(overrides: Partial<CharacterSheetResponse> = {}): CharacterSheetResponse {
  return {
    id: 1,
    name: 'Kael',
    level: 4,
    evasion: 10,
    armorMax: 3,
    armorMarked: 0,
    majorDamageThreshold: 5,
    severeDamageThreshold: 10,
    agilityModifier: 2,
    agilityMarked: false,
    strengthModifier: 0,
    strengthMarked: true,
    finesseModifier: 1,
    finesseMarked: false,
    instinctModifier: -1,
    instinctMarked: false,
    presenceModifier: 0,
    presenceMarked: false,
    knowledgeModifier: 0,
    knowledgeMarked: false,
    hitPointMax: 8,
    hitPointMarked: 2,
    stressMax: 6,
    stressMarked: 0,
    hopeMax: 5,
    hopeMarked: 1,
    gold: 25,
    ownerId: 1,
    proficiency: 1,
    equippedDomainCardIds: [10, 11],
    vaultDomainCardIds: [12],
    communityCardIds: [],
    ancestryCardIds: [],
    subclassCardIds: [100],
    domainCardIds: [10, 11, 12],
    inventoryWeaponIds: [],
    inventoryArmorIds: [],
    inventoryItemIds: [],
    experienceIds: [200, 201],
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-01T00:00:00Z',
    experiences: [
      { id: 200, characterSheetId: 1, description: 'Survived the wastes', modifier: 2 },
      { id: 201, characterSheetId: 1, description: 'Learned to fight', modifier: 1 },
    ],
    subclassCards: [
      { id: 100, name: 'Guardian Foundation', associatedClassName: 'Guardian', subclassPathName: 'Stalwart', level: 'Foundation' },
    ],
    domainCards: [
      { id: 10, name: 'Shield Bash', associatedDomainId: 1, level: 2 },
      { id: 11, name: 'Iron Will', associatedDomainId: 1, level: 3 },
      { id: 12, name: 'Taunt', associatedDomainId: 3, level: 1 },
    ],
    ...overrides,
  };
}

function makeOptionsResponse(overrides: Partial<LevelUpOptionsResponse> = {}): LevelUpOptionsResponse {
  return {
    currentLevel: 4,
    nextLevel: 5,
    currentTier: 2,
    nextTier: 3,
    tierTransition: true,
    availableAdvancements: [
      { type: 'BOOST_TRAITS', description: '+1 to two traits', limitPerTier: 3, usedInTier: 0, remaining: 3, mutuallyExclusiveWith: null },
      { type: 'GAIN_HP', description: '+1 HP', limitPerTier: 2, usedInTier: 0, remaining: 2, mutuallyExclusiveWith: null },
    ],
    domainCardLevelCap: 7,
    accessibleDomainIds: [1, 3],
    equippedDomainCardCount: 2,
    maxEquippedDomainCards: 5,
    ...overrides,
  };
}

describe('LevelUp', () => {
  let fixture: ComponentFixture<LevelUp>;
  let component: LevelUp;
  let mockCharacterSheetService: {
    getCharacterSheet: ReturnType<typeof vi.fn>;
    getLevelUpOptions: ReturnType<typeof vi.fn>;
    levelUp: ReturnType<typeof vi.fn>;
    undoLevelUp: ReturnType<typeof vi.fn>;
  };
  let mockAuthService: { user: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  function createComponent(
    id: string,
    sheetResponse = of(makeSheetResponse()),
    optionsResponse = of(makeOptionsResponse()),
  ) {
    mockCharacterSheetService = {
      getCharacterSheet: vi.fn().mockReturnValue(sheetResponse),
      getLevelUpOptions: vi.fn().mockReturnValue(optionsResponse),
      levelUp: vi.fn().mockReturnValue(of({ characterSheet: makeSheetResponse({ level: 5 }), advancementLogId: 1, appliedChanges: [] })),
      undoLevelUp: vi.fn().mockReturnValue(of(makeSheetResponse({ level: 3 }))),
    };
    mockAuthService = {
      user: vi.fn().mockReturnValue({ id: 1, username: 'test', email: 'test@test.com', role: 'USER', createdAt: '', lastModifiedAt: '' }),
    };
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LevelUp],
      providers: [
        { provide: CharacterSheetService, useValue: mockCharacterSheetService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => id } } } },
      ],
    });
    fixture = TestBed.createComponent(LevelUp);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates the component', () => {
    createComponent('1');
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('shows loading state initially', () => {
    createComponent('1');

    expect(component.loading()).toBe(true);
  });

  it('sets error for invalid ID', () => {
    createComponent('abc');
    fixture.detectChanges();

    expect(component.error()).toBe('Invalid character ID.');
    expect(component.loading()).toBe(false);
  });

  it('loads character sheet and level-up options on init', () => {
    createComponent('1');
    fixture.detectChanges();

    expect(mockCharacterSheetService.getCharacterSheet).toHaveBeenCalledWith(1, expect.any(Array));
    expect(mockCharacterSheetService.getLevelUpOptions).toHaveBeenCalledWith(1);
    expect(component.loading()).toBe(false);
    expect(component.characterSheet()).not.toBeNull();
    expect(component.levelUpOptions()).not.toBeNull();
  });

  it('sets error when not the owner', () => {
    mockAuthService = {
      user: vi.fn().mockReturnValue({ id: 999, username: 'other', email: 'other@test.com', role: 'USER', createdAt: '', lastModifiedAt: '' }),
    };

    TestBed.configureTestingModule({
      imports: [LevelUp],
      providers: [
        { provide: CharacterSheetService, useValue: {
          getCharacterSheet: vi.fn().mockReturnValue(of(makeSheetResponse())),
          getLevelUpOptions: vi.fn().mockReturnValue(of(makeOptionsResponse())),
          levelUp: vi.fn(),
          undoLevelUp: vi.fn(),
        }},
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
      ],
    });
    fixture = TestBed.createComponent(LevelUp);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error()).toBe('You do not own this character.');
  });

  it('computes visible tabs for tier transition', () => {
    createComponent('1');
    fixture.detectChanges();

    const tabIds = component.visibleTabs().map(t => t.id);
    expect(tabIds).toContain('tier-achievements');
    expect(tabIds).toHaveLength(5);
  });

  it('computes visible tabs for non-tier transition', () => {
    createComponent('1', of(makeSheetResponse()), of(makeOptionsResponse({ tierTransition: false, currentTier: 2, nextTier: 2 })));
    fixture.detectChanges();

    const tabIds = component.visibleTabs().map(t => t.id);
    expect(tabIds).not.toContain('tier-achievements');
    expect(tabIds).toHaveLength(4);
  });

  it('sets active tab to first visible tab', () => {
    createComponent('1');
    fixture.detectChanges();

    expect(component.activeTab()).toBe('tier-achievements');
  });

  it('sets error on service failure', () => {
    createComponent('1', throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.error()).toBe('Failed to load level-up data.');
  });

  describe('wizard navigation', () => {
    it('onTabSelected updates active tab', () => {
      createComponent('1');
      fixture.detectChanges();

      component.onTabSelected('advancements');

      expect(component.activeTab()).toBe('advancements');
    });

    it('domain-trades tab auto-completes on selection', () => {
      createComponent('1');
      fixture.detectChanges();

      component.onTabSelected('domain-trades');

      expect(component.completedSteps().has('domain-trades')).toBe(true);
    });
  });

  describe('step completion', () => {
    it('experience description marks tier-achievements complete', () => {
      createComponent('1');
      fixture.detectChanges();

      component.onExperienceDescriptionChanged('Defeated the dragon');

      expect(component.completedSteps().has('tier-achievements')).toBe(true);
    });

    it('empty experience description removes tier-achievements completion', () => {
      createComponent('1');
      fixture.detectChanges();

      component.onExperienceDescriptionChanged('text');
      component.onExperienceDescriptionChanged('');

      expect(component.completedSteps().has('tier-achievements')).toBe(false);
    });

    it('2 advancements marks step complete', () => {
      createComponent('1');
      fixture.detectChanges();

      component.onAdvancementsChanged([{ type: 'GAIN_HP' }, { type: 'GAIN_STRESS' }]);

      expect(component.completedSteps().has('advancements')).toBe(true);
    });

    it('domain card selection marks step complete', () => {
      createComponent('1');
      fixture.detectChanges();

      component.onDomainCardsSelected([{ id: 50, name: 'Test', description: '', cardType: 'domain' }]);

      expect(component.completedSteps().has('domain-card')).toBe(true);
    });
  });

  describe('filteredAdvancements', () => {
    it('includes UPGRADE_SUBCLASS when nextLevel is 5 or above', () => {
      createComponent('1', of(makeSheetResponse()), of(makeOptionsResponse({
        nextLevel: 5,
        availableAdvancements: [
          { type: 'BOOST_TRAITS', description: '+1 to two traits', limitPerTier: 3, usedInTier: 0, remaining: 3, mutuallyExclusiveWith: null },
          { type: 'UPGRADE_SUBCLASS', description: 'Upgrade subclass', limitPerTier: 1, usedInTier: 0, remaining: 1, mutuallyExclusiveWith: 'MULTICLASS' },
        ],
      })));
      fixture.detectChanges();

      const types = component.filteredAdvancements().map(a => a.type);
      expect(types).toContain('UPGRADE_SUBCLASS');
    });

    it('excludes UPGRADE_SUBCLASS when nextLevel is below 5', () => {
      createComponent('1', of(makeSheetResponse()), of(makeOptionsResponse({
        nextLevel: 3,
        currentTier: 1,
        nextTier: 2,
        tierTransition: true,
        availableAdvancements: [
          { type: 'BOOST_TRAITS', description: '+1 to two traits', limitPerTier: 3, usedInTier: 0, remaining: 3, mutuallyExclusiveWith: null },
          { type: 'UPGRADE_SUBCLASS', description: 'Upgrade subclass', limitPerTier: 1, usedInTier: 0, remaining: 1, mutuallyExclusiveWith: 'MULTICLASS' },
        ],
      })));
      fixture.detectChanges();

      const types = component.filteredAdvancements().map(a => a.type);
      expect(types).not.toContain('UPGRADE_SUBCLASS');
      expect(types).toContain('BOOST_TRAITS');
    });

    it('excludes MULTICLASS when nextLevel is below 5', () => {
      createComponent('1', of(makeSheetResponse()), of(makeOptionsResponse({
        nextLevel: 4,
        currentTier: 2,
        nextTier: 2,
        tierTransition: false,
        availableAdvancements: [
          { type: 'GAIN_HP', description: '+1 HP', limitPerTier: 2, usedInTier: 0, remaining: 2, mutuallyExclusiveWith: null },
          { type: 'MULTICLASS', description: 'Multiclass', limitPerTier: 1, usedInTier: 0, remaining: 1, mutuallyExclusiveWith: 'UPGRADE_SUBCLASS' },
        ],
      })));
      fixture.detectChanges();

      const types = component.filteredAdvancements().map(a => a.type);
      expect(types).not.toContain('MULTICLASS');
      expect(types).toContain('GAIN_HP');
    });
  });

  describe('submission', () => {
    it('calls levelUp service on submit', () => {
      createComponent('1');
      fixture.detectChanges();

      component.onAdvancementsChanged([{ type: 'GAIN_HP' }, { type: 'GAIN_STRESS' }]);
      component.onDomainCardsSelected([{ id: 50, name: 'Test', description: '', cardType: 'domain' }]);
      component.onSubmit();

      expect(mockCharacterSheetService.levelUp).toHaveBeenCalledWith(1, expect.objectContaining({
        advancements: [{ type: 'GAIN_HP' }, { type: 'GAIN_STRESS' }],
        newDomainCardId: 50,
      }));
    });

    it('navigates on successful submit', () => {
      createComponent('1');
      fixture.detectChanges();

      component.onDomainCardsSelected([{ id: 50, name: 'Test', description: '', cardType: 'domain' }]);
      component.onAdvancementsChanged([{ type: 'GAIN_HP' }, { type: 'GAIN_STRESS' }]);
      component.onSubmit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/character', 1]);
    });
  });

  describe('level down', () => {
    it('shows dialog on click', () => {
      createComponent('1');
      fixture.detectChanges();

      component.onLevelDownClick();

      expect(component.showLevelDownDialog()).toBe(true);
    });

    it('calls undoLevelUp on confirm', () => {
      createComponent('1');
      fixture.detectChanges();

      component.onLevelDownConfirm();

      expect(mockCharacterSheetService.undoLevelUp).toHaveBeenCalledWith(1);
    });

    it('navigates after successful undo', () => {
      createComponent('1');
      fixture.detectChanges();

      component.onLevelDownConfirm();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/character', 1]);
    });

    it('hides dialog on cancel', () => {
      createComponent('1');
      fixture.detectChanges();

      component.onLevelDownClick();
      component.onLevelDownCancel();

      expect(component.showLevelDownDialog()).toBe(false);
    });
  });
});
