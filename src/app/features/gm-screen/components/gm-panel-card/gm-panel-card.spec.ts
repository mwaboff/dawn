import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { GmPanelCard } from './gm-panel-card';
import { GmPanelDef } from '../../models/gm-panel.model';

@Component({ selector: 'app-tool', template: '<span class="tool-marker">TOOL</span>' })
class Tool {}

const STATIC_PANEL: GmPanelDef = {
  id: 'conditions',
  title: 'Conditions',
  category: 'Conditions & Resources',
  colSpan: 1,
  defaultOrder: 10,
  body: { kind: 'static', blocks: [{ kind: 'text', paragraphs: ['Vulnerable and Restrained'] }] },
};

describe('GmPanelCard', () => {
  let fixture: ComponentFixture<GmPanelCard>;
  let host: HTMLElement;

  const toggle = () => host.querySelector<HTMLButtonElement>('.gm-panel__toggle')!;
  const body = () => host.querySelector<HTMLElement>('.gm-panel__body')!;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [GmPanelCard] });
    fixture = TestBed.createComponent(GmPanelCard);
    fixture.componentRef.setInput('panel', STATIC_PANEL);
    fixture.componentRef.setInput('collapsed', false);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  // The `[attr.id]` host binding renames this fixture's root element from `rootN` to the panel
  // id, so Angular's `[id^=root]` teardown sweep misses it. Without this, one root leaks into
  // the shared JSDOM per test, and later specs' `#id` queries resolve against the leaked
  // duplicates and return null.
  afterEach(() => (fixture.nativeElement as HTMLElement).remove());

  it('carries the panel id and gm-panel class on its own host element', () => {
    expect(host.id).toBe('conditions');
    expect(host.classList.contains('gm-panel')).toBe(true);
  });

  it('maps colSpan onto a span class rather than an inline style', () => {
    fixture.componentRef.setInput('panel', { ...STATIC_PANEL, colSpan: 3 });
    fixture.detectChanges();
    expect(host.classList.contains('gm-panel--wider')).toBe(true);
    expect(host.classList.contains('gm-panel--wide')).toBe(false);
    expect(host.style.gridColumn).toBe('');
  });

  it('makes the title the collapse control and wires it to aria-expanded', () => {
    expect(toggle().textContent).toContain('Conditions');
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(toggle().getAttribute('aria-controls')).toBe('conditions-body');
    expect(body().id).toBe('conditions-body');
  });

  it('emits toggle when the title is pressed', () => {
    let fired = 0;
    fixture.componentInstance.toggled.subscribe(() => fired++);
    toggle().click();
    expect(fired).toBe(1);
  });

  it('hides a collapsed body with until-found so find-in-page still reaches it', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    expect(body().getAttribute('hidden')).toBe('until-found');
    expect(body().textContent).toContain('Vulnerable and Restrained');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('forces a collapsed body open while a filter is active', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.componentRef.setInput('forceOpen', true);
    fixture.detectChanges();
    expect(body().getAttribute('hidden')).toBeNull();
  });

  it('emits revealed when Chromium fires beforematch', () => {
    let fired = 0;
    fixture.componentInstance.revealed.subscribe(() => fired++);
    body().dispatchEvent(new Event('beforematch'));
    expect(fired).toBe(1);
  });

  it('disables the move buttons at the ends of the section', () => {
    fixture.componentRef.setInput('isFirst', true);
    fixture.componentRef.setInput('isLast', true);
    fixture.detectChanges();

    const moves = host.querySelectorAll<HTMLButtonElement>('.gm-panel__head-actions button');
    expect(moves[0].disabled).toBe(true);
    expect(moves[1].disabled).toBe(true);
  });

  it('renders a component body through an outlet', () => {
    fixture.componentRef.setInput('panel', {
      ...STATIC_PANEL,
      body: { kind: 'component', component: Tool },
    });
    fixture.detectChanges();
    expect(host.querySelector('.tool-marker')).not.toBeNull();
  });
});
