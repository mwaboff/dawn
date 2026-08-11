import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DaggerheartCard } from '../daggerheart-card/daggerheart-card';
import { EntityCard } from '../entity-card/entity-card';
import { CardData } from '../daggerheart-card/daggerheart-card.model';
import { EntityCardData } from '../entity-card/entity-card.model';
import { cardDataToEntityCard } from '../../mappers/card-data-to-entity-card.mapper';
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
  imports: [DaggerheartCard, EntityCard],
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
  /**
   * `'classic'` (default) keeps today's exact `DaggerheartCard`-based rendering, unchanged.
   * `'beta'` renders the active card as an `EntityCard` instead, with a dedicated select control
   * projected into `[card-controls]` in place of the whole card being clickable -- `EntityCard`'s
   * header is already a button (expand/collapse), so unlike `DaggerheartCard` the card itself
   * cannot double as the click target. Upgrade-mode/`foundationOnly` locking behaves identically in
   * both modes; only the card face and the selection affordance differ.
   */
  readonly cardFormat = input<'classic' | 'beta'>('classic');
  /**
   * Suppresses the beta-mode Select control -- for a pure browse/display surface (the reference
   * tab) that binds no `selectedCard` and handles no `cardSelected`, a "Select" button would be
   * dead UI wired to nothing. Has no effect on `cardFormat="classic"`, which never reads this
   * input at all -- classic stays byte-identical regardless.
   *
   * Owned/Locked status text is a separate question from the Select control: once `ownedCardIds`
   * is actually passed there IS a real "you already have this" concept worth stating even in a
   * read-only view, so those two states still render their status text (see `showControls`). A
   * card merely locked by `foundationOnly` with no `ownedCardIds` -- i.e. no real owned/upgrade
   * context at all -- renders no status text here; only `EntityCard`'s own `muted` dimming marks
   * it, which is all a bare browse page with no owned concept should say.
   */
  readonly readOnly = input<boolean>(false);
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

  entityCard(card: CardData): EntityCardData {
    return cardDataToEntityCard(card);
  }

  /**
   * Whether clicking `card` would actually select it -- the same guard `onCardClicked` applies,
   * exposed separately so beta mode can decide whether to render a Select control at all instead
   * of relying on a click silently doing nothing.
   */
  isCardSelectable(path: SubclassPath, card: CardData): boolean {
    if (this.isUpgradeMode) return this.getCardState(card.id) === 'next';
    if (this.foundationOnly()) return this.getCardState(card.id) !== 'locked';
    return true;
  }

  selectLabel(path: SubclassPath, card: CardData): string {
    return this.isActiveCardSelected(path, card) ? `${card.name} selected` : `Select ${card.name}`;
  }

  /**
   * Whether beta mode has anything at all to project into `[card-controls]` for `card`. The
   * template omits the whole projected element rather than rendering it with no content when this
   * is `false`, so `EntityCard`'s own `.entity-card__controls:empty` rule collapses the footer
   * entirely instead of showing a bare padded, bordered box with nothing in it.
   */
  showControls(path: SubclassPath, card: CardData): boolean {
    const state = this.getCardState(card.id);
    if (state === 'owned') return true;
    if (!this.readOnly() && this.isCardSelectable(path, card)) return true;
    // Unrestricted outside read-only mode (unchanged from before `readOnly` existed) -- the
    // restriction to "only once ownedCardIds is real" is a read-only-mode-only rule.
    if (state === 'locked') return !this.readOnly() || this.isUpgradeMode;
    return false;
  }
}
