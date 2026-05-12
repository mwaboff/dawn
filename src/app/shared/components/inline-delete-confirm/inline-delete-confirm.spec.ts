import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { InlineDeleteConfirm } from './inline-delete-confirm';

@Component({
  template: `
    <app-inline-delete-confirm
      [itemLabel]="itemLabel()"
      [active]="active()"
      (requested)="requestedCalled = true"
      (confirmed)="confirmedCalled = true"
      (cancelled)="cancelledCalled = true"
    />
  `,
  imports: [InlineDeleteConfirm],
})
class TestHost {
  itemLabel = signal('Aragorn');
  active = signal(false);
  requestedCalled = false;
  confirmedCalled = false;
  cancelledCalled = false;
}

describe('InlineDeleteConfirm', () => {
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

  it('should create with itemLabel input', () => {
    expect(el.querySelector('app-inline-delete-confirm')).toBeTruthy();
  });

  describe('when active is false', () => {
    it('renders trash button', () => {
      expect(el.querySelector('.roster-delete-btn')).toBeTruthy();
    });

    it('trash button has correct aria-label', () => {
      const btn = el.querySelector('.roster-delete-btn') as HTMLButtonElement;
      expect(btn.getAttribute('aria-label')).toBe('Delete Aragorn');
    });

    it('does not render inline confirm', () => {
      expect(el.querySelector('.roster-inline-confirm')).toBeFalsy();
    });
  });

  describe('when active is true', () => {
    beforeEach(() => {
      host.active.set(true);
      fixture.detectChanges();
    });

    it('renders inline confirm with Delete? text', () => {
      expect(el.querySelector('.roster-inline-confirm')).toBeTruthy();
      expect(el.querySelector('.roster-inline-confirm-text')?.textContent?.trim()).toBe('Delete?');
    });

    it('renders Yes button', () => {
      expect(el.querySelector('.roster-inline-confirm-btn')?.textContent?.trim()).toBe('Yes');
    });

    it('renders No button', () => {
      expect(el.querySelector('.roster-inline-cancel-btn')?.textContent?.trim()).toBe('No');
    });

    it('does not render trash button', () => {
      expect(el.querySelector('.roster-delete-btn')).toBeFalsy();
    });
  });

  describe('trash button click', () => {
    it('emits requested', () => {
      const btn = el.querySelector('.roster-delete-btn') as HTMLButtonElement;
      btn.click();

      expect(host.requestedCalled).toBe(true);
    });

    it('calls stopPropagation', () => {
      const btn = el.querySelector('.roster-delete-btn') as HTMLButtonElement;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const spy = vi.spyOn(event, 'stopPropagation');
      btn.dispatchEvent(event);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Yes button click', () => {
    beforeEach(() => {
      host.active.set(true);
      fixture.detectChanges();
    });

    it('emits confirmed', () => {
      const btn = el.querySelector('.roster-inline-confirm-btn') as HTMLButtonElement;
      btn.click();

      expect(host.confirmedCalled).toBe(true);
    });

    it('calls stopPropagation', () => {
      const btn = el.querySelector('.roster-inline-confirm-btn') as HTMLButtonElement;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const spy = vi.spyOn(event, 'stopPropagation');
      btn.dispatchEvent(event);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('No button click', () => {
    beforeEach(() => {
      host.active.set(true);
      fixture.detectChanges();
    });

    it('emits cancelled', () => {
      const btn = el.querySelector('.roster-inline-cancel-btn') as HTMLButtonElement;
      btn.click();

      expect(host.cancelledCalled).toBe(true);
    });

    it('calls stopPropagation', () => {
      const btn = el.querySelector('.roster-inline-cancel-btn') as HTMLButtonElement;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const spy = vi.spyOn(event, 'stopPropagation');
      btn.dispatchEvent(event);

      expect(spy).toHaveBeenCalled();
    });
  });
});
