import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Reference } from './reference';

describe('Reference', () => {
  let fixture: ComponentFixture<Reference>;
  let component: Reference;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reference],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Reference);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the page title', () => {
    const title = fixture.nativeElement.querySelector('.reference-title');
    expect(title.textContent.trim()).toBe('Compendium');
  });

  it('should render the category selector', () => {
    const selector = fixture.nativeElement.querySelector('app-category-selector');
    expect(selector).toBeTruthy();
  });

  it('should have null activeCategory initially', () => {
    expect(component.activeCategorySignal()).toBeNull();
  });

  it('should update activeCategory signal when onCategorySelected is called', () => {
    component.onCategorySelected('domains');
    fixture.detectChanges();

    expect(component.activeCategorySignal()).toBe('domains');
  });

  it('should reset filters when a new category is selected', () => {
    component.onFiltersChanged({ tier: 1 });
    component.onCategorySelected('weapons');
    fixture.detectChanges();

    expect(component.filtersSignal()).toEqual({});
  });

  it('should update filters signal when onFiltersChanged is called', () => {
    component.onFiltersChanged({ isOfficial: true });
    fixture.detectChanges();

    expect(component.filtersSignal()).toEqual({ isOfficial: true });
  });

  it('should reset currentPage when filters change', () => {
    component.onPageChanged(3);
    component.onFiltersChanged({ tier: 2 });
    fixture.detectChanges();

    expect(component.currentPageSignal()).toBe(0);
  });

  it('should update currentPage when onPageChanged is called', () => {
    component.onPageChanged(2);
    fixture.detectChanges();

    expect(component.currentPageSignal()).toBe(2);
  });

  it('should compute categoryConfig based on activeCategory', () => {
    component.onCategorySelected('domains');
    fixture.detectChanges();

    expect(component.categoryConfig()?.label).toBe('Domains');
  });

  it('should return undefined categoryConfig when no category is selected', () => {
    expect(component.categoryConfig()).toBeUndefined();
  });

  it('should compute activeFilters as empty array when no category selected', () => {
    expect(component.activeFilters()).toEqual([]);
  });

  it('should compute activeFilters for a category that has filters', () => {
    component.onCategorySelected('domainCards');
    fixture.detectChanges();

    expect(component.activeFilters().length).toBeGreaterThan(0);
  });

  it('should compute activeFilters as empty array for a category with no filters defined', () => {
    component.onCategorySelected('classes');
    fixture.detectChanges();

    expect(component.activeFilters()).toEqual([]);
  });

  it('should not call fetchCards when no category is selected', () => {
    expect(component.loadingSignal()).toBe(false);
    expect(component.cardsSignal()).toEqual([]);
  });

  it('should set loading to true when a category is selected', () => {
    component.onCategorySelected('companions');
    fixture.detectChanges();

    expect(component.loadingSignal()).toBe(true);
  });

  it('should set cards to empty array initially', () => {
    expect(component.cardsSignal()).toEqual([]);
  });

  it('should set adversaries to empty array initially', () => {
    expect(component.adversariesSignal()).toEqual([]);
  });
});
