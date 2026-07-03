import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';

export type CreateItemType = 'weapon' | 'armor' | 'loot';

export interface ItemTypeOption {
  type: CreateItemType;
  label: string;
  description: string;
  glyph: string;
}

export const ITEM_TYPE_OPTIONS: ItemTypeOption[] = [
  { type: 'weapon', label: 'Weapon', description: 'A melee or ranged weapon with damage and traits.', glyph: '⚔' },
  { type: 'armor', label: 'Armor', description: 'Armor with base score and damage thresholds.', glyph: '⛨' },
  { type: 'loot', label: 'Loot', description: 'Consumables, utility items, and other gear.', glyph: '◈' },
];

@Component({
  selector: 'app-item-type-selector',
  templateUrl: './item-type-selector.html',
  styleUrl: './item-type-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemTypeSelector {
  readonly typeSelected = output<CreateItemType>();

  readonly options = ITEM_TYPE_OPTIONS;
  readonly focusedIndex = signal(0);

  select(type: CreateItemType): void {
    this.typeSelected.emit(type);
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveFocus((index + 1) % this.options.length);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveFocus((index - 1 + this.options.length) % this.options.length);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.select(this.options[index].type);
    }
  }

  private moveFocus(index: number): void {
    this.focusedIndex.set(index);
    const el = document.getElementById(`item-type-option-${this.options[index].type}`);
    el?.focus();
  }
}
