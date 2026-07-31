import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GmPanelBlocks } from './gm-panel-blocks';
import { GmContentBlock } from '../../models/gm-panel.model';

describe('GmPanelBlocks', () => {
  let fixture: ComponentFixture<GmPanelBlocks>;
  let host: HTMLElement;

  function render(blocks: readonly GmContentBlock[]): void {
    fixture.componentRef.setInput('blocks', blocks);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [GmPanelBlocks] });
    fixture = TestBed.createComponent(GmPanelBlocks);
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders one paragraph per text entry', () => {
    render([{ kind: 'text', paragraphs: ['One', 'Two'] }]);
    expect(Array.from(host.querySelectorAll('p')).map(p => p.textContent?.trim())).toEqual([
      'One',
      'Two',
    ]);
  });

  it('renders an unordered list by default and an ordered list when asked', () => {
    render([{ kind: 'list', items: ['a'] }]);
    expect(host.querySelector('ul.gm-panel__list')).not.toBeNull();

    render([{ kind: 'list', ordered: true, items: ['a'] }]);
    expect(host.querySelector('ol.gm-panel__list')).not.toBeNull();
  });

  it('renders key/value entries as a definition list', () => {
    render([{ kind: 'keyValue', entries: [{ key: 'Melee', value: 'Very close' }] }]);
    expect(host.querySelector('.gm-panel__kv-key')?.textContent?.trim()).toBe('Melee');
    expect(host.querySelector('.gm-panel__kv-value')?.textContent?.trim()).toBe('Very close');
  });

  it('renders table headers and rows, and marks dense tables', () => {
    render([
      { kind: 'table', headers: ['Roll', 'Result'], rows: [['1', 'Minor'], ['2', 'Major']] },
    ]);
    expect(host.querySelectorAll('th').length).toBe(2);
    expect(host.querySelectorAll('tbody tr').length).toBe(2);
    expect(host.querySelector('.gm-panel__table--dense')).toBeNull();

    render([{ kind: 'table', headers: ['Roll'], rows: [['1']], dense: true }]);
    expect(host.querySelector('.gm-panel__table--dense')).not.toBeNull();
  });

  it('renders steps with an optional detail', () => {
    render([{ kind: 'steps', items: [{ label: 'Roll', detail: 'd20' }, { label: 'React' }] }]);
    expect(host.querySelectorAll('.gm-panel__step-label').length).toBe(2);
    expect(host.querySelectorAll('.gm-panel__step-detail').length).toBe(1);
  });

  it('applies the tone modifier to callouts', () => {
    render([{ kind: 'callout', tone: 'fear', text: 'Gain a Fear' }]);
    const callout = host.querySelector('.gm-panel__callout')!;
    expect(callout.classList.contains('gm-panel__callout--fear')).toBe(true);
    expect(callout.classList.contains('gm-panel__callout--hope')).toBe(false);
    expect(callout.textContent?.trim()).toBe('Gain a Fear');
  });

  it('renders nothing for an empty block list', () => {
    render([]);
    expect(host.textContent?.trim()).toBe('');
  });
});
