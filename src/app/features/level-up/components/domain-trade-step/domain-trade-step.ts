import { Component, input, output, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CardSelectionGrid } from '../../../../shared/components/card-selection-grid/card-selection-grid';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { DomainService } from '../../../../shared/services/domain.service';
import { DomainCardTradeRequest, TradeDisplayPair } from '../../models/level-up-api.model';
import { DomainCardSummary } from '../../../character-sheet/models/character-sheet-view.model';

export interface TradeRow {
  tradedOut: DomainCardSummary[];
  tradedIn: CardData[];
  equipTradedIn: number[];
}

@Component({
  selector: 'app-domain-trade-step',
  imports: [CardSelectionGrid],
  templateUrl: './domain-trade-step.html',
  styleUrl: './domain-trade-step.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DomainTradeStep implements OnInit {
  private readonly domainService = inject(DomainService);

  readonly characterDomainCards = input.required<DomainCardSummary[]>();
  readonly accessibleDomainIds = input.required<number[]>();
  readonly domainCardLevelCap = input.required<number | null>();
  readonly newDomainCards = input<CardData[]>([]);
  readonly ownedDomainCardIds = input<number[]>([]);
  readonly targetLevel = input<number | null>(null);
  readonly initialTradeRow = input<TradeRow | null>(null);
  readonly initialSkipped = input<boolean>(false);

  readonly tradesChanged = output<DomainCardTradeRequest[]>();
  readonly tradeDisplayChanged = output<TradeDisplayPair[]>();
  readonly tradeRowChanged = output<TradeRow | null>();
  readonly tradesSkippedChanged = output<boolean>();

  readonly trade = signal<TradeRow>({ tradedOut: [], tradedIn: [], equipTradedIn: [] });
  readonly tradableCards = signal<CardData[]>([]);
  readonly tradableCardsLoading = signal(false);
  readonly skipped = signal(false);

  readonly filteredTradableCards = computed(() => {
    const excludeIds = new Set(this.newDomainCards().map(c => c.id));
    if (excludeIds.size === 0) return this.tradableCards();
    return this.tradableCards().filter(c => !excludeIds.has(c.id));
  });

  ngOnInit(): void {
    if (this.initialSkipped()) {
      this.skipped.set(true);
    } else {
      const initial = this.initialTradeRow();
      if (initial) {
        this.trade.set(initial);
      }
    }
    this.loadTradableCards();
  }

  onSkip(): void {
    this.skipped.set(true);
    this.trade.set({ tradedOut: [], tradedIn: [], equipTradedIn: [] });
    this.tradesChanged.emit([]);
    this.tradeDisplayChanged.emit([]);
    this.tradeRowChanged.emit(null);
    this.tradesSkippedChanged.emit(true);
  }

  onToggleTradeOut(card: DomainCardSummary): void {
    this.trade.update(row => {
      const idx = row.tradedOut.findIndex(c => c.id === card.id);
      if (idx >= 0) {
        return { ...row, tradedOut: row.tradedOut.filter(c => c.id !== card.id) };
      }
      return { ...row, tradedOut: [...row.tradedOut, card] };
    });
    this.emitTrades();
  }

  onTradeInSelected(cards: CardData[]): void {
    this.trade.update(row => ({ ...row, tradedIn: cards }));
    this.emitTrades();
  }

  onToggleEquipTradeIn(cardId: number): void {
    this.trade.update(row => {
      const idx = row.equipTradedIn.indexOf(cardId);
      if (idx >= 0) {
        return { ...row, equipTradedIn: row.equipTradedIn.filter(id => id !== cardId) };
      }
      return { ...row, equipTradedIn: [...row.equipTradedIn, cardId] };
    });
    this.emitTrades();
  }

  isCardInTradeOut(trade: TradeRow, card: DomainCardSummary): boolean {
    return trade.tradedOut.some(c => c.id === card.id);
  }

  isCardTradedOut(card: DomainCardSummary): boolean {
    return this.trade().tradedOut.some(c => c.id === card.id);
  }

  isEquipChecked(trade: TradeRow, cardId: number): boolean {
    return trade.equipTradedIn.includes(cardId);
  }

  isTradeValid(trade: TradeRow): boolean {
    return trade.tradedOut.length > 0 && trade.tradedOut.length === trade.tradedIn.length;
  }

  get availableForTradeOut(): DomainCardSummary[] {
    const tradedOutIds = new Set(this.trade().tradedOut.map(c => c.id));
    const newCardIds = new Set(this.newDomainCards().map(c => c.id));
    return this.characterDomainCards().filter(c => !tradedOutIds.has(c.id) && !newCardIds.has(c.id));
  }

  private emitTrades(): void {
    const t = this.trade();
    this.tradeRowChanged.emit(t);
    if (this.isTradeValid(t)) {
      this.tradesChanged.emit([{
        tradeOutCardIds: t.tradedOut.map(c => c.id),
        tradeInCardIds: t.tradedIn.map(c => c.id),
        equipTradedInCardIds: t.equipTradedIn,
      }]);
      this.tradeDisplayChanged.emit(
        t.tradedOut.map((out, i) => ({
          gaveUpName: out.name,
          receivedName: t.tradedIn[i]?.name ?? '',
        }))
      );
    } else {
      this.tradesChanged.emit([]);
      this.tradeDisplayChanged.emit([]);
    }
  }

  private loadTradableCards(): void {
    const domainIds = this.accessibleDomainIds();
    if (domainIds.length === 0) return;

    const cap = this.domainCardLevelCap();
    const target = this.targetLevel();
    const effectiveCap = cap != null && target != null ? Math.min(cap, target) : (cap ?? target);
    const levels = effectiveCap ? Array.from({ length: effectiveCap }, (_, i) => i + 1) : undefined;
    const owned = new Set(this.ownedDomainCardIds());

    this.tradableCardsLoading.set(true);
    this.domainService.getDomainCards(domainIds, 0, 100, levels).subscribe({
      next: cards => {
        this.tradableCards.set(cards.filter(c => !owned.has(c.id)));
        this.tradableCardsLoading.set(false);
      },
      error: () => this.tradableCardsLoading.set(false),
    });
  }
}
