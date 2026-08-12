import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RestControl } from './rest-control';
import { DiceRollerService } from '../../../../core/services/dice-roller.service';
import { RestCharacterState, RestMoveAccess } from './models/rest.model';

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
  companions: [],
};

const NO_ACCESS: RestMoveAccess = { warlockResources: false, martialStances: false };

describe('RestControl', () => {
  let fixture: ComponentFixture<RestControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestControl],
      providers: [{ provide: DiceRollerService, useValue: { roll: vi.fn(() => ({ diceResults: [] })) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(RestControl);
    fixture.componentRef.setInput('state', STATE);
    fixture.componentRef.setInput('access', NO_ACCESS);
    fixture.detectChanges();
  });

  function button(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('.rest-btn');
  }

  function modal(): HTMLElement | null {
    return fixture.nativeElement.querySelector('app-rest-modal');
  }

  it('should render the Rest button', () => {
    expect(button()?.textContent).toContain('Rest');
  });

  it('should render no button before the sheet has loaded', () => {
    fixture.componentRef.setInput('state', null);
    fixture.detectChanges();

    expect(button()).toBeNull();
  });

  it('should not open the modal until the button is pressed', () => {
    expect(modal()).toBeNull();
  });

  it('should open the modal on click', () => {
    button()!.click();
    fixture.detectChanges();

    expect(modal()).not.toBeNull();
  });

  it('should close the modal when it dismisses', () => {
    button()!.click();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.dialog-btn--cancel').click();
    fixture.detectChanges();

    expect(modal()).toBeNull();
  });

  it('should tell the host when the modal closes, so it can clear the save result', () => {
    let closed = false;
    fixture.componentInstance.closed.subscribe(() => (closed = true));
    button()!.click();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.dialog-btn--cancel').click();

    expect(closed).toBe(true);
  });

  it('should refuse to close while a save is in flight', () => {
    button()!.click();
    fixture.detectChanges();
    fixture.componentRef.setInput('processing', true);
    fixture.detectChanges();

    fixture.componentInstance['onClose']();
    fixture.detectChanges();

    expect(modal()).not.toBeNull();
  });
});
