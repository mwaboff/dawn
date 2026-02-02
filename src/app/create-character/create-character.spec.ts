import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateCharacter } from './create-character';
import { ReactiveFormsModule } from '@angular/forms';

describe('CreateCharacter', () => {
  let component: CreateCharacter;
  let fixture: ComponentFixture<CreateCharacter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCharacter, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateCharacter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should initialize with mobile drawer closed', () => {
      expect(component.mobileDrawerOpen()).toBe(false);
    });

    it('should initialize with "class" as active tab', () => {
      expect(component.activeTab()).toBe('class');
    });

    it('should have 9 tabs configured', () => {
      expect(component.tabs).toHaveLength(9);
      expect(component.tabs.map((t) => t.id)).toEqual([
        'class',
        'heritage',
        'traits',
        'additional-info',
        'starting-equipment',
        'background',
        'experiences',
        'domain-cards',
        'connections',
      ]);
    });

    it('should initialize form with empty name and pronouns', () => {
      expect(component.characterForm.value).toEqual({
        name: '',
        pronouns: '',
      });
    });
  });

  describe('Mobile Drawer', () => {
    it('should open drawer when toggleMobileDrawer is called with drawer closed', () => {
      component.mobileDrawerOpen.set(false);
      component.toggleMobileDrawer();
      expect(component.mobileDrawerOpen()).toBe(true);
    });

    it('should close drawer when toggleMobileDrawer is called with drawer open', () => {
      component.mobileDrawerOpen.set(true);
      component.toggleMobileDrawer();
      expect(component.mobileDrawerOpen()).toBe(false);
    });

    it('should close drawer when closeMobileDrawer is called', () => {
      component.mobileDrawerOpen.set(true);
      component.closeMobileDrawer();
      expect(component.mobileDrawerOpen()).toBe(false);
    });
  });

  describe('Tab Navigation', () => {
    it('should change active tab when selectTab is called', () => {
      component.selectTab('heritage');
      expect(component.activeTab()).toBe('heritage');
    });

    it('should close mobile drawer when tab is selected', () => {
      component.mobileDrawerOpen.set(true);
      component.selectTab('traits');
      expect(component.mobileDrawerOpen()).toBe(false);
    });

    it('should handle selecting all tab types', () => {
      const tabIds = [
        'class',
        'heritage',
        'traits',
        'additional-info',
        'starting-equipment',
        'background',
        'experiences',
        'domain-cards',
        'connections',
      ];

      tabIds.forEach((tabId) => {
        component.selectTab(tabId);
        expect(component.activeTab()).toBe(tabId);
      });
    });
  });

  describe('Form Validation', () => {
    it('should mark name as invalid when empty and touched', () => {
      const nameControl = component.characterForm.controls.name;
      nameControl.markAsTouched();
      fixture.detectChanges();
      expect(component.isFieldInvalid('name')).toBe(true);
    });

    it('should mark name as valid when filled', () => {
      const nameControl = component.characterForm.controls.name;
      nameControl.setValue('Aragorn');
      nameControl.markAsTouched();
      fixture.detectChanges();
      expect(component.isFieldInvalid('name')).toBe(false);
    });

    it('should mark pronouns as invalid when empty and touched', () => {
      const pronounsControl = component.characterForm.controls.pronouns;
      pronounsControl.markAsTouched();
      fixture.detectChanges();
      expect(component.isFieldInvalid('pronouns')).toBe(true);
    });

    it('should mark pronouns as valid when filled', () => {
      const pronounsControl = component.characterForm.controls.pronouns;
      pronounsControl.setValue('he/him');
      pronounsControl.markAsTouched();
      fixture.detectChanges();
      expect(component.isFieldInvalid('pronouns')).toBe(false);
    });

    it('should have form invalid when both fields are empty', () => {
      expect(component.characterForm.valid).toBe(false);
    });

    it('should have form valid when both fields are filled', () => {
      component.characterForm.patchValue({
        name: 'Legolas',
        pronouns: 'he/him',
      });
      expect(component.characterForm.valid).toBe(true);
    });

    it('should not show validation errors when fields are untouched', () => {
      expect(component.isFieldInvalid('name')).toBe(false);
      expect(component.isFieldInvalid('pronouns')).toBe(false);
    });
  });

  describe('Template Rendering', () => {
    it('should render all 9 desktop folder tabs', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const desktopTabs = compiled.querySelectorAll('.desktop-tabs .folder-tab');
      expect(desktopTabs.length).toBe(9);
    });

    it('should render all 9 mobile drawer items', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const drawerItems = compiled.querySelectorAll('.mobile-drawer .drawer-item');
      expect(drawerItems.length).toBe(9);
    });

    it('should render name input field', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const nameInput = compiled.querySelector('#character-name');
      expect(nameInput).toBeTruthy();
    });

    it('should render pronouns input field', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const pronounsInput = compiled.querySelector('#character-pronouns');
      expect(pronounsInput).toBeTruthy();
    });

    it('should show error message for name when invalid', () => {
      component.characterForm.controls.name.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const errorMessage = compiled.querySelector('#name-error');
      expect(errorMessage?.textContent?.trim()).toBe('Character name is required');
    });

    it('should show error message for pronouns when invalid', () => {
      component.characterForm.controls.pronouns.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const errorMessage = compiled.querySelector('#pronouns-error');
      expect(errorMessage?.textContent?.trim()).toBe('Pronouns are required');
    });

    it('should apply active class to current desktop tab', () => {
      component.selectTab('heritage');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const activeTabs = compiled.querySelectorAll('.desktop-tabs .folder-tab.active');
      expect(activeTabs.length).toBe(1);
      expect(activeTabs[0].textContent?.trim()).toBe('Heritage');
    });

    it('should apply active class to current mobile drawer item', () => {
      component.selectTab('traits');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const activeItems = compiled.querySelectorAll('.mobile-drawer .drawer-item.active');
      expect(activeItems.length).toBe(1);
      expect(activeItems[0].textContent?.trim()).toBe('Traits');
    });

    it('should show mobile drawer overlay when drawer is open', () => {
      component.mobileDrawerOpen.set(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const overlay = compiled.querySelector('.mobile-drawer-overlay');
      expect(overlay).toBeTruthy();
    });

    it('should not show mobile drawer overlay when drawer is closed', () => {
      component.mobileDrawerOpen.set(false);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const overlay = compiled.querySelector('.mobile-drawer-overlay');
      expect(overlay).toBeFalsy();
    });

    it('should apply open class to drawer when open', () => {
      component.mobileDrawerOpen.set(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const drawer = compiled.querySelector('.mobile-drawer.open');
      expect(drawer).toBeTruthy();
    });

    it('should render placeholder text for each tab', () => {
      const tabIds = ['class', 'heritage', 'traits'];

      tabIds.forEach((tabId) => {
        component.selectTab(tabId);
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;
        const placeholder = compiled.querySelector('.placeholder-text');
        expect(placeholder).toBeTruthy();
        expect(placeholder?.textContent).toContain('coming soon');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on desktop tabs', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const firstTab = compiled.querySelector('.desktop-tabs .folder-tab');
      expect(firstTab?.getAttribute('aria-label')).toBe('Navigate to Class tab');
    });

    it('should have proper ARIA labels on mobile drawer items', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const firstItem = compiled.querySelector('.mobile-drawer .drawer-item');
      expect(firstItem?.getAttribute('aria-label')).toBe('Navigate to Class tab');
    });

    it('should set aria-current on active desktop tab', () => {
      component.selectTab('heritage');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const tabs = Array.from(compiled.querySelectorAll('.desktop-tabs .folder-tab'));
      const heritageTab = tabs.find((tab) => tab.textContent?.trim() === 'Heritage');
      expect(heritageTab?.getAttribute('aria-current')).toBe('page');
    });

    it('should set aria-current on active mobile drawer item', () => {
      component.selectTab('traits');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const items = Array.from(compiled.querySelectorAll('.mobile-drawer .drawer-item'));
      const traitsItem = items.find((item) => item.textContent?.trim() === 'Traits');
      expect(traitsItem?.getAttribute('aria-current')).toBe('page');
    });

    it('should have aria-expanded on hamburger button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const hamburger = compiled.querySelector('.hamburger-button');
      expect(hamburger?.getAttribute('aria-expanded')).toBe('false');

      component.mobileDrawerOpen.set(true);
      fixture.detectChanges();
      expect(hamburger?.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have aria-hidden on mobile drawer', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const drawer = compiled.querySelector('.mobile-drawer');
      expect(drawer?.getAttribute('aria-hidden')).toBe('true');

      component.mobileDrawerOpen.set(true);
      fixture.detectChanges();
      expect(drawer?.getAttribute('aria-hidden')).toBe('false');
    });

    it('should have aria-invalid on invalid name input', () => {
      component.characterForm.controls.name.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const nameInput = compiled.querySelector('#character-name');
      expect(nameInput?.getAttribute('aria-invalid')).toBe('true');
    });

    it('should have aria-invalid on invalid pronouns input', () => {
      component.characterForm.controls.pronouns.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const pronounsInput = compiled.querySelector('#character-pronouns');
      expect(pronounsInput?.getAttribute('aria-invalid')).toBe('true');
    });

    it('should have aria-describedby linking to error message when name is invalid', () => {
      component.characterForm.controls.name.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const nameInput = compiled.querySelector('#character-name');
      expect(nameInput?.getAttribute('aria-describedby')).toBe('name-error');
    });

    it('should have aria-describedby linking to error message when pronouns are invalid', () => {
      component.characterForm.controls.pronouns.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const pronounsInput = compiled.querySelector('#character-pronouns');
      expect(pronounsInput?.getAttribute('aria-describedby')).toBe('pronouns-error');
    });

    it('should have role="alert" on error messages', () => {
      component.characterForm.controls.name.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const errorMessage = compiled.querySelector('#name-error');
      expect(errorMessage?.getAttribute('role')).toBe('alert');
    });

    it('should have role="region" on tab content', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const tabContent = compiled.querySelector('.tab-content');
      expect(tabContent?.getAttribute('role')).toBe('region');
    });

    it('should have descriptive aria-label on tab content region', () => {
      component.selectTab('heritage');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const tabContent = compiled.querySelector('.tab-content');
      expect(tabContent?.getAttribute('aria-label')).toBe('heritage section');
    });
  });

  describe('User Interactions', () => {
    it('should toggle drawer when hamburger is clicked', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const hamburger = compiled.querySelector('.hamburger-button') as HTMLButtonElement;

      expect(component.mobileDrawerOpen()).toBe(false);
      hamburger.click();
      expect(component.mobileDrawerOpen()).toBe(true);
      hamburger.click();
      expect(component.mobileDrawerOpen()).toBe(false);
    });

    it('should close drawer when overlay is clicked', () => {
      component.mobileDrawerOpen.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const overlay = compiled.querySelector('.mobile-drawer-overlay') as HTMLDivElement;

      overlay.click();
      expect(component.mobileDrawerOpen()).toBe(false);
    });

    it('should change tab when desktop tab is clicked', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const tabs = Array.from(compiled.querySelectorAll('.desktop-tabs .folder-tab'));
      const heritageTab = tabs.find((tab) => tab.textContent?.trim() === 'Heritage') as HTMLButtonElement;

      heritageTab.click();
      expect(component.activeTab()).toBe('heritage');
    });

    it('should change tab and close drawer when mobile drawer item is clicked', () => {
      component.mobileDrawerOpen.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const items = Array.from(compiled.querySelectorAll('.mobile-drawer .drawer-item'));
      const traitsItem = items.find((item) => item.textContent?.trim() === 'Traits') as HTMLButtonElement;

      traitsItem.click();
      expect(component.activeTab()).toBe('traits');
      expect(component.mobileDrawerOpen()).toBe(false);
    });

    it('should update form value when name is typed', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const nameInput = compiled.querySelector('#character-name') as HTMLInputElement;

      nameInput.value = 'Gandalf';
      nameInput.dispatchEvent(new Event('input'));

      expect(component.characterForm.controls.name.value).toBe('Gandalf');
    });

    it('should update form value when pronouns are typed', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const pronounsInput = compiled.querySelector('#character-pronouns') as HTMLInputElement;

      pronounsInput.value = 'they/them';
      pronounsInput.dispatchEvent(new Event('input'));

      expect(component.characterForm.controls.pronouns.value).toBe('they/them');
    });
  });
});
