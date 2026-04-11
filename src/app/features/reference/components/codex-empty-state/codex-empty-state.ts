import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { SearchableEntityType, typeLabels } from '../../models/search.model';

export type CodexEmptyVariant = 'search' | 'browse';

@Component({
  selector: 'app-codex-empty-state',
  templateUrl: './codex-empty-state.html',
  styleUrl: './codex-empty-state.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodexEmptyState {
  readonly variant = input.required<CodexEmptyVariant>();
  readonly query = input<string>('');
  readonly type = input<SearchableEntityType | null>(null);
  readonly hasActiveFilters = input<boolean>(false);

  readonly clearFilters = output<void>();

  readonly message = computed<string>(() => {
    if (this.variant() === 'search') {
      return `The archives fall silent. No matches for "${this.query()}".`;
    }
    const t = this.type();
    const label = t ? (typeLabels[t] ?? t) : 'results';
    return `No ${label.toLowerCase()} match these filters.`;
  });

  onClearFilters(): void {
    this.clearFilters.emit();
  }
}
