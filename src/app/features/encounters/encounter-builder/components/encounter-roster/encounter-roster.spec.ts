import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EncounterRoster } from './encounter-roster';
import { EncounterRosterInstance } from '../../models/encounter-roster-instance.model';

function buildInstance(overrides: Partial<EncounterRosterInstance> = {}): EncounterRosterInstance {
  return {
    localId: 'a',
    adversaryId: 1,
    adversary: { id: 1, name: 'Goblin Scout', tier: 1, adversaryType: 'MINION' },
    displayOrder: 0,
    ...overrides,
  };
}

describe('EncounterRoster', () => {
  let fixture: ComponentFixture<EncounterRoster>;
  let component: EncounterRoster;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EncounterRoster] });
    fixture = TestBed.createComponent(EncounterRoster);
    component = fixture.componentInstance;
  });

  it('shows the empty state when there are no instances', () => {
    fixture.componentRef.setInput('instances', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.roster-panel__empty')).toBeTruthy();
  });

  it('renders one adversary card per instance', () => {
    fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' }), buildInstance({ localId: 'b' })]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-adversary-card')).toHaveLength(2);
  });

  it('emits removeInstance with the localId when the remove button is clicked', () => {
    fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' })]);
    fixture.detectChanges();
    let removed: string | undefined;
    component.removeInstance.subscribe(id => (removed = id));

    fixture.nativeElement.querySelector('.roster-panel__remove-btn').click();

    expect(removed).toBe('a');
  });

  it('emits retierInstance with the selected tier', () => {
    fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a' })]);
    fixture.detectChanges();
    let event: { localId: string; tier: number | undefined } | undefined;
    component.retierInstance.subscribe(e => (event = e));

    component.onRetierChange('a', { target: { value: '3' } } as unknown as Event);

    expect(event).toEqual({ localId: 'a', tier: 3 });
  });

  it('emits retierInstance with undefined tier when cleared back to the printed tier', () => {
    let event: { localId: string; tier: number | undefined } | undefined;
    component.retierInstance.subscribe(e => (event = e));

    component.onRetierChange('a', { target: { value: '' } } as unknown as Event);

    expect(event).toEqual({ localId: 'a', tier: undefined });
  });

  it('emits labelChange with the typed nickname', () => {
    let event: { localId: string; label: string } | undefined;
    component.labelChange.subscribe(e => (event = e));

    component.onLabelInput('a', { target: { value: 'Archer A' } } as unknown as Event);

    expect(event).toEqual({ localId: 'a', label: 'Archer A' });
  });

  it('passes tierOverride as effectiveTier to the adversary card', () => {
    fixture.componentRef.setInput('instances', [buildInstance({ localId: 'a', tierOverride: 3 })]);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('app-adversary-card');
    expect(card.textContent).toContain('Retiered from Tier 1');
  });
});
