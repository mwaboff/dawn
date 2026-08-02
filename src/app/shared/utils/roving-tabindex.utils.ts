export type RovingTabKey = 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';

const ROVING_TAB_KEYS: readonly RovingTabKey[] = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

export function isRovingTabKey(key: string): key is RovingTabKey {
  return (ROVING_TAB_KEYS as readonly string[]).includes(key);
}

/**
 * Computes the next tab index for roving-tabindex keyboard navigation (the WAI-ARIA APG tabs
 * pattern: ArrowLeft/Right move focus one tab, wrapping at either end; Home/End jump to the
 * first/last tab). Disabled tabs (e.g. a not-yet-reachable wizard step) are skipped over rather
 * than focused -- if every tab is disabled, `currentIndex` is returned unchanged.
 */
export function nextRovingTabIndex(
  key: RovingTabKey,
  currentIndex: number,
  count: number,
  isDisabled: (index: number) => boolean = () => false,
): number {
  if (count === 0) return currentIndex;

  const step = (from: number, direction: 1 | -1): number => {
    let idx = from;
    for (let i = 0; i < count; i++) {
      idx = (idx + direction + count) % count;
      if (!isDisabled(idx)) return idx;
    }
    return currentIndex;
  };

  switch (key) {
    case 'ArrowRight':
      return step(currentIndex, 1);
    case 'ArrowLeft':
      return step(currentIndex, -1);
    case 'Home':
      return isDisabled(0) ? step(0, 1) : 0;
    case 'End':
      return isDisabled(count - 1) ? step(count - 1, -1) : count - 1;
  }
}
