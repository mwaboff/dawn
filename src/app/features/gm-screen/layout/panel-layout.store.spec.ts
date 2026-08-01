import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { createPanelLayoutStore } from './panel-layout.store';
import { GmPanelDef } from '../models/gm-panel.model';

function panel(id: string, defaultOrder: number, extra: Partial<GmPanelDef> = {}): GmPanelDef {
  return {
    id,
    title: id,
    category: 'Combat',
    colSpan: 1,
    defaultOrder,
    body: { kind: 'static', blocks: [] },
    ...extra,
  };
}

const A = panel('a', 10);
const B = panel('b', 20);
const C = panel('c', 30);

const ORDER_KEY = 'oh-sheet:gm-screen-order';
const COLLAPSED_KEY = 'oh-sheet:gm-screen-collapsed';

function makeStore(panels: readonly GmPanelDef[] = [A, B, C], isBrowser = true) {
  return createPanelLayoutStore({ storageKey: 'gm-screen', panels: signal(panels), isBrowser });
}

describe('createPanelLayoutStore', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('derives the key names from the storageKey', () => {
    makeStore().move(0, 1);
    expect(localStorage.getItem(ORDER_KEY)).toBe('["b","a","c"]');

    const campaign = createPanelLayoutStore({
      storageKey: 'gm-screen-campaign',
      panels: signal([A, B]),
      isBrowser: true,
    });
    campaign.move(0, 1);
    expect(localStorage.getItem('oh-sheet:gm-screen-campaign-order')).toBe('["b","a"]');
  });

  it('orders by defaultOrder when nothing is stored', () => {
    const store = makeStore([C, A, B]);
    expect(store.orderedPanels().map(p => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('prefers the stored order', () => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(['c', 'a', 'b']));
    expect(makeStore().orderedPanels().map(p => p.id)).toEqual(['c', 'a', 'b']);
  });

  it('prunes stored ids that no longer exist', () => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(['c', 'gone', 'a', 'b']));
    expect(makeStore().orderedPanels().map(p => p.id)).toEqual(['c', 'a', 'b']);
  });

  it('slots a newly shipped panel in by defaultOrder instead of appending', () => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(['a', 'b', 'c']));
    const fresh = panel('b2', 25);
    expect(makeStore([A, B, fresh, C]).orderedPanels().map(p => p.id)).toEqual([
      'a',
      'b',
      'b2',
      'c',
    ]);
  });

  it('falls back to defaults on corrupt JSON without throwing', () => {
    localStorage.setItem(ORDER_KEY, '{not json');
    localStorage.setItem(COLLAPSED_KEY, '"a string"');
    let store!: ReturnType<typeof makeStore>;
    expect(() => (store = makeStore())).not.toThrow();
    expect(store.orderedPanels().map(p => p.id)).toEqual(['a', 'b', 'c']);
    expect([...store.collapsed()]).toEqual([]);
  });

  it('move reorders and persists the full id list', () => {
    const store = makeStore();
    store.move(2, 0);
    expect(store.orderedPanels().map(p => p.id)).toEqual(['c', 'a', 'b']);
    expect(JSON.parse(localStorage.getItem(ORDER_KEY)!)).toEqual(['c', 'a', 'b']);
  });

  it('move ignores out-of-range and no-op indices', () => {
    const store = makeStore();
    store.move(0, 0);
    store.move(-1, 1);
    store.move(0, 9);
    expect(localStorage.getItem(ORDER_KEY)).toBeNull();
  });

  it('seeds collapsed state from defaultCollapsed until something is stored', () => {
    const store = makeStore([A, panel('b', 20, { defaultCollapsed: true })]);
    expect([...store.collapsed()]).toEqual(['b']);

    store.toggleCollapsed('a');
    expect([...store.collapsed()].sort()).toEqual(['a', 'b']);
    expect(JSON.parse(localStorage.getItem(COLLAPSED_KEY)!).sort()).toEqual(['a', 'b']);
  });

  it('toggleCollapsed removes an already collapsed id', () => {
    const store = makeStore();
    store.toggleCollapsed('a');
    store.toggleCollapsed('a');
    expect([...store.collapsed()]).toEqual([]);
  });

  it('setAllCollapsed collapses or expands every panel', () => {
    const store = makeStore();
    store.setAllCollapsed(true);
    expect([...store.collapsed()]).toEqual(['a', 'b', 'c']);
    store.setAllCollapsed(false);
    expect([...store.collapsed()]).toEqual([]);
  });

  it('reset clears both keys and returns to defaults', () => {
    const store = makeStore();
    store.move(2, 0);
    store.toggleCollapsed('a');
    store.reset();
    expect(store.orderedPanels().map(p => p.id)).toEqual(['a', 'b', 'c']);
    expect(localStorage.getItem(ORDER_KEY)).toBeNull();
    expect(localStorage.getItem(COLLAPSED_KEY)).toBeNull();
  });

  it('never touches localStorage when isBrowser is false', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');

    const store = makeStore([A, B, C], false);
    store.move(0, 1);
    store.toggleCollapsed('a');
    store.setAllCollapsed(true);
    store.reset();

    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    // The layout still works in memory, it just does not survive a reload.
    expect(store.orderedPanels().map(p => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('survives a localStorage that throws on write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    const store = makeStore();
    expect(() => store.move(0, 1)).not.toThrow();
    expect(store.orderedPanels().map(p => p.id)).toEqual(['b', 'a', 'c']);
  });
});
