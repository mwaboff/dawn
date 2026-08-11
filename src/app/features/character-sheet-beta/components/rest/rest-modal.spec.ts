import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RestModal } from './rest-modal';
import { DiceRollerService } from '../../../../core/services/dice-roller.service';
import { RestCharacterState, RestMoveAccess, RestOutcome } from './models/rest.model';

const STATE: RestCharacterState = {
  tier: 2,
  hitPointMarked: 4,
  stressMarked: 3,
  armorMarked: 2,
  hopeHeld: 1,
  hopeCap: 6,
  focusHeld: 0,
  focusMax: 6,
  favor: 3,
  spellcastTrait: null,
  spellcastTraitName: null,
  instinct: 3,
  wolfFormActive: false,
};

const NO_ACCESS: RestMoveAccess = { warlockResources: false, martialStances: false };

/** Always rolls 1s, so every assertion about a roll is deterministic. */
const diceStub = {
  roll: vi.fn(() => ({ diceResults: [{ type: 'd4', value: 1 }] })),
};

describe('RestModal', () => {
  let fixture: ComponentFixture<RestModal>;

  beforeEach(async () => {
    diceStub.roll.mockClear();
    await TestBed.configureTestingModule({
      imports: [RestModal],
      providers: [{ provide: DiceRollerService, useValue: diceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(RestModal);
    fixture.componentRef.setInput('state', STATE);
    fixture.componentRef.setInput('access', NO_ACCESS);
    fixture.detectChanges();
  });

  function title(): string {
    return fixture.nativeElement.querySelector('.dialog-title').textContent.trim();
  }

  function actionButton(label: string): HTMLButtonElement | undefined {
    return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('.dialog-btn')).find(
      button => button.textContent?.trim().startsWith(label),
    );
  }

  function chooseShortRest(): void {
    fixture.nativeElement.querySelectorAll('.rest-plate')[0].click();
    fixture.detectChanges();
  }

  function addFirstMove(): void {
    fixture.nativeElement.querySelectorAll('.rest-catalogue__add')[0].click();
    fixture.detectChanges();
  }

  it('should open on the rest type step', () => {
    expect(fixture.nativeElement.querySelector('app-rest-type-step')).not.toBeNull();
  });

  it('should title the first step', () => {
    expect(title()).toBe('Take a rest');
  });

  it('should move to the moves step once a rest type is chosen', () => {
    chooseShortRest();

    expect(fixture.nativeElement.querySelector('app-rest-moves-step')).not.toBeNull();
  });

  it('should retitle the dialog for the chosen rest', () => {
    chooseShortRest();

    expect(title()).toBe('Short rest');
  });

  it('should return to the first step on Back', () => {
    chooseShortRest();

    actionButton('Back')!.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-rest-type-step')).not.toBeNull();
  });

  it('should discard chosen moves on Back', () => {
    chooseShortRest();
    addFirstMove();

    actionButton('Back')!.click();
    fixture.detectChanges();
    chooseShortRest();

    expect(fixture.nativeElement.querySelector('.rest-tray__count').textContent).toContain('0 of 2');
  });

  it('should emit an outcome built from the chosen moves', () => {
    let outcome: RestOutcome | undefined;
    fixture.componentInstance.submitted.subscribe(value => (outcome = value));
    chooseShortRest();
    addFirstMove();

    actionButton('Take the rest')!.click();

    expect(outcome?.changes.hitPointMarked).toBe(1);
  });

  it('should roll through the headless dice service', () => {
    chooseShortRest();
    addFirstMove();

    actionButton('Take the rest')!.click();

    expect(diceStub.roll).toHaveBeenCalledWith(
      expect.objectContaining({ includeDuality: false, label: 'Downtime' }),
    );
  });

  it('should let a rest be taken with no moves chosen', () => {
    chooseShortRest();

    expect(actionButton('Take the rest')!.disabled).toBe(false);
  });

  it('should not show the summary until the host confirms the save', () => {
    chooseShortRest();
    addFirstMove();
    actionButton('Take the rest')!.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-rest-summary-step')).toBeNull();
  });

  it('should show the summary once the host confirms the save', () => {
    chooseShortRest();
    addFirstMove();
    actionButton('Take the rest')!.click();

    fixture.componentRef.setInput('applyResult', { status: 'saved' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-rest-summary-step')).not.toBeNull();
  });

  it('should stay on the moves step when the save fails', () => {
    chooseShortRest();
    addFirstMove();
    actionButton('Take the rest')!.click();

    fixture.componentRef.setInput('applyResult', { status: 'error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-rest-moves-step')).not.toBeNull();
  });

  it('should explain a failed save', () => {
    chooseShortRest();
    fixture.componentRef.setInput('applyResult', { status: 'error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Nothing on your sheet changed',
    );
  });

  /* aria-disabled, not the disabled attribute: a submit that disables itself mid-request would be
     blurred by the browser, dropping focus to <body> outside the dialog's trap. */
  it('should mark submitting unavailable while a save is in flight', () => {
    chooseShortRest();
    fixture.componentRef.setInput('processing', true);
    fixture.detectChanges();

    expect(actionButton('Resting')!.getAttribute('aria-disabled')).toBe('true');
  });

  it('should keep the submit button focusable while a save is in flight', () => {
    chooseShortRest();
    fixture.componentRef.setInput('processing', true);
    fixture.detectChanges();

    expect(actionButton('Resting')!.hasAttribute('disabled')).toBe(false);
  });

  it('should ignore Back while a save is in flight', () => {
    chooseShortRest();
    fixture.componentRef.setInput('processing', true);
    fixture.detectChanges();

    actionButton('Back')!.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-rest-moves-step')).not.toBeNull();
  });

  it('should not re-submit while a save is in flight', () => {
    chooseShortRest();
    addFirstMove();
    fixture.componentRef.setInput('processing', true);
    fixture.detectChanges();
    let emissions = 0;
    fixture.componentInstance.submitted.subscribe(() => (emissions += 1));

    fixture.componentInstance['submit']();

    expect(emissions).toBe(0);
  });

  it('should offer a long-rest move on a short rest once substitution is on', () => {
    chooseShortRest();

    fixture.nativeElement.querySelector('.rest-toggle input').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tend to All Wounds');
  });

  it('should raise the move budget', () => {
    chooseShortRest();

    fixture.nativeElement.querySelector('[aria-label="One more slot"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.rest-tray__count').textContent).toContain('0 of 3');
  });

  it('should drop a chosen move when the budget shrinks below it', () => {
    chooseShortRest();
    addFirstMove();
    addFirstMove();
    fixture.nativeElement.querySelector('[aria-label="One more slot"]').click();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[aria-label="One fewer slot"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.rest-tray__count').textContent).toContain('2 of 2');
  });

  it('should emit dismissal from Cancel', () => {
    let dismissed = false;
    fixture.componentInstance.dismissed.subscribe(() => (dismissed = true));

    actionButton('Cancel')!.click();

    expect(dismissed).toBe(true);
  });

  it('should emit dismissal from Done on the summary', () => {
    chooseShortRest();
    actionButton('Take the rest')!.click();
    fixture.componentRef.setInput('applyResult', { status: 'saved' });
    fixture.detectChanges();
    let dismissed = false;
    fixture.componentInstance.dismissed.subscribe(() => (dismissed = true));

    actionButton('Done')!.click();

    expect(dismissed).toBe(true);
  });

  /* The step itself is announced by the heading taking focus; the live region carries what the
     tray did, which has no other carrier. */
  it('should announce an added move and the new count', () => {
    chooseShortRest();

    addFirstMove();

    expect(fixture.nativeElement.querySelector('[aria-live="polite"]').textContent).toContain(
      'Tend to Wounds added. 1 of 2 chosen.',
    );
  });

  it('should announce a removed move and the new count', () => {
    chooseShortRest();
    addFirstMove();

    fixture.nativeElement.querySelector('.rest-chip__remove').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-live="polite"]').textContent).toContain(
      'Tend to Wounds removed. 0 of 2 chosen.',
    );
  });

  it('should say nothing before anything has happened', () => {
    expect(fixture.nativeElement.querySelector('[aria-live="polite"]').textContent.trim()).toBe('');
  });
});
