import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { PrayerDiceRollSummary, PrayerDiceTracker } from './prayer-dice-tracker';
import { PrayerDie } from '../../../create-character/models/character-sheet-api.model';

@Component({
  imports: [PrayerDiceTracker],
  template: `
    <app-prayer-dice-tracker
      [dice]="dice()"
      [traitName]="traitName()"
      [traitValue]="traitValue()"
      [readonly]="readonly()"
      [showDevout]="showDevout()"
      [useDevout]="useDevout()"
      [lastRoll]="lastRoll()"
      (dieToggled)="onDieToggled($event)"
      (rollRequested)="onRollRequested()"
      (useDevoutChange)="onUseDevoutChange($event)"
    />
  `,
})
class TestHost {
  dice = signal<readonly PrayerDie[]>([]);
  traitName = signal<string | null>('STRENGTH');
  traitValue = signal(3);
  readonly = signal(false);
  showDevout = signal(false);
  useDevout = signal(true);
  lastRoll = signal<PrayerDiceRollSummary | null>(null);

  toggledIndex: number | null = null;
  rollCount = 0;
  devoutChanges: boolean[] = [];

  onDieToggled(index: number): void {
    this.toggledIndex = index;
  }

  onRollRequested(): void {
    this.rollCount += 1;
  }

  onUseDevoutChange(use: boolean): void {
    this.devoutChanges.push(use);
  }
}

