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

  readonly allMockCards: CardData[] = [
    ...MOCK_CLASS_CARDS,
    ...MOCK_SUBCLASS_CARDS,
    ...MOCK_HERITAGE_CARDS,
    ...MOCK_COMMUNITY_CARDS,
    ...MOCK_ANCESTRY_CARDS,
    ...MOCK_DOMAIN_CARDS,
  ];

  onTabSelected(tabId: TabId): void {
    this.activeTab.set(tabId);
  }

  onCardClicked(card: CardData): void {
    this.selectedCardId.set(
      this.selectedCardId() === card.id ? null : card.id
    );
  }

  isCardSelected(card: CardData): boolean {
    return this.selectedCardId() === card.id;
  }
}
