import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DaggerheartCard } from '../../../../shared/components/daggerheart-card/daggerheart-card';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { SubclassLevel } from '../../models/subclass-api.model';

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

  getPathLevelTab(pathId: number): SubclassLevel {
    return this.pathLevelTabs().get(pathId) ?? 'FOUNDATION';
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

  isCardSelected(card: CardData): boolean {
    return this.selectedCard()?.id === card.id;
  }
}
