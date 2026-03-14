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
    const buttons = fixture.nativeElement.querySelectorAll('.category-btn');
    expect(buttons.length).toBe(CATEGORY_CONFIGS.length);
  });

  it('should display category labels', () => {
    const labels = fixture.nativeElement.querySelectorAll('.category-label');
    expect(labels[0].textContent.trim()).toBe('Classes');
  });

  it('should display category icons', () => {
    const icons = fixture.nativeElement.querySelectorAll('.category-icon');
    expect(icons.length).toBe(CATEGORY_CONFIGS.length);
  });

  it('should display category descriptions', () => {
    const descriptions = fixture.nativeElement.querySelectorAll('.category-description');
    expect(descriptions[0].textContent.trim()).toBe('Character classes and their abilities');
  });

  it('should emit categorySelected when a button is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.category-btn');
    buttons[0].click();
    fixture.detectChanges();

    expect(host.selectedCategory).toBe('classes');
  });

  it('should emit the correct category id when a non-first button is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.category-btn');
    buttons[6].click();
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

    const buttons = activeFixture.nativeElement.querySelectorAll('.category-btn');
    expect(buttons[0].classList.contains('category-btn--active')).toBe(true);

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

    const buttons = activeFixture.nativeElement.querySelectorAll('.category-btn');
    expect(buttons[1].classList.contains('category-btn--active')).toBe(false);

    activeFixture.destroy();
  });

  it('should not apply active class to any button when activeCategory is null', () => {
    host.activeCategory = null;
    fixture.detectChanges();

    const activeButtons = fixture.nativeElement.querySelectorAll('.category-btn--active');
    expect(activeButtons.length).toBe(0);
  });
});
