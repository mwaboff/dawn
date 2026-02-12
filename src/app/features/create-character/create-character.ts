import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { TabNav } from './components/tab-nav/tab-nav';
import { CharacterForm } from './components/character-form/character-form';
import { DaggerheartCard } from '../../shared/components/daggerheart-card/daggerheart-card';
import { CHARACTER_TABS, CharacterSelections, TabId } from './models/create-character.model';
import { CardData } from '../../shared/components/daggerheart-card/daggerheart-card.model';
import {
  MOCK_CLASS_CARDS,
  MOCK_SUBCLASS_CARDS,
  MOCK_HERITAGE_CARDS,
  MOCK_COMMUNITY_CARDS,
  MOCK_ANCESTRY_CARDS,
  MOCK_DOMAIN_CARDS,
} from '../../shared/components/daggerheart-card/daggerheart-card.mock-data';

@Component({
  selector: 'app-create-character',
  imports: [TabNav, CharacterForm, DaggerheartCard],
  templateUrl: './create-character.html',
  styleUrl: './create-character.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCharacter {
  readonly tabs = CHARACTER_TABS;
  readonly activeTab = signal<TabId>('class');
  private readonly selectedCards = signal<Partial<Record<TabId, CardData>>>({});
  private readonly completedStepsSignal = signal<Set<TabId>>(new Set());

  readonly completedSteps = this.completedStepsSignal.asReadonly();

  readonly characterSelections = computed<CharacterSelections>(() => {
    const cards = this.selectedCards();
    return {
      class: cards['class']?.name,
      subclass: cards['subclass']?.name,
      ancestry: cards['ancestry']?.name,
      community: cards['community']?.name,
    };
  });

  readonly allMockCards: CardData[] = [
    ...MOCK_CLASS_CARDS,
    ...MOCK_SUBCLASS_CARDS,
    ...MOCK_HERITAGE_CARDS,
    ...MOCK_COMMUNITY_CARDS,
    ...MOCK_ANCESTRY_CARDS,
    ...MOCK_DOMAIN_CARDS,
  ];

  onTabSelected(tabId: TabId): void {
    if (this.isTabReachable(tabId)) {
      this.activeTab.set(tabId);
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
      this.selectedCards.set({ ...cards, [currentTab]: card });
      this.markStepComplete(currentTab);
    }
  }

  isCardSelected(card: CardData): boolean {
    return Object.values(this.selectedCards()).some((selected) => selected?.id === card.id);
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

    // Remove this step and all subsequent steps
    for (let i = tabIndex; i < this.tabs.length; i++) {
      updatedSteps.delete(this.tabs[i].id);
      delete updatedCards[this.tabs[i].id];
    }

    this.completedStepsSignal.set(updatedSteps);
    this.selectedCards.set(updatedCards);
  }

  private isTabReachable(tabId: TabId): boolean {
    const targetIndex = this.tabs.findIndex((t) => t.id === tabId);
    const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTab());

    // Always allow backward navigation
    if (targetIndex <= currentIndex) return true;

    // Forward: all steps before the target must be completed
    for (let i = 0; i < targetIndex; i++) {
      if (!this.completedStepsSignal().has(this.tabs[i].id)) return false;
    }
    return true;
  }
}
