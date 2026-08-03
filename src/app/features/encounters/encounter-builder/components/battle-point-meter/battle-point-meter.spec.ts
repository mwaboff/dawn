import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BattlePointMeter } from './battle-point-meter';
import { EncounterRosterInstance } from '../../models/encounter-roster-instance.model';
import { BattlePointAdjustments } from '../../../../../shared/utils/battle-points.utils';

function buildInstance(overrides: Partial<EncounterRosterInstance> = {}): EncounterRosterInstance {
  return {
    localId: 'a',
    adversaryId: 1,
    adversary: { id: 1, name: 'Goblin Scout', tier: 1, adversaryType: 'MINION' },
    displayOrder: 0,
    ...overrides,
  };
}

describe('BattlePointMeter', () => {
  let fixture: ComponentFixture<BattlePointMeter>;
  let component: BattlePointMeter;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BattlePointMeter] });
    fixture = TestBed.createComponent(BattlePointMeter);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('instances', []);
    fixture.componentRef.setInput('partySize', 4);
    fixture.componentRef.setInput('adjustments', {});
  });

  it('computes the suggested budget from party size and adjustments', () => {
    fixture.detectChanges();
    expect(component.suggested()).toBe(14);
  });

  it('computes spent points from the roster via the shared calculator', () => {
    fixture.componentRef.setInput('instances', [buildInstance({ adversary: { id: 1, name: 'Bruiser', tier: 1, adversaryType: 'BRUISER' } })]);
    fixture.detectChanges();
    expect(component.spent()).toBe(4);
  });

  it('flags over-budget when spent exceeds suggested', () => {
    const instances = Array.from({ length: 4 }, (_, i) =>
      buildInstance({ localId: `s${i}`, adversary: { id: i, name: `Solo ${i}`, tier: 1, adversaryType: 'SOLO' } }),
    );
    fixture.componentRef.setInput('instances', instances);
    fixture.detectChanges();

    expect(component.spent()).toBe(20);
    expect(component.isOverBudget()).toBe(true);
    expect(fixture.nativeElement.querySelector('.meter--over')).toBeTruthy();
  });

  it('groups minions by party size rather than charging per-instance', () => {
    const instances = Array.from({ length: 5 }, (_, i) => buildInstance({ localId: `m${i}` }));
    fixture.componentRef.setInput('instances', instances);
    fixture.detectChanges();

    expect(component.minionCount()).toBe(5);
    expect(component.minionGroups()).toBe(2);
    expect(component.spent()).toBe(2);
  });

  it('shows the minion grouping note when minions are present', () => {
    fixture.componentRef.setInput('instances', [buildInstance()]);
    fixture.detectChanges();

    const note = fixture.nativeElement.querySelector('.meter__minion-note');
    expect(note.textContent).toContain('1 Minion');
    expect(note.textContent).toContain('1 group');
  });

  it('hides the minion grouping note when there are no minions', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.meter__minion-note')).toBeFalsy();
  });

  it('builds one segment per non-minion instance plus one merged minion segment', () => {
    fixture.componentRef.setInput('instances', [
      buildInstance({ localId: 'b', adversary: { id: 2, name: 'Bruiser', tier: 1, adversaryType: 'BRUISER' } }),
      buildInstance({ localId: 'm1' }),
      buildInstance({ localId: 'm2' }),
    ]);
    fixture.detectChanges();

    expect(component.segments()).toHaveLength(2);
    expect(component.segments().find(s => s.kind === 'minion')?.costPoints).toBe(1);
  });

  it('emits partySizeChange for a valid positive number', () => {
    let emitted: number | undefined;
    component.partySizeChange.subscribe(v => (emitted = v));

    component.onPartySizeInput({ target: { value: '6' } } as unknown as Event);

    expect(emitted).toBe(6);
  });

  it('does not emit partySizeChange for a non-positive value', () => {
    let emitted: number | undefined;
    component.partySizeChange.subscribe(v => (emitted = v));

    component.onPartySizeInput({ target: { value: '0' } } as unknown as Event);

    expect(emitted).toBeUndefined();
  });

  it('emits adjustmentsChange with the toggled key flipped', () => {
    fixture.componentRef.setInput('adjustments', { harder: true } as BattlePointAdjustments);
    let emitted: BattlePointAdjustments | undefined;
    component.adjustmentsChange.subscribe(v => (emitted = v));

    component.onAdjustmentToggle('easier');

    expect(emitted).toEqual({ harder: true, easier: true });
  });

  it('renders all six adjustment toggles', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.meter__adjustment')).toHaveLength(6);
  });
});
