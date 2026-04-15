import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { DisplayStat, ModifierSource } from '../../models/character-sheet-view.model';

@Component({
  selector: 'app-modifier-indicator',
  templateUrl: './modifier-indicator.html',
  styleUrl: './modifier-indicator.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModifierIndicator {
  readonly stat = input.required<DisplayStat>();
  readonly statLabel = input.required<string>();

  readonly hasModifier = computed(() => this.stat().hasModifier);

  readonly ariaLabel = computed(() => {
    const s = this.stat();
    const label = this.statLabel();
    const sources = s.modifierSources
      .map(src => `${this.formatOp(src.operation, src.value)} from ${src.sourceName}`)
      .join(', ');
    return `${label}: ${s.modified}, modified from base ${s.base} by ${sources}`;
  });

  formatOp(operation: ModifierSource['operation'], value: number): string {
    if (operation === 'ADD') return value >= 0 ? `+${value}` : `${value}`;
    if (operation === 'MULTIPLY') return `×${value}`;
    return `= ${value}`;
  }
}
