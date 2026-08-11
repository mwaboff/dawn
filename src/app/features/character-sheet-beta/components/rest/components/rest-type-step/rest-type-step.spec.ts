import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { RestTypeStep } from './rest-type-step';
import { RestType } from '../../models/rest.model';

describe('RestTypeStep', () => {
  let fixture: ComponentFixture<RestTypeStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RestTypeStep] }).compileComponents();
    fixture = TestBed.createComponent(RestTypeStep);
    fixture.componentRef.setInput('tier', 2);
    fixture.detectChanges();
  });

  function plates(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.rest-plate'));
  }

  it('should offer exactly two choices', () => {
    expect(plates()).toHaveLength(2);
  });

  it('should emit short for the first plate', () => {
    let chosen: RestType | undefined;
    fixture.componentInstance.chosen.subscribe(value => (chosen = value));

    plates()[0].click();

    expect(chosen).toBe('short');
  });

  it('should emit long for the second plate', () => {
    let chosen: RestType | undefined;
    fixture.componentInstance.chosen.subscribe(value => (chosen = value));

    plates()[1].click();

    expect(chosen).toBe('long');
  });

  it('should print the character’s real tier on the short rest plate', () => {
    expect(plates()[0].textContent).toContain('1d4 + your tier (2)');
  });

  it('should say the long rest needs no roll', () => {
    expect(plates()[1].textContent).toContain('no roll');
  });

  it('should remind the player that card swaps come first', () => {
    expect(fixture.nativeElement.querySelector('.rest-step__note').textContent).toContain(
      'before you take any downtime moves',
    );
  });
});
