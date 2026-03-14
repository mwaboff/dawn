import { Component, ChangeDetectionStrategy, input, output, signal, effect, inject, OnInit } from '@angular/core';
import { FilterDefinition } from '../../models/reference.model';
import { ExpansionService } from '../../../../shared/services/expansion.service';
import { ClassService } from '../../../../shared/services/class.service';
import { DomainService } from '../../../../shared/services/domain.service';

@Component({
  selector: 'app-reference-filters',
  templateUrl: './reference-filters.html',
  styleUrl: './reference-filters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceFilters implements OnInit {
  private readonly expansionService = inject(ExpansionService);
  private readonly classService = inject(ClassService);
  private readonly domainService = inject(DomainService);

  readonly filters = input<FilterDefinition[]>([]);
  readonly currentValues = input<Record<string, unknown>>({});

  readonly filtersChanged = output<Record<string, unknown>>();

  private readonly values = signal<Record<string, unknown>>({});

  readonly expansionOptions = signal<{ id: number; name: string }[]>([]);
  readonly classOptions = signal<{ id: number; name: string }[]>([]);
  readonly domainOptions = signal<{ id: number; name: string }[]>([]);

  constructor() {
    effect(() => {
      const filterDefs = this.filters();
      const dynamicSources = new Set(
        filterDefs
          .filter(f => f.type === 'dynamic-dropdown' && f.dynamicSource)
          .map(f => f.dynamicSource!)
      );

      if (dynamicSources.has('expansions')) {
        this.expansionService.getExpansions().subscribe(options => {
          this.expansionOptions.set(options);
        });
      }

      if (dynamicSources.has('classes')) {
        this.classService.getClasses().subscribe(cards => {
          this.classOptions.set(cards.map(c => ({ id: c.id, name: c.name })));
        });
      }

      if (dynamicSources.has('domains')) {
        this.domainService.loadDomainLookup().subscribe(lookup => {
          const options = Array.from(lookup.entries()).map(([name, id]) => ({ id, name }));
          this.domainOptions.set(options);
        });
      }
    });
  }

  ngOnInit(): void {
    this.values.set({ ...this.currentValues() });
  }

  onFilterChange(key: string, value: unknown): void {
    const updated = { ...this.values(), [key]: value };
    this.values.set(updated);
    this.filtersChanged.emit(updated);
  }

  onToggle(key: string): void {
    const current = this.values()[key];
    const updated = { ...this.values(), [key]: !current };
    this.values.set(updated);
    this.filtersChanged.emit(updated);
  }

  onClearFilters(): void {
    this.values.set({});
    this.filtersChanged.emit({});
  }

  getValues(): Record<string, unknown> {
    return this.values();
  }

  getDynamicOptions(source: string | undefined): { id: number; name: string }[] {
    if (source === 'expansions') return this.expansionOptions();
    if (source === 'classes') return this.classOptions();
    if (source === 'domains') return this.domainOptions();
    return [];
  }

  isToggleActive(key: string): boolean {
    return !!this.values()[key];
  }

  getSelectValue(key: string): string {
    const val = this.values()[key];
    return val !== undefined && val !== null ? String(val) : '';
  }
}
