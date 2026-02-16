import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { CreateCharacter } from './create-character';
import { CHARACTER_TABS } from './models/create-character.model';
import { ClassResponse, PaginatedResponse } from './models/class-api.model';
import { SubclassCardResponse } from './models/subclass-api.model';

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
    page: 0,
    size: 100,
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
      page: 0,
      size: 20,
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

  function navigateToSubclassTab(): void {
    const card = component.classCards()[0];
    component.onCardClicked(card);
    component.onTabSelected('subclass');
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
      expect(component.isCardSelected(card)).toBe(true);

      component.onCardClicked(card);
      expect(component.isCardSelected(card)).toBe(false);
    });

    it('should only allow one card to be selected at a time', () => {
      fixture.detectChanges();
      flushClassCards();

      const card1 = component.classCards()[0];
      const card2 = component.classCards()[1];

      component.onCardClicked(card1);
      expect(component.isCardSelected(card1)).toBe(true);

      component.onCardClicked(card2);
      expect(component.isCardSelected(card1)).toBe(false);
      expect(component.isCardSelected(card2)).toBe(true);
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

    it('should render placeholder text for tabs without content', () => {
      fixture.detectChanges();
      flushClassCards();

      const card = component.classCards()[0];
      component.onCardClicked(card);
      component.onTabSelected('subclass');
      fixture.detectChanges();
      flushSubclassCards();

      const foundationCard = component.subclassPaths()[0].foundation;
      component.onCardClicked(foundationCard);
      component.onTabSelected('ancestry');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const placeholder = compiled.querySelector('.placeholder-text');
      expect(placeholder).toBeTruthy();
      expect(placeholder?.textContent).toContain('coming soon');
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
      req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 1 });
      fixture.detectChanges();
    });

    it('should render level tabs for each path', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCards();

      const compiled = fixture.nativeElement as HTMLElement;
      const tabLists = compiled.querySelectorAll('.tabbed-path__tabs');
      expect(tabLists.length).toBe(2);
    });

    it('should group cards by subclassPathId', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCards();

      expect(component.subclassPaths().length).toBe(2);
      expect(component.subclassPaths()[0].pathName).toBe('Troubadour');
      expect(component.subclassPaths()[1].pathName).toBe('Wordsmith');
    });

    it('should clear subclass selection when different class selected', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCards();

      const foundationCard = component.subclassPaths()[0].foundation;
      component.onCardClicked(foundationCard);
      expect(component.characterSelections().subclass).toBe('Troubadour');

      component.onTabSelected('class');
      fixture.detectChanges();

      const differentClass = component.classCards()[1];
      component.onCardClicked(differentClass);

      expect(component.characterSelections().subclass).toBeUndefined();
    });

    it('should render tabbed paths for each subclass', () => {
      fixture.detectChanges();
      flushClassCards();
      navigateToSubclassTab();
      flushSubclassCards();

      const compiled = fixture.nativeElement as HTMLElement;
      const paths = compiled.querySelectorAll('.tabbed-path');
      expect(paths.length).toBe(2);
    });
  });
});
