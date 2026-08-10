import { ITEMS_NEW_PATH, ITEM_KINDS, isItemKind, itemEditPath } from './item-routes.utils';

describe('ITEMS_NEW_PATH', () => {
  it('is absolute, so router.navigate and routerLink agree on it', () => {
    expect(ITEMS_NEW_PATH).toBe('/items/new');
  });
});

describe('itemEditPath', () => {
  it('puts the kind ahead of the id, because ids collide across the three tables', () => {
    expect(itemEditPath('weapon', 7)).toBe('/items/weapon/7/edit');
    expect(itemEditPath('armor', 7)).toBe('/items/armor/7/edit');
    expect(itemEditPath('loot', 7)).toBe('/items/loot/7/edit');
  });

  it('produces a four-segment path, which cannot collide with /items/new', () => {
    expect(itemEditPath('loot', 1).split('/').filter(Boolean)).toHaveLength(4);
    expect(ITEMS_NEW_PATH.split('/').filter(Boolean)).toHaveLength(2);
  });
});

describe('isItemKind', () => {
  it('accepts each of the three kinds', () => {
    expect(ITEM_KINDS.every(isItemKind)).toBe(true);
  });

  it('rejects anything else a user might type into the address bar', () => {
    expect(isItemKind('sandwich')).toBe(false);
    expect(isItemKind('Weapon')).toBe(false);
    expect(isItemKind('')).toBe(false);
  });

  it('rejects a missing segment', () => {
    expect(isItemKind(null)).toBe(false);
  });
});
