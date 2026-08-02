import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ConfirmDialog } from './confirm-dialog';

@Component({
  template: `
    <button class="opener-btn" (click)="open.set(true)">Delete</button>
    @if (open()) {
      <app-confirm-dialog
        title="Delete item"
        message="This cannot be undone."
        [processing]="processing()"
        (confirmed)="onConfirmed()"
        (cancelled)="onCancelled()"
      />
    }
  `,
  imports: [ConfirmDialog],
})
class TestHost {
  readonly open = signal(false);
  readonly processing = signal(false);
  confirmedCount = 0;
  cancelledCount = 0;

  onConfirmed(): void {
    this.confirmedCount++;
    this.open.set(false);
  }

  onCancelled(): void {
    this.cancelledCount++;
    this.open.set(false);
  }
}

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  it('renders the title and message', () => {
    host.open.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.dialog-title')?.textContent?.trim()).toBe('Delete item');
    expect(el.querySelector('.dialog-message')?.textContent?.trim()).toBe(
      'This cannot be undone.',
    );
  });

  it('emits confirmed when the confirm button is clicked', () => {
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.dialog-btn--confirm')!.click();

    expect(host.confirmedCount).toBe(1);
  });

  it('emits cancelled when the cancel button is clicked', () => {
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.dialog-btn--cancel')!.click();

    expect(host.cancelledCount).toBe(1);
  });

  it('emits cancelled when the backdrop is clicked directly', () => {
    host.open.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLElement>('.dialog-backdrop')!.click();

    expect(host.cancelledCount).toBe(1);
  });

  describe('focus management', () => {
    it('focuses the cancel button (first focusable) on open', () => {
      host.open.set(true);
      fixture.detectChanges();

      const cancelBtn = el.querySelector('.dialog-btn--cancel');
      expect(document.activeElement).toBe(cancelBtn);
    });

    it('returns focus to the opener button when closed', () => {
      const opener = el.querySelector<HTMLButtonElement>('.opener-btn')!;
      opener.focus();

      host.open.set(true);
      fixture.detectChanges();
      expect(document.activeElement).not.toBe(opener);

      host.open.set(false);
      fixture.detectChanges();
      expect(document.activeElement).toBe(opener);
    });

    it('traps Tab focus, cycling from the last button back to the first', () => {
      host.open.set(true);
      fixture.detectChanges();

      const cancelBtn = el.querySelector<HTMLButtonElement>('.dialog-btn--cancel')!;
      const confirmBtn = el.querySelector<HTMLButtonElement>('.dialog-btn--confirm')!;
      const backdrop = el.querySelector<HTMLElement>('.dialog-backdrop')!;
      confirmBtn.focus();

      backdrop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));

      expect(document.activeElement).toBe(cancelBtn);
    });
  });

  describe('Escape key', () => {
    it('emits cancelled on Escape', () => {
      host.open.set(true);
      fixture.detectChanges();

      const backdrop = el.querySelector<HTMLElement>('.dialog-backdrop')!;
      backdrop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(host.cancelledCount).toBe(1);
    });

    it('does not emit cancelled on Escape while processing', () => {
      host.processing.set(true);
      host.open.set(true);
      fixture.detectChanges();

      const backdrop = el.querySelector<HTMLElement>('.dialog-backdrop')!;
      backdrop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(host.cancelledCount).toBe(0);
    });
  });

  describe('processing state', () => {
    it('disables both buttons while processing', () => {
      host.processing.set(true);
      host.open.set(true);
      fixture.detectChanges();

      const cancelBtn = el.querySelector<HTMLButtonElement>('.dialog-btn--cancel')!;
      const confirmBtn = el.querySelector<HTMLButtonElement>('.dialog-btn--confirm')!;
      expect(cancelBtn.disabled).toBe(true);
      expect(confirmBtn.disabled).toBe(true);
    });

    it('shows "Processing..." on the confirm button while processing', () => {
      host.processing.set(true);
      host.open.set(true);
      fixture.detectChanges();

      const confirmBtn = el.querySelector<HTMLButtonElement>('.dialog-btn--confirm')!;
      expect(confirmBtn.textContent?.trim()).toBe('Processing...');
    });
  });

  describe('accessibility', () => {
    it('has role="dialog" and aria-modal="true"', () => {
      host.open.set(true);
      fixture.detectChanges();

      const backdrop = el.querySelector('.dialog-backdrop');
      expect(backdrop?.getAttribute('role')).toBe('dialog');
      expect(backdrop?.getAttribute('aria-modal')).toBe('true');
    });

    it('exposes the title via aria-label', () => {
      host.open.set(true);
      fixture.detectChanges();

      const backdrop = el.querySelector('.dialog-backdrop');
      expect(backdrop?.getAttribute('aria-label')).toBe('Delete item');
    });
  });
});
