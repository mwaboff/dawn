import { ArmorResponse, CreateCustomArmorRequest } from '../../../shared/models/armor-api.model';
import { CreateCustomLootRequest, LootApiResponse } from '../../../shared/models/loot-api.model';
import { WeaponResponse } from '../../../shared/models/weapon-api.model';
import { DEFAULT_ITEM_FORM_VALUE, ItemFormValue } from '../models/item-form-value.model';
import {
  armorToFormValue,
  formValueToRequest,
  lootToFormValue,
  responseToFormValue,
  weaponToFormValue,
} from './item-builder.mapper';

function buildWeapon(overrides: Partial<WeaponResponse> = {}): WeaponResponse {
  return {
    id: 1,
    name: 'Hearthblade',
    expansionId: null,
    tier: 2,
    isOfficial: false,
    isPublic: false,
    isPrimary: true,
    trait: 'FINESSE',
    range: 'CLOSE',
    burden: 'TWO_HANDED',
    damage: { diceCount: 1, diceType: 'D10', modifier: 6, damageType: 'MAGIC', notation: '1d10+6' },
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function buildArmor(overrides: Partial<ArmorResponse> = {}): ArmorResponse {
  return {
    id: 2,
    name: 'Ringmail',
    expansionId: null,
    tier: 1,
    isOfficial: false,
    isPublic: false,
    baseMajorThreshold: 5,
    baseSevereThreshold: 11,
    baseScore: 4,
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function formValue(overrides: Partial<ItemFormValue> = {}): ItemFormValue {
  return { ...DEFAULT_ITEM_FORM_VALUE, name: 'Thing', ...overrides };
}

describe('weaponToFormValue', () => {
  it('flattens the nested damage block onto the form value', () => {
    const value = weaponToFormValue(buildWeapon());

    expect(value.diceType).toBe('D10');
    expect(value.modifier).toBe(6);
    expect(value.damageType).toBe('MAGIC');
  });

  it('carries the identifying weapon fields across', () => {
    const value = weaponToFormValue(buildWeapon());

    expect(value).toMatchObject({
      kind: 'weapon',
      name: 'Hearthblade',
      tier: 2,
      isPrimary: true,
      trait: 'FINESSE',
      range: 'CLOSE',
      burden: 'TWO_HANDED',
    });
  });

  it('treats a null damage modifier as zero', () => {
    const weapon = buildWeapon();
    weapon.damage.modifier = null;

    expect(weaponToFormValue(weapon).modifier).toBe(0);
  });

  it('defaults absent campaign tags to an empty list', () => {
    expect(weaponToFormValue(buildWeapon()).campaignIds).toEqual([]);
  });

  it('keeps campaign tags when the response carries them', () => {
    expect(weaponToFormValue(buildWeapon({ campaignIds: [3, 9] })).campaignIds).toEqual([3, 9]);
  });

  it('converts features, dropping the sourcebook they came from', () => {
    const value = weaponToFormValue(buildWeapon({
      features: [{
        id: 11,
        name: 'Reliable',
        description: '+1 to attack rolls',
        featureType: 'ITEM',
        expansionId: 4,
        costTagIds: [],
        costTags: [{ id: 1, label: 'Once per rest', category: 'LIMITATION' }],
        modifierIds: [],
        modifiers: [{ id: 2, target: 'ATTACK_ROLL', operation: 'ADD', value: 1 }],
      }],
    }));

    expect(value.features).toEqual([{
      name: 'Reliable',
      description: '+1 to attack rolls',
      featureType: 'ITEM',
      expansionId: null,
      costTags: [{ label: 'Once per rest', category: 'LIMITATION' }],
      modifiers: [{ target: 'ATTACK_ROLL', operation: 'ADD', value: 1 }],
    }]);
  });

  it('yields an empty feature list when the response has none', () => {
    expect(weaponToFormValue(buildWeapon()).features).toEqual([]);
  });
});

describe('armorToFormValue', () => {
  it('carries the armor stat block across', () => {
    expect(armorToFormValue(buildArmor())).toMatchObject({
      kind: 'armor',
      name: 'Ringmail',
      tier: 1,
      baseScore: 4,
      baseMajorThreshold: 5,
      baseSevereThreshold: 11,
    });
  });
});

describe('lootToFormValue', () => {
  it('carries the loot fields across', () => {
    const value = lootToFormValue({
      id: 3,
      name: 'Bloodstone',
      description: 'Hums when blood is spilled.',
      tier: 3,
      isConsumable: true,
    });

    expect(value).toMatchObject({
      kind: 'loot',
      name: 'Bloodstone',
      description: 'Hums when blood is spilled.',
      tier: 3,
      isConsumable: true,
    });
  });

  it('falls back to the default tier when loot carries none', () => {
    const loot: LootApiResponse = { id: 3, name: 'Trinket' };

    expect(lootToFormValue(loot).tier).toBe(DEFAULT_ITEM_FORM_VALUE.tier);
  });

  it('types loot features as ITEM, since the wire carries no feature type', () => {
    const value = lootToFormValue({ id: 3, name: 'Trinket', features: [{ name: 'Glows' }] });

    expect(value.features).toEqual([{
      name: 'Glows',
      description: '',
      featureType: 'ITEM',
      expansionId: null,
      costTags: [],
      modifiers: [],
    }]);
  });
});

describe('responseToFormValue', () => {
  it('dispatches on kind rather than on the response shape', () => {
    expect(responseToFormValue('weapon', buildWeapon()).kind).toBe('weapon');
    expect(responseToFormValue('armor', buildArmor()).kind).toBe('armor');
    expect(responseToFormValue('loot', { id: 1, name: 'x' }).kind).toBe('loot');
  });
});

describe('formValueToRequest', () => {
  it('nests weapon damage and never sends a dice count', () => {
    const request = formValueToRequest(formValue({
      kind: 'weapon',
      diceType: 'D12',
      modifier: 9,
      damageType: 'PHYSICAL',
    }));

    expect(request).toMatchObject({ damage: { diceType: 'D12', modifier: 9, damageType: 'PHYSICAL' } });
    expect('diceCount' in (request as { damage: object }).damage).toBe(false);
  });

  it('never sends an expansion or an official flag for any kind', () => {
    for (const kind of ['weapon', 'armor', 'loot'] as const) {
      const request = formValueToRequest(formValue({ kind })) as unknown as Record<string, unknown>;
      expect(request['expansionId']).toBeUndefined();
      expect(request['isOfficial']).toBeUndefined();
    }
  });

  it('trims the name', () => {
    expect(formValueToRequest(formValue({ name: '  Spare Dagger  ' })).name).toBe('Spare Dagger');
  });

  it('sends only the armor fields for armor', () => {
    const request = formValueToRequest(formValue({
      kind: 'armor',
      baseScore: 6,
      baseMajorThreshold: 7,
      baseSevereThreshold: 15,
    })) as unknown as CreateCustomArmorRequest & Record<string, unknown>;

    expect(request).toMatchObject({ baseScore: 6, baseMajorThreshold: 7, baseSevereThreshold: 15 });
    expect(request['damage']).toBeUndefined();
    expect(request['isConsumable']).toBeUndefined();
  });

  it('sends only the loot fields for loot', () => {
    const request = formValueToRequest(formValue({
      kind: 'loot',
      isConsumable: true,
      description: 'One use.',
    })) as unknown as CreateCustomLootRequest & Record<string, unknown>;

    expect(request).toMatchObject({ isConsumable: true, description: 'One use.' });
    expect(request['damage']).toBeUndefined();
    expect(request['baseScore']).toBeUndefined();
  });

  it('passes campaign tags and the public flag straight through', () => {
    const request = formValueToRequest(formValue({ campaignIds: [1, 2], isPublic: true }));

    expect(request.campaignIds).toEqual([1, 2]);
    expect(request.isPublic).toBe(true);
  });

  it('round-trips a weapon through both mappers unchanged', () => {
    const original = buildWeapon({ campaignIds: [5] });
    const request = formValueToRequest(weaponToFormValue(original));

    expect(request).toMatchObject({
      name: 'Hearthblade',
      tier: 2,
      campaignIds: [5],
      isPrimary: true,
      trait: 'FINESSE',
      range: 'CLOSE',
      burden: 'TWO_HANDED',
      damage: { diceType: 'D10', modifier: 6, damageType: 'MAGIC' },
    });
  });
});
