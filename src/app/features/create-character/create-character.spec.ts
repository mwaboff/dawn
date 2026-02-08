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
    it('should change active tab when onTabSelected is called', () => {
      component.onTabSelected('heritage');
      expect(component.activeTab()).toBe('heritage');
    });

    it('should handle selecting all tab types', () => {
      const tabIds = CHARACTER_TABS.map((t) => t.id);

      tabIds.forEach((tabId) => {
        component.onTabSelected(tabId);
        expect(component.activeTab()).toBe(tabId);
      });
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

    it('should have role="region" on tab content', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const tabContent = compiled.querySelector('.tab-content');
      expect(tabContent?.getAttribute('role')).toBe('region');
    });

    it('should have descriptive aria-label on tab content region', () => {
      component.onTabSelected('heritage');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const tabContent = compiled.querySelector('.tab-content');
      expect(tabContent?.getAttribute('aria-label')).toBe('heritage section');
    });

    it('should render placeholder text for each tab', () => {
      const tabIds = ['class', 'heritage', 'traits'] as const;

      tabIds.forEach((tabId) => {
        component.onTabSelected(tabId);
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;
        const placeholder = compiled.querySelector('.placeholder-text');
        expect(placeholder).toBeTruthy();
        expect(placeholder?.textContent).toContain('coming soon');
      });
    });
  });
});
