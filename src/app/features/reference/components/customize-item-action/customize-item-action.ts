import { Component, ChangeDetectionStrategy, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { WeaponService } from '../../../../shared/services/weapon.service';
import { ArmorService } from '../../../../shared/services/armor.service';
import { LootService } from '../../../../shared/services/loot.service';
import { MappedSearchResult } from '../../../../shared/mappers/search-result.mapper';
import { SearchableEntityType } from '../../../../shared/models/search.model';
import { ItemKind, itemEditPath } from '../../../items/item-routes';

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
 * Offers "Customize this item" on a codex weapon/armor/loot card: copies the item to the signed-in
 * user, then drops them into the builder on the copy.
 *
 * Reflavouring a printed statline is the primary customisation path the rules describe, so this
 * is offered on official content too -- the copy belongs to the user and the original is untouched,
 * so there is nothing to gate beyond being signed in. The codex itself is browsable anonymously
 * (`authSessionGuard` only redirects users who have not picked a username), hence the login check.
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

  readonly copying = signal(false);
  readonly copyFailed = signal(false);

  private readonly itemKind = computed(() => CUSTOMIZABLE_TYPES[this.result().type] ?? null);
  readonly canCustomize = computed(() => this.itemKind() !== null && this.authService.isLoggedIn());

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
