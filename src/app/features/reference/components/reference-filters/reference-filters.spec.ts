import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ReferenceFilters } from './reference-filters';
import { FilterDefinition } from '../../models/reference.model';
import { ExpansionService } from '../../../../shared/services/expansion.service';
import { ClassService } from '../../../../shared/services/class.service';
import { DomainService } from '../../../../shared/services/domain.service';

const DROPDOWN_FILTER: FilterDefinition = {
  key: 'level',
  label: 'Level',
  type: 'dropdown',
  options: [
    { value: 'FOUNDATION', label: 'Foundation' },
    { value: 'SPECIALIZATION', label: 'Specialization' },
  ],
};

const TOGGLE_FILTER: FilterDefinition = {
  key: 'isOfficial',
  label: 'Official Only',
  type: 'toggle',
};

const DYNAMIC_FILTER: FilterDefinition = {
  key: 'expansionId',
  label: 'Expansion',
  type: 'dynamic-dropdown',
  dynamicSource: 'expansions',
};

@Component({
  imports: [ReferenceFilters],
  template: `
    <app-reference-filters
      [filters]="filters()"
      [currentValues]="currentValues()"
      (filtersChanged)="onFiltersChanged($event)"
    />
  `,
})
class TestHost {
  filters = signal<FilterDefinition[]>([]);
  currentValues = signal<Record<string, unknown>>({});
  lastEmitted: Record<string, unknown> | undefined;

  onFiltersChanged(values: Record<string, unknown>): void {
    this.lastEmitted = values;
  }
}

