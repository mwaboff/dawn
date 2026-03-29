import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CardSummary, SubclassCardSummary, DomainCardSummary } from '../../models/character-sheet-view.model';
import { FormatTextPipe } from '../../../../shared/pipes/format-text.pipe';

export type CardType = 'subclass' | 'ancestry' | 'community' | 'domain';
export type AnyCardSummary = CardSummary | SubclassCardSummary | DomainCardSummary;

@Component({
  selector: 'app-expandable-card-list',
  templateUrl: './expandable-card-list.html',
  styleUrl: './expandable-card-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormatTextPipe],
})
export class ExpandableCardList {
  readonly heading = input.required<string>();
  readonly cards = input.required<AnyCardSummary[]>();
  readonly cardType = input.required<CardType>();
  readonly useGrid = input(false);

  readonly toggleCard = output<number>();

  private readonly expandedIds = signal<Set<number>>(new Set());

  isExpanded(id: number): boolean {
    return this.expandedIds().has(id);
  }

  onToggle(id: number): void {
    this.expandedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    this.toggleCard.emit(id);
  }

  isSubclassCard(card: AnyCardSummary): card is SubclassCardSummary {
    return this.cardType() === 'subclass';
  }

  isDomainCard(card: AnyCardSummary): card is DomainCardSummary {
    return this.cardType() === 'domain';
  }
}
