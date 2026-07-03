import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CreatedItemSummary, CreatedItemType } from '../../models/created-item.model';

interface ItemGroup {
  itemType: CreatedItemType;
  label: string;
  items: CreatedItemSummary[];
}

const GROUP_DEFS: { itemType: CreatedItemType; label: string }[] = [
  { itemType: 'weapon', label: 'Weapons' },
  { itemType: 'armor', label: 'Armor' },
  { itemType: 'loot', label: 'Loot' },
];

const TYPE_BADGES: Record<CreatedItemType, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  loot: 'Loot',
};

@Component({
  selector: 'app-item-roster',
  templateUrl: './item-roster.html',
  styleUrl: './item-roster.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class ItemRoster {
  readonly items = input.required<CreatedItemSummary[]>();
  readonly loading = input.required<boolean>();
  readonly error = input.required<boolean>();
  readonly canEdit = input(false);
  readonly creatorId = input<number | null>(null);

  readonly editItem = output<{ itemType: CreatedItemType; id: number }>();

  private readonly expandedKeys = signal<ReadonlySet<string>>(new Set());

  readonly groups = computed<ItemGroup[]>(() => {
    const items = this.items();
    return GROUP_DEFS
      .map(def => ({ ...def, items: items.filter(item => item.itemType === def.itemType) }))
      .filter(group => group.items.length > 0);
  });

  readonly codexQueryParams = computed(() => {
    const creatorId = this.creatorId();
    if (creatorId === null) return {};
    return { filters: JSON.stringify({ creatorId }) };
  });

  typeBadge(itemType: CreatedItemType): string {
    return TYPE_BADGES[itemType];
  }

  key(item: CreatedItemSummary): string {
    return `${item.itemType}-${item.id}`;
  }

  isExpanded(item: CreatedItemSummary): boolean {
    return this.expandedKeys().has(this.key(item));
  }

  toggleExpanded(item: CreatedItemSummary): void {
    const key = this.key(item);
    this.expandedKeys.update(keys => {
      const next = new Set(keys);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  onEditClick(event: Event, item: CreatedItemSummary): void {
    event.stopPropagation();
    this.editItem.emit({ itemType: item.itemType, id: item.id });
  }
}
