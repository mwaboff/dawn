import { Component, signal, computed, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';

import { TabNav } from './components/tab-nav/tab-nav';
import { CharacterForm } from './components/character-form/character-form';
import { DaggerheartCard } from '../../shared/components/daggerheart-card/daggerheart-card';
import { CardSkeleton } from '../../shared/components/card-skeleton/card-skeleton';
import { CardError } from '../../shared/components/card-error/card-error';
import { CHARACTER_TABS, CharacterSelections, TabId } from './models/create-character.model';
import { CardData } from '../../shared/components/daggerheart-card/daggerheart-card.model';
import { ClassService } from './services/class.service';
import { SubclassService } from './services/subclass.service';
import { SubclassLevel } from './models/subclass-api.model';

@Component({
  selector: 'app-create-character',
  imports: [TabNav, CharacterForm, DaggerheartCard, CardSkeleton, CardError],
  templateUrl: './create-character.html',
  styleUrl: './create-character.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCharacter implements OnInit {
  private readonly classService = inject(ClassService);
  private readonly subclassService = inject(SubclassService);

  readonly tabs = CHARACTER_TABS;
  readonly activeTab = signal<TabId>('class');
  private readonly selectedCards = signal<Partial<Record<TabId, CardData>>>({});
  private readonly completedStepsSignal = signal<Set<TabId>>(new Set());

  readonly completedSteps = this.completedStepsSignal.asReadonly();

  readonly classCards = signal<CardData[]>([]);
  readonly classCardsLoading = signal(true);
  readonly classCardsError = signal(false);

  readonly subclassCards = signal<CardData[]>([]);
  readonly subclassCardsLoading = signal(false);
  readonly subclassCardsError = signal(false);
  private readonly pathLevelTabs = signal<Map<number, SubclassLevel>>(new Map());
  private lastLoadedClassId: number | null = null;

  readonly subclassPaths = computed(() => {
    const cards = this.subclassCards();
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

  readonly characterSelections = computed<CharacterSelections>(() => {
    const cards = this.selectedCards();
    return {
      class: cards['class']?.name,
      subclass: cards['subclass']?.name,
      ancestry: cards['ancestry']?.name,
      community: cards['community']?.name,
    };
  });

  ngOnInit(): void {
    this.loadClassCards();
  }

  onTabSelected(tabId: TabId): void {
    if (this.isTabReachable(tabId)) {
      this.activeTab.set(tabId);
      if (tabId === 'subclass') {
        this.loadSubclassCards();
      }
    }
  }

  onCardClicked(card: CardData): void {
    const currentTab = this.activeTab();
    const cards = this.selectedCards();
    const isDeselecting = cards[currentTab]?.id === card.id;

    if (isDeselecting) {
      const updated = { ...cards };
      delete updated[currentTab];
      this.selectedCards.set(updated);
      this.invalidateFromStep(currentTab);
    } else {
      const previousCard = cards[currentTab];
      this.selectedCards.set({ ...cards, [currentTab]: card });
      this.markStepComplete(currentTab);

      if (currentTab === 'class' && previousCard && previousCard.id !== card.id) {
        this.invalidateDownstreamOnly(currentTab);
      }
    }
  }

  getPathLevelTab(pathId: number): SubclassLevel {
    return this.pathLevelTabs().get(pathId) ?? 'FOUNDATION';
  }

  setPathLevelTab(pathId: number, level: SubclassLevel): void {
    const updated = new Map(this.pathLevelTabs());
    updated.set(pathId, level);
    this.pathLevelTabs.set(updated);
  }

  getPathCardForLevel(path: { foundation: CardData; specialization?: CardData; mastery?: CardData }, level: SubclassLevel): CardData | undefined {
    if (level === 'FOUNDATION') return path.foundation;
    if (level === 'SPECIALIZATION') return path.specialization;
    if (level === 'MASTERY') return path.mastery;
    return undefined;
  }

  isCardSelected(card: CardData): boolean {
    return Object.values(this.selectedCards()).some((selected) => selected?.id === card.id);
  }

  loadSubclassCards(): void {
    const classCard = this.selectedCards()['class'];
    if (!classCard) return;

    const classId = classCard.id;

    if (classId === this.lastLoadedClassId && this.subclassCards().length > 0) {
      return;
    }

    this.subclassCardsLoading.set(true);
    this.subclassCardsError.set(false);

    this.subclassService.getSubclasses(classId).subscribe({
      next: (cards) => {
        this.subclassCards.set(cards);
        this.subclassCardsLoading.set(false);
        this.lastLoadedClassId = classId;
      },
      error: () => {
        this.subclassCardsError.set(true);
        this.subclassCardsLoading.set(false);
      },
    });
  }

  private loadClassCards(): void {
    this.classCardsLoading.set(true);
    this.classCardsError.set(false);

    this.classService.getClasses().subscribe({
      next: (cards) => {
        this.classCards.set(cards);
        this.classCardsLoading.set(false);
      },
      error: () => {
        this.classCardsError.set(true);
        this.classCardsLoading.set(false);
      },
    });
  }

  private markStepComplete(tabId: TabId): void {
    const updated = new Set(this.completedStepsSignal());
    updated.add(tabId);
    this.completedStepsSignal.set(updated);
  }

  private invalidateFromStep(tabId: TabId): void {
    const tabIndex = this.tabs.findIndex((t) => t.id === tabId);
    const updatedSteps = new Set(this.completedStepsSignal());
    const updatedCards = { ...this.selectedCards() };

    for (let i = tabIndex; i < this.tabs.length; i++) {
      updatedSteps.delete(this.tabs[i].id);
      delete updatedCards[this.tabs[i].id];
    }

    this.completedStepsSignal.set(updatedSteps);
    this.selectedCards.set(updatedCards);
  }

  private invalidateDownstreamOnly(tabId: TabId): void {
    const tabIndex = this.tabs.findIndex((t) => t.id === tabId);
    const updatedSteps = new Set(this.completedStepsSignal());
    const updatedCards = { ...this.selectedCards() };

    for (let i = tabIndex + 1; i < this.tabs.length; i++) {
      updatedSteps.delete(this.tabs[i].id);
      delete updatedCards[this.tabs[i].id];
    }

    this.completedStepsSignal.set(updatedSteps);
    this.selectedCards.set(updatedCards);
  }

  private isTabReachable(tabId: TabId): boolean {
    const targetIndex = this.tabs.findIndex((t) => t.id === tabId);
    const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTab());

    if (targetIndex <= currentIndex) return true;

    for (let i = 0; i < targetIndex; i++) {
      if (!this.completedStepsSignal().has(this.tabs[i].id)) return false;
    }
    return true;
  }
}
