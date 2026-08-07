import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { GmPanelGrid } from './gm-panel-grid';
import { GmPanelDef } from '../../models/gm-panel.model';
import {
  ResizeObserverStubHandle,
  installResizeObserverStub,
} from '../../../../shared/testing/resize-observer.stub';

@Component({ selector: 'app-fear-panel', template: '<span class="fear-marker">FEAR</span>' })
class FearPanel {}

const PANELS: readonly GmPanelDef[] = [
  {
    id: 'conditions',
    title: 'Conditions',
    category: 'Combat',
    colSpan: 1,
    defaultOrder: 10,
    body: { kind: 'static', blocks: [{ kind: 'text', paragraphs: ['Vulnerable and Restrained'] }] },
  },
  {
    id: 'thresholds',
    title: 'Damage Thresholds',
    category: 'Combat',
    colSpan: 2,
    defaultOrder: 20,
    body: { kind: 'static', blocks: [{ kind: 'text', paragraphs: ['Major and Severe'] }] },
    defaultCollapsed: true,
  },
  {
    id: 'fear-counter',
    title: 'Fear',
    category: 'Combat',
    colSpan: 1,
    defaultOrder: 30,
    body: { kind: 'component', component: FearPanel },
  },
];

const ORDER_KEY = 'oh-sheet:gm-screen-order';
const COLLAPSED_KEY = 'oh-sheet:gm-screen-collapsed';

