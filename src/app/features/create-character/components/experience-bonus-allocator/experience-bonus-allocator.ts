import { Component, ChangeDetectionStrategy, computed, effect, input, output, signal } from '@angular/core';

import { Experience } from '../../models/experience.model';

@Component({
  selector: 'app-experience-bonus-allocator',
  templateUrl: './experience-bonus-allocator.html',
  styleUrl: './experience-bonus-allocator.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceBonusAllocator {
  readonly experiences = input.required<Experience[]>();
  readonly totalBonus = input.required<number>();
  readonly initialAllocations = input<number[]>();
  readonly allocationsChanged = output<number[]>();

  private readonly allocations = signal<number[]>([]);

  readonly allocationList = this.allocations.asReadonly();

  readonly used = computed(() => this.allocations().reduce((s, n) => s + n, 0));
  readonly remaining = computed(() => this.totalBonus() - this.used());
  readonly isComplete = computed(() => this.remaining() === 0);

  constructor() {
    effect(() => {
      const exps = this.experiences();
      const initial = this.initialAllocations();
      const current = this.allocations();
      if (current.length === exps.length) return;
      const next = exps.map((_, i) => initial?.[i] ?? 0);
      this.allocations.set(next);
    });
  }

  effectiveModifier(index: number): number {
    return (this.experiences()[index]?.modifier ?? 0) + (this.allocations()[index] ?? 0);
  }

  canIncrement(): boolean {
    return this.remaining() > 0;
  }

  canDecrement(index: number): boolean {
    return (this.allocations()[index] ?? 0) > 0;
  }

  onIncrement(index: number): void {
    if (!this.canIncrement()) return;
    const updated = this.allocations().map((v, i) => (i === index ? v + 1 : v));
    this.allocations.set(updated);
    this.allocationsChanged.emit(updated);
  }

  onDecrement(index: number): void {
    if (!this.canDecrement(index)) return;
    const updated = this.allocations().map((v, i) => (i === index ? v - 1 : v));
    this.allocations.set(updated);
    this.allocationsChanged.emit(updated);
  }

  formatModifier(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }
}
