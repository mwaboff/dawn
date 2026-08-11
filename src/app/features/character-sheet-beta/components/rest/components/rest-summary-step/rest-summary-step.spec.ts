import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { RestSummaryStep } from './rest-summary-step';
import { RestOutcome, RestSummaryLine } from '../../models/rest.model';

function outcome(summary: RestSummaryLine[], restType: RestOutcome['restType'] = 'short'): RestOutcome {
  return {
    restType,
    summary,
    unchanged: summary.length === 0,
    nextState: {} as RestOutcome['nextState'],
    changes: {} as RestOutcome['changes'],
  };
}

const CLEARED: RestSummaryLine = {
  moveKey: 'k1',
  title: 'Tend to Wounds',
  detail: 'rolled 3 + tier 2 = 5, cleared all 4 of your marked HP',
  noChange: false,
};

const SPENT_FOR_NOTHING: RestSummaryLine = {
  moveKey: 'k2',
  title: 'Work on a Project',
  detail: 'you spent the downtime on your project — nothing on the sheet changed',
  noChange: true,
};

describe('RestSummaryStep', () => {
  let fixture: ComponentFixture<RestSummaryStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RestSummaryStep] }).compileComponents();
    fixture = TestBed.createComponent(RestSummaryStep);
    fixture.componentRef.setInput('outcome', outcome([CLEARED, SPENT_FOR_NOTHING]));
    fixture.detectChanges();
  });

  function lines(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.rest-summary__line'));
  }

  it('should render one row per summary line', () => {
    expect(lines()).toHaveLength(2);
  });

  it('should print the plain-language detail', () => {
    expect(lines()[0].textContent).toContain('rolled 3 + tier 2 = 5, cleared all 4 of your marked HP');
  });

  it('should mark a line that moved nothing', () => {
    expect(lines()[1].classList).toContain('rest-summary__line--no-change');
  });

  it('should not mark a line that moved something', () => {
    expect(lines()[0].classList).not.toContain('rest-summary__line--no-change');
  });

  it('should title the summary by rest type', () => {
    fixture.componentRef.setInput('outcome', outcome([CLEARED], 'long'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.rest-step__heading').textContent).toContain('Long rest');
  });

  it('should explain an empty rest rather than showing a bare list', () => {
    fixture.componentRef.setInput('outcome', outcome([]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('You rested and took no downtime moves.');
  });

  it('should always remind the player about loadout swaps', () => {
    expect(fixture.nativeElement.querySelector('.rest-step__note')).not.toBeNull();
  });
});
