import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';

import { MartialStancePanelBeta } from './martial-stance-panel-beta';
import { MartialStancePanel } from '../../../character-sheet/components/martial-stance-panel/martial-stance-panel';
import { EntityCard } from '../../../../shared/components/entity-card/entity-card';
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
    <app-martial-stance-panel-beta
      [knownStances]="stances()"
      [activeStanceId]="activeId()"
      [focusMarked]="focus()"
      [canAct]="canAct()"
      [actionInFlight]="inFlight()"
      (activateStance)="lastActivated = $event"
      (clearStance)="cleared = true"
    />
  `,
  imports: [MartialStancePanelBeta],
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

describe('MartialStancePanelBeta', () => {
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

  it('extends the classic panel, inheriting its stance logic', () => {
    const panel = fixture.debugElement.query(By.directive(MartialStancePanelBeta));
    expect(panel.componentInstance).toBeInstanceOf(MartialStancePanel);
  });

  it('renders one EntityCard per known stance, mapped from the stance data', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 2)]);
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.directive(EntityCard));
    expect(cards.length).toBe(1);

    const card = cards[0].componentInstance.card();
    expect(card.id).toBe(1);
    expect(card.name).toBe('Aggressive Stance');
    expect(card.cardType).toBe('martialStance');
    expect(card.description).toBe('Aggressive Stance effect text.');
    expect(card.badges).toEqual([{ label: 'Tier', value: '2' }]);
  });

  it("adds an Active badge to the currently active stance's card", () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.activeId.set(1);
    fixture.detectChanges();

    const card = fixture.debugElement.query(By.directive(EntityCard)).componentInstance.card();
    expect(card.badges).toContainEqual({ label: 'Active' });
  });

  it('mutes every stance card except the active one, so the active stance reads at a glance', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1), buildStance(2, 'Defensive Stance', 1)]);
    host.activeId.set(1);
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.directive(EntityCard));
    expect(cards[0].componentInstance.muted()).toBe(false);
    expect(cards[1].componentInstance.muted()).toBe(true);
  });

  it('mutes every stance card when no stance is active', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    fixture.detectChanges();

    const card = fixture.debugElement.query(By.directive(EntityCard));
    expect(card.componentInstance.muted()).toBe(true);
  });

  it('projects an Enter button into card-actions, wired to the inherited activate handler', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.focus.set(2);
    fixture.detectChanges();

    const button = el.querySelector<HTMLButtonElement>('[card-actions] button');
    expect(button?.closest('.entity-card__actions')).toBeTruthy();
    expect(button?.textContent).toContain('Enter');

    button?.click();

    expect(host.lastActivated).toBe(1);
  });

  it('projects a Drop button for the active stance, wired to the inherited clear handler', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.activeId.set(1);
    fixture.detectChanges();

    const button = el.querySelector<HTMLButtonElement>('[card-actions] button');
    expect(button?.closest('.entity-card__actions')).toBeTruthy();
    expect(button?.textContent).toContain('Drop');

    button?.click();

    expect(host.cleared).toBe(true);
  });

  it('omits action buttons entirely when the viewer cannot act', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    host.canAct.set(false);
    fixture.detectChanges();

    expect(el.querySelector('[card-actions] button')).toBeFalsy();
  });

  it('renders the status line and drop-conditions list outside the entity cards', () => {
    host.stances.set([buildStance(1, 'Aggressive Stance', 1)]);
    fixture.detectChanges();

    const status = el.querySelector('[role="status"]');
    expect(status?.textContent).toContain('No stance active');

    const reminderItems = el.querySelectorAll('.stance-drop-reminder__list li');
    expect(reminderItems.length).toBe(4);

    const cardEl = fixture.debugElement.query(By.directive(EntityCard)).nativeElement as HTMLElement;
    expect(cardEl.contains(status)).toBe(false);
    expect(cardEl.contains(reminderItems[0])).toBe(false);
  });
});
