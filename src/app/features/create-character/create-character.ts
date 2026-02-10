import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { TabNav } from './components/tab-nav/tab-nav';
import { CharacterForm } from './components/character-form/character-form';
import { DaggerheartCard } from '../../shared/components/daggerheart-card/daggerheart-card';
import { CHARACTER_TABS, TabId } from './models/create-character.model';
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
  private readonly selectedCardId = signal<number | null>(null);
  private readonly completedStepsSignal = signal<Set<TabId>>(new Set());

  readonly completedSteps = this.completedStepsSignal.asReadonly();

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
    const currentSelection = this.selectedCardId();
    const isDeselecting = currentSelection === card.id;

    this.selectedCardId.set(isDeselecting ? null : card.id);

    if (isDeselecting) {
      // Deselecting: invalidate current step and all subsequent steps
      this.invalidateFromStep(this.activeTab());
    } else {
      // Selecting: mark current step as complete
      this.markStepComplete(this.activeTab());
    }
  }

  isCardSelected(card: CardData): boolean {
    return this.selectedCardId() === card.id;
  }

  private markStepComplete(tabId: TabId): void {
    const updated = new Set(this.completedStepsSignal());
    updated.add(tabId);
    this.completedStepsSignal.set(updated);
  }

  private invalidateFromStep(tabId: TabId): void {
    const tabIndex = this.tabs.findIndex((t) => t.id === tabId);
    const updated = new Set(this.completedStepsSignal());

    // Remove this step and all subsequent steps
    for (let i = tabIndex; i < this.tabs.length; i++) {
      updated.delete(this.tabs[i].id);
    }

    this.completedStepsSignal.set(updated);
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
