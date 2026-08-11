import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { RestSelectionChip } from './rest-selection-chip';
import { REST_MOVES_BY_ID } from '../../utils/rest-catalog';
import { RestMoveTarget, RestSelection } from '../../models/rest.model';

const SELECTION: RestSelection = { key: 'k1', moveId: 'tendToWounds', target: 'self', withParty: false };

describe('RestSelectionChip', () => {
  let fixture: ComponentFixture<RestSelectionChip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RestSelectionChip] }).compileComponents();
    fixture = TestBed.createComponent(RestSelectionChip);
    fixture.componentRef.setInput('selection', SELECTION);
    fixture.componentRef.setInput('definition', REST_MOVES_BY_ID['tendToWounds']);
    fixture.detectChanges();
  });

  function choices(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.rest-chip__choice'));
  }

  it('should name the move', () => {
    expect(fixture.nativeElement.querySelector('.rest-chip__name').textContent).toContain('Tend to Wounds');
  });

  it('should offer self and ally for a targetable move', () => {
    expect(choices().map(button => button.textContent?.trim())).toEqual(['Myself', 'An ally']);
  });

  it('should mark the active target as pressed', () => {
    expect(choices()[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('should emit the new target when the other side is picked', () => {
    let target: RestMoveTarget | undefined;
    fixture.componentInstance.targetChanged.subscribe(value => (target = value));

    choices()[1].click();

    expect(target).toBe('ally');
  });

  it('should offer alone and with-the-party for Prepare', () => {
    fixture.componentRef.setInput('selection', { ...SELECTION, moveId: 'prepare' });
    fixture.componentRef.setInput('definition', REST_MOVES_BY_ID['prepare']);
    fixture.detectChanges();

    expect(choices().map(button => button.textContent?.trim())).toEqual(['Alone', 'With the party']);
  });

  it('should emit the party flag for Prepare', () => {
    fixture.componentRef.setInput('selection', { ...SELECTION, moveId: 'prepare' });
    fixture.componentRef.setInput('definition', REST_MOVES_BY_ID['prepare']);
    fixture.detectChanges();
    let withParty: boolean | undefined;
    fixture.componentInstance.withPartyChanged.subscribe(value => (withParty = value));

    choices()[1].click();

    expect(withParty).toBe(true);
  });

  it('should offer no options for a move that has none', () => {
    fixture.componentRef.setInput('selection', { ...SELECTION, moveId: 'clearStress' });
    fixture.componentRef.setInput('definition', REST_MOVES_BY_ID['clearStress']);
    fixture.detectChanges();

    expect(choices()).toHaveLength(0);
  });

  it('should emit removal', () => {
    let removed = false;
    fixture.componentInstance.removed.subscribe(() => (removed = true));

    fixture.nativeElement.querySelector('.rest-chip__remove').click();

    expect(removed).toBe(true);
  });

  it('should name the move in the remove button’s label', () => {
    expect(fixture.nativeElement.querySelector('.rest-chip__remove').getAttribute('aria-label')).toBe(
      'Remove Tend to Wounds',
    );
  });
});
