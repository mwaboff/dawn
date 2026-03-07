import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { CreateCharacter } from './create-character';
import { CHARACTER_TABS } from './models/create-character.model';
import { ClassResponse, PaginatedResponse } from './models/class-api.model';
import { SubclassCardResponse } from './models/subclass-api.model';
import { AncestryCardResponse } from './models/ancestry-api.model';
import { CommunityCardResponse } from './models/community-api.model';

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

    it('should use CHARACTER_TABS constant', () => {
      fixture.detectChanges();
      flushClassCards();
      expect(component.tabs).toBe(CHARACTER_TABS);
      expect(component.tabs).toHaveLength(9);
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
});
