import { describe, it, expect } from 'vitest';

import { CAMPAIGN_GM_PANELS } from './campaign-panels';

describe('CAMPAIGN_GM_PANELS', () => {
  it('declares the campaign panels in their contract order', () => {
    expect(CAMPAIGN_GM_PANELS.map(p => p.id)).toEqual([
      'sheet-viewer',
      'gm-notes',
      'countdowns',
      'encounter-builder',
    ]);
  });

  it('omits Fear, which the campaign page pins into the board bar instead', () => {
    expect(CAMPAIGN_GM_PANELS.map(p => p.id)).not.toContain('fear-counter');
  });

  it('sorts above the static reference panels', () => {
    for (const panel of CAMPAIGN_GM_PANELS) {
      expect(panel.defaultOrder).toBeLessThan(0);
    }
  });

  it('files every panel under the campaign section', () => {
    for (const panel of CAMPAIGN_GM_PANELS) {
      expect(panel.category, panel.id).toBe('This Campaign');
    }
  });

  it('is entirely component-bodied', () => {
    for (const panel of CAMPAIGN_GM_PANELS) {
      expect(panel.body.kind).toBe('component');
    }
  });

  it('uses the contract column spans', () => {
    expect(CAMPAIGN_GM_PANELS.map(p => p.colSpan)).toEqual([3, 2, 2, 1]);
  });

  it('ships the unbuilt encounter builder collapsed', () => {
    const encounterBuilder = CAMPAIGN_GM_PANELS.find(p => p.id === 'encounter-builder');
    expect(encounterBuilder?.defaultCollapsed).toBe(true);
  });
});