describe('PrayerDiceTracker', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  const READY_AND_SPENT: PrayerDie[] = [
    { value: 3, spent: false },
    { value: 1, spent: true },
    { value: 4, spent: false },
  ];

  function dieButtons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.prayer-die'));
  }

  function rollButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('.prayer-dice__roll');
  }

  function text(selector: string): string {
    return (fixture.nativeElement.querySelector(selector)?.textContent ?? '').trim();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render one die per value', () => {
    host.dice.set(READY_AND_SPENT);
    fixture.detectChanges();

    expect(dieButtons().length).toBe(3);
  });

  it('should show each die its rolled face value', () => {
    host.dice.set(READY_AND_SPENT);
    fixture.detectChanges();

    const values = dieButtons().map(b => b.querySelector('.prayer-die__value')?.textContent?.trim());
    expect(values).toEqual(['3', '1', '4']);
  });

  it('should mark spent dice with the spent class', () => {
    host.dice.set(READY_AND_SPENT);
    fixture.detectChanges();

    expect(dieButtons()[1].classList.contains('prayer-die--spent')).toBe(true);
  });

  it('should not mark a ready die as spent', () => {
    host.dice.set(READY_AND_SPENT);
    fixture.detectChanges();

    expect(dieButtons()[0].classList.contains('prayer-die--spent')).toBe(false);
  });

  it('should name each die by position and value', () => {
    host.dice.set(READY_AND_SPENT);
    fixture.detectChanges();

    expect(dieButtons()[1].getAttribute('aria-label')).toBe('Prayer Die 2, value 1');
  });

  it('should keep a die name stable when it is spent, leaving state to aria-pressed', () => {
    host.dice.set([{ value: 3, spent: false }]);
    fixture.detectChanges();
    const before = dieButtons()[0].getAttribute('aria-label');

    host.dice.set([{ value: 3, spent: true }]);
    fixture.detectChanges();

    expect(dieButtons()[0].getAttribute('aria-label')).toBe(before);
  });

  it('should mark the dice up as a list for screen readers', () => {
    host.dice.set(READY_AND_SPENT);
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('.prayer-dice__list');
    expect(list.getAttribute('role')).toBe('list');
  });

  it('should expose spent state as aria-pressed', () => {
    host.dice.set(READY_AND_SPENT);
    fixture.detectChanges();

    expect(dieButtons()[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('should emit the index of a clicked die', () => {
    host.dice.set(READY_AND_SPENT);
    fixture.detectChanges();

    dieButtons()[2].click();

    expect(host.toggledIndex).toBe(2);
  });

  it('should report how many dice are ready', () => {
    host.dice.set(READY_AND_SPENT);
    fixture.detectChanges();

    expect(text('.prayer-dice__status')).toBe('2 of 3 ready — rolling again discards them');
  });

  it('should drop the reroll warning once every die is spent', () => {
    host.dice.set([{ value: 3, spent: true }]);
    fixture.detectChanges();

    expect(text('.prayer-dice__status')).toBe('0 of 1 ready');
  });

  it('should not warn a viewer who cannot roll', () => {
    host.dice.set(READY_AND_SPENT);
    host.readonly.set(true);
    fixture.detectChanges();

    expect(text('.prayer-dice__status')).toBe('2 of 3 ready');
  });

  it('should announce the rolled faces to screen readers', () => {
    host.dice.set([{ value: 3, spent: false }, { value: 1, spent: false }]);
    host.lastRoll.set({ rolledCount: 2, dropped: null });
    fixture.detectChanges();

    expect(text('.sr-only')).toBe('Rolled 2 Prayer Dice: 3, 1.');
  });

  it('should announce nothing before a roll has happened', () => {
    host.dice.set(READY_AND_SPENT);
    fixture.detectChanges();

    expect(text('.sr-only')).toBe('');
  });

  it('should keep the roll report inside a live region', () => {
    const region = fixture.nativeElement.querySelector('.prayer-dice__report');

    expect(region.getAttribute('aria-live')).toBe('polite');
  });

  it('should emit a roll request when the roll button is clicked', () => {
    rollButton()?.click();

    expect(host.rollCount).toBe(1);
  });

  it('should name what the roll button does for screen readers', () => {
    expect(rollButton()?.getAttribute('aria-label')).toBe('Roll Prayer Dice for a new session');
  });

  it('should warn that rolling discards the dice already on the sheet', () => {
    host.dice.set(READY_AND_SPENT);
    fixture.detectChanges();

    expect(rollButton()?.getAttribute('aria-label')).toBe(
      'Reroll Prayer Dice for a new session, discarding the 3 on your sheet',
    );
  });

  it('should caption the button Roll before any dice exist', () => {
    expect(text('.prayer-dice__roll-text')).toBe('Roll');
  });

  it('should caption the button Reroll once dice are on the sheet', () => {
    host.dice.set(READY_AND_SPENT);
    fixture.detectChanges();

    expect(text('.prayer-dice__roll-text')).toBe('Reroll');
  });

  it('should open the accessible name with the visible caption, per Label in Name', () => {
    host.dice.set(READY_AND_SPENT);
    fixture.detectChanges();

    const caption = text('.prayer-dice__roll-text');
    expect(rollButton()?.getAttribute('aria-label')?.startsWith(caption)).toBe(true);
  });

  it('should hide the decorative glyph from screen readers', () => {
    const glyph = fixture.nativeElement.querySelector('.prayer-dice__roll-glyph');

    expect(glyph.getAttribute('aria-hidden')).toBe('true');
  });

  it('should carry the same warning as a hover title', () => {
    host.dice.set(READY_AND_SPENT);
    fixture.detectChanges();

    expect(rollButton()?.getAttribute('title')).toBe(rollButton()?.getAttribute('aria-label'));
  });

  it('should prompt an unrolled character to roll at the start of a session', () => {
    expect(text('.prayer-dice__empty')).toBe('Roll 3d4 at the start of a session.');
  });

  it('should use dice notation rather than a pluralized count of one', () => {
    host.traitValue.set(1);
    fixture.detectChanges();

    expect(text('.prayer-dice__empty')).toBe('Roll 1d4 at the start of a session.');
  });

  it('should not tell a read-only viewer to roll', () => {
    host.readonly.set(true);
    fixture.detectChanges();

    expect(text('.prayer-dice__empty')).toBe('No Prayer Dice rolled yet.');
  });

  it('should explain a subclass that grants no Spellcast trait at all', () => {
    host.traitName.set(null);
    host.traitValue.set(0);
    fixture.detectChanges();

    expect(text('.prayer-dice__empty')).toBe(
      'This subclass has no Spellcast trait, so it grants no Prayer Dice.',
    );
  });

  it('should explain a Spellcast trait too low to produce dice', () => {
    host.traitValue.set(0);
    fixture.detectChanges();

    expect(text('.prayer-dice__empty')).toBe(
      'Prayer Dice come from your Spellcast trait. At Strength +0 you roll none.',
    );
  });

  it('should format a negative Spellcast trait with its sign', () => {
    host.traitValue.set(-1);
    fixture.detectChanges();

    expect(text('.prayer-dice__empty')).toContain('Strength -1');
  });

  it('should hide the roll button when no dice can be rolled', () => {
    host.traitValue.set(0);
    fixture.detectChanges();

    expect(rollButton()).toBeNull();
  });

  it('should hide the roll button from a viewer who does not own the sheet', () => {
    host.readonly.set(true);
    fixture.detectChanges();

    expect(rollButton()).toBeNull();
  });

  it('should disable the dice for a viewer who does not own the sheet', () => {
    host.dice.set(READY_AND_SPENT);
    host.readonly.set(true);
    fixture.detectChanges();

    expect(dieButtons().every(b => b.disabled)).toBe(true);
  });

  it('should not emit a toggle for a readonly die', () => {
    host.dice.set(READY_AND_SPENT);
    host.readonly.set(true);
    fixture.detectChanges();

    dieButtons()[0].click();

    expect(host.toggledIndex).toBeNull();
  });

  it('should hide the Devout toggle for a character without the feature', () => {
    expect(fixture.nativeElement.querySelector('.prayer-dice__devout')).toBeNull();
  });

  it('should show the Devout toggle for a character with the feature', () => {
    host.showDevout.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.prayer-dice__devout')).not.toBeNull();
  });

  it('should check the Devout toggle by default', () => {
    host.showDevout.set(true);
    fixture.detectChanges();

    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('.prayer-dice__devout input');
    expect(checkbox.checked).toBe(true);
  });

  it('should emit when the Devout toggle is unchecked', () => {
    host.showDevout.set(true);
    fixture.detectChanges();
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('.prayer-dice__devout input');

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));

    expect(host.devoutChanges).toEqual([false]);
  });

  it('should report what Devout discarded after a roll', () => {
    host.lastRoll.set({ rolledCount: 4, dropped: 1 });
    fixture.detectChanges();

    expect(text('.prayer-dice__note')).toBe('Devout: rolled 4 dice, dropped the lowest (1).');
  });

  it('should size the Devout checkbox to the shared 24x24 hit target', () => {
    host.showDevout.set(true);
    fixture.detectChanges();
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('.prayer-dice__devout input');

    expect(checkbox.classList.contains('form-checkbox')).toBe(true);
  });

  it('should not report a dropped die when Devout was not applied', () => {
    host.lastRoll.set({ rolledCount: 3, dropped: null });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.prayer-dice__note')).toBeNull();
  });

  it('should name the actual trait when explaining a value too low to roll', () => {
    host.traitValue.set(0);
    fixture.detectChanges();

    expect(text('.prayer-dice__empty')).toBe(
      'Prayer Dice come from your Spellcast trait. At Strength +0 you roll none.',
    );
  });
});
