import { describe, it, expect } from 'vitest';
import { GmPanelDef, PanelCategory } from '../models/gm-panel.model';
import { groupIntoSections } from './panel-sections.util';

function panel(id: string, category: PanelCategory): GmPanelDef {
  return {
    id,
    title: id,
    category,
    colSpan: 1,
    defaultOrder: 10,
    body: { kind: 'static', blocks: [] },
  };
}

describe('groupIntoSections', () => {
  it('returns sections in PANEL_CATEGORY_ORDER regardless of panel order', () => {
    const sections = groupIntoSections([
      panel('gold', 'Tables'),
      panel('notes', 'This Campaign'),
      panel('conditions', 'Conditions & Resources'),
    ]);

    expect(sections.map(s => s.category)).toEqual([
      'This Campaign',
      'Conditions & Resources',
      'Tables',
    ]);
  });

  it('preserves the flat order within a section', () => {
    const sections = groupIntoSections([
      panel('c', 'Combat'),
      panel('a', 'Combat'),
      panel('b', 'Combat'),
    ]);

    expect(sections[0].panels.map(p => p.id)).toEqual(['c', 'a', 'b']);
  });

  it('records where each panel sits in the flat list so moves can be mapped back', () => {
    const sections = groupIntoSections([
      panel('combat-1', 'Combat'),
      panel('table-1', 'Tables'),
      panel('combat-2', 'Combat'),
    ]);

    const combat = sections.find(s => s.category === 'Combat')!;
    expect(combat.indices).toEqual([0, 2]);
    expect(sections.find(s => s.category === 'Tables')!.indices).toEqual([1]);
  });

  it('drops categories with no panels', () => {
    const sections = groupIntoSections([panel('a', 'Downtime')]);
    expect(sections).toHaveLength(1);
    expect(sections[0].category).toBe('Downtime');
  });

  it('returns nothing for an empty board', () => {
    expect(groupIntoSections([])).toEqual([]);
  });
});
