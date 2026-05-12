import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VariantSwitcher } from './variant-switcher';
import { DashboardVariant } from '../../models/dashboard.model';

@Component({
  template: `
    <app-variant-switcher
      [variant]="variant()"
      (variantChange)="lastChange = $event"
    />
  `,
  imports: [VariantSwitcher],
})
class TestHost {
  variant = signal<DashboardVariant>('ledger');
  lastChange: DashboardVariant | null = null;
}

describe('VariantSwitcher', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(el.querySelector('app-variant-switcher')).toBeTruthy();
  });

  it('should render three chips with correct labels', () => {
    const buttons = el.querySelectorAll('button');
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent?.trim()).toBe('Ledger');
    expect(buttons[1].textContent?.trim()).toBe('Sheet');
    expect(buttons[2].textContent?.trim()).toBe('War Table');
  });

  it('should set aria-pressed="true" on the active chip and false on others', () => {
    host.variant.set('sheet');
    fixture.detectChanges();
    const buttons = el.querySelectorAll('button');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('false');
  });

  it('should apply active class to the matching chip', () => {
    host.variant.set('ledger');
    fixture.detectChanges();
    const buttons = el.querySelectorAll('button');
    expect(buttons[0].classList.contains('variant-switcher__chip--active')).toBe(true);
    expect(buttons[1].classList.contains('variant-switcher__chip--active')).toBe(false);
    expect(buttons[2].classList.contains('variant-switcher__chip--active')).toBe(false);
  });

  it('should emit variantChange when an inactive chip is clicked', () => {
    host.variant.set('ledger');
    fixture.detectChanges();
    const buttons = el.querySelectorAll<HTMLButtonElement>('button');
    buttons[1].click();
    fixture.detectChanges();
    expect(host.lastChange).toBe('sheet');
  });

  it('should NOT emit when the already-active chip is clicked', () => {
    host.variant.set('ledger');
    fixture.detectChanges();
    const buttons = el.querySelectorAll<HTMLButtonElement>('button');
    buttons[0].click();
    fixture.detectChanges();
    expect(host.lastChange).toBeNull();
  });

  it('should render the "Preview" eyebrow label', () => {
    const eyebrow = el.querySelector('.variant-switcher__eyebrow');
    expect(eyebrow?.textContent?.trim()).toBe('Preview');
  });

  it('should emit the next variant on ArrowRight', () => {
    host.variant.set('ledger');
    fixture.detectChanges();
    const buttons = el.querySelectorAll<HTMLButtonElement>('button');
    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(host.lastChange).toBe('sheet');
  });

  it('should wrap from first to last on ArrowLeft', () => {
    host.variant.set('ledger');
    fixture.detectChanges();
    const buttons = el.querySelectorAll<HTMLButtonElement>('button');
    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(host.lastChange).toBe('war-table');
  });

  it('should wrap from last to first on ArrowRight', () => {
    host.variant.set('war-table');
    fixture.detectChanges();
    const buttons = el.querySelectorAll<HTMLButtonElement>('button');
    buttons[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(host.lastChange).toBe('ledger');
  });
});
