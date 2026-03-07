import { Component, signal, computed, output, input, effect, ChangeDetectionStrategy } from '@angular/core';

import {
  TRAITS,
  TraitInfo,
  TRAIT_VALUE_POOL,
  TraitAssignments,
  TraitKey,
  INITIAL_ASSIGNMENTS,
} from '../../models/trait.model';

@Component({
  selector: 'app-trait-selector',
  templateUrl: './trait-selector.html',
  styleUrl: './trait-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraitSelector {
  readonly initialAssignments = input<TraitAssignments | null>(null);
  readonly traitsChanged = output<TraitAssignments>();

  readonly traits: TraitInfo[] = TRAITS;

  private readonly assignments = signal<TraitAssignments>({ ...INITIAL_ASSIGNMENTS });

  constructor() {
    effect(() => {
      const initial = this.initialAssignments();
      if (initial) {
        this.assignments.set(initial);
      }
    });
  }

  readonly traitAssignments = this.assignments.asReadonly();

  readonly isComplete = computed(() =>
    Object.values(this.assignments()).every((v) => v !== null),
  );

  readonly hasAnyAssignment = computed(() =>
    Object.values(this.assignments()).some((v) => v !== null),
  );

  readonly availableValues = computed(() => {
    const pool = [...TRAIT_VALUE_POOL];
    for (const val of Object.values(this.assignments())) {
      if (val !== null) {
        const idx = pool.indexOf(val);
        if (idx !== -1) pool.splice(idx, 1);
      }
    }
    return pool;
  });

  getAssignment(key: TraitKey): number | null {
    return this.assignments()[key];
  }

  formatValue(v: number | null): string {
    if (v === null) return '\u2014';
    return v > 0 ? `+${v}` : `${v}`;
  }

  onSelectChange(event: Event, key: TraitKey): void {
    const val = (event.target as HTMLSelectElement).value;
    this.updateAssignment(key, val === '' ? null : parseInt(val, 10));
  }

  clearAll(): void {
    this.assignments.set({ ...INITIAL_ASSIGNMENTS });
    this.emitChange();
  }

  getSelectableValues(key: TraitKey): number[] {
    const available = this.availableValues();
    const current = this.assignments()[key];
    const all = current !== null ? [...available, current] : [...available];
    return all.sort((a, b) => b - a);
  }

  private updateAssignment(key: TraitKey, value: number | null): void {
    if (value !== null) {
      const available = this.availableValues();
      const current = this.assignments()[key];
      const checkPool = current !== null ? [...available, current] : available;
      if (!checkPool.includes(value)) return;
    }
    this.assignments.set({ ...this.assignments(), [key]: value });
    this.emitChange();
  }

  private emitChange(): void {
    this.traitsChanged.emit(this.assignments());
  }
}
