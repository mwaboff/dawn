import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { GoldTracker } from './gold-tracker';

@Component({
  template: `<app-gold-tracker [currentGold]="gold()" (adjustGold)="lastAdjustment = $event" />`,
  imports: [GoldTracker],
})
class TestHost {
  gold = signal(50);
  lastAdjustment: number | null = null;
}

describe('GoldTracker', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
    });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('creates the component', () => {
    expect(el.querySelector('app-gold-tracker')).toBeTruthy();
  });

  it('displays the current gold value', () => {
    expect(el.querySelector('.gold-total__value')?.textContent?.trim()).toBe('50');
  });

  it('applies negative class when gold is below zero', () => {
    host.gold.set(-10);
    fixture.detectChanges();

    expect(el.querySelector('.gold-total__value--negative')).toBeTruthy();
  });

  it('does not apply negative class when gold is positive', () => {
    expect(el.querySelector('.gold-total__value--negative')).toBeFalsy();
  });

  it('renders six gold buttons', () => {
    expect(el.querySelectorAll('.gold-btn').length).toBe(6);
  });

  it('emits +1 when handful add button is clicked', () => {
    const addButtons = el.querySelectorAll<HTMLButtonElement>('.gold-btn--add');
    addButtons[0].click();

    expect(host.lastAdjustment).toBe(1);
  });

  it('emits -1 when handful subtract button is clicked', () => {
    const subtractButtons = el.querySelectorAll<HTMLButtonElement>('.gold-btn--subtract');
    subtractButtons[0].click();

    expect(host.lastAdjustment).toBe(-1);
  });

  it('emits +10 when bag add button is clicked', () => {
    const addButtons = el.querySelectorAll<HTMLButtonElement>('.gold-btn--add');
    addButtons[1].click();

    expect(host.lastAdjustment).toBe(10);
  });

  it('emits +100 when chest add button is clicked', () => {
    const addButtons = el.querySelectorAll<HTMLButtonElement>('.gold-btn--add');
    addButtons[2].click();

    expect(host.lastAdjustment).toBe(100);
  });

  it('renders three denomination rows', () => {
    expect(el.querySelectorAll('.gold-denomination').length).toBe(3);
  });
});
