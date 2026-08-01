import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CountdownResponse } from '../../../../../../../shared/models/countdown-api.model';
import { CountdownRow } from './countdown-row';

function countdown(overrides: Partial<CountdownResponse> = {}): CountdownResponse {
  return {
    id: 1,
    campaignId: 7,
    name: 'The ritual completes',
    type: 'CONSEQUENCE',
    loopBehavior: 'NONE',
    startingValue: 8,
    currentValue: 8,
    displayOrder: 0,
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

describe('CountdownRow', () => {
  let fixture: ComponentFixture<CountdownRow>;

  function setUp(value: CountdownResponse): void {
    fixture = TestBed.createComponent(CountdownRow);
    fixture.componentRef.setInput('countdown', value);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [CountdownRow] });
  });

  it('renders the countdown name', () => {
    setUp(countdown());
    expect(fixture.nativeElement.querySelector('.cd-row__name').textContent.trim()).toBe(
      'The ritual completes',
    );
  });

  it('renders current over starting value', () => {
    setUp(countdown({ currentValue: 5 }));
    expect(fixture.nativeElement.querySelector('.cd-row__value').textContent.trim()).toBe('5');
  });

  it('draws one segment per starting value', () => {
    setUp(countdown({ startingValue: 6, currentValue: 6 }));
    expect(fixture.nativeElement.querySelectorAll('.cd-row__segment').length).toBe(6);
  });

  it('fills only the remaining segments', () => {
    setUp(countdown({ startingValue: 6, currentValue: 2 }));
    expect(fixture.nativeElement.querySelectorAll('.cd-row__segment--filled').length).toBe(2);
  });

  it('shows the trigger line for the countdown type', () => {
    setUp(countdown({ type: 'LONG_TERM' }));
    expect(fixture.nativeElement.querySelector('.cd-row__trigger').textContent).toContain(
      'long rest',
    );
  });

  it('hides the loop badge for a non-looping countdown', () => {
    setUp(countdown({ loopBehavior: 'NONE' }));
    expect(fixture.nativeElement.querySelector('.cd-row__loop')).toBeNull();
  });

  it('shows the loop badge for a looping countdown', () => {
    setUp(countdown({ loopBehavior: 'LOOP_INCREASING' }));
    expect(fixture.nativeElement.querySelector('.cd-row__loop').textContent).toContain('+1');
  });

  it('disables tick down at zero', () => {
    setUp(countdown({ currentValue: 0 }));
    const decrement: HTMLButtonElement = fixture.nativeElement.querySelectorAll('.gm-panel__btn')[0];
    expect(decrement.disabled).toBe(true);
  });

  it('disables tick up at the starting value', () => {
    setUp(countdown({ currentValue: 8, startingValue: 8 }));
    const increment: HTMLButtonElement = fixture.nativeElement.querySelectorAll('.gm-panel__btn')[1];
    expect(increment.disabled).toBe(true);
  });

  it('announces a triggered countdown', () => {
    setUp(countdown({ currentValue: 0 }));
    expect(fixture.nativeElement.querySelector('.gm-panel__callout').textContent).toContain(
      'Triggered',
    );
  });

  it('emits the decremented value on tick down', () => {
    setUp(countdown({ currentValue: 5 }));
    let emitted: number | undefined;
    fixture.componentInstance.tick.subscribe((value: number) => (emitted = value));

    fixture.nativeElement.querySelectorAll('.gm-panel__btn')[0].click();

    expect(emitted).toBe(4);
  });

  it('emits the incremented value on tick up', () => {
    setUp(countdown({ currentValue: 5 }));
    let emitted: number | undefined;
    fixture.componentInstance.tick.subscribe((value: number) => (emitted = value));

    fixture.nativeElement.querySelectorAll('.gm-panel__btn')[1].click();

    expect(emitted).toBe(6);
  });

  it('renders the note when one is set', () => {
    setUp(countdown({ note: 'The gate opens' }));
    expect(fixture.nativeElement.querySelector('.cd-row__note').textContent.trim()).toBe(
      'The gate opens',
    );
  });
});
