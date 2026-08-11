import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { EntityCard } from '../../../../shared/components/entity-card/entity-card';
import { InventoryTab, InventoryTabs } from '../../../../shared/components/inventory-tabs/inventory-tabs';
import { CustomizeItemAction } from '../../../../shared/components/customize-item-action/customize-item-action';
import { MappedSearchResult } from '../../../../shared/mappers/search-result.mapper';
import { SearchableEntityType } from '../../../../shared/models/search.model';
import { ArmorDisplay, LootDisplay, WeaponDisplay } from '../../../character-sheet/models/character-sheet-view.model';
import { ItemFinder } from '../item-finder/item-finder';
import { CatalogItem } from '../../utils/catalog-card.mapper';
import {
  InventoryEditEvent,
  InventoryEquipArmorEvent,
  InventoryEquipWeaponEvent,
  InventoryRemoveEvent,
} from '../../../character-sheet/components/inventory-section/inventory-section';
import { WeaponEquipConstraints } from '../../../character-sheet/utils/inventory-equip.utils';
import {
  InventoryCardEntry,
  InventoryEquipAction,
  InventoryEquipState,
  InventoryItemType,
  armorCardEntry,
  lootCardEntry,
  weaponCardEntry,
} from '../../utils/inventory-card.mapper';

/**
 * The beta inventory: the same three tabs and the same events as the classic `InventorySection`,
 * with each item drawn as the shared `EntityCard` the rest of the beta sheet already uses instead
 * of a bespoke equipment row.
 *
 * The template renders one flat list, not a branch per tab -- `inventory-card.mapper.ts` resolves a
 * weapon, an armor and a piece of loot into the same `InventoryCardEntry` shape, so the equip
 * buttons, the edit affordance and the reason a remove is blocked are decided there and this
 * component only wires the clicks back out. Every output matches `InventorySection`'s, so the sheet
 * keeps its existing handlers.
 *
 * Adding is where beta diverges: the classic `InventoryAddPanel` searches one type at a time and
 * takes that type from whichever tab is open, so a player has to file a find before they can look
 * for it. Beta opens `ItemFinder` instead -- one field over all three types -- and the tabs are
 * left to do the one job they are good at, which is reading gear you already own.
 */
