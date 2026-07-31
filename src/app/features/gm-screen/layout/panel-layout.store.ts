import { Signal, computed, signal } from '@angular/core';
import { GmPanelDef } from '../models/gm-panel.model';

const KEY_PREFIX = 'oh-sheet:';

export interface PanelLayoutStoreOptions {
  /** Middle part of the storage keys, e.g. `gm-screen` or `gm-screen-campaign`. */
  readonly storageKey: string;
  readonly panels: Signal<readonly GmPanelDef[]>;
  readonly isBrowser: boolean;
}

export interface PanelLayoutStore {
  /** Persisted order. Empty when nothing has been stored, which means "use `defaultOrder`". */
  readonly orderIds: Signal<readonly string[]>;
  readonly collapsed: Signal<ReadonlySet<string>>;
  readonly orderedPanels: Signal<readonly GmPanelDef[]>;
  move(fromIdx: number, toIdx: number): void;
  toggleCollapsed(id: string): void;
  setCollapsed(id: string, collapsed: boolean): void;
  setAllCollapsed(collapsed: boolean): void;
  reset(): void;
}

/**
 * Merges the user's stored order with the shipped panel list.
 *
 * Stored ids that no longer exist are dropped, and panels missing from storage are slotted in by
 * `defaultOrder` relative to the panels already placed rather than appended. Without that, every
 * panel added after a user's first visit would pile up at the bottom of their board forever.
 */
export function mergeOrder(
  panels: readonly GmPanelDef[],
  orderIds: readonly string[],
): readonly GmPanelDef[] {
  const byId = new Map(panels.map(p => [p.id, p]));
  const byDefault = [...panels].sort((a, b) => a.defaultOrder - b.defaultOrder);

  const seen = new Set<string>();
  const result: GmPanelDef[] = [];
  for (const id of orderIds) {
    const panel = byId.get(id);
    if (panel && !seen.has(id)) {
      seen.add(id);
      result.push(panel);
    }
  }
  if (result.length === 0) return byDefault;

  for (const panel of byDefault) {
    if (seen.has(panel.id)) continue;
    const at = result.findIndex(p => p.defaultOrder > panel.defaultOrder);
    if (at === -1) result.push(panel);
    else result.splice(at, 0, panel);
    seen.add(panel.id);
  }
  return result;
}

/**
 * Plain factory rather than an `@Injectable` so the layout rules can be unit tested without
 * TestBed, and so the two GM screen pages can each own an independent instance.
 */
export function createPanelLayoutStore(options: PanelLayoutStoreOptions): PanelLayoutStore {
  const { panels, isBrowser } = options;
  const orderKey = `${KEY_PREFIX}${options.storageKey}-order`;
  const collapsedKey = `${KEY_PREFIX}${options.storageKey}-collapsed`;

  // Every read and write is guarded: SSR has no localStorage, Safari private mode throws on
  // write, and a hand-edited or truncated value must fall back to defaults, never blank the page.
  function readIds(key: string): string[] | null {
    if (!isBrowser) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.some(v => typeof v !== 'string')) return null;
      return parsed as string[];
    } catch {
      return null;
    }
  }

  function writeIds(key: string, ids: readonly string[]): void {
    if (!isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(ids));
    } catch {
      /* quota or private mode -- the in-memory layout still works for this session */
    }
  }

  function removeKey(key: string): void {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  const orderIds = signal<readonly string[]>(readIds(orderKey) ?? []);
  // `null` means "nothing stored", which resolves to each panel's `defaultCollapsed`. Panels are
  // an input signal, so the defaults cannot be materialised until the first read.
  const initialCollapsed = readIds(collapsedKey);
  const storedCollapsed = signal<ReadonlySet<string> | null>(
    initialCollapsed ? new Set(initialCollapsed) : null,
  );

  const collapsed = computed<ReadonlySet<string>>(
    () =>
      storedCollapsed() ??
      new Set(panels().filter(p => p.defaultCollapsed).map(p => p.id)),
  );

  const orderedPanels = computed(() => mergeOrder(panels(), orderIds()));

  function commitCollapsed(next: ReadonlySet<string>): void {
    storedCollapsed.set(next);
    writeIds(collapsedKey, [...next]);
  }

  return {
    orderIds,
    collapsed,
    orderedPanels,

    move(fromIdx: number, toIdx: number): void {
      const current = orderedPanels().map(p => p.id);
      const last = current.length - 1;
      if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx > last || toIdx > last) return;
      const next = current.slice();
      next.splice(toIdx, 0, ...next.splice(fromIdx, 1));
      orderIds.set(next);
      writeIds(orderKey, next);
    },

    toggleCollapsed(id: string): void {
      const next = new Set(collapsed());
      if (!next.delete(id)) next.add(id);
      commitCollapsed(next);
    },

    setCollapsed(id: string, value: boolean): void {
      const next = new Set(collapsed());
      if (value) next.add(id);
      else next.delete(id);
      commitCollapsed(next);
    },

    setAllCollapsed(value: boolean): void {
      commitCollapsed(value ? new Set(panels().map(p => p.id)) : new Set<string>());
    },

    reset(): void {
      orderIds.set([]);
      storedCollapsed.set(null);
      removeKey(orderKey);
      removeKey(collapsedKey);
    },
  };
}
