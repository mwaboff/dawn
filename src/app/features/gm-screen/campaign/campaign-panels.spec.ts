import { describe, it, expect } from 'vitest';

import { CAMPAIGN_GM_PANELS } from './campaign-panels';

describe('CAMPAIGN_GM_PANELS', () => {
  it('declares the four campaign panels in their contract order', () => {
    expect(CAMPAIGN_GM_PANELS.map(p => p.id)).toEqual([
      'fear-counter',
      'sheet-viewer',
      'gm-notes',
      'encounter-builder',
    ]);
  });

  it('sorts above the static reference panels', () => {
    for (const panel of CAMPAIGN_GM_PANELS) {
      expect(panel.defaultOrder).toBeLessThan(0);
    }
  });

  it('is entirely component-bodied', () => {
    for (const panel of CAMPAIGN_GM_PANELS) {
      expect(panel.body.kind).toBe('component');
    }
  });

  it('uses the contract column spans', () => {
    expect(CAMPAIGN_GM_PANELS.map(p => p.colSpan)).toEqual([1, 2, 2, 1]);
  });
});
