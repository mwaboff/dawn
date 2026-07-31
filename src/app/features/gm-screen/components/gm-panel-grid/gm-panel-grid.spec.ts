import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { GmPanelGrid } from './gm-panel-grid';
import { GmPanelDef } from '../../models/gm-panel.model';
import {
  ResizeObserverStubHandle,
  installResizeObserverStub,
} from '../../layout/testing/resize-observer.stub';

@Component({ selector: 'app-fear-panel', template: '<span class="fear-marker">FEAR</span>' })
class FearPanel {}

const PANELS: readonly GmPanelDef[] = [
  {
    id: 'conditions',
    title: 'Conditions',
    colSpan: 1,
    defaultOrder: 10,
    body: { kind: 'static', blocks: [{ kind: 'text', paragraphs: ['Vulnerable and Restrained'] }] },
  },
  {
    id: 'thresholds',
    title: 'Damage Thresholds',
    colSpan: 2,
    defaultOrder: 20,
    body: { kind: 'static', blocks: [{ kind: 'text', paragraphs: ['Major and Severe'] }] },
    defaultCollapsed: true,
  },
  {
    id: 'fear-counter',
    title: 'Fear',
    colSpan: 1,
    defaultOrder: 30,
    body: { kind: 'component', component: FearPanel },
  },
];

const ORDER_KEY = 'oh-sheet:gm-screen-order';

describe('GmPanelGrid', () => {
  let stub: ResizeObserverStubHandle;
  let fixture: ComponentFixture<GmPanelGrid>;
  let host: HTMLElement;

  const sections = () => Array.from(host.querySelectorAll<HTMLElement>('section.gm-panel'));
  const section = (id: string) => host.querySelector<HTMLElement>(`section#${id}`)!;
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

  it('renders one section per panel in defaultOrder', () => {
    expect(sections().map(s => s.id)).toEqual(['conditions', 'thresholds', 'fear-counter']);
  });

  it('applies the wide class rather than an inline grid-column', () => {
    expect(section('thresholds').classList.contains('gm-panel--wide')).toBe(true);
    expect(section('thresholds').style.gridColumn).toBe('');
    expect(section('conditions').classList.contains('gm-panel--wide')).toBe(false);
  });

  it('renders static bodies as blocks and component bodies through an outlet', () => {
    expect(section('conditions').textContent).toContain('Vulnerable and Restrained');
    expect(section('fear-counter').querySelector('.fear-marker')).not.toBeNull();
  });

  it('marks non-matching panels with a class but keeps them in the DOM', () => {
    setFilter('vulnerable');
    expect(sections().length).toBe(3);
    expect(section('conditions').classList.contains('is-filtered-out')).toBe(false);
    expect(section('thresholds').classList.contains('is-filtered-out')).toBe(true);
    expect(section('fear-counter').classList.contains('is-filtered-out')).toBe(true);
  });

  it('matches on the title as well as the body', () => {
    setFilter('fear');
    expect(section('fear-counter').classList.contains('is-filtered-out')).toBe(false);
  });

  it('collapses with hidden="until-found" and leaves the body queryable', () => {
    const body = section('thresholds').querySelector<HTMLElement>('.gm-panel__body')!;
    expect(body.getAttribute('hidden')).toBe('until-found');
    expect(body.textContent).toContain('Major and Severe');

    const chevronButton = section('thresholds').querySelector('button.gm-panel__btn')!;
    chevronButton.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(body.getAttribute('hidden')).toBeNull();
  });

  it('ignores collapsed state while a filter is active', () => {
    setFilter('severe');
    const body = section('thresholds').querySelector<HTMLElement>('.gm-panel__body')!;
    expect(body.getAttribute('hidden')).toBeNull();
  });

  it('expands the chevron state when Chromium fires beforematch', () => {
    const body = section('thresholds').querySelector<HTMLElement>('.gm-panel__body')!;
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

  it('onDrop reorders and persists', () => {
    fixture.componentInstance.onDrop({ previousIndex: 2, currentIndex: 0 } as CdkDragDrop<unknown>);
    fixture.detectChanges();
    expect(sections().map(s => s.id)).toEqual(['fear-counter', 'conditions', 'thresholds']);
    expect(JSON.parse(localStorage.getItem(ORDER_KEY)!)).toEqual([
      'fear-counter',
      'conditions',
      'thresholds',
    ]);
  });

  it('move buttons reorder and are disabled at the ends', () => {
    const moveButtons = (id: string) =>
      Array.from(section(id).querySelectorAll<HTMLButtonElement>('.gm-panel__head-actions button'));

    expect(moveButtons('conditions')[0].disabled).toBe(true);
    expect(moveButtons('fear-counter')[1].disabled).toBe(true);

    moveButtons('thresholds')[0].click();
    fixture.detectChanges();
    expect(sections().map(s => s.id)).toEqual(['thresholds', 'conditions', 'fear-counter']);
  });

  it('disables drag while filtering, and re-enables it when the box is cleared', () => {
    expect(section('conditions').classList.contains('cdk-drag-disabled')).toBe(false);

    setFilter('fear');
    expect(section('conditions').classList.contains('cdk-drag-disabled')).toBe(true);

    setFilter('  ');
    expect(section('conditions').classList.contains('cdk-drag-disabled')).toBe(false);
  });

  it('restores a stored order on construction', () => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(['fear-counter', 'thresholds', 'conditions']));
    const restored = TestBed.createComponent(GmPanelGrid);
    restored.componentRef.setInput('panels', PANELS);
    restored.componentRef.setInput('storageKey', 'gm-screen');
    restored.detectChanges();
    const ids = Array.from(
      (restored.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('section.gm-panel'),
    ).map(s => s.id);
    expect(ids).toEqual(['fear-counter', 'thresholds', 'conditions']);
  });
});
