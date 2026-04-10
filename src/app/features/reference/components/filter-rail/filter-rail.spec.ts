import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FilterRail, FilterOption } from './filter-rail';
import { SearchableEntityType, SearchFilters } from '../../models/search.model';
import { ViewMode } from '../../reference';

@Component({
  template: `
    <app-filter-rail
      [activeType]="activeType()"
      [filters]="filters()"
      [viewMode]="viewMode()"
      [domainOptions]="domainOptions()"
      (filtersChange)="onFiltersChange($event)"
    />
  `,
  imports: [FilterRail],
})
class TestHost {
  activeType = signal<SearchableEntityType | null>(null);
  filters = signal<SearchFilters>({});
  viewMode = signal<ViewMode>('landing');
  domainOptions = signal<FilterOption[]>([]);
  lastFilters: SearchFilters | null = null;
  onFiltersChange(f: SearchFilters): void { this.lastFilters = f; }
}

describe('FilterRail', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(fixture.nativeElement.querySelector('app-filter-rail')).toBeTruthy();
  });

  it('renders universal filters when activeType is null', () => {
    host.activeType.set(null);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Tier');
    expect(el.textContent).toContain('Official content only');
  });

  it('renders weapon-specific filters when activeType is WEAPON', () => {
    host.activeType.set('WEAPON');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Trait');
    expect(el.textContent).toContain('Range');
    expect(el.textContent).toContain('Burden');
  });

  it('does not render Trait filter in universal mode', () => {
    host.activeType.set(null);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Trait');
  });

  it('renders adversary-specific filters when activeType is ADVERSARY', () => {
    host.activeType.set('ADVERSARY');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Adversary Type');
  });

  it('renders consumable checkbox for LOOT type', () => {
    host.activeType.set('LOOT');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Consumables only');
  });

  it('switches filter set when activeType changes from null to ARMOR', () => {
    host.activeType.set(null);
    fixture.detectChanges();
    let el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Burden');

    host.activeType.set('ARMOR');
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Burden');
  });

  it('emits updated filters on select change', () => {
    host.activeType.set('WEAPON');
    fixture.detectChanges();

    const selects = fixture.nativeElement.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
    const tierSelect = Array.from(selects).find(s => s.id === 'filter-tier');
    expect(tierSelect).toBeTruthy();

    tierSelect!.value = '2';
    tierSelect!.dispatchEvent(new Event('change'));

    expect(host.lastFilters).toEqual({ tier: 2 });
  });

  it('removes filter key when select is cleared', () => {
    host.activeType.set('WEAPON');
    host.filters.set({ tier: 2 });
    fixture.detectChanges();

    const tierSelect = fixture.nativeElement.querySelector('#filter-tier') as HTMLSelectElement;
    tierSelect.value = '';
    tierSelect.dispatchEvent(new Event('change'));

    expect(host.lastFilters).toEqual({});
  });

  it('emits updated filters on checkbox change', () => {
    host.activeType.set(null);
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('#filter-isOfficial') as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));

    expect(host.lastFilters).toEqual({ isOfficial: true });
  });

  it('removes filter key when checkbox is unchecked', () => {
    host.activeType.set(null);
    host.filters.set({ isOfficial: true });
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('#filter-isOfficial') as HTMLInputElement;
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));

    expect(host.lastFilters).toEqual({});
  });

  it('does not show clear button when no active filters', () => {
    host.filters.set({});
    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('.clear-btn');
    expect(clearBtn).toBeNull();
  });

  it('shows clear button when filters are active', () => {
    host.filters.set({ tier: 2 });
    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('.clear-btn');
    expect(clearBtn).toBeTruthy();
  });

  it('emits empty filters when clear all is clicked', () => {
    host.filters.set({ tier: 2, isOfficial: true });
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.clear-btn') as HTMLButtonElement;
    clearBtn.click();

    expect(host.lastFilters).toEqual({});
  });

  describe('DOMAIN_CARD type — domain filter', () => {
    it('renders a Domain select when activeType is DOMAIN_CARD', () => {
      host.activeType.set('DOMAIN_CARD');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Domain');
      expect(el.querySelector('#filter-associatedDomainId')).toBeTruthy();
    });

    it('still renders tier and isOfficial filters for DOMAIN_CARD', () => {
      host.activeType.set('DOMAIN_CARD');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Tier');
      expect(el.textContent).toContain('Official content only');
    });

    it('shows only "Any Domain" option when domainOptions input is empty', () => {
      host.activeType.set('DOMAIN_CARD');
      host.domainOptions.set([]);
      fixture.detectChanges();
      const select = fixture.nativeElement.querySelector('#filter-associatedDomainId') as HTMLSelectElement;
      expect(select.options.length).toBe(1);
      expect(select.options[0].textContent).toContain('Any Domain');
    });

    it('populates Domain select options from domainOptions input', () => {
      host.activeType.set('DOMAIN_CARD');
      host.domainOptions.set([
        { value: '11', label: 'Arcana' },
        { value: '12', label: 'Blade' },
        { value: '13', label: 'Midnight' },
      ]);
      fixture.detectChanges();
      const select = fixture.nativeElement.querySelector('#filter-associatedDomainId') as HTMLSelectElement;
      const labels = Array.from(select.options).map(o => o.textContent?.trim());
      expect(labels).toEqual(['Any Domain', 'Arcana', 'Blade', 'Midnight']);
    });

    it('emits numeric associatedDomainId filter when Domain is selected', () => {
      host.activeType.set('DOMAIN_CARD');
      host.domainOptions.set([
        { value: '11', label: 'Arcana' },
        { value: '12', label: 'Blade' },
      ]);
      fixture.detectChanges();

      const select = fixture.nativeElement.querySelector('#filter-associatedDomainId') as HTMLSelectElement;
      select.value = '12';
      select.dispatchEvent(new Event('change'));

      expect(host.lastFilters).toEqual({ associatedDomainId: 12 });
    });

    it('removes associatedDomainId filter when select is cleared', () => {
      host.activeType.set('DOMAIN_CARD');
      host.domainOptions.set([{ value: '11', label: 'Arcana' }]);
      host.filters.set({ associatedDomainId: 11 });
      fixture.detectChanges();

      const select = fixture.nativeElement.querySelector('#filter-associatedDomainId') as HTMLSelectElement;
      select.value = '';
      select.dispatchEvent(new Event('change'));

      expect(host.lastFilters).toEqual({});
    });

    it('does not render Domain select for non-DOMAIN_CARD types', () => {
      host.activeType.set('WEAPON');
      host.domainOptions.set([{ value: '11', label: 'Arcana' }]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#filter-associatedDomainId')).toBeNull();
    });
  });
});
