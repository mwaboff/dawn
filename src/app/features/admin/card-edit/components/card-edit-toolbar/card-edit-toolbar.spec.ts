import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CardEditToolbar } from './card-edit-toolbar';

@Component({
  template: `
    <app-card-edit-toolbar
      [hasPendingChanges]="hasPendingChanges()"
      [saving]="saving()"
      [deleting]="deleting()"
      [error]="error()"
      [saveSuccess]="saveSuccess()"
      (back)="backSpy()"
      (save)="saveSpy()"
      (deleteCard)="deleteSpy()" />
  `,
  imports: [CardEditToolbar],
})
class HostComponent {
  hasPendingChanges = signal(false);
  saving = signal(false);
  deleting = signal(false);
  error = signal<string | null>(null);
  saveSuccess = signal(false);
  backSpy = vi.fn();
  saveSpy = vi.fn();
  deleteSpy = vi.fn();
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

  describe('delete button', () => {
    it('renders the delete ghost button initially', () => {
      expect(el.querySelector('.btn--danger-ghost')).toBeTruthy();
      expect(el.querySelector('.delete-confirm')).toBeNull();
    });

    it('shows confirmation strip when delete is clicked', () => {
      const btn = el.querySelector<HTMLButtonElement>('.btn--danger-ghost')!;
      btn.click();
      fixture.detectChanges();
      expect(el.querySelector('.delete-confirm')).toBeTruthy();
      expect(el.querySelector('.delete-confirm-text')?.textContent?.trim()).toBe('Delete this card?');
    });

    it('hides confirmation strip when cancel is clicked', () => {
      el.querySelector<HTMLButtonElement>('.btn--danger-ghost')!.click();
      fixture.detectChanges();

      const cancelBtn = el.querySelectorAll<HTMLButtonElement>('.delete-confirm .btn--secondary')[0]!;
      cancelBtn.click();
      fixture.detectChanges();

      expect(el.querySelector('.delete-confirm')).toBeNull();
      expect(el.querySelector('.btn--danger-ghost')).toBeTruthy();
    });

    it('emits deleteCard and shows browser confirm on confirm click', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      el.querySelector<HTMLButtonElement>('.btn--danger-ghost')!.click();
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.btn--danger')!.click();
      fixture.detectChanges();

      expect(window.confirm).toHaveBeenCalled();
      expect(host.deleteSpy).toHaveBeenCalledTimes(1);
    });

    it('does not emit deleteCard when browser confirm is cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      el.querySelector<HTMLButtonElement>('.btn--danger-ghost')!.click();
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.btn--danger')!.click();
      fixture.detectChanges();

      expect(window.confirm).toHaveBeenCalled();
      expect(host.deleteSpy).not.toHaveBeenCalled();
    });

    it('shows "Deleting..." label when deleting is true', () => {
      el.querySelector<HTMLButtonElement>('.btn--danger-ghost')!.click();
      fixture.detectChanges();

      host.deleting.set(true);
      fixture.detectChanges();

      const confirmBtn = el.querySelector<HTMLButtonElement>('.btn--danger')!;
      expect(confirmBtn.textContent?.trim()).toBe('Deleting...');
      expect(confirmBtn.disabled).toBe(true);
    });

    it('is disabled when saving', () => {
      host.saving.set(true);
      fixture.detectChanges();
      const btn = el.querySelector<HTMLButtonElement>('.btn--danger-ghost')!;
      expect(btn.disabled).toBe(true);
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