describe('GmPanelGrid', () => {
  let stub: ResizeObserverStubHandle;
  let fixture: ComponentFixture<GmPanelGrid>;
  let host: HTMLElement;

  const cards = () => Array.from(host.querySelectorAll<HTMLElement>('.gm-panel'));
  const card = (id: string) => host.querySelector<HTMLElement>(`#${id}`)!;
  const toggle = (id: string) => card(id).querySelector<HTMLButtonElement>('.gm-panel__toggle')!;
  const setFilter = (value: string) => {
    fixture.componentInstance.filter.set(value);
    fixture.detectChanges();
  };

  beforeEach(() => {
    localStorage.clear();
    stub = installResizeObserverStub();
    TestBed.configureTestingModule({ imports: [GmPanelGrid] });
    fixture = TestBed.createComponent(GmPanelGrid);
    fixture.componentRef.setInput('panels', PANELS);
    fixture.componentRef.setInput('storageKey', 'gm-screen');
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => stub.restore());

  it('renders one card per panel in defaultOrder', () => {
    expect(cards().map(c => c.id)).toEqual(['conditions', 'thresholds', 'fear-counter']);
  });

  it('applies the span class rather than an inline grid-column', () => {
    expect(card('thresholds').classList.contains('gm-panel--wide')).toBe(true);
    expect(card('thresholds').style.gridColumn).toBe('');
    expect(card('conditions').classList.contains('gm-panel--wide')).toBe(false);
  });

  it('renders static bodies as blocks and component bodies through an outlet', () => {
    expect(card('conditions').textContent).toContain('Vulnerable and Restrained');
    expect(card('fear-counter').querySelector('.fear-marker')).not.toBeNull();
  });

  it('marks non-matching panels with a class but keeps them in the DOM', () => {
    setFilter('vulnerable');
    expect(cards().length).toBe(3);
    expect(card('conditions').classList.contains('is-filtered-out')).toBe(false);
    expect(card('thresholds').classList.contains('is-filtered-out')).toBe(true);
    expect(card('fear-counter').classList.contains('is-filtered-out')).toBe(true);
  });

  it('matches on the title as well as the body', () => {
    setFilter('fear');
    expect(card('fear-counter').classList.contains('is-filtered-out')).toBe(false);
  });

  it('reports how many panels survive the filter', () => {
    expect(fixture.componentInstance.matchCount()).toBe(3);
    setFilter('vulnerable');
    expect(fixture.componentInstance.matchCount()).toBe(1);
  });

  it('explains an empty result instead of showing a blank board', () => {
    setFilter('nothing matches this');
    expect(host.querySelector('.gm-board__empty')?.textContent).toContain('nothing matches this');
  });

  it('collapses with hidden="until-found" and leaves the body queryable', () => {
    const body = card('thresholds').querySelector<HTMLElement>('.gm-panel__body')!;
    expect(body.getAttribute('hidden')).toBe('until-found');
    expect(body.textContent).toContain('Major and Severe');

    toggle('thresholds').click();
    fixture.detectChanges();
    expect(body.getAttribute('hidden')).toBeNull();
  });

  it('ignores collapsed state while a filter is active', () => {
    setFilter('severe');
    const body = card('thresholds').querySelector<HTMLElement>('.gm-panel__body')!;
    expect(body.getAttribute('hidden')).toBeNull();
  });

  it('expands the chevron state when Chromium fires beforematch', () => {
    const body = card('thresholds').querySelector<HTMLElement>('.gm-panel__body')!;
    body.dispatchEvent(new Event('beforematch'));
    fixture.detectChanges();
    expect(body.getAttribute('hidden')).toBeNull();
  });

  it('expand all and collapse all drive every panel', () => {
    fixture.componentInstance.setAllCollapsed(true);
    fixture.detectChanges();
    expect(host.querySelectorAll('.gm-panel__body[hidden]').length).toBe(3);

    fixture.componentInstance.setAllCollapsed(false);
    fixture.detectChanges();
    expect(host.querySelectorAll('.gm-panel__body[hidden]').length).toBe(0);
  });

  it('onDrop reorders within the section and persists', () => {
    const section = fixture.componentInstance.sections()[0];
    fixture.componentInstance.onDrop(section, {
      previousIndex: 2,
      currentIndex: 0,
    } as CdkDragDrop<unknown>);
    fixture.detectChanges();
    expect(cards().map(c => c.id)).toEqual(['fear-counter', 'conditions', 'thresholds']);
    expect(JSON.parse(localStorage.getItem(ORDER_KEY)!)).toEqual([
      'fear-counter',
      'conditions',
      'thresholds',
    ]);
  });

  it('move buttons reorder and are disabled at the ends', () => {
    const moveButtons = (id: string) =>
      Array.from(card(id).querySelectorAll<HTMLButtonElement>('.gm-panel__head-actions button'));

    expect(moveButtons('conditions')[0].disabled).toBe(true);
    expect(moveButtons('fear-counter')[1].disabled).toBe(true);

    moveButtons('thresholds')[0].click();
    fixture.detectChanges();
    expect(cards().map(c => c.id)).toEqual(['thresholds', 'conditions', 'fear-counter']);
  });

  it('reset layout clears the stored order and collapse state', () => {
    fixture.componentInstance.setAllCollapsed(true);
    const section = fixture.componentInstance.sections()[0];
    fixture.componentInstance.onDrop(section, {
      previousIndex: 2,
      currentIndex: 0,
    } as CdkDragDrop<unknown>);
    fixture.detectChanges();

    fixture.componentInstance.resetLayout();
    fixture.detectChanges();

    expect(localStorage.getItem(ORDER_KEY)).toBeNull();
    expect(localStorage.getItem(COLLAPSED_KEY)).toBeNull();
    expect(cards().map(c => c.id)).toEqual(['conditions', 'thresholds', 'fear-counter']);
    // Back to each panel's shipped default: only `thresholds` starts collapsed.
    expect(host.querySelectorAll('.gm-panel__body[hidden]').length).toBe(1);
  });

  it('disables drag while filtering, and re-enables it when the box is cleared', () => {
    expect(card('conditions').classList.contains('cdk-drag-disabled')).toBe(false);

    setFilter('fear');
    expect(card('conditions').classList.contains('cdk-drag-disabled')).toBe(true);

    setFilter('  ');
    expect(card('conditions').classList.contains('cdk-drag-disabled')).toBe(false);
  });

  it('restores a stored order on construction', () => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(['fear-counter', 'thresholds', 'conditions']));
    const restored = TestBed.createComponent(GmPanelGrid);
    restored.componentRef.setInput('panels', PANELS);
    restored.componentRef.setInput('storageKey', 'gm-screen');
    restored.detectChanges();
    const ids = Array.from(
      (restored.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.gm-panel'),
    ).map(s => s.id);
    expect(ids).toEqual(['fear-counter', 'thresholds', 'conditions']);
  });

  describe('sections', () => {
    const MIXED: readonly GmPanelDef[] = [
      { ...PANELS[0], category: 'Tables' },
      { ...PANELS[1], category: 'This Campaign' },
      { ...PANELS[2], category: 'This Campaign' },
    ];

    let mixed: ComponentFixture<GmPanelGrid>;
    let mixedHost: HTMLElement;

    beforeEach(() => {
      localStorage.clear();
      mixed = TestBed.createComponent(GmPanelGrid);
      mixed.componentRef.setInput('panels', MIXED);
      mixed.componentRef.setInput('storageKey', 'gm-screen');
      mixed.detectChanges();
      mixedHost = mixed.nativeElement as HTMLElement;
    });

    it('groups panels under headings in PANEL_CATEGORY_ORDER, not panel order', () => {
      const titles = Array.from(mixedHost.querySelectorAll('.gm-section__title')).map(
        h => h.textContent,
      );
      expect(titles).toEqual(['This Campaign', 'Tables']);
      expect(
        Array.from(mixedHost.querySelectorAll<HTMLElement>('.gm-panel')).map(c => c.id),
      ).toEqual(['thresholds', 'fear-counter', 'conditions']);
    });

    it('omits categories with no panels', () => {
      expect(mixedHost.querySelectorAll('.gm-section').length).toBe(2);
    });

    it('collapses and expands a whole section', () => {
      const sectionButton = mixedHost.querySelectorAll<HTMLButtonElement>('.gm-section__btn')[0];
      sectionButton.click();
      mixed.detectChanges();

      const campaignSection = mixedHost.querySelectorAll('.gm-section')[0];
      expect(campaignSection.querySelectorAll('.gm-panel__body[hidden]').length).toBe(2);

      sectionButton.click();
      mixed.detectChanges();
      expect(campaignSection.querySelectorAll('.gm-panel__body[hidden]').length).toBe(0);
    });

    it('hides a section whose panels are all filtered out', () => {
      mixed.componentInstance.filter.set('vulnerable');
      mixed.detectChanges();

      const sectionEls = Array.from(mixedHost.querySelectorAll<HTMLElement>('.gm-section'));
      expect(sectionEls[0].classList.contains('is-filtered-out')).toBe(true);
      expect(sectionEls[1].classList.contains('is-filtered-out')).toBe(false);
    });
  });
});
