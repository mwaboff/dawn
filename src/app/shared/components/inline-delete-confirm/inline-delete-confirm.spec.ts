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

    it('renders inline confirm with the default Delete? text when no confirmText is supplied', () => {
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

  // Created directly (not through TestHost above) specifically so the confirmText input is never
  // bound in the two "default" tests -- an explicit `[confirmText]="undefined"` binding would
  // override the input's own default rather than falling through to it, which would make those
  // tests pass without actually proving the no-arg default every existing call site relies on.
  describe('confirmText', () => {
    let soloFixture: ComponentFixture<InlineDeleteConfirm>;

    function create(): void {
      soloFixture = TestBed.createComponent(InlineDeleteConfirm);
      soloFixture.componentRef.setInput('itemLabel', 'Pirate Ambush');
      soloFixture.componentRef.setInput('active', true);
    }

    it('defaults to "Delete?" when not supplied, matching every existing call site', () => {
      create();
      soloFixture.detectChanges();

      expect(soloFixture.nativeElement.querySelector('.roster-inline-confirm-text').textContent.trim()).toBe(
        'Delete?',
      );
    });

    // `.roster-inline-confirm` is `flex-shrink: 0` globally (`shared/styles/roster.css`) so it
    // never gets squeezed in a roster row -- correct for every existing caller's short "Delete?",
    // but it means a longer custom confirmText would silently overflow instead of wrapping,
    // confirmed by rendering the real compiled markup/CSS at the GM panel's ~300px floor (see the
    // team report for the screenshots). `.roster-inline-confirm--wrap` opts a custom-copy caller
    // into `flex-wrap: wrap` + `flex-shrink: 1` instead, scoped to this component's own stylesheet
    // so the global rule -- and every other call site -- is untouched. This only checks that the
    // class is wired to the right condition; the CSS declarations themselves aren't jsdom-visible
    // (same limitation as the global `stat-row.css` classes, see that spec's comment).
    it('does not add the wrap modifier for the default confirmText', () => {
      create();
      soloFixture.detectChanges();

      expect(
        soloFixture.nativeElement.querySelector('.roster-inline-confirm').classList.contains(
          'roster-inline-confirm--wrap',
        ),
      ).toBe(false);
    });

    it('adds the wrap modifier once a caller supplies custom confirmText', () => {
      create();
      soloFixture.componentRef.setInput('confirmText', "Deletes the saved encounter and this run's live state.");
      soloFixture.detectChanges();

      expect(
        soloFixture.nativeElement.querySelector('.roster-inline-confirm').classList.contains(
          'roster-inline-confirm--wrap',
        ),
      ).toBe(true);
    });

    it('renders caller-supplied copy instead, for a delete with consequences beyond the item itself', () => {
      create();
      soloFixture.componentRef.setInput(
        'confirmText',
        "Deletes the saved encounter and this run's live HP, Stress, tokens, and notes. This cannot be undone.",
      );
      soloFixture.detectChanges();

      expect(soloFixture.nativeElement.querySelector('.roster-inline-confirm-text').textContent.trim()).toBe(
        "Deletes the saved encounter and this run's live HP, Stress, tokens, and notes. This cannot be undone.",
      );
    });
  });
});
