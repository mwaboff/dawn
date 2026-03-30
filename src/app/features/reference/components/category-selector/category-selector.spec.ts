import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { CategorySelector } from './category-selector';
import { CategoryConfig, ReferenceCategory, CATEGORY_CONFIGS } from '../../models/reference.model';

@Component({
  template: `
    <app-category-selector
      [categories]="categories"
      [activeCategory]="activeCategory"
      (categorySelected)="onCategorySelected($event)"
    />
  `,
  imports: [CategorySelector]
})
class TestHostComponent {
  categories: CategoryConfig[] = CATEGORY_CONFIGS;
  activeCategory: ReferenceCategory | null = null;
  selectedCategory: ReferenceCategory | null = null;

  onCategorySelected(category: ReferenceCategory): void {
    this.selectedCategory = category;
  }
}

describe('CategorySelector', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    const selector = fixture.nativeElement.querySelector('app-category-selector');
    expect(selector).toBeTruthy();
  });

  it('should render all categories', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.category-tab');
    expect(buttons.length).toBe(CATEGORY_CONFIGS.length);
  });

  it('should display category labels', () => {
    const labels = fixture.nativeElement.querySelectorAll('.category-label');
    expect(labels[0].textContent.trim()).toBe('Domains');
  });

  it('should display category icons', () => {
    const icons = fixture.nativeElement.querySelectorAll('.category-icon');
    expect(icons.length).toBe(CATEGORY_CONFIGS.length);
  });

  it('should render as a horizontal strip with tablist role', () => {
    const strip = fixture.nativeElement.querySelector('.category-strip');
    expect(strip).toBeTruthy();
    expect(strip.getAttribute('role')).toBe('tablist');
  });

  it('should set tab role on each button', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.category-tab');
    expect(buttons[0].getAttribute('role')).toBe('tab');
  });

  it('should set description as title tooltip', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.category-tab');
    expect(buttons[0].getAttribute('title')).toBe(CATEGORY_CONFIGS[0].description);
  });

  it('should emit categorySelected when a button is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.category-tab');
    buttons[0].click();
    fixture.detectChanges();

    expect(host.selectedCategory).toBe('domains');
  });

  it('should emit the correct category id when a non-first button is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.category-tab');
    buttons[5].click();
    fixture.detectChanges();

    expect(host.selectedCategory).toBe('domainCards');
  });

  it('should apply active class to the active category button', () => {
    fixture.destroy();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [TestHostComponent] });

    const activeFixture = TestBed.createComponent(TestHostComponent);
    const activeHost = activeFixture.componentInstance;
    activeHost.activeCategory = 'classes';
    activeFixture.detectChanges();

    const buttons = activeFixture.nativeElement.querySelectorAll('.category-tab');
    expect(buttons[1].classList.contains('category-tab--active')).toBe(true);

    activeFixture.destroy();
  });

  it('should not apply active class to inactive category buttons', () => {
    fixture.destroy();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [TestHostComponent] });

    const activeFixture = TestBed.createComponent(TestHostComponent);
    const activeHost = activeFixture.componentInstance;
    activeHost.activeCategory = 'classes';
    activeFixture.detectChanges();

    const buttons = activeFixture.nativeElement.querySelectorAll('.category-tab');
    expect(buttons[0].classList.contains('category-tab--active')).toBe(false);

    activeFixture.destroy();
  });

  it('should not apply active class to any button when activeCategory is null', () => {
    host.activeCategory = null;
    fixture.detectChanges();

    const activeButtons = fixture.nativeElement.querySelectorAll('.category-tab--active');
    expect(activeButtons.length).toBe(0);
  });

  it('should set aria-selected on active tab', () => {
    fixture.destroy();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [TestHostComponent] });

    const activeFixture = TestBed.createComponent(TestHostComponent);
    activeFixture.componentInstance.activeCategory = 'classes';
    activeFixture.detectChanges();

    const buttons = activeFixture.nativeElement.querySelectorAll('.category-tab');
    expect(buttons[1].getAttribute('aria-selected')).toBe('true');
    expect(buttons[0].getAttribute('aria-selected')).toBe('false');

    activeFixture.destroy();
  });
});
