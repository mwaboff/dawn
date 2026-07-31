import { describe, expect, it } from 'vitest';
import { GmContentBlock, PANEL_CATEGORY_ORDER } from '../models/gm-panel.model';
import { STATIC_GM_PANELS } from './panel-registry';

/**
 * Listed literally rather than derived from the registry: this is the guard that catches a content
 * file silently dropping or renaming a panel.
 */
const EXPECTED_IDS = [
  'action-roll-results',
  'roll-result-examples',
  'difficulty',
  'range',
  'advantage',
  'damage-thresholds',
  'conditions',
  'traits',
  'hope-fear',
  'stress',
  'attacks',
  'teamwork-rolls',
  'spotlight',
  'gm-moves-triggers',
  'rests',
  'environment-hazards',
  'death-moves',
  'battle-guide',
  'improvised-adversaries',
  'success-with-fear',
  'example-gm-moves',
  'gold',
  'random-tables',
];

function blockIsNonEmpty(block: GmContentBlock): boolean {
  switch (block.kind) {
    case 'text':
      return block.paragraphs.length > 0;
    case 'list':
      return block.items.length > 0;
    case 'keyValue':
      return block.entries.length > 0;
    case 'table':
      return block.headers.length > 0 && block.rows.length > 0;
    case 'steps':
      return block.items.length > 0;
    case 'callout':
      return block.text.length > 0;
  }
}

describe('STATIC_GM_PANELS', () => {
  it('contains exactly the expected panel ids', () => {
    expect([...STATIC_GM_PANELS.map((p) => p.id)].sort()).toEqual([...EXPECTED_IDS].sort());
  });

  it('has unique ids', () => {
    const ids = STATIC_GM_PANELS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique default orders', () => {
    const orders = STATIC_GM_PANELS.map((p) => p.defaultOrder);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('is sorted ascending by default order', () => {
    const orders = STATIC_GM_PANELS.map((p) => p.defaultOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('uses a column span of 1, 2 or 3', () => {
    for (const panel of STATIC_GM_PANELS) {
      expect([1, 2, 3], panel.id).toContain(panel.colSpan);
    }
  });

  it('files every panel under a known category, and never the campaign one', () => {
    for (const panel of STATIC_GM_PANELS) {
      expect(PANEL_CATEGORY_ORDER, panel.id).toContain(panel.category);
      expect(panel.category, panel.id).not.toBe('This Campaign');
    }
  });

  it('opens a small enough set by default to be scannable on arrival', () => {
    const open = STATIC_GM_PANELS.filter(p => !p.defaultCollapsed);
    expect(open.length).toBeLessThanOrEqual(8);
    expect(open.length).toBeGreaterThan(0);
  });

  it('has a non-empty title', () => {
    for (const panel of STATIC_GM_PANELS) {
      expect(panel.title.trim(), panel.id).not.toBe('');
    }
  });

  it('has a static body with at least one block', () => {
    for (const panel of STATIC_GM_PANELS) {
      expect(panel.body.kind, panel.id).toBe('static');
      if (panel.body.kind !== 'static') continue;
      expect(panel.body.blocks.length, panel.id).toBeGreaterThan(0);
    }
  });

  it('has no internally empty blocks', () => {
    for (const panel of STATIC_GM_PANELS) {
      if (panel.body.kind !== 'static') continue;
      panel.body.blocks.forEach((block, index) => {
        expect(blockIsNonEmpty(block), `${panel.id} block ${index} (${block.kind})`).toBe(true);
      });
    }
  });

  it('gives every table row the same width as its headers', () => {
    for (const panel of STATIC_GM_PANELS) {
      if (panel.body.kind !== 'static') continue;
      for (const block of panel.body.blocks) {
        if (block.kind !== 'table') continue;
        for (const row of block.rows) {
          expect(row.length, panel.id).toBe(block.headers.length);
        }
      }
    }
  });
});
