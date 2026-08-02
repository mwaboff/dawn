import {
  Directive,
  ElementRef,
  OnInit,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
  output,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Standard modal dialog focus behavior: traps Tab within the host, focuses the first
 * `[autofocus]` element (or the first focusable one) on init, returns focus to whatever was
 * focused before the modal opened on destroy, locks body scroll, and emits `escape` on Escape
 * for the host to decide what closing means (e.g. skip while a submit is in flight).
 *
 * Applied directly to the dialog's `role="dialog"` element so Tab/Escape handling only needs a
 * host-scoped `keydown` listener -- no document listener, no risk of firing across stacked modals.
 */
@Directive({
  selector: '[appModalFocus]',
  host: {
    '(keydown)': 'onKeydown($event)',
  },
})
export class ModalFocusDirective implements OnInit, AfterViewInit, OnDestroy {
  private readonly hostEl: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly escape = output<void>();

  private openerElement: HTMLElement | null = null;
  private previousBodyOverflow: string | null = null;

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.openerElement = document.activeElement as HTMLElement;
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.focusInitialElement();
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    document.body.style.overflow = this.previousBodyOverflow ?? '';
    this.openerElement?.focus();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.escape.emit();
      return;
    }
    if (event.key !== 'Tab') return;
    this.trapTab(event);
  }

  private focusInitialElement(): void {
    const target =
      this.hostEl.querySelector<HTMLElement>('[autofocus]') ??
      this.hostEl.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
    target?.focus();
  }

  private trapTab(event: KeyboardEvent): void {
    const focusable = Array.from(
      this.hostEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
