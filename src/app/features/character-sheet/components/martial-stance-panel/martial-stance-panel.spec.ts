import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MartialStancePanel } from './martial-stance-panel';
import { MartialStanceResponse } from '../../../../shared/models/martial-stance-api.model';

function buildStance(id: number, name: string, tier: number): MartialStanceResponse {
  return {
    id,
    name,
    tier,
    expansionId: 2,
    description: `${name} effect text.`,
    createdAt: '',
    lastModifiedAt: '',
  };
}

@Component({
  template: `
    <app-martial-stance-panel
      [knownStances]="stances()"
      [activeStanceId]="activeId()"
      [focusMarked]="focus()"
      [canAct]="canAct()"
      [actionInFlight]="inFlight()"
      (activateStance)="lastActivated = $event"
      (clearStance)="cleared = true"
    />
  `,
  imports: [MartialStancePanel],
})
class TestHost {
  stances = signal<MartialStanceResponse[]>([]);
  activeId = signal<number | null>(null);
  focus = signal(0);
  canAct = signal(true);
  inFlight = signal(false);
  lastActivated: number | null = null;
  cleared = false;
}

describe('MartialStancePanel', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('creates the component', () => {
    expect(el.querySelector('app-martial-stance-panel')).toBeTruthy();
  });

  it('shows an empty message when no stances are known', () => {
    expect(el.querySelector('.stance-empty')).toBeTruthy();
  });

  it('groups known stances by tier', () => {
    host.stances.set([
      buildStance(1, 'Aggressive Stance', 1),
      buildStance(2, 'Defensive Stance', 1),
      buildStance(3, 'Advanced Stance', 2),
    ]);
    fixture.detectChanges();

    const headings = el.querySelectorAll('.stance-tier-group__heading');
    expect(headings.length).toBe(2);
    expect(headings[0].textContent).toContain('Tier 1');
    expect(headings[1].textContent).toContain('Tier 2');
  });

  it('renders all known stance cards', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1), buildStance(2, 'Defensive Stance', 1)]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.stance-card').length).toBe(2);
  });

  it('disables activation when Focus is empty', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.focus.set(0);
    fixture.detectChanges();

    const btn = el.querySelector<HTMLButtonElement>('.stance-btn');
    expect(btn?.disabled).toBe(true);
  });

  it('emits activateStance when a stance is entered with Focus available', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.focus.set(2);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.stance-btn')?.click();

    expect(host.lastActivated).toBe(1);
  });

  it('does not render an activate button for the currently active stance', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.activeId.set(1);
    host.focus.set(2);
    fixture.detectChanges();

    expect(el.querySelector('.stance-card__active-badge')).toBeTruthy();
    expect(el.querySelector('.stance-card .stance-btn')).toBeFalsy();
  });

  it('shows the active stance banner with a drop button', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.activeId.set(1);
    fixture.detectChanges();

    expect(el.querySelector('.stance-active__name')?.textContent).toContain('Aggressive Stance');
    expect(el.querySelector('.stance-btn--clear')).toBeTruthy();
  });

  it('emits clearStance when the drop button is clicked', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.activeId.set(1);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.stance-btn--clear')?.click();

    expect(host.cleared).toBe(true);
  });

  it('does not show the drop button when the viewer cannot act', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.activeId.set(1);
    host.canAct.set(false);
    fixture.detectChanges();

    expect(el.querySelector('.stance-btn--clear')).toBeFalsy();
  });

  it('renders the four drop conditions as a reminder', () => {
    const items = el.querySelectorAll('.stance-drop-reminder__list li');
    expect(items.length).toBe(4);
  });
});
