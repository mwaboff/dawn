import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { TabNav } from './components/tab-nav/tab-nav';
import { CharacterForm } from './components/character-form/character-form';
import { CHARACTER_TABS, TabId } from './models/create-character.model';

@Component({
  selector: 'app-create-character',
  imports: [TabNav, CharacterForm],
  templateUrl: './create-character.html',
  styleUrl: './create-character.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCharacter {
  readonly tabs = CHARACTER_TABS;
  readonly activeTab = signal<TabId>('class');

  onTabSelected(tabId: TabId): void {
    this.activeTab.set(tabId);
  }
}