@Component({
  selector: 'app-inventory-section-beta',
  templateUrl: './inventory-section-beta.html',
  styleUrl: './inventory-section-beta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EntityCard, InventoryTabs, ItemFinder, CustomizeItemAction],
})
export class InventorySectionBeta {
  readonly weapons = input.required<WeaponDisplay[]>();
  readonly armors = input.required<ArmorDisplay[]>();
  readonly items = input.required<LootDisplay[]>();
  readonly isOwner = input.required<boolean>();
  readonly activePrimaryWeapon = input<WeaponDisplay | null>(null);
  readonly activeSecondaryWeapon = input<WeaponDisplay | null>(null);
  readonly activeArmor = input<ArmorDisplay | null>(null);
  readonly weaponConstraints = input<WeaponEquipConstraints | null>(null);
  readonly canEquipArmorSlot = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);
  /** The viewer, so a card can tell whether the homebrew on it is theirs to edit. */
  readonly currentUserId = input<number | null>(null);
  /** This character's proficiency, so the finder shows weapon damage as this character rolls it. */
  readonly proficiency = input(1);

  readonly addItem = output<{ type: 'weapon' | 'armor' | 'loot'; item: unknown }>();
  readonly createItem = output<'weapon' | 'armor' | 'loot'>();
  readonly removeItem = output<InventoryRemoveEvent>();
  readonly editItem = output<InventoryEditEvent>();
  readonly equipWeapon = output<InventoryEquipWeaponEvent>();
  readonly unequipWeapon = output<{ slot: 'primary' | 'secondary' }>();
  readonly equipArmor = output<InventoryEquipArmorEvent>();
  readonly unequipArmor = output<void>();
  readonly dismissError = output<void>();

  readonly activeTab = signal<InventoryTab>('weapons');
  readonly finderOpen = signal(false);
  readonly confirmingRemoveEntryId = signal<number | null>(null);

  readonly tabCounts = computed<Record<InventoryTab, number>>(() => ({
    weapons: this.weapons().length,
    armor: this.armors().length,
    loot: this.items().length,
  }));

  private readonly equipState = computed<InventoryEquipState>(() => ({
    activePrimaryWeapon: this.activePrimaryWeapon(),
    activeSecondaryWeapon: this.activeSecondaryWeapon(),
    activeArmor: this.activeArmor(),
    weaponConstraints: this.weaponConstraints(),
    canEquipArmorSlot: this.canEquipArmorSlot(),
  }));

  readonly entries = computed<InventoryCardEntry[]>(() => {
    const viewer = this.currentUserId();
    switch (this.activeTab()) {
      case 'weapons':
        return this.weapons().map(weapon => weaponCardEntry(weapon, this.equipState(), viewer));
      case 'armor':
        return this.armors().map(armor => armorCardEntry(armor, this.equipState(), viewer));
      case 'loot':
        return this.items().map(loot => lootCardEntry(loot, viewer));
    }
  });

  /** Written per tab rather than derived: "No armor in inventory" reads better than a template. */
  readonly emptyText = computed(() => {
    switch (this.activeTab()) {
      case 'weapons': return 'No weapons in inventory. Add one to get started.';
      case 'armor': return 'No armor in inventory. Add some to get started.';
      case 'loot': return 'No loot in inventory. Add some to get started.';
    }
  });

  /**
   * Only one card can be confirming at a time, so a single `viewChild` reaches whichever confirm
   * button is currently rendered. Focus has to be moved deliberately: the `@if` swap destroys the
   * Remove button the user just activated, and a destroyed element takes focus to `<body>` with it.
   */
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');
  private readonly injector = inject(Injector);

  constructor() {
    effect(() => this.confirmButton()?.nativeElement.focus());
  }

  /** Ids are qualified by type as well as entry id -- a weapon and a loot entry can share one. */
  private entryKey(entry: InventoryCardEntry): string {
    return `${entry.type}-${entry.inventoryEntryId}`;
  }

  promptId(entry: InventoryCardEntry): string {
    return `inv-confirm-${this.entryKey(entry)}`;
  }

  removeButtonId(entry: InventoryCardEntry): string {
    return `inv-remove-${this.entryKey(entry)}`;
  }

  hintId(entry: InventoryCardEntry): string {
    return `inv-remove-hint-${this.entryKey(entry)}`;
  }

  equipHintId(entry: InventoryCardEntry, action: InventoryEquipAction): string {
    return `inv-equip-hint-${this.entryKey(entry)}-${action.kind}`;
  }

  /**
   * `CustomizeItemAction` takes a `MappedSearchResult` (the codex's shape); an inventory entry
   * only needs to fill in `type`/`id`/`name` for the Copy action to work -- it deliberately carries
   * no `card`, so this component's own Edit button never appears here (this card already has one,
   * a few lines up).
   */
  customizeResultFor(entry: InventoryCardEntry): MappedSearchResult {
    return {
      type: entry.type.toUpperCase() as SearchableEntityType,
      id: entry.itemId,
      name: entry.name,
      relevanceScore: null,
    };
  }

  selectTab(tab: InventoryTab): void {
    this.activeTab.set(tab);
    this.confirmingRemoveEntryId.set(null);
  }

  openFinder(): void {
    this.finderOpen.set(true);
  }

  /**
   * The finder stays open so a player can add a handful of things in one visit, but the tab behind
   * it follows what they picked -- closing the dialog onto the Weapons tab after adding a rope
   * looks like the add silently failed.
   */
  onItemAdded(event: { type: InventoryItemType; item: CatalogItem }): void {
    this.addItem.emit(event);
    this.activeTab.set(event.type === 'weapon' ? 'weapons' : event.type);
  }

  onFinderClosed(): void {
    this.finderOpen.set(false);
  }

  /** Closes the finder first: the item form is a modal too, and two at once trap focus in a fight. */
  onCreateRequested(type: InventoryItemType): void {
    this.finderOpen.set(false);
    this.createItem.emit(type);
  }

  onRemoveClicked(entry: InventoryCardEntry): void {
    // The button stays focusable while blocked (see the template), so the guard lives here.
    if (entry.removeBlockedReason !== null) return;
    this.confirmingRemoveEntryId.set(entry.inventoryEntryId);
  }

  onRemoveConfirmed(entry: InventoryCardEntry): void {
    this.confirmingRemoveEntryId.set(null);
    this.removeItem.emit({ type: entry.type, inventoryEntryId: entry.inventoryEntryId });
  }

  onRemoveCancelled(entry: InventoryCardEntry): void {
    this.confirmingRemoveEntryId.set(null);
    // Hands focus back to the Remove button the confirm replaced. By id rather than by element
    // reference: the original button was destroyed by the swap, so this is a different node.
    this.focusAfterRender(this.removeButtonId(entry));
  }

  private focusAfterRender(elementId: string): void {
    afterNextRender(() => document.getElementById(elementId)?.focus(), { injector: this.injector });
  }

  /** Carries the catalogue id, not the inventory entry id -- the editor edits the item itself. */
  onEditClicked(entry: InventoryCardEntry): void {
    this.editItem.emit({ type: entry.type, itemId: entry.itemId });
  }

  onEquipAction(entry: InventoryCardEntry, action: InventoryEquipAction): void {
    if (action.disabled) return;
    switch (action.kind) {
      case 'equip-primary':
        this.equipWeapon.emit({ weaponId: entry.itemId, inventoryEntryId: entry.inventoryEntryId, slot: 'primary' });
        return;
      case 'equip-secondary':
        this.equipWeapon.emit({ weaponId: entry.itemId, inventoryEntryId: entry.inventoryEntryId, slot: 'secondary' });
        return;
      case 'equip-armor':
        this.equipArmor.emit({ armorId: entry.itemId, inventoryEntryId: entry.inventoryEntryId });
        return;
      case 'unequip':
        if (entry.type === 'armor') this.unequipArmor.emit();
        else this.unequipWeapon.emit({ slot: entry.equippedWeaponSlot ?? 'primary' });
    }
  }

  onDismissError(): void {
    this.dismissError.emit();
  }
}
