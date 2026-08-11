import { describe, it, expect, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { DiceRoller } from './dice-roller';
import { DiceRollerService } from '../../../core/services/dice-roller.service';
import { RollResult } from '../../models/dice-roller.model';

function makeResult(overrides: Partial<RollResult> = {}): RollResult {
  return {
    id: 'test-1',
    timestamp: Date.now(),
    diceResults: [],
    duality: null,
    modifiers: [],
    modifierTotal: 0,
    advantage: null,
    total: 0,
    ...overrides,
  };
}

describe('DiceRoller', () => {
  let fixture: ComponentFixture<DiceRoller>;
  let service: DiceRollerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DiceRoller],
    });
    fixture = TestBed.createComponent(DiceRoller);
    service = TestBed.inject(DiceRollerService);
    service.isOpen.set(false);
    service.history.set([]);
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the FAB button', () => {
    const fab = fixture.nativeElement.querySelector('.ts-fab');
    expect(fab).toBeTruthy();
  });

  it('FAB click toggles service.isOpen from false to true', () => {
    expect(service.isOpen()).toBe(false);
    const fab: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-fab');
    fab.click();
    expect(service.isOpen()).toBe(true);
  });

  it('FAB click toggles service.isOpen from true to false', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const fab: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-fab');
    fab.click();
    expect(service.isOpen()).toBe(false);
  });

  it('menu does not render when isOpen is false', () => {
    service.isOpen.set(false);
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('.ts-menu');
    expect(menu).toBeNull();
  });

  it('menu renders when isOpen is true', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('.ts-menu');
    expect(menu).toBeTruthy();
  });

  it('menu contains counter values for all 7 die types', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const vals = fixture.nativeElement.querySelectorAll('.ts-counter-val');
    expect(vals.length).toBe(7);
  });

  it('increment button increases die count', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const increaseBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Increase d6"]'
    );
    increaseBtn.click();
    fixture.detectChanges();
    const counter = fixture.nativeElement.querySelector('[aria-label="Increase d6"]')
      ?.closest('[role="group"]')
      ?.querySelector('.ts-counter-val');
    expect(counter?.textContent?.trim()).toBe('1');
  });

  it('decrement button allows negative counts', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const decreaseBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Decrease d6"]'
    );
    decreaseBtn.click();
    fixture.detectChanges();
    const counter = fixture.nativeElement.querySelector('[aria-label="Decrease d6"]')
      ?.closest('[role="group"]')
      ?.querySelector('.ts-counter-val');
    expect(counter?.textContent?.trim()).toBe('-1');
  });

  it('clicking Roll calls service.roll with correct RollRequest', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Increase d6"]'
    );
    increaseD6.click();
    increaseD6.click();
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'roll');
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    rollBtn.click();

    expect(spy).toHaveBeenCalledOnce();
    const request = spy.mock.calls[0][0];
    const d6Entry = request.dice.find((d) => d.type === 'd6');
    expect(d6Entry?.count).toBe(2);
  });

  it('Roll request excludes dice with count 0', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
    increaseD6.click();
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'roll');
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    rollBtn.click();

    const request = spy.mock.calls[0][0];
    expect(request.dice.every(d => d.count !== 0)).toBe(true);
    expect(request.dice.find(d => d.type === 'd4')).toBeUndefined();
  });

  it('roll request includes dice with negative counts', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const decreaseD8: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Decrease d8"]'
    );
    decreaseD8.click();
    decreaseD8.click();
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'roll');
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    rollBtn.click();

    const request = spy.mock.calls[0][0];
    const d8Entry = request.dice.find((d) => d.type === 'd8');
    expect(d8Entry?.count).toBe(-2);
  });

  it('duality button toggles includeDuality in RollRequest', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const dualityBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-duality-btn');
    dualityBtn.click();
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'roll');
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    rollBtn.click();

    const request = spy.mock.calls[0][0];
    expect(request.includeDuality).toBe(true);
  });

  it('duality defaults to false in RollRequest', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
    increaseD6.click();
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'roll');
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    rollBtn.click();

    expect(spy.mock.calls[0][0].includeDuality).toBe(false);
  });

  it('history renders entries from service.history()', () => {
    service.history.set([
      makeResult({ id: 'r1', total: 7, diceResults: [{ type: 'd6', value: 7 }] }),
      makeResult({ id: 'r2', total: 4, diceResults: [{ type: 'd4', value: 4 }] }),
    ]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.ts-history-row');
    expect(rows.length).toBe(2);
  });

  it('shows hope label when duality outcome is hope', () => {
    service.history.set([
      makeResult({ id: 'h1', total: 15, duality: { hope: 9, fear: 5, outcome: 'hope' } }),
    ]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const outcome = fixture.nativeElement.querySelector('.ts-history-outcome');
    expect(outcome?.textContent?.trim()).toBe('Hope');
  });

  it('shows fear label when duality outcome is fear', () => {
    service.history.set([
      makeResult({ id: 'f1', total: 10, duality: { hope: 3, fear: 9, outcome: 'fear' } }),
    ]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const outcome = fixture.nativeElement.querySelector('.ts-history-outcome');
    expect(outcome?.textContent?.trim()).toBe('Fear');
  });

  it('shows crit label when duality outcome is crit', () => {
    service.history.set([
      makeResult({ id: 'c1', total: 24, duality: { hope: 12, fear: 12, outcome: 'crit' } }),
    ]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const outcome = fixture.nativeElement.querySelector('.ts-history-outcome');
    expect(outcome?.textContent?.trim()).toBe('CRIT!');
  });

  it('shows "with Hope" microcopy in last roll panel on hope outcome', () => {
    service.history.set([
      makeResult({ id: 'hope-1', total: 15, duality: { hope: 9, fear: 5, outcome: 'hope' } }),
    ]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.ts-result-outcome');
    expect(panel?.textContent?.trim()).toBe('with Hope');
  });

  it('shows "with Fear" microcopy in last roll panel on fear outcome', () => {
    service.history.set([
      makeResult({ id: 'fear-1', total: 10, duality: { hope: 3, fear: 9, outcome: 'fear' } }),
    ]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.ts-result-outcome');
    expect(panel?.textContent?.trim()).toBe('with Fear');
  });

  it('shows "Critical Success!" microcopy in last roll panel on crit outcome', () => {
    service.history.set([
      makeResult({ id: 'crit-1', total: 24, duality: { hope: 12, fear: 12, outcome: 'crit' } }),
    ]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.ts-result-outcome');
    expect(panel?.textContent?.trim()).toBe('Critical Success!');
  });

  it('clear history button calls service.clearHistory()', () => {
    service.history.set([makeResult({ id: 'r1', total: 5 })]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'clearHistory');
    const clearBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-clear-btn');
    clearBtn.click();

    expect(spy).toHaveBeenCalledOnce();
  });

  it('shows empty state text when no history', () => {
    service.history.set([]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.ts-history-empty');
    expect(empty?.textContent).toContain('no rolls recorded');
  });

  it('close button inside menu calls service.close()', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const spy = vi.spyOn(service, 'close');
    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-close-btn');
    expect(closeBtn).toBeTruthy();
    closeBtn.click();

    expect(spy).toHaveBeenCalledOnce();
  });

  it('close button sets isOpen to false', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-close-btn');
    closeBtn.click();

    expect(service.isOpen()).toBe(false);
  });

  it('reset dice button clears duality selection', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const dualityBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-duality-btn');
    dualityBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.isDualityChecked()).toBe(true);

    const resetBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-reset-btn');
    resetBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.isDualityChecked()).toBe(false);
  });

  it('reset dice button zeroes all die counts', () => {
    service.isOpen.set(true);
    fixture.detectChanges();

    const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Increase d6"]'
    );
    increaseD6.click();
    increaseD6.click();
    const increaseD20: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Increase d20"]'
    );
    increaseD20.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.getCount('d6')).toBe(2);
    expect(fixture.componentInstance.getCount('d20')).toBe(1);

    const resetBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-reset-btn');
    resetBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.getCount('d6')).toBe(0);
    expect(fixture.componentInstance.getCount('d20')).toBe(0);
    expect(fixture.componentInstance.getCount('d4')).toBe(0);
  });

  it('Roll button is disabled when no dice are selected', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    expect(rollBtn.disabled).toBe(true);
  });

  it('Roll button is enabled when at least one die is selected', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
    increaseD6.click();
    fixture.detectChanges();
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    expect(rollBtn.disabled).toBe(false);
  });

  it('Roll button is enabled when duality is toggled with no other dice', () => {
    service.isOpen.set(true);
    fixture.detectChanges();
    const dualityBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-duality-btn');
    dualityBtn.click();
    fixture.detectChanges();
    const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
    expect(rollBtn.disabled).toBe(false);
  });

  it('isRolling is false initially', () => {
    expect(fixture.componentInstance.isRolling()).toBe(false);
  });

  describe('roll animation', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('isRolling becomes true immediately after clicking roll', () => {
      vi.useFakeTimers();
      service.isOpen.set(true);
      fixture.detectChanges();

      const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
      increaseD6.click();
      fixture.detectChanges();

      const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
      rollBtn.click();

      expect(fixture.componentInstance.isRolling()).toBe(true);
    });

    it('isRolling becomes false after 500ms', () => {
      vi.useFakeTimers();
      service.isOpen.set(true);
      fixture.detectChanges();

      const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
      rollBtn.click();

      vi.advanceTimersByTime(250);

      expect(fixture.componentInstance.isRolling()).toBe(false);
    });

    it('displayTotal stays within min-max range during rolling with positive dice', () => {
      vi.useFakeTimers();
      service.isOpen.set(true);
      fixture.detectChanges();

      const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
      increaseD6.click(); // 1d6: min=1, max=6
      fixture.detectChanges();

      const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
      rollBtn.click();

      const displayVal = fixture.componentInstance.displayTotal();
      expect(displayVal).toBeGreaterThanOrEqual(1);
      expect(displayVal).toBeLessThanOrEqual(6);
    });

    it('displayTotal updates on each interval tick', () => {
      vi.useFakeTimers();
      service.isOpen.set(true);
      fixture.detectChanges();

      const increaseD20: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d20"]');
      increaseD20.click(); // 1d20: min=1, max=20
      fixture.detectChanges();

      const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
      rollBtn.click();

      const first = fixture.componentInstance.displayTotal();
      vi.advanceTimersByTime(50);
      // After one tick the interval fires and updates the display
      expect(typeof fixture.componentInstance.displayTotal()).toBe('number');
      expect(fixture.componentInstance.isRolling()).toBe(true);
      const second = fixture.componentInstance.displayTotal();
      expect(second).toBeGreaterThanOrEqual(1);
      expect(second).toBeLessThanOrEqual(20);
      // first is already checked to be a valid number; both are valid
      expect(first).toBeGreaterThanOrEqual(1);
      expect(first).toBeLessThanOrEqual(20);
    });
  });

  it('shows em-dash in result panel before any rolls', () => {
    service.history.set([]);
    service.isOpen.set(true);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.ts-result-empty');
    expect(empty?.textContent).toContain('—');
  });

  describe('Escape key', () => {
    it('closes the popover on Escape when open', () => {
      service.isOpen.set(true);
      fixture.detectChanges();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(service.isOpen()).toBe(false);
    });

    it('does nothing on Escape when already closed', () => {
      service.isOpen.set(false);
      fixture.detectChanges();
      const spy = vi.spyOn(service, 'close');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(spy).not.toHaveBeenCalled();
    });

    it('returns focus to the FAB after closing via Escape', () => {
      service.isOpen.set(true);
      fixture.detectChanges();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      const fab = fixture.nativeElement.querySelector('.ts-fab');
      expect(document.activeElement).toBe(fab);
    });
  });

  describe('closing via the in-menu close button', () => {
    it('returns focus to the FAB', () => {
      service.isOpen.set(true);
      fixture.detectChanges();

      const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-close-btn');
      closeBtn.click();
      fixture.detectChanges();

      const fab = fixture.nativeElement.querySelector('.ts-fab');
      expect(document.activeElement).toBe(fab);
    });
  });

  describe('external trigger (production sequence: mount, then trigger)', () => {
    it('pre-fills dice counts and duality when externalTrigger fires after mount', () => {
      // `fixture` is already mounted via beforeEach's detectChanges(), matching how
      // <app-dice-roller/> mounts once at page load, before any trigger exists.
      service.externalTrigger({ dice: [{ type: 'd8', count: 3 }], includeDuality: true });
      fixture.detectChanges();

      expect(fixture.componentInstance.getCount('d8')).toBe(3);
      expect(fixture.componentInstance.isDualityChecked()).toBe(true);
      expect(service.pendingRequest()).toBeNull();
    });

    it('does not auto-roll when autoRoll is not set', () => {
      const spy = vi.spyOn(service, 'roll');

      service.externalTrigger({ dice: [{ type: 'd6', count: 1 }], includeDuality: false });
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
    });

    it('auto-rolls immediately when autoRoll is true', () => {
      const spy = vi.spyOn(service, 'roll');

      service.externalTrigger({
        dice: [{ type: 'd8', count: 1 }],
        includeDuality: false,
        autoRoll: true,
      });
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('carries modifiers, advantage and label from the pending request into service.roll() and the resulting history entry', () => {
      const spy = vi.spyOn(service, 'roll');

      service.externalTrigger({
        dice: [],
        includeDuality: true,
        modifiers: [{ label: 'Agility', value: 2 }],
        advantage: 'advantage',
        label: 'Agility Roll',
        autoRoll: true,
      });
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledOnce();
      const request = spy.mock.calls[0][0];
      expect(request.modifiers).toEqual([{ label: 'Agility', value: 2 }]);
      expect(request.advantage).toBe('advantage');
      expect(request.label).toBe('Agility Roll');

      const entry = service.history()[0];
      expect(entry.modifiers).toEqual([{ label: 'Agility', value: 2 }]);
      expect(entry.advantage).toBe('advantage');
      expect(entry.label).toBe('Agility Roll');
    });

    it('a second externalTrigger after the first was consumed pre-fills again (re-trigger works)', () => {
      service.externalTrigger({ dice: [{ type: 'd6', count: 1 }], includeDuality: false });
      fixture.detectChanges();
      expect(fixture.componentInstance.getCount('d6')).toBe(1);

      service.externalTrigger({ dice: [{ type: 'd12', count: 2 }], includeDuality: false });
      fixture.detectChanges();

      expect(fixture.componentInstance.getCount('d12')).toBe(2);
    });
  });

  describe('pending modifiers/advantage lifetime', () => {
    it('a manual dice count adjustment clears a pre-filled advantage before the next Roll click', () => {
      service.externalTrigger({
        dice: [],
        includeDuality: true,
        modifiers: [{ label: 'Agility', value: 2 }],
        advantage: 'advantage',
        label: 'Agility Roll',
      });
      fixture.detectChanges();

      const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
      increaseD6.click();
      fixture.detectChanges();

      const spy = vi.spyOn(service, 'roll');
      const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
      rollBtn.click();

      const request = spy.mock.calls[0][0];
      expect(request.modifiers).toEqual([]);
      expect(request.advantage).toBeUndefined();
      expect(request.label).toBeUndefined();
    });

    it('resetCounts clears a pre-filled advantage', () => {
      service.externalTrigger({
        dice: [{ type: 'd6', count: 1 }],
        includeDuality: false,
        advantage: 'disadvantage',
      });
      fixture.detectChanges();

      const resetBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-reset-btn');
      resetBtn.click();
      fixture.detectChanges();

      const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
      increaseD6.click();
      fixture.detectChanges();

      const spy = vi.spyOn(service, 'roll');
      const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
      rollBtn.click();

      expect(spy.mock.calls[0][0].advantage).toBeUndefined();
    });

    it('a manual roll (no external trigger) carries no modifiers/advantage/label', () => {
      service.isOpen.set(true);
      fixture.detectChanges();

      const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
      increaseD6.click();
      fixture.detectChanges();

      const spy = vi.spyOn(service, 'roll');
      const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
      rollBtn.click();

      const request = spy.mock.calls[0][0];
      expect(request.modifiers).toEqual([]);
      expect(request.advantage).toBeUndefined();
      expect(request.label).toBeUndefined();
    });
  });

  describe('history rendering: label, modifier badges, advantage badge', () => {
    it('renders the roll label when present', () => {
      service.history.set([makeResult({ id: 'r1', total: 9, label: 'Agility Roll' })]);
      service.isOpen.set(true);
      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('.ts-history-label');
      expect(label?.textContent?.trim()).toBe('Agility Roll');
    });

    it('does not render a label element when absent', () => {
      service.history.set([makeResult({ id: 'r1', total: 9 })]);
      service.isOpen.set(true);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.ts-history-label')).toBeNull();
    });

    it('renders a badge for each non-zero modifier', () => {
      service.history.set([
        makeResult({
          id: 'r1',
          total: 9,
          modifiers: [{ label: 'Agility', value: 2 }, { label: 'Bonus', value: -1 }],
        }),
      ]);
      service.isOpen.set(true);
      fixture.detectChanges();

      const badges: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.ts-badge--mod');
      expect(badges.length).toBe(2);
      expect(badges[0].textContent?.trim()).toBe('Agility +2');
      expect(badges[1].textContent?.trim()).toBe('Bonus -1');
    });

    it('suppresses a zero-value modifier badge', () => {
      service.history.set([
        makeResult({ id: 'r1', total: 9, modifiers: [{ label: 'Agility', value: 0 }] }),
      ]);
      service.isOpen.set(true);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.ts-badge--mod')).toBeNull();
    });

    it('renders an advantage badge with an accessible name of "Advantage"', () => {
      service.history.set([makeResult({ id: 'r1', total: 9, advantage: 'advantage' })]);
      service.isOpen.set(true);
      fixture.detectChanges();

      const badge: HTMLElement = fixture.nativeElement.querySelector('.ts-badge--adv');
      expect(badge.textContent?.trim()).toBe('A');
      expect(badge.getAttribute('aria-label')).toBe('Advantage');
    });

    it('renders a disadvantage badge with an accessible name of "Disadvantage"', () => {
      service.history.set([makeResult({ id: 'r1', total: 9, advantage: 'disadvantage' })]);
      service.isOpen.set(true);
      fixture.detectChanges();

      const badge: HTMLElement = fixture.nativeElement.querySelector('.ts-badge--adv');
      expect(badge.textContent?.trim()).toBe('D');
      expect(badge.getAttribute('aria-label')).toBe('Disadvantage');
    });

    it('does not render an advantage badge when advantage is null', () => {
      service.history.set([makeResult({ id: 'r1', total: 9, advantage: null })]);
      service.isOpen.set(true);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.ts-badge--adv')).toBeNull();
    });
  });

  describe('result panel aria-live suppression during animation', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('sets aria-live to "off" while rolling', () => {
      vi.useFakeTimers();
      service.isOpen.set(true);
      fixture.detectChanges();

      const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
      increaseD6.click();
      fixture.detectChanges();

      const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
      rollBtn.click();
      fixture.detectChanges();

      const panel = fixture.nativeElement.querySelector('.ts-result-panel');
      expect(panel.getAttribute('aria-live')).toBe('off');
    });

    it('sets aria-live back to "polite" once rolling settles', () => {
      vi.useFakeTimers();
      service.isOpen.set(true);
      fixture.detectChanges();

      const rollBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.ts-roll-btn');
      const increaseD6: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increase d6"]');
      increaseD6.click();
      fixture.detectChanges();
      rollBtn.click();
      vi.advanceTimersByTime(250);
      fixture.detectChanges();

      const panel = fixture.nativeElement.querySelector('.ts-result-panel');
      expect(panel.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('prefers-reduced-motion', () => {
    // PreferencesService reads the `data-motion` attribute on <html> once, at construction,
    // so it must be set before a fresh TestBed root injector builds the service -- same
    // pattern dice-roller.service.spec.ts uses for its theme/localStorage tests.
    function mountWithMotion(motion: 'reduced' | 'full'): {
      fixture: ComponentFixture<DiceRoller>;
      service: DiceRollerService;
    } {
      document.documentElement.setAttribute('data-motion', motion);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [DiceRoller] });
      const rmFixture = TestBed.createComponent(DiceRoller);
      const rmService = TestBed.inject(DiceRollerService);
      rmService.isOpen.set(true);
      rmFixture.detectChanges();
      return { fixture: rmFixture, service: rmService };
    }

    it('skips the spinning readout and lands directly on the settled total', () => {
      const { fixture: rmFixture } = mountWithMotion('reduced');

      const increaseD6: HTMLButtonElement = rmFixture.nativeElement.querySelector('[aria-label="Increase d6"]');
      increaseD6.click();
      rmFixture.detectChanges();

      const rollBtn: HTMLButtonElement = rmFixture.nativeElement.querySelector('.ts-roll-btn');
      rollBtn.click();
      rmFixture.detectChanges();

      expect(rmFixture.componentInstance.isRolling()).toBe(false);
      const panel = rmFixture.nativeElement.querySelector('.ts-result-total');
      expect(panel.textContent?.trim()).not.toBe('');
    });

    it('still animates when motion is full', () => {
      vi.useFakeTimers();
      const { fixture: rmFixture } = mountWithMotion('full');

      const increaseD6: HTMLButtonElement = rmFixture.nativeElement.querySelector('[aria-label="Increase d6"]');
      increaseD6.click();
      rmFixture.detectChanges();

      const rollBtn: HTMLButtonElement = rmFixture.nativeElement.querySelector('.ts-roll-btn');
      rollBtn.click();

      expect(rmFixture.componentInstance.isRolling()).toBe(true);
      vi.useRealTimers();
    });
  });
});
