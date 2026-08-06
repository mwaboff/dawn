import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { ArmorResponse } from '../../shared/models/armor-api.model';
import { LootApiResponse } from '../../shared/models/loot-api.model';
import { WeaponResponse } from '../../shared/models/weapon-api.model';
import { ArmorService } from '../../shared/services/armor.service';
import { LootService } from '../../shared/services/loot.service';
import { WeaponService } from '../../shared/services/weapon.service';
import { CreateItemRequest, ItemSubmit, UpdateItemRequest } from './item-submit';

describe('ItemSubmit', () => {
  let itemSubmit: ItemSubmit;
  let weaponService: WeaponService;
  let armorService: ArmorService;
  let lootService: LootService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    itemSubmit = TestBed.inject(ItemSubmit);
    weaponService = TestBed.inject(WeaponService);
    armorService = TestBed.inject(ArmorService);
    lootService = TestBed.inject(LootService);
  });

  describe('load', () => {
    it('reads a weapon from the weapon service', () => {
      const spy = vi.spyOn(weaponService, 'getWeaponById').mockReturnValue(of({} as WeaponResponse));
      itemSubmit.load('weapon', 7).subscribe();

      expect(spy).toHaveBeenCalledWith(7);
    });

    it('reads armor from the armor service', () => {
      const spy = vi.spyOn(armorService, 'getArmorById').mockReturnValue(of({} as ArmorResponse));
      itemSubmit.load('armor', 7).subscribe();

      expect(spy).toHaveBeenCalledWith(7);
    });

    it('reads loot from the loot service', () => {
      const spy = vi.spyOn(lootService, 'getLootById').mockReturnValue(of({} as LootApiResponse));
      itemSubmit.load('loot', 7).subscribe();

      expect(spy).toHaveBeenCalledWith(7);
    });

    it('does not consult the other two services', () => {
      vi.spyOn(weaponService, 'getWeaponById').mockReturnValue(of({} as WeaponResponse));
      const armorSpy = vi.spyOn(armorService, 'getArmorById');
      const lootSpy = vi.spyOn(lootService, 'getLootById');

      itemSubmit.load('weapon', 7).subscribe();

      expect(armorSpy).not.toHaveBeenCalled();
      expect(lootSpy).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const request = { name: 'Thing', tier: 1 } as CreateItemRequest;

    it('posts a weapon to the weapon service custom endpoint', () => {
      const spy = vi.spyOn(weaponService, 'createCustomWeapon').mockReturnValue(of({} as WeaponResponse));
      itemSubmit.create('weapon', request).subscribe();

      expect(spy).toHaveBeenCalledWith(request);
    });

    it('posts armor to the armor service custom endpoint', () => {
      const spy = vi.spyOn(armorService, 'createCustomArmor').mockReturnValue(of({} as ArmorResponse));
      itemSubmit.create('armor', request).subscribe();

      expect(spy).toHaveBeenCalledWith(request);
    });

    it('posts loot to the loot service custom endpoint', () => {
      const spy = vi.spyOn(lootService, 'createCustomLoot').mockReturnValue(of({} as LootApiResponse));
      itemSubmit.create('loot', request).subscribe();

      expect(spy).toHaveBeenCalledWith(request);
    });
  });

  describe('update', () => {
    const request = { name: 'Renamed' } as UpdateItemRequest;

    it('updates a weapon through the weapon service', () => {
      const spy = vi.spyOn(weaponService, 'updateWeapon').mockReturnValue(of({} as WeaponResponse));
      itemSubmit.update('weapon', 7, request).subscribe();

      expect(spy).toHaveBeenCalledWith(7, request);
    });

    it('updates armor through the armor service', () => {
      const spy = vi.spyOn(armorService, 'updateArmor').mockReturnValue(of({} as ArmorResponse));
      itemSubmit.update('armor', 7, request).subscribe();

      expect(spy).toHaveBeenCalledWith(7, request);
    });

    it('updates loot through the loot service', () => {
      const spy = vi.spyOn(lootService, 'updateLoot').mockReturnValue(of({} as LootApiResponse));
      itemSubmit.update('loot', 7, request).subscribe();

      expect(spy).toHaveBeenCalledWith(7, request);
    });
  });
});
