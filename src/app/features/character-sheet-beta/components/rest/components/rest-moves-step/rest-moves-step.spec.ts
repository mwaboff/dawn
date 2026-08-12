import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { RestMovesStep } from './rest-moves-step';
import { RestSelectionChip } from '../rest-selection-chip/rest-selection-chip';
import { movesForRest } from '../../utils/rest-catalog';
import { RestMoveDefinition, RestSelection } from '../../models/rest.model';

const SHORT_MOVES = movesForRest('short', { warlockResources: false, martialStances: false }, false);

function selection(moveId: RestSelection['moveId'], key = 'k1'): RestSelection {
  return { key, moveId, target: 'self', withParty: false };
}

describe('RestMovesStep', () => {
  let fixture: ComponentFixture<RestMovesStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RestMovesStep] }).compileComponents();
    fixture = TestBed.createComponent(RestMovesStep);
    fixture.componentRef.setInput('restType', 'short');
    fixture.componentRef.setInput('moves', SHORT_MOVES);
    fixture.componentRef.setInput('selections', []);
    fixture.componentRef.setInput('slots', 2);
    fixture.detectChanges();
  });

  function rows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.rest-catalogue__row'));
  }

  function addButtons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.rest-catalogue__add'));
  }

  function hollows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.rest-tray__hollow'));
  }

  it('should render one catalogue row per offered move', () => {
    expect(rows()).toHaveLength(SHORT_MOVES.length);
  });

  it('should show one hollow per unfilled slot', () => {
    expect(hollows()).toHaveLength(2);
  });

  it('should replace a hollow with a chip once a move is chosen', () => {
    fixture.componentRef.setInput('selections', [selection('tendToWounds')]);
    fixture.detectChanges();

    expect(hollows()).toHaveLength(1);
  });

  it('should render a chip per selection', () => {
    fixture.componentRef.setInput('selections', [selection('tendToWounds'), selection('prepare', 'k2')]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-rest-selection-chip')).toHaveLength(2);
  });

  it('should report progress against the slot count', () => {
    fixture.componentRef.setInput('selections', [selection('tendToWounds')]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.rest-tray__count').textContent).toContain('1 of 2 chosen');
  });

  it('should emit the move when its add button is pressed', () => {
    let added: RestMoveDefinition | undefined;
    fixture.componentInstance.moveAdded.subscribe(value => (added = value));

    addButtons()[0].click();

    expect(added?.id).toBe('tendToWounds');
  });

  /* aria-disabled, not the disabled attribute, so the button keeps its focus when the slot it
     just filled turns it off. */
  it('should mark adding unavailable once every slot is filled', () => {
    fixture.componentRef.setInput('selections', [selection('tendToWounds'), selection('prepare', 'k2')]);
    fixture.detectChanges();

    expect(addButtons().every(b => b.getAttribute('aria-disabled') === 'true')).toBe(true);
  });

  it('should not emit an add once every slot is filled', () => {
    fixture.componentRef.setInput('selections', [selection('tendToWounds'), selection('prepare', 'k2')]);
    fixture.detectChanges();
    let emissions = 0;
    fixture.componentInstance.moveAdded.subscribe(() => (emissions += 1));

    addButtons()[0].click();

    expect(emissions).toBe(0);
  });

  it('should emit the removed selection’s key', () => {
    fixture.componentRef.setInput('selections', [selection('tendToWounds')]);
    fixture.detectChanges();
    let removed: string | undefined;
    fixture.componentInstance.moveRemoved.subscribe(value => (removed = value));

    fixture.nativeElement.querySelector('.rest-chip__remove').click();

    expect(removed).toBe('k1');
  });

  it('should emit a target change carrying the selection key', () => {
    fixture.componentRef.setInput('selections', [selection('tendToWounds')]);
    fixture.detectChanges();
    let change: { key: string; target: string } | undefined;
    fixture.componentInstance.targetChanged.subscribe(value => (change = value));

    fixture.nativeElement.querySelectorAll('.rest-chip__choice')[1].click();

    expect(change).toEqual({ key: 'k1', target: 'ally' });
  });

  it('should offer the long-rest-move toggle on a short rest', () => {
    expect(fixture.nativeElement.querySelector('.rest-toggle')).not.toBeNull();
  });

  it('should hide the long-rest-move toggle on a long rest', () => {
    fixture.componentRef.setInput('restType', 'long');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.rest-toggle')).toBeNull();
  });

  it('should emit the slot delta when a move is added to the budget', () => {
    let delta: number | undefined;
    fixture.componentInstance.slotsChanged.subscribe(value => (delta = value));

    fixture.nativeElement.querySelector('[aria-label="One more slot"]').click();

    expect(delta).toBe(1);
  });

  it('should not allow the budget below the base two moves', () => {
    const button = fixture.nativeElement.querySelector('[aria-label="One fewer slot"]');

    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('should not emit a shrink at the base two moves', () => {
    let emissions = 0;
    fixture.componentInstance.slotsChanged.subscribe(() => (emissions += 1));

    fixture.nativeElement.querySelector('[aria-label="One fewer slot"]').click();

    expect(emissions).toBe(0);
  });

  it('should not allow the budget above the ceiling', () => {
    fixture.componentRef.setInput('slots', 6);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('[aria-label="One more slot"]');

    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  /* The rest type is named by the dialog's own title; the heading is the step eyebrow. */
  it('should mark itself as the second step', () => {
    expect(fixture.nativeElement.querySelector('.rest-step__heading').textContent).toContain('Step 2 of 3');
  });

  it('should hand each chip the definition matching its selection', () => {
    fixture.componentRef.setInput('selections', [selection('prepare')]);
    fixture.detectChanges();

    const chip = fixture.debugElement.query(By.directive(RestSelectionChip));

    expect(chip.componentInstance.definition().id).toBe('prepare');
  });

  /* The overwhelming majority of characters have no companion; their rest must not grow a block. */
  it('should offer no Creature Comfort block without a candidate companion', () => {
    expect(fixture.nativeElement.querySelector('app-rest-creature-comfort')).toBeFalsy();
  });

  it('should offer the Creature Comfort block once a companion qualifies', () => {
    fixture.componentRef.setInput('comfortCandidates', [
      { id: 1, name: 'Rex', stressMarked: 0, stressMax: 3, hasCreatureComfort: true },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-rest-creature-comfort')).toBeTruthy();
  });
});
