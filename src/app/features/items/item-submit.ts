import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ArmorService } from '../../shared/services/armor.service';
import { LootService } from '../../shared/services/loot.service';
import { WeaponService } from '../../shared/services/weapon.service';
import {
  ArmorResponse,
  CreateCustomArmorRequest,
  UpdateArmorRequest,
} from '../../shared/models/armor-api.model';
import {
  CreateCustomLootRequest,
  LootApiResponse,
  UpdateLootRequest,
} from '../../shared/models/loot-api.model';
import {
  CreateCustomWeaponRequest,
  UpdateWeaponRequest,
  WeaponResponse,
} from '../../shared/models/weapon-api.model';
import { ItemKind } from './item-routes';

export type ItemResponse = WeaponResponse | ArmorResponse | LootApiResponse;

export type CreateItemRequest =
  | CreateCustomWeaponRequest
  | CreateCustomArmorRequest
  | CreateCustomLootRequest;

export type UpdateItemRequest = UpdateWeaponRequest | UpdateArmorRequest | UpdateLootRequest;

/**
 * Routes one item operation to whichever of the three catalogues owns it.
 *
 * Deliberately not a fourth `item.service.ts`: weapons, armor, and loot are three separate tables
 * with three separate endpoints and three existing services. This only picks between them, so the
 * builder can stay free of `switch (kind)` and the request casts stay in one place.
 *
 * The casts below are safe because `item-builder.mapper.ts` builds the payload from the same kind
 * that is passed here -- the pairing is enforced there, and TypeScript cannot see across the two.
 */
@Injectable({ providedIn: 'root' })
export class ItemSubmit {
  private readonly weaponService = inject(WeaponService);
  private readonly armorService = inject(ArmorService);
  private readonly lootService = inject(LootService);

  load(kind: ItemKind, id: number): Observable<ItemResponse> {
    switch (kind) {
      case 'weapon':
        return this.weaponService.getWeaponById(id);
      case 'armor':
        return this.armorService.getArmorById(id);
      case 'loot':
        return this.lootService.getLootById(id);
    }
  }

  create(kind: ItemKind, request: CreateItemRequest): Observable<ItemResponse> {
    switch (kind) {
      case 'weapon':
        return this.weaponService.createCustomWeapon(request as CreateCustomWeaponRequest);
      case 'armor':
        return this.armorService.createCustomArmor(request as CreateCustomArmorRequest);
      case 'loot':
        return this.lootService.createCustomLoot(request as CreateCustomLootRequest);
    }
  }

  update(kind: ItemKind, id: number, request: UpdateItemRequest): Observable<ItemResponse> {
    switch (kind) {
      case 'weapon':
        return this.weaponService.updateWeapon(id, request as UpdateWeaponRequest);
      case 'armor':
        return this.armorService.updateArmor(id, request as UpdateArmorRequest);
      case 'loot':
        return this.lootService.updateLoot(id, request as UpdateLootRequest);
    }
  }

  /** Server-side copy into a new private, unofficial record owned by the caller. */
  copy(kind: ItemKind, id: number): Observable<ItemResponse> {
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
