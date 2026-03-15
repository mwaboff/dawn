import { Component, input, output, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CardSelectionGrid } from '../../../../shared/components/card-selection-grid/card-selection-grid';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { DomainService } from '../../../../shared/services/domain.service';
import { DomainCardTradeRequest } from '../../models/level-up-api.model';
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
  readonly newDomainCard = input<CardData>();
  readonly initialTrades = input<DomainCardTradeRequest[]>([]);

  readonly tradesChanged = output<DomainCardTradeRequest[]>();

  readonly trades = signal<TradeRow[]>([]);
  readonly tradableCards = signal<CardData[]>([]);
  readonly tradableCardsLoading = signal(false);
  readonly skipped = signal(false);

  ngOnInit(): void {
    this.loadTradableCards();
  }

  onSkip(): void {
    this.skipped.set(true);
    this.trades.set([]);
    this.tradesChanged.emit([]);
  }

  onAddTrade(): void {
    this.skipped.set(false);
    this.trades.update(t => [...t, { tradedOut: [], tradedIn: [], equipTradedIn: [] }]);
  }

  onRemoveTrade(index: number): void {
    this.trades.update(t => t.filter((_, i) => i !== index));
    this.emitTrades();
  }

  onToggleTradeOut(tradeIndex: number, card: DomainCardSummary): void {
    this.trades.update(trades => {
      const updated = [...trades];
      const row = { ...updated[tradeIndex] };
      const idx = row.tradedOut.findIndex(c => c.id === card.id);
      if (idx >= 0) {
        row.tradedOut = row.tradedOut.filter(c => c.id !== card.id);
      } else {
        row.tradedOut = [...row.tradedOut, card];
      }
      updated[tradeIndex] = row;
      return updated;
    });
    this.emitTrades();
  }

  onTradeInSelected(tradeIndex: number, cards: CardData[]): void {
    this.trades.update(trades => {
      const updated = [...trades];
      updated[tradeIndex] = { ...updated[tradeIndex], tradedIn: cards };
      return updated;
    });
    this.emitTrades();
  }

  onToggleEquipTradeIn(tradeIndex: number, cardId: number): void {
    this.trades.update(trades => {
      const updated = [...trades];
      const row = { ...updated[tradeIndex] };
      const idx = row.equipTradedIn.indexOf(cardId);
      if (idx >= 0) {
        row.equipTradedIn = row.equipTradedIn.filter(id => id !== cardId);
      } else {
        row.equipTradedIn = [...row.equipTradedIn, cardId];
      }
      updated[tradeIndex] = row;
      return updated;
    });
    this.emitTrades();
  }

  isCardInTradeOut(trade: TradeRow, card: DomainCardSummary): boolean {
    return trade.tradedOut.some(c => c.id === card.id);
  }

  isCardTradedOut(card: DomainCardSummary): boolean {
    return this.trades().some(t => t.tradedOut.some(c => c.id === card.id));
  }

  isCardDisabledForTrade(trade: TradeRow, card: DomainCardSummary): boolean {
    return this.isCardTradedOut(card) && !this.isCardInTradeOut(trade, card);
  }

  isEquipChecked(trade: TradeRow, cardId: number): boolean {
    return trade.equipTradedIn.includes(cardId);
  }

  isTradeValid(trade: TradeRow): boolean {
    return trade.tradedOut.length > 0 && trade.tradedOut.length === trade.tradedIn.length;
  }

  get availableForTradeOut(): DomainCardSummary[] {
    const tradedOutIds = new Set(this.trades().flatMap(t => t.tradedOut.map(c => c.id)));
    const newCardId = this.newDomainCard()?.id;
    return this.characterDomainCards().filter(c => !tradedOutIds.has(c.id) && c.id !== newCardId);
  }

  private emitTrades(): void {
    const requests: DomainCardTradeRequest[] = this.trades()
      .filter(t => this.isTradeValid(t))
      .map(t => ({
        tradedOutDomainCardIds: t.tradedOut.map(c => c.id),
        tradedInDomainCardIds: t.tradedIn.map(c => c.id),
        equipTradedInCardIds: t.equipTradedIn,
      }));
    this.tradesChanged.emit(requests);
  }

  private loadTradableCards(): void {
    const domainIds = this.accessibleDomainIds();
    if (domainIds.length === 0) return;

    const cap = this.domainCardLevelCap();
    const levels = cap ? Array.from({ length: cap }, (_, i) => i + 1) : undefined;

    this.tradableCardsLoading.set(true);
    this.domainService.getDomainCards(domainIds, 0, 100, levels).subscribe({
      next: cards => { this.tradableCards.set(cards); this.tradableCardsLoading.set(false); },
      error: () => this.tradableCardsLoading.set(false),
    });
  }
}
