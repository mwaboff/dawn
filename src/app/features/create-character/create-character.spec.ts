import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { CreateCharacter } from './create-character';
import { CHARACTER_TABS } from './models/create-character.model';
import { ClassResponse } from '../../shared/models/class-api.model';
import { PaginatedResponse } from '../../shared/models/api.model';
import { SubclassCardResponse } from '../../shared/models/subclass-api.model';
import { AncestryCardResponse } from '../../shared/models/ancestry-api.model';
import { CommunityCardResponse } from '../../shared/models/community-api.model';
import { CardData } from '../../shared/components/daggerheart-card/daggerheart-card.model';
import { CharacterSheetResponse } from './models/character-sheet-api.model';
import { Experience } from '../../shared/models/experience.model';

function buildClassResponse(overrides: Partial<ClassResponse> = {}): ClassResponse {
  return {
    id: 1,
    name: 'Warrior',
    description: 'A mighty fighter',
    startingEvasion: 8,
    startingHitPoints: 6,
    hopeFeatures: [],
    classFeatures: [],
    isOfficial: true,
    isPublic: true,
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildPaginatedResponse(classes: ClassResponse[]): PaginatedResponse<ClassResponse> {
  return {
    content: classes,
    currentPage: 0,
    pageSize: 100,
    totalElements: classes.length,
    totalPages: 1,
  };
}

const MOCK_CLASSES = [
  buildClassResponse({ id: 1, name: 'Warrior', description: 'Strong fighter' }),
  buildClassResponse({ id: 2, name: 'Ranger', description: 'Skilled archer' }),
  buildClassResponse({ id: 3, name: 'Wizard', description: 'Arcane caster' }),
];

function buildSubclassCardResponse(overrides: Partial<SubclassCardResponse> = {}): SubclassCardResponse {
  return {
    id: 100,
    name: 'Troubadour',
    description: 'Musical warrior',
    cardType: 'SUBCLASS',
    expansionId: 1,
    isOfficial: true,
    featureIds: [],
    features: [],
    costTagIds: [],
    costTags: [],
    subclassPathId: 10,
    level: 'FOUNDATION',
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

const MOCK_SUBCLASSES = [
  buildSubclassCardResponse({ id: 100, name: 'Troubadour', subclassPathId: 10, level: 'FOUNDATION' }),
  buildSubclassCardResponse({ id: 101, name: 'Troubadour Spec', subclassPathId: 10, level: 'SPECIALIZATION' }),
  buildSubclassCardResponse({ id: 102, name: 'Troubadour Master', subclassPathId: 10, level: 'MASTERY' }),
  buildSubclassCardResponse({ id: 200, name: 'Wordsmith', subclassPathId: 20, level: 'FOUNDATION' }),
  buildSubclassCardResponse({ id: 201, name: 'Wordsmith Spec', subclassPathId: 20, level: 'SPECIALIZATION' }),
  buildSubclassCardResponse({ id: 202, name: 'Wordsmith Master', subclassPathId: 20, level: 'MASTERY' }),
];

function buildAncestryCardResponse(overrides: Partial<AncestryCardResponse> = {}): AncestryCardResponse {
  return {
    id: 300,
    name: 'Clank',
    description: 'Clanks are sentient mechanical beings',
    cardType: 'ANCESTRY',
    expansionId: 1,
    isOfficial: true,
    featureIds: [],
    features: [],
    costTagIds: [],
    costTags: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

const MOCK_ANCESTRIES = [
  buildAncestryCardResponse({ id: 300, name: 'Clank' }),
  buildAncestryCardResponse({ id: 301, name: 'Firbolg' }),
  buildAncestryCardResponse({ id: 302, name: 'Katari' }),
];

function buildCommunityCardResponse(overrides: Partial<CommunityCardResponse> = {}): CommunityCardResponse {
  return {
    id: 400,
    name: 'Highborne',
    description: 'A life of elegance and prestige',
    cardType: 'COMMUNITY',
    expansionId: 1,
    isOfficial: true,
    featureIds: [],
    features: [],
    costTagIds: [],
    costTags: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

const MOCK_COMMUNITIES = [
  buildCommunityCardResponse({ id: 400, name: 'Highborne' }),
  buildCommunityCardResponse({ id: 401, name: 'Orderborne' }),
  buildCommunityCardResponse({ id: 402, name: 'Wanderborne' }),
];

describe('CreateCharacter', () => {
  let component: CreateCharacter;
  let fixture: ComponentFixture<CreateCharacter>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCharacter],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CreateCharacter);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  function flushClassCards(classes: ClassResponse[] = MOCK_CLASSES): void {
    const req = httpTesting.expectOne(r => r.url.includes('/dh/classes'));
    req.flush(buildPaginatedResponse(classes));
    fixture.detectChanges();
  }

  function flushClassCardsError(): void {
    const req = httpTesting.expectOne(r => r.url.includes('/dh/classes'));
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();
  }

  function flushSubclassCards(subclasses: SubclassCardResponse[] = MOCK_SUBCLASSES): void {
    const req = httpTesting.expectOne(r => r.url.includes('/dh/cards/subclass'));
    req.flush({
      content: subclasses,
      currentPage: 0,
      pageSize: 20,
      totalElements: subclasses.length,
      totalPages: 1,
    });
    fixture.detectChanges();
  }

  function flushSubclassCardsError(): void {
    const req = httpTesting.expectOne(r => r.url.includes('/dh/cards/subclass'));
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();
  }

  function flushAncestryCards(ancestries: AncestryCardResponse[] = MOCK_ANCESTRIES): void {
    const req = httpTesting.expectOne(r => r.url.includes('/dh/cards/ancestry'));
    req.flush({
      content: ancestries,
      currentPage: 0,
      pageSize: 20,
      totalElements: ancestries.length,
      totalPages: 1,
    });
    fixture.detectChanges();
  }

  function flushAncestryCardsError(): void {
    const req = httpTesting.expectOne(r => r.url.includes('/dh/cards/ancestry'));
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();
  }

  function navigateToSubclassTab(): void {
    const card = component.classCards()[0];
    component.onCardClicked(card);
    component.onTabSelected('subclass');
    fixture.detectChanges();
  }

  function navigateToAncestryTab(): void {
    const card = component.classCards()[0];
    component.onCardClicked(card);
    component.onTabSelected('subclass');
    fixture.detectChanges();
    flushSubclassCards();

    const foundationCard = component.subclassCards().find(c => c.metadata?.['level'] === 'FOUNDATION')!;
    component.onCardClicked(foundationCard);
    component.onTabSelected('ancestry');
    fixture.detectChanges();
  }

  function flushCommunityCards(communities: CommunityCardResponse[] = MOCK_COMMUNITIES): void {
    const req = httpTesting.expectOne(r => r.url.includes('/dh/cards/community'));
    req.flush({
      content: communities,
      currentPage: 0,
      pageSize: 20,
      totalElements: communities.length,
      totalPages: 1,
    });
    fixture.detectChanges();
  }

  function flushCommunityCardsError(): void {
    const req = httpTesting.expectOne(r => r.url.includes('/dh/cards/community'));
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();
  }

  function navigateToCommunityTab(): void {
    const classCard = component.classCards()[0];
    component.onCardClicked(classCard);
    component.onTabSelected('subclass');
    fixture.detectChanges();
    flushSubclassCards();

    const foundationCard = component.subclassCards().find(c => c.metadata?.['level'] === 'FOUNDATION')!;
    component.onCardClicked(foundationCard);
    component.onTabSelected('ancestry');
    fixture.detectChanges();
    flushAncestryCards();

    const ancestryCard = component.ancestryCards()[0];
    component.onCardClicked(ancestryCard);
    component.onTabSelected('community');
    fixture.detectChanges();
  }

  it('should create', () => {
    fixture.detectChanges();
    flushClassCards();
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should initialize with "class" as active tab', () => {
      fixture.detectChanges();
      flushClassCards();
      expect(component.activeTab()).toBe('class');
    });

    it('hides the bonuses, martial-stances, and companion tabs when no subclass is selected', () => {
      fixture.detectChanges();
      flushClassCards();
      const tabIds = component.tabs().map(t => t.id);
      expect(tabIds).not.toContain('bonuses');
      expect(tabIds).not.toContain('companion');
      expect(tabIds).toEqual(
        CHARACTER_TABS.filter(t => t.id !== 'bonuses' && t.id !== 'martial-stances' && t.id !== 'companion').map(t => t.id),
      );
    });
  });

  describe('Class Cards Loading', () => {
    it('should show skeleton while loading', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-card-skeleton')).toBeTruthy();
      expect(compiled.querySelector('app-daggerheart-card')).toBeFalsy();

      flushClassCards();
    });

    it('should show cards on successful fetch', () => {
      fixture.detectChanges();
      flushClassCards();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-card-skeleton')).toBeFalsy();
      expect(compiled.querySelectorAll('app-daggerheart-card').length).toBe(3);
    });

    it('should show error on failed fetch', () => {
      fixture.detectChanges();
      flushClassCardsError();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-card-error')).toBeTruthy();
      expect(compiled.querySelector('app-card-skeleton')).toBeFalsy();
      expect(compiled.querySelector('app-daggerheart-card')).toBeFalsy();
    });

    it('should set classCards signal on success', () => {
      fixture.detectChanges();
      flushClassCards();

      expect(component.classCards().length).toBe(3);
      expect(component.classCardsLoading()).toBe(false);
      expect(component.classCardsError()).toBe(false);
    });

    it('should set error signal on failure', () => {
      fixture.detectChanges();
      flushClassCardsError();

      expect(component.classCardsError()).toBe(true);
      expect(component.classCardsLoading()).toBe(false);
    });
  });

  describe('Tab Navigation', () => {
    it('should change active tab when onTabSelected is called with a reachable tab', () => {
      fixture.detectChanges();
      flushClassCards();

      const card = component.classCards()[0];
      component.onCardClicked(card);
      component.onTabSelected('subclass');
      flushSubclassCards();

      expect(component.activeTab()).toBe('subclass');
    });

    it('should allow backward navigation to previous tabs', () => {
      fixture.detectChanges();
      flushClassCards();

      const card = component.classCards()[0];
      component.onCardClicked(card);
      component.onTabSelected('subclass');
      flushSubclassCards();
      expect(component.activeTab()).toBe('subclass');

      component.onTabSelected('class');
      expect(component.activeTab()).toBe('class');
    });
  });

  describe('Card Selection', () => {
    it('should toggle card selection when onCardClicked is called', () => {
      fixture.detectChanges();
      flushClassCards();

      const card = component.classCards()[0];

      component.onCardClicked(card);
      expect(component.selectedClassCard()?.id).toBe(card.id);

      component.onCardClicked(card);
      expect(component.selectedClassCard()).toBeUndefined();
    });

    it('should only allow one card to be selected at a time', () => {
      fixture.detectChanges();
      flushClassCards();

      const card1 = component.classCards()[0];
      const card2 = component.classCards()[1];

      component.onCardClicked(card1);
      expect(component.selectedClassCard()?.id).toBe(card1.id);

      component.onCardClicked(card2);
      expect(component.selectedClassCard()?.id).toBe(card2.id);
    });

    it('should store selected class card ID for subclass calls', () => {
      fixture.detectChanges();
      flushClassCards();

      const card = component.classCards()[0];
      component.onCardClicked(card);

      expect(component.characterSelections().class).toBe(card.name);
    });
  });

  describe('Step Completion', () => {
    it('should initialize with empty completedSteps set', () => {
      fixture.detectChanges();
      flushClassCards();
      expect(component.completedSteps().size).toBe(0);
    });

    it('should mark current step as complete when selecting a card', () => {
      fixture.detectChanges();
      flushClassCards();

      const card = component.classCards()[0];
      component.onCardClicked(card);

      expect(component.completedSteps().has('class')).toBe(true);
    });

    it('should invalidate current step when deselecting a card', () => {
      fixture.detectChanges();
      flushClassCards();

      const card = component.classCards()[0];

      component.onCardClicked(card);
      expect(component.completedSteps().has('class')).toBe(true);

      component.onCardClicked(card);
      expect(component.completedSteps().has('class')).toBe(false);
    });

    it('should invalidate all future steps when deselecting a card', () => {
      fixture.detectChanges();
      flushClassCards();

      const card = component.classCards()[0];

      component.onCardClicked(card);
      expect(component.completedSteps().has('class')).toBe(true);

      const updated = new Set(component.completedSteps());
      updated.add('subclass');
      updated.add('ancestry');
      component['completedStepsSignal'].set(updated);

      expect(component.completedSteps().has('subclass')).toBe(true);
      expect(component.completedSteps().has('ancestry')).toBe(true);

      component.onCardClicked(card);

      expect(component.completedSteps().has('class')).toBe(false);
      expect(component.completedSteps().has('subclass')).toBe(false);
      expect(component.completedSteps().has('ancestry')).toBe(false);
    });
  });

  describe('Navigation Gating', () => {
    it('should block forward navigation when current step is incomplete', () => {
      fixture.detectChanges();
      flushClassCards();

      expect(component.activeTab()).toBe('class');
      component.onTabSelected('subclass');
      expect(component.activeTab()).toBe('class');
    });

    it('should allow forward navigation when current step is complete', () => {
      fixture.detectChanges();
      flushClassCards();

      const card = component.classCards()[0];
      component.onCardClicked(card);
      expect(component.completedSteps().has('class')).toBe(true);

      component.onTabSelected('subclass');
      flushSubclassCards();
      expect(component.activeTab()).toBe('subclass');
    });

    it('should always allow backward navigation', () => {
      fixture.detectChanges();
      flushClassCards();

      const card = component.classCards()[0];
      component.onCardClicked(card);
      component.onTabSelected('subclass');
      flushSubclassCards();
      expect(component.activeTab()).toBe('subclass');

      component.onTabSelected('class');
      expect(component.activeTab()).toBe('class');
    });

    it('should allow forward navigation only to the next contiguous step', () => {
      fixture.detectChanges();
      flushClassCards();

      const card = component.classCards()[0];
      component.onCardClicked(card);

      component.onTabSelected('subclass');
      flushSubclassCards();
      expect(component.activeTab()).toBe('subclass');

      component.onTabSelected('ancestry');
      expect(component.activeTab()).toBe('subclass');
    });

    it('should allow navigation to current tab', () => {
      fixture.detectChanges();
      flushClassCards();

      expect(component.activeTab()).toBe('class');
      component.onTabSelected('class');
      expect(component.activeTab()).toBe('class');
    });
  });

  describe('Template Integration', () => {
    it('should render the TabNav component', () => {
      fixture.detectChanges();
      flushClassCards();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-tab-nav')).toBeTruthy();
    });

    it('should render the CharacterForm component', () => {
      fixture.detectChanges();
      flushClassCards();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-character-form')).toBeTruthy();
    });

    it('should have role="tabpanel" on tab content', () => {
      fixture.detectChanges();
      flushClassCards();
      const compiled = fixture.nativeElement as HTMLElement;
      const tabContent = compiled.querySelector('.tab-content');
      expect(tabContent?.getAttribute('role')).toBe('tabpanel');
    });

    it('should link tab panel to its tab via aria-labelledby', () => {
      fixture.detectChanges();
      flushClassCards();

      const card = component.classCards()[0];
      component.onCardClicked(card);
      component.onTabSelected('subclass');
      fixture.detectChanges();
      flushSubclassCards();

      const compiled = fixture.nativeElement as HTMLElement;
      const tabContent = compiled.querySelector('.tab-content');
      expect(tabContent?.getAttribute('aria-labelledby')).toBe('tab-subclass');
      expect(tabContent?.id).toBe('panel-subclass');
    });

    it('should render trait selector on the traits tab', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToCommunityTab();
      flushCommunityCards();

      const communityCard = component.communityCards()[0];
      component.onCardClicked(communityCard);
      component.onTabSelected('traits');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-trait-selector')).toBeTruthy();
    });

    it('should render CardSelectionGrid on the class tab', () => {
      fixture.detectChanges();
      flushClassCards();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-card-selection-grid')).toBeTruthy();
    });

    it('should render card components on the class tab after loading', () => {
      fixture.detectChanges();
      flushClassCards();

      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll('app-daggerheart-card');
      expect(cards.length).toBe(3);
    });
  });

  describe('Subclass Cards', () => {
    it('should show skeleton while loading subclass cards', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-card-skeleton')).toBeTruthy();

      flushSubclassCards();
    });

    it('should show cards on successful subclass fetch', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCards();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-card-skeleton')).toBeFalsy();
      expect(compiled.querySelectorAll('app-daggerheart-card').length).toBeGreaterThan(0);
    });

    it('should show error on failed subclass fetch', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCardsError();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-card-error')).toBeTruthy();
    });

    it('should send correct classId in subclass request', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();

      const req = httpTesting.expectOne(r => r.url.includes('/dh/cards/subclass'));
      expect(req.request.params.get('associatedClassId')).toBe('1');
      req.flush({ content: [], currentPage: 0, pageSize: 20, totalElements: 0, totalPages: 1 });
      fixture.detectChanges();
    });

    it('should render SubclassPathSelector component', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCards();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-subclass-path-selector')).toBeTruthy();
    });

    it('should show subclass domains, not the associated class name, in characterSelections', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCards([
        buildSubclassCardResponse({
          id: 100,
          name: 'Troubadour',
          subclassPathId: 10,
          level: 'FOUNDATION',
          associatedClassName: 'Bard',
          domainNames: ['Grace', 'Codex'],
        }),
      ]);

      const foundationCard = component.subclassCards()[0];
      component.onCardClicked(foundationCard);

      expect(component.characterSelections().domains).toBe('Grace · Codex');
    });

    it('should clear subclass selection when different class selected', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCards();

      const foundationCard = component.subclassCards().find(c => c.metadata?.['level'] === 'FOUNDATION')!;
      component.onCardClicked(foundationCard);
      expect(component.characterSelections().subclass).toBe('Troubadour');

      component.onTabSelected('class');
      fixture.detectChanges();

      const differentClass = component.classCards()[1];
      component.onCardClicked(differentClass);

      expect(component.characterSelections().subclass).toBeUndefined();
    });

    it('should pass subclass cards to SubclassPathSelector', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCards();

      expect(component.subclassCards().length).toBe(6);
    });
  });

  describe('Ancestry Cards', () => {
    it('should load ancestry cards when ancestry tab is selected', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToAncestryTab();
      flushAncestryCards();

      expect(component.ancestryCards().length).toBe(3);
      expect(component.ancestryCardsLoading()).toBe(false);
    });

    it('should not truncate the full catalog (24 ancestries: 18 core + 6 Hope & Fear)', () => {
      const fullCatalog = Array.from({ length: 24 }, (_, i) =>
        buildAncestryCardResponse({ id: 300 + i, name: `Ancestry ${i + 1}` }),
      );

      fixture.detectChanges();
      flushClassCards();
      navigateToAncestryTab();

      const req = httpTesting.expectOne(r => r.url.includes('/dh/cards/ancestry'));
      expect(req.request.params.get('size')).toBe('100');
      req.flush({
        content: fullCatalog,
        currentPage: 0,
        pageSize: 100,
        totalElements: fullCatalog.length,
        totalPages: 1,
      });
      fixture.detectChanges();

      expect(component.ancestryCards().length).toBe(24);
    });

    it('should show loading state while ancestry cards are loading', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToAncestryTab();

      expect(component.ancestryCardsLoading()).toBe(true);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-card-skeleton')).toBeTruthy();

      flushAncestryCards();
    });

    it('should show error state when ancestry fetch fails', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToAncestryTab();
      flushAncestryCardsError();

      expect(component.ancestryCardsError()).toBe(true);
      expect(component.ancestryCardsLoading()).toBe(false);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-card-error')).toBeTruthy();
    });

    it('should display ancestry cards on successful fetch', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToAncestryTab();
      flushAncestryCards();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('app-daggerheart-card').length).toBe(3);
    });

    it('should render CardSelectionGrid on ancestry tab', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToAncestryTab();
      flushAncestryCards();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-card-selection-grid')).toBeTruthy();
    });

    it('should update selectedCards when ancestry card is clicked', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToAncestryTab();
      flushAncestryCards();

      const ancestryCard = component.ancestryCards()[0];
      component.onCardClicked(ancestryCard);

      expect(component.selectedAncestryCard()?.id).toBe(ancestryCard.id);
      expect(component.characterSelections().ancestry).toBe('Clank');
    });

    it('should deselect ancestry when clicking selected card again', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToAncestryTab();
      flushAncestryCards();

      const ancestryCard = component.ancestryCards()[0];
      component.onCardClicked(ancestryCard);
      expect(component.selectedAncestryCard()?.id).toBe(ancestryCard.id);

      component.onCardClicked(ancestryCard);
      expect(component.selectedAncestryCard()).toBeUndefined();
      expect(component.characterSelections().ancestry).toBeUndefined();
    });

    it('should not re-fetch if ancestry cards already loaded', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToAncestryTab();
      flushAncestryCards();

      expect(component.ancestryCards().length).toBe(3);

      component.onTabSelected('class');
      fixture.detectChanges();

      component.onTabSelected('ancestry');
      fixture.detectChanges();

      httpTesting.expectNone(r => r.url.includes('/dh/cards/ancestry'));
    });
  });

  describe('Community Cards', () => {
    it('should load community cards when community tab is selected', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToCommunityTab();
      flushCommunityCards();

      expect(component.communityCards().length).toBe(3);
      expect(component.communityCardsLoading()).toBe(false);
    });

    it('should show loading state while community cards are loading', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToCommunityTab();

      expect(component.communityCardsLoading()).toBe(true);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-card-skeleton')).toBeTruthy();

      flushCommunityCards();
    });

    it('should show error state when community fetch fails', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToCommunityTab();
      flushCommunityCardsError();

      expect(component.communityCardsError()).toBe(true);
      expect(component.communityCardsLoading()).toBe(false);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-card-error')).toBeTruthy();
    });

    it('should display community cards on successful fetch', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToCommunityTab();
      flushCommunityCards();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('app-daggerheart-card').length).toBe(3);
    });

    it('should render CardSelectionGrid on community tab', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToCommunityTab();
      flushCommunityCards();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-card-selection-grid')).toBeTruthy();
    });

    it('should update selectedCards when community card is clicked', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToCommunityTab();
      flushCommunityCards();

      const communityCard = component.communityCards()[0];
      component.onCardClicked(communityCard);

      expect(component.selectedCommunityCard()?.id).toBe(communityCard.id);
      expect(component.characterSelections().community).toBe('Highborne');
    });

    it('should show selected community in characterSelections', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToCommunityTab();
      flushCommunityCards();

      const communityCard = component.communityCards()[1];
      component.onCardClicked(communityCard);

      expect(component.characterSelections().community).toBe('Orderborne');
    });

    it('should deselect community when clicking selected card again', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToCommunityTab();
      flushCommunityCards();

      const communityCard = component.communityCards()[0];
      component.onCardClicked(communityCard);
      expect(component.selectedCommunityCard()?.id).toBe(communityCard.id);

      component.onCardClicked(communityCard);
      expect(component.selectedCommunityCard()).toBeUndefined();
      expect(component.characterSelections().community).toBeUndefined();
    });

    it('should not re-fetch if community cards already loaded', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToCommunityTab();
      flushCommunityCards();

      expect(component.communityCards().length).toBe(3);

      component.onTabSelected('ancestry');
      fixture.detectChanges();

      component.onTabSelected('community');
      fixture.detectChanges();

      httpTesting.expectNone(r => r.url.includes('/dh/cards/community'));
    });
  });

  describe('Experiences', () => {
    it('should mark experiences step complete when a valid experience is provided', () => {
      fixture.detectChanges();
      flushClassCards();

      component.onExperiencesChanged([
        { name: 'Blacksmith', modifier: 2 },
        { name: '', modifier: null },
      ]);

      expect(component.completedSteps().has('experiences')).toBe(true);
    });

    it('should not mark experiences step complete when no experience is fully filled', () => {
      fixture.detectChanges();
      flushClassCards();

      component.onExperiencesChanged([
        { name: 'Blacksmith', modifier: null },
        { name: '', modifier: null },
      ]);

      expect(component.completedSteps().has('experiences')).toBe(false);
    });

    it('should unmark experiences step when all experiences become incomplete', () => {
      fixture.detectChanges();
      flushClassCards();

      component.onExperiencesChanged([{ name: 'Blacksmith', modifier: 2 }]);
      expect(component.completedSteps().has('experiences')).toBe(true);

      component.onExperiencesChanged([{ name: '', modifier: null }]);
      expect(component.completedSteps().has('experiences')).toBe(false);
    });

  });

  describe('Bonus Domain Card Selections', () => {
    function subclassWithBonus(id: number, name: string, bonus: number): SubclassCardResponse {
      return buildSubclassCardResponse({
        id,
        name,
        subclassPathId: 30 + id,
        level: 'FOUNDATION',
        features: [
          {
            id: id * 10,
            name: `${name} Feature`,
            description: 'grants bonus',
            featureType: 'PASSIVE',
            expansionId: 1,
            costTagIds: [],
            costTags: [],
            modifiers: [
              { target: 'BONUS_DOMAIN_CARD_SELECTIONS', operation: 'ADD', value: bonus },
            ],
          },
        ],
      });
    }

    function subclassWithoutBonus(id: number, name: string): SubclassCardResponse {
      return buildSubclassCardResponse({
        id,
        name,
        subclassPathId: 30 + id,
        level: 'FOUNDATION',
        features: [
          {
            id: id * 10,
            name: `${name} Feature`,
            description: 'no bonus',
            featureType: 'PASSIVE',
            expansionId: 1,
            costTagIds: [],
            costTags: [],
            modifiers: [],
          },
        ],
      });
    }

    function pickSubclass(subclasses: SubclassCardResponse[], targetId: number): void {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCards(subclasses);
      const card = component.subclassCards().find(c => c.id === targetId)!;
      component.onCardClicked(card);
      fixture.detectChanges();
    }

    it('returns 3 max selections when subclass has BONUS_DOMAIN_CARD_SELECTIONS ADD 1', () => {
      pickSubclass([subclassWithBonus(500, 'BonusPath', 1)], 500);
      expect(component.bonusDomainCardSlots()).toBe(1);
      expect(component.domainCardMaxSelections()).toBe(3);
    });

    it('returns 2 max selections when subclass has no bonus modifier', () => {
      pickSubclass([subclassWithoutBonus(501, 'PlainPath')], 501);
      expect(component.bonusDomainCardSlots()).toBe(0);
      expect(component.domainCardMaxSelections()).toBe(2);
    });

    it('recomputes to 2 after switching from a bonus subclass to a non-bonus subclass', () => {
      const subs = [subclassWithBonus(502, 'BonusPath', 1), subclassWithoutBonus(503, 'PlainPath')];
      pickSubclass(subs, 502);
      expect(component.domainCardMaxSelections()).toBe(3);

      component.selectedDomainCards.set([
        { id: 9001, name: 'A', description: '', cardType: 'domain' },
        { id: 9002, name: 'B', description: '', cardType: 'domain' },
        { id: 9003, name: 'C', description: '', cardType: 'domain' },
      ]);
      component['completedStepsSignal'].set(new Set([...component.completedSteps(), 'domain-cards']));
      expect(component.completedSteps().has('domain-cards')).toBe(true);

      const plain = component.subclassCards().find(c => c.id === 503)!;
      component.onCardClicked(plain);
      fixture.detectChanges();

      expect(component.selectedDomainCards()).toEqual([]);
      expect(component.completedSteps().has('domain-cards')).toBe(false);
      expect(component.domainCardMaxSelections()).toBe(2);
    });

    it('marks domain-cards step complete only when selection count equals domainCardMaxSelections (2)', () => {
      pickSubclass([subclassWithoutBonus(504, 'PlainPath')], 504);

      const one: CardData[] = [{ id: 1, name: 'A', description: '', cardType: 'domain' }];
      const two: CardData[] = [
        { id: 1, name: 'A', description: '', cardType: 'domain' },
        { id: 2, name: 'B', description: '', cardType: 'domain' },
      ];

      component.onDomainCardsSelected(one);
      expect(component.completedSteps().has('domain-cards')).toBe(false);

      component.onDomainCardsSelected(two);
      expect(component.completedSteps().has('domain-cards')).toBe(true);
    });

    it('marks domain-cards step complete only when selection count equals domainCardMaxSelections (3)', () => {
      pickSubclass([subclassWithBonus(505, 'BonusPath', 1)], 505);

      const two: CardData[] = [
        { id: 1, name: 'A', description: '', cardType: 'domain' },
        { id: 2, name: 'B', description: '', cardType: 'domain' },
      ];
      const three: CardData[] = [
        ...two,
        { id: 3, name: 'C', description: '', cardType: 'domain' },
      ];

      component.onDomainCardsSelected(two);
      expect(component.completedSteps().has('domain-cards')).toBe(false);

      component.onDomainCardsSelected(three);
      expect(component.completedSteps().has('domain-cards')).toBe(true);
    });
  });

  describe('Experience Tab Render', () => {
    it('should render experience-selector on the experiences tab', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToCommunityTab();
      flushCommunityCards();

      const communityCard = component.communityCards()[0];
      component.onCardClicked(communityCard);

      component.onTabSelected('traits');
      fixture.detectChanges();

      // Manually complete traits
      const traitAssignments = {
        agility: 2,
        strength: 1,
        finesse: 1,
        instinct: 0,
        presence: 0,
        knowledge: -1,
      };
      component.onTraitsChanged(traitAssignments);

      component.onTabSelected('starting-weapon');
      component.onTabSelected('starting-armor');
      component.onTabSelected('experiences');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-experience-selector')).toBeTruthy();
    });
  });

  describe('Martial Stances', () => {
    function buildStanceFighterSubclass(): SubclassCardResponse {
      return buildSubclassCardResponse({
        id: 500,
        name: 'Brawler',
        subclassPathId: 50,
        level: 'FOUNDATION',
        features: [{
          id: 9,
          name: 'Stance Fighter',
          description: 'Choose two martial stances from Tier 1.',
          featureType: 'PASSIVE',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
        }],
      });
    }

    function selectStanceFighterSubclass(): void {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCards([...MOCK_SUBCLASSES, buildStanceFighterSubclass()]);
      const stanceFighterCard = component.subclassCards().find(c => c.name === 'Brawler')!;
      component.onCardClicked(stanceFighterCard);
    }

    function flushMartialStances(): void {
      const req = httpTesting.expectOne(r => r.url.includes('/dh/martial-stances'));
      req.flush({
        content: [
          { id: 1, name: 'Aggressive Stance', tier: 1, expansionId: 1, isOfficial: true, createdAt: '', lastModifiedAt: '' },
          { id: 2, name: 'Defensive Stance', tier: 1, expansionId: 1, isOfficial: true, createdAt: '', lastModifiedAt: '' },
          { id: 5, name: 'Relentless Stance', tier: 2, expansionId: 1, isOfficial: true, createdAt: '', lastModifiedAt: '' },
        ],
        currentPage: 0,
        pageSize: 100,
        totalElements: 3,
        totalPages: 1,
      });
      fixture.detectChanges();
    }

    it('hides the martial-stances tab for a subclass without Stance Fighter', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCards();

      const foundationCard = component.subclassCards().find(c => c.metadata?.['level'] === 'FOUNDATION')!;
      component.onCardClicked(foundationCard);

      expect(component.tabs().map(t => t.id)).not.toContain('martial-stances');
    });

    it('shows the martial-stances tab for a subclass with Stance Fighter', () => {
      selectStanceFighterSubclass();

      expect(component.tabs().map(t => t.id)).toContain('martial-stances');
    });

    it('loads only tier 1 stances as selectable when the tab is opened', () => {
      selectStanceFighterSubclass();
      component.onTabSelected('martial-stances');
      flushMartialStances();

      expect(component.martialStanceCards().length).toBe(3);
    });

    it('marks the step complete only with exactly 2 stances selected', () => {
      selectStanceFighterSubclass();
      component.onTabSelected('martial-stances');
      flushMartialStances();
      const [tier1a, tier1b, tier1c] = [
        { id: 1, name: 'Aggressive Stance', description: '', cardType: 'martialStance' as const, metadata: { tier: 1 } },
        { id: 2, name: 'Defensive Stance', description: '', cardType: 'martialStance' as const, metadata: { tier: 1 } },
        { id: 3, name: 'Evasive Stance', description: '', cardType: 'martialStance' as const, metadata: { tier: 1 } },
      ];

      component.onMartialStancesSelected([tier1a]);
      expect(component.completedSteps().has('martial-stances')).toBe(false);

      component.onMartialStancesSelected([tier1a, tier1b]);
      expect(component.completedSteps().has('martial-stances')).toBe(true);

      component.onMartialStancesSelected([tier1a, tier1b, tier1c]);
      expect(component.completedSteps().has('martial-stances')).toBe(false);
    });

    it('sends knownMartialStanceIds via a follow-up PUT after character creation', () => {
      selectStanceFighterSubclass();
      component.onTabSelected('martial-stances');
      flushMartialStances();
      component.onMartialStancesSelected([
        { id: 1, name: 'Aggressive Stance', description: '', cardType: 'martialStance', metadata: { tier: 1 } },
        { id: 2, name: 'Defensive Stance', description: '', cardType: 'martialStance', metadata: { tier: 1 } },
      ]);

      component.onTabSelected('ancestry');
      flushAncestryCards();
      const ancestryCard = component.ancestryCards()[0];
      component.onCardClicked(ancestryCard);

      component.onTabSelected('community');
      flushCommunityCards();
      const communityCard = component.communityCards()[0];
      component.onCardClicked(communityCard);

      component.onTraitsChanged({
        agility: 2, strength: 1, finesse: 1, instinct: 0, presence: 0, knowledge: -1,
      });

      component.onSubmitCharacter();

      const createReq = httpTesting.expectOne(
        r => r.url.includes('/dh/character-sheets') && r.method === 'POST',
      );
      createReq.flush({ id: 42, name: '', level: 1 } as unknown as CardData & { id: number });

      const putReq = httpTesting.expectOne(
        r => r.url.includes('/dh/character-sheets/42') && r.method === 'PUT',
      );
      expect(putReq.request.body).toEqual({ knownMartialStanceIds: [1, 2] });
      putReq.flush({ id: 42, name: '', level: 1 } as unknown as CardData & { id: number });
    });
  });

  describe('Companion', () => {
    function buildBeastboundSubclass(): SubclassCardResponse {
      return buildSubclassCardResponse({
        id: 600,
        name: 'Beastbound',
        subclassPathId: 60,
        level: 'FOUNDATION',
        features: [{
          id: 20,
          name: 'Companion',
          description: 'You have an animal companion of your choice.',
          featureType: 'SUBCLASS',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
        }],
      });
    }

    function selectBeastboundSubclass(): void {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCards([...MOCK_SUBCLASSES, buildBeastboundSubclass()]);
      const card = component.subclassCards().find(c => c.name === 'Beastbound')!;
      component.onCardClicked(card);
    }

    const companionDraft = (attackName = 'Bite', experiences: Experience[] = [
      { name: 'Tracker', modifier: 2 },
      { name: 'Loyal Guardian', modifier: 2 },
    ]) => ({
      payload: {
        name: 'Rufus',
        description: undefined,
        evasion: 10,
        attackName,
        attackRange: 'MELEE' as const,
        damageDice: 'D6' as const,
        stressMax: 3,
      },
      experiences,
    });

    /** Visiting the (skippable) companion tab marks it complete regardless of the draft, so
     * later tabs stay reachable -- mirrors visiting starting-weapon/starting-armor. */
    function completeToReview(): void {
      component.onTabSelected('companion');

      component.onTabSelected('ancestry');
      flushAncestryCards();
      const ancestryCard = component.ancestryCards()[0];
      component.onCardClicked(ancestryCard);

      component.onTabSelected('community');
      flushCommunityCards();
      const communityCard = component.communityCards()[0];
      component.onCardClicked(communityCard);

      component.onTraitsChanged({
        agility: 2, strength: 1, finesse: 1, instinct: 0, presence: 0, knowledge: -1,
      });
    }

    it('hides the companion tab for a subclass without the Companion feature', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCards();
      const foundationCard = component.subclassCards().find(c => c.metadata?.['level'] === 'FOUNDATION')!;
      component.onCardClicked(foundationCard);

      expect(component.tabs().map(t => t.id)).not.toContain('companion');
    });

    it('shows the companion tab for a subclass with the Companion feature', () => {
      selectBeastboundSubclass();

      expect(component.tabs().map(t => t.id)).toContain('companion');
    });

    it('marks the companion step complete on visit regardless of whether a draft exists', () => {
      selectBeastboundSubclass();

      component.onTabSelected('companion');

      expect(component.completedSteps().has('companion')).toBe(true);
      expect(component.companionDraft()).toBeNull();
    });

    it('clears the companion draft when a different subclass is selected', () => {
      selectBeastboundSubclass();
      component.onCompanionDraftChanged(companionDraft());
      expect(component.companionDraft()).not.toBeNull();

      component.onTabSelected('subclass');
      const differentSubclass = component.subclassCards().find(c => c.name === 'Troubadour')!;
      component.onCardClicked(differentSubclass);

      expect(component.companionDraft()).toBeNull();
    });

    it('creates the companion and its completed experiences after the sheet is created', () => {
      selectBeastboundSubclass();
      component.onCompanionDraftChanged(companionDraft());
      completeToReview();

      component.onSubmitCharacter();

      const createReq = httpTesting.expectOne(r => r.url.includes('/dh/character-sheets') && r.method === 'POST');
      createReq.flush({ id: 55, name: '', level: 1 } as unknown as CardData & { id: number });

      const companionReq = httpTesting.expectOne(r => r.url.includes('/dh/companions') && r.method === 'POST');
      expect(companionReq.request.body).toEqual({
        characterSheetId: 55,
        name: 'Rufus',
        description: undefined,
        evasion: 10,
        attackName: 'Bite',
        attackRange: 'MELEE',
        damageDice: 'D6',
        stressMax: 3,
      });
      companionReq.flush({ id: 9, characterSheetId: 55 } as unknown as CardData & { id: number });

      // Both starting Experiences are sent, each fixed at +2 (core-01:1319).
      const expReqs = httpTesting.match(r => r.url.includes('/dh/experiences') && r.method === 'POST');
      expect(expReqs.length).toBe(2);
      expect(expReqs.map(r => r.request.body)).toEqual([
        { companionId: 9, description: 'Tracker', modifier: 2 },
        { companionId: 9, description: 'Loyal Guardian', modifier: 2 },
      ]);
      expReqs.forEach(r => r.flush({}));
    });

    it('does not create a companion when only one starting experience is named', () => {
      selectBeastboundSubclass();
      component.onCompanionDraftChanged(
        companionDraft('Bite', [{ name: 'Tracker', modifier: 2 }, { name: '', modifier: 2 }]),
      );
      completeToReview();

      component.onSubmitCharacter();

      const createReq = httpTesting.expectOne(r => r.url.includes('/dh/character-sheets') && r.method === 'POST');
      createReq.flush({ id: 59, name: '', level: 1 } as unknown as CardData & { id: number });

      httpTesting.expectNone(r => r.url.includes('/dh/companions'));
    });

    it('does not create a companion when the draft is missing its required attack name', () => {
      selectBeastboundSubclass();
      component.onCompanionDraftChanged(companionDraft(''));
      completeToReview();

      component.onSubmitCharacter();

      const createReq = httpTesting.expectOne(r => r.url.includes('/dh/character-sheets') && r.method === 'POST');
      createReq.flush({ id: 56, name: '', level: 1 } as unknown as CardData & { id: number });

      httpTesting.expectNone(r => r.url.includes('/dh/companions'));
    });

    it('does not create a companion when the step was skipped (no draft at all)', () => {
      selectBeastboundSubclass();
      completeToReview();

      component.onSubmitCharacter();

      const createReq = httpTesting.expectOne(r => r.url.includes('/dh/character-sheets') && r.method === 'POST');
      createReq.flush({ id: 58, name: '', level: 1 } as unknown as CardData & { id: number });

      httpTesting.expectNone(r => r.url.includes('/dh/companions'));
    });

    it('does not double-create the companion on a resubmit after the sheet was already created', () => {
      // Reproduces the retry-guard scenario: a first submit got as far as creating the sheet
      // (and, inside the same guarded call, the companion) but a *later* step failed, so the
      // player resubmits. `createdSheet` being already set is exactly what `onSubmitCharacter`
      // checks to skip `submitCharacterSheet` -- and therefore `createCompanionFromDraft` -- on
      // the retry, the same class of bug the level-up flow hit with its own re-submit guard.
      selectBeastboundSubclass();
      component.onCompanionDraftChanged(companionDraft());
      completeToReview();

      component['createdSheet'].set({ id: 57, name: '', level: 1 } as unknown as CharacterSheetResponse);

      component.onSubmitCharacter();

      httpTesting.expectNone(r => r.url.includes('/dh/character-sheets') && r.method === 'POST');
      httpTesting.expectNone(r => r.url.includes('/dh/companions') && r.method === 'POST');
      httpTesting.expectNone(r => r.url.includes('/dh/experiences') && r.method === 'POST');
    });
  });
});