describe('ReferenceFilters', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  const mockExpansionService = {
    getExpansions: () => of([{ id: 1, name: 'Core Set' }]),
  };

  const mockClassService = {
    getClasses: () => of([{ id: 1, name: 'Warrior', description: '', cardType: 'class' as const }]),
  };

  const mockDomainService = {
    loadDomainLookup: () => of(new Map([['Arcana', 1]])),
    resolveDomainIds: () => [],
    getDomainCards: () => of([]),
    getDomainCardsForNames: () => of([]),
    clearCache: () => undefined,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost, HttpClientTestingModule],
      providers: [
        { provide: ExpansionService, useValue: mockExpansionService },
        { provide: ClassService, useValue: mockClassService },
        { provide: DomainService, useValue: mockDomainService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(el.querySelector('app-reference-filters')).toBeTruthy();
  });

  it('should show nothing when filters array is empty', () => {
    host.filters.set([]);
    fixture.detectChanges();

    expect(el.querySelector('.filter-bar')).toBeFalsy();
  });

  it('should show filter bar when filters are provided', () => {
    host.filters.set([DROPDOWN_FILTER]);
    fixture.detectChanges();

    expect(el.querySelector('.filter-bar')).toBeTruthy();
  });

  it('should render a select element for dropdown type filters', () => {
    host.filters.set([DROPDOWN_FILTER]);
    fixture.detectChanges();

    const select = el.querySelector('select#filter-level');
    expect(select).toBeTruthy();
  });

  it('should render dropdown options from filter definition', () => {
    host.filters.set([DROPDOWN_FILTER]);
    fixture.detectChanges();

    const options = el.querySelectorAll('select#filter-level option');
    expect(options.length).toBe(3); // "All" + 2 defined options
  });

  it('should render a toggle button for toggle type filters', () => {
    host.filters.set([TOGGLE_FILTER]);
    fixture.detectChanges();

    const btn = el.querySelector('button.toggle-btn');
    expect(btn).toBeTruthy();
    expect(btn?.textContent?.trim()).toBe('Official Only');
  });

  it('should render a select element for dynamic-dropdown type filters', () => {
    host.filters.set([DYNAMIC_FILTER]);
    fixture.detectChanges();

    const select = el.querySelector('select#filter-expansionId');
    expect(select).toBeTruthy();
  });

  it('should show clear filters button when filters are present', () => {
    host.filters.set([DROPDOWN_FILTER]);
    fixture.detectChanges();

    const clearBtn = el.querySelector('.clear-btn');
    expect(clearBtn).toBeTruthy();
    expect(clearBtn?.textContent?.trim()).toBe('Clear Filters');
  });

  it('should emit filtersChanged when a dropdown value changes', () => {
    host.filters.set([DROPDOWN_FILTER]);
    fixture.detectChanges();

    const select = el.querySelector('select#filter-level') as HTMLSelectElement;
    select.value = 'FOUNDATION';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.lastEmitted).toBeDefined();
    expect(host.lastEmitted?.['level']).toBe('FOUNDATION');
  });

  it('should emit filtersChanged when a toggle is clicked', () => {
    host.filters.set([TOGGLE_FILTER]);
    fixture.detectChanges();

    const btn = el.querySelector('button.toggle-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    expect(host.lastEmitted).toBeDefined();
    expect(host.lastEmitted?.['isOfficial']).toBe(true);
  });

  it('should toggle active class on toggle button when clicked', () => {
    host.filters.set([TOGGLE_FILTER]);
    fixture.detectChanges();

    const btn = el.querySelector('button.toggle-btn') as HTMLButtonElement;
    expect(btn.classList.contains('active')).toBe(false);

    btn.click();
    fixture.detectChanges();

    expect(btn.classList.contains('active')).toBe(true);
  });

  it('should emit filtersChanged with empty object when clear is clicked', () => {
    host.filters.set([DROPDOWN_FILTER, TOGGLE_FILTER]);
    fixture.detectChanges();

    // Set a value first
    const select = el.querySelector('select#filter-level') as HTMLSelectElement;
    select.value = 'FOUNDATION';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // Now clear
    const clearBtn = el.querySelector('.clear-btn') as HTMLButtonElement;
    clearBtn.click();
    fixture.detectChanges();

    expect(host.lastEmitted).toEqual({});
  });

  it('should reset toggle active state after clearing filters', () => {
    host.filters.set([TOGGLE_FILTER]);
    fixture.detectChanges();

    const btn = el.querySelector('button.toggle-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(btn.classList.contains('active')).toBe(true);

    const clearBtn = el.querySelector('.clear-btn') as HTMLButtonElement;
    clearBtn.click();
    fixture.detectChanges();

    expect(btn.classList.contains('active')).toBe(false);
  });

  it('should load expansion options for dynamic-dropdown with expansions source', () => {
    host.filters.set([DYNAMIC_FILTER]);
    fixture.detectChanges();

    const options = el.querySelectorAll('select#filter-expansionId option');
    // "All" + 1 loaded expansion
    expect(options.length).toBe(2);
    expect(options[1]?.textContent?.trim()).toBe('Core Set');
  });

  it('should render filter label for each filter', () => {
    host.filters.set([DROPDOWN_FILTER, TOGGLE_FILTER]);
    fixture.detectChanges();

    const labels = el.querySelectorAll('.filter-label');
    expect(labels.length).toBe(2);
  });

  it('should sync internal values when currentValues input changes', () => {
    host.filters.set([DROPDOWN_FILTER]);
    host.currentValues.set({ level: 'FOUNDATION' });
    fixture.autoDetectChanges();

    const component = fixture.debugElement.query(
      (de) => de.componentInstance instanceof ReferenceFilters
    ).componentInstance as ReferenceFilters;

    expect(component.getValues()['level']).toBe('FOUNDATION');

    host.currentValues.set({});
    fixture.detectChanges();

    expect(component.getValues()['level']).toBeUndefined();
  });

  it('should strip empty string values from emitted filters', () => {
    host.filters.set([DROPDOWN_FILTER]);
    fixture.detectChanges();

    const select = el.querySelector('select#filter-level') as HTMLSelectElement;
    select.value = 'FOUNDATION';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.lastEmitted?.['level']).toBe('FOUNDATION');

    select.value = '';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.lastEmitted).toBeDefined();
    expect('level' in host.lastEmitted!).toBe(false);
  });

  it('should coerce numeric values for dynamic-dropdown selections', () => {
    host.filters.set([DYNAMIC_FILTER]);
    fixture.detectChanges();

    const select = el.querySelector('select#filter-expansionId') as HTMLSelectElement;
    select.value = '1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.lastEmitted?.['expansionId']).toBe(1);
  });

  it('should strip dynamic-dropdown value when reset to All', () => {
    host.filters.set([DYNAMIC_FILTER]);
    fixture.detectChanges();

    const select = el.querySelector('select#filter-expansionId') as HTMLSelectElement;
    select.value = '1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    select.value = '';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.lastEmitted).toBeDefined();
    expect('expansionId' in host.lastEmitted!).toBe(false);
  });
});
