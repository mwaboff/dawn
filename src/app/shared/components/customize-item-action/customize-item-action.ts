import { Component, ChangeDetectionStrategy, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { WeaponService } from '../../services/weapon.service';
import { ArmorService } from '../../services/armor.service';
import { LootService } from '../../services/loot.service';
import { MappedSearchResult } from '../../mappers/search-result.mapper';
import { SearchableEntityType } from '../../models/search.model';
import { ItemKind, itemEditPath } from '../../utils/item-routes.utils';
import { canEditItem } from '../../utils/item-ownership.utils';

/**
 * The codex result types that map onto an editable item table. Every other type resolves to
 * `null` here, which is how a single unconditional `<app-customize-item-action>` at each call
 * site stays quiet on adversary, domain-card, and class results.
 */
const CUSTOMIZABLE_TYPES: Partial<Record<SearchableEntityType, ItemKind>> = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  LOOT: 'loot',
};

/**
 * The two ways to manage a weapon/armor/loot card, wherever one is shown -- the codex/reference
 * catalogue and the character sheet's inventory: copy it to make an editable variant of your own
 * (offered on every item, official or not -- the copy belongs to you and the original is
 * untouched), or, if you are the item's own author, edit it directly instead of spawning a second
 * copy.
 *
 * `shared/` rather than a single feature -- this was `features/reference/`-only until beta's
 * `EntityCard` surfaces (beta reference, beta inventory) needed the same "copy this"/"edit this"
 * pair as an icon action-row pair.
 *
 * `variant` selects which rendering entirely, not just a style tweak:
 * - `'classic'` (default): the original, unchanged full-text "Customize this item" button,
 *   rendered as a block below the card. Classic `DaggerheartCard`/`EquipmentCard` cards have no
 *   action-row concept to dock into -- that's an `EntityCard` (beta) feature -- so classic keeps
 *   exactly the pre-existing behaviour: no Edit button here even for your own homebrew (classic's
 *   card rows that already have their own dedicated edit affordance, e.g. `inventory-item-row`'s
 *   `.edit-btn`, keep using that unchanged).
 * - `'beta'`: glyph-only icon buttons (a copy icon, plus a pencil Edit icon when `canEdit()`) sized
 *   for `EntityCard`'s `[card-controls]` action row, using the shared `.card-swap-btn`/
 *   `.card-swap-btn--icon` classes (`shared/styles/entity-card-actions.css`) so they sit flush with
 *   Equip/Remove.
 */
@Component({
  selector: 'app-customize-item-action',
  templateUrl: './customize-item-action.html',
  styleUrl: './customize-item-action.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomizeItemAction {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly weaponService = inject(WeaponService);
  private readonly armorService = inject(ArmorService);
  private readonly lootService = inject(LootService);
  private readonly authService = inject(AuthService);

  readonly result = input.required<MappedSearchResult>();
  readonly variant = input<'classic' | 'beta'>('classic');

  readonly copying = signal(false);
  readonly copyFailed = signal(false);

  private readonly itemKind = computed(() => CUSTOMIZABLE_TYPES[this.result().type] ?? null);
  readonly canCustomize = computed(() => this.itemKind() !== null && this.authService.isLoggedIn());

  /**
   * Only true when the result carries a `card` with `metadata.createdByUserId` -- the reference/
   * codex pipeline populates this (see the weapon/armor/loot mappers). Beta inventory builds a
   * lightweight `result` with no `card` (`InventorySectionBeta.customizeResultFor`) and so never
   * trips this -- it already has its own, separately-tested Edit button. Also gated behind
   * `variant() === 'beta'` in the template: classic never shows an Edit button regardless of this
   * value, by design (see the class doc comment).
   */
  readonly canEdit = computed(() => {
    if (!this.canCustomize()) return false;
    const createdByUserId = this.result().card?.metadata?.['createdByUserId'] as number | null | undefined;
    return canEditItem({ createdByUserId }, this.authService.user()?.id ?? null);
  });

  /**
   * Shared between the icon button's `aria-label` and its `title` tooltip (beta only) -- an
   * icon-only button's accessible name and its sighted-user tooltip should say the same thing, not
   * drift into two descriptions of the same control.
   */
  readonly copyLabel = computed(() =>
    this.copying() ? `Copying ${this.result().name}…` : `Customize ${this.result().name}`,
  );

  readonly editLabel = computed(() => `Edit ${this.result().name}, a custom item you created`);

  onCustomize(): void {
    const kind = this.itemKind();
    if (kind === null || this.copying()) return;

    this.copying.set(true);
    this.copyFailed.set(false);
    this.copyItem(kind, this.result().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (copy) => {
          this.copying.set(false);
          this.router.navigate([itemEditPath(kind, copy.id)]);
        },
        error: () => {
          this.copying.set(false);
          this.copyFailed.set(true);
        },
      });
  }

  onEdit(): void {
    const kind = this.itemKind();
    if (kind === null) return;
    this.router.navigate([itemEditPath(kind, this.result().id)]);
  }

  /** The three tables have separate endpoints, so the copy call cannot be shared. */
  private copyItem(kind: ItemKind, id: number): Observable<{ id: number }> {
    switch (kind) {
      case 'weapon':
        return this.weaponService.copyWeapon(id);
      case 'armor':
        return this.armorService.copyArmor(id);
      case 'loot':
        return this.lootService.copyLoot(id);
    }
  }
}
