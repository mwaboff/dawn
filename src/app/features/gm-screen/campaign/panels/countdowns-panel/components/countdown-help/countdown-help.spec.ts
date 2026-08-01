import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CountdownHelp } from './countdown-help';

describe('CountdownHelp', () => {
  let fixture: ComponentFixture<CountdownHelp>;
  let component: CountdownHelp;

  function open(): void {
    component.toggle();
    fixture.detectChanges();
  }

  function text(): string {
    return fixture.nativeElement.textContent;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [CountdownHelp] });
    fixture = TestBed.createComponent(CountdownHelp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts collapsed', () => {
    expect(fixture.nativeElement.querySelector('.cd-help')).toBeNull();
  });

  it('marks the toggle as collapsed for assistive tech', () => {
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.cd-help__toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('expands when the toggle is clicked', () => {
    fixture.nativeElement.querySelector('.cd-help__toggle').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.cd-help')).not.toBeNull();
  });

  it('collapses again on a second toggle', () => {
    open();
    open();

    expect(fixture.nativeElement.querySelector('.cd-help')).toBeNull();
  });

  it('shows the dynamic advancement table', () => {
    open();
    expect(fixture.nativeElement.querySelector('.gm-panel__table')).not.toBeNull();
  });

  it('gives the three design elements a GM has to decide', () => {
    open();
    expect(text()).toContain('Activation');
    expect(text()).toContain('Advancement');
    expect(text()).toContain('Effect');
  });

  it('gives starting-value guidance', () => {
    open();
    expect(text()).toContain('2–4');
    expect(text()).toContain('5–10');
  });

  it('explains how to set up a chase', () => {
    open();
    expect(text()).toContain('Running a chase');
  });

  it('gives the three chase head-start offsets', () => {
    open();
    expect(text()).toContain('1 lower');
    expect(text()).toContain('3 lower');
    expect(text()).toContain('5 lower');
  });

  it('says a success with Fear advances both chase countdowns', () => {
    open();
    expect(text()).toContain('success with Fear moves both');
  });
});
