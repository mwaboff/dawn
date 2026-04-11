import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CardEditToolbar } from './card-edit-toolbar';

@Component({
  template: `
    <app-card-edit-toolbar
      [hasPendingChanges]="hasPendingChanges()"
      [saving]="saving()"
      [error]="error()"
      [saveSuccess]="saveSuccess()"
      (back)="backSpy()"
      (save)="saveSpy()" />
  `,
  imports: [CardEditToolbar],
})
class HostComponent {
  hasPendingChanges = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  saveSuccess = signal(false);
  backSpy = vi.fn();
  saveSpy = vi.fn();
}

describe('CardEditToolbar', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the back button', () => {
    expect(el.querySelector('.btn--secondary')).toBeTruthy();
  });

  it('renders the save button', () => {
    expect(el.querySelector('.btn--primary')).toBeTruthy();
  });

  describe('back button', () => {
    it('emits back when clicked', () => {
      const btn = el.querySelector<HTMLButtonElement>('.btn--secondary')!;
      btn.click();
      expect(host.backSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('save button', () => {
    it('emits save when clicked and not disabled', () => {
      host.hasPendingChanges.set(true);
      fixture.detectChanges();
      const btn = el.querySelector<HTMLButtonElement>('.btn--primary')!;
      btn.click();
      expect(host.saveSpy).toHaveBeenCalledTimes(1);
    });

    it('is disabled when hasPendingChanges is false', () => {
      host.hasPendingChanges.set(false);
      fixture.detectChanges();
      const btn = el.querySelector<HTMLButtonElement>('.btn--primary')!;
      expect(btn.disabled).toBe(true);
    });

    it('is disabled when saving is true', () => {
      host.hasPendingChanges.set(true);
      host.saving.set(true);
      fixture.detectChanges();
      const btn = el.querySelector<HTMLButtonElement>('.btn--primary')!;
      expect(btn.disabled).toBe(true);
    });

    it('shows "Saving..." label when saving', () => {
      host.hasPendingChanges.set(true);
      host.saving.set(true);
      fixture.detectChanges();
      const btn = el.querySelector<HTMLButtonElement>('.btn--primary')!;
      expect(btn.textContent?.trim()).toBe('Saving...');
    });

    it('shows "Save Changes" label when not saving', () => {
      host.saving.set(false);
      fixture.detectChanges();
      const btn = el.querySelector<HTMLButtonElement>('.btn--primary')!;
      expect(btn.textContent?.trim()).toBe('Save Changes');
    });
  });

  describe('status messages', () => {
    it('shows save-success when saveSuccess is true', () => {
      host.saveSuccess.set(true);
      fixture.detectChanges();
      expect(el.querySelector('.save-success')).toBeTruthy();
    });

    it('does not show save-success when saveSuccess is false', () => {
      host.saveSuccess.set(false);
      fixture.detectChanges();
      expect(el.querySelector('.save-success')).toBeNull();
    });

    it('shows save-error with message when error is set', () => {
      host.error.set('Save failed');
      fixture.detectChanges();
      const span = el.querySelector('.save-error');
      expect(span).toBeTruthy();
      expect(span?.textContent?.trim()).toBe('Save failed');
    });

    it('does not show save-error when error is null', () => {
      host.error.set(null);
      fixture.detectChanges();
      expect(el.querySelector('.save-error')).toBeNull();
    });

    it('save-success has role alert', () => {
      host.saveSuccess.set(true);
      fixture.detectChanges();
      expect(el.querySelector('.save-success')?.getAttribute('role')).toBe('alert');
    });

    it('save-error has role alert', () => {
      host.error.set('Oops');
      fixture.detectChanges();
      expect(el.querySelector('.save-error')?.getAttribute('role')).toBe('alert');
    });
  });
});
