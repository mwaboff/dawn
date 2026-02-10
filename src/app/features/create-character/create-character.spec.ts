import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCharacter } from './create-character';
import { CHARACTER_TABS } from './models/create-character.model';

describe('CreateCharacter', () => {
  let component: CreateCharacter;
  let fixture: ComponentFixture<CreateCharacter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCharacter],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateCharacter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should initialize with "class" as active tab', () => {
      expect(component.activeTab()).toBe('class');
    });

    it('should use CHARACTER_TABS constant', () => {
      expect(component.tabs).toBe(CHARACTER_TABS);
      expect(component.tabs).toHaveLength(9);
    });
  });

  describe('Tab Navigation', () => {
    it('should change active tab when onTabSelected is called with a reachable tab', () => {
      const card = component.allMockCards[0];

      // Complete class step to make heritage reachable
      component.onCardClicked(card);
      component.onTabSelected('heritage');

      expect(component.activeTab()).toBe('heritage');
    });

    it('should allow backward navigation to previous tabs', () => {
      const card = component.allMockCards[0];

      // Complete class and navigate to heritage
      component.onCardClicked(card);
      component.onTabSelected('heritage');
      expect(component.activeTab()).toBe('heritage');

      // Should be able to go back to class
      component.onTabSelected('class');
      expect(component.activeTab()).toBe('class');
    });
  });

  describe('Card Selection', () => {
    it('should toggle card selection when onCardClicked is called', () => {
      const card = component.allMockCards[0];

      component.onCardClicked(card);
      expect(component.isCardSelected(card)).toBe(true);

      component.onCardClicked(card);
      expect(component.isCardSelected(card)).toBe(false);
    });

    it('should only allow one card to be selected at a time', () => {
      const card1 = component.allMockCards[0];
      const card2 = component.allMockCards[1];

      component.onCardClicked(card1);
      expect(component.isCardSelected(card1)).toBe(true);

      component.onCardClicked(card2);
      expect(component.isCardSelected(card1)).toBe(false);
      expect(component.isCardSelected(card2)).toBe(true);
    });
  });

  describe('Step Completion', () => {
    it('should initialize with empty completedSteps set', () => {
      expect(component.completedSteps().size).toBe(0);
    });

    it('should mark current step as complete when selecting a card', () => {
      const card = component.allMockCards[0];

      component.onCardClicked(card);

      expect(component.completedSteps().has('class')).toBe(true);
    });

    it('should invalidate current step when deselecting a card', () => {
      const card = component.allMockCards[0];

      component.onCardClicked(card);
      expect(component.completedSteps().has('class')).toBe(true);

      component.onCardClicked(card);
      expect(component.completedSteps().has('class')).toBe(false);
    });

    it('should invalidate all future steps when deselecting a card', () => {
      const card = component.allMockCards[0];

      // Select card on step 1
      component.onCardClicked(card);
      expect(component.completedSteps().has('class')).toBe(true);

      // Manually add future steps to completedSteps to simulate progression
      const updated = new Set(component.completedSteps());
      updated.add('heritage');
      updated.add('traits');
      component['completedStepsSignal'].set(updated);

      expect(component.completedSteps().has('heritage')).toBe(true);
      expect(component.completedSteps().has('traits')).toBe(true);

      // Deselect on step 1
      component.onCardClicked(card);

      // Step 1 and all future steps should be invalidated
      expect(component.completedSteps().has('class')).toBe(false);
      expect(component.completedSteps().has('heritage')).toBe(false);
      expect(component.completedSteps().has('traits')).toBe(false);
    });
  });

  describe('Navigation Gating', () => {
    it('should block forward navigation when current step is incomplete', () => {
      expect(component.activeTab()).toBe('class');

      component.onTabSelected('heritage');

      // Should stay on class tab because it's not complete
      expect(component.activeTab()).toBe('class');
    });

    it('should allow forward navigation when current step is complete', () => {
      const card = component.allMockCards[0];

      // Complete the class step
      component.onCardClicked(card);
      expect(component.completedSteps().has('class')).toBe(true);

      // Now should be able to navigate to heritage
      component.onTabSelected('heritage');
      expect(component.activeTab()).toBe('heritage');
    });

    it('should always allow backward navigation', () => {
      const card = component.allMockCards[0];

      // Complete class step and move to heritage
      component.onCardClicked(card);
      component.onTabSelected('heritage');
      expect(component.activeTab()).toBe('heritage');

      // Should be able to go back to class without completing heritage
      component.onTabSelected('class');
      expect(component.activeTab()).toBe('class');
    });

    it('should allow forward navigation only to the next contiguous step', () => {
      const card = component.allMockCards[0];

      // Complete class step
      component.onCardClicked(card);

      // Should be able to navigate to heritage (next step)
      component.onTabSelected('heritage');
      expect(component.activeTab()).toBe('heritage');

      // But should NOT be able to skip to traits without completing heritage
      component.onTabSelected('traits');
      expect(component.activeTab()).toBe('heritage');
    });

    it('should allow navigation to current tab', () => {
      expect(component.activeTab()).toBe('class');

      component.onTabSelected('class');
      expect(component.activeTab()).toBe('class');
    });
  });

  describe('Template Integration', () => {
    it('should render the TabNav component', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const tabNav = compiled.querySelector('app-tab-nav');
      expect(tabNav).toBeTruthy();
    });

    it('should render the CharacterForm component', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const characterForm = compiled.querySelector('app-character-form');
      expect(characterForm).toBeTruthy();
    });

    it('should have role="tabpanel" on tab content', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const tabContent = compiled.querySelector('.tab-content');
      expect(tabContent?.getAttribute('role')).toBe('tabpanel');
    });

    it('should link tab panel to its tab via aria-labelledby', () => {
      const card = component.allMockCards[0];
      component.onCardClicked(card);
      component.onTabSelected('heritage');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const tabContent = compiled.querySelector('.tab-content');
      expect(tabContent?.getAttribute('aria-labelledby')).toBe('tab-heritage');
      expect(tabContent?.id).toBe('panel-heritage');
    });

    it('should render placeholder text for tabs without content', () => {
      const card = component.allMockCards[0];
      component.onCardClicked(card);
      const tabIds = ['heritage', 'traits'] as const;

      component.onTabSelected(tabIds[0]);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const placeholder = compiled.querySelector('.placeholder-text');
      expect(placeholder).toBeTruthy();
      expect(placeholder?.textContent).toContain('coming soon');
    });

    it('should render card components on the class tab', () => {
      component.onTabSelected('class');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll('app-daggerheart-card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});
