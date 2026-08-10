import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ItemKind } from '../../../../shared/utils/item-routes.utils';
import { ITEM_KIND_LABELS } from '../../models/item-form-value.model';

/**
 * What each kind actually asks the author for. Shown under the label so the choice can be made
 * without first picking one to see which fields appear.
 */
export const ITEM_KIND_BLURBS: Record<ItemKind, string> = {
  weapon: 'Damage dice, range, and the trait you roll.',
  armor: 'Armor Score and the two damage thresholds.',
  loot: 'Gear, consumables, and curiosities.',
};

export interface ItemKindOption {
  kind: ItemKind;
  label: string;
  blurb: string;
}

export const ITEM_KIND_OPTIONS: ItemKindOption[] = (
  Object.keys(ITEM_KIND_LABELS) as ItemKind[]
).map(kind => ({ kind, label: ITEM_KIND_LABELS[kind], blurb: ITEM_KIND_BLURBS[kind] }));

/**
 * The item form's opening move: which of the three kinds is being made.
 *
 * A rack of cards rather than a `<select>`, because the kind is a branch and not a field -- it
 * decides which half of the form exists, and the three kinds are three separate tables with
 * separate endpoints. Each carries its own `--color-card-*` accent, which the form lifts onto its
 * host so the rest of the page inherits it.
 *
 * When the host already knows the kind (the character sheet's create modal, and every edit, where
 * the URL fixes it) the rack collapses to a single static chip in the same slot. That keeps the
 * modal and the routed page structurally identical instead of giving them different first rows.
 */
@Component({
  selector: 'app-item-kind-rack',
  imports: [NgTemplateOutlet],
  templateUrl: './item-kind-rack.html',
  styleUrl: './item-kind-rack.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemKindRack {
  readonly kind = input.required<ItemKind>();
  /** Renders the static chip instead of the picker. The kind is then the caller's to change. */
  readonly locked = input<boolean>(false);
  /**
   * Radio-group name. Document-wide, so a page holding two item forms must give each its own or
   * the two racks share one selection.
   */
  readonly name = input<string>('item-kind');

  readonly kindChange = output<ItemKind>();

  readonly options = ITEM_KIND_OPTIONS;

  readonly selectedLabel = computed(() => ITEM_KIND_LABELS[this.kind()]);
  readonly selectedBlurb = computed(() => ITEM_KIND_BLURBS[this.kind()]);

  onSelect(kind: ItemKind): void {
    if (kind === this.kind()) return;
    this.kindChange.emit(kind);
  }
}
