import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { SearchableEntityType, SearchFilters } from '../../models/search.model';
import { ViewMode } from '../../reference';

export interface FilterOption {
  value: string;
  label: string;
}

interface SelectFilter {
  kind: 'select';
  key: keyof SearchFilters;
  label: string;
  options: FilterOption[];
}

interface CheckboxFilter {
  kind: 'checkbox';
  key: keyof SearchFilters;
  label: string;
}

type FilterControl = SelectFilter | CheckboxFilter;

const TIER_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any Tier' },
  { value: '1', label: 'Tier 1' },
  { value: '2', label: 'Tier 2' },
  { value: '3', label: 'Tier 3' },
  { value: '4', label: 'Tier 4' },
];

const LEVEL_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any Level' },
  { value: '1', label: 'Level 1' },
  { value: '2', label: 'Level 2' },
  { value: '3', label: 'Level 3' },
  { value: '4', label: 'Level 4' },
  { value: '5', label: 'Level 5' },
  { value: '6', label: 'Level 6' },
  { value: '7', label: 'Level 7' },
  { value: '8', label: 'Level 8' },
  { value: '9', label: 'Level 9' },
  { value: '10', label: 'Level 10' },
];

const BURDEN_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any Burden' },
  { value: 'ONE_HANDED', label: 'One-handed' },
  { value: 'TWO_HANDED', label: 'Two-handed' },
];

const RANGE_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any Range' },
  { value: 'MELEE', label: 'Melee' },
  { value: 'RANGED', label: 'Ranged' },
  { value: 'VERY_CLOSE', label: 'Very Close' },
  { value: 'CLOSE', label: 'Close' },
  { value: 'FAR', label: 'Far' },
];

const TRAIT_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any Trait' },
  { value: 'AGILITY', label: 'Agility' },
  { value: 'STRENGTH', label: 'Strength' },
  { value: 'FINESSE', label: 'Finesse' },
  { value: 'INSTINCT', label: 'Instinct' },
  { value: 'PRESENCE', label: 'Presence' },
  { value: 'KNOWLEDGE', label: 'Knowledge' },
];

const ADVERSARY_TYPE_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any Type' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'BRUISER', label: 'Bruiser' },
  { value: 'SKULK', label: 'Skulk' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'LEADER', label: 'Leader' },
  { value: 'BOSS', label: 'Boss' },
  { value: 'SOLO', label: 'Solo' },
];

const UNIVERSAL_FILTERS: FilterControl[] = [
  { kind: 'select', key: 'tier', label: 'Tier', options: TIER_OPTIONS },
  { kind: 'checkbox', key: 'isOfficial', label: 'Official content only' },
];

const TYPE_FILTERS: Partial<Record<SearchableEntityType, FilterControl[]>> = {
  WEAPON: [
    { kind: 'select', key: 'tier', label: 'Tier', options: TIER_OPTIONS },
    { kind: 'select', key: 'trait', label: 'Trait', options: TRAIT_OPTIONS },
    { kind: 'select', key: 'range', label: 'Range', options: RANGE_OPTIONS },
    { kind: 'select', key: 'burden', label: 'Burden', options: BURDEN_OPTIONS },
    { kind: 'checkbox', key: 'isOfficial', label: 'Official content only' },
  ],
  ARMOR: [
    { kind: 'select', key: 'tier', label: 'Tier', options: TIER_OPTIONS },
    { kind: 'select', key: 'burden', label: 'Burden', options: BURDEN_OPTIONS },
    { kind: 'checkbox', key: 'isOfficial', label: 'Official content only' },
  ],
  ADVERSARY: [
    { kind: 'select', key: 'adversaryType', label: 'Adversary Type', options: ADVERSARY_TYPE_OPTIONS },
    { kind: 'select', key: 'tier', label: 'Tier', options: TIER_OPTIONS },
    { kind: 'checkbox', key: 'isOfficial', label: 'Official content only' },
  ],
  LOOT: [
    { kind: 'checkbox', key: 'isConsumable', label: 'Consumables only' },
    { kind: 'checkbox', key: 'isOfficial', label: 'Official content only' },
  ],
  CLASS: [
    { kind: 'checkbox', key: 'isOfficial', label: 'Official content only' },
  ],
  ANCESTRY_CARD: [
    { kind: 'select', key: 'tier', label: 'Tier', options: TIER_OPTIONS },
    { kind: 'checkbox', key: 'isOfficial', label: 'Official content only' },
  ],
  COMMUNITY_CARD: [
    { kind: 'checkbox', key: 'isOfficial', label: 'Official content only' },
  ],
  DOMAIN: [
    { kind: 'checkbox', key: 'isOfficial', label: 'Official content only' },
  ],
  DOMAIN_CARD: [
    { kind: 'select', key: 'tier', label: 'Tier', options: TIER_OPTIONS },
    { kind: 'select', key: 'level', label: 'Level', options: LEVEL_OPTIONS },
    { kind: 'select', key: 'associatedDomainId', label: 'Domain', options: [{ value: '', label: 'Any Domain' }] },
    { kind: 'checkbox', key: 'isOfficial', label: 'Official content only' },
  ],
  SUBCLASS_CARD: [
    { kind: 'checkbox', key: 'isOfficial', label: 'Official content only' },
  ],
  COMPANION: [
    { kind: 'checkbox', key: 'isOfficial', label: 'Official content only' },
  ],
};

@Component({
  selector: 'app-filter-rail',
  templateUrl: './filter-rail.html',
  styleUrl: './filter-rail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterRail {
  readonly activeType = input<SearchableEntityType | null>(null);
  readonly filters = input<SearchFilters>({});
  readonly viewMode = input<ViewMode>('landing');
  readonly domainOptions = input<FilterOption[]>([]);

  readonly filtersChange = output<SearchFilters>();

  readonly activeControls = computed<FilterControl[]>(() => {
    const type = this.activeType();
    if (!type) return UNIVERSAL_FILTERS;
    const controls = TYPE_FILTERS[type] ?? UNIVERSAL_FILTERS;
    if (type === 'DOMAIN_CARD') {
      const opts = this.domainOptions();
      return controls.map(c => {
        if (c.kind === 'select' && c.key === 'associatedDomainId') {
          return { ...c, options: [{ value: '', label: 'Any Domain' }, ...opts] };
        }
        return c;
      });
    }
    return controls;
  });

  getSelectValue(key: keyof SearchFilters): string {
    const val = this.filters()[key];
    return val !== undefined && val !== null ? String(val) : '';
  }

  isChecked(key: keyof SearchFilters): boolean {
    return !!this.filters()[key];
  }

  onSelectChange(key: keyof SearchFilters, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const updated = { ...this.filters() };
    if (!value) {
      delete updated[key];
    } else {
      const numeric = Number(value);
      (updated as Record<string, unknown>)[key] = Number.isNaN(numeric) ? value : numeric;
    }
    this.filtersChange.emit(updated);
  }

  onCheckboxChange(key: keyof SearchFilters, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const updated = { ...this.filters() };
    if (!checked) {
      delete updated[key];
    } else {
      (updated as Record<string, unknown>)[key] = true;
    }
    this.filtersChange.emit(updated);
  }

  onClearAll(): void {
    this.filtersChange.emit({});
  }

  hasActiveFilters(): boolean {
    return Object.keys(this.filters()).length > 0;
  }

  isSelectFilter(control: FilterControl): control is SelectFilter {
    return control.kind === 'select';
  }

  isCheckboxFilter(control: FilterControl): control is CheckboxFilter {
    return control.kind === 'checkbox';
  }
}
