import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { WeaponDisplay, ArmorDisplay, LootDisplay } from '../../models/character-sheet-view.model';

@Component({
  selector: 'app-inventory-section',
  templateUrl: './inventory-section.html',
  styleUrl: './inventory-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventorySection {
  readonly weapons = input.required<WeaponDisplay[]>();
  readonly armors = input.required<ArmorDisplay[]>();
  readonly items = input.required<LootDisplay[]>();

  readonly activeTab = signal<'weapons' | 'armor' | 'loot'>('weapons');

  selectTab(tab: 'weapons' | 'armor' | 'loot'): void {
    this.activeTab.set(tab);
  }
}
