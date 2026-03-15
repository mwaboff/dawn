import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { ConfirmDialog } from './confirm-dialog';

@Component({
  template: `
    <app-confirm-dialog
      [title]="title()"
      [message]="message()"
      [confirmLabel]="confirmLabel()"
      [cancelLabel]="cancelLabel()"
      [processing]="processing()"
      (confirmed)="onConfirmed()"
      (cancelled)="onCancelled()"
    />
  `,
  imports: [ConfirmDialog],
})
class TestHost {
  title = signal('Delete Character');
  message = signal('Are you sure you want to delete this character?');
  confirmLabel = signal('Confirm');
  cancelLabel = signal('Cancel');
  processing = signal(false);
  confirmedCount = 0;
  cancelledCount = 0;

  onConfirmed(): void {
    this.confirmedCount++;
  }

  onCancelled(): void {
    this.cancelledCount++;
  }
}

describe('ConfirmDialog', () => {
  let hostFixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHost);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('should create', () => {
    const dialog = hostFixture.nativeElement.querySelector('app-confirm-dialog');
    expect(dialog).toBeTruthy();
  });

  describe('Rendering', () => {
    it('should render the title', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('.dialog-title');
      expect(title?.textContent?.trim()).toBe('Delete Character');
    });

    it('should render the message', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const message = compiled.querySelector('.dialog-message');
      expect(message?.textContent?.trim()).toBe('Are you sure you want to delete this character?');
    });

    it('should render custom confirm label', () => {
      host.confirmLabel.set('Delete');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const confirmBtn = compiled.querySelector('.dialog-btn--confirm');
      expect(confirmBtn?.textContent?.trim()).toBe('Delete');
    });

    it('should render custom cancel label', () => {
      host.cancelLabel.set('Go Back');
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const cancelBtn = compiled.querySelector('.dialog-btn--cancel');
      expect(cancelBtn?.textContent?.trim()).toBe('Go Back');
    });

    it('should show "Processing..." when processing is true', () => {
      host.processing.set(true);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const confirmBtn = compiled.querySelector('.dialog-btn--confirm');
      expect(confirmBtn?.textContent?.trim()).toBe('Processing...');
    });
  });

  describe('Confirm Action', () => {
    it('should emit confirmed when confirm button is clicked', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const confirmBtn = compiled.querySelector('.dialog-btn--confirm') as HTMLButtonElement;

      confirmBtn.click();
      expect(host.confirmedCount).toBe(1);
    });

    it('should not emit confirmed when processing', () => {
      host.processing.set(true);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const confirmBtn = compiled.querySelector('.dialog-btn--confirm') as HTMLButtonElement;

      confirmBtn.click();
      expect(host.confirmedCount).toBe(0);
    });
  });

  describe('Cancel Action', () => {
    it('should emit cancelled when cancel button is clicked', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const cancelBtn = compiled.querySelector('.dialog-btn--cancel') as HTMLButtonElement;

      cancelBtn.click();
      expect(host.cancelledCount).toBe(1);
    });

    it('should not emit cancelled when processing', () => {
      host.processing.set(true);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const cancelBtn = compiled.querySelector('.dialog-btn--cancel') as HTMLButtonElement;

      cancelBtn.click();
      expect(host.cancelledCount).toBe(0);
    });
  });

  describe('Backdrop Click', () => {
    it('should emit cancelled when backdrop is clicked', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const backdrop = compiled.querySelector('.dialog-backdrop') as HTMLElement;

      backdrop.click();
      expect(host.cancelledCount).toBe(1);
    });

    it('should not emit cancelled when dialog panel is clicked', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const panel = compiled.querySelector('.dialog-panel') as HTMLElement;

      panel.click();
      expect(host.cancelledCount).toBe(0);
    });

    it('should not emit cancelled on backdrop click when processing', () => {
      host.processing.set(true);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const backdrop = compiled.querySelector('.dialog-backdrop') as HTMLElement;

      backdrop.click();
      expect(host.cancelledCount).toBe(0);
    });
  });

  describe('Escape Key', () => {
    it('should emit cancelled when Escape key is pressed', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const backdrop = compiled.querySelector('.dialog-backdrop') as HTMLElement;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      backdrop.dispatchEvent(event);
      expect(host.cancelledCount).toBe(1);
    });

    it('should not emit cancelled on Escape when processing', () => {
      host.processing.set(true);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const backdrop = compiled.querySelector('.dialog-backdrop') as HTMLElement;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      backdrop.dispatchEvent(event);
      expect(host.cancelledCount).toBe(0);
    });

    it('should not emit cancelled on other keys', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const backdrop = compiled.querySelector('.dialog-backdrop') as HTMLElement;

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      backdrop.dispatchEvent(event);
      expect(host.cancelledCount).toBe(0);
    });
  });

  describe('Processing State', () => {
    it('should disable confirm button when processing', () => {
      host.processing.set(true);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const confirmBtn = compiled.querySelector('.dialog-btn--confirm') as HTMLButtonElement;
      expect(confirmBtn.disabled).toBe(true);
    });

    it('should disable cancel button when processing', () => {
      host.processing.set(true);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement as HTMLElement;
      const cancelBtn = compiled.querySelector('.dialog-btn--cancel') as HTMLButtonElement;
      expect(cancelBtn.disabled).toBe(true);
    });

    it('should enable both buttons when not processing', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const confirmBtn = compiled.querySelector('.dialog-btn--confirm') as HTMLButtonElement;
      const cancelBtn = compiled.querySelector('.dialog-btn--cancel') as HTMLButtonElement;
      expect(confirmBtn.disabled).toBe(false);
      expect(cancelBtn.disabled).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have dialog role on backdrop', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const dialog = compiled.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('should have aria-modal set to true', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const dialog = compiled.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-label set to title', () => {
      const compiled = hostFixture.nativeElement as HTMLElement;
      const dialog = compiled.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('aria-label')).toBe('Delete Character');
    });
  });
});
