import { describe, it, expect } from 'vitest';
import { Component } from '@angular/core';
import { GmContentBlock, GmPanelDef } from '../models/gm-panel.model';
import { matchesFilter, panelSearchText } from './panel-search.util';

function staticPanel(blocks: readonly GmContentBlock[], keywords?: readonly string[]): GmPanelDef {
  return {
    id: 'p',
    title: 'Damage Thresholds',
    category: 'Combat',
    colSpan: 1,
    defaultOrder: 10,
    body: { kind: 'static', blocks },
    keywords,
  };
}

@Component({ selector: 'app-noop', template: '' })
class Noop {}

describe('panelSearchText', () => {
  it('flattens every block variant plus title and keywords', () => {
    const panel = staticPanel(
      [
        { kind: 'text', paragraphs: ['Alpha para'] },
        { kind: 'list', items: ['Bravo item'] },
        { kind: 'keyValue', entries: [{ key: 'Charlie', value: 'Delta' }] },
        { kind: 'table', headers: ['Echo'], rows: [['Foxtrot']] },
        { kind: 'steps', items: [{ label: 'Golf', detail: 'Hotel' }, { label: 'India' }] },
        { kind: 'callout', tone: 'hope', text: 'Juliett' },
      ],
      ['Kilo'],
    );

    const text = panelSearchText(panel);
    for (const term of [
      'damage thresholds',
      'alpha para',
      'bravo item',
      'charlie',
      'delta',
      'echo',
      'foxtrot',
      'golf',
      'hotel',
      'india',
      'juliett',
      'kilo',
    ]) {
      expect(text).toContain(term);
    }
  });

  it('memoizes by panel identity', () => {
    const panel = staticPanel([{ kind: 'text', paragraphs: ['one'] }]);
    expect(panelSearchText(panel)).toBe(panelSearchText(panel));
  });

  it('indexes only the title and keywords for component panels', () => {
    const panel: GmPanelDef = {
      id: 'fear-counter',
      title: 'Fear',
      category: 'This Campaign',
      colSpan: 1,
      defaultOrder: -400,
      body: { kind: 'component', component: Noop },
      keywords: ['tracker'],
    };
    expect(panelSearchText(panel)).toBe('fear tracker');
  });
});

describe('matchesFilter', () => {
  const panel = staticPanel([{ kind: 'text', paragraphs: ['Major damage is two thresholds'] }]);

  it('matches everything on an empty or whitespace query', () => {
    expect(matchesFilter(panel, '')).toBe(true);
    expect(matchesFilter(panel, '   ')).toBe(true);
  });

  it('is a case-insensitive substring match', () => {
    expect(matchesFilter(panel, 'MAJOR DAMAGE')).toBe(true);
    expect(matchesFilter(panel, 'thresh')).toBe(true);
  });

  it('returns false when nothing contains the query', () => {
    expect(matchesFilter(panel, 'beastform')).toBe(false);
  });
});
