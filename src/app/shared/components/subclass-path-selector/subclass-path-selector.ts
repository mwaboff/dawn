import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DaggerheartCard } from '../daggerheart-card/daggerheart-card';
import { CardData } from '../daggerheart-card/daggerheart-card.model';
import { SubclassLevel } from '../../models/subclass-api.model';

type CardUpgradeState = 'owned' | 'next' | 'locked' | 'normal';

interface SubclassPath {
  pathId: number;
  pathName: string;
  foundation: CardData;
  specialization?: CardData;
  mastery?: CardData;
}

@Component({
  selector: 'app-subclass-path-selector',
  imports: [DaggerheartCard],
  templateUrl: './subclass-path-selector.html',
  styleUrl: './subclass-path-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubclassPathSelector {
  readonly cards = input.required<CardData[]>();
  readonly selectedCard = input<CardData>();
  readonly collapsibleFeatures = input<boolean>(false);
  readonly ownedCardIds = input<number[]>([]);
  readonly foundationOnly = input<boolean>(false);
  readonly cardSelected = output<CardData>();

  private readonly pathLevelTabs = signal<Map<number, SubclassLevel>>(new Map());

  readonly subclassPaths = computed(() => {
    const cards = this.cards();
    const pathMap = new Map<number, { foundation?: CardData; specialization?: CardData; mastery?: CardData }>();

    for (const card of cards) {
      const pathId = card.metadata?.['subclassPathId'] as number;
      const level = card.metadata?.['level'] as string;
      if (!pathMap.has(pathId)) pathMap.set(pathId, {});
      const path = pathMap.get(pathId)!;

      if (level === 'FOUNDATION') path.foundation = card;
      else if (level === 'SPECIALIZATION') path.specialization = card;
      else if (level === 'MASTERY') path.mastery = card;
    }

    return Array.from(pathMap.entries())
      .filter(([, p]) => p.foundation)
      .map(([pathId, p]) => ({
        pathId,
        pathName: p.foundation!.name,
        foundation: p.foundation!,
        specialization: p.specialization,
        mastery: p.mastery,
      }));
  });

  private readonly cardStateMap = computed(() => {
    const ownedIds = new Set(this.ownedCardIds());
    const states = new Map<number, CardUpgradeState>();

    if (this.foundationOnly() && ownedIds.size === 0) {
      for (const path of this.subclassPaths()) {
        states.set(path.foundation.id, 'normal');
        if (path.specialization) states.set(path.specialization.id, 'locked');
        if (path.mastery) states.set(path.mastery.id, 'locked');
      }
      return states;
    }

    if (ownedIds.size === 0) return states;

    for (const path of this.subclassPaths()) {
      const cards: (CardData | undefined)[] = [path.foundation, path.specialization, path.mastery];
      let foundNext = false;

      for (const card of cards) {
        if (!card) continue;
        if (ownedIds.has(card.id)) {
          states.set(card.id, 'owned');
        } else if (!foundNext) {
          states.set(card.id, 'next');
          foundNext = true;
        } else {
          states.set(card.id, 'locked');
        }
      }
    }

    return states;
  });

  get isUpgradeMode(): boolean {
    return this.ownedCardIds().length > 0;
  }

  getCardState(cardId: number): CardUpgradeState {
    return this.cardStateMap().get(cardId) ?? 'normal';
  }

  getTabState(path: SubclassPath, level: SubclassLevel): CardUpgradeState {
    const card = this.getPathCardForLevel(path, level);
    return card ? this.getCardState(card.id) : 'normal';
  }

  getPathLevelTab(pathId: number): SubclassLevel {
    const explicit = this.pathLevelTabs().get(pathId);
    if (explicit) return explicit;

    if (this.isUpgradeMode) {
      const path = this.subclassPaths().find(p => p.pathId === pathId);
      if (path) {
        const levels: [SubclassLevel, CardData | undefined][] = [
          ['FOUNDATION', path.foundation],
          ['SPECIALIZATION', path.specialization],
          ['MASTERY', path.mastery],
        ];
        for (const [level, card] of levels) {
          if (card && this.getCardState(card.id) === 'next') return level;
        }
      }
    }

    return 'FOUNDATION';
  }

  setPathLevelTab(pathId: number, level: SubclassLevel): void {
    const updated = new Map(this.pathLevelTabs());
    updated.set(pathId, level);
    this.pathLevelTabs.set(updated);
  }

  getPathCardForLevel(path: SubclassPath, level: SubclassLevel): CardData | undefined {
    if (level === 'FOUNDATION') return path.foundation;
    if (level === 'SPECIALIZATION') return path.specialization;
    if (level === 'MASTERY') return path.mastery;
    return undefined;
  }

  onCardClicked(path: SubclassPath, card: CardData): void {
    if (this.isUpgradeMode) {
      if (this.getCardState(card.id) === 'next') {
        this.cardSelected.emit(card);
      }
      return;
    }
    if (this.foundationOnly() && this.getCardState(card.id) === 'locked') {
      return;
    }
    this.cardSelected.emit(path.foundation);
  }

  isActiveCardSelected(path: SubclassPath, activeCard: CardData): boolean {
    const selected = this.selectedCard();
    if (!selected) return false;
    return this.isUpgradeMode ? selected.id === activeCard.id : selected.id === path.foundation.id;
  }
}
